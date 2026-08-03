/* ------------------------------------------------------------------ */
/*  Cocktail challenge - cinematic canvas renderer                     */
/*  Photoreal sprites + physics-driven liquid, bloom, DOF, bokeh       */
/* ------------------------------------------------------------------ */

import loungeBg from "@/assets/lounge-bg.jpg";
import shakerPng from "@/assets/cocktail-shaker.png";
import glassPng from "@/assets/cocktail-glass.png";
import icePng from "@/assets/ice-cube.png";

export type Phase = "intro" | "recipe" | "ingredients" | "shake" | "pour" | "result";

export const POUR_TARGET = 0.82; // glass fill line

/* ---------------- sprite loading ---------------- */

const cache = new Map<string, HTMLImageElement>();

function sprite(src: string): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = src;
    cache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function preloadCocktailSprites() {
  [loungeBg, shakerPng, glassPng, icePng].forEach((s) => sprite(s));
}

/* ---------------- simulation state ---------------- */

export type Sim = {
  shakerFill: number;
  glassFill: number;
  froth: number;
  shakeLevel: number;
  tilt: number;
  wobble: number;
  wobbleV: number;
  hue: number;
  ice: { x: number; y: number; vx: number; vy: number; r: number; rot: number }[];
  mint: { x: number; y: number; p: number }[];
  drops: { x: number; y: number; vx: number; vy: number; life: number; r: number }[];
  spill: number;
  pourFlow: number;
};

export function makeSim(): Sim {
  return {
    shakerFill: 0,
    glassFill: 0,
    froth: 0,
    shakeLevel: 0,
    tilt: 0,
    wobble: 0,
    wobbleV: 0,
    hue: 150,
    ice: [],
    mint: [],
    drops: [],
    spill: 0,
    pourFlow: 0,
  };
}

/* ---------------- helpers ---------------- */

let off: HTMLCanvasElement | null = null;
function offscreen(w: number, h: number) {
  if (typeof document === "undefined") return null;
  if (!off) off = document.createElement("canvas");
  if (off.width !== w || off.height !== h) {
    off.width = w;
    off.height = h;
  }
  const c = off.getContext("2d");
  if (c) c.clearRect(0, 0, w, h);
  return c ? { canvas: off, ctx: c } : null;
}

const BOKEH = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 97) % 100 / 100,
  y: ((i * 53) % 100) / 100,
  r: 10 + ((i * 37) % 34),
  s: 0.2 + ((i * 17) % 60) / 140,
  p: i * 1.7,
}));

function drawBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, energy: number) {
  const bg = sprite(loungeBg);
  ctx.save();
  if (bg) {
    // cover fit with a slow cinematic drift + defocus
    const scale = Math.max(W / bg.width, H / bg.height) * 1.12;
    const dw = bg.width * scale;
    const dh = bg.height * scale;
    const dx = (W - dw) / 2 + Math.sin(t * 0.12) * 10;
    const dy = (H - dh) / 2 + Math.cos(t * 0.09) * 8;
    ctx.filter = "blur(10px) saturate(1.15) brightness(0.72)";
    ctx.drawImage(bg, dx, dy, dw, dh);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#0a0705";
    ctx.fillRect(0, 0, W, H);
  }

  // warm amber key light from above
  const key = ctx.createRadialGradient(W / 2, -H * 0.1, 10, W / 2, H * 0.42, H * 0.95);
  key.addColorStop(0, `rgba(255,186,92,${0.3 + energy * 0.12})`);
  key.addColorStop(0.5, "rgba(120,60,20,0.10)");
  key.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, W, H);

  // floating bokeh orbs
  ctx.globalCompositeOperation = "lighter";
  for (const b of BOKEH) {
    const x = b.x * W + Math.sin(t * b.s + b.p) * 22;
    const y = b.y * H * 0.8 + Math.cos(t * b.s * 0.8 + b.p) * 18;
    const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
    g.addColorStop(0, `rgba(255,196,110,${0.16 + Math.sin(t + b.p) * 0.05})`);
    g.addColorStop(1, "rgba(255,170,80,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.28, W / 2, H * 0.5, H * 0.85);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function bloom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hue: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `hsla(${hue},90%,65%,${a})`);
  g.addColorStop(1, `hsla(${hue},90%,60%,0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shadowEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------------- main scene ---------------- */

export function drawScene(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dpr: number,
  s: Sim,
  phase: Phase,
  t: number,
) {
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  drawBackdrop(ctx, W, H, t, s.shakeLevel);

  const cx = W / 2;

  if (phase === "pour" || phase === "result") {
    drawGlass(ctx, cx, W, H, s, t, phase);
  } else {
    drawShaker(ctx, cx, W, H, s, t, phase);
  }

  // splash droplets with motion blur streaks
  ctx.save();
  for (const d of s.drops) {
    const a = Math.max(0, Math.min(1, d.life));
    ctx.globalAlpha = a;
    ctx.strokeStyle = `hsla(${s.hue}, 80%, 68%, 0.85)`;
    ctx.lineCap = "round";
    ctx.lineWidth = d.r * 1.5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.vx * 0.012, d.y - d.vy * 0.012);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  vignette(ctx, W, H);
}

/* ---------------- shaker ---------------- */

function drawShaker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  W: number,
  H: number,
  s: Sim,
  t: number,
  phase: Phase,
) {
  const img = sprite(shakerPng);
  const h = Math.min(H * 0.52, 320);
  const w = h * 0.62;
  const shakeX = phase === "shake" ? Math.sin(t * 30) * 12 * s.shakeLevel : Math.sin(t * 1.2) * 1.5;
  const shakeY = phase === "shake" ? Math.cos(t * 37) * 7 * s.shakeLevel : 0;
  const rot = phase === "shake" ? Math.sin(t * 24) * 0.13 * s.shakeLevel : Math.sin(t * 0.7) * 0.01;
  const cyBase = H * 0.55;

  shadowEllipse(ctx, cx, cyBase + h * 0.52, w * 0.85, w * 0.2);

  const dpr = 2;
  const buf = offscreen(Math.ceil(w * dpr), Math.ceil(h * dpr));

  ctx.save();
  ctx.translate(cx + shakeX, cyBase + shakeY);
  ctx.rotate(rot);

  if (buf && img) {
    const { canvas: bc, ctx: b } = buf;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.drawImage(img, 0, 0, w, h);

    // liquid visible through the polished body (source-atop keeps the silhouette)
    b.globalCompositeOperation = "source-atop";
    const fill = s.shakerFill;
    if (fill > 0.01) {
      const surfaceY = h * (1 - fill * 0.55) - h * 0.05;
      const amp = 3 + s.shakeLevel * 16;
      const g = b.createLinearGradient(0, surfaceY, 0, h);
      g.addColorStop(0, `hsla(${s.hue}, 80%, 55%, 0.55)`);
      g.addColorStop(1, `hsla(${s.hue - 22}, 85%, 24%, 0.68)`);
      b.fillStyle = g;
      b.beginPath();
      b.moveTo(0, h);
      for (let x = 0; x <= w; x += 5) {
        b.lineTo(x, surfaceY + Math.sin(x / 13 + t * 6) * amp);
      }
      b.lineTo(w, h);
      b.closePath();
      b.fill();

      // foam head
      if (s.froth > 0.02) {
        b.fillStyle = `rgba(255,250,240,${0.22 + s.froth * 0.45})`;
        b.beginPath();
        b.moveTo(0, surfaceY + 12);
        for (let x = 0; x <= w; x += 5) {
          b.lineTo(x, surfaceY + Math.sin(x / 10 + t * 8) * amp * 0.7 - s.froth * 7);
        }
        b.lineTo(w, surfaceY + 14);
        b.closePath();
        b.fill();
      }

      // ice + botanicals suspended in the mix
      const ice = sprite(icePng);
      for (const c of s.ice) {
        const ix = w * (0.16 + c.x * 0.68);
        const iy = surfaceY + 16 + c.y * Math.max(10, h - surfaceY - 34);
        b.save();
        b.translate(ix, iy);
        b.rotate(c.rot);
        const size = c.r * 2.6;
        if (ice) {
          b.globalAlpha = 0.55;
          b.drawImage(ice, -size / 2, -size / 2, size, size);
        } else {
          b.fillStyle = "rgba(226,246,255,0.6)";
          b.fillRect(-size / 2, -size / 2, size, size);
        }
        b.restore();
      }
      b.globalAlpha = 1;
      for (const m of s.mint) {
        b.save();
        b.translate(w * (0.2 + m.x * 0.6), surfaceY + 14 + m.y * Math.max(8, h - surfaceY - 26));
        b.rotate(Math.sin(t * 2 + m.p) * 0.6);
        b.fillStyle = "rgba(74,222,128,0.9)";
        b.beginPath();
        b.ellipse(0, 0, 8, 3.6, 0, 0, Math.PI * 2);
        b.fill();
        b.restore();
      }

      // condensation beading on the chilled steel
      b.fillStyle = "rgba(255,255,255,0.30)";
      for (let i = 0; i < 26; i++) {
        const px = ((i * 61) % 100) / 100 * w;
        const py = h * 0.2 + (((i * 37) % 100) / 100) * h * 0.7;
        b.beginPath();
        b.arc(px, py, 0.8 + ((i * 13) % 5) * 0.3, 0, Math.PI * 2);
        b.fill();
      }
    }

    // restore metal specular over the liquid so the steel keeps its polish
    b.globalCompositeOperation = "source-atop";
    b.globalAlpha = 0.45;
    b.drawImage(img, 0, 0, w, h);
    b.globalAlpha = 1;

    // warm rim light
    b.globalCompositeOperation = "source-atop";
    const rim = b.createLinearGradient(0, 0, w, 0);
    rim.addColorStop(0, "rgba(255,190,110,0.28)");
    rim.addColorStop(0.35, "rgba(255,255,255,0.06)");
    rim.addColorStop(1, "rgba(120,200,255,0.20)");
    b.fillStyle = rim;
    b.fillRect(0, 0, w, h);
    b.globalCompositeOperation = "source-over";

    // shake motion blur: ghost frames
    if (phase === "shake" && s.shakeLevel > 0.2) {
      ctx.globalAlpha = 0.25 * s.shakeLevel;
      ctx.drawImage(bc, -w / 2 - 7 * s.shakeLevel, -h / 2, w, h);
      ctx.drawImage(bc, -w / 2 + 7 * s.shakeLevel, -h / 2, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(bc, -w / 2, -h / 2, w, h);
  }
  ctx.restore();

  if (s.shakerFill > 0.05) {
    bloom(ctx, cx, cyBase + h * 0.18, w * 1.1, s.hue, 0.1 + s.shakeLevel * 0.12);
  }
}

/* ---------------- glass ---------------- */

// bowl geometry measured against the coupe sprite (fractions of sprite box)
const RIM_Y = 0.1;
const BOWL_Y = 0.42;
const RIM_HALF = 0.335;

function drawGlass(
  ctx: CanvasRenderingContext2D,
  cx: number,
  W: number,
  H: number,
  s: Sim,
  t: number,
  phase: Phase,
) {
  const img = sprite(glassPng);
  const size = Math.min(H * 0.55, W * 0.82, 360);
  const gx = cx;
  const gy = H * 0.58; // sprite centre
  const left = gx - size / 2;
  const top = gy - size / 2;

  const rimY = top + size * RIM_Y;
  const bowlY = top + size * BOWL_Y;
  const rimHalf = size * RIM_HALF;
  const depth = bowlY - rimY;

  // pouring shaker above the glass
  if (phase === "pour") {
    const sh = sprite(shakerPng);
    const shH = Math.min(H * 0.3, 200);
    const shW = shH * 0.62;
    ctx.save();
    ctx.translate(gx - size * 0.28, H * 0.2);
    ctx.rotate(Math.min(1.35, Math.abs(s.tilt)) * 1.0);
    if (sh) ctx.drawImage(sh, -shW / 2, -shH / 2, shW, shH);
    ctx.restore();

    if (s.pourFlow > 0.01) {
      const sx = gx - size * 0.16;
      const sy = H * 0.26;
      const ey = rimY + 6;
      const width = 3 + s.pourFlow * 10;
      const grad = ctx.createLinearGradient(sx, sy, gx, ey);
      grad.addColorStop(0, `hsla(${s.hue}, 85%, 70%, 0.95)`);
      grad.addColorStop(1, `hsla(${s.hue - 18}, 88%, 52%, 0.9)`);
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let p = 0; p <= 1.001; p += 0.08) {
        const x = sx + (gx - sx) * p + Math.sin(t * 12 + p * 7) * 2 * s.pourFlow;
        const y = sy + (ey - sy) * (p * p * 0.6 + p * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      bloom(ctx, gx, ey, 40, s.hue, 0.25 * s.pourFlow);
    }
  }

  shadowEllipse(ctx, gx, top + size * 0.96, size * 0.36, size * 0.06);

  // --- liquid inside the bowl (drawn under the transparent glass sprite) ---
  const lvl = Math.max(0, Math.min(1, s.glassFill));
  if (lvl > 0.005) {
    const surfaceY = bowlY - depth * lvl;
    const halfAt = (y: number) => rimHalf * Math.max(0.04, (y - bowlY) / (rimY - bowlY));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(gx - rimHalf, rimY);
    ctx.lineTo(gx + rimHalf, rimY);
    ctx.lineTo(gx, bowlY);
    ctx.closePath();
    ctx.clip();

    const lg = ctx.createLinearGradient(0, surfaceY, 0, bowlY);
    lg.addColorStop(0, `hsla(${s.hue}, 88%, 66%, 0.94)`);
    lg.addColorStop(1, `hsla(${s.hue - 26}, 90%, 34%, 0.97)`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(gx - rimHalf, bowlY + 4);
    const tiltShift = Math.sin(s.wobble) * 6;
    for (let x = gx - rimHalf; x <= gx + rimHalf; x += 5) {
      const wave = Math.sin(x / 15 + t * 5) * (1.5 + s.pourFlow * 5) + tiltShift * ((x - gx) / rimHalf);
      ctx.lineTo(x, surfaceY + wave);
    }
    ctx.lineTo(gx + rimHalf, bowlY + 4);
    ctx.closePath();
    ctx.fill();

    // surface sheen + foam
    ctx.fillStyle = `rgba(255,255,255,${0.18 + s.froth * 0.35})`;
    ctx.fillRect(gx - rimHalf, surfaceY - 2.5, rimHalf * 2, 3.5);

    // rising bubbles
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (let i = 0; i < 14; i++) {
      const seed = i * 1.37;
      const bx = gx + Math.sin(seed * 3.1) * rimHalf * 0.55;
      const prog = ((t * (0.25 + (i % 5) * 0.06) + seed) % 1);
      const by = bowlY - (bowlY - surfaceY) * prog;
      const hw = halfAt(by);
      if (Math.abs(bx - gx) > hw) continue;
      ctx.beginPath();
      ctx.arc(bx, by, 1 + (i % 3) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // floating ice
    const ice = sprite(icePng);
    if (ice) {
      s.ice.slice(0, 3).forEach((c, i) => {
        const iy = surfaceY + 8 + i * 6;
        const hw = halfAt(iy);
        const ix = gx + (c.x - 0.5) * hw * 1.2;
        const sz = 26 + c.r;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(ix, iy + Math.sin(t * 1.6 + i) * 2);
        ctx.rotate(c.rot * 0.4);
        ctx.drawImage(ice, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    bloom(ctx, gx, (surfaceY + bowlY) / 2, rimHalf * 1.6, s.hue, 0.16);
  }

  // target fill line
  const targetY = bowlY - depth * POUR_TARGET;
  ctx.save();
  ctx.strokeStyle = "rgba(255,196,110,0.6)";
  ctx.setLineDash([5, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx - rimHalf - 14, targetY);
  ctx.lineTo(gx + rimHalf + 14, targetY);
  ctx.stroke();
  ctx.restore();

  // the crystal glass itself, over the liquid (refraction + highlights)
  if (img) {
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(img, left, top, size, size);
    ctx.restore();
  }

  // rim specular glint
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glint = ctx.createRadialGradient(gx + rimHalf * 0.7, rimY + 2, 0, gx + rimHalf * 0.7, rimY + 2, 26);
  glint.addColorStop(0, `rgba(255,255,255,${0.5 + Math.sin(t * 2) * 0.15})`);
  glint.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(gx + rimHalf * 0.7, rimY + 2, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
