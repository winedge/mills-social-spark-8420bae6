import { createFileRoute } from "@tanstack/react-router";
import heroBar from "@/assets/hero-bar.jpg";
import menuBurger from "@/assets/menu-burger.jpg";
import menuCocktail from "@/assets/menu-cocktail.jpg";
import menuWings from "@/assets/menu-wings.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mills Modern Social — Tempe's Modern Sports Bar" },
      {
        name: "description",
        content:
          "Mills Modern Social in Tempe, AZ — elevated bar fare, craft cocktails, 40+ screens, and the loudest game day in Arizona.",
      },
      { property: "og:title", content: "Mills Modern Social — Tempe's Modern Sports Bar" },
      {
        property: "og:description",
        content: "Elevated bar fare, craft cocktails, and the loudest game day in Arizona.",
      },
      { property: "og:image", content: heroBar },
      { name: "twitter:image", content: heroBar },
    ],
  }),
  component: Home,
});

const tickerItems = [
  "LIVE: SUNS @ BUCKS · Q3 84-79",
  "UPCOMING: ASU vs ARIZONA · SAT 7PM",
  "HAPPY HOUR · MON–WED · 4–7PM",
  "TRIVIA NIGHT · THU 8PM · $50 BAR TAB",
  "LIVE: D-BACKS vs PADRES · 1ST 2-0",
  "GAME DAY BRUNCH · SAT–SUN · 10AM",
];

const menu = [
  {
    img: menuBurger,
    title: "The Mill Burger",
    desc: "Wagyu blend, caramelized onion, truffle aioli, brioche.",
    price: "$18",
  },
  {
    img: menuCocktail,
    title: "Desert Heat Old Fashioned",
    desc: "Local bourbon, ancho chili, charred orange zest.",
    price: "$14",
  },
  {
    img: menuWings,
    title: "Sticky Social Wings",
    desc: "Gochujang glaze, pickled radish, toasted sesame.",
    price: "$16",
  },
];

const schedule = [
  { days: "MON–WED", title: "HAPPY HOUR", copy: "4PM–7PM. $2 off all drafts & signature cocktails.", accent: false },
  { days: "THURSDAY", title: "TRIVIA NIGHT", copy: "8PM start. Win a $50 bar tab. Hosted by DJ Mac.", accent: true },
  { days: "FRIDAY", title: "LIVE SESSIONS", copy: "Local artists 9PM–late. High-energy acoustic sets.", accent: false },
  { days: "SAT–SUN", title: "GAME DAY BRUNCH", copy: "Open early for kickoff. Bottomless mimosas & sliders.", accent: true },
];

const scoreboard = [
  { league: "NCAAF · LIVE", a: "ASU", aScore: "24", b: "OREGON", bScore: "21", status: "4TH QTR · 08:12", live: true },
  { league: "NBA · TONIGHT", a: "SUNS", aScore: "—", b: "LAKERS", bScore: "—", status: "TIP-OFF 7:30 PM MST", live: false },
  { league: "MLB · FINAL", a: "D-BACKS", aScore: "8", b: "DODGERS", bScore: "2", status: "FINAL", live: false },
];

function Home() {
  return (
    <div className="bg-background text-foreground font-body">
      {/* Nav + ticker */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="overflow-hidden whitespace-nowrap py-2 bg-accent text-black font-mono text-[10px] font-bold uppercase tracking-widest">
          <div className="inline-block animate-marquee">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="mx-6">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-display text-2xl tracking-tighter uppercase italic">
            Mills<span className="text-accent">.</span>
          </a>
          <div className="hidden md:flex gap-8 text-xs font-semibold uppercase tracking-widest">
            <a href="#menu" className="hover:text-accent transition-colors">Menu</a>
            <a href="#sports" className="hover:text-accent transition-colors">Sports</a>
            <a href="#events" className="hover:text-accent transition-colors">Events</a>
            <a href="#visit" className="hover:text-accent transition-colors">Visit</a>
          </div>
          <button className="bg-foreground text-background px-5 py-2 text-xs font-bold uppercase hover:bg-accent transition-colors">
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
            <a
              href="#menu"
              className="px-10 py-4 bg-accent text-black font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
            >
              Explore Menu
            </a>
            <a
              href="#sports"
              className="px-10 py-4 border border-foreground/20 bg-foreground/5 backdrop-blur-sm font-bold uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-all"
            >
              Tonight's Lineup
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

      {/* Menu */}
      <section id="menu" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <span className="font-mono text-accent text-xs tracking-[0.3em] block mb-3">THE KITCHEN & BAR</span>
              <h3 className="font-display text-5xl uppercase mb-4">
                Not your average <span className="text-accent">pub grub</span>
              </h3>
              <p className="text-muted-foreground text-pretty">
                Craft cocktails, local Arizona drafts, and a kitchen that doesn't believe in frozen
                appetizers. Elevated social food for the modern spectator.
              </p>
            </div>
            <a href="#" className="font-mono text-xs border-b border-accent pb-1 tracking-widest">
              VIEW FULL MENU →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {menu.map((m) => (
              <article key={m.title} className="group">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-surface">
                  <img
                    src={m.img}
                    alt={m.title}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-display text-2xl uppercase tracking-wide">{m.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                  </div>
                  <span className="font-mono text-accent text-lg">{m.price}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border border border-border">
            {schedule.map((s) => (
              <div key={s.title} className="bg-background p-8">
                <span
                  className={`font-mono text-xs mb-4 block tracking-widest ${
                    s.accent ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {s.days}
                </span>
                <h5 className="font-display text-2xl uppercase mb-2">{s.title}</h5>
                <p className="text-sm text-muted-foreground">{s.copy}</p>
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
