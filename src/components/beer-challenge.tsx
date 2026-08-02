import { useCallback, useEffect, useRef, useState } from "react";
import { Beer, Copy, Check, X, Trophy } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = "intro" | "ready" | "playing" | "result";

type Reward = {
  title: string;
  emoji: string;
  code: string;
  off: string;
};

const STORAGE_KEY = "mms-beer-challenge-reward";

function rewardFor(eff: number): Reward {
  if (eff >= 0.95) return { title: "Perfect Pour", emoji: "🏆", code: "CHEERS30", off: "30% OFF" };
  if (eff >= 0.85) return { title: "Beer Master", emoji: "🍺", code: "CHEERS25", off: "25% OFF" };
  if (eff >= 0.7) return { title: "Nice Drinking", emoji: "👍", code: "CHEERS15", off: "15% OFF" };
  return { title: "Bit Messy", emoji: "😅", code: "CHEERS10", off: "10% OFF" };
}

/* ------------------------------------------------------------------ */
/*  Tiny WebAudio helper (ambience + cues, no external assets)         */
/* ------------------------------------------------------------------ */

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambienceRef = useRef<{ stop: () => void } | null>(null);

  const ctx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    void ctxRef.current.resume();
    return ctxRef.current;
  };

  const startAmbience = useCallback(() => {
    const c = ctx();
    if (!c || ambienceRef.current) return;
    // Filtered noise = distant pub murmur
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 420;
    filt.Q.value = 0.7;
    const gain = c.createGain();
    gain.gain.value = 0.0;
    gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 1.2);
    src.connect(filt).connect(gain).connect(c.destination);
    src.start();
    ambienceRef.current = {
      stop: () => {
        try {
          gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
          src.stop(c.currentTime + 0.5);
        } catch {
          /* noop */
        }
      },
    };
  }, []);

  const stopAmbience = useCallback(() => {
    ambienceRef.current?.stop();
    ambienceRef.current = null;
  }, []);

  const splash = useCallback((amount = 1) => {
    const c = ctx();
    if (!c) return;
    const len = Math.floor(c.sampleRate * 0.25);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 900;
    const g = c.createGain();
    g.gain.value = Math.min(0.25, 0.08 * amount);
    src.connect(filt).connect(g).connect(c.destination);
    src.start();
  }, []);

  const cheers = useCallback(() => {
    const c = ctx();
    if (!c) return;
    [880, 1174, 1568].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.value = 0;
      g.gain.setValueAtTime(0, c.currentTime + i * 0.09);
      g.gain.linearRampToValueAtTime(0.18, c.currentTime + i * 0.09 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + i * 0.09 + 0.9);
      o.connect(g).connect(c.destination);
      o.start(c.currentTime + i * 0.09);
      o.stop(c.currentTime + i * 0.09 + 1);
    });
  }, []);

  useEffect(() => () => stopAmbience(), [stopAmbience]);

  return { startAmbience, stopAmbience, splash, cheers };
}

/* ------------------------------------------------------------------ */
/*  Simulation state (kept in refs, driven by rAF)                     */
/* ------------------------------------------------------------------ */

// Surface is a *modal* model: a few damped standing-wave modes instead of a
// 32-node spring chain. Same slosh feel, ~10x cheaper per frame.
const MODES = 3;
const MODE_W = [4.9, 8.6, 13.4]; // rad/s natural frequencies
const MODE_D = [1.05, 1.9, 3.1]; // damping
const MODE_GAIN = [1, 0.45, 0.2]; // how strongly tilt input excites each mode
const POINTS = 14; // render samples across the surface

type Sim = {
  level: number; // 0..1 fill of glass
  drank: number; // units drunk
  spilled: number; // units spilled
  tilt: number; // radians, smoothed tilt used by physics/render
  targetTilt: number; // raw input tilt (sensor or drag)
  tiltVel: number;
  prevTilt: number;
  prevTiltVel: number;
  modeA: number[]; // modal amplitudes
  modeV: number[]; // modal velocities
  waveEnergy: number; // 0..1 slosh intensity, drives spill + foam
  bubbles: { x: number; y: number; r: number; v: number }[];
  particles: { x: number; y: number; vx: number; vy: number; life: number; r: number }[];
  foamOverflow: number;
  shake: number;
  start: number;
  elapsed: number;
};

function makeSim(): Sim {
  return {
    level: 1,
    drank: 0,
    spilled: 0,
    tilt: 0,
    targetTilt: 0,
    tiltVel: 0,
    prevTilt: 0,
    prevTiltVel: 0,
    modeA: new Array(MODES).fill(0),
    modeV: new Array(MODES).fill(0),
    waveEnergy: 0,
    bubbles: Array.from({ length: 16 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 3,
      v: 0.12 + Math.random() * 0.3,
    })),
    particles: [],
    foamOverflow: 0,
    shake: 0,
    start: 0,
    elapsed: 0,
  };
}

/** Surface height offset (normalized) at u in [0,1] across the glass. */
function waveAt(s: Sim, u: number): number {
  const x = u - 0.5;
  return (
    s.modeA[0] * Math.sin(Math.PI * x) +
    s.modeA[1] * Math.sin(2 * Math.PI * x) +
    s.modeA[2] * Math.sin(3 * Math.PI * x)
  );
}



/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function BeerChallenge() {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<Reward | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUnlocked(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  return (
    <section className="border-t border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent">House Challenge</p>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-tight md:text-6xl">
          Don't Spill the Beer
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Turn your phone into a pint glass. Tilt to drink, keep it steady, and the cleaner you
          finish the bigger the discount you walk in with.
        </p>

        {unlocked ? (
          <div className="mt-8 inline-flex flex-col items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-8 py-5">
            <span className="font-display text-lg uppercase tracking-widest text-accent">
              ✅ Discount Unlocked
            </span>
            <span className="font-mono text-2xl tracking-[0.2em] text-foreground">
              {unlocked.code}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {unlocked.off} · {unlocked.title}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 font-display text-base uppercase tracking-[0.2em] text-background transition-transform hover:scale-[1.03] active:scale-95"
            style={{ boxShadow: "0 0 40px rgba(56,189,248,0.35)" }}
          >
            <Beer size={20} className="transition-transform group-hover:-rotate-12" />
            Unlock My Discount
          </button>
        )}
      </div>

      {open && (
        <ChallengeOverlay
          onClose={() => setOpen(false)}
          onWin={(r) => {
            setUnlocked(r);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
            } catch {
              /* noop */
            }
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Overlay + game                                                     */
/* ------------------------------------------------------------------ */

function ChallengeOverlay({
  onClose,
  onWin,
}: {
  onClose: () => void;
  onWin: (r: Reward) => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [motionOk, setMotionOk] = useState<boolean | null>(null);
  const [hud, setHud] = useState({ time: 0, level: 1, spill: 0, drink: 0 });
  const [result, setResult] = useState<{ eff: number; time: number; spill: number; reward: Reward } | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim>(makeSim());
  const phaseRef = useRef<Phase>("intro");
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{ active: boolean; x: number; tilt: number } | null>(null);
  const audio = useAudio();

  phaseRef.current = phase;

  /* lock scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* motion permission */
  const requestMotion = useCallback(async () => {
    audio.startAmbience();
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      try {
        const res = await DOE.requestPermission();
        setMotionOk(res === "granted");
      } catch {
        setMotionOk(false);
      }
    } else {
      setMotionOk(typeof window !== "undefined" && "DeviceOrientationEvent" in window);
    }
    setPhase("ready");
  }, [audio]);

  /* orientation listener */
  useEffect(() => {
    if (!motionOk) return;
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left/right tilt, -90..90
      const beta = e.beta ?? 0; // front/back tilt
      // gentler mapping: gamma dominates, beta adds a light contribution
      let deg = gamma * 0.62 + (beta - 45) * 0.16;
      // dead zone around neutral so tiny hand jitter does nothing
      if (Math.abs(deg) < 4) deg = 0;
      else deg = deg - Math.sign(deg) * 4;
      deg = Math.max(-85, Math.min(85, deg));
      simRef.current.targetTilt = (deg * Math.PI) / 180;
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, [motionOk]);

  /* touch / mouse fallback */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const getX = (e: PointerEvent) => e.clientX;
    const down = (e: PointerEvent) => {
      dragRef.current = { active: true, x: getX(e), tilt: simRef.current.targetTilt };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d?.active) return;
      const dx = getX(e) - d.x;
      // lower sensitivity: full drag across ~70% of the screen = 90deg
      const target = d.tilt + (dx / Math.max(200, window.innerWidth * 0.7)) * (Math.PI / 2);
      simRef.current.targetTilt = Math.max(-1.5, Math.min(1.5, target));
    };

    const up = () => {
      if (dragRef.current) dragRef.current.active = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [phase]);

  /* shake detection */
  useEffect(() => {
    if (!motionOk) return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      if (mag > 22) simRef.current.shake = Math.min(1, simRef.current.shake + 0.25);
    };
    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [motionOk]);

  const finish = useCallback(() => {
    const s = simRef.current;
    const total = s.drank + s.spilled || 1;
    const eff = s.drank / total;
    const reward = rewardFor(eff);
    setResult({ eff, time: s.elapsed, spill: s.spilled / total, reward });
    setPhase("result");
    audio.stopAmbience();
    audio.cheers();
    if (navigator.vibrate) navigator.vibrate([40, 60, 120]);
    onWin(reward);
  }, [audio, onWin]);

  /* main animation loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    let hudAcc = 0;
    let introT = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = simRef.current;
      const ph = phaseRef.current;

      /* ---- physics ---- */
      // critically-damped smoothing of raw sensor/drag input -> removes jitter
      const follow = 1 - Math.exp(-dt * 5.5);
      s.tilt += (s.targetTilt - s.tilt) * follow;
      s.shake = Math.max(0, s.shake - dt * 1.2);

      // low-passed angular velocity so a single noisy sample can't spike jerk
      const rawVel = (s.tilt - s.prevTilt) / Math.max(dt, 0.001);
      s.tiltVel += (rawVel - s.tiltVel) * (1 - Math.exp(-dt * 8));
      s.prevTilt = s.tilt;

      // modal slosh solver: 3 damped oscillators driven by tilt acceleration.
      // exact-ish semi-implicit integration -> stable at any framerate, no sub-steps.
      const jerk = Math.min(3, Math.abs(s.tiltVel));
      const tiltAcc = (s.tiltVel - s.prevTiltVel) / Math.max(dt, 0.001);
      s.prevTiltVel = s.tiltVel;

      // forcing: sideways acceleration of the glass + random shake energy
      const drive =
        Math.max(-8, Math.min(8, tiltAcc)) * 0.055 +
        s.tiltVel * 0.12 +
        s.shake * (Math.random() - 0.5) * 1.6;

      let energy = 0;
      for (let m = 0; m < MODES; m++) {
        const w = MODE_W[m];
        const acc = -w * w * s.modeA[m] - 2 * MODE_D[m] * s.modeV[m] + drive * MODE_GAIN[m];
        s.modeV[m] += acc * dt;
        s.modeA[m] += s.modeV[m] * dt;
        // clamp so a violent shake can't blow the surface out of the glass
        const lim = 0.55 * MODE_GAIN[m];
        if (s.modeA[m] > lim) {
          s.modeA[m] = lim;
          s.modeV[m] *= 0.5;
        } else if (s.modeA[m] < -lim) {
          s.modeA[m] = -lim;
          s.modeV[m] *= 0.5;
        }
        energy += Math.abs(s.modeA[m]) + Math.abs(s.modeV[m]) / w;
      }
      s.waveEnergy = Math.min(1, energy * 1.4);



      if (ph === "playing") {
        s.elapsed = (now - s.start) / 1000;
        const absTilt = Math.abs(s.tilt);
        const deg = (absTilt * 180) / Math.PI;

        if (deg > 50 && s.level > 0) {
          const steep = Math.min(1, (deg - 50) / 40);
          const smooth = Math.max(0, 1 - jerk / 2.2);
          const flow = steep * 0.34 * dt;
          const drankPart = flow * (0.45 + 0.55 * smooth);
          const spillPart = flow - drankPart;
          s.level = Math.max(0, s.level - flow);
          s.drank += drankPart;
          s.spilled += spillPart;
          if (spillPart > 0.002) spawnSplash(s, 3);
        }

        // jerky / shaky movement spills regardless of angle
        if ((jerk > 2.2 || s.shake > 0.45) && s.level > 0) {
          const loss = Math.min(s.level, (jerk * 0.004 + s.shake * 0.015) * dt * 6);
          s.level -= loss;
          s.spilled += loss;
          s.foamOverflow = Math.min(1, s.foamOverflow + loss * 6);
          if (loss > 0.0015) {
            spawnSplash(s, 6);
            audio.splash(loss * 200);
          }
        }

        s.foamOverflow = Math.max(0, s.foamOverflow - dt * 0.6);

        if (s.level <= 0.001) {
          s.level = 0;
          finish();
        }

        hudAcc += dt;
        if (hudAcc > 0.1) {
          hudAcc = 0;
          const total = s.drank + s.spilled || 1;
          setHud({
            time: s.elapsed,
            level: s.level,
            spill: s.spilled / total,
            drink: Math.min(1, s.drank / 1),
          });
        }
      } else if (ph === "intro" || ph === "ready") {
        introT += dt;
        if (ph === "intro") s.level = Math.min(1, introT / 2.2);
      }

      // bubbles
      for (const b of s.bubbles) {
        b.y -= b.v * dt;
        if (b.y < 0) {
          b.y = 1;
          b.x = Math.random();
        }
      }
      // particles
      for (const p of s.particles) {
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0).slice(-90);

      draw(ctx, canvas, dpr, s, ph);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [audio, finish]);

  const start = () => {
    const s = makeSim();
    s.level = 1;
    s.start = performance.now();
    simRef.current = s;
    setPhase("playing");
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reward.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overlay-anim-in touch-none select-none bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* close */}
      <button
        onClick={() => {
          audio.stopAmbience();
          onClose();
        }}
        aria-label="Close challenge"
        className="absolute bottom-6 right-4 z-30 rounded-full border border-white/20 bg-black/40 p-2.5 text-foreground backdrop-blur transition-colors hover:bg-white/10"
      >
        <X size={18} />
      </button>

      {/* INTRO */}
      {phase === "intro" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end gap-5 px-6 pb-16 text-center">
          <h3 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
            Don't Spill the Beer!
          </h3>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Drink naturally by tilting your phone. Drink too fast and you'll spill it. The cleaner
            your drink, the bigger your discount.
          </p>
          <button
            onClick={requestMotion}
            className="mt-2 rounded-full bg-accent px-10 py-4 font-display text-base uppercase tracking-[0.25em] text-background"
            style={{ boxShadow: "0 0 40px rgba(56,189,248,0.4)" }}
          >
            Enable Tilt
          </button>
        </div>
      )}

      {/* READY */}
      {phase === "ready" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end gap-4 px-6 pb-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
            {motionOk ? "Gyroscope active" : "Touch mode - drag left/right to tilt"}
          </p>
          <h3 className="font-display text-3xl uppercase leading-none tracking-tight">
            Glass is full
          </h3>
          <button
            onClick={start}
            className="mt-2 rounded-full bg-accent px-14 py-4 font-display text-lg uppercase tracking-[0.3em] text-background"
            style={{ boxShadow: "0 0 50px rgba(56,189,248,0.45)" }}
          >
            Start
          </button>
        </div>
      )}

      {/* HUD */}
      {phase === "playing" && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-4 pt-4 font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ paddingRight: 64 }}
        >
          <HudChip label="Time" value={`${hud.time.toFixed(1)}s`} />
          <HudChip label="Beer" value={`${Math.round(hud.level * 100)}%`} />
          <HudChip label="Spill" value={`${Math.round(hud.spill * 100)}%`} tone="warn" />
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && result && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <Confetti />
          <div className="relative w-full max-w-sm rounded-2xl border border-accent/30 bg-surface/90 p-6 text-center animate-chip-in">
            <div className="text-4xl">{result.reward.emoji}</div>
            <h3 className="mt-2 font-display text-3xl uppercase tracking-tight text-accent">
              {result.reward.title}
            </h3>

            <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Stat label="Time" value={`${result.time.toFixed(1)}s`} />
              <Stat label="Spilled" value={`${Math.round(result.spill * 100)}%`} />
              <Stat label="Efficiency" value={`${Math.round(result.eff * 100)}%`} />
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-accent/50 bg-accent/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Unlocked discount
              </p>
              <p className="mt-1 font-display text-4xl uppercase text-foreground">
                {result.reward.off}
              </p>
              <p className="mt-2 font-mono text-xl tracking-[0.25em] text-accent">
                {result.reward.code}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface-secondary px-6 py-3 font-display text-sm uppercase tracking-[0.2em]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy Code"}
              </button>
              <a
                href="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-background"
              >
                <Trophy size={16} /> Redeem Now
              </a>
              <button
                onClick={onClose}
                className="px-6 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HudChip({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
      <div className="text-muted-foreground">{label}</div>
      <div className={tone === "warn" ? "mt-0.5 text-sm text-amber-400" : "mt-0.5 text-sm text-accent"}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 py-2">
      <div>{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */

function spawnSplash(s: Sim, n: number) {
  const dir = Math.sign(s.tilt) || 1;
  for (let i = 0; i < n; i++) {
    s.particles.push({
      x: 0.5 + dir * (0.18 + Math.random() * 0.2),
      y: 0.18 + Math.random() * 0.12,
      vx: dir * (60 + Math.random() * 220),
      vy: -80 - Math.random() * 220,
      life: 0.7 + Math.random() * 0.6,
      r: 1.5 + Math.random() * 3.5,
    });
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dpr: number,
  s: Sim,
  phase: Phase,
) {
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // backdrop
  const bg = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.5, Math.max(W, H) * 0.8);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#05070a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // glass geometry - the whole screen is the pint
  const pad = Math.min(28, W * 0.07);
  const gx = pad;
  const gy = Math.min(90, H * 0.11);
  const gw = W - pad * 2;
  const gh = H - gy - Math.min(70, H * 0.09);
  const taper = gw * 0.07;

  const glassPath = () => {
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.lineTo(gx + gw - taper, gy + gh - 24);
    ctx.quadraticCurveTo(gx + gw - taper, gy + gh, gx + gw - taper - 24, gy + gh);
    ctx.lineTo(gx + taper + 24, gy + gh);
    ctx.quadraticCurveTo(gx + taper, gy + gh, gx + taper, gy + gh - 24);
    ctx.closePath();
  };

  ctx.save();
  glassPath();
  ctx.clip();

  // liquid surface: rotated by tilt
  const level = s.level;
  const surfaceY = gy + gh * (1 - level * 0.94) - 6;
  const tilt = Math.max(-1.1, Math.min(1.1, s.tilt));
  const slope = Math.tan(tilt) * 0.85;

  // beer body
  const beerGrad = ctx.createLinearGradient(0, surfaceY, 0, gy + gh);
  beerGrad.addColorStop(0, "#fbbf24");
  beerGrad.addColorStop(0.45, "#f59e0b");
  beerGrad.addColorStop(1, "#b45309");

  const surfPointX = (i: number) => gx + (gw * i) / (POINTS - 1);
  const surfPointY = (i: number) => {
    const u = i / (POINTS - 1);
    return surfaceY + (u - 0.5) * gw * slope + waveAt(s, u) * 46;
  };
  // smooth the sparse sample set with midpoint quadratics (cheap spline)
  const strokeSurface = (dy: number) => {
    ctx.moveTo(surfPointX(0), surfPointY(0) + dy);
    for (let i = 1; i < POINTS - 1; i++) {
      const cx = surfPointX(i);
      const cy = surfPointY(i) + dy;
      const mx = (cx + surfPointX(i + 1)) / 2;
      const my = (cy + surfPointY(i + 1) + dy) / 2;
      ctx.quadraticCurveTo(cx, cy, mx, my);
    }
    ctx.lineTo(surfPointX(POINTS - 1), surfPointY(POINTS - 1) + dy);
  };

  ctx.beginPath();
  strokeSurface(0);
  ctx.lineTo(gx + gw, gy + gh + 40);
  ctx.lineTo(gx, gy + gh + 40);
  ctx.closePath();
  ctx.fillStyle = beerGrad;
  ctx.fill();


  // bubbles inside beer
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (const b of s.bubbles) {
    const bx = gx + b.x * gw;
    const byBase = gy + gh;
    const by = byBase - b.y * (byBase - surfaceY);
    if (by > surfaceY + 6 && level > 0.02) {
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // foam head hugging the surface
  if (level > 0.01) {
    ctx.save();
    const foamThickness = 26 + s.foamOverflow * 18;
    ctx.beginPath();
    strokeSurface(-10);
    for (let i = POINTS - 1; i >= 0; i--)
      ctx.lineTo(surfPointX(i), surfPointY(i) + foamThickness);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,251,235,0.92)";
    ctx.fill();

    // foam texture
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < POINTS; i += 3) {
      ctx.beginPath();
      ctx.arc(surfPointX(i), surfPointY(i) - 4, 7 + ((i * 13) % 7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  ctx.restore();

  // glass edges + reflections
  ctx.save();
  glassPath();
  ctx.strokeStyle = "rgba(226,232,240,0.75)";
  ctx.lineWidth = 3;
  ctx.stroke();
  const gl = ctx.createLinearGradient(gx, 0, gx + gw, 0);
  gl.addColorStop(0, "rgba(255,255,255,0.18)");
  gl.addColorStop(0.25, "rgba(255,255,255,0.04)");
  gl.addColorStop(0.75, "rgba(255,255,255,0.03)");
  gl.addColorStop(1, "rgba(255,255,255,0.14)");
  ctx.fillStyle = gl;
  ctx.fill();
  ctx.restore();

  // highlight streak
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.roundRect(gx + gw * 0.12, gy + 30, 10, gh * 0.62, 6);
  ctx.fill();

  // splash particles
  for (const p of s.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = "#fcd34d";
    ctx.beginPath();
    ctx.arc(gx + p.x * gw, gy + p.y * gh, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // pour stream during intro fill
  if (phase === "intro" && s.level < 1) {
    ctx.fillStyle = "rgba(251,191,36,0.85)";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 7, 0, 14, gy + 20, 7);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/*  Confetti                                                           */
/* ------------------------------------------------------------------ */

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 12) * 0.12}s`,
    dur: `${2 + ((i * 7) % 18) / 10}s`,
    color: ["#38bdf8", "#fbbf24", "#f1f5f9", "#f59e0b"][i % 4],
    size: 5 + ((i * 5) % 7),
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="beer-confetti absolute top-[-10%] block rounded-[2px]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 2,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
      <style>{`
        @keyframes beer-confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(115vh) rotate(720deg); opacity: 0; }
        }
        .beer-confetti { animation-name: beer-confetti-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
      `}</style>
    </div>
  );
}
