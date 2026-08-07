import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { openReservation } from "@/components/reservation-modal";
import { Calendar, Music, Trophy, Star, Clock } from "lucide-react";
import { useWeeklyPulseState } from "@/lib/content";

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
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { items: events, loading } = useWeeklyPulseState();

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

          {/* Grid Layout for Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[16/9] bg-surface animate-pulse border border-border" />
              ))
            ) : (
              events.map((event, i) => (
                <div 
                  key={event.id || i}
                  className="group relative overflow-hidden border border-border bg-surface hover:border-accent/50 transition-all duration-500"
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img
                      src={event.image_url || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 left-4 bg-accent text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-lg">
                      {event.days_label}
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      {i % 2 === 0 ? <Music className="size-4 text-accent" /> : <Trophy className="size-4 text-accent" />}
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {event.accent ? "Special Event" : "Weekly Series"}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl uppercase mb-3 group-hover:text-accent transition-colors">
                      {event.title}
                    </h2>
                    <p className="text-muted-foreground mb-8 line-clamp-2">
                      {event.copy}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        <Clock className="size-3" />
                        Check Socials for Times
                      </div>
                      <button 
                        onClick={() => openReservation()}
                        className="text-xs font-bold uppercase tracking-widest border-b border-accent pb-1 hover:text-accent transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CTA Section */}
          <div className="relative overflow-hidden border-2 border-accent/20 bg-surface p-12 text-center">
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
              <button 
                onClick={() => openReservation()}
                className="px-10 py-4 border border-border hover:bg-muted font-bold uppercase tracking-widest text-sm transition-colors"
              >
                Inquire Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
