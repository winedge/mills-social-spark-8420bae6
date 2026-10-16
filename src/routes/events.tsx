
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { openReservation } from "@/components/reservation-modal";
import { InquiryForm } from "@/components/inquiry-form";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaMasonry } from "@/components/media-masonry";
import { StorageImage } from "@/components/storage-image";
import concertImg from "@/assets/party-concert.jpg";
import djImg from "@/assets/party-dj.jpg";
import celebrationImg from "@/assets/party-celebration.jpg";
import { usePartyShows } from "@/lib/content";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events - Mill's Modern Social" },
      {
        name: "description",
        content: "Stay updated with the latest events, live music, trivia nights, and game days at Mill's Modern Social in Tempe.",
      },
      { property: "og:title", content: "Events - Mill's Modern Social" },
      {
        property: "og:description",
        content: "Stay updated with the latest events at Mill's Modern Social.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const upcomingEvents = usePartyShows();
  const fallbacks = [concertImg, djImg, celebrationImg];

  return (
    <div className="bg-background text-foreground font-body min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-20 md:pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-16 animate-slide-up">
            <span className="font-mono text-accent text-xs md:text-sm mb-3 tracking-[0.3em] uppercase block">
              Experience The Pulse
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-tighter mb-6">
              Events & <span className="text-accent">Atmosphere</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg md:text-xl">
              From high-energy live music and trivia showdowns to the biggest game day celebrations in Tempe, there's always something happening at Mill's.
            </p>
          </div>

          <section id="upcoming-events" className="mb-20" aria-label="Upcoming events">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="font-mono text-xs text-accent uppercase mb-3">On the calendar</p>
                <h2 className="font-display text-4xl md:text-6xl uppercase">Upcoming <span className="text-accent">Events</span></h2>
              </div>
              <Calendar className="size-7 text-accent" />
            </div>
            {upcomingEvents.length === 0 ? <p className="text-muted-foreground py-6 border-y border-border">New events will be announced soon.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {upcomingEvents.map((event, index) => (
                  <article key={event.id} className="group border-b border-border pb-5" data-media-reveal>
                    <div className="relative aspect-[4/5] overflow-hidden mb-4 rounded-sm">
                      <StorageImage src={event.image_url || fallbacks[index % fallbacks.length]} alt={event.act} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute top-3 left-3 bg-accent text-primary-foreground px-3 py-1.5 font-mono text-xs">{event.event_type}</span>
                    </div>
                    <p className="text-accent font-mono text-xs mb-2">{event.date_label} · {event.time_label}</p>
                    <h3 className="font-display text-2xl uppercase mb-1">{event.act}</h3>
                    <p className="text-sm text-muted-foreground">{event.genre}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
          <div className="mb-16">
            <MediaMasonry variant="events" embedded />
          </div>

          {/* CTA Section */}
          <div className="relative overflow-hidden border-y border-accent/20 py-12 text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
            <h3 className="font-display text-4xl md:text-5xl uppercase mb-6">
              Planning a Private Event?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg">
              Host your next celebration, corporate mixer, or game day party in our dedicated event spaces.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/party"
                className="px-10 py-4 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
              >
                Learn More
              </Link>
              <Button variant="outline"
                onClick={() => openReservation()}
                className="px-10 py-4 border border-border hover:bg-muted font-bold uppercase tracking-widest text-sm transition-colors"
              >
                Inquire Now
              </Button>
            </div>
          </div>
        </div>
      </main>

      <InquiryForm
        kind="events"
        title="Event enquiry"
        blurb="Planning a watch party, birthday, or corporate night? Send us the details and our events team will reply within one business day."
        subjectPlaceholder="Birthday party / corporate mixer"
        messagePlaceholder="Tell us about your event…"
        spaceOptions={[
          "Bar Lounge (up to 60)",
          "Main Dining Room (up to 100)",
          "Flex Room (up to 100)",
          "Main Dining + Flex (up to 250)",
          "Full Buyout (500+)",
        ]}
        note="This request is not a booking. An executive will contact you for confirmation at the earliest."
      />

      <SiteFooter />
    </div>
  );
}
