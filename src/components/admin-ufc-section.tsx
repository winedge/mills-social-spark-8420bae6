import { useEffect, useState, useCallback } from "react";
import { Loader2, Tv, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUfcFights, type UfcEvent } from "@/lib/ufc.functions";

function fmt(iso: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function AdminUfcSection() {
  const [events, setEvents] = useState<UfcEvent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [configured, setConfigured] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [feed, sel] = await Promise.all([
      getUfcFights(),
      supabase.from("ufc_streamed_events").select("event_id"),
    ]);
    setConfigured(feed.configured);
    setEvents([...(feed.live ?? []), ...(feed.upcoming ?? []), ...(feed.recent ?? [])]);
    setSelected(new Set(((sel.data ?? []) as { event_id: number }[]).map((r) => Number(r.event_id))));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (evt: UfcEvent, on: boolean) => {
    setSaving(evt.eventId);
    if (on) {
      const { error } = await supabase.from("ufc_streamed_events").upsert(
        { event_id: evt.eventId, name: evt.name, date_time: evt.dateTime },
        { onConflict: "event_id" },
      );
      if (error) alert(error.message);
      else setSelected((s) => new Set(s).add(evt.eventId));
    } else {
      const { error } = await supabase.from("ufc_streamed_events").delete().eq("event_id", evt.eventId);
      if (error) alert(error.message);
      else setSelected((s) => { const n = new Set(s); n.delete(evt.eventId); return n; });
    }
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          Pick the fight nights you'll be streaming. Only selected events appear in the UFC section on the website.
        </p>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 h-10 border border-border text-xs font-bold uppercase tracking-widest hover:border-accent">
          <RefreshCw className="size-3.5" /> Refresh feed
        </button>
      </div>

      {!configured && (
        <div className="border border-accent/40 bg-accent/5 p-4 font-mono text-xs text-muted-foreground">
          UFC feed not configured - add the SportsDataIO MMA API key to load events.
        </div>
      )}

      {loading ? (
        <div className="p-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>
      ) : events.length === 0 ? (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground">No events on the feed right now.</div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Event</th>
                <th className="text-left px-4 py-3">Main event</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">When</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Streaming</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const on = selected.has(e.eventId);
                return (
                  <tr key={e.eventId} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {e.mainEvent?.fighterA?.name ?? "TBD"} vs {e.mainEvent?.fighterB?.name ?? "TBD"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">{fmt(e.dateTime)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${e.live ? "text-red-500" : "text-muted-foreground"}`}>
                        {e.live ? "Live" : e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={saving === e.eventId}
                        onClick={() => toggle(e, !on)}
                        className={`inline-flex items-center gap-2 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                          on ? "bg-accent text-primary-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"
                        }`}
                      >
                        {saving === e.eventId ? <Loader2 className="size-3 animate-spin" /> : <Tv className="size-3" />}
                        {on ? "Streaming" : "Not streaming"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
