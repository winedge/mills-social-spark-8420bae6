import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 900;

/**
 * Full-screen route preloader with an animated beer-cup filling animation.
 * Shows on initial load AND on every route change, for a minimum duration.
 */
export function RoutePreloader() {
  const status = useRouterState({ select: (s) => s.status });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPending = status === "pending";

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const shownAt = useRef<number>(Date.now());
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNow = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    shownAt.current = Date.now();
    setVisible(true);
  };

  const hideWhenReady = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => setVisible(false), remaining);
  };

  // Initial mount: show until window load fires, then hide after min duration.
  useEffect(() => {
    setMounted(true);
    shownAt.current = Date.now();
    const done = () => hideWhenReady();
    if (document.readyState === "complete") {
      done();
    } else {
      window.addEventListener("load", done, { once: true });
    }
    const safety = setTimeout(() => setVisible(false), 5000);
    return () => {
      window.removeEventListener("load", done);
      clearTimeout(safety);
    };
  }, []);

  // Show on route change.
  useEffect(() => {
    if (!mounted) return;
    showNow();
    hideWhenReady();
  }, [pathname, mounted]);

  // Extend while router is actively pending.
  useEffect(() => {
    if (!mounted) return;
    if (isPending) {
      showNow();
    } else {
      hideWhenReady();
    }
  }, [isPending, mounted]);

  if (!mounted || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overlay-anim-in pointer-events-none"

      style={{
        background:
          "radial-gradient(ellipse at center, rgba(15,23,42,0.92) 0%, rgba(7,9,13,0.98) 70%)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <BeerCupLoader />
      <p
        className="mt-6 text-sm font-bold uppercase"
        style={{
          fontFamily: "'Oswald', 'Bebas Neue', sans-serif",
          letterSpacing: "0.35em",
          color: "#38bdf8",
          textShadow: "0 0 12px rgba(56,189,248,0.4)",
        }}
      >
        Pouring<span className="preloader-dots" />
      </p>

      <style>{`
        @keyframes beer-fill {
          0%   { transform: translateY(100%); }
          70%  { transform: translateY(12%); }
          100% { transform: translateY(12%); }
        }
        @keyframes foam-rise {
          0%,60% { opacity: 0; transform: translateY(20px) scaleY(0.2); }
          80%    { opacity: 1; transform: translateY(0) scaleY(1); }
          100%   { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes bubble-up {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-90px) scale(1); opacity: 0; }
        }
        @keyframes pour-stream {
          0%,100% { opacity: 0; transform: scaleY(0.4); }
          15%,60% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes dots {
          0%,20%  { content: ""; }
          40%     { content: "."; }
          60%     { content: ".."; }
          80%,100%{ content: "..."; }
        }
        .preloader-dots::after {
          content: "";
          display: inline-block;
          width: 1.5em;
          text-align: left;
          animation: dots 1.4s steps(4) infinite;
        }
        .beer-cycle {
          animation: beer-fill 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .foam-cycle {
          animation: foam-rise 2.4s ease-out infinite;
          transform-origin: bottom center;
        }
        .pour-cycle {
          animation: pour-stream 2.4s ease-in-out infinite;
          transform-origin: top center;
        }
        .bubble {
          animation: bubble-up 2s ease-in infinite;
        }
        .bubble-2 { animation-delay: 0.4s; }
        .bubble-3 { animation-delay: 0.9s; }
        .bubble-4 { animation-delay: 1.3s; }
      `}</style>
    </div>
  );
}

function BeerCupLoader() {
  return (
    <svg
      width="160"
      height="200"
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="beer-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="glass-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>
        <clipPath id="mug-clip">
          <path d="M32 42 L118 42 L112 178 Q112 188 102 188 L48 188 Q38 188 38 178 Z" />
        </clipPath>
      </defs>

      {/* Pour stream */}
      <rect
        className="pour-cycle"
        x="76"
        y="0"
        width="8"
        height="42"
        rx="3"
        fill="url(#beer-grad)"
        opacity="0.85"
      />

      {/* Mug body */}
      <path
        d="M32 42 L118 42 L112 178 Q112 188 102 188 L48 188 Q38 188 38 178 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="#e2e8f0"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Beer + foam clipped to mug */}
      <g clipPath="url(#mug-clip)">
        <g className="beer-cycle">
          {/* Foam head */}
          <g className="foam-cycle">
            <ellipse cx="60" cy="46" rx="18" ry="10" fill="#fef9c3" />
            <ellipse cx="80" cy="42" rx="22" ry="12" fill="#fffbeb" />
            <ellipse cx="100" cy="46" rx="18" ry="10" fill="#fef9c3" />
            <ellipse cx="72" cy="40" rx="10" ry="6" fill="#ffffff" />
            <ellipse cx="92" cy="41" rx="9" ry="6" fill="#ffffff" />
          </g>
          {/* Beer liquid */}
          <rect x="30" y="50" width="90" height="160" fill="url(#beer-grad)" />
          {/* Bubbles */}
          <circle className="bubble" cx="58" cy="170" r="3" fill="rgba(255,255,255,0.7)" />
          <circle className="bubble bubble-2" cx="82" cy="170" r="2.5" fill="rgba(255,255,255,0.7)" />
          <circle className="bubble bubble-3" cx="72" cy="170" r="2" fill="rgba(255,255,255,0.7)" />
          <circle className="bubble bubble-4" cx="96" cy="170" r="2.8" fill="rgba(255,255,255,0.7)" />
        </g>
      </g>

      {/* Glass highlight */}
      <rect
        x="46"
        y="50"
        width="6"
        height="120"
        rx="3"
        fill="rgba(255,255,255,0.35)"
      />

      {/* Mug outline overlay for depth */}
      <path
        d="M32 42 L118 42 L112 178 Q112 188 102 188 L48 188 Q38 188 38 178 Z"
        fill="url(#glass-grad)"
        opacity="0.4"
      />

      {/* Handle */}
      <path
        d="M118 62 Q148 62 148 108 Q148 154 118 154"
        stroke="#e2e8f0"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
