import { createServerFn } from "@tanstack/react-start";

export type UfcFight = {
  fightId: number;
  eventId: number;
  eventName: string;
  dateTime: string | null;
  status: string;
  active: boolean;
  weightClass: string | null;
  cardSegment: string | null;
  order: number | null;
  rounds: number | null;
  fighterA: { name: string; country: string | null; wins: number | null; losses: number | null; draws: number | null; winner: boolean } | null;
  fighterB: { name: string; country: string | null; wins: number | null; losses: number | null; draws: number | null; winner: boolean } | null;
  resultClock: string | null;
  resultRound: number | null;
  resultType: string | null;
};

type RawFighter = {
  FighterId?: number;
  FirstName?: string | null;
  LastName?: string | null;
  Nickname?: string | null;
  BirthCountry?: string | null;
  Wins?: number | null;
  Losses?: number | null;
  Draws?: number | null;
  Winner?: boolean | null;
};

type RawFight = {
  FightId: number;
  EventId?: number;
  Order?: number | null;
  Status?: string | null;
  WeightClass?: string | null;
  CardSegment?: string | null;
  Rounds?: number | null;
  ResultClock?: string | null;
  ResultRound?: number | null;
  ResultType?: string | null;
  Active?: boolean;
  Fighters?: RawFighter[];
};

type RawEvent = {
  EventId: number;
  Name?: string;
  ShortName?: string;
  DateTime?: string | null;
  Day?: string | null;
  Status?: string | null;
  Active?: boolean;
  Fights?: RawFight[];
};

function fighterName(f: RawFighter): string {
  const parts = [f.FirstName, f.LastName].filter(Boolean);
  return parts.join(" ").trim() || "TBD";
}

function mapFight(evt: RawEvent, fight: RawFight): UfcFight {
  const a = fight.Fighters?.[0] ?? null;
  const b = fight.Fighters?.[1] ?? null;
  return {
    fightId: fight.FightId,
    eventId: evt.EventId,
    eventName: evt.Name || evt.ShortName || "UFC Event",
    dateTime: fight.Status && fight.Status !== "Scheduled" ? evt.DateTime ?? null : evt.DateTime ?? null,
    status: fight.Status || evt.Status || "Scheduled",
    active: Boolean(fight.Active ?? evt.Active),
    weightClass: fight.WeightClass ?? null,
    cardSegment: fight.CardSegment ?? null,
    order: fight.Order ?? null,
    rounds: fight.Rounds ?? null,
    fighterA: a
      ? {
          name: fighterName(a),
          country: a.BirthCountry ?? null,
          wins: a.Wins ?? null,
          losses: a.Losses ?? null,
          draws: a.Draws ?? null,
          winner: Boolean(a.Winner),
        }
      : null,
    fighterB: b
      ? {
          name: fighterName(b),
          country: b.BirthCountry ?? null,
          wins: b.Wins ?? null,
          losses: b.Losses ?? null,
          draws: b.Draws ?? null,
          winner: Boolean(b.Winner),
        }
      : null,
    resultClock: fight.ResultClock ?? null,
    resultRound: fight.ResultRound ?? null,
    resultType: fight.ResultType ?? null,
  };
}

export const getUfcFights = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.SPORTSDATAIO_API_KEY;
  if (!apiKey) {
    return { upcoming: [] as UfcFight[], live: [] as UfcFight[], recent: [] as UfcFight[], configured: false as const };
  }

  const season = new Date().getUTCFullYear();
  const url = `https://api.sportsdata.io/v3/mma/scores/json/Schedule/UFC/${season}?key=${apiKey}`;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return { upcoming: [], live: [], recent: [], configured: true as const, error: `SportsDataIO ${res.status}` };
    }
    const events = (await res.json()) as RawEvent[];
    const now = Date.now();

    const upcoming: UfcFight[] = [];
    const live: UfcFight[] = [];
    const recent: UfcFight[] = [];

    for (const evt of events) {
      const evtTime = evt.DateTime ? new Date(evt.DateTime + "Z").getTime() : null;
      for (const fight of evt.Fights ?? []) {
        const mapped = mapFight(evt, fight);
        const status = (mapped.status || "").toLowerCase();
        if (status.includes("inprogress") || status === "live") {
          live.push(mapped);
        } else if (status === "final" || status === "canceled" || status === "closed") {
          if (evtTime && now - evtTime < 1000 * 60 * 60 * 24 * 21) recent.push(mapped);
        } else if (evtTime && evtTime >= now - 1000 * 60 * 60 * 6) {
          upcoming.push(mapped);
        }
      }
    }

    upcoming.sort((a, b) => (new Date(a.dateTime || 0).getTime() - new Date(b.dateTime || 0).getTime()));
    recent.sort((a, b) => (new Date(b.dateTime || 0).getTime() - new Date(a.dateTime || 0).getTime()));

    return {
      upcoming: upcoming.slice(0, 8),
      live: live.slice(0, 6),
      recent: recent.slice(0, 6),
      configured: true as const,
    };
  } catch (err) {
    return { upcoming: [], live: [], recent: [], configured: true as const, error: (err as Error).message };
  }
});
