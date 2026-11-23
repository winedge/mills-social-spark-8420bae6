import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { isOnVenueNetwork, parseAllowedIps } from "./wifi-network";

function clientIp(): string | null {
  const h = getRequest().headers;
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export const checkWifiAccess = createServerFn({ method: "GET" }).handler(async () => {
  const ip = clientIp();
  let allowed: string[] = [];
  try {
    const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!, { auth: { persistSession: false } });
    const { data } = await sb.storage.from("site-media").download("wifi/settings.json");
    if (data) {
      const raw = JSON.parse(await data.text()) as { allowedIps?: unknown };
      if (typeof raw.allowedIps === "string") allowed = parseAllowedIps(raw.allowedIps);
    }
  } catch {
    // fall through: unreadable settings keep the check inactive
  }
  return { active: allowed.length > 0, allowed: isOnVenueNetwork(ip, allowed) };
});

/** Admin helper: shows the internet address the admin is currently using. */
export const getMyIp = createServerFn({ method: "GET" }).handler(async () => ({ ip: clientIp() }));
