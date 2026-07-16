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
        {/* Floating center CTA */}
        <CenterButton
          item={items[2]}
          active={isActivePath(pathname, items[2].to)}
        />

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

          {/* curved indentation under center button */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[1px]"
            style={{
              width: 92,
              height: 46,
              background: "#0A0A0A",
              borderBottomLeftRadius: "50%",
              borderBottomRightRadius: "50%",
              boxShadow: `inset 0 -1px 0 ${ACCENT_DIM}`,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[2px]"
            style={{
              width: 96,
              height: 48,
              borderBottomLeftRadius: "50%",
              borderBottomRightRadius: "50%",
              border: `1px solid ${ACCENT_DIM}`,
              borderTop: "none",
            }}
          />

          <ul className="relative grid grid-cols-5 h-full">
            {items.map((it, idx) => {
              if (idx === 2) return <li key="spacer" aria-hidden />;
              const active = isActivePath(pathname, it.to);
              return (
                <li key={it.to} className="flex items-center justify-center">
                  <NavItem item={it} active={active} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* breathing keyframes */}
      <style>{`
        @keyframes msn-breathe {
          0%, 100% { box-shadow: 0 0 0 1px ${ACCENT}, 0 0 24px ${ACCENT_DIM}, 0 14px 28px -10px rgba(0,0,0,0.9); }
          50% { box-shadow: 0 0 0 1px ${ACCENT}, 0 0 34px ${ACCENT_SOFT}, 0 14px 28px -10px rgba(0,0,0,0.9); }
        }
        @keyframes msn-underline {
          from { transform: translateX(-50%) scaleX(0); }
          to { transform: translateX(-50%) scaleX(1); }
        }
      `}</style>
    </nav>
  );
}

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const { Icon, label, to } = item;
  return (
    <a
      href={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="group relative flex flex-col items-center justify-center gap-1 px-1 py-2 transition-all duration-[250ms] hover:-translate-y-[2px]"
      style={{ color: active ? ACCENT : "#FFFFFF" }}
    >
      <Icon
        className="size-[18px] transition-all duration-[250ms] group-hover:scale-[1.03]"
        strokeWidth={1.6}
        style={{
          filter: active ? `drop-shadow(0 0 6px ${ACCENT_SOFT})` : "none",
        }}
      />
      <span
        className="text-[10px] font-semibold uppercase"
        style={{
          letterSpacing: "2px",
          fontFamily: "'Oswald', 'Bebas Neue', 'Anton', sans-serif",
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

function CenterButton({ item, active }: { item: Item; active: boolean }) {
  const { Icon, label, to } = item;
  return (
    <a
      href={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-[2px] z-10 flex flex-col items-center justify-start"
      style={{ width: 92, height: 72 }}
    >
      <Icon
        className="mt-[6px] size-[26px] transition-transform duration-[250ms] hover:scale-[1.05]"
        strokeWidth={1.6}
        style={{
          color: ACCENT,
          filter: `drop-shadow(0 0 8px ${ACCENT_SOFT})`,
        }}
      />
      <span
        className="mt-[4px] text-[9px] font-bold uppercase leading-none whitespace-nowrap"
        style={{
          color: ACCENT,
          letterSpacing: "2.5px",
          fontFamily: "'Oswald', 'Bebas Neue', 'Anton', sans-serif",
          textShadow: `0 0 8px ${ACCENT_DIM}`,
        }}
      >
        {label}
      </span>
    </a>
  );
}
