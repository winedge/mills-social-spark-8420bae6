import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import heroBar from "@/assets/hero-bar.jpg";
import menuBurger from "@/assets/menu-burger.jpg";
import menuCocktail from "@/assets/menu-cocktail.jpg";
import menuWings from "@/assets/menu-wings.jpg";
import pulseHappyHour from "@/assets/pulse-happy-hour.jpg";
import pulseTrivia from "@/assets/pulse-trivia.jpg";
import pulseLiveMusic from "@/assets/pulse-live-music.jpg";
import pulseBrunch from "@/assets/pulse-brunch.jpg";
import millsLogo from "@/assets/mills-logo.png.asset.json";
import { getUfcFights } from "@/lib/ufc.functions";

const ufcQueryOptions = queryOptions({
  queryKey: ["ufc", "fights"],
  queryFn: () => getUfcFights(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
});


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mills Modern Social — Tempe's Modern Sports Bar" },
      {
        name: "description",
        content:
          "Mills Modern Social in Tempe, AZ — elevated bar fare, craft cocktails, 40+ screens, live UFC fights, and the loudest game day in Arizona.",
      },
      { property: "og:title", content: "Mills Modern Social — Tempe's Modern Sports Bar" },
      {
        property: "og:description",
        content: "Elevated bar fare, craft cocktails, live UFC nights, and the loudest game day in Arizona.",
      },
      { property: "og:image", content: heroBar },
      { name: "twitter:image", content: heroBar },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ufcQueryOptions),
  component: Home,
});

const tickerItems = [
  "LIVE: SUNS @ BUCKS · Q3 84-79",
  "UPCOMING: ASU vs ARIZONA · SAT 7PM",
  "HAPPY HOUR · MON–WED · 4–7PM",
  "TRIVIA NIGHT · THU 8PM · $50 BAR TAB",
  "UFC FIGHT NIGHT · EVERY SATURDAY · NO COVER",
  "GAME DAY BRUNCH · SAT–SUN · 10AM",
];

const dailySpecials = [
  {
    img: menuBurger,
    day: "MONDAY",
    badge: "1/2 OFF",
    title: "Burger Night",
    desc: "Every Mill Burger and Tempe Smash — half price all night.",
    price: "from $8",
  },
  {
    img: menuWings,
    day: "TUESDAY",
    badge: "$1 EACH",
    title: "Wing It",
    desc: "Dollar wings, any flavor, with any pitcher of draft beer.",
    price: "$1 / wing",
  },
  {
    img: menuCocktail,
    day: "WEDNESDAY",
    badge: "2 FOR 1",
    title: "Craft Cocktail Night",
    desc: "Two-for-one on every house cocktail from 6PM to close.",
    price: "from $7",
  },
];

const schedule = [
  { days: "MON–WED", title: "HAPPY HOUR", copy: "4PM–7PM. $2 off all drafts & signature cocktails.", accent: false, img: pulseHappyHour },
  { days: "THURSDAY", title: "TRIVIA NIGHT", copy: "8PM start. Win a $50 bar tab. Hosted by DJ Mac.", accent: true, img: pulseTrivia },
  { days: "FRIDAY", title: "LIVE SESSIONS", copy: "Local artists 9PM–late. High-energy acoustic sets.", accent: false, img: pulseLiveMusic },
  { days: "SAT–SUN", title: "GAME DAY BRUNCH", copy: "Open early for kickoff. Bottomless mimosas & sliders.", accent: true, img: pulseBrunch },
];

const scoreboard = [
  { league: "NCAAF · LIVE", a: "ASU", aScore: "24", b: "OREGON", bScore: "21", status: "4TH QTR · 08:12", live: true },
  { league: "NBA · TONIGHT", a: "SUNS", aScore: "—", b: "LAKERS", bScore: "—", status: "TIP-OFF 7:30 PM MST", live: false },
  { league: "MLB · FINAL", a: "D-BACKS", aScore: "8", b: "DODGERS", bScore: "2", status: "FINAL", live: false },
];

function formatFightDate(iso: string | null) {
  if (!iso) return "TBD";
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return "TBD";
  return d
    .toLocaleString("en-US", {
      timeZone: "America/Phoenix",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase();
}

function EventCard({ event, live }: { event: import("@/lib/ufc.functions").UfcEvent; live?: boolean }) {
  const main = event.mainEvent;
  const a = main?.fighterA;
  const b = main?.fighterB;
  const isFinal = event.status.toLowerCase() === "final";
  return (
    <article className="bg-background border border-border p-6 flex flex-col gap-4 group hover:border-accent/50 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="font-display text-lg uppercase truncate">{event.name}</div>
          <div className="font-mono text-[10px] text-accent tracking-widest mt-1">
            {main?.weightClass || "UFC"} · MAIN EVENT
          </div>
        </div>
        {live ? (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-red-500 tracking-widest">
            <span className="size-2 bg-red-500 rounded-full animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest whitespace-nowrap">
            {isFinal ? "FINAL" : formatFightDate(event.dateTime)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 my-2">
        <div className="text-right">
          <div className={`font-display text-xl uppercase leading-tight ${a?.winner ? "text-accent" : ""}`}>
            {a?.name || "TBD"}
          </div>
          {a && (a.wins !== null || a.losses !== null) && (
            <div className="font-mono text-[10px] text-muted-foreground mt-1">
              {a.wins ?? 0}-{a.losses ?? 0}-{a.draws ?? 0}
            </div>
          )}
        </div>
        <div className="font-display text-accent text-lg">VS</div>
        <div className="text-left">
          <div className={`font-display text-xl uppercase leading-tight ${b?.winner ? "text-accent" : ""}`}>
            {b?.name || "TBD"}
          </div>
          {b && (b.wins !== null || b.losses !== null) && (
            <div className="font-mono text-[10px] text-muted-foreground mt-1">
              {b.wins ?? 0}-{b.losses ?? 0}-{b.draws ?? 0}
            </div>
          )}
        </div>
      </div>

      <div className="font-mono text-[10px] text-muted-foreground tracking-widest border-t border-border pt-3 flex justify-between">
        <span>
          {main?.resultType
            ? `${main.resultType.toUpperCase()} · R${main.resultRound ?? "-"}`
            : `BEST OF ${main?.rounds ?? 5} ROUNDS`}
        </span>
        <span>{event.fights.length} FIGHTS</span>
      </div>
    </article>
  );
}

function useCountdown(iso: string | null) {
  const target = iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, done: diff === 0 };
}

function NextEventCountdown({ event }: { event: import("@/lib/ufc.functions").UfcEvent }) {
  const c = useCountdown(event.dateTime);
  if (!c) return null;
  const parts = [
    { v: c.d, l: "DAYS" },
    { v: c.h, l: "HRS" },
    { v: c.m, l: "MIN" },
    { v: c.s, l: "SEC" },
  ];
  return (
    <div className="border border-accent/30 bg-accent/5 p-6 mb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] text-accent tracking-widest mb-1">
            NEXT FIGHT NIGHT · COUNTDOWN
          </div>
          <div className="font-display text-2xl md:text-3xl uppercase leading-tight">
            {event.name}
          </div>
        </div>
        <div className="flex gap-4">
          {parts.map((p) => (
            <div key={p.l} className="text-center min-w-[52px]">
              <div className="font-display text-3xl md:text-4xl text-accent tabular-nums">
                {String(p.v).padStart(2, "0")}
              </div>
              <div className="font-mono text-[9px] text-muted-foreground tracking-widest">
                {p.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UfcSection() {
  const { data, dataUpdatedAt, isFetching } = useSuspenseQuery(ufcQueryOptions);
  const live = data.live ?? [];
  const upcoming = data.upcoming ?? [];
  const recent = data.recent ?? [];
  const featured = [...live, ...upcoming, ...recent].slice(0, 6);
  const nextEvent = live[0] ?? upcoming[0] ?? null;
  const updated = new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
    timeZone: "America/Phoenix",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <section id="ufc" className="py-24 px-6 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">
              OCTAGON HQ · POWERED BY SPORTSDATAIO
            </span>
            <h3 className="font-display text-5xl md:text-6xl uppercase mb-4">
              UFC <span className="text-accent">fight nights</span>
            </h3>
            <p className="text-muted-foreground text-pretty">
              Every card, every main event — live at Mills. Grab a booth, order a
              round, and watch the octagon on the loudest screens in Tempe.
            </p>
          </div>
          <div className="flex gap-6 font-mono text-[10px] tracking-widest">
            <div>
              <div className="text-muted-foreground">LIVE</div>
              <div className="text-accent text-2xl font-display">{live.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">UPCOMING</div>
              <div className="text-2xl font-display">{upcoming.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">RECENT</div>
              <div className="text-2xl font-display">{recent.length}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground tracking-widest mb-6">
          <span className={`size-1.5 rounded-full ${isFetching ? "bg-accent animate-pulse" : "bg-accent/50"}`} />
          AUTO-REFRESH · EVERY 60s · LAST UPDATE {updated} MST
        </div>

        {nextEvent && <NextEventCountdown event={nextEvent} />}



        {!data.configured && (
          <div className="border border-accent/40 bg-accent/5 p-6 font-mono text-xs text-muted-foreground">
            UFC feed not configured yet. Add your SportsDataIO MMA API key to see
            live fights here.
          </div>
        )}

        {data.configured && featured.length === 0 && (
          <div className="border border-border p-8 font-mono text-xs text-muted-foreground text-center">
            No upcoming or live UFC events on the SportsDataIO feed right now.
            Check back closer to the next fight night.
          </div>
        )}

        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((evt) => (
              <EventCard
                key={evt.eventId}
                event={evt}
                live={live.some((l) => l.eventId === evt.eventId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


function Home() {
  return (
    <div className="bg-background text-foreground font-body">
      {/* Nav + ticker */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="overflow-hidden whitespace-nowrap py-2 bg-accent text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest">
          <div className="inline-block animate-marquee">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="mx-6">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Mills Modern Social — Home">
            <img
              src={millsLogo.url}
              alt="Mill's Modern Social"
              width={200}
              height={44}
              className="h-9 md:h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden md:flex gap-8 text-xs font-semibold uppercase tracking-widest">
            <Link to="/menu" className="hover:text-accent transition-colors">Menu</Link>
            <a href="#sports" className="hover:text-accent transition-colors">Sports</a>
            <a href="#ufc" className="hover:text-accent transition-colors">UFC</a>
            <a href="#specials" className="hover:text-accent transition-colors">Specials</a>
            <a href="#events" className="hover:text-accent transition-colors">Events</a>
            <a href="#visit" className="hover:text-accent transition-colors">Visit</a>
          </div>
          <button className="bg-primary text-primary-foreground px-5 py-2 text-xs font-bold uppercase hover:bg-accent hover:text-primary-foreground transition-colors">
            Book Table
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[92vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroBar}
          alt="Mills Modern Social bar interior in Tempe, Arizona"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/80" />
        <h1
          aria-hidden
          className="font-display text-[18vw] leading-[0.8] uppercase tracking-tighter opacity-[0.06] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none whitespace-nowrap"
        >
          MILLS
        </h1>
        <div className="relative z-10 text-center px-6 animate-slide-up max-w-4xl">
          <span className="block font-mono text-accent text-xs md:text-sm mb-6 tracking-[0.3em]">
            TEMPE, AZ · MODERN SPORTS SOCIAL
          </span>
          <h2 className="font-display text-6xl md:text-8xl lg:text-9xl uppercase leading-[0.9] mb-8 text-balance">
            The new standard <br />
            of <span className="text-accent">game night</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-pretty">
            40+ screens. Stadium-grade audio. A chef-driven kitchen and a craft bar.
            Every seat is the best seat in the house.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="px-10 py-4 bg-accent text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform inline-block"
            >
              Explore Menu
            </Link>
            <a
              href="#ufc"
              className="px-10 py-4 border border-foreground/20 bg-foreground/5 backdrop-blur-sm font-bold uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-all"
            >
              UFC Fight Card
            </a>
          </div>
        </div>
      </section>

      {/* Scoreboard */}
      <section id="sports" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
            <div>
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">ON AIR NOW</span>
              <h3 className="font-display text-5xl uppercase">Live from the scoreboard</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">UPDATES EVERY 60s</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {scoreboard.map((g) => (
              <div key={g.league} className="bg-background p-8 flex flex-col justify-between min-h-52">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest">{g.league}</span>
                  {g.live && <span className="size-2 bg-red-500 rounded-full animate-pulse" />}
                </div>
                <div className="space-y-2 my-6">
                  <div className="flex justify-between font-display text-3xl uppercase">
                    <span>{g.a}</span>
                    <span className={g.live ? "text-accent" : ""}>{g.aScore}</span>
                  </div>
                  <div className="flex justify-between font-display text-3xl uppercase">
                    <span>{g.b}</span>
                    <span>{g.bScore}</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{g.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UFC */}
      <UfcSection />

      {/* Daily Specials */}
      <section id="specials" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">
                THIS WEEK · ON ROTATION
              </span>
              <h3 className="font-display text-5xl uppercase mb-4">
                Daily <span className="text-accent">Specials</span>
              </h3>
              <p className="text-muted-foreground text-pretty">
                A new reason to show up every night of the week. House specials, big
                discounts, and the best bar food in Tempe.
              </p>
            </div>
            <Link
              to="/menu"
              className="font-mono text-xs border-b border-accent pb-1 tracking-widest hover:text-accent transition-colors"
            >
              VIEW FULL MENU →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dailySpecials.map((s) => (
              <article key={s.day} className="group relative">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-surface relative">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-accent text-black font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                    {s.day}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm font-display text-xl uppercase px-3 py-1.5 text-accent">
                    {s.badge}
                  </div>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-wide">{s.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  </div>
                  <span className="font-mono text-accent text-sm shrink-0 whitespace-nowrap">
                    {s.price}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly schedule */}
      <section id="events" className="bg-surface py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">EVERY WEEK</span>
            <h3 className="font-display text-5xl uppercase">
              Weekly <span className="text-accent">pulse</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {schedule.map((s) => (
              <div key={s.title} className="bg-background flex flex-col group overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-surface relative">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <span
                    className={`absolute top-4 left-4 font-mono text-[10px] tracking-widest px-2 py-1 ${
                      s.accent ? "bg-accent text-black" : "bg-background/80 text-foreground"
                    }`}
                  >
                    {s.days}
                  </span>
                </div>
                <div className="p-6">
                  <h5 className="font-display text-2xl uppercase mb-2">{s.title}</h5>
                  <p className="text-sm text-muted-foreground">{s.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit / Footer */}
      <footer id="visit" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <div className="font-display text-6xl md:text-7xl uppercase mb-8 leading-[0.9]">
              Come <br />
              <span className="text-accent">hang.</span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <p>425 S MILL AVE, TEMPE, AZ 85281</p>
              <p className="text-muted-foreground">SUN–THU · 11AM – 12AM</p>
              <p className="text-muted-foreground">FRI–SAT · 11AM – 2AM</p>
              <p className="text-muted-foreground pt-3">(480) 555-0142</p>
            </div>
          </div>
          <div className="bg-accent/5 p-10 md:p-12 border border-accent/20 flex flex-col justify-between gap-12">
            <div>
              <h6 className="font-display text-3xl uppercase mb-4">Join the circle</h6>
              <p className="text-sm text-muted-foreground mb-8">
                Big games, watch parties, and private events — straight to your inbox.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-3 border-b border-foreground/20 pb-2"
              >
                <input
                  type="email"
                  required
                  placeholder="EMAIL ADDRESS"
                  className="bg-transparent flex-1 py-2 text-sm outline-none font-mono placeholder:text-muted-foreground"
                />
                <button className="font-display text-sm tracking-widest uppercase hover:text-accent transition-colors">
                  Join →
                </button>
              </form>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Instagram</a>
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">X / Twitter</a>
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">TikTok</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2 opacity-50 text-[10px] font-mono tracking-tighter">
          <span>© 2026 MILLS MODERN SOCIAL · ALL RIGHTS RESERVED</span>
          <span>TEMPE, ARIZONA</span>
        </div>
      </footer>
    </div>
  );
}
