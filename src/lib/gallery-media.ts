import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GalleryMedia = { src: string; title: string; type: "image" | "video"; poster?: string };
export type GalleryVariant = "events" | "party";
export const galleryManifestPath = (variant: GalleryVariant) => `galleries/${variant}/media.json`;

export async function loadGalleryMedia(variant: GalleryVariant): Promise<GalleryMedia[]> {
  const { data, error } = await supabase.storage.from("site-media").download(galleryManifestPath(variant));
  if (error || !data) return [];
  const items: unknown = JSON.parse(await data.text());
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is GalleryMedia => typeof item?.src === "string" && typeof item?.title === "string" && (item?.type === "image" || item?.type === "video"));
}

export async function saveGalleryMedia(variant: GalleryVariant, items: GalleryMedia[]) {
  const { error } = await supabase.storage.from("site-media").upload(galleryManifestPath(variant), new Blob([JSON.stringify(items)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw error;
}

export function useGalleryMedia(variant: GalleryVariant) {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  useEffect(() => {
    let alive = true;
    loadGalleryMedia(variant).then((media) => { if (alive) setItems(media); }).catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [variant]);
  return items;
}