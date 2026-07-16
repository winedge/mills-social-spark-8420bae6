import { useRouterState } from "@tanstack/react-router";
import { Trophy, CircleDot, Utensils, PartyPopper, Phone, type LucideIcon } from "lucide-react";

const ACCENT = "#38bdf8";
const ACCENT_SOFT = "rgba(56,189,248,0.55)";
const ACCENT_DIM = "rgba(56,189,248,0.25)";

type Item = {
  to: string;
  label: string;
  Icon: LucideIcon;
  center?: boolean;
};

const items: Item[] = [
  { to: "/sports", label: "Sports", Icon: Trophy },
  { to: "/play", label: "Play", Icon: CircleDot },
  { to: "/menu", label: "Food Menu", Icon: Utensils, center: true },
  { to: "/events", label: "Party", Icon: PartyPopper },
  { to: "/contact", label: "Contact", Icon: Phone },
];

function isActivePath(pathname: string, to: string) {
  const path = to.split("#")[0] || "/";
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(path + "/");
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-[95%] max-w-md pointer-events-auto relative">
        {/* Bar */}
        <div
          className="relative h-[72px] rounded-[36px] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(21,21,21,0.92) 0%, rgba(10,10,10,0.94) 100%)",
            border: `1px solid ${ACCENT_DIM}`,
            boxShadow: `0 20px 40px -18px rgba(0,0,0,0.9), 0 0 0 1px rgba(231,184,75,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
          }}
        >
          {/* subtle gold top hairline */}
          <span
            className="pointer-events-none absolute inset-x-10 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${ACCENT_SOFT}, transparent)`,
            }}
          />

          <ul className="relative grid grid-cols-5 h-full">
            {items.map((it) => {
              const active = isActivePath(pathname, it.to);
              return (
                <li key={it.to} className="flex items-center justify-center">
                  <NavItem item={it} active={active} emphasized={!!it.center} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  item,
  active,
  emphasized = false,
}: {
  item: Item;
  active: boolean;
  emphasized?: boolean;
}) {
  const { Icon, label, to } = item;
  const color = emphasized || active ? ACCENT : "#FFFFFF";
  return (
    <a
      href={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="group relative flex flex-col items-center justify-center gap-1 px-1 py-2 transition-all duration-[250ms] hover:-translate-y-[2px]"
      style={{ color }}
    >
      <Icon
        className={`${emphasized ? "size-[22px]" : "size-[18px]"} transition-all duration-[250ms] group-hover:scale-[1.03]`}
        strokeWidth={emphasized ? 1.8 : 1.6}
        style={{
          filter:
            emphasized || active
              ? `drop-shadow(0 0 6px ${ACCENT_SOFT})`
              : "none",
        }}
      />
      <span
        className={`${emphasized ? "text-[10px]" : "text-[10px]"} font-semibold uppercase leading-none whitespace-nowrap`}
        style={{
          letterSpacing: emphasized ? "2.5px" : "2px",
          fontFamily: "'Oswald', 'Bebas Neue', 'Anton', sans-serif",
          textShadow: emphasized ? `0 0 8px ${ACCENT_DIM}` : "none",
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="absolute bottom-1 left-1/2 h-[2px] rounded-full origin-center transition-transform duration-[250ms]"
        style={{
          width: 22,
          background: ACCENT,
          transform: `translateX(-50%) scaleX(${active ? 1 : 0})`,
          boxShadow: active ? `0 0 8px ${ACCENT_SOFT}` : "none",
        }}
      />
      {!active && (
        <span
          aria-hidden
          className="absolute bottom-1 left-1/2 h-[2px] w-[22px] rounded-full origin-center scale-x-0 transition-transform duration-[250ms] group-hover:scale-x-100"
          style={{
            background: ACCENT,
            transform: "translateX(-50%) scaleX(0)",
          }}
        />
      )}
    </a>
  );
}

