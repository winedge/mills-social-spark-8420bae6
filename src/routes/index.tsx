import { createFileRoute, Link } from "@tanstack/react-router";

import heroBar from "@/assets/hero-bar.jpg";
import heroVideo from "@/assets/hero-loop.mp4.asset.json";
import menuBurger from "@/assets/menu-burger.jpg";
import menuCocktail from "@/assets/menu-cocktail.jpg";
import menuWings from "@/assets/menu-wings.jpg";
import pulseHappyHour from "@/assets/pulse-happy-hour.jpg";
import pulseTrivia from "@/assets/pulse-trivia.jpg";
import pulseLiveMusic from "@/assets/pulse-live-music.jpg";
import pulseBrunch from "@/assets/pulse-brunch.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UfcSection, ufcQueryOptions } from "@/components/ufc-section";

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

const hours = [
  { label: "Sunday", time: "11 AM – 10 PM", highlight: false },
  { label: "Monday", time: "3 PM – 10 PM", highlight: false },
  { label: "Tuesday – Wednesday", time: "11 AM – 10 PM", highlight: false },
  { label: "Thursday, Friday + Saturday", time: "11 AM – 2 AM", highlight: true },
];

function OpenStatus() {
  const [open, setOpen] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const ranges: Record<number, [number, number] | null> = {
      0: [11 * 60, 22 * 60], // Sunday 11am-10pm
      1: [15 * 60, 22 * 60], // Monday 3pm-10pm
      2: [11 * 60, 22 * 60], // Tuesday
      3: [11 * 60, 22 * 60], // Wednesday
      4: [11 * 60, 26 * 60], // Thursday 11am-2am (next day)
      5: [11 * 60, 26 * 60], // Friday
      6: [11 * 60, 26 * 60], // Saturday
    };

    const range = ranges[day];
    let isOpen = false;
    if (range) {
      const [start, end] = range;
      isOpen = currentMinutes >= start && currentMinutes < end;
    }
    setOpen(isOpen);
  }, []);

  if (open === null) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
        <span className="size-2 rounded-full bg-muted-foreground" />
        Check Hours
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase">
      <span className={`size-2 rounded-full ${open ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
      {open ? "Open Now" : "Closed Now"}
    </span>
  );
}

function Home() {
  return (
    <div className="bg-background text-foreground font-body">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[75vh] min-h-[560px] flex items-center justify-center overflow-hidden">
        <video
          src={heroVideo.url}
          poster={heroBar}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
        <h1
          aria-hidden
          className="font-display text-[12vw] leading-[0.8] uppercase tracking-tighter opacity-[0.05] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none whitespace-nowrap"
        >
          MILLS
        </h1>
        <div className="relative z-10 text-center px-6 animate-slide-up max-w-5xl">
          <span className="block font-mono text-accent text-xs md:text-sm mb-3 tracking-[0.3em]">
            TEMPE, AZ · MODERN SPORTS SOCIAL
          </span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase leading-[1.05] tracking-tight mb-4 text-balance">
            Where Tempe comes to watch, eat & celebrate
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-base md:text-lg text-pretty">
            Ice-cold drinks. Scratch-made food. Every big game on the biggest screens.
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Link
              to="/party"
              className="px-8 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform inline-block"
            >
              Reserve a Table
            </Link>
            <Link
              to="/menu"
              className="px-8 py-3 border border-foreground/20 bg-surface/80 backdrop-blur-sm font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Location & Hours — Venue Ticket */}
      <section className="px-6 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface border border-border overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left: Location */}
              <div className="lg:col-span-5 p-8 md:p-10 relative flex flex-col justify-between min-h-[260px]">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:24px_24px]" />
                <div className="relative z-10">
                  <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">FIND US</span>
                  <h3 className="font-display text-3xl md:text-4xl uppercase leading-tight mb-4">
                    On the corner of Mill Ave & Broadway Rd
                  </h3>
                  <p className="text-muted-foreground text-lg">Tempe, Arizona</p>
                </div>
                <div className="relative z-10 mt-8 flex items-center gap-4">
                  <a
                    href="https://maps.google.com/?q=Mill+Ave+and+Broadway+Rd+Tempe+AZ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-xs tracking-widest border-b border-accent pb-1 hover:text-accent transition-colors"
                  >
                    <span className="size-2 rounded-full bg-accent animate-pulse" />
                    GET DIRECTIONS →
                  </a>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="hidden lg:flex lg:col-span-1 relative items-center justify-center">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-border" />
                <div className="relative z-10 bg-surface border border-border rounded-full size-10 flex items-center justify-center">
                  <span className="text-accent">★</span>
                </div>
              </div>

              {/* Right: Hours */}
              <div className="lg:col-span-6 p-8 md:p-10 bg-background/50">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-accent text-xs tracking-[0.3em]">HOURS</span>
                  <OpenStatus />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hours.map((h) => (
                    <div
                      key={h.label}
                      className="group p-4 border border-border bg-surface hover:border-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                          {h.label}
                        </span>
                        {h.highlight && (
                          <span className="shrink-0 font-mono text-[9px] bg-accent text-primary-foreground px-1.5 py-0.5 uppercase tracking-wider">
                            Late
                          </span>
                        )}
                      </div>
                      <p className="font-display text-xl md:text-2xl uppercase mt-2 tracking-wide">{h.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  <div className="absolute top-4 left-4 bg-accent text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <span
                    className={`absolute top-4 left-4 font-mono text-[10px] tracking-widest px-2 py-1 ${
                      s.accent ? "bg-accent text-primary-foreground" : "bg-background/80 text-foreground"
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

      <SiteFooter />
    </div>
  );
}
