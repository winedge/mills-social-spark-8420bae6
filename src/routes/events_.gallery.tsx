import { createFileRoute } from "@tanstack/react-router";
import { GalleryArchive } from "@/components/gallery-archive";

export const Route = createFileRoute("/events_/gallery")({
  head: () => ({
    meta: [
      { title: "Events Photo & Video Gallery | Mill's Modern Social" },
      { name: "description", content: "Explore the full collection of event photos and videos from Mill's Modern Social in Tempe." },
      { property: "og:title", content: "Events Photo & Video Gallery | Mill's Modern Social" },
      { property: "og:description", content: "Music, celebrations, and memories: event photos and videos at Mill's Modern Social in Tempe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsGalleryPage,
});

function EventsGalleryPage() {
  return <GalleryArchive variant="events" />;
}