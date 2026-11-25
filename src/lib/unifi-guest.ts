import { z } from "zod";
import { unifiBaseUrl } from "./unifi-config";

export const macAddressSchema = z.string().regex(/^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i).transform((s) => s.toLowerCase());
export const guestSignInSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(254),
  mac: macAddressSchema,
  ap: macAddressSchema,
});

export const connectedGuestSchema = z.object({
  id: z.uuid(), type: z.literal("WIRELESS"), macAddress: macAddressSchema,
  uplinkDeviceId: z.uuid(), access: z.object({ type: z.literal("GUEST"), authorized: z.boolean() }),
});

export function unifiSiteUrl(consoleId: string, siteId: string) {
  return `${unifiBaseUrl(consoleId)}/sites/${z.uuid().parse(siteId)}`;
}

// A configured exact venue address is mandatory for authorization, even though
// the earlier informational network check can be inactive before configuration.
export function canAuthorizeVenueIp(ip: string | null, addresses: string[]) {
  if (!ip || !addresses.length) return false;
  const normalize = (s: string) => s.trim().replace(/^::ffff:/i, "").toLowerCase();
  return addresses.some((s) => !s.includes("*") && normalize(s) === normalize(ip));
}