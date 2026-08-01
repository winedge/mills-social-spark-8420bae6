import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Entry = { payload: unknown; updatedAt: number };

/** Per-instance memory cache, backed by the sports_cache table so all visitors share it. */
const mem = new Map<string, Entry>();

export async function readSportsCache(key: string): Promise<Entry | null> {
  const local = mem.get(key);
  if (local) return local;
  try {
    const { data } = await (supabaseAdmin as any)
      .from("sports_cache")
      .select("payload, updated_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (!data) return null;
    const entry: Entry = {
      payload: data.payload,
      updatedAt: new Date(data.updated_at).getTime(),
    };
    mem.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

export async function writeSportsCache(key: string, payload: unknown): Promise<void> {
  mem.set(key, { payload, updatedAt: Date.now() });
  try {
    await (supabaseAdmin as any)
      .from("sports_cache")
      .upsert({ cache_key: key, payload, updated_at: new Date().toISOString() }, { onConflict: "cache_key" });
  } catch {
    /* cache write is best-effort */
  }
}

/**
 * Shared stale-while-revalidate wrapper.
 * - Fresh cache (< ttlMs) is returned immediately, saving upstream API calls.
 * - If the upstream call fails or returns nothing usable, the last known good
 *   payload is served instead of an empty feed.
 */
export async function withSportsCache<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T | null>,
): Promise<{ data: T | null; stale: boolean }> {
  const cached = await readSportsCache(key);
  if (cached && Date.now() - cached.updatedAt < ttlMs) {
    return { data: cached.payload as T, stale: false };
  }
  try {
    const fresh = await load();
    if (fresh) {
      await writeSportsCache(key, fresh);
      return { data: fresh, stale: false };
    }
  } catch {
    /* fall through to stale */
  }
  if (cached) return { data: cached.payload as T, stale: true };
  return { data: null, stale: false };
}
