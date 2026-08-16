import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type UfcFighter = {
  name: string;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  winner: boolean;
  imageUrl: string | null;
  ufcFallbackUrl?: string | null;
  ufcAltUrl?: string | null;
  ufcThirdUrl?: string | null;
  espnId?: string | null;
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

/** API-Sports MMA Types */
type ApiSportsFighter = {
  id: number;
  name: string;
  logo: string | null;
};

type ApiSportsFight = {
  id: number;
  order: number | null;
  status: {
    long: string;
    short: string;
  };
  category: string | null;
  fighters: {
    first: ApiSportsFighter & { winner: boolean };
    second: ApiSportsFighter & { winner: boolean };
  };
  result: string | null;
};

type ApiSportsEvent = {
  id: number;
  name: string;
  date: string;
  status: {
    long: string;
    short: string;
  };
  league: {
    id: number;
    name: string;
  };
};

const BASE = "https://v1.mma.api-sports.io";
const LEAGUE_ID_UFC = 2; // Typically 2 for UFC in API-Sports

export function normStatus(v: string | null | undefined): string {
  const s = String(v ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (s === "finished" || s === "ft" || s === "final") return "final";
  if (s === "live" || s === "inprogress") return "inprogress";
  return s;
}

function cleanStr(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null") return null;
  return s;
}

function cleanNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const PRIVATE_STORAGE_PREFIX = "storage://site_assets/";

function storagePathFromUrl(url: string): string | null {
  if (url.startsWith(PRIVATE_STORAGE_PREFIX)) return url.slice(PRIVATE_STORAGE_PREFIX.length);
  const marker = "/storage/v1/object/public/site_assets/";
  const markerIndex = url.indexOf(marker);
  return markerIndex >= 0 ? decodeURIComponent(url.slice(markerIndex + marker.length)) : null;
}

async function resolveOverrideUrl(url: string): Promise<string> {
  const path = storagePathFromUrl(url);
  if (!path) return url;
  const { data, error } = await supabase.storage.from("site_assets").createSignedUrl(path, 86_400);
  return error || !data?.signedUrl ? url : data.signedUrl;
}

async function applyCurrentFighterOverrides(data: {
  upcoming: UfcEvent[];
  live: UfcEvent[];
  recent: UfcEvent[];
}) {
  const { data: rows } = await supabase
    .from("ufc_fighter_overrides" as any)
    .select("fighter_name,image_url");
  const overrides = new Map<string, string>();
  
  if (rows) {
    await Promise.all(
      (rows as unknown as { fighter_name: string; image_url: string }[]).map(async (row) => {
        overrides.set(row.fighter_name.trim().toLowerCase(), await resolveOverrideUrl(row.image_url));
      }),
    );
  }

  for (const event of [...data.upcoming, ...data.live, ...data.recent]) {
    for (const fight of event.fights) {
      for (const fighter of [fight.fighterA, fight.fighterB]) {
        if (!fighter) continue;
        const overrideUrl = overrides.get(fighter.name.trim().toLowerCase());
        if (overrideUrl) fighter.imageUrl = overrideUrl;
      }
    }
  }
  return data;
}

async function mapFighter(f: ApiSportsFighter & { winner: boolean }): Promise<UfcFighter | null> {
  if (!f || !f.name) return null;
  const name = f.name.trim();

  const slug = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, "-") 
    .replace(/-+/g, "-") 
    .replace(/^-|-$/g, ""); 
    
  const ufcOfficialUrl = `https://dmxg5wxfqgb4u.cloudfront.net/styles/fighter_stats_headshot/s3/image/fighter/profile/${slug}.png`;
  const ufcOfficialAltUrl = `https://dmxg5wxfqgb4u.cloudfront.net/styles/event_results_athlete_headshot/s3/image/fighter/profile/${slug}.png`;
  const ufcOfficialCdnUrl = `https://dmxg5wxfqgb4u.cloudfront.net/image/fighter/profile/${slug}.png`;

  // API-Sports logo is often high quality
  const imageUrl = f.logo || ufcOfficialUrl;

  return {
    name,
    wins: null, // API-Sports detail endpoint might have this, but for now we skip
    losses: null,
    draws: null,
    winner: f.winner,
    imageUrl,
    ufcFallbackUrl: ufcOfficialUrl,
    ufcAltUrl: ufcOfficialAltUrl,
    ufcThirdUrl: ufcOfficialCdnUrl,
    espnId: null,
  };
}

async function mapFight(f: ApiSportsFight): Promise<UfcFight> {
  const resultType = f.result ? f.result.split(" ")[0] : null;
  const resultRoundMatch = f.result?.match(/R(\d+)/);
  const resultRound = resultRoundMatch ? parseInt(resultRoundMatch[1], 10) : null;

  return {
    fightId: f.id,
    order: f.order ?? null,
    status: f.status.long || "Scheduled",
    weightClass: cleanStr(f.category),
    cardSegment: f.order === 1 ? "Main Event" : null,
    rounds: null, // Would need detail endpoint
    fighterA: await mapFighter(f.fighters.first),
    fighterB: await mapFighter(f.fighters.second),
    resultType,
    resultRound,
  };
}

async function mapEvent(raw: ApiSportsEvent, fights: ApiSportsFight[] = []): Promise<UfcEvent> {
  const mappedFights = await Promise.all(fights.map(mapFight));
  const byOrder = [...mappedFights].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const mainEvent = byOrder[0] || null;
  const status = raw.status.long || "Scheduled";
  
  return {
    eventId: raw.id,
    name: raw.name || "UFC Event",
    shortName: raw.name?.split(":")[0] || "UFC",
    dateTime: raw.date ?? null,
    status,
    live: normStatus(status) === "inprogress",
    mainEvent,
    fights: mappedFights,
  };
}

export type UfcFeed = {
  upcoming: UfcEvent[];
  live: UfcEvent[];
  recent: UfcEvent[];
  configured: boolean;
  stale?: boolean;
  error?: string;
};

export const getUfcFights = createServerFn({ method: "GET" }).handler(async (): Promise<UfcFeed> => {
  const apiKey = "7ffc76f772f0f10f09450fbb6df232f6";
  if (!apiKey) {
    return { upcoming: [], live: [], recent: [], configured: false };
  }

  const season = new Date().getUTCFullYear();
  const { withSportsCache, readSportsCache } = await import("./sports-cache.server");
  const cacheKey = `ufc-api-sports:${season}`;

  const cachedNow = await readSportsCache(cacheKey);
  const hasLive = Array.isArray((cachedNow?.payload as { live?: unknown[] })?.live)
    ? ((cachedNow!.payload as { live: unknown[] }).live.length > 0)
    : false;
  const ttl = hasLive ? 60_000 : 900_000;

  const { data, stale } = await withSportsCache<{
    upcoming: UfcEvent[];
    live: UfcEvent[];
    recent: UfcEvent[];
  }>(cacheKey, ttl, async () => {
    try {
      const headers = {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "v1.mma.api-sports.io",
      };

      // 1. Fetch Events for the season
      const eventsRes = await fetch(`${BASE}/events?league=${LEAGUE_ID_UFC}&season=${season}`, { headers });
      if (!eventsRes.ok) return null;
      const eventsJson = await eventsRes.json();
      const allEvents = (eventsJson.response || []) as ApiSportsEvent[];
      if (!allEvents.length) return null;

      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const categorized = allEvents.reduce((acc, e) => {
        const date = new Date(e.date);
        const status = normStatus(e.status.short);
        
        if (status === "inprogress") {
          acc.live.push(e);
        } else if (status === "final") {
          if (date > thirtyDaysAgo) acc.recent.push(e);
        } else if (date > twelveHoursAgo) {
          acc.upcoming.push(e);
        }
        return acc;
      }, { live: [] as ApiSportsEvent[], upcoming: [] as ApiSportsEvent[], recent: [] as ApiSportsEvent[] });

      // Sort and slice
      categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const upcomingSlice = categorized.upcoming.slice(0, 6);
      
      categorized.recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentSlice = categorized.recent.slice(0, 3);

      const targetEvents = [...categorized.live, ...upcomingSlice, ...recentSlice];

      // 2. Fetch Fights for these events
      const eventsWithFights = await Promise.all(targetEvents.map(async (event) => {
        const fightsRes = await fetch(`${BASE}/fights?event=${event.id}`, { headers });
        if (!fightsRes.ok) return mapEvent(event);
        const fightsJson = await fightsRes.json();
        return mapEvent(event, fightsJson.response || []);
      }));

      return {
        live: eventsWithFights.slice(0, categorized.live.length),
        upcoming: eventsWithFights.slice(categorized.live.length, categorized.live.length + upcomingSlice.length),
        recent: eventsWithFights.slice(categorized.live.length + upcomingSlice.length),
      };
    } catch (err) {
      console.error("API-Sports UFC fetch error:", err);
      return null;
    }
  });

  if (!data) {
    return {
      upcoming: [],
      live: [],
      recent: [],
      configured: true,
      error: "UFC feed temporarily unavailable.",
    };
  }

  const currentData = await applyCurrentFighterOverrides(data);
  return { ...currentData, configured: true, stale };
});
