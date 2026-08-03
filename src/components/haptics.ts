/**
 * Platform-tuned haptics for the beer pong game.
 *
 * Android (and any Chromium browser) exposes navigator.vibrate, which handles
 * arbitrary buzz patterns. iOS Safari does not - but since 17.4 it plays the
 * system "switch" haptic when a <input type="checkbox" switch> is toggled from
 * a label click, so we emulate patterns by pulsing that control.
 */

type Level = "tap" | "light" | "medium" | "heavy" | "success" | "combo";

const isClient = typeof window !== "undefined";

function detectPlatform(): "ios" | "android" | "other" {
  if (!isClient) return "other";
  const ua = navigator.userAgent || "";
  const isTouchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || isTouchMac) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

const platform = detectPlatform();

/* Android motors need a little more on-time to be felt; iOS ticks are crisper. */
const ANDROID: Record<Level, number | number[]> = {
  tap: 8,
  light: 14,
  medium: 24,
  heavy: 45,
  success: [22, 26, 55],
  combo: [18, 20, 22, 20, 70],
};

/* iOS: number of switch pulses + spacing, approximating impact strength. */
const IOS: Record<Level, { pulses: number; gap: number }> = {
  tap: { pulses: 1, gap: 0 },
  light: { pulses: 1, gap: 0 },
  medium: { pulses: 2, gap: 45 },
  heavy: { pulses: 3, gap: 40 },
  success: { pulses: 3, gap: 55 },
  combo: { pulses: 4, gap: 45 },
};

let iosSwitch: HTMLInputElement | null = null;
let iosLabel: HTMLLabelElement | null = null;

function ensureIosSwitch() {
  if (iosSwitch || !isClient) return;
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = "mms-haptic-switch";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  const label = document.createElement("label");
  label.htmlFor = input.id;
  wrap.append(input, label);
  document.body.appendChild(wrap);
  iosSwitch = input;
  iosLabel = label;
}

let enabled = true;
let lastAt = 0;

export const haptics = {
  get supported() {
    return isClient && (platform === "ios" || typeof navigator.vibrate === "function");
  },
  get platform() {
    return platform;
  },
  setEnabled(v: boolean) {
    enabled = v;
  },
  /** Call from a user gesture so iOS can attach its hidden control. */
  prime() {
    if (platform === "ios") ensureIosSwitch();
  },
  play(level: Level, opts: { throttle?: number } = {}) {
    if (!enabled || !isClient) return;
    const now = performance.now();
    const throttle = opts.throttle ?? 0;
    if (throttle && now - lastAt < throttle) return;
    lastAt = now;

    if (platform === "ios") {
      ensureIosSwitch();
      const { pulses, gap } = IOS[level];
      for (let i = 0; i < pulses; i++) {
        window.setTimeout(() => iosLabel?.click(), i * gap);
      }
      return;
    }

    const pattern = ANDROID[level];
    /* desktop / unknown: keep it minimal so laptops with motors don't buzz hard */
    const out = platform === "android" ? pattern : Array.isArray(pattern) ? pattern.map((v) => Math.round(v * 0.6)) : Math.round(pattern * 0.6);
    try {
      navigator.vibrate?.(out as number | number[]);
    } catch {
      /* ignore */
    }
  },
  /** Successful sink - scales with combo count. */
  sink(combo: number) {
    this.play(combo > 1 ? "combo" : "success");
  },
  /** Ball clipped a rim / rattled out - a lighter, shorter tap. */
  nearMiss(strength = 1) {
    this.play(strength > 0.6 ? "medium" : "light", { throttle: 70 });
  },
};
