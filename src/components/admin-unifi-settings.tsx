import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, KeyRound, Loader2, Radio, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getUnifiConfig, saveUnifiConfig, testUnifiConnection } from "@/lib/unifi-config.functions";
import type { UnifiConfigView } from "@/lib/unifi-config";

const field = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const portalUrl = "https://mills-social-spark.lovable.app/wifi";

export function AdminUnifiSettings() {
  const load = useServerFn(getUnifiConfig);
  const save = useServerFn(saveUnifiConfig);
  const test = useServerFn(testUnifiConnection);
  const [config, setConfig] = useState<UnifiConfigView | null>(null);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let alive = true;
    load().then((s) => { if (alive) setConfig(s); }).catch(() => { if (alive) setMessage("Couldn't load UniFi settings. Reload this page to try again."); });
    return () => { alive = false; };
  }, [load]);

  const update = (values: Partial<UnifiConfigView>) => {
    if (!config) return;
    setConfig({ ...config, ...values }); setDirty(true); setMessage("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!config) return;
    setBusy(true); setMessage("");
    try {
      const saved = await save({ data: { consoleId: config.consoleId, siteId: config.siteId, sessionMinutes: config.sessionMinutes, apiKey: key, accessEnabled: config.accessEnabled, privacyReviewed: config.privacyReviewed } });
      setConfig(saved);
      setKey(""); setDirty(false); setMessage(saved.accessEnabled ? "UniFi settings saved. Guest sign-in is enabled; verify internet access on the restaurant Wi-Fi." : "UniFi settings saved. Guest access is inactive.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Couldn't save UniFi settings. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="unifi-settings-title" className="max-w-2xl space-y-5 border-t border-border pt-6">
      <div className="flex items-start gap-3">
        <Radio className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <h2 id="unifi-settings-title" className="text-xl font-semibold">UniFi guest Wi-Fi connection</h2>
          <p className="mt-1 text-sm text-muted-foreground">Internet: Spectrum · Wi-Fi equipment: Ubiquiti / UniFi</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-accent" />
        {config?.accessEnabled ? "Guest sign-in enabled" : "Guest access inactive"}{config?.lastTestOk ? " · Last connection test passed" : " · Connection not verified"}
      </div>
      {!config && !message && <Loader2 className="size-5 animate-spin text-accent" aria-label="Loading UniFi settings" />}
      {config && <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-2 text-sm"><span>UniFi console ID</span>
          <input className={field} autoComplete="off" value={config.consoleId} maxLength={200} placeholder="Console ID from your UniFi Site Manager URL" onChange={(e) => { update({ consoleId: e.target.value, accessEnabled: false }); setSites([]); }} />
        </label>
        <p className="text-xs leading-5 text-muted-foreground">Open your console at unifi.ui.com. Copy the ID following /consoles/ in its address. Remote Management and the UniFi Connector must be supported and enabled; a local address such as 192.168.1.1 cannot be reached by this website.</p>
        <label className="block space-y-2 text-sm"><span className="flex items-center gap-2"><KeyRound className="size-4" />UniFi API key</span>
          <input type="password" autoComplete="new-password" className={field} value={key} placeholder={config.hasApiKey ? "Key saved — leave blank to keep it" : "Paste your UniFi API key"} onChange={(e) => { setKey(e.target.value); update({ accessEnabled: false }); }} />
        </label>
        <p className="text-xs leading-5 text-muted-foreground">Create a key for the console owner’s account in UniFi Site Manager. It is encrypted when saved and never displayed again. The connection test only reads the list of sites; it does not authorize devices or collect guest details.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm"><span>Restaurant site ID</span>
            {sites.length > 0 ? <select className={field} value={config.siteId} onChange={(e) => update({ siteId: e.target.value, accessEnabled: false })}>
              <option value="">Select restaurant site</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select> : <input className={field} value={config.siteId} placeholder="Test connection to find your site" onChange={(e) => update({ siteId: e.target.value, accessEnabled: false })} />}
          </label>
          <label className="block space-y-2 text-sm"><span>Guest session length (minutes)</span>
            <input type="number" min={15} max={1440} required className={field} value={config.sessionMinutes} onChange={(e) => update({ sessionMinutes: Number(e.target.value) })} />
          </label>
        </div>
        <div className="space-y-3 border-t border-border pt-4 text-sm">
          <h3 className="font-semibold">Privacy and activation</h3>
          <p className="leading-6 text-muted-foreground">Guest names and email are checked for this session only, never saved or sent to UniFi. Marketing collection is disabled. UniFi receives device identifiers to grant access; review its logs, deletion settings, service agreements and international transfers separately.</p>
          <label className="flex items-start gap-3"><Checkbox checked={config.privacyReviewed} onCheckedChange={(checked) => update({ privacyReviewed: checked === true, ...(checked !== true ? { accessEnabled: false } : {}) })} /><span>I have reviewed the privacy contact, UniFi retention/deletion settings, required provider agreements and transfer safeguards.</span></label>
          <label className="flex items-start gap-3"><Checkbox checked={config.accessEnabled} disabled={!config.lastTestOk || !config.siteId || !config.hasApiKey || !config.privacyReviewed} onCheckedChange={(checked) => update({ accessEnabled: checked === true })} /><span>Enable guest sign-in after a successful site test and restaurant network configuration.</span></label>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}><Save className="size-4" />{busy ? "Please wait…" : "Save UniFi configuration"}</Button>
          <Button type="button" variant="outline" disabled={busy || dirty || !config.hasApiKey || !config.consoleId} onClick={async () => {
            setBusy(true); setMessage("");
            try {
              const result = await test(); setSites(result.sites); setMessage(result.message);
              setConfig((s) => s ? { ...s, lastTestAt: result.testedAt, lastTestOk: result.ok, accessEnabled: result.ok && s.accessEnabled } : s);
            } catch { setMessage("Couldn't test the connection. Save your settings and check the UniFi key and remote access."); }
            finally { setBusy(false); }
          }}><Radio className="size-4" />Test connection</Button>
          {config.hasApiKey && <Button type="button" variant="ghost" disabled={busy} onClick={async () => {
            if (!window.confirm("Remove the saved UniFi API key?")) return;
            setBusy(true);
            try {
              setConfig(await save({ data: { consoleId: config.consoleId, siteId: config.siteId, sessionMinutes: config.sessionMinutes, removeKey: true, privacyReviewed: config.privacyReviewed } }));
              setKey(""); setDirty(false); setSites([]); setMessage("Saved API key removed.");
            } catch { setMessage("Couldn't remove the API key. Please try again."); }
            finally { setBusy(false); }
          }}><Trash2 className="size-4" />Remove key</Button>}
        </div>
        {dirty && <p className="text-xs text-muted-foreground">Save changes before testing the connection.</p>}
      </form>}
      {message && <p role="status" className="text-sm text-accent">{message}</p>}
      <div className="space-y-3 border-t border-border pt-5 text-sm">
        <h3 className="font-semibold">External portal setup</h3>
        <div className="flex min-w-0 items-center gap-2">
          <input aria-label="Guest portal URL" readOnly className={`${field} min-w-0`} value={portalUrl} />
          <Button type="button" variant="outline" size="icon" title="Copy guest portal URL" aria-label="Copy guest portal URL" onClick={async () => {
            try { await navigator.clipboard.writeText(portalUrl); setMessage("Guest portal URL copied."); }
            catch { setMessage("Select and copy the guest portal URL above."); }
          }}><Copy className="size-4" /></Button>
        </div>
        <ol className="list-decimal space-y-2 pl-5 leading-6 text-muted-foreground">
          <li>Update UniFi Network and your console, then enable remote access. Save the console ID and API key above.</li>
          <li>Test the connection, select the restaurant site and save again.</li>
          <li>In UniFi, select the guest network, enable Hotspot / Captive Portal and select an external portal. Use the guest portal URL above; allow this website and its required media domains before authorization.</li>
          <li>Under Guest Wi-Fi, save your guest network name and the restaurant’s exact public internet address while connected to its Wi-Fi. Wildcard addresses cannot enable guest access.</li>
          <li>Review the privacy requirements above, then enable guest sign-in and save. Test on a new guest device: no internet before submitting, internet after submitting, and blocked access from another network.</li>
        </ol>
        <a className="inline-flex items-center gap-2 text-accent underline underline-offset-4" href="https://help.ui.com/hc/en-us/articles/31228198640023-External-Hotspot-API-for-Authorization-Clients" target="_blank" rel="noopener noreferrer"><Check className="size-4" />Ubiquiti’s external portal requirements</a>
      </div>
    </section>
  );
}