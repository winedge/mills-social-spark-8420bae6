import { createServerFn } from "@tanstack/react-start";

export type NflGame = {
  gameId: number;
  week: number | null;
  seasonType: string;
  dateTime: string | null;
  status: string;
  live: boolean;
  final: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  quarter: string | null;
  timeRemaining: string | null;
  stadium: string | null;
  channel: string | null;
};

type RawGame = {
  GameKey?: string | null;
  GameID?: number | null;
  ScoreID?: number | null;
  Season?: number | null;
  SeasonType?: number | null;
  Week?: number | null;
  Date?: string | null;
  DateTime?: string | null;
  DateTimeUTC?: string | null;
  AwayTeam?: string | null;
  HomeTeam?: string | null;
  AwayScore?: number | null;
  HomeScore?: number | null;
  Status?: string | null;
  Quarter?: string | null;
  TimeRemaining?: string | null;
  Channel?: string | null;
  StadiumDetails?: { Name?: string | null } | null;
};

const BASE = "https://api.sportsdata.io/v3/nfl/scores/json";

const SEASON_TYPE: Record<number, string> = { 1: "PRE", 2: "REG", 3: "POST", 4: "OFF" };

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s && s.toLowerCase() !== "null" ? s : null;
}

export function nflTimestamp(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const stamp = iso.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z";
  const t = new Date(stamp).getTime();
  return Number.isFinite(t) ? t : null;
}

function mapGame(g: RawGame): NflGame | null {
  const gameId = num(g.GameID) ?? num(g.ScoreID);
  const home = str(g.HomeTeam);
  const away = str(g.AwayTeam);
  if (gameId === null || !home || !away) return null;
  const status = str(g.Status) ?? "Scheduled";
  const s = status.toLowerCase();
  return {
    gameId,
    week: num(g.Week),
    seasonType: SEASON_TYPE[g.SeasonType ?? 2] ?? "REG",
    dateTime: str(g.DateTimeUTC) ?? str(g.DateTime) ?? str(g.Date),
    status,
    live: s === "inprogress" || s === "in progress" || s === "halftime",
    final: s.startsWith("final") || s === "f/ot",
    homeTeam: home,
    awayTeam: away,
    homeScore: num(g.HomeScore),
    awayScore: num(g.AwayScore),
    quarter: str(g.Quarter),
    timeRemaining: str(g.TimeRemaining),
    stadium: str(g.StadiumDetails?.Name ?? null),
    channel: str(g.Channel),
  };
}

async function fetchSeason(season: string, apiKey: string): Promise<RawGame[] | null> {
  for (const path of [`Scores/${season}`, `Schedules/${season}`, `SchedulesBasic/${season}`]) {
    try {
      const res = await fetch(`${BASE}/${path}?key=${apiKey}`, {
        headers: { Accept: "application/json" },
      });
      // Quota exhausted / unauthorized: further shapes would waste more calls.
      if (res.status === 401 || res.status === 403 || res.status === 429) return null;
      if (!res.ok) continue;
      const json = (await res.json()) as RawGame[];
      if (Array.isArray(json) && json.length) return json;
    } catch {
      /* try next shape */
    }
  }
  return null;
}

export type NflFeed = {
  configured: boolean;
  season: string;
  live: NflGame[];
  upcoming: NflGame[];
  recent: NflGame[];
  stale?: boolean;
  error?: string;
};

/** 2026 NFL schedule + live scores from SportsDataIO. */
export const getNflGames = createServerFn({ method: "GET" }).handler(async (): Promise<NflFeed> => {
  const apiKey = process.env['SPORTSDATAIO_API_KEY'];
  const season = "2026";
  if (!apiKey) {
    return { configured: false, season, live: [], upcoming: [], recent: [] };
  }

  const { withSportsCache } = await import("./sports-cache.server");
  const { data: games, stale } = await withSportsCache<NflGame[]>(
    `nfl:${season}`,
    120_000,
    async () => {
      const raw = await fetchSeason(season, apiKey);
      if (!raw) return null;
      const mapped = raw.map(mapGame).filter((g): g is NflGame => g !== null);
      return mapped.length ? mapped : null;
    },
  );

  if (!games) {
    return {
      configured: true,
      season,
      live: [],
      upcoming: [],
      recent: [],
      error: "NFL feed unavailable for this API key.",
    };
  }

  const now = Date.now();

  const now = Date.now();

  const live = games.filter((g) => g.live);
  const upcoming = games
    .filter((g) => !g.live && !g.final)
    .map((g) => ({ g, ts: nflTimestamp(g.dateTime) }))
    .filter(({ ts }) => ts === null || ts >= now - 1000 * 60 * 60 * 6)
    .sort((a, b) => (a.ts ?? Infinity) - (b.ts ?? Infinity))
    .map(({ g }) => g);
  const recent = games
    .filter((g) => g.final)
    .map((g) => ({ g, ts: nflTimestamp(g.dateTime) }))
    .filter(({ ts }) => ts !== null && now - ts < 1000 * 60 * 60 * 24 * 14)
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
    .map(({ g }) => g)
    .slice(0, 12);

  return { configured: true, season, live, upcoming: upcoming.slice(0, 400), recent };
});
