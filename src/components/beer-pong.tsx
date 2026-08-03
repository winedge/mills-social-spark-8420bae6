import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Beer, X, Trophy, Copy, Check, RotateCcw } from "lucide-react";
import { makePong, launchVector, type PongState } from "./beer-pong-3d";

const BeerPongScene = lazy(() => import("./beer-pong-3d"));

const STORAGE_KEY = "mms-beer-pong-reward";
const TOTAL_SHOTS = 10;

type Reward = { title: string; code: string; off: string };

function rewardFor(sunk: number): Reward | null {
  if (sunk >= 8) return { title: "House Legend", code: "PONG30", off: "30% off your tab" };
  if (sunk >= 5) return { title: "Table Boss", code: "PONG20", off: "20% off your tab" };
  if (sunk >= 3) return { title: "Solid Arm", code: "PONG10", off: "10% off your tab" };
  return null;
}

export function BeerPong() {
  const [open, setOpen] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setBest(Number(raw) || 0);
  }, []);

  return (
    <section id="beer-pong" className="relative border-b border-border bg-surface/40 py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.10),transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/40 px-3 py-1.5 mb-5">
              <Beer className="size-3.5 text-accent" />
              <span className="font-mono text-[10px] text-accent tracking-widest">3D MINI GAME</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.92] mb-4 text-balance">
              Beer Pong <span className="text-accent">3D</span>
            </h2>
            <p className="text-foreground/70 text-pretty mb-6 max-w-lg">
              Ten cups. Ten shots. Drag back to load your throw, steer left or right, and let it fly.
              Sink enough cups and walk away with a real discount code for your next visit at Mills.
            </p>

            <ul className="font-mono text-[11px] uppercase tracking-widest text-foreground/60 space-y-2 mb-8">
              <li>3 cups - 10% off</li>
              <li>5 cups - 20% off</li>
              <li>8 cups - 30% off</li>
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
              >
                <Beer className="size-4" /> Play Beer Pong
              </button>
              {best !== null && (
                <span className="font-mono text-[11px] uppercase tracking-widest text-foreground/50">
                  Best: {best}/{TOTAL_SHOTS} cups
                </span>
              )}
            </div>
          </div>

          <div className="relative aspect-[4/3] border border-border bg-black/60 overflow-hidden">
            <div className="absolute inset-0 grid place-items-center text-center px-8">
              <div>
                <Beer className="size-10 text-accent mx-auto mb-4" />
                <p className="font-display text-2xl uppercase mb-2">Rack &apos;em up</p>
                <p className="text-foreground/50 text-sm">Tap play to launch the 3D table.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && <PongGame onClose={(score) => { setOpen(false); if (score != null) { const b = Math.max(score, best ?? 0); setBest(b); localStorage.setItem(STORAGE_KEY, String(b)); } }} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function PongGame({ onClose }: { onClose: (score: number | null) => void }) {
  const stateRef = useRef<PongState>(makePong());
  const [sunk, setSunk] = useState(0);
  const [shots, setShots] = useState(0);
  const [over, setOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);
  const [power, setPower] = useState(0);
  const [copied, setCopied] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const shotsRef = useRef(0);
  const finish = useCallback(() => {
    if (shotsRef.current >= TOTAL_SHOTS) setOver(true);
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.onSink = () => {
      setSunk((v) => v + 1);
      setToast("SPLASH! Cup down");
      navigator.vibrate?.(35);
      shotsRef.current += 1;
      setShots(shotsRef.current);
      finish();
    };
    s.onMiss = () => {
      setToast("Miss");
      shotsRef.current += 1;
      setShots(shotsRef.current);
      finish();
    };
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [finish]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1100);
    return () => clearTimeout(t);
  }, [toast]);

  const pointer = {
    onPointerDown: (e: React.PointerEvent) => {
      if (over || stateRef.current.flying) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      start.current = { x: e.clientX, y: e.clientY };
      stateRef.current.charging = true;
      setCharging(true);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dy = Math.max(0, e.clientY - start.current.y);
      const dx = e.clientX - start.current.x;
      const p = Math.min(1, dy / 190);
      const a = Math.max(-1, Math.min(1, dx / 160));
      stateRef.current.power = p;
      stateRef.current.aim = a;
      setPower(p);
    },
    onPointerUp: () => {
      if (!start.current) return;
      start.current = null;
      const s = stateRef.current;
      s.charging = false;
      setCharging(false);
      if (s.power > 0.08 && !s.flying) {
        const v = launchVector(s);
        s.ball.vx = v.vx;
        s.ball.vy = v.vy;
        s.ball.vz = v.vz;
        s.flying = true;
      }
      s.power = 0;
      setPower(0);
    },
  };

  const replay = () => {
    stateRef.current.cups.forEach((c) => (c.alive = true));
    stateRef.current.flying = false;
    stateRef.current.ball = { x: 0, y: 0.72, z: 1.55, vx: 0, vy: 0, vz: 0 };
    shotsRef.current = 0;
    setShots(0);
    setSunk(0);
    setOver(false);
  };

  const reward = rewardFor(sunk);

  return (
    <div className="fixed inset-0 z-[95] bg-black">
      <Suspense
        fallback={
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent animate-pulse">
              Racking cups...
            </span>
          </div>
        }
      >
        <BeerPongScene state={stateRef.current} />
      </Suspense>

      {/* input surface */}
      <div className="absolute inset-0 touch-none" {...pointer} />

      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="border border-white/15 bg-black/60 backdrop-blur px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">Cups</p>
            <p className="font-display text-xl text-accent leading-none">{sunk}/10</p>
          </div>
          <div className="border border-white/15 bg-black/60 backdrop-blur px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">Shots</p>
            <p className="font-display text-xl leading-none text-white">{shots}/{TOTAL_SHOTS}</p>
          </div>
        </div>
        <button
          onClick={() => onClose(shots > 0 ? sunk : null)}
          className="pointer-events-auto size-10 grid place-items-center border border-white/15 bg-black/60 backdrop-blur text-white hover:text-accent"
          aria-label="Close game"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* power meter */}
      {charging && (
        <div className="absolute left-5 bottom-24 h-40 w-2 bg-white/10 pointer-events-none">
          <div
            className="absolute bottom-0 inset-x-0 bg-accent transition-[height] duration-75"
            style={{ height: `${power * 100}%` }}
          />
        </div>
      )}

      {!over && (
        <p className="absolute bottom-8 inset-x-0 text-center font-mono text-[10px] uppercase tracking-widest text-white/45 pointer-events-none">
          Drag down to power - move sideways to aim - release to throw
        </p>
      )}

      {toast && (
        <div className="absolute inset-x-0 top-1/3 text-center pointer-events-none">
          <span className="inline-block font-display text-3xl uppercase text-accent drop-shadow-[0_0_18px_rgba(56,189,248,0.6)]">
            {toast}
          </span>
        </div>
      )}

      {/* result */}
      {over && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm border border-white/15 bg-surface/90 p-7 text-center">
            <Trophy className="size-9 text-accent mx-auto mb-4" />
            <p className="font-display text-3xl uppercase mb-1">{sunk} / 10 cups</p>
            <p className="text-foreground/60 text-sm mb-6">
              {reward ? reward.title : "So close - try again for a discount."}
            </p>

            {reward && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(reward.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="w-full mb-4 border border-accent/50 bg-accent/10 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-left">
                  <span className="block font-mono text-lg tracking-[0.2em] text-accent">{reward.code}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                    {reward.off}
                  </span>
                </span>
                {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4 text-accent" />}
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={replay}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent"
              >
                <RotateCcw className="size-3.5" /> Rematch
              </button>
              <Link
                to="/menu"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-[10px]"
              >
                See Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
