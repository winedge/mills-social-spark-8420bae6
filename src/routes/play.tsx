import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Target, Dices, Gamepad2, CircleDot, Trophy, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import playHero from "@/assets/play-hero.jpg.asset.json";
import poolImg from "@/assets/play-pool.jpg.asset.json";
import dartsImg from "@/assets/play-darts.jpg.asset.json";
import boardImg from "@/assets/play-boardgames.jpg.asset.json";
import arcadeImg from "@/assets/play-arcade.jpg.asset.json";
import arcade1 from "@/assets/arcade-1.jpg.asset.json";
import arcade2 from "@/assets/arcade-2.jpg.asset.json";
import arcade3 from "@/assets/arcade-3.jpg.asset.json";
import arcade4 from "@/assets/arcade-4.jpg.asset.json";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Pool, Darts, Board Games & Arcade | Mills Modern Social" },
      { name: "description", content: "The game floor at Mills Modern Social in Tempe: multiple pool tables, dart lanes, a curated board game library, and a full arcade section." },
      { property: "og:title", content: "Play the House — Mills Modern Social" },
      { property: "og:description", content: "Pool, darts, board games, and arcade cabinets — every night." },
      { property: "og:image", content: playHero.url },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <div className="bg-background text-foreground font-body min-h-screen overflow-hidden">
      <SiteHeader />

      <PlayHero />
      <PoolSection />
      <DartsSection />
      <BoardSection />
      <ArcadeSection />
      <HouseRules />

      <SiteFooter />
    </div>
  );
}

/* ---------- HERO ---------- */
function PlayHero() {
  const zones = [
    { href: "#pool", label: "Pool", icon: CircleDot },
    { href: "#darts", label: "Darts", icon: Target },
    { href: "#board", label: "Board Games", icon: Dices },
    { href: "#arcade", label: "Arcade", icon: Gamepad2 },
  ];

  return (
    <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-end border-b border-border overflow-hidden">
      {/* Background image */}
      <img
        src={playHero.url}
        alt="Mills Modern Social game floor with pool tables, dart boards, and arcade cabinets"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/40 px-3 py-1.5 mb-5">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[10px] text-accent tracking-widest">GAME FLOOR OPEN NOW</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] mb-5 text-balance">
            Game on <span className="text-accent">at Mills</span>
          </h1>
          <p className="text-foreground/70 max-w-xl text-pretty text-base md:text-lg mb-8">
            Four game zones under one roof. Rack a game of nine ball, throw for the bull,
            dice with strangers, or pump quarters into a neon cabinet — all with food and
            drinks delivered to you.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Link
              to="/party"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
            >
              Book the Game Floor
            </Link>
            <a
              href="#pool"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-border bg-background/60 hover:border-accent hover:text-accent font-mono uppercase tracking-widest text-xs transition-colors"
            >
              Explore Zones
            </a>
          </div>

          {/* Zone jump chips */}
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => {
              const I = z.icon;
              return (
                <a
                  key={z.href}
                  href={z.href}
                  className="group inline-flex items-center gap-2 px-3 py-2 bg-surface/70 border border-border hover:border-accent hover:bg-accent/10 transition-colors"
                >
                  <I className="size-3.5 text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-widest group-hover:text-accent">
                    {z.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- POOL — tournament blue felt, black rails, chalk ---------- */
function PoolSection() {
  const balls = [
    { n: 1, color: "bg-yellow-400", text: "text-black" },
    { n: 8, color: "bg-black", text: "text-white" },
    { n: 9, color: "bg-yellow-400", text: "text-black", stripe: true },
    { n: 15, color: "bg-red-800", text: "text-white", stripe: true },
  ];
  return (
    <section
      id="pool"
      className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, #0e7490 0%, #083344 45%, #020c14 100%)",
      }}
    >
      {/* Felt texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px, 60px 60px",
        }}
      />
      {/* Black rail top and bottom */}
      <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]" />
      <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a]" />

      <div className="max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/70">
              ZONE 01 · THE FELT
            </span>
            <div className="flex gap-1.5">
              {balls.map((b) => (
                <div
                  key={b.n}
                  className={`size-6 rounded-full ${b.color} ${b.text} grid place-items-center text-[10px] font-bold shadow-lg relative overflow-hidden`}
                >
                  {b.stripe && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2/5 bg-white" />
                  )}
                  <span className="relative z-10 grid place-items-center bg-white text-black rounded-full size-3 text-[8px]">
                    {b.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="font-display text-6xl md:text-8xl uppercase text-cyan-50 mb-6 leading-[0.9]">
            Rack <span className="text-cyan-300">'em</span> up
          </h2>
          <p className="text-cyan-100/70 text-lg mb-8 text-pretty max-w-lg">
            Six tournament-grade 8-foot Diamond slates. Fresh blue felt, level rails, and cues that don't
            warp. Walk in solo and get on the winners' table, or reserve ahead for the crew.
          </p>

          {/* Feature chips styled like a scorecard */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { k: "Tables", v: "6" },
              { k: "Reserve", v: "$15/hr" },
              { k: "Cue rental", v: "Free" },
              { k: "9-ball night", v: "Weds" },
            ].map((f) => (
              <div
                key={f.k}
                className="border border-cyan-400/20 bg-cyan-950/40 backdrop-blur-sm px-4 py-3 flex items-baseline justify-between"
              >
                <span className="font-mono text-[10px] text-cyan-300/60 uppercase tracking-widest">
                  {f.k}
                </span>
                <span className="font-display text-lg text-cyan-300">{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image framed like a pool table */}
        <div className="relative">
          <div className="relative border-[10px] border-[#1a1a1a] shadow-2xl rounded-sm overflow-hidden">
            <img
              src={poolImg.url}
              alt="Diamond pool tables with tournament blue felt"
              loading="lazy"
              width={1280}
              height={960}
              className="w-full h-auto block"
            />
            {/* Corner pockets */}
            <div className="absolute -top-3 -left-3 size-6 bg-black rounded-full border-2 border-[#0a0a0a]" />
            <div className="absolute -top-3 -right-3 size-6 bg-black rounded-full border-2 border-[#0a0a0a]" />
            <div className="absolute -bottom-3 -left-3 size-6 bg-black rounded-full border-2 border-[#0a0a0a]" />
            <div className="absolute -bottom-3 -right-3 size-6 bg-black rounded-full border-2 border-[#0a0a0a]" />
          </div>
          {/* Floating chalk cube */}
          <div className="absolute -top-6 -right-6 size-14 bg-cyan-400 rotate-12 shadow-xl grid place-items-center text-black font-mono text-[9px] uppercase tracking-widest hidden md:grid">
            Chalk
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- DARTS — bullseye rings, red/green/cream ---------- */
function DartsSection() {
  return (
    <section
      id="darts"
      className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden bg-[#f3ead5]"
    >
      {/* Concentric bullseye rings behind everything */}
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 size-[600px] rounded-full border-[40px] border-red-700/10 pointer-events-none" />
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 size-[440px] rounded-full border-[30px] border-green-800/10 pointer-events-none" />
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 size-[280px] rounded-full border-[20px] border-red-700/15 pointer-events-none" />
      <div className="absolute -left-40 top-1/2 -translate-y-1/2 size-[120px] rounded-full bg-red-700/20 pointer-events-none" />

      {/* Brick wall stripe top */}
      <div
        className="absolute top-0 inset-x-0 h-6 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #7c2d12 0 60px, transparent 60px 64px), repeating-linear-gradient(0deg, transparent 0 20px, #7c2d12 20px 22px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
        {/* Image with target rings */}
        <div className="relative order-2 lg:order-1">
          <div className="absolute inset-0 -m-6 rounded-full border-2 border-dashed border-red-700/40 pointer-events-none" />
          <div className="relative shadow-2xl">
            <img
              src={dartsImg.url}
              alt="Three darts in the bullseye"
              loading="lazy"
              width={1280}
              height={960}
              className="w-full h-auto block"
            />
            {/* Score chip */}
            <div className="absolute top-4 right-4 bg-green-800 text-cream text-[#f3ead5] px-4 py-2 shadow-xl rotate-3">
              <div className="font-mono text-[9px] tracking-widest opacity-80">TRIPLE 20</div>
              <div className="font-display text-3xl leading-none">180</div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 text-red-950">
          <span className="font-mono text-[10px] tracking-[0.3em] text-red-700 block mb-4">
            ZONE 02 · CHECK YOUR AIM
          </span>
          <h2 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6">
            Aim <span className="text-green-800">small,</span> <br />
            <span className="text-red-700">miss small.</span>
          </h2>
          <p className="text-red-950/70 text-lg mb-8 text-pretty max-w-lg">
            Four electronic soft-tip lanes for quick games with friends and two steel-tip
            boards for the sharpshooters. Tuesday night league starts 7PM — walk-ons welcome.
          </p>

          {/* Score-style stats */}
          <div className="border-4 border-red-950 bg-[#e6dcbf] p-1 max-w-md">
            <div className="border-2 border-dashed border-red-950/30 p-4 grid grid-cols-3 gap-4">
              {[
                { k: "E-Boards", v: "4" },
                { k: "Steel-tip", v: "2" },
                { k: "League", v: "TUE" },
              ].map((f) => (
                <div key={f.k} className="text-center">
                  <div className="font-display text-4xl text-red-700 leading-none">{f.v}</div>
                  <div className="font-mono text-[9px] tracking-widest text-red-950/70 mt-1">
                    {f.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- BOARD GAMES — warm wood, cards, dice ---------- */
function BoardSection() {
  const games = [
    "Catan", "Codenames", "Ticket to Ride", "Wingspan", "Bananagrams",
    "Uno", "Exploding Kittens", "7 Wonders", "Azul", "Skull", "Jenga",
    "Scrabble", "Chess", "Cribbage", "Dominion", "Coup",
  ];
  return (
    <section
      id="board"
      className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 70% 30%, #78350f 0%, #431407 60%, #1c0a02 100%)",
      }}
    >
      {/* Wood grain lines */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 80px, rgba(0,0,0,0.4) 80px 82px, transparent 82px 200px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          <div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-amber-300/70 block mb-4">
              ZONE 03 · THE LIBRARY
            </span>
            <h2 className="font-display text-6xl md:text-8xl uppercase text-amber-50 leading-[0.9] mb-6">
              Roll the <br />
              <span className="text-amber-400 italic">dice.</span>
            </h2>
            <p className="text-amber-100/70 text-lg mb-8 text-pretty max-w-lg">
              A shelf of 60+ curated titles — from party favorites to euro-strategy heavy
              hitters. Free to play with any food or drink order. Just ask, we'll bring
              the box and the rules card.
            </p>

            {/* Playing card + dice cluster */}
            <div className="flex items-center gap-4 mb-8">
              {["A♠", "K♥", "Q♣"].map((c, i) => (
                <div
                  key={c}
                  className={`w-16 h-24 bg-amber-50 rounded-lg shadow-2xl border border-amber-950 flex flex-col p-2 ${
                    i === 0 ? "-rotate-6" : i === 2 ? "rotate-6" : ""
                  }`}
                >
                  <span className={`font-display text-lg leading-none ${c.includes("♥") ? "text-red-600" : "text-black"}`}>
                    {c}
                  </span>
                  <span className={`font-display text-3xl mt-auto self-end leading-none ${c.includes("♥") ? "text-red-600" : "text-black"}`}>
                    {c.slice(-1)}
                  </span>
                </div>
              ))}
              {/* Die */}
              <div className="w-14 h-14 bg-amber-50 rounded-lg shadow-2xl relative rotate-12 ml-2">
                {[[1,1],[1,3],[3,1],[3,3],[2,2]].map(([r,c],i) => (
                  <span key={i} className="absolute size-2 rounded-full bg-black"
                    style={{ top: `${r*22 - 4}%`, left: `${c*22 - 4}%` }} />
                ))}
              </div>
            </div>

            <div className="inline-flex items-center gap-3 border border-amber-400/30 bg-amber-950/40 px-4 py-2">
              <Trophy className="size-4 text-amber-400" />
              <span className="font-mono text-xs uppercase tracking-widest text-amber-100">
                Board Game Night · Sundays 6PM
              </span>
            </div>
          </div>

          {/* Photo + game shelf */}
          <div>
            <div className="relative rounded-sm overflow-hidden shadow-2xl mb-4 border-2 border-amber-900/60">
              <img
                src={boardImg.url}
                alt="Board game pieces on a warm wooden table"
                loading="lazy"
                width={1280}
                height={960}
                className="w-full h-auto block"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/40 via-transparent to-transparent" />
            </div>

            {/* "Bookshelf" of game titles */}
            <div className="flex flex-wrap gap-2 p-4 border-y-4 border-amber-900/70 bg-amber-950/40 backdrop-blur-sm">
              {games.map((g, i) => (
                <span
                  key={g}
                  className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border ${
                    i % 4 === 0
                      ? "bg-red-900/60 border-red-700/50 text-red-100"
                      : i % 4 === 1
                      ? "bg-amber-500/20 border-amber-400/40 text-amber-100"
                      : i % 4 === 2
                      ? "bg-emerald-900/50 border-emerald-600/40 text-emerald-100"
                      : "bg-blue-900/50 border-blue-500/40 text-blue-100"
                  }`}
                >
                  {g}
                </span>
              ))}
              <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 text-amber-300/70 border border-dashed border-amber-400/30">
                + 44 more
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- ARCADE — simple cabinet slideshow ---------- */
function ArcadeSection() {
  const slides = [
    { img: arcade1.url, name: "Pac-Man", tag: "Classic Maze" },
    { img: arcade2.url, name: "Golden Tee", tag: "Trackball Golf" },
    { img: arcade3.url, name: "Big Buck Hunter", tag: "Light Gun" },
    { img: arcade4.url, name: "Skee-Ball", tag: "Ticket Redemption" },
  ];
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = (dir: number) => setI((p) => (p + dir + n) % n);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n]);

  return (
    <section
      id="arcade"
      className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden bg-surface"
    >
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-10">
          <span className="font-mono text-[10px] tracking-[0.3em] text-accent block mb-4">
            ZONE 04 · INSERT COIN
          </span>
          <h2 className="font-display text-6xl md:text-8xl uppercase leading-none mb-4">
            The <span className="text-accent">Arcade</span>
          </h2>
          <p className="text-muted-foreground text-lg text-pretty max-w-xl mx-auto">
            A rotating lineup of classic cabinets. Bring quarters — or don't, they're on us
            during happy hour.
          </p>
        </div>

        {/* Slideshow */}
        <div className="relative">
          <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden border border-border bg-background">
            {slides.map((s, idx) => (
              <img
                key={s.name}
                src={s.img}
                alt={`${s.name} arcade cabinet`}
                loading="lazy"
                width={1280}
                height={960}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  idx === i ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            {/* Caption */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 md:p-8">
              <div className="font-mono text-[10px] tracking-widest text-white/70 mb-1">
                {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {slides[i].tag}
              </div>
              <div className="font-display text-3xl md:text-5xl uppercase text-white">
                {slides[i].name}
              </div>
            </div>

            {/* Arrows */}
            <button
              onClick={() => go(-1)}
              aria-label="Previous cabinet"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-11 grid place-items-center bg-background/80 hover:bg-accent hover:text-primary-foreground border border-border transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next cabinet"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-11 grid place-items-center bg-background/80 hover:bg-accent hover:text-primary-foreground border border-border transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((s, idx) => (
              <button
                key={s.name}
                onClick={() => setI(idx)}
                aria-label={`Show ${s.name}`}
                className={`h-1.5 transition-all ${
                  idx === i ? "w-10 bg-accent" : "w-6 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- HOUSE RULES ---------- */
function HouseRules() {
  const rules = [
    { icon: Clock, k: "Game floor hours", v: "Daily · 11AM – Close" },
    { icon: Users, k: "Walk-in play", v: "Free with any order" },
    { icon: CircleDot, k: "Table reserve", v: "$15/hr · Text ahead" },
    { icon: Trophy, k: "House rule", v: "Loser racks, winner pours" },
  ];
  return (
    <>
      <section className="bg-surface border-y border-border py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {rules.map((r) => {
            const I = r.icon;
            return (
              <div key={r.k} className="flex items-start gap-4">
                <div className="size-10 grid place-items-center border border-accent/30 bg-accent/5 text-accent shrink-0">
                  <I className="size-4" />
                </div>
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground tracking-widest mb-1 uppercase">
                    {r.k}
                  </div>
                  <div className="font-display text-lg uppercase">{r.v}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-display text-4xl md:text-6xl uppercase mb-6 leading-tight">
            Book the <span className="text-accent">whole game floor</span>
          </h3>
          <p className="text-muted-foreground mb-8 text-pretty max-w-xl mx-auto">
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
    </>
  );
}
