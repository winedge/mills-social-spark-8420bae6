import { useState } from "react";
import { ArrowUpRight, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StorageImage, useStorageUrl } from "@/components/storage-image";
import { GalleryVideoPreview } from "@/components/gallery-video-preview";
import { useGalleryMedia, type GalleryMedia } from "@/lib/gallery-media";
import concert from "@/assets/party-concert.jpg";
import celebration from "@/assets/party-celebration.jpg";
import dj from "@/assets/party-dj.jpg";
import happyHour from "@/assets/pulse-happy-hour.jpg";
import brunch from "@/assets/pulse-brunch.jpg";
import venue from "@/assets/hero-bar.jpg";
import venueVideo from "@/assets/venue-gallery.webm";

export type { GalleryMedia } from "@/lib/gallery-media";
const eventsMedia: GalleryMedia[] = [
  { src: concert, title: "Live on stage", type: "image" },
  { src: venueVideo, poster: venue, title: "Inside Mill's", type: "video" },
  { src: dj, title: "After dark", type: "image" },
  { src: happyHour, title: "Raise a glass", type: "image" },
  { src: celebration, title: "Good company", type: "image" },
  { src: brunch, title: "Weekend moments", type: "image" },
];
const partyMedia: GalleryMedia[] = [
  { src: celebration, title: "Your people. Your night.", type: "image" },
  { src: venue, title: "Room to celebrate", type: "image" },
  { src: venueVideo, poster: venue, title: "A look inside", type: "video" },
  { src: dj, title: "Set the mood", type: "image" },
  { src: happyHour, title: "The first toast", type: "image" },
  { src: concert, title: "Make it a night", type: "image" },
];

function GalleryVideo({ item }: { item: GalleryMedia }) {
  const src = useStorageUrl(item.src);
  return <video src={src ?? undefined} poster={item.poster} controls autoPlay playsInline preload="metadata" className="gallery-expanded-media" />;
}

export function MediaMasonry({ variant, extra = [], embedded = false }: { variant: "events" | "party"; extra?: GalleryMedia[]; embedded?: boolean }) {
  const uploaded = useGalleryMedia(variant);
  const items = [...uploaded, ...extra, ...(variant === "events" ? eventsMedia : partyMedia)];
  const [selected, setSelected] = useState<number | null>(null);
  const item = selected === null ? undefined : items[selected];
  return (
    <section className="py-16 md:py-24 border-t border-border" aria-label={`${variant} photo and video gallery`}>
      <div className={`max-w-7xl mx-auto ${embedded ? "" : "px-6"}`}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-xs text-accent uppercase mb-3">The social edit / {variant === "events" ? "01" : "02"}</p>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-tight">{variant === "events" ? "Moments at Mill's" : "Made for your moments"}</h2>
          </div>
          <span className="text-sm text-muted-foreground">{variant === "events" ? "Music. People. A little after dark." : "Big nights. Small details. Good company."}</span>
        </div>
        <div className={`media-masonry media-masonry-${variant}`}>
          {items.map((media, index) => (
            <figure key={`${media.src}-${index}`} className="media-tile group" data-media-reveal>
              <Button variant="ghost" className="media-tile-button" aria-label={`${media.type === "video" ? "Play" : "View"} ${media.title}`} onClick={() => setSelected(index)}>
                {media.type === "video" ? <GalleryVideoPreview item={media} /> : <StorageImage src={media.src} alt={media.title} loading="lazy" className="media-tile-image" />}
                <span className="media-tile-shade" />
                <span className="absolute top-4 left-4 font-mono text-xs text-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="absolute top-4 right-4 size-9 grid place-items-center bg-background/60 text-foreground rounded-full">
                  {media.type === "video" ? <Play /> : <ArrowUpRight />}
                </span>
                <span className="absolute bottom-5 left-5 right-5 text-left font-display text-2xl uppercase text-foreground whitespace-normal">{media.title}</span>
              </Button>
            </figure>
          ))}
        </div>
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="gallery-dialog max-w-5xl w-[calc(100%-2rem)] p-4 md:p-6">
          <DialogTitle className="font-display uppercase text-2xl pr-8">{item?.title}</DialogTitle>
          <DialogDescription className="sr-only">Photos and videos at Mill's Modern Social.</DialogDescription>
          {item && (item.type === "video" ? <GalleryVideo key={item.src} item={item} /> : <StorageImage src={item.src} alt={item.title} className="gallery-expanded-media" />)}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" aria-label="Previous media" onClick={() => setSelected((value) => value === null ? null : (value - 1 + items.length) % items.length)}><ChevronLeft /></Button>
            <span className="font-mono text-xs text-muted-foreground">{selected === null ? 0 : selected + 1} / {items.length}</span>
            <Button variant="outline" size="icon" aria-label="Next media" onClick={() => setSelected((value) => value === null ? null : (value + 1) % items.length)}><ChevronRight /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}