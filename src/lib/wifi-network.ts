/** Pure helpers for the venue Wi-Fi network check (shared by server and tests). */
export function normalizeIp(ip: string): string {
  return ip.trim().replace(/^::ffff:/i, "").toLowerCase();
}

export function parseAllowedIps(text: string): string[] {
  return text.split(/[\s,]+/).map(normalizeIp).filter(Boolean);
}

/** No addresses configured means the check is not active yet. */
export function isOnVenueNetwork(clientIp: string | null, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  if (!clientIp) return false;
  const ip = normalizeIp(clientIp);
  return allowed.some((a) => {
    const entry = normalizeIp(a);
    if (entry.endsWith("*")) return ip.startsWith(entry.slice(0, -1));
    return ip === entry;
  });
}
