import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StorageImage, useStorageUrl } from "@/components/storage-image";
import { supabase } from "@/integrations/supabase/client";
import { loadGalleryMedia, saveGalleryMedia, type GalleryMedia, type GalleryVariant } from "@/lib/gallery-media";

function Preview({ item }: { item: GalleryMedia }) {
  const src = useStorageUrl(item.src);
  return item.type === "video" ? <video src={src ?? undefined} controls playsInline preload="metadata" className="w-full aspect-video object-cover bg-background" /> : <StorageImage src={item.src} alt={item.title} className="w-full aspect-video object-cover" />;
}

export function AdminGalleryManager({ variant }: { variant: GalleryVariant }) {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    loadGalleryMedia(variant).then((data) => { if (alive) setItems(data); }).catch(() => { if (alive) setError("Couldn't load the gallery. Please try again."); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [variant]);

  const persist = async (next: GalleryMedia[]) => {
    await saveGalleryMedia(variant, next);
    setItems(next);
    setSaved(true);
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-display text-2xl uppercase">{variant === "events" ? "Moments at Mill's" : "Made for your moments"}</h3>
      <Button disabled={busy} onClick={() => picker.current?.click()}><Upload className="size-4" /> Upload photos / videos</Button>
      <input ref={picker} type="file" multiple accept="image/*,video/*" aria-label={`Upload ${variant} gallery files`} className="hidden" disabled={busy} onChange={async (event) => {
        const files = Array.from(event.target.files ?? []);
        if (!files.length) return;
        setBusy(true); setError(""); setSaved(false);
        const paths: string[] = [];
        try {
          const added: GalleryMedia[] = [];
          for (const file of files) {
            if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("Please select photos or videos.");
            const path = `galleries/${variant}/${crypto.randomUUID()}.${file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin"}`;
            const { error: uploadError } = await supabase.storage.from("site-media").upload(path, file, { contentType: file.type });
            if (uploadError) throw uploadError;
            paths.push(path);
            added.push({ src: `storage://site-media/${path}`, title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), type: file.type.startsWith("video/") ? "video" : "image" });
          }
          await persist([...added, ...items]);
        } catch (err) {
          if (paths.length) await supabase.storage.from("site-media").remove(paths);
          setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        } finally { setBusy(false); event.target.value = ""; }
      }} />
    </div>
    {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Saving gallery…</p>}
    {error && <p role="alert" className="text-sm text-foreground">{error}</p>}
    {saved && <p role="status" className="text-sm text-accent">Gallery saved</p>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item, index) => <article key={item.src} className="border border-border overflow-hidden rounded-sm">
        <Preview item={item} />
        <div className="p-3 space-y-3">
          <input aria-label={`Media title ${index + 1}`} value={item.title} disabled={busy} className="w-full h-10 px-3 border border-border bg-background text-sm" onChange={(e) => { setSaved(false); setItems((current) => current.map((media, i) => i === index ? { ...media, title: e.target.value } : media)); }} />
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await persist(items); } catch { setError("Couldn't save changes. Please try again."); } finally { setBusy(false); } }}><Save className="size-4" /> Save title</Button>
            <Button variant="outline" size="icon" disabled={busy} aria-label={`Remove ${item.title}`} onClick={async () => {
              setBusy(true); setError("");
              try {
                await persist(items.filter((_, i) => i !== index));
                const prefix = "storage://site-media/";
                if (item.src.startsWith(`${prefix}galleries/${variant}/`)) await supabase.storage.from("site-media").remove([item.src.slice(prefix.length)]);
              } catch { setError("Couldn't remove media. Please try again."); } finally { setBusy(false); }
            }}><Trash2 className="size-4" /></Button>
          </div>
        </div>
      </article>)}
    </div>
  </div>;
}