/** Accepts UniFi client MACs like aa:bb:cc:dd:ee:ff or aa-bb-...; returns lowercase colon form or null. */
export function normalizeMac(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const hex = input.trim().toLowerCase().replace(/[^0-9a-f]/g, "");
  if (hex.length !== 12 || !/^[0-9a-f:\-]+$/.test(input.trim().toLowerCase())) return null;
  return hex.match(/.{2}/g)!.join(":");
}
