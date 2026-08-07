import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbMenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: number | null;
  category: string;
  category_id: string | null;
  tag: string | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type DbMenuCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  active: boolean;
};

export type DbPartySpace = {
  id: string;
  name: string;
  capacity: string;
  price: string;
  description: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type DbPartyShow = {
  id: string;
  date_label: string;
  time_label: string;
  act: string;
  event_type: string;
  genre: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type DbSportsRow = {
  id: string;
  league: string;
  when_label: string;
  match_label: string;
  note: string;
  sort_order: number;
  active: boolean;
};

export function useMenuItems() {
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("menu_items")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        setItems((data ?? []) as DbMenuItem[]);
        setLoading(false);
      });
  }, []);
  return { items, loading };
}

export function useMenuCategories() {
  const [items, setItems] = useState<DbMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (supabase as any)
      .from("menu_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("name")
      .then(({ data }: { data: DbMenuCategory[] | null }) => {
        setItems((data ?? []) as DbMenuCategory[]);
        setLoading(false);
      });
  }, []);
  return { items, loading };
}

export function usePartySpaces() {
  const [items, setItems] = useState<DbPartySpace[]>([]);
  useEffect(() => {
    supabase
      .from("party_spaces")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as DbPartySpace[]));
  }, []);
  return items;
}

export function usePartyShows() {
  const [items, setItems] = useState<DbPartyShow[]>([]);
  useEffect(() => {
    supabase
      .from("party_shows")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as DbPartyShow[]));
  }, []);
  return items;
}

export function useSportsSchedule() {
  const [items, setItems] = useState<DbSportsRow[]>([]);
  useEffect(() => {
    supabase
      .from("sports_schedule")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setItems((data ?? []) as DbSportsRow[]));
  }, []);
  return items;
}

export type DbDailySpecial = {
  id: string;
  day: string;
  badge: string;
  title: string;
  description: string;
  price: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export type DbWeeklyPulse = {
  id: string;
  days_label: string;
  title: string;
  copy: string;
  accent: boolean;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

export function useDailySpecialsState() {
  const [items, setItems] = useState<DbDailySpecial[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("daily_specials")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        setItems((data ?? []) as DbDailySpecial[]);
        setLoading(false);
      });
  }, []);
  return { items, loading };
}

export function useDailySpecials() {
  return useDailySpecialsState().items;
}

export function useWeeklyPulseState() {
  const [items, setItems] = useState<DbWeeklyPulse[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("weekly_pulse")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        setItems((data ?? []) as DbWeeklyPulse[]);
        setLoading(false);
      });
  }, []);
  return { items, loading };
}

export function useWeeklyPulse() {
  return useWeeklyPulseState().items;
}


export type DbContactInfo = {
  id: number;
  address_line: string;
  hours_weekday: string;
  hours_weekend: string;
  phone: string;
  email: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  map_embed_url: string;
};

export function useContactInfo() {
  const [info, setInfo] = useState<DbContactInfo | null>(null);
  useEffect(() => {
    (supabase as any)
      .from("contact_info")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }: { data: DbContactInfo | null }) => setInfo(data));
  }, []);
  return info;
}

/** Admin-controlled on/off switches for optional website sections. */
export function useFeatureFlag(key: string, fallback = true) {
  const [enabled, setEnabled] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("site_features")
        .select("enabled")
        .eq("key", key)
        .maybeSingle();
      if (!alive) return;
      if (data) setEnabled(Boolean(data.enabled));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [key]);
  return { enabled, loading };
}

export type DbJobListing = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export function useJobListings() {
  const [items, setItems] = useState<DbJobListing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from("job_listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as DbJobListing[]);
        setLoading(false);
      });
  }, []);
  return { items, loading };
}
