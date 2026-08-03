import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check, X, Martini, Volume2, VolumeX, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  drawScene,
  makeSim,
  preloadCocktailSprites,
  POUR_TARGET,
  type Phase,
  type Sim,
} from "./cocktail-render";
import loungeBg from "@/assets/lounge-bg.jpg";
import imgVodka from "@/assets/ing-vodka.png";
import imgGin from "@/assets/ing-gin.png";
import imgRum from "@/assets/ing-rum.png";
import imgTequila from "@/assets/ing-tequila.png";
import imgLime from "@/assets/ing-lime.png";
import imgOrange from "@/assets/ing-orange.png";
import imgMint from "@/assets/ing-mint.png";
import imgSyrup from "@/assets/ing-syrup.png";
import imgCola from "@/assets/ing-cola.png";
import imgIce from "@/assets/ice-cube.png";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */



type Reward = { title: string; stars: number; code: string; off: string };

const STORAGE_KEY = "mms-cocktail-challenge-reward";

const RECIPE = ["Vodka", "Lime Juice", "Sugar Syrup", "Mint", "Ice"] as const;

const BOTTLES = [
  { name: "Vodka", img: imgVodka, tint: "#dbeafe" },
  { name: "Gin", img: imgGin, tint: "#c7f9e5" },
  { name: "Rum", img: imgRum, tint: "#f3c98b" },
  { name: "Tequila", img: imgTequila, tint: "#e8e3a8" },
  { name: "Lime Juice", img: imgLime, tint: "#a3e635" },
  { name: "Orange Juice", img: imgOrange, tint: "#fb923c" },
  { name: "Mint", img: imgMint, tint: "#34d399" },
  { name: "Sugar Syrup", img: imgSyrup, tint: "#fcd34d" },
  { name: "Cola", img: imgCola, tint: "#7c3f1d" },
  { name: "Ice", img: imgIce, tint: "#bae6fd" },
];

const SHAKE_TARGET = 5; // seconds of good shaking

function rewardFor(score: number): Reward {
  if (score >= 95) return { title: "Master Mixologist", stars: 5, code: "MIX30", off: "30% OFF" };
  if (score >= 85) return { title: "Cocktail Expert", stars: 4, code: "MIX25", off: "25% OFF" };
  if (score >= 70) return { title: "Great Bartender", stars: 3, code: "MIX15", off: "15% OFF" };
  return { title: "Nice Try", stars: 2, code: "MIX10", off: "10% OFF" };
}

function haptic(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* noop */
  }
}

/* ------------------------------------------------------------------ */
/*  Audio (synthesised, no assets)                                     */
/* ------------------------------------------------------------------ */

function useBarAudio(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambRef = useRef<{ stop: () => void } | null>(null);
  const rattleRef = useRef<{ stop: () => void; gain: GainNode } | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ctx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const noiseBuffer = (c: AudioContext, secs: number) => {
    const len = Math.floor(c.sampleRate * secs);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };

  const startAmbience = useCallback(() => {
    const c = ctx();
    if (!c || ambRef.current) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 2);
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 380;
    filt.Q.value = 0.6;
    const g = c.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(mutedRef.current ? 0 : 0.035, c.currentTime + 1.4);
    src.connect(filt).connect(g).connect(c.destination);
    src.start();
    ambRef.current = {
      stop: () => {
        try {
          g.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
          src.stop(c.currentTime + 0.5);
        } catch {
          /* noop */
        }
      },
    };
  }, [ctx]);

  const stopAmbience = useCallback(() => {
    ambRef.current?.stop();
    ambRef.current = null;
  }, []);

  const pour = useCallback(
    (amount = 1) => {
      const c = ctx();
      if (!c || mutedRef.current) return;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.3);
      const filt = c.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = 1200 + amount * 500;
      filt.Q.value = 1.4;
      const g = c.createGain();
      g.gain.value = Math.min(0.18, 0.07 * amount);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.3);
      src.connect(filt).connect(g).connect(c.destination);
      src.start();
    },
    [ctx],
  );

  const blip = useCallback(
    (freq = 660, good = true) => {
      const c = ctx();
      if (!c || mutedRef.current) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = good ? "triangle" : "sawtooth";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(good ? freq * 1.5 : freq * 0.55, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.24);
    },
    [ctx],
  );

  const startRattle = useCallback(() => {
    const c = ctx();
    if (!c || rattleRef.current) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 1);
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 2200;
    const g = c.createGain();
    g.gain.value = 0;
    src.connect(filt).connect(g).connect(c.destination);
    src.start();
    rattleRef.current = {
      gain: g,
      stop: () => {
        try {
          g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
          src.stop(c.currentTime + 0.25);
        } catch {
          /* noop */
        }
      },
    };
  }, [ctx]);

  const setRattle = useCallback((level: number) => {
    const r = rattleRef.current;
    if (!r) return;
    const target = mutedRef.current ? 0 : Math.min(0.14, level * 0.14);
    r.gain.gain.setTargetAtTime(target, r.gain.context.currentTime, 0.06);
  }, []);

  const stopRattle = useCallback(() => {
    rattleRef.current?.stop();
    rattleRef.current = null;
  }, []);

  const cheers = useCallback(() => {
    const c = ctx();
    if (!c || mutedRef.current) return;
    [784, 988, 1319, 1568].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 1.05);
    });
  }, [ctx]);

  useEffect(() => {
    const amb = ambRef.current;
    if (!amb) return;
    // ambience gain follows the mute toggle on next start; simplest is stop/start
    if (muted) {
      stopAmbience();
    }
  }, [muted, stopAmbience]);

  useEffect(
    () => () => {
      stopAmbience();
      stopRattle();
    },
    [stopAmbience, stopRattle],
  );

  return { startAmbience, stopAmbience, pour, blip, startRattle, setRattle, stopRattle, cheers };
}


/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CocktailChallenge() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Reward | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  return (
    <section className="border-t border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent">Bar Challenge</p>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-tight md:text-6xl">
          Mix the Cocktail
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Three stages, thirty seconds. Build the recipe, shake it right, pour it clean - the
          better your cocktail, the bigger the discount you walk in with.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-8 inline-flex items-center gap-3 bg-accent px-8 py-4 font-bold uppercase tracking-widest text-xs text-primary-foreground transition-transform hover:scale-105"
        >
          <Martini className="size-4" />
          Mix Your Drink & Unlock Your Discount
        </button>

        {saved && (
          <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Best so far: {saved.off} - code {saved.code}
          </p>
        )}
      </div>

      {open && <CocktailGame onClose={() => setOpen(false)} onWin={setSaved} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function CocktailGame({ onClose, onWin }: { onClose: () => void; onWin: (r: Reward) => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [muted, setMuted] = useState(true);
  const audio = useBarAudio(muted);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim>(makeSim());
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const rafRef = useRef(0);

  // stage state
  const [picked, setPicked] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [shakeProgress, setShakeProgress] = useState(0);
  const [pourLevel, setPourLevel] = useState(0);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [motionOk, setMotionOk] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    time: number;
    ing: number;
    shake: number;
    pourQ: number;
    reward: Reward;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const startedAt = useRef(0);
  const shakeStats = useRef({ active: 0, samples: [] as number[], overshoot: 0 });
  const pourStats = useRef({ spill: 0, slow: 0, elapsed: 0 });

  /* ---------- scroll lock + sprite preload ---------- */
  useEffect(() => {
    preloadCocktailSprites();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------- canvas loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = simRef.current;
      const ph = phaseRef.current;

      // decay + integrate
      s.froth = Math.max(0, s.froth - dt * 0.15);
      for (const c of s.ice) {
        c.rot += dt * (0.4 + s.shakeLevel * 6) * (c.vx > 0 ? 1 : -1);
        c.y += Math.sin(now / 400 + c.x * 10) * dt * 0.05;
        c.y = Math.max(0, Math.min(1, c.y));
      }
      for (const d of s.drops) {
        d.vy += 900 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.life -= dt;
      }
      s.drops = s.drops.filter((d) => d.life > 0).slice(-70);

      drawScene(ctx, canvas, dpr, s, ph, now / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ---------- motion permission ---------- */
  const requestMotion = useCallback(async () => {
    const anyDOE = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    const anyDOR = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    try {
      let ok = typeof window.DeviceMotionEvent !== "undefined";
      if (anyDOE?.requestPermission) ok = (await anyDOE.requestPermission()) === "granted";
      if (anyDOR?.requestPermission) await anyDOR.requestPermission();
      setMotionOk(ok);
    } catch {
      setMotionOk(false);
    }
  }, []);

  const begin = async () => {
    await requestMotion();
    audio.startAmbience();
    startedAt.current = performance.now();
    setPhase("recipe");
    haptic(12);
    window.setTimeout(() => setPhase("ingredients"), 3200);
  };

  /* ---------- stage 1 ---------- */
  const tapIngredient = (name: string) => {
    if (picked.includes(name)) return;
    const s = simRef.current;
    const expected = RECIPE[picked.length];
    const correct = name === expected;
    const next = [...picked, name];
    setPicked(next);
    setPoints((p) => p + (correct ? 10 : -5));
    audio.blip(correct ? 620 + picked.length * 90 : 240, correct);
    haptic(correct ? 10 : [18, 40, 18]);

    const bottle = BOTTLES.find((b) => b.name === name);
    s.shakerFill = Math.min(1, s.shakerFill + 0.18);
    s.froth = Math.min(1, s.froth + 0.2);
    if (name === "Ice") {
      for (let i = 0; i < 3; i++)
        s.ice.push({
          x: 0.2 + Math.random() * 0.6,
          y: Math.random(),
          vx: Math.random() - 0.5,
          vy: 0,
          r: 6 + Math.random() * 4,
          rot: Math.random() * 3,
        });
    } else if (name === "Mint") {
      for (let i = 0; i < 4; i++)
        s.mint.push({ x: 0.2 + Math.random() * 0.6, y: Math.random() * 0.6, p: Math.random() * 6 });
    }
    if (bottle) {
      // drift the liquid hue toward the poured ingredient
      const target = name === "Cola" ? 22 : name === "Orange Juice" ? 32 : name === "Lime Juice" ? 88 : 150;
      s.hue = s.hue + (target - s.hue) * 0.35;
    }
    for (let i = 0; i < 8; i++)
      s.drops.push({
        x: (canvasRef.current?.clientWidth ?? 320) / 2 + (Math.random() - 0.5) * 40,
        y: 120 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 80,
        life: 0.5 + Math.random() * 0.3,
        r: 1.5 + Math.random() * 2,
      });
    audio.pour(1);

    if (next.length >= RECIPE.length) {
      window.setTimeout(() => startShake(), 700);
    }
  };

  /* ---------- stage 2 ---------- */
  const startShake = useCallback(() => {
    shakeStats.current = { active: 0, samples: [], overshoot: 0 };
    setShakeProgress(0);
    setPhase("shake");
    audio.startRattle();
    haptic(20);
  }, [audio]);

  useEffect(() => {
    if (phase !== "shake") return;
    const s = simRef.current;
    let raf = 0;
    let last = performance.now();
    let lastMag = 0;
    let intensity = 0;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      const delta = Math.abs(mag - lastMag);
      lastMag = mag;
      intensity = Math.min(1, intensity * 0.75 + delta * 0.09);
    };
    let lastTouch = 0;
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const now = performance.now();
      if (now - lastTouch > 16) {
        lastTouch = now;
        intensity = Math.min(1, intensity + 0.09);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("touchmove", onTouch, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      intensity = Math.max(0, intensity - dt * 0.9);
      s.shakeLevel += (intensity - s.shakeLevel) * Math.min(1, dt * 10);
      audio.setRattle(s.shakeLevel);

      const st = shakeStats.current;
      if (s.shakeLevel > 0.22) {
        st.active += dt;
        st.samples.push(s.shakeLevel);
        if (st.samples.length > 240) st.samples.shift();
        s.froth = Math.min(1, s.froth + dt * s.shakeLevel * 0.9);
        if (Math.random() < s.shakeLevel * 0.25) haptic(4);
      }
      if (st.active > SHAKE_TARGET + 1.6) st.overshoot += dt;
      setShakeProgress(Math.min(1.35, st.active / SHAKE_TARGET));

      if (st.active >= SHAKE_TARGET + 2.2) finishShake();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("touchmove", onTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finishShake = useCallback(() => {
    if (phaseRef.current !== "shake") return;
    audio.stopRattle();
    simRef.current.shakeLevel = 0;
    setPhase("pour");
    haptic(24);
  }, [audio]);

  const shakeQuality = () => {
    const st = shakeStats.current;
    const t = st.active;
    const timing = t < SHAKE_TARGET ? Math.max(0, t / SHAKE_TARGET) : Math.max(0, 1 - (t - SHAKE_TARGET) / 4);
    const avg = st.samples.length ? st.samples.reduce((a, b) => a + b, 0) / st.samples.length : 0;
    const variance = st.samples.length
      ? st.samples.reduce((a, b) => a + (b - avg) ** 2, 0) / st.samples.length
      : 1;
    const consistency = Math.max(0, 1 - variance * 3);
    return Math.max(0, Math.min(1, timing * 0.7 + consistency * 0.2 + Math.min(1, avg * 2) * 0.1));
  };

  /* ---------- stage 3 ---------- */
  useEffect(() => {
    if (phase !== "pour") return;
    const s = simRef.current;
    pourStats.current = { spill: 0, slow: 0, elapsed: 0 };
    let raf = 0;
    let last = performance.now();
    let targetTilt = 0;
    let dragTilt = 0;
    let dragging = false;
    let dragStart = 0;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (!motionOk || e.beta == null) return;
      targetTilt = Math.max(0, Math.min(1.4, ((e.beta - 20) / 70) * 1.4));
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      dragStart = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      dragTilt = Math.max(0, Math.min(1.4, (dragStart - e.clientY) / 160));
    };
    const onUp = () => {
      dragging = false;
      dragTilt = Math.max(0, dragTilt - 0.15);
    };
    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const want = motionOk ? Math.max(targetTilt, dragTilt) : dragTilt;
      s.tilt += (want - s.tilt) * Math.min(1, dt * 6);
      setTiltDeg(Math.round((s.tilt * 180) / Math.PI));

      const ps = pourStats.current;
      ps.elapsed += dt;

      const over = Math.max(0, s.tilt - 0.35);
      const flow = Math.min(1, over * 1.5);
      s.pourFlow += (flow - s.pourFlow) * Math.min(1, dt * 8);

      if (s.pourFlow > 0.02 && s.shakerFill > 0) {
        const rate = s.pourFlow * 0.42 * dt;
        s.shakerFill = Math.max(0, s.shakerFill - rate);
        const clean = s.pourFlow > 0.72 ? 0.55 : 1; // pouring too hard splashes out
        s.glassFill = Math.min(1, s.glassFill + rate * 2.2 * clean);
        s.froth = Math.min(1, s.froth + rate * (s.pourFlow > 0.72 ? 2.4 : 0.6));
        if (s.pourFlow > 0.72) {
          ps.spill += rate * (1 - clean) * 4;
          if (Math.random() < 0.4) {
            haptic(6);
            for (let i = 0; i < 4; i++)
              s.drops.push({
                x: (canvasRef.current?.clientWidth ?? 320) / 2 + (Math.random() - 0.5) * 30,
                y: (canvasRef.current?.clientHeight ?? 400) * 0.5,
                vx: (Math.random() - 0.5) * 160,
                vy: -Math.random() * 60,
                life: 0.5,
                r: 1.5 + Math.random() * 2.5,
              });
          }
        }
        if (Math.random() < 0.08) audio.pour(s.pourFlow * 2);
      } else if (ps.elapsed > 1.5) {
        ps.slow += dt;
      }

      setPourLevel(s.glassFill);

      if (s.glassFill >= POUR_TARGET || ps.elapsed > 22) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, motionOk]);

  /* ---------- scoring ---------- */
  const finish = useCallback(() => {
    if (phaseRef.current === "result") return;
    const s = simRef.current;
    const ps = pourStats.current;

    const ing = Math.max(0, Math.min(1, points / (RECIPE.length * 10)));
    const shake = shakeQuality();
    const overFill = Math.abs(s.glassFill - POUR_TARGET) / POUR_TARGET;
    const pourQ = Math.max(
      0,
      Math.min(1, 1 - ps.spill * 1.6 - Math.min(0.35, ps.slow * 0.05) - overFill * 0.6),
    );

    const score = Math.round((ing * 0.3 + shake * 0.35 + pourQ * 0.35) * 100);
    const reward = rewardFor(score);
    const time = (performance.now() - startedAt.current) / 1000;
    setResult({ score, time, ing, shake, pourQ, reward });
    setPhase("result");
    audio.cheers();
    haptic([20, 60, 20, 60, 40]);
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      const prevScore = prev ? (JSON.parse(prev) as Reward & { score?: number }).score ?? 0 : 0;
      if (score >= prevScore) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...reward, score }));
        onWin(reward);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, points, onWin]);

  const playAgain = () => {
    simRef.current = makeSim();
    setPicked([]);
    setPoints(0);
    setShakeProgress(0);
    setPourLevel(0);
    setResult(null);
    startedAt.current = performance.now();
    setPhase("recipe");
    window.setTimeout(() => setPhase("ingredients"), 3200);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reward.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-300">
      {/* luxury lounge backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70 blur-[2px]"
        style={{ backgroundImage: `url(${loungeBg})` }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/90" />
      {/* top bar */}
      <div className="relative flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          Mixologist Challenge
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="grid size-9 place-items-center border border-border text-foreground/80 hover:border-accent hover:text-accent"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close challenge"
            className="grid size-9 place-items-center border border-border text-foreground/80 hover:border-accent hover:text-accent"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* canvas stage */}
      <div className="relative flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full touch-none" />

        {/* INTRO */}
        {phase === "intro" && (
          <div className="absolute inset-0 flex items-center justify-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-sm border border-accent/25 bg-background/70 p-7 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <Martini className="size-10 text-accent drop-shadow-[0_0_18px_rgba(56,189,248,0.6)]" />
              <h3 className="font-display text-3xl uppercase leading-none md:text-4xl">
                Welcome to the Mixologist Challenge
              </h3>
              <p className="text-sm text-foreground/70">
                Your mission is to create the perfect cocktail. Three stages: add the ingredients,
                shake it, then pour the perfect drink. The better your cocktail, the bigger the
                reward.
              </p>
              <ol className="mt-1 space-y-1 font-mono text-[11px] uppercase tracking-widest text-foreground/70">
                <li>1 - Add Ingredients</li>
                <li>2 - Shake the Cocktail</li>
                <li>3 - Pour the Perfect Drink</li>
              </ol>
              <button
                onClick={begin}
                className="mt-3 bg-accent px-8 py-3.5 font-bold uppercase tracking-widest text-xs text-primary-foreground shadow-[0_10px_30px_-8px_rgba(56,189,248,0.8)] transition-transform hover:scale-105 active:scale-95"
              >
                Start Mixing
              </button>
            </div>
          </div>
        )}

        {/* RECIPE CARD */}
        {phase === "recipe" && (
          <div className="absolute inset-0 flex items-center justify-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-xs border border-accent/50 bg-surface/90 p-6 text-center shadow-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                Memorise the recipe
              </p>
              <h4 className="mt-2 font-display text-2xl uppercase">House Mojito Twist</h4>
              <ul className="mt-4 space-y-2">
                {RECIPE.map((r, i) => (
                  <li key={r} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Hiding in a moment...
              </p>
            </div>
          </div>
        )}

        {/* STAGE 2 RING */}
        {phase === "shake" && (
          <div className="absolute inset-0 flex flex-col items-center justify-between py-8">
            <div className="text-center">
              <h4 className="font-display text-3xl uppercase text-accent animate-pulse">
                Shake your phone!
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {motionOk ? "Aim for 4-6 seconds - smooth and steady" : "No sensors? Swipe fast across the screen"}
              </p>
            </div>
            <ShakeRing progress={shakeProgress} />
            <button
              onClick={finishShake}
              className="border border-border px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:border-accent hover:text-accent"
            >
              Done Shaking
            </button>
          </div>
        )}

        {/* STAGE 3 */}
        {phase === "pour" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-8">
            <div className="text-center">
              <h4 className="font-display text-3xl uppercase text-accent">Pour it slow</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {motionOk ? "Tilt your phone gently" : "Drag upward to tilt the shaker"}
              </p>
            </div>
            <div className="w-full max-w-xs px-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Fill {Math.round((pourLevel / POUR_TARGET) * 100)}%</span>
                <span>Tilt {tiltDeg}°</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden bg-surface">
                <div
                  className="h-full bg-accent transition-[width] duration-100"
                  style={{ width: `${Math.min(100, (pourLevel / POUR_TARGET) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STAGE 1 BOTTLES */}
      {phase === "ingredients" && (
        <div className="relative border-t border-border bg-surface/90 backdrop-blur-md px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 animate-in slide-in-from-bottom-6 duration-300">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Tap the recipe in order
            </span>
            <span className="font-mono text-[11px] text-accent">{points} pts</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {BOTTLES.map((b) => {
              const used = picked.includes(b.name);
              return (
                <button
                  key={b.name}
                  disabled={used}
                  onClick={() => tapIngredient(b.name)}
                  className={`flex flex-col items-center gap-1 border px-1 py-2.5 transition-all active:scale-95 ${
                    used
                      ? "border-accent/60 bg-accent/10 opacity-50"
                      : "border-border bg-background/60 hover:border-accent"
                  }`}
                >
                  <img
                    src={b.img}
                    alt=""
                    loading="lazy"
                    width={64}
                    height={64}
                    className="h-9 w-9 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  />
                  <span className="text-center font-mono text-[8px] uppercase leading-tight tracking-wide">
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && result && (
        <ResultPanel
          result={result}
          copied={copied}
          onCopy={copy}
          onAgain={playAgain}
          onClose={onClose}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ShakeRing({ progress }: { progress: number }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const p = Math.min(1, progress);
  const over = progress > 1.15;
  return (
    <div className="relative grid place-items-center">
      <svg width={160} height={160} className="-rotate-90">
        <circle cx={80} cy={80} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-border" />
        <circle
          cx={80}
          cy={80}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          className={over ? "text-destructive" : "text-accent"}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p)}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl">{Math.round(p * 100)}%</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {over ? "Over-shaken!" : p >= 0.8 ? "Perfect zone" : "Keep going"}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  copied,
  onCopy,
  onAgain,
  onClose,
}: {
  result: { score: number; time: number; ing: number; shake: number; pourQ: number; reward: Reward };
  copied: boolean;
  onCopy: () => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto bg-background/92 px-6 py-10 backdrop-blur-sm animate-in fade-in duration-300">
      <Confetti />
      <div className="relative w-full max-w-sm border border-accent/50 bg-surface/95 p-6 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <Sparkles className="mx-auto size-8 text-accent" />
        <h3 className="mt-3 font-display text-3xl uppercase leading-none">🍸 Cocktail Complete!</h3>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-accent">
          {"★".repeat(result.reward.stars)}
          {"☆".repeat(5 - result.reward.stars)} {result.reward.title}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="Score" value={`${result.score}`} />
          <Stat label="Time" value={`${result.time.toFixed(1)}s`} />
          <Stat label="Pour" value={`${Math.round(result.pourQ * 100)}%`} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="Recipe" value={`${Math.round(result.ing * 100)}%`} />
          <Stat label="Shake" value={`${Math.round(result.shake * 100)}%`} />
        </div>

        <div className="mt-5 border border-accent/60 bg-accent/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Unlocked discount
          </p>
          <p className="font-display text-4xl uppercase text-accent">{result.reward.off}</p>
          <p className="mt-1 font-mono text-lg tracking-[0.3em]">{result.reward.code}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center justify-center gap-2 bg-accent px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-primary-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Coupon"}
          </button>
          <Link
            to="/menu"
            onClick={onClose}
            className="inline-flex items-center justify-center border border-accent px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-accent"
          >
            Redeem Now
          </Link>
          <button
            onClick={onAgain}
            className="border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:border-accent hover:text-accent"
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="border border-border px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:border-accent hover:text-accent"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-xs italic text-muted-foreground">
          Can you make an even better cocktail?
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background/60 px-2 py-2">
      <div className="font-display text-xl leading-none">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 block size-2 animate-[confetti-fall_2.8s_linear_infinite]"
          style={{
            left: `${(i * 37) % 100}%`,
            background: i % 3 === 0 ? "hsl(var(--accent))" : i % 3 === 1 ? "#34d399" : "#e7b84b",
            animationDelay: `${(i % 9) * 0.22}s`,
            transform: `rotate(${i * 24}deg)`,
          }}
        />
      ))}
    </div>
  );
}
