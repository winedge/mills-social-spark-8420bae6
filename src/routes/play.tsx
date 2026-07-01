import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Dices, Gamepad2, CircleDot, Trophy, Zap, Clock, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import poolImg from "@/assets/play-pool.jpg.asset.json";
import dartsImg from "@/assets/play-darts.jpg.asset.json";
import boardImg from "@/assets/play-boardgames.jpg.asset.json";
import arcadeImg from "@/assets/play-arcade.jpg.asset.json";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play — Pool, Darts, Board Games & Arcade | Mills Modern Social" },
      { name: "description", content: "The game floor at Mills Modern Social in Tempe: multiple pool tables, dart lanes, a curated board game library, and a full arcade section." },
      { property: "og:title", content: "Play the House — Mills Modern Social" },
      { property: "og:description", content: "Pool, darts, board games, and arcade cabinets — every night." },
      { property: "og:image", content: arcadeImg.url },
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
  return (
    <section className="relative py-20 md:py-28 px-6 border-b border-border overflow-hidden">
      {/* Playful floating shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-10 left-[8%] size-24 rounded-full bg-accent/30 blur-2xl" />
        <div className="absolute bottom-10 right-[12%] size-32 bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 size-16 bg-yellow-400/20 blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/5 px-3 py-1.5 mb-6">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] text-accent tracking-widest">GAME FLOOR OPEN NOW</span>
        </div>

        <h1 className="font-display text-6xl md:text-[10rem] uppercase leading-[0.85] mb-6 text-balance">
          Push <span className="text-accent">start.</span>
          <br />
          Skip <span className="italic font-body font-light lowercase tracking-tight">the small talk.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-pretty text-lg mb-10">
          Four game zones under one roof. Rack a game of nine ball, throw for the bull, dice
          with strangers, or pump quarters into a neon cabinet. Food and drinks come to you.
        </p>

        {/* Zone jump nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
          {[
            { href: "#pool", label: "Pool", icon: CircleDot },
            { href: "#darts", label: "Darts", icon: Target },
            { href: "#board", label: "Board Games", icon: Dices },
            { href: "#arcade", label: "Arcade", icon: Gamepad2 },
          ].map((z) => {
            const I = z.icon;
            return (
              <a
                key={z.href}
                href={z.href}
                className="group border border-border bg-surface/40 px-4 py-3 flex items-center gap-2 hover:border-accent hover:bg-accent/10 transition-all"
              >
                <I className="size-4 text-accent shrink-0" />
                <span className="font-mono text-xs uppercase tracking-widest group-hover:text-accent">
                  {z.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- POOL — green felt, chalk, ball numbers ---------- */
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
          "radial-gradient(ellipse at 30% 40%, #14532d 0%, #052e1a 45%, #020a06 100%)",
      }}
    >
      {/* Chalk texture */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px, 60px 60px",
        }}
      />
      {/* Wood rail top and bottom */}
      <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-amber-900 to-amber-950" />
      <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-amber-900 to-amber-950" />

      <div className="max-w-7xl mx-auto relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[10px] tracking-[0.3em] text-emerald-300/70">
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

          <h2 className="font-display text-6xl md:text-8xl uppercase text-emerald-50 mb-6 leading-[0.9]">
            Rack <span className="text-yellow-300">'em</span> up
          </h2>
          <p className="text-emerald-100/70 text-lg mb-8 text-pretty max-w-lg">
            Six tournament-grade 8-foot slates. Fresh felt, level rails, and cues that don't
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
                className="border border-emerald-400/20 bg-emerald-950/40 backdrop-blur-sm px-4 py-3 flex items-baseline justify-between"
              >
                <span className="font-mono text-[10px] text-emerald-300/60 uppercase tracking-widest">
                  {f.k}
                </span>
                <span className="font-display text-lg text-yellow-300">{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image framed like a pool table */}
        <div className="relative">
          <div className="relative border-[10px] border-amber-900 shadow-2xl rounded-sm overflow-hidden">
            <img
              src={poolImg.url}
              alt="Freshly racked pool table"
              loading="lazy"
              width={1280}
              height={960}
              className="w-full h-auto block"
            />
            {/* Corner pockets */}
            <div className="absolute -top-3 -left-3 size-6 bg-black rounded-full border-2 border-amber-950" />
            <div className="absolute -top-3 -right-3 size-6 bg-black rounded-full border-2 border-amber-950" />
            <div className="absolute -bottom-3 -left-3 size-6 bg-black rounded-full border-2 border-amber-950" />
            <div className="absolute -bottom-3 -right-3 size-6 bg-black rounded-full border-2 border-amber-950" />
          </div>
          {/* Floating chalk cube */}
          <div className="absolute -top-6 -right-6 size-14 bg-blue-500 rotate-12 shadow-xl grid place-items-center text-white font-mono text-[9px] uppercase tracking-widest hidden md:grid">
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

/* ---------- ARCADE — full neon synthwave, pixel scan lines ---------- */
function ArcadeSection() {
  const cabinets = [
    { name: "Golden Tee", hi: "482,910", color: "text-fuchsia-300" },
    { name: "Big Buck Hunter", hi: "1,204,500", color: "text-cyan-300" },
    { name: "NBA Jam", hi: "128 pts", color: "text-yellow-300" },
    { name: "Street Fighter II", hi: "9-STRIKE", color: "text-pink-300" },
    { name: "Pac-Man", hi: "999,990", color: "text-yellow-400" },
    { name: "Skee-Ball", hi: "540", color: "text-fuchsia-400" },
  ];
  return (
    <section
      id="arcade"
      className="relative py-24 md:py-32 px-6 border-b border-border overflow-hidden bg-[#0a0118]"
    >
      {/* Grid floor synthwave */}
      <div
        className="absolute bottom-0 inset-x-0 h-1/2 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(transparent 96%, #d946ef 96%), linear-gradient(90deg, transparent 96%, #06b6d4 96%)",
          backgroundSize: "80px 80px",
          transform: "perspective(400px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />
      {/* Sun */}
      <div
        className="absolute top-20 right-10 size-64 rounded-full pointer-events-none opacity-70"
        style={{ background: "radial-gradient(circle, #f0abfc 0%, #d946ef 40%, transparent 70%)" }}
      />
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0 1px, transparent 1px 3px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <span className="font-mono text-[10px] tracking-[0.3em] text-cyan-300 block mb-4">
            ZONE 04 · INSERT COIN
          </span>
          <h2
            className="font-display text-6xl md:text-9xl uppercase leading-none mb-4"
            style={{
              background: "linear-gradient(180deg, #fef08a 0%, #f0abfc 45%, #d946ef 55%, #7e22ce 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 40px rgba(217,70,239,0.4)",
            }}
          >
            Arcade
          </h2>
          <p className="text-cyan-100/80 text-lg text-pretty max-w-xl mx-auto font-mono uppercase tracking-widest text-xs">
            &gt; Press start to play. High scores live forever.
          </p>
        </div>

        {/* Big arcade photo */}
        <div className="relative mb-10 border-4 border-fuchsia-500/60 shadow-[0_0_60px_rgba(217,70,239,0.5)]">
          <img
            src={arcadeImg.url}
            alt="Neon-lit arcade cabinets"
            loading="lazy"
            width={1280}
            height={960}
            className="w-full h-auto block"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118] via-transparent to-transparent" />
          {/* Corner CRT badge */}
          <div className="absolute top-3 left-3 font-mono text-[10px] text-cyan-300 tracking-widest bg-black/60 px-2 py-1 border border-cyan-400/40">
            ● REC · CH 03
          </div>
          <div className="absolute bottom-3 right-3 font-mono text-[10px] text-fuchsia-300 tracking-widest bg-black/60 px-2 py-1 border border-fuchsia-400/40 animate-pulse">
            PRESS START
          </div>
        </div>

        {/* Cabinet high-score board */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cabinets.map((c) => (
            <div
              key={c.name}
              className="relative border-2 border-fuchsia-500/40 bg-black/60 backdrop-blur-sm p-4 hover:border-cyan-400 transition-colors group"
            >
              <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] tracking-widest text-cyan-300">CABINET</span>
                <Zap className="size-3 text-fuchsia-400" />
              </div>
              <div className="font-display text-2xl uppercase text-white mb-3 group-hover:text-fuchsia-300 transition-colors">
                {c.name}
              </div>
              <div className="flex items-baseline justify-between border-t border-fuchsia-500/20 pt-2">
                <span className="font-mono text-[10px] tracking-widest text-fuchsia-300/70">HI-SCORE</span>
                <span className={`font-mono text-lg tabular-nums ${c.color}`}>{c.hi}</span>
              </div>
            </div>
          ))}
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
