import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminUnifiSettings } from "@/components/admin-unifi-settings";
import { getMyIp } from "@/lib/wifi-access.functions";
import { loadWifiSettings, saveWifiSettings, type WifiSettings } from "@/lib/wifi-settings";

const field = "h-11 w-full border border-border bg-background px-3 text-sm";

export function AdminWifiSection() {
  const [s, setS] = useState<WifiSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { loadWifiSettings().then(setS); }, []);
  if (!s) return <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await saveWifiSettings(s); setMsg("Saved — the Wi-Fi page is updated."); }
    catch (err) { setMsg(err instanceof Error ? err.message : "Couldn't save."); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
    <form onSubmit={save} className="max-w-2xl space-y-4 border border-border bg-surface/40 p-6">
      <p className="text-sm text-muted-foreground">These details appear on the guest Wi-Fi page (/wifi) and its privacy notice.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm"><span>Network name (SSID)</span>
          <input className={field} value={s.networkName} onChange={(e) => setS({ ...s, networkName: e.target.value })} /></label>
        <label className="space-y-1 text-sm"><span>Wi-Fi provider</span>
          <input className={field} placeholder="Ubiquiti / UniFi" value={s.providerName} onChange={(e) => setS({ ...s, providerName: e.target.value })} /></label>
        <label className="space-y-1 text-sm"><span>Keep guest data for (days)</span>
          <input type="number" min={1} max={730} className={field} value={s.retentionDays} onChange={(e) => setS({ ...s, retentionDays: Math.max(1, Number(e.target.value) || 1) })} /></label>
        <label className="space-y-1 text-sm"><span>Privacy contact email</span>
          <input type="email" className={field} value={s.privacyEmail} onChange={(e) => setS({ ...s, privacyEmail: e.target.value })} /></label>
      </div>
      <label className="block space-y-1 text-sm"><span>Welcome text</span>
        <textarea rows={3} className="w-full border border-border bg-background p-3 text-sm" value={s.welcomeText} onChange={(e) => setS({ ...s, welcomeText: e.target.value })} /></label>
      <div className="space-y-2 border border-border p-4 text-sm">
        <p className="font-semibold">Restaurant network check</p>
        <p className="text-muted-foreground">Only guests connected through these internet addresses can sign in. Leave empty to turn the check off. Tip: while on the restaurant Wi-Fi, press the button to add its address.</p>
        <textarea rows={2} placeholder="e.g. 203.0.113.7" className="w-full border border-border bg-background p-3 text-sm" value={s.allowedIps} onChange={(e) => setS({ ...s, allowedIps: e.target.value })} />
        <Button type="button" variant="outline" size="sm" onClick={async () => { const { ip } = await getMyIp(); if (ip && !s.allowedIps.includes(ip)) setS({ ...s, allowedIps: [s.allowedIps.trim(), ip].filter(Boolean).join(", ") }); }}>Add the network I'm on now</Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={s.marketingEnabled} onChange={(e) => setS({ ...s, marketingEnabled: e.target.checked })} />
        Show optional marketing email checkbox (always unticked for guests)
      </label>
      {msg && <p className="font-mono text-[11px] uppercase tracking-widest text-accent">{msg}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Wi-Fi settings"}</Button>
    </form>
    <AdminUnifiSettings />
    </div>
  );
}
