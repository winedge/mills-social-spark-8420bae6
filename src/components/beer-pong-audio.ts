/* ------------------------------------------------------------------ */
/*  Tiny synthetic sound engine for Beer Pong (no asset downloads)      */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let musicTimer: number | null = null;
let muted = false;

/* dedicated bus for the glass-and-beer "sink" layer so its level can be
   tuned independently of bounces, ambience and crowd noise */
let sinkBus: GainNode | null = null;
let sinkVolume = 0.85;
/* reference distance (world units) at which the sink layer plays at full level */
const SINK_REF_DIST = 1.6;
const SINK_MAX_DIST = 9;


function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    /* "interactive" asks the platform for the smallest output buffer it can
       give us, which keeps game cues tight against the on-screen action */
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds = 1) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/* smallest safe scheduling lookahead - keeps starts sample-accurate without
   adding audible latency against the visuals */
const SCHED = 0.004;

/** visual choreography offsets (seconds after the ball drops into the cup) */
export const SINK_TIMELINE = {
  /** rim wobble / glass ring - immediate */
  ring: 0,
  /** beer column + foam burst leaves the rim a couple of frames later */
  foam: 0.055,
  /** crowd reacts once they see it went in */
  cheer: 0.22,
};

function env(g: GainNode, c: AudioContext, peak: number, attack: number, decay: number, at?: number) {
  const t = at ?? c.currentTime + SCHED;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}


/* lazily build the sink bus: [bus gain] -> master */
function bus(c: AudioContext) {
  if (!master) return null;
  if (!sinkBus) {
    sinkBus = c.createGain();
    sinkBus.gain.value = sinkVolume;
    sinkBus.connect(master);
  }
  return sinkBus;
}

export type SinkCue = {
  /** distance from the listener/camera to the cup, in world units */
  distance?: number;
  /** -1 (hard left) .. 1 (hard right) */
  pan?: number;
  /** 0..1 impact strength */
  strength?: number;
};

/* inverse-square-ish rolloff, clamped, matching a small indoor bar space */
function attenuation(distance: number) {
  const d = Math.max(SINK_REF_DIST, Math.min(SINK_MAX_DIST, distance));
  const rolloff = SINK_REF_DIST / (SINK_REF_DIST + 1.15 * (d - SINK_REF_DIST));
  return rolloff * rolloff * 0.65 + rolloff * 0.35;
}

export const sfx = {
  setMuted(v: boolean) {
    muted = v;
    if (master) master.gain.value = v ? 0 : 0.9;
  },
  isMuted: () => muted,

  /** 0..1.5 - level of the glass-and-beer sink layer only */
  setSinkVolume(v: number) {
    sinkVolume = Math.max(0, Math.min(1.5, v));
    if (sinkBus && ctx) sinkBus.gain.setTargetAtTime(sinkVolume, ctx.currentTime, 0.05);
  },
  getSinkVolume: () => sinkVolume,

  unlock() {
    ac();
  },

  /* ---------------------------------------------------------------- */
  /*  Dedicated glass + beer layer for a successful sink               */
  /*  distance-attenuated, stereo-panned, air-absorption filtered      */
  /* ---------------------------------------------------------------- */
  sink({ distance = SINK_REF_DIST, pan = 0, strength = 1 }: SinkCue = {}) {
    const c = ac();
    const b = bus(c!);
    if (!c || !b) return;

    const att = attenuation(distance);
    const amp = att * Math.min(1.2, Math.max(0.2, strength));
    const t0 = c.currentTime;
    /* speed of sound delay - far cups read fractionally late */
    const delay = Math.max(0, (distance - SINK_REF_DIST) * 0.0029);

    /* per-cue chain: panner -> air-absorption lowpass -> bus */
    const panner = c.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    const air = c.createBiquadFilter();
    air.type = "lowpass";
    /* distant sounds lose their highs */
    air.frequency.value = 16000 - Math.min(11000, (distance - SINK_REF_DIST) * 1500);
    air.Q.value = 0.4;
    air.connect(panner).connect(b);

    /* 1. glass ring - the ball dropping through the rim into the cup */
    [1740, 2490, 3380, 4720].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq * (0.995 + Math.random() * 0.01), t0);
      const t = t0 + delay + i * 0.009;
      const peak = amp * (0.13 - i * 0.026);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7 - i * 0.12);
      o.connect(g).connect(air);
      o.start(t);
      o.stop(t + 0.8);
    });

    /* 2. beer plunge - a filtered noise burst sweeping down as it displaces */
    const plunge = c.createBufferSource();
    plunge.buffer = noiseBuffer(c, 0.6);
    const pf = c.createBiquadFilter();
    pf.type = "bandpass";
    pf.frequency.setValueAtTime(2200, t0 + delay);
    pf.frequency.exponentialRampToValueAtTime(320, t0 + delay + 0.4);
    pf.Q.value = 0.9;
    const pg = c.createGain();
    pg.gain.setValueAtTime(0.0001, t0 + delay);
    pg.gain.exponentialRampToValueAtTime(Math.max(amp * 0.4, 0.0002), t0 + delay + 0.012);
    pg.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.5);
    plunge.connect(pf).connect(pg).connect(air);
    plunge.start(t0 + delay);
    plunge.stop(t0 + delay + 0.6);

    /* 3. liquid body - low "gloop" of beer swallowing the ball */
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t0 + delay);
    o.frequency.exponentialRampToValueAtTime(110, t0 + delay + 0.18);
    g.gain.setValueAtTime(0.0001, t0 + delay + 0.005);
    g.gain.exponentialRampToValueAtTime(Math.max(amp * 0.22, 0.0002), t0 + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.32);
    o.connect(g).connect(air);
    o.start(t0 + delay);
    o.stop(t0 + delay + 0.4);

    /* 4. carbonation fizz - sparse high crackle lingering after the hit */
    const fizz = c.createBufferSource();
    fizz.buffer = noiseBuffer(c, 1.2);
    const ff = c.createBiquadFilter();
    ff.type = "highpass";
    ff.frequency.value = 5200;
    const fg = c.createGain();
    fg.gain.setValueAtTime(0.0001, t0 + delay + 0.06);
    fg.gain.exponentialRampToValueAtTime(Math.max(amp * 0.09, 0.0002), t0 + delay + 0.15);
    fg.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 1.1);
    fizz.connect(ff).connect(fg).connect(air);
    fizz.start(t0 + delay);
    fizz.stop(t0 + delay + 1.2);
  },


  /* ping-pong ball on wood */
  bounce(strength = 1) {
    const c = ac();
    if (!c || !master) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(720 + Math.random() * 240, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.07);
    env(g, c, 0.16 * Math.min(1, strength), 0.002, 0.09);
    o.connect(g).connect(master);
    o.start();
    o.stop(c.currentTime + 0.14);
  },

  /* hollow plastic cup knock */
  cupHit(strength = 1) {
    const c = ac();
    if (!c || !master) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 480;
    f.Q.value = 3;
    o.type = "square";
    o.frequency.setValueAtTime(300 + Math.random() * 120, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.09);
    env(g, c, 0.14 * Math.min(1, strength), 0.003, 0.12);
    o.connect(f).connect(g).connect(master);
    o.start();
    o.stop(c.currentTime + 0.2);
  },

  /* beer splash + glass clink, optionally scheduled `at` seconds from now so
     it lands exactly on the foam burst leaving the rim */
  splash(at = 0) {
    const c = ac();
    if (!c || !master) return;
    const t0 = c.currentTime + SCHED + Math.max(0, at);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.5);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(1800, t0);
    f.frequency.exponentialRampToValueAtTime(420, t0 + 0.35);
    f.Q.value = 1.1;
    const g = c.createGain();
    env(g, c, 0.34, 0.006, 0.42, t0);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + 0.5);

    /* glass clink */
    [1860, 2640].forEach((freq, i) => {
      const o = c.createOscillator();
      const gg = c.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = t0 + 0.03 + i * 0.02;
      gg.gain.setValueAtTime(0.0001, t);
      gg.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(gg).connect(master!);
      o.start(t);
      o.stop(t + 0.34);
    });
  },

  /* crowd cheer swell */
  cheer(intensity = 1, at = 0) {
    const c = ac();
    if (!c || !master) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 1.6);
    const f = c.createBiquadFilter();
    const t = c.currentTime + SCHED + Math.max(0, at);
    f.type = "bandpass";
    f.frequency.setValueAtTime(700, t);
    f.frequency.linearRampToValueAtTime(1500, t + 0.45);
    f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * intensity, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3 * intensity);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1.7);
  },

  /* disappointed "aww" */
  groan() {
    const c = ac();
    if (!c || !master) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(230, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.7);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    env(g, c, 0.07, 0.12, 0.6);
    o.connect(f).connect(g).connect(master);
    o.start();
    o.stop(c.currentTime + 0.85);
  },

  /* cup tipping over and settling on the table - glass clink */
  clink(strength = 1) {
    const c = ac();
    if (!c || !master) return;
    [2380, 3160, 4270].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq * (0.99 + Math.random() * 0.02), c.currentTime);
      const t = c.currentTime + i * 0.012;
      const peak = (0.11 - i * 0.03) * Math.min(1, strength);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0005), t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45 - i * 0.08);
      o.connect(g).connect(master!);
      o.start(t);
      o.stop(t + 0.5);
    });
    /* soft body thud of the cup meeting wood */
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(90, c.currentTime + 0.12);
    env(g, c, 0.09 * Math.min(1, strength), 0.003, 0.16);
    o.connect(g).connect(master);
    o.start();
    o.stop(c.currentTime + 0.3);
  },

  whoosh() {
    const c = ac();
    if (!c || !master) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.4);
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(400, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.22);
    const g = c.createGain();
    env(g, c, 0.12, 0.02, 0.26);
    src.connect(f).connect(g).connect(master);
    src.start();
    src.stop(c.currentTime + 0.4);
  },

  /* looping bar ambience + lazy bassline */
  startAmbience() {
    const c = ac();
    if (!c || !master || ambienceGain) return;
    ambienceGain = c.createGain();
    ambienceGain.gain.value = 0.0001;
    ambienceGain.gain.exponentialRampToValueAtTime(0.055, c.currentTime + 2.5);
    ambienceGain.connect(master);

    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 3);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 620;
    src.connect(f).connect(ambienceGain);
    src.start();

    /* sparse lounge bass notes */
    const notes = [55, 65.4, 73.4, 49];
    let i = 0;
    musicTimer = window.setInterval(() => {
      const cc = ctx;
      if (!cc || !master || muted) return;
      const o = cc.createOscillator();
      const g = cc.createGain();
      o.type = "sine";
      o.frequency.value = notes[i++ % notes.length];
      const t = cc.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 1.6);
    }, 1900);
  },

  stopAmbience() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (ambienceGain && ctx) {
      ambienceGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      const g = ambienceGain;
      setTimeout(() => g.disconnect(), 800);
      ambienceGain = null;
    }
  },
};
