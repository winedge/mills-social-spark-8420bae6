import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import millsLogo from "@/assets/mills-logo.png.asset.json";

const tickerItems = [
  "LIVE: SUNS @ BUCKS · Q3 84-79",
  "UPCOMING: ASU vs ARIZONA · SAT 7PM",
  "HAPPY HOUR · MON–WED · 4–7PM",
  "TRIVIA NIGHT · THU 8PM · $50 BAR TAB",
  "UFC FIGHT NIGHT · EVERY SATURDAY · NO COVER",
  "GAME DAY BRUNCH · SAT–SUN · 10AM",
];

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/sports", label: "Sports" },
  { to: "/play", label: "Play" },
  { to: "/party", label: "Party" },
] as const;

export function SiteHeader({ showTicker = true }: { showTicker?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      {showTicker && (
        <div className="overflow-hidden whitespace-nowrap py-2 bg-accent text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-widest">
          <div className="inline-block animate-marquee">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="mx-6">{t}</span>
            ))}
          </div>
        </div>
      )}
      <div className="w-full px-4 md:px-8 h-20 md:h-28 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-4 md:gap-8">
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-accent" }}
              activeOptions={{ exact: true }}
              className="hover:text-accent transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link to="/" className="flex items-center md:justify-center min-w-0" aria-label="Mills Modern Social — Home">
          <img
            src={millsLogo.url}
            alt="Mill's Modern Social"
            width={260}
            height={60}
            className="h-11 md:h-[72px] w-auto object-contain"
          />
        </Link>
        <div className="hidden md:flex justify-end">
          <Link
            to="/party"
            className="bg-primary text-primary-foreground px-5 py-2 text-xs font-bold uppercase hover:bg-accent transition-colors"
          >
            Book Table
          </Link>
        </div>

        <div className="md:hidden">
          <button
            className="relative z-[70] size-11 grid place-items-center border border-border bg-surface hover:border-accent hover:text-accent transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>


      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}

        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute top-0 right-0 h-full w-[82%] max-w-sm bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-24 px-6 flex items-center justify-between border-b border-border">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
              Menu
            </span>
            <button
              className="size-10 grid place-items-center border border-border hover:border-accent hover:text-accent transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
            {navLinks.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "text-accent" }}
                activeOptions={{ exact: true }}
                className="group flex items-baseline justify-between py-4 border-b border-border/60 hover:text-accent transition-colors"
              >
                <span className="font-display text-3xl uppercase tracking-tight">
                  {l.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-accent tracking-widest">
                  0{i + 1}
                </span>
              </Link>
            ))}
          </nav>

          <div className="p-6 border-t border-border space-y-3">
            <Link
              to="/party"
              onClick={() => setOpen(false)}
              className="block bg-accent text-primary-foreground px-5 py-4 text-xs font-bold uppercase text-center tracking-widest hover:brightness-110 transition"
            >
              Book a Table
            </Link>
            <p className="font-mono text-[10px] text-muted-foreground text-center uppercase tracking-widest">
              Mill Ave & Broadway · Tempe, AZ
            </p>
          </div>
        </aside>
      </div>

    </nav>
  );
}
