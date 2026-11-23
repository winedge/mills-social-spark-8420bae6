import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WifiSettings = {
  networkName: string;
  providerName: string;
  retentionDays: number;
  privacyEmail: string;
  marketingEnabled: boolean;
  welcomeText: string;
};

export const defaultWifiSettings: WifiSettings = {
  networkName: "Mills Guest",
  providerName: "",
  retentionDays: 30,
  privacyEmail: "info@millsmodernsocial.com",
  marketingEnabled: true,
  welcomeText: "Enter your email to get online. Marketing emails are optional and never required for Wi-Fi access.",
};

const path = "wifi/settings.json";

export async function loadWifiSettings(): Promise<WifiSettings> {
  const { data, error } = await supabase.storage.from("site-media").download(path);
  if (error || !data) return defaultWifiSettings;
  try {
    const raw = JSON.parse(await data.text()) as Partial<WifiSettings>;
    return {
      networkName: typeof raw.networkName === "string" ? raw.networkName : defaultWifiSettings.networkName,
      providerName: typeof raw.providerName === "string" ? raw.providerName : "",
      retentionDays: typeof raw.retentionDays === "number" && raw.retentionDays > 0 ? raw.retentionDays : defaultWifiSettings.retentionDays,
      privacyEmail: typeof raw.privacyEmail === "string" && raw.privacyEmail ? raw.privacyEmail : defaultWifiSettings.privacyEmail,
      marketingEnabled: typeof raw.marketingEnabled === "boolean" ? raw.marketingEnabled : true,
      welcomeText: typeof raw.welcomeText === "string" && raw.welcomeText ? raw.welcomeText : defaultWifiSettings.welcomeText,
    };
  } catch {
    return defaultWifiSettings;
  }
}

export async function saveWifiSettings(settings: WifiSettings) {
  const { error } = await supabase.storage.from("site-media").upload(path, new Blob([JSON.stringify(settings)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw error;
}

export function useWifiSettings() {
  const [settings, setSettings] = useState<WifiSettings>(defaultWifiSettings);
  useEffect(() => {
    let alive = true;
    loadWifiSettings().then((s) => { if (alive) setSettings(s); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return settings;
}
