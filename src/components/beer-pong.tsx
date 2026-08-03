import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Beer, X, Trophy, Copy, Check, RotateCcw, Volume2, VolumeX, Target, Flame, Wind } from "lucide-react";
import { makePong, makeCups, launchVector, predictAim, type PongState } from "./beer-pong-3d";
import { sfx } from "./beer-pong-audio";
import { haptics } from "./haptics";

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

const MISS_LINES = ["Close!", "Almost!", "So close...", "Rim job!", "Next one."];

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
                onClick={() => {
                  sfx.unlock();
                  setOpen(true);
                }}
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,154,77,0.25),transparent_65%)]" />
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

      {open && (
        <PongGame
          onClose={(score) => {
            setOpen(false);
            if (score != null) {
              const b = Math.max(score, best ?? 0);
              setBest(b);
              localStorage.setItem(STORAGE_KEY, String(b));
            }
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function glass(extra = "") {
  return `border border-white/12 bg-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] ${extra}`;
}

function PongGame({ onClose }: { onClose: (score: number | null) => void }) {
  const stateRef = useRef<PongState>(makePong());
  const [sunk, setSunk] = useState(0);
  const [shots, setShots] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [toast, setToast] = useState<{ text: string; good: boolean } | null>(null);
  const [sinkFx, setSinkFx] = useState<{ id: number; points: number; combo: number } | null>(null);
  const [charging, setCharging] = useState(false);
  const [power, setPower] = useState(0);
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showSinkMix, setShowSinkMix] = useState(false);
  const [sinkVol, setSinkVol] = useState(() => sfx.getSinkVolume());
  const [flash, setFlash] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [windUI, setWindUI] = useState(0);
  const [aimClose, setAimClose] = useState(0);
  const lockedRef = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const startedAt = useRef(Date.now());

  const shotsRef = useRef(0);
  const sunkRef = useRef(0);
  const comboRef = useRef(0);

  const finish = useCallback(() => {
    if (shotsRef.current >= TOTAL_SHOTS) setOver(true);
  }, []);

  /* difficulty: tighter formations + wind as cups run out */
  const escalate = useCallback(() => {
    const s = stateRef.current;
    const left = s.cups.filter((c) => c.alive).length;
    if (left === 3) s.cups = makeCups("diamond");
    else if (left === 2) s.cups = makeCups("line").slice(0, 2);
    else if (left === 1) s.cups = makeCups("tight");
    if (left <= 4) {
      s.wind = (Math.random() - 0.5) * 0.85;
      setWindUI(s.wind);
    }
    if (left === 0) {
      s.victory = true;
      s.slowmo = 1;
      setWon(true);
      setOver(true);
      sfx.cheer(1.6);
      setTimeout(() => sfx.cheer(1.3), 700);
    }
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.onSink = () => {
      sunkRef.current += 1;
      comboRef.current += 1;
      const c = comboRef.current;
      const pts = 100 * c;
      setSunk(sunkRef.current);
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setScore((v) => v + pts);
      setSinkFx({ id: Date.now(), points: pts, combo: c });
      setFlash(1);
      haptics.sink(c);
      shotsRef.current += 1;
      setShots(shotsRef.current);
      setTimeout(escalate, 450);
      finish();
    };

    s.onRim = (strength) => haptics.nearMiss(strength);
    s.onMiss = () => {
      comboRef.current = 0;
      haptics.play("tap");
      setCombo(0);
      setToast({ text: MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)], good: false });
      shotsRef.current += 1;
      setShots(shotsRef.current);
      finish();
    };
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500);
    return () => {
      document.body.style.overflow = "";
      clearInterval(timer);
    };
  }, [finish, escalate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(0), 260);
    return () => clearTimeout(t);
  }, [flash]);

  const pointer = {
    onPointerDown: (e: React.PointerEvent) => {
      if (over || stateRef.current.flying) return;
      sfx.unlock();
      haptics.prime();
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

      /* aim-assist: guide the throw with proximity-scaled vibration */
      const pred = predictAim(stateRef.current);
      const close = pred?.closeness ?? 0;
      const locked = close > 0.88;
      if (locked && !lockedRef.current) haptics.aimLock();
      else if (!locked) haptics.aimCue(close);
      lockedRef.current = locked;
      setAimClose(close);
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
        s.ball.sz = -s.aim * 8;
        s.flying = true;
        sfx.whoosh();
        haptics.play("light");
      }
      s.power = 0;
      setPower(0);
      lockedRef.current = false;
      setAimClose(0);
    },
  };

  const replay = () => {
    const s = stateRef.current;
    s.cups = makeCups();
    s.flying = false;
    s.victory = false;
    s.wind = 0;
    s.splashes.length = 0;
    s.ball = { x: 0, y: 0.34, z: 0.42, vx: 0, vy: 0, vz: 0, sx: 0, sz: 0, squash: 0 };
    shotsRef.current = 0;
    sunkRef.current = 0;
    comboRef.current = 0;
    startedAt.current = Date.now();
    setWindUI(0);
    setShots(0);
    setSunk(0);
    setCombo(0);
    setBestCombo(0);
    setScore(0);
    setElapsed(0);
    setWon(false);
    setOver(false);
  };

  const reward = rewardFor(sunk);
  const accuracy = shots ? Math.round((sunk / shots) * 100) : 0;
  const left = 10 - sunk;

  return (
    <div className="fixed inset-0 z-[95] bg-black select-none">
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

      {/* splash flash */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_45%,rgba(240,181,63,0.35),transparent_60%)]"
        style={{ opacity: flash }}
      />

      {/* input surface */}
      <div className="absolute inset-0 touch-none" {...pointer} />

      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-3 md:p-4 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          <Stat label="Cups" value={`${left}`} accent />
          <Stat label="Shots" value={`${shots}/${TOTAL_SHOTS}`} />
          <Stat label="Acc" value={`${accuracy}%`} icon={<Target className="size-3" />} />
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className={glass("rounded-2xl px-3 py-2 text-right")}>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/45">Score</p>
            <p className="font-display text-lg leading-none text-white tabular-nums">{score}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => {
                const m = !muted;
                setMuted(m);
                sfx.setMuted(m);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowSinkMix((v) => !v);
              }}
              className={glass("rounded-2xl size-10 grid place-items-center text-white/80 hover:text-accent transition-colors")}
              aria-label="Toggle sound"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              onClick={() => setShowSinkMix((v) => !v)}
              className="absolute -bottom-1 -right-1 size-4 rounded-full bg-accent/90 text-[8px] font-bold text-black grid place-items-center"
              aria-label="Sink sound volume"
            >
              <Beer className="size-2.5" />
            </button>
            {showSinkMix && (
              <div className={glass("absolute right-0 top-12 w-44 rounded-2xl px-3 py-2.5 z-20")}>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/45 mb-1.5">
                  Glass &amp; Beer FX - {Math.round(sinkVol * 100)}%
                </p>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={sinkVol}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSinkVol(v);
                    sfx.setSinkVolume(v);
                  }}
                  onMouseUp={() => sfx.sink({ distance: 2.4, strength: 1 })}
                  onTouchEnd={() => sfx.sink({ distance: 2.4, strength: 1 })}
                  className="w-full accent-accent"
                  aria-label="Sink sound volume"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => onClose(shots > 0 ? sunk : null)}
            className={glass("rounded-2xl size-10 grid place-items-center text-white/80 hover:text-accent transition-colors")}
            aria-label="Close game"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* combo + wind */}
      <div className="absolute top-20 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
        {combo > 1 && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/15 backdrop-blur px-3 py-1 animate-[pulse_1.2s_ease-in-out_infinite]">
            <Flame className="size-3 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{combo}x combo</span>
          </div>
        )}
        {Math.abs(windUI) > 0.05 && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1">
            <Wind className="size-3 text-white/60" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/60">
              Wind {windUI > 0 ? "→" : "←"} {Math.abs(windUI).toFixed(1)}
            </span>
          </div>
        )}
        {charging && aimClose > 0.35 && (
          <div
            className={`flex items-center gap-1.5 rounded-full border backdrop-blur px-3 py-1 transition-colors ${
              aimClose > 0.88 ? "border-accent bg-accent/20" : "border-white/20 bg-white/5"
            }`}
          >
            <Target className={`size-3 ${aimClose > 0.88 ? "text-accent" : "text-white/60"}`} />
            <span
              className={`font-mono text-[9px] uppercase tracking-widest ${aimClose > 0.88 ? "text-accent" : "text-white/60"}`}
            >
              {aimClose > 0.88 ? "On target" : "Close"}
            </span>
          </div>
        )}
      </div>


      {/* power meter */}
      <div
        className="absolute left-4 bottom-28 w-2.5 h-44 rounded-full bg-white/10 backdrop-blur transition-all duration-300 pointer-events-none"
        style={{ opacity: charging ? 1 : 0, transform: `scaleY(${charging ? 1 : 0.85})` }}
      >
        <div
          className="absolute bottom-0 inset-x-0 rounded-full bg-gradient-to-t from-accent/70 to-accent transition-[height] duration-75"
          style={{ height: `${power * 100}%`, boxShadow: `0 0 ${8 + power * 26}px rgba(56,189,248,${0.35 + power * 0.6})` }}
        />
      </div>

      {!over && (
        <div className="absolute bottom-7 inset-x-0 flex justify-center pointer-events-none px-6">
          <p className={glass("rounded-full px-4 py-2 font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-white/60 text-center")}>
            Drag down to power - sideways to aim - release to throw
          </p>
        </div>
      )}

      {toast && (
        <div className="absolute inset-x-0 top-[34%] text-center pointer-events-none">
          <span
            className={`inline-block font-display text-4xl md:text-5xl uppercase animate-[fadeInUp_0.35s_cubic-bezier(0.22,1,0.36,1)] ${
              toast.good
                ? "text-accent drop-shadow-[0_0_28px_rgba(56,189,248,0.75)]"
                : "text-white/70 drop-shadow-[0_0_18px_rgba(0,0,0,0.7)]"
            }`}
          >
            {toast.text}
          </span>
        </div>
      )}

      {/* confetti on win */}
      {won && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="absolute block w-1.5 h-3 rounded-[1px]"
              style={{
                left: `${(i * 37) % 100}%`,
                top: "-6%",
                background: ["#38bdf8", "#f0b53f", "#ffffff", "#f472b6"][i % 4],
                animation: `confetti ${2.4 + (i % 7) * 0.35}s linear ${(i % 11) * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* result */}
      {over && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-md px-6 animate-[fadeIn_0.4s_ease-out]">
          <div
            className={glass(
              "w-full max-w-sm rounded-3xl p-7 text-center animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]",
            )}
          >
            <Trophy className={`size-9 mx-auto mb-4 ${won ? "text-accent animate-bounce" : "text-accent/80"}`} />
            <p className="font-display text-3xl uppercase mb-1 text-white">
              {won ? "🏆 You Win" : `${sunk} / 10 cups`}
            </p>
            <p className="text-white/55 text-sm mb-6">
              {reward ? reward.title : "So close - try again for a discount."}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <Metric label="Shots" value={`${shots}`} />
              <Metric label="Accuracy" value={`${accuracy}%`} />
              <Metric label="Best combo" value={`${bestCombo}x`} />
              <Metric label="Time" value={`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`} />
            </div>

            {reward && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(reward.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="w-full mb-4 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 flex items-center justify-between hover:bg-accent/20 transition-colors"
              >
                <span className="text-left">
                  <span className="block font-mono text-lg tracking-[0.2em] text-accent">{reward.code}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                    {reward.off}
                  </span>
                </span>
                {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4 text-accent" />}
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={replay}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:border-accent hover:text-accent transition-colors"
              >
                <RotateCcw className="size-3.5" /> Play Again
              </button>
              <Link
                to="/menu"
                className="flex-1 inline-flex items-center justify-center rounded-2xl px-4 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-[10px] hover:scale-[1.03] transition-transform"
              >
                See Menu
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confetti { to { transform: translateY(112vh) rotate(720deg); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.88) translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px) scale(0.94) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={glass("rounded-2xl px-3 py-2 min-w-[62px]")}>
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/45 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`font-display text-lg leading-none tabular-nums ${accent ? "text-accent" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="font-display text-lg leading-none text-white tabular-nums">{value}</p>
    </div>
  );
}
