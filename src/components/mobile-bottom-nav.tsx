import { Link, useRouterState } from "@tanstack/react-router";

const GOLD = "#E9B949";
const GOLD_SOFT = "rgba(233,185,73,0.55)";

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8Z" transform="rotate(-30 12 12)" />
      <path d="M9 12h6M12 10v4M10 11v2M14 11v2" transform="rotate(-30 12 12)" />
    </svg>
  );
}

function PlateForkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 4v4" />
    </svg>
  );
}

function UtensilsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v10" />
      <path d="M9 3v5a3 3 0 0 0 6 0V3" />
      <path d="M12 13v8" />
    </svg>
  );
}

function DrumsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8Z" />
      <ellipse cx="12" cy="8" rx="7" ry="2" />
      <path d="M8 10v9M12 10v10M16 10v9" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4c0 8 7 15 15 15l1.5-3.5-4-2-2 2c-2.5-1.5-4.5-3.5-6-6l2-2-2-4L5 4Z" />
    </svg>
  );
}

const items: Array<{
  to: string;
  label: string;
  Icon: (props: { className?: string }) => JSX.Element;
  badge?: string;
}> = [
  { to: "/sports", label: "Sports", Icon: FootballIcon, badge: "HOT" },
  { to: "/play", label: "Play", Icon: PlateForkIcon },
  { to: "/menu", label: "Food Menu", Icon: UtensilsIcon },
  { to: "/party", label: "Party", Icon: DrumsIcon },
  { to: "/#contact", label: "Contact", Icon: PhoneIcon },
];


export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="md:hidden fixed bottom-3 inset-x-3 z-[70] pointer-events-none">
      <div
        className="pointer-events-auto relative rounded-[28px] px-2 py-2"
        style={{
          background:
            "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
          border: `1px solid ${GOLD}`,
          boxShadow: `0 0 0 1px rgba(233,185,73,0.15), 0 0 24px ${GOLD_SOFT}, 0 12px 30px -10px rgba(0,0,0,0.9), inset 0 0 22px rgba(233,185,73,0.08)`,
        }}
      >
        {/* corner accents */}
        <span className="pointer-events-none absolute -top-[3px] left-6 h-[6px] w-16 rounded-full" style={{ background: GOLD, filter: "blur(2px)", opacity: 0.7 }} />
        <span className="pointer-events-none absolute -bottom-[3px] right-6 h-[6px] w-16 rounded-full" style={{ background: GOLD, filter: "blur(2px)", opacity: 0.7 }} />

        <ul className="grid grid-cols-5 items-end">
          {items.map(({ to, label, Icon, badge }) => {
            const path = to.split("#")[0] || "/";
            const isActive =
              path === "/"
                ? pathname === "/"
                : pathname === path || pathname.startsWith(path + "/");

            return (
              <li key={to} className="flex justify-center">
                <Link
                  to={to}
                  className="group relative flex flex-col items-center gap-1.5 px-1 pt-1"
                  aria-label={label}
                >
                  <span className="relative">
                    {badge && !isActive && (
                      <span
                        className="absolute -top-1 -left-2 z-10 rounded-sm px-1 text-[7px] font-black leading-[10px] tracking-wider"
                        style={{ background: GOLD, color: "#0a0a0a" }}
                      >
                        {badge}
                      </span>
                    )}
                    <span
                      className={`grid place-items-center rounded-full transition-all ${
                        isActive ? "size-12 -translate-y-4" : "size-10"
                      }`}
                      style={
                        isActive
                          ? {
                              background: `radial-gradient(circle at 30% 30%, #f5cf6a 0%, ${GOLD} 55%, #a97f1e 100%)`,
                              boxShadow: `0 0 0 3px #0a0a0a, 0 0 0 4px ${GOLD}, 0 0 18px ${GOLD_SOFT}`,
                              color: "#0a0a0a",
                            }
                          : {
                              border: `1px solid ${GOLD}`,
                              color: GOLD,
                              background: "rgba(255,255,255,0.02)",
                            }
                      }
                    >
                      <Icon className="size-5" />
                    </span>
                  </span>
                  <span
                    className="font-mono text-[9px] font-bold tracking-[0.18em] uppercase"
                    style={{ color: isActive ? GOLD : "#f5f5f5" }}
                  >
                    {label}
                  </span>
                  <span
                    className="h-[2px] w-6 rounded-full"
                    style={{ background: isActive ? GOLD : "transparent" }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
