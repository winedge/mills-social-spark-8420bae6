import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getNflGames, type NflGame } from "@/lib/nfl.functions";

export const nflQueryOptions = queryOptions({
  queryKey: ["nfl", "games"],
  queryFn: () => getNflGames(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
});

const streamedNflQueryOptions = queryOptions({
  queryKey: ["nfl", "streamed"],
  queryFn: async () => {
    const { data } = await (supabase as any).from("nfl_streamed_games").select("game_id");
    return ((data ?? []) as { game_id: number }[]).map((r) => Number(r.game_id));
  },
  staleTime: 60_000,
});

export function formatKickoff(iso: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return "TBD";
  return d
    .toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase();
}

function statusLabel(g: NflGame) {
  if (g.live) return "LIVE";
  if (g.final) return "FINAL";
  return g.week ? `WEEK ${g.week}` : "SCHEDULED";
}

function detailLine(g: NflGame) {
  if (g.live) {
    return [g.quarter ? `${g.quarter} QTR` : null, g.timeRemaining].filter(Boolean).join(" · ") || "IN PROGRESS";
  }
  if (g.final) return "FINAL";
  return `KICKOFF ${formatKickoff(g.dateTime)}${g.channel ? ` · ${g.channel}` : ""}`;
}

const ESPN_ABBR: Record<string, string> = {
  WAS: "wsh",
  LAR: "lar",
  LAC: "lac",
  LV: "lv",
  JAX: "jax",
  NO: "no",
  NE: "ne",
  SF: "sf",
  TB: "tb",
  GB: "gb",
  KC: "kc",
  NYG: "nyg",
  NYJ: "nyj",
};

function teamLogo(team: string) {
  const code = (ESPN_ABBR[team.toUpperCase()] ?? team).toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${code}.png`;
}

function ScoreRow({ team, score, lead }: { team: string; score: number | null; lead: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-3 min-w-0">
        <img
          src={teamLogo(team)}
          alt={`${team} logo`}
          loading="lazy"
          width={40}
          height={40}
          className="size-9 md:size-10 object-contain shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <span className="font-display text-3xl md:text-4xl uppercase leading-none tracking-tight">{team}</span>
      </span>
      <span
        className={`font-display text-3xl md:text-4xl leading-none tabular-nums ${
          lead ? "text-accent" : "text-foreground"
        }`}
      >
        {score === null ? "-" : score}
      </span>
    </div>
  );
}

function GameCell({ game }: { game: NflGame }) {
  const started = game.live || game.final;
  const away = started ? game.awayScore : null;
  const home = started ? game.homeScore : null;
  return (
    <div className="px-6 py-8 md:px-10 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          NFL · {statusLabel(game)}
        </span>
        {game.live && <span className="size-2 rounded-full bg-red-500 animate-pulse mt-1" />}
      </div>
      <div className="space-y-3">
        <ScoreRow team={game.awayTeam} score={away} lead={away !== null && home !== null && away > home} />
        <ScoreRow team={game.homeTeam} score={home} lead={away !== null && home !== null && home > away} />
      </div>
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
        {detailLine(game)}
      </div>
    </div>
  );
}

export function NflSection() {
  const { data, isFetching } = useSuspenseQuery(nflQueryOptions);
  const { data: streamedIds } = useQuery(streamedNflQueryOptions);
  const allow = new Set(streamedIds ?? []);

  const pool = [...data.live, ...data.upcoming, ...data.recent];
  const featured = pool.filter((g) => allow.has(g.gameId));

  return (
    <section className="border-y border-border bg-background py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-mono text-accent text-[11px] tracking-[0.35em] block mb-3 uppercase">
              On air now
            </span>
            <h2 className="font-display text-5xl md:text-6xl uppercase leading-none">
              Live from the scoreboard
            </h2>
          </div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${isFetching ? "bg-accent animate-pulse" : "bg-accent/50"}`} />
            Updates every 60s
          </div>
        </div>

        {!data.configured && (
          <div className="border border-accent/40 bg-accent/5 p-6 font-mono text-xs text-muted-foreground">
            NFL feed not configured yet.
          </div>
        )}

        {data.configured && featured.length === 0 && (
          <div className="border border-border p-8 font-mono text-xs text-muted-foreground text-center uppercase tracking-widest">
            No NFL games on the board yet - check back soon.
          </div>
        )}

        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border-y border-border">
            {featured.slice(0, 9).map((g) => (
              <div key={g.gameId} className="bg-background">
                <GameCell game={g} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
