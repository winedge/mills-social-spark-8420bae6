import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbMenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: number | null;
  category: string;
  tag: string | null;
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
