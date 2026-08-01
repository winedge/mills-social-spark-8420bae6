import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Circle, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UfcSection, ufcQueryOptions } from "@/components/ufc-section";
import { NflSection, nflQueryOptions } from "@/components/nfl-section";
import { useSportsSchedule } from "@/lib/content";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "Sports — NFL, UFC, Boxing, MLB & FIFA 2026 | Mills Modern Social" },
      { name: "description", content: "Live NFL scoreboard, every UFC and boxing PPV, every MLB game, and full FIFA World Cup 2026 coverage — live at Mills Modern Social in Tempe." },
      { property: "og:title", content: "Every game, every night — Mills Modern Social" },
      { property: "og:description", content: "NFL, UFC, boxing, MLB, and FIFA 2026 on 40+ screens in Tempe." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ufcQueryOptions),
      context.queryClient.ensureQueryData(nflQueryOptions),
    ]),
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

function SportsPage() {
  const dbSchedule = useSportsSchedule();
  const bigScreen = dbSchedule.map((s) => ({
    league: s.league,
    when: s.when_label,
    match: s.match_label,
    note: s.note,
  }));
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
