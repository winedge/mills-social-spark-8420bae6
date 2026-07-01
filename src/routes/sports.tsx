import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Circle, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UfcSection, ufcQueryOptions } from "@/components/ufc-section";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "Sports — UFC, Boxing, MLB & FIFA 2026 | Mills Modern Social" },
      { name: "description", content: "Every UFC and boxing PPV, every MLB game, and full FIFA World Cup 2026 coverage — live at Mills Modern Social in Tempe." },
      { property: "og:title", content: "Every game, every night — Mills Modern Social" },
      { property: "og:description", content: "UFC, boxing, MLB, and FIFA 2026 on 40+ screens in Tempe." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ufcQueryOptions),
  component: SportsPage,
});

const pillars = [
  {
    icon: Zap,
    title: "UFC + Boxing",
    tag: "EVERY PPV · SOUND ON",
    blurb: "Main-event screen with stadium audio, every UFC card and major boxing PPV — no cover, no seat charge.",
  },
  {
    icon: Circle,
    title: "MLB",
    tag: "EVERY GAME, EVERY NIGHT",
    blurb: "D-backs first, then every out-of-market matchup on dedicated screens. Ask for your team, we'll put it on.",
  },
  {
    icon: Trophy,
    title: "FIFA World Cup 2026",
    tag: "FULL TOURNAMENT COVERAGE",
    blurb: "Group stage watch parties, opening early for kickoffs, and knockout-round giveaways all the way to the final.",
  },
];

const bigScreen = [
  { league: "MLB", when: "TONIGHT · 6:40 PM", match: "D-BACKS vs DODGERS", note: "Chase Field feed · sound on Screen 1" },
  { league: "UFC", when: "SAT · 7:00 PM", match: "UFC 329 · MAIN CARD", note: "PPV · full audio · reserved booths" },
  { league: "FIFA 2026", when: "JUN 11 · 10:00 AM", match: "USA vs MEXICO · GROUP A", note: "Opening kickoff · brunch service" },
  { league: "BOXING", when: "JUN 21 · 6:00 PM", match: "CANELO vs CRAWFORD", note: "PPV · $10 reserved seat" },
  { league: "MLB", when: "SUN · 1:10 PM", match: "YANKEES vs RED SOX", note: "Screen 4 · sound on request" },
  { league: "FIFA 2026", when: "JUN 15 · 12:00 PM", match: "ARGENTINA vs GERMANY", note: "Watch party · Messi jerseys 10% off" },
];

function SportsPage() {
  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(56,189,248,0.15),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(56,189,248,0.08),transparent_55%)]" />
        <div className="max-w-7xl mx-auto relative">
          <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">
            40+ SCREENS · STADIUM AUDIO
          </span>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6 text-balance">
            Every game. <br />
            <span className="text-accent">every night.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-pretty text-lg">
            UFC and boxing PPVs on the big screen, every MLB game on demand, and full FIFA World
            Cup 2026 coverage — from group-stage kickoffs to the final in New Jersey.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="border border-border bg-surface/40 p-8 flex flex-col gap-4 hover:border-accent/40 transition-colors">
                <div className="size-12 grid place-items-center border border-accent/30 bg-accent/5 text-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-accent tracking-widest mb-2">{p.tag}</div>
                  <h3 className="font-display text-3xl uppercase mb-3">{p.title}</h3>
                  <p className="text-sm text-muted-foreground text-pretty">{p.blurb}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Big screen schedule */}
      <section className="bg-surface border-y border-border py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">BIG SCREEN SCHEDULE</span>
              <h2 className="font-display text-5xl uppercase">This <span className="text-accent">week</span></h2>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest max-w-xs text-right">
              WE'LL PUT ANY GAME ON REQUEST — JUST ASK THE BAR.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {bigScreen.map((g, i) => (
              <div key={i} className="bg-background p-6 flex flex-col gap-2 hover:bg-surface/60 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-accent tracking-widest">{g.league}</span>
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest">{g.when}</span>
                </div>
                <div className="font-display text-2xl uppercase leading-tight">{g.match}</div>
                <div className="text-xs text-muted-foreground mt-1">{g.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live UFC feed */}
      <UfcSection />

      {/* Game day reservation */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-display text-4xl md:text-5xl uppercase mb-6">
            Reserve a table for <span className="text-accent">game day</span>
          </h3>
          <p className="text-muted-foreground mb-8 text-pretty">
            Big fight, playoff game, or World Cup match — lock in a booth in front of the
            screen you want. Group bookings get bottle service and reserved audio.
          </p>
          <Link
            to="/party"
            className="inline-block px-10 py-4 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
          >
            Reserve a Table →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
