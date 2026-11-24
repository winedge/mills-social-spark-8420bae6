import { z } from "zod";

export const unifiConfigSchema = z.object({
  consoleId: z.string().trim().max(200).regex(/^[A-Za-z0-9_-]*$/, "Enter the console ID, not a URL."),
  siteId: z.union([z.literal(""), z.uuid()]),
  sessionMinutes: z.number().int().min(15).max(1440),
  apiKey: z.string().trim().max(4096).default(""),
  removeKey: z.boolean().default(false),
}).refine((s) => !s.apiKey || !!s.consoleId, "Enter a console ID before saving an API key.");

export type UnifiConfigInput = z.input<typeof unifiConfigSchema>;
export type UnifiConfigView = {
  consoleId: string;
  siteId: string;
  sessionMinutes: number;
  hasApiKey: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean;
};

export const defaultUnifiConfig: UnifiConfigView = {
  consoleId: "", siteId: "", sessionMinutes: 240,
  hasApiKey: false, lastTestAt: null, lastTestOk: false,
};

// Fixed vendor origin: an admin-supplied ID can never redirect credentials to another host.
export function unifiSitesUrl(consoleId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(consoleId)) throw new Error("Enter a valid UniFi console ID.");
  return `https://api.ui.com/v1/connector/consoles/${encodeURIComponent(consoleId)}/network/integration/v1/sites?limit=200`;
}

export function unifiPublicView(row: {
  console_id: string; site_id: string; session_minutes: number;
  api_key_encrypted: string; last_test_at: string | null; last_test_ok: boolean;
}): UnifiConfigView {
  return {
    consoleId: row.console_id, siteId: row.site_id, sessionMinutes: row.session_minutes,
    hasApiKey: !!row.api_key_encrypted, lastTestAt: row.last_test_at, lastTestOk: row.last_test_ok,
  };
}