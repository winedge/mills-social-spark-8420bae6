import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MediaMasonry } from "@/components/media-masonry";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export function GalleryArchive({ variant }: { variant: "events" | "party" }) {
  return (
    <div className="bg-background text-foreground font-body min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-grow pb-24">
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to={variant === "events" ? "/events" : "/party"}>
              <ArrowLeft aria-hidden="true" /> Back to {variant === "events" ? "Events" : "Party"}
            </Link>
          </Button>
        </div>
        <MediaMasonry variant={variant} archive />
      </main>
      <SiteFooter />
    </div>
  );
}