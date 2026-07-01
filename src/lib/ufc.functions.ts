import { createServerFn } from "@tanstack/react-start";

export type UfcFighter = {
  name: string;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  winner: boolean;
};

export type UfcFight = {
  fightId: number;
  order: number | null;
  weightClass: string | null;
  cardSegment: string | null;
  rounds: number | null;
  status: string;
  fighterA: UfcFighter | null;
  fighterB: UfcFighter | null;
  resultType: string | null;
  resultRound: number | null;
};

export type UfcEvent = {
  eventId: number;
  name: string;
  shortName: string;
  dateTime: string | null;
  status: string;
  live: boolean;
  mainEvent: UfcFight | null;
  fights: UfcFight[];
};

type RawFighter = {
  FirstName?: string | null;
  LastName?: string | null;
  PreFightWins?: number | null;
  PreFightLosses?: number | null;
  PreFightDraws?: number | null;
  Wins?: number | null;
  Losses?: number | null;
  Draws?: number | null;
  Winner?: boolean | null;
};

type RawFight = {
  FightId: number;
  Order?: number | null;
  Status?: string | null;
  WeightClass?: string | null;
  CardSegment?: string | null;
  Rounds?: number | null;
  ResultRound?: number | null;
  ResultType?: string | null;
  Fighters?: RawFighter[];
};

type RawEvent = {
  EventId: number;
  Name?: string;
  ShortName?: string;
  DateTime?: string | null;
  Day?: string | null;
  Status?: string | null;
  Season?: number;
  Fights?: RawFight[];
};

const BASE = "https://api.sportsdata.io/v3/mma/scores/json";

function cleanStr(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "scrambled" || s.toLowerCase() === "null") return null;
  return s;
}

function cleanNum(v: number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function mapFighter(f: RawFighter | undefined): UfcFighter | null {
  if (!f) return null;
  const name = [f.FirstName, f.LastName].map((x) => cleanStr(x ?? null)).filter(Boolean).join(" ").trim();
  if (!name) return null;
  return {
    name,
    wins: cleanNum(f.PreFightWins ?? f.Wins ?? null),
    losses: cleanNum(f.PreFightLosses ?? f.Losses ?? null),
    draws: cleanNum(f.PreFightDraws ?? f.Draws ?? null),
    winner: Boolean(f.Winner),
  };
}

function mapFight(fight: RawFight): UfcFight {
  return {
    fightId: fight.FightId,
    order: fight.Order ?? null,
    status: fight.Status || "Scheduled",
    weightClass: cleanStr(fight.WeightClass),
    cardSegment: cleanStr(fight.CardSegment),
    rounds: cleanNum(fight.Rounds),
    fighterA: mapFighter(fight.Fighters?.[0]),
    fighterB: mapFighter(fight.Fighters?.[1]),
    resultType: cleanStr(fight.ResultType),
    resultRound: cleanNum(fight.ResultRound),
  };
}

function parseTs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const stamp = iso.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z";
  const t = new Date(stamp).getTime();
  return Number.isFinite(t) ? t : null;
}

async function fetchEventDetail(eventId: number, apiKey: string): Promise<RawEvent | null> {
  try {
    const res = await fetch(`${BASE}/Event/${eventId}?key=${apiKey}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as RawEvent;
  } catch {
    return null;
  }
}

function mapEvent(raw: RawEvent): UfcEvent {
  const fights = (raw.Fights ?? []).map(mapFight);
  const byOrder = [...fights].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const mainEvent =
    fights.find((f) => (f.cardSegment || "").toLowerCase() === "main event") ||
    byOrder.find((f) => f.fighterA && f.fighterB) ||
    byOrder[0] ||
    null;
  const status = raw.Status || "Scheduled";
  return {
    eventId: raw.EventId,
    name: raw.Name || raw.ShortName || "UFC Event",
    shortName: raw.ShortName || raw.Name || "UFC",
    dateTime: raw.DateTime ?? null,
    status,
    live: status.toLowerCase() === "inprogress",
    mainEvent,
    fights,
  };
}


export const getUfcFights = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return {
      upcoming: [] as UfcEvent[],
      live: [] as UfcEvent[],
      recent: [] as UfcEvent[],
      configured: false as const,
    };
  }

  const season = new Date().getUTCFullYear();

  try {
    const schedRes = await fetch(`${BASE}/Schedule/UFC/${season}?key=${apiKey}`, {
      headers: { Accept: "application/json" },
    });
    if (!schedRes.ok) {
      return {
        upcoming: [],
        live: [],
        recent: [],
        configured: true as const,
        error: `SportsDataIO ${schedRes.status}`,
      };
    }
    const schedule = (await schedRes.json()) as RawEvent[];
    const now = Date.now();

    const withTs = schedule.map((e) => ({ e, ts: parseTs(e.DateTime ?? e.Day ?? null) }));

    const upcomingRaw = withTs
      .filter(
        ({ e, ts }) =>
          (e.Status || "").toLowerCase() !== "final" &&
          (e.Status || "").toLowerCase() !== "canceled" &&
          ts !== null &&
          ts >= now - 1000 * 60 * 60 * 12,
      )
      .sort((a, b) => (a.ts! - b.ts!))
      .slice(0, 6);

    const liveRaw = withTs.filter(({ e }) => (e.Status || "").toLowerCase() === "inprogress");

    const recentRaw = withTs
      .filter(
        ({ e, ts }) => (e.Status || "").toLowerCase() === "final" && ts !== null && now - ts < 1000 * 60 * 60 * 24 * 30,
      )
      .sort((a, b) => b.ts! - a.ts!)
      .slice(0, 3);

    const details = await Promise.all(
      [...liveRaw, ...upcomingRaw, ...recentRaw].map(({ e }) => fetchEventDetail(e.EventId, apiKey)),
    );

    const events = details
      .map((raw, i) => {
        const source = [...liveRaw, ...upcomingRaw, ...recentRaw][i].e;
        return raw ? mapEvent({ ...source, ...raw }) : mapEvent(source);
      });

    const live = events.slice(0, liveRaw.length);
    const upcoming = events.slice(liveRaw.length, liveRaw.length + upcomingRaw.length);
    const recent = events.slice(liveRaw.length + upcomingRaw.length);

    return { upcoming, live, recent, configured: true as const };
  } catch (err) {
    return {
      upcoming: [],
      live: [],
      recent: [],
      configured: true as const,
      error: (err as Error).message,
    };
  }
});
