import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Dices, Gamepad2, CircleDot } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Pool, Darts, Board Games & Arcade | Mills Modern Social" },
      { name: "description", content: "The game floor at Mills Modern Social in Tempe: multiple pool tables, dart lanes, a curated board game library, and a full arcade section." },
      { property: "og:title", content: "Play the House — Mills Modern Social" },
      { property: "og:description", content: "Pool, darts, board games, and arcade cabinets — every night." },
    ],
  }),
  component: PlayPage,
});

const activities = [
  {
    icon: CircleDot,
    title: "Pool Tables",
    tag: "MULTIPLE REGULATION TABLES",
    blurb: "Slate-top 8-ft tables kept in tournament condition. Walk in or reserve ahead — no quarters, just craft beer within arm's reach.",
    bullets: ["6+ regulation tables", "Reservable by the hour", "Weekly 9-ball tournament", "Cue rental included"],
  },
  {
    icon: Target,
    title: "Darts",
    tag: "ELECTRONIC & STEEL-TIP",
    blurb: "Dedicated dart lanes with soft-tip electronic boards for casual play and steel-tip for the serious throwers.",
    bullets: ["4 electronic boards", "2 steel-tip lanes", "Tuesday league nights", "House darts available"],
  },
  {
    icon: Dices,
    title: "Board Games",
    tag: "LIBRARY OF 60+ TITLES",
    blurb: "From Catan and Codenames to Ticket to Ride — a curated shelf, free to play with any food or drink order.",
    bullets: ["60+ curated titles", "Free with any order", "Party & strategy sections", "Rules cards on request"],
  },
  {
    icon: Gamepad2,
    title: "Arcade",
    tag: "RETRO + MODERN CABINETS",
    blurb: "Golden Tee, Big Buck Hunter, air hockey, and a rotating pair of classic cabinets from Pac-Man to Street Fighter II.",
    bullets: ["Golden Tee & Big Buck Hunter", "Air hockey + skee-ball", "Rotating retro cabinets", "Racing sim rig"],
  },
];

function PlayPage() {
  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.08),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative">
          <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-4">
            THE GAME FLOOR · TEMPE, AZ
          </span>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6 text-balance">
            Play the <span className="text-accent">house</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-pretty text-lg">
            Six thousand square feet of pool, darts, board games, and arcade cabinets.
            Show up with friends, stay for the food. Every game is walk-in play — grab a
            cue, rack 'em, and order a round from your table.
          </p>
        </div>
      </section>

      {/* Activities grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activities.map((a) => {
            const Icon = a.icon;
            return (
              <article
                key={a.title}
                className="border border-border bg-surface/40 p-8 md:p-10 flex flex-col gap-6 hover:border-accent/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="size-14 grid place-items-center border border-accent/30 bg-accent/5 text-accent shrink-0">
                    <Icon className="size-6" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest text-right">
                    {a.tag}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-4xl md:text-5xl uppercase mb-3 group-hover:text-accent transition-colors">
                    {a.title}
                  </h2>
                  <p className="text-muted-foreground text-pretty">{a.blurb}</p>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-border">
                  {a.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                      <span className="size-1.5 bg-accent shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* House rules strip */}
      <section className="bg-surface border-y border-border py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-mono text-[10px] text-accent tracking-widest mb-2">GAME FLOOR HOURS</div>
            <div className="font-display text-xl uppercase">Daily · 11AM – Close</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-accent tracking-widest mb-2">PRICING</div>
            <div className="font-display text-xl uppercase">Walk-in play · Free w/ order</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-accent tracking-widest mb-2">TABLE RESERVE</div>
            <div className="font-display text-xl uppercase">$15/hr · Text ahead</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-accent tracking-widest mb-2">HOUSE RULE</div>
            <div className="font-display text-xl uppercase">Loser racks, winner pours</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-display text-4xl md:text-5xl uppercase mb-6">
            Book the <span className="text-accent">whole game floor</span>
          </h3>
          <p className="text-muted-foreground mb-8 text-pretty">
            Birthdays, bachelor parties, corporate nights — take over the pool tables, darts,
            and arcade for your crew.
          </p>
          <Link
            to="/party"
            className="inline-block px-10 py-4 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
          >
            Plan a Party →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
