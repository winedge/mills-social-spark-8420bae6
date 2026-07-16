import { Link, useRouterState } from "@tanstack/react-router";
import { Trophy, Gamepad2, UtensilsCrossed, PartyPopper, Phone } from "lucide-react";

const items = [
  { to: "/sports", label: "Sports", Icon: Trophy },
  { to: "/play", label: "Play", Icon: Gamepad2 },
  { to: "/menu", label: "Food Menu", Icon: UtensilsCrossed },
  { to: "/party", label: "Party", Icon: PartyPopper },
  { to: "/#contact", label: "Contact", Icon: Phone },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="md:hidden fixed bottom-3 inset-x-3 z-[70] pointer-events-none">
      <nav
        className="pointer-events-auto relative rounded-2xl border border-accent/40 bg-[#0b0b0b]/95 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]"
        style={{
          boxShadow:
            "0 0 0 1px rgba(212,175,55,0.15), 0 10px 30px -10px rgba(0,0,0,0.9), inset 0 0 20px rgba(212,175,55,0.05)",
        }}
      >
        <ul className="grid grid-cols-5 items-end px-2 pt-2 pb-2">
          {items.map(({ to, label, Icon }) => {
            const path = to.split("#")[0] || "/";
            const isActive =
              path === "/"
                ? pathname === "/"
                : pathname === path || pathname.startsWith(path + "/");

            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className="group flex flex-col items-center gap-1 px-1 py-1 min-w-0"
                  aria-label={label}
                >
                  <span
                    className={`grid place-items-center size-11 rounded-full border transition-all ${
                      isActive
                        ? "bg-accent text-primary-foreground border-accent shadow-[0_0_18px_rgba(212,175,55,0.55)] -translate-y-3"
                        : "bg-transparent text-foreground border-border/60 group-hover:border-accent group-hover:text-accent"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <span
                    className={`font-mono text-[9px] tracking-[0.15em] uppercase truncate ${
                      isActive ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`h-0.5 w-5 rounded-full ${
                      isActive ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
