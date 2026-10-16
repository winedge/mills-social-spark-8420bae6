import { createFileRoute } from "@tanstack/react-router";
import { GalleryArchive } from "@/components/gallery-archive";

export const Route = createFileRoute("/party_/gallery")({
  head: () => ({
    meta: [
      { title: "Party Photo & Video Gallery | Mill's Modern Social" },
      { name: "description", content: "Browse the full collection of party photos and videos from celebrations at Mill's Modern Social in Tempe." },
      { property: "og:title", content: "Party Photo & Video Gallery | Mill's Modern Social" },
      { property: "og:description", content: "Revisit birthdays, private parties, and celebrations in the Mill's Modern Social photo and video gallery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PartyGalleryPage,
});

function PartyGalleryPage() {
  return <GalleryArchive variant="party" />;
}