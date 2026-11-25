import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { canAuthorizeVenueIp, guestSignInSchema } from "./unifi-guest";
import { parseAllowedIps } from "./wifi-network";

export const getGuestPortalStatus = createServerFn({ method: "GET" }).handler(async () => {
  // Privileged read is intentional: expose only an operational boolean from
  // the private config, never console IDs, provider responses or credentials.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("wifi_unifi_config").select("access_enabled,privacy_reviewed,last_test_ok").eq("id", 1).maybeSingle();
  return { ready: !!(data?.access_enabled && data.privacy_reviewed && data.last_test_ok) };
});

export const signInGuestWifi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => guestSignInSchema.parse(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new Error("Reopen the restaurant Wi-Fi sign-in page.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: config, error } = await supabaseAdmin.from("wifi_unifi_config").select("*").eq("id", 1).maybeSingle();
    if (error || !config?.access_enabled || !config.privacy_reviewed || !config.last_test_ok || !config.api_key_encrypted || !config.site_id) {
      throw new Error("Guest Wi-Fi setup is not complete. Your details were not saved. Please ask a Mills team member.");
    }
    const { data: settings } = await supabaseAdmin.storage.from("site-media").download("wifi/settings.json");
    if (!settings) throw new Error("Restaurant network verification is not configured.");
    const raw: unknown = JSON.parse(await settings.text());
    const ips = raw && typeof raw === "object" && "allowedIps" in raw && typeof raw.allowedIps === "string" ? parseAllowedIps(raw.allowedIps) : [];
    // Published hosting sets this header. Never trust browser-supplied forwarding
    // headers for authorization; dev/private forwarding headers cannot grant access.
    if (!canAuthorizeVenueIp(request.headers.get("cf-connecting-ip"), ips)) throw new Error("Connect to the restaurant guest Wi-Fi before signing in.");
    const secret = process.env["WIFI_CONFIG_ENCRYPTION_KEY"];
    if (!secret) throw new Error("Guest access is temporarily unavailable.");
    const { decryptUnifiKey } = await import("./unifi-crypto.server");
    const { authorizeConnectedGuest } = await import("./unifi-guest.server");
    try {
      // Names/email are validated transiently but never saved, logged or sent to
      // UniFi. Marketing stays disabled until a separate consent system exists.
      return await authorizeConnectedGuest({ consoleId: config.console_id, siteId: config.site_id,
        apiKey: await decryptUnifiKey(config.api_key_encrypted, secret), mac: data.mac, ap: data.ap, sessionMinutes: config.session_minutes });
    } catch {
      throw new Error("Your guest device or internet access could not be confirmed. Rejoin the Mills guest network or ask a team member.");
    }
  });