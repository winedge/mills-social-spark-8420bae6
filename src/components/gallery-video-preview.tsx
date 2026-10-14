import { useEffect, useRef } from "react";
import { useStorageUrl } from "@/components/storage-image";
import type { GalleryMedia } from "@/lib/gallery-media";

export function GalleryVideoPreview({ item }: { item: GalleryMedia }) {
  const video = useRef<HTMLVideoElement>(null);
  const src = useStorageUrl(item.src);
  const poster = useStorageUrl(item.poster);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      if (visible && !motion.matches && !document.hidden) void element.play().catch(() => {});
      else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: 0.1 });
    observer.observe(element);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); element.pause(); motion.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, [src]);
  return <video ref={video} src={src ?? undefined} poster={poster ?? undefined} muted loop playsInline preload="metadata" aria-hidden="true" className="media-tile-image" />;
}