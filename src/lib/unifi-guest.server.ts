import { z } from "zod";
import { connectedGuestSchema, macAddressSchema, unifiSiteUrl } from "./unifi-guest";

export async function authorizeConnectedGuest(options: {
  consoleId: string; siteId: string; apiKey: string; mac: string; ap: string; sessionMinutes: number;
}, request: typeof fetch = fetch) {
  const site = unifiSiteUrl(options.consoleId, options.siteId);
  const headers = { "X-API-Key": options.apiKey, Accept: "application/json" };
  const call = async (url: string, init: RequestInit = {}) => {
    const response = await request(url, { ...init, headers: { ...headers, ...init.headers }, redirect: "manual", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("UniFi could not confirm access. Please ask a Mills team member.");
    return response.json() as Promise<unknown>;
  };
  const query = new URLSearchParams({ limit: "2", filter: `macAddress.eq('${macAddressSchema.parse(options.mac)}')` });
  const page = z.object({ data: z.array(z.unknown()) }).parse(await call(`${site}/clients?${query}`));
  if (page.data.length !== 1) throw new Error("Join the restaurant guest Wi-Fi and reopen its sign-in page.");
  const guest = connectedGuestSchema.parse(page.data[0]);
  if (guest.macAddress !== options.mac.toLowerCase()) throw new Error("Guest device could not be verified.");
  // Redirect query parameters are not proof. Verify this is a currently connected
  // wireless GUEST on the selected site and its actual access point matches.
  const device = z.object({ macAddress: macAddressSchema }).parse(await call(`${site}/devices/${guest.uplinkDeviceId}`));
  if (device.macAddress !== options.ap.toLowerCase()) throw new Error("Restaurant access point could not be verified.");
  if (!guest.access.authorized) {
    await call(`${site}/clients/${guest.id}/actions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "AUTHORIZE_GUEST_ACCESS", timeLimitMinutes: options.sessionMinutes }),
    });
  }
  const confirmed = connectedGuestSchema.parse(await call(`${site}/clients/${guest.id}`));
  if (!confirmed.access.authorized || confirmed.macAddress !== guest.macAddress) throw new Error("Internet access is not confirmed yet. Please try again.");
  return { connected: true as const };
}