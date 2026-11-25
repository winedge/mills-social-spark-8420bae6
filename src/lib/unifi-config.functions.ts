import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultUnifiConfig, unifiConfigSchema, unifiPublicView, unifiSitesUrl } from "./unifi-config";

export const getUnifiConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !allowed) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("wifi_unifi_config").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error("Couldn't load UniFi settings.");
    return data ? unifiPublicView(data) : defaultUnifiConfig;
  });

export const saveUnifiConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => unifiConfigSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !allowed) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: previous, error: readError } = await supabaseAdmin.from("wifi_unifi_config").select("*").eq("id", 1).maybeSingle();
    if (readError) throw new Error("Couldn't load existing UniFi settings.");
    let encrypted = previous?.api_key_encrypted ?? "";
    if (data.removeKey) encrypted = "";
    else if (data.apiKey) {
      const secret = process.env["WIFI_CONFIG_ENCRYPTION_KEY"];
      if (!secret) throw new Error("Secure credential storage is unavailable. Please try again later.");
      const { encryptUnifiKey } = await import("./unifi-crypto.server");
      encrypted = await encryptUnifiKey(data.apiKey, secret);
    }
    const connectionChanged = previous?.console_id !== data.consoleId || previous?.site_id !== data.siteId || !!data.apiKey || data.removeKey;
    if (data.accessEnabled) {
      if (connectionChanged || !previous?.last_test_ok || !data.siteId || !encrypted || !data.privacyReviewed) {
        throw new Error("Save and test the restaurant site, then complete the privacy review before enabling guest access.");
      }
      const { data: settings } = await supabaseAdmin.storage.from("site-media").download("wifi/settings.json");
      const raw: unknown = settings ? JSON.parse(await settings.text()) : null;
      const ips = raw && typeof raw === "object" && "allowedIps" in raw && typeof raw.allowedIps === "string" ? raw.allowedIps.trim() : "";
      if (!ips || ips.includes("*")) throw new Error("Save the restaurant's exact public internet address in Guest Wi-Fi first.");
    }
    const { data: saved, error } = await supabaseAdmin.from("wifi_unifi_config").upsert({
      id: 1, console_id: data.consoleId, site_id: data.siteId, session_minutes: data.sessionMinutes,
      api_key_encrypted: encrypted,
      access_enabled: data.accessEnabled, privacy_reviewed: data.privacyReviewed,
      last_test_at: connectionChanged ? null : previous?.last_test_at ?? null,
      last_test_ok: connectionChanged ? false : previous?.last_test_ok ?? false,
      updated_at: new Date().toISOString(),
    }).select("*").single();
    if (error || !saved) throw new Error("Couldn't save UniFi settings.");
    return unifiPublicView(saved);
  });

export const testUnifiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !allowed) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: config, error } = await supabaseAdmin.from("wifi_unifi_config").select("*").eq("id", 1).maybeSingle();
    if (error || !config?.console_id || !config.api_key_encrypted) throw new Error("Save your console ID and API key first.");
    const secret = process.env["WIFI_CONFIG_ENCRYPTION_KEY"];
    if (!secret) throw new Error("Secure credential storage is unavailable.");
    let message = "Unable to reach UniFi. Check remote access, console compatibility and your API key.";
    let sites: { id: string; name: string }[] = [];
    let ok = false;
    try {
      const { decryptUnifiKey } = await import("./unifi-crypto.server");
      const apiKey = await decryptUnifiKey(config.api_key_encrypted, secret);
      const response = await fetch(unifiSitesUrl(config.console_id), {
        headers: { "X-API-Key": apiKey, Accept: "application/json" },
        redirect: "manual", signal: AbortSignal.timeout(12000),
      });
      if (response.ok) {
        const raw: unknown = await response.json();
        if (raw && typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) {
          sites = raw.data.flatMap((s: unknown) => {
            if (!s || typeof s !== "object" || !("id" in s) || typeof s.id !== "string" || !/^[0-9a-f-]{36}$/i.test(s.id)) return [];
            return [{ id: s.id, name: "name" in s && typeof s.name === "string" ? s.name : s.id }];
          });
          ok = sites.length > 0 && (!config.site_id || sites.some((s) => s.id === config.site_id));
          message = ok ? "UniFi is reachable. Select your restaurant site, save and test again before enabling guest access. This test does not authorize devices." : "No matching site found. Check the site ID and API key permissions.";
        }
      } else if (response.status === 401 || response.status === 403) {
        message = "UniFi rejected access. Check your API key and console permissions.";
      } else if (response.status === 404) {
        message = "Console not found or remote API unavailable. Check the console ID and UniFi updates.";
      } else if (response.status === 429) {
        message = "UniFi has temporarily limited requests. Please try again later.";
      }
    } catch {
      // Never log provider responses or errors containing credentials.
    }
    const testedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin.from("wifi_unifi_config")
      .update({ last_test_at: testedAt, last_test_ok: ok, ...(!ok ? { access_enabled: false } : {}) }).eq("id", 1).eq("updated_at", config.updated_at);
    if (updateError) throw new Error("Couldn't save the connection test result.");
    return { ok, message, sites, testedAt };
  });