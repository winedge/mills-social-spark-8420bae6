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
  date: string;
  slug: string; // Used as event name
  is_main: boolean;
  category: string | null;
  status: {
    long: string;
    short: string;
  };
  fighters: {
    first: ApiSportsFighter & { winner: boolean };
    second: ApiSportsFighter & { winner: boolean };
  };
  result?: string | null;
};

const BASE = "https://v1.mma.api-sports.io";
const API_KEY = "7ffc76f772f0f10f09450fbb6df232f6";

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

  const imageUrl = f.logo || ufcOfficialUrl;

  return {
    name,
    wins: null, 
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
  return {
    fightId: f.id,
    order: f.is_main ? 1 : null,
    status: f.status.long || "Scheduled",
    weightClass: cleanStr(f.category),
    cardSegment: f.is_main ? "Main Event" : null,
    rounds: null, 
    fighterA: await mapFighter(f.fighters.first),
    fighterB: await mapFighter(f.fighters.second),
    resultType: null,
    resultRound: null,
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
  const { withSportsCache } = await import("./sports-cache.server");
  
  // Using season 2024 since free plan is limited to 2022-2024
  const season = 2024;
  const cacheKey = `ufc-api-sports-v6:${season}`;
  const ttl = 86_400_000 * 7; // Increased to 7 days to minimize API calls; will update on new event ID selection or manual cache bust.

  const { data, stale } = await withSportsCache<{
    upcoming: UfcEvent[];
    live: UfcEvent[];
    recent: UfcEvent[];
  }>(cacheKey, ttl, async () => {
    try {
      const res = await fetch(`${BASE}/fights?season=${season}`, { 
        headers: { "x-apisports-key": API_KEY } 
      });
      if (!res.ok) return null;
      const json = await res.json();
      const allFights = (json.response || []) as ApiSportsFight[];
      if (!allFights.length) return null;

      // Group fights by event (slug)
      const eventsMap = new Map<string, ApiSportsFight[]>();
      for (const fight of allFights) {
        if (!eventsMap.has(fight.slug)) {
          eventsMap.set(fight.slug, []);
        }
        eventsMap.get(fight.slug)!.push(fight);
      }

      const events: UfcEvent[] = await Promise.all(
        Array.from(eventsMap.entries()).map(async ([slug, fights]) => {
          const firstFight = fights[0];
          const mappedFights = await Promise.all(fights.map(mapFight));
          const mainEvent = mappedFights.find(f => f.cardSegment === "Main Event") || mappedFights[0];
          
          return {
            eventId: firstFight.id, // Using first fight ID as event ID
            name: slug,
            shortName: slug.split(":")[0],
            dateTime: firstFight.date,
            status: firstFight.status.long,
            live: normStatus(firstFight.status.short) === "inprogress",
            mainEvent,
            fights: mappedFights
          };
        })
      );

      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const live = events.filter(e => e.live);
      const recent = events.filter(e => normStatus(e.status) === "final" || e.status === "Finished")
        .sort((a, b) => new Date(b.dateTime!).getTime() - new Date(a.dateTime!).getTime())
        .slice(0, 3);
      const upcoming = events.filter(e => !e.live && normStatus(e.status) !== "final" && e.status !== "Finished")
        .sort((a, b) => new Date(a.dateTime!).getTime() - new Date(b.dateTime!).getTime())
        .slice(0, 6);

      // If no upcoming in last 12h, just take next 6 from future
      if (upcoming.length === 0) {
        const future = events.filter(e => !e.live && normStatus(e.status) !== "final" && new Date(e.dateTime!) > now)
            .sort((a, b) => new Date(a.dateTime!).getTime() - new Date(b.dateTime!).getTime())
            .slice(0, 6);
        upcoming.push(...future);
      }

      // If still empty (e.g. 2024 is past), take last 6 for display
      if (upcoming.length === 0 && live.length === 0) {
          const past = events.sort((a, b) => new Date(b.dateTime!).getTime() - new Date(a.dateTime!).getTime())
            .slice(0, 6);
          upcoming.push(...past);
      }

      return { live, upcoming, recent };
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
