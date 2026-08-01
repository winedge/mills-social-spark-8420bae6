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

const TEAM_COLOR: Record<string, string> = {
  ARI: "#97233F", ATL: "#A71930", BAL: "#241773", BUF: "#00338D", CAR: "#0085CA",
  CHI: "#0B162A", CIN: "#FB4F14", CLE: "#311D00", DAL: "#041E42", DEN: "#FB4F14",
  DET: "#0076B6", GB: "#203731", HOU: "#03202F", IND: "#002C5F", JAX: "#006778",
  KC: "#E31837", LAC: "#0080C6", LAR: "#003594", LV: "#000000", MIA: "#008E97",
  MIN: "#4F2683", NE: "#002244", NO: "#D3BC8D", NYG: "#0B2265", NYJ: "#125740",
  PHI: "#004C54", PIT: "#FFB612", SEA: "#002244", SF: "#AA0000", TB: "#D50A0A",
  TEN: "#4B92DB", WAS: "#5A1414",
};

function teamColor(team: string) {
  return TEAM_COLOR[team.toUpperCase()] ?? "#1f2937";
}

function TeamPanel({
  team,
  score,
  align,
}: {
  team: string;
  score: number | null;
  align: "left" | "right";
}) {
  const color = teamColor(team);
  const left = align === "left";
  return (
    <div
      className={`relative flex-1 min-w-0 flex items-center gap-2 md:gap-3 lg:gap-2 px-2 md:px-3 lg:px-3 py-4 md:py-5 lg:py-3 overflow-hidden ${
        left ? "flex-row" : "flex-row-reverse"
      }`}
      style={{
        background: `linear-gradient(${left ? "100deg" : "260deg"}, ${color} 0%, ${color}cc 45%, rgba(8,9,12,0.9) 100%)`,
      }}
    >
      <img
        src={teamLogo(team)}
        alt={`${team} logo`}
        loading="lazy"
        width={160}
        height={160}
        className="size-14 md:size-20 lg:size-14 object-contain shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <div className={`min-w-0 flex items-baseline gap-2 ${left ? "" : "flex-row-reverse"}`}>
        <span className="font-display text-3xl md:text-5xl lg:text-3xl uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
          {team}
        </span>
        {score !== null && (
          <span className="font-display text-2xl md:text-4xl lg:text-2xl leading-none tabular-nums text-white/90">
            {score}
          </span>
        )}
      </div>
    </div>
  );
}

function kickoffParts(game: NflGame) {
  if (!game.dateTime) return { day: "TBD", time: "" };
  const d = new Date(game.dateTime.endsWith("Z") ? game.dateTime : game.dateTime + "Z");
  if (Number.isNaN(d.getTime())) return { day: "TBD", time: "" };
  const opts = { timeZone: "America/Phoenix" } as const;
  return {
    day: d.toLocaleString("en-US", { ...opts, weekday: "long" }).toUpperCase(),
    time: d
      .toLocaleString("en-US", { ...opts, hour: "numeric", minute: "2-digit" })
      .replace(" ", "")
      .toUpperCase(),
  };
}

function GameCell({ game }: { game: NflGame }) {
  const started = game.live || game.final;
  const away = started ? game.awayScore : null;
  const home = started ? game.homeScore : null;
  const { day, time } = kickoffParts(game);

  return (
    <article className="relative border border-border bg-[#08090c] overflow-hidden">
      <div className="flex items-stretch">
        <TeamPanel team={game.awayTeam} score={away} align="left" />

        {/* Center badge */}
        <div className="relative z-10 shrink-0 w-16 md:w-24 lg:w-16 bg-[#08090c] border-x border-white/10 flex flex-col items-center justify-center gap-0.5 px-1 py-3 text-center">
          <span className="font-mono text-[8px] md:text-[9px] lg:text-[8px] tracking-[0.25em] text-accent uppercase">
            {game.live ? "LIVE" : game.final ? "FINAL" : `WK ${game.week ?? "-"}`}
          </span>
          <span className="font-display text-xl md:text-3xl lg:text-xl uppercase leading-none text-white">VS</span>
          {game.channel && (
            <span className="font-mono text-[8px] md:text-[9px] lg:text-[8px] tracking-[0.15em] text-muted-foreground uppercase truncate max-w-full">
              {game.channel}
            </span>
          )}
        </div>

        <TeamPanel team={game.homeTeam} score={home} align="right" />
      </div>

      {/* Info bar */}
      <div className="border-t border-white/10 bg-black/60 px-3 py-2 flex items-center justify-center gap-2 font-mono text-[9px] md:text-[10px] lg:text-[9px] tracking-[0.2em] text-white/80 uppercase">
        {game.live ? (
          <>
            <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{detailLine(game)}</span>
          </>
        ) : game.final ? (
          <span>FINAL</span>
        ) : (
          <>
            <span className="truncate">{day}</span>
            <span className="text-accent">|</span>
            <span>
              {time}
              <span className="text-muted-foreground lowercase"> mst</span>
            </span>
          </>
        )}
      </div>
    </article>
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
          <div className="flex flex-col gap-4">
            {featured.slice(0, 9).map((g) => (
              <GameCell key={g.gameId} game={g} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
