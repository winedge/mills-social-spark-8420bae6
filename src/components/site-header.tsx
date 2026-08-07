import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Instagram, Facebook, Twitter, Music2 } from "lucide-react";
import millsLogo from "@/assets/mills-logo.png";
import { openReservation } from "@/components/reservation-modal";
import { useContactInfo } from "@/lib/content";

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
  { to: "/events", label: "Events" },
  { to: "/sports", label: "Sports" },
  { to: "/play", label: "Play" },
  { to: "/party", label: "Party" },
  { to: "/contact", label: "Contact" },
  { to: "/careers", label: "Join Our Team" },
] as const;

export function SiteHeader({ showTicker = true }: { showTicker?: boolean }) {
  const [open, setOpen] = useState(false);
  const contact = useContactInfo();

  const socialLinks = [
    { icon: Instagram, href: contact?.instagram_url || "#", label: "Instagram", color: "#E4405F" },
    { icon: Facebook, href: contact?.facebook_url || "#", label: "Facebook", color: "#1877F2" },
    { icon: Twitter, href: contact?.x_url || "#", label: "X", color: "#FFFFFF" },
    { icon: Music2, href: contact?.tiktok_url || "#", label: "TikTok", color: "#FFFFFF" },
  ];

  return (
    <>
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
          <div className="flex items-center gap-6 md:justify-self-start">
            <Link to="/" className="flex items-center min-w-0" aria-label="Mills Modern Social - Home">
              <img
                src={millsLogo}
                alt="Mill's Modern Social"
                width={260}
                height={60}
                className="h-10 md:h-16 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[17px] font-semibold uppercase tracking-widest md:justify-self-center">
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
          <div className="hidden md:flex md:justify-self-end items-center gap-4">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:brightness-125 transition-all duration-300"
                style={{ color: s.color }}
                aria-label={s.label}
              >
                <s.icon className="size-5" />
              </a>
            ))}
          </div>


          {!open && (
            <button
              className="md:hidden size-11 grid place-items-center border border-border bg-surface hover:border-accent hover:text-accent transition-colors"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <div
        className={`md:hidden fixed inset-0 z-[100] transition-[opacity,backdrop-filter] duration-500 ease-out ${
          open
            ? "opacity-100 pointer-events-auto backdrop-blur-xl bg-background/95"
            : "opacity-0 pointer-events-none backdrop-blur-0 bg-background/0"
        }`}
        aria-hidden={!open}
      >
        {/* Radial accent glow */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.15), transparent 60%)",
          }}
        />

        <div
          className={`relative h-20 px-4 flex items-center justify-between border-b border-border transition-all duration-500 ${
            open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
        >
          <span className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
            Menu
          </span>
          <button
            className="size-11 grid place-items-center border border-border bg-surface hover:border-accent hover:text-accent transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative flex flex-col h-[calc(100%-5rem)] overflow-y-auto">
          <nav className="flex-1 px-6 py-4 flex flex-col">
            {navLinks.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "text-accent" }}
                activeOptions={{ exact: true }}
                style={{
                  transitionDelay: open ? `${120 + i * 60}ms` : "0ms",
                }}
                className={`group flex items-baseline justify-between py-5 border-b border-border/60 hover:text-accent transition-all duration-500 ease-out ${
                  open
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-6"
                }`}
              >
                <span className="font-display text-4xl uppercase tracking-tight">
                  {l.label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-accent tracking-widest">
                  0{i + 1}
                </span>
              </Link>
            ))}
          </nav>

          <div
            className={`p-6 space-y-4 transition-all duration-500 ease-out ${
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: open ? `${120 + navLinks.length * 60}ms` : "0ms" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openReservation();
              }}
              className="block w-full bg-[#4FC3F7] text-black px-5 py-4 text-sm font-bold uppercase text-center tracking-widest hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Book a Table
            </button>
            <div className="flex justify-center gap-8 mb-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:brightness-125 transition-all duration-300"
                  style={{ color: s.color }}
                >
                  <s.icon className="size-6" />
                </a>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground text-center uppercase tracking-widest">
              83 E Broadway Rd · Tempe, AZ
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

