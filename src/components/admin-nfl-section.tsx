import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Tv, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getNflGames, type NflGame } from "@/lib/nfl.functions";
import { formatKickoff } from "@/components/nfl-section";

export function AdminNflSection() {
  const [games, setGames] = useState<NflGame[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [feed, sel] = await Promise.all([
      getNflGames(),
      (supabase as any).from("nfl_streamed_games").select("game_id"),
    ]);
    setConfigured(feed.configured);
    setError(feed.error ?? null);
    setGames([...feed.live, ...feed.upcoming, ...feed.recent]);
    setSelected(new Set(((sel.data ?? []) as { game_id: number }[]).map((r) => Number(r.game_id))));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (g: NflGame, on: boolean) => {
    setSaving(g.gameId);
    if (on) {
      const { error: e } = await (supabase as any).from("nfl_streamed_games").upsert(
        {
          game_id: g.gameId,
          label: `${g.awayTeam} @ ${g.homeTeam}`,
          date_time: g.dateTime,
        },
        { onConflict: "game_id" },
      );
      if (e) alert(e.message);
      else setSelected((s) => new Set(s).add(g.gameId));
    } else {
      const { error: e } = await (supabase as any)
        .from("nfl_streamed_games")
        .delete()
        .eq("game_id", g.gameId);
      if (e) alert(e.message);
      else
        setSelected((s) => {
          const n = new Set(s);
          n.delete(g.gameId);
          return n;
        });
    }
    setSaving(null);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return games.filter((g) => {
      if (onlySelected && !selected.has(g.gameId)) return false;
      if (!term) return true;
      return `${g.awayTeam} ${g.homeTeam} week ${g.week ?? ""}`.toLowerCase().includes(term);
    });
  }, [games, q, onlySelected, selected]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          Pick the 2026 NFL games you'll be showing. Only selected games appear on the website scoreboard,
          with live scores updating automatically.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 h-10 border border-border text-xs font-bold uppercase tracking-widest hover:border-accent"
        >
          <RefreshCw className="size-3.5" /> Refresh feed
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team or week…"
            className="w-full h-10 pl-9 pr-3 bg-background border border-border text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={() => setOnlySelected((v) => !v)}
          className={`px-4 h-10 border text-[10px] font-bold uppercase tracking-widest ${
            onlySelected ? "bg-accent text-primary-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"
          }`}
        >
          Streaming only ({selected.size})
        </button>
      </div>

      {!configured && (
        <div className="border border-accent/40 bg-accent/5 p-4 font-mono text-xs text-muted-foreground">
          NFL feed not configured - add the SportsDataIO NFL API key to load games.
        </div>
      )}
      {error && (
        <div className="border border-red-500/40 bg-red-500/5 p-4 font-mono text-xs text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="p-10 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground">
          No games match right now.
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Week</th>
                <th className="text-left px-4 py-3">Matchup</th>
                <th className="text-left px-4 py-3">Kickoff</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Showing</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const on = selected.has(g.gameId);
                return (
                  <tr key={g.gameId} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{g.week ?? "-"}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {g.awayTeam} @ {g.homeTeam}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatKickoff(g.dateTime)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                      {g.live || g.final ? `${g.awayScore ?? 0} – ${g.homeScore ?? 0}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-widest ${
                          g.live ? "text-red-500" : "text-muted-foreground"
                        }`}
                      >
                        {g.live ? "Live" : g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={saving === g.gameId}
                        onClick={() => toggle(g, !on)}
                        className={`inline-flex items-center gap-2 px-3 h-8 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                          on
                            ? "bg-accent text-primary-foreground border-accent"
                            : "border-border text-muted-foreground hover:border-accent"
                        }`}
                      >
                        {saving === g.gameId ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Tv className="size-3" />
                        )}
                        {on ? "Showing" : "Not showing"}
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
