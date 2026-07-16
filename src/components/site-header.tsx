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
      <div className="w-full px-8 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-8">
        <div className="hidden md:flex justify-between items-center text-xs font-semibold uppercase tracking-widest">
          {navLinks.slice(0, 3).map((l) => (
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
        <Link to="/" className="flex items-center justify-center min-w-0" aria-label="Mills Modern Social — Home">
          <img
            src={millsLogo.url}
            alt="Mill's Modern Social"
            width={260}
            height={60}
            className="h-12 md:h-14 w-auto object-contain"
          />
        </Link>
        <div className="hidden md:flex justify-between items-center text-xs font-semibold uppercase tracking-widest">
          {navLinks.slice(3).map((l) => (
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
          <Link
            to="/party"
            className="bg-primary text-primary-foreground px-5 py-2 text-xs font-bold uppercase hover:bg-accent transition-colors"
          >
            Book Table
          </Link>
        </div>
        <div className="md:hidden flex justify-end col-start-3">
          <button
            className="p-2 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "text-accent" }}
                activeOptions={{ exact: true }}
                className="py-3 text-sm font-semibold uppercase tracking-widest border-b border-border/50 hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/party"
              onClick={() => setOpen(false)}
              className="mt-3 bg-accent text-primary-foreground px-5 py-3 text-xs font-bold uppercase text-center"
            >
              Book Table
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
