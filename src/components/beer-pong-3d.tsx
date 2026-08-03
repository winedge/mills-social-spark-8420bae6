import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx, SINK_TIMELINE } from "./beer-pong-audio";

/* ------------------------------------------------------------------ */
/*  Shared mutable game state (driven by the React UI layer)           */
/* ------------------------------------------------------------------ */

export type Cup = {
  x: number;
  z: number;
  alive: boolean;
  wobble: number; // impulse energy for rim wobble
  wobblePhase: number;
  tip: number; // 0..1 tip-over on sink
  fade: number; // 1 = present, 0 = gone
  sinkT: number; // seconds since the sink started (-1 = not sinking)
  tipVel: number; // angular velocity of the tip-over (rad/s)
  tipDir: number; // -1 / 1 lateral direction the cup falls
  slide: number; // how far the cup has skidded while falling
  spinY: number; // yaw spin while it tumbles
  landed: boolean; // has it hit the table yet (clink played)
  /* how many balls have landed in this cup */
  hits: number;
  /* animated beer level (1 = full to the normal fill line) */
  level: number;
  /* level the beer is easing towards - each ball displaces more beer */
  levelTarget: number;
  /* 0..1 spill animation running down the outside of the cup */
  overflow: number;
};



export type Splash = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  foam: boolean;
};

export type PongState = {
  cups: Cup[];
  ball: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    sx: number; // spin
    sz: number;
    squash: number; // 0..1
  };
  flying: boolean;
  aim: number; // -1..1 lateral
  power: number; // 0..1
  charging: boolean;
  wind: number; // lateral acceleration
  shake: number;
  slowmo: number; // 0..1 time dilation strength
  splashes: Splash[];
  victory: boolean;
  orbit: number;
  /* drop-in animation: the ball is being funnelled into a cup */
  sink: { active: boolean; x: number; z: number; t: number; y0: number };
  /* crowd / arena intensity 0..1, ramps with combo and decays over time */
  hype: number;
  /* transient celebration pulse 0..1 (light strobe on a sink) */
  hypePulse: number;
  onSink?: (index: number) => void;
  onMiss?: () => void;
  onRim?: (strength: number) => void;
  onBounce?: () => void;
};

export const BALL_R = 0.03;
export const CUP_R = 0.065; // +30% vs previous
export const CUP_H = 0.17;
const RACK_Z = -1.75;
/* approximate resting camera position - used as the audio listener */
const LISTENER = { x: 0, y: 1.02, z: 2.2 };
const BALL_HOME = { y: 0.34, z: 0.42 };
/* beer level a fresh cup is poured to, and how much each ball displaces */
export const BASE_LEVEL = 0.72;
export const LEVEL_PER_BALL = 0.34;


/* cup formations, chosen by how many cups remain */
export function makeCups(formation: "triangle" | "diamond" | "line" | "tight" = "triangle") {
  const gap = CUP_R * 2 + 0.014;
  const cups: Cup[] = [];
  const push = (x: number, z: number) =>
    cups.push({
      x,
      z,
      alive: true,
      wobble: 0,
      wobblePhase: 0,
      tip: 0,
      fade: 1,
      sinkT: -1,
      tipVel: 0,
      tipDir: Math.random() < 0.5 ? -1 : 1,
      slide: 0,
      spinY: 0,
      landed: false,
      hits: 0,
      level: BASE_LEVEL,
      levelTarget: BASE_LEVEL,
      overflow: 0,
    });


  if (formation === "triangle") {
    const rows = [4, 3, 2, 1];
    let z = RACK_Z;
    rows.forEach((n) => {
      const startX = -((n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) push(startX + i * gap, z);
      z += gap * 0.9;
    });
  } else if (formation === "diamond") {
    const rows = [1, 2, 1];
    let z = RACK_Z + gap * 0.4;
    rows.forEach((n) => {
      const startX = -((n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) push(startX + i * gap, z);
      z += gap * 0.95;
    });
  } else if (formation === "line") {
    const n = 3;
    const startX = -((n - 1) * gap * 1.15) / 2;
    for (let i = 0; i < n; i++) push(startX + i * gap * 1.15, RACK_Z + gap * 0.6);
  } else {
    push(0, RACK_Z + gap * 0.5);
  }
  return cups;
}

export function makePong(): PongState {
  return {
    cups: makeCups(),
    ball: { x: 0, y: BALL_HOME.y, z: BALL_HOME.z, vx: 0, vy: 0, vz: 0, sx: 0, sz: 0, squash: 0 },
    flying: false,
    aim: 0,
    power: 0,
    charging: false,
    wind: 0,
    shake: 0,
    slowmo: 0,
    splashes: [],
    victory: false,
    orbit: 0,
    sink: { active: false, x: 0, z: 0, t: 0, y0: CUP_H },
    hype: 0,
    hypePulse: 0,
  };
}

export function launchVector(s: PongState) {
  const speed = 4.0 + s.power * 3.4;
  const lift = 0.9 - s.power * 0.08;
  const lateral = s.aim * 0.5;
  const v = new THREE.Vector3(lateral, lift, -1).normalize().multiplyScalar(speed);
  return { vx: v.x, vy: v.y, vz: v.z };
}

/**
 * Cheap ballistic forecast used for aim-assist feedback.
 * Integrates the same gravity + wind model as the live step and reports how
 * close the predicted rim-crossing lands to the nearest surviving cup.
 * Returns null while the shot is too weak to leave the hand.
 */
export function predictAim(s: PongState): { x: number; z: number; dist: number; closeness: number } | null {
  if (s.power <= 0.08) return null;
  const v = launchVector(s);
  let x = s.ball.x;
  let y = BALL_HOME.y + s.power * 0.05;
  let z = BALL_HOME.z + s.power * 0.14;
  let vx = v.vx;
  let vy = v.vy;
  const vz = v.vz;
  const dt = 1 / 120;
  for (let i = 0; i < 400; i++) {
    vy -= 9.81 * dt;
    vx += s.wind * dt;
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    if (vy < 0 && y <= CUP_H) break;
    if (y < 0) break;
  }
  let dist = Infinity;
  for (const c of s.cups) {
    if (!c.alive) continue;
    dist = Math.min(dist, Math.hypot(x - c.x, z - c.z));
  }
  if (!isFinite(dist)) return null;
  const range = CUP_R * 4.5;
  const closeness = Math.max(0, Math.min(1, 1 - dist / range));
  return { x, z, dist, closeness };
}

export function spawnSplash(s: PongState, x: number, z: number) {
  /* upward beer column - fast, narrow, driven straight out of the cup */
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.22;
    s.splashes.push({
      x: x + Math.cos(a) * 0.012,
      y: CUP_H * 0.82,
      z: z + Math.sin(a) * 0.012,
      vx: Math.cos(a) * r,
      vy: 2.4 + Math.random() * 1.6,
      vz: Math.sin(a) * r,
      life: 0,
      max: 0.6 + Math.random() * 0.4,
      foam: i % 4 === 0,
    });
  }
  /* wide crown of droplets thrown off the rim */
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
    const r = 0.5 + Math.random() * 0.7;
    s.splashes.push({
      x: x + Math.cos(a) * CUP_R * 0.7,
      y: CUP_H * 0.92,
      z: z + Math.sin(a) * CUP_R * 0.7,
      vx: Math.cos(a) * r,
      vy: 1.1 + Math.random() * 1.3,
      vz: Math.sin(a) * r,
      life: 0,
      max: 0.5 + Math.random() * 0.5,
      foam: i % 3 === 0,
    });
  }
  /* slow, buoyant foam clumps that linger over the rim */
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.28;
    s.splashes.push({
      x: x + Math.cos(a) * CUP_R * 0.5,
      y: CUP_H * 0.95 + Math.random() * 0.03,
      z: z + Math.sin(a) * CUP_R * 0.5,
      vx: Math.cos(a) * r,
      vy: 0.5 + Math.random() * 0.7,
      vz: Math.sin(a) * r,
      life: 0,
      max: 0.9 + Math.random() * 0.6,
      foam: true,
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Cups                                                               */
/* ------------------------------------------------------------------ */

const TIP_REST = Math.PI / 2; /* fully on its side */

function Cup({ cup }: { cup: Cup }) {
  const g = useRef<THREE.Group>(null);
  const beerMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const surfaceMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const flash = useRef<THREE.Mesh>(null);
  const flashLight = useRef<THREE.PointLight>(null);
  const liquid = useRef<THREE.Group>(null);
  const spill = useRef<THREE.Mesh>(null);
  const puddle = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 40);
    if (!g.current) return;

    /* cup-fill flash: the beer glows hot for ~0.45s the moment it's sunk */
    const ft = cup.sinkT >= 0 ? Math.max(0, 1 - cup.sinkT / 0.45) : 0;
    const pulse = ft * ft;
    if (beerMat.current) beerMat.current.emissiveIntensity = 0.28 + pulse * 2.6;
    if (surfaceMat.current) surfaceMat.current.emissiveIntensity = 0.35 + pulse * 3.2;
    if (flashLight.current) flashLight.current.intensity = pulse * 3.5;
    if (flash.current) {
      const grow = 1 + (1 - ft) * 2.6;
      flash.current.scale.setScalar(cup.sinkT >= 0 ? grow : 0.001);
      flash.current.visible = ft > 0.01;
      (flash.current.material as THREE.MeshBasicMaterial).opacity = ft * 0.7;
    }

    /* --- beer level: eases up towards the target each time a ball lands,
       with a little overshoot so the surface sloshes as it settles ------- */
    const diff = cup.levelTarget - cup.level;
    cup.level += diff * Math.min(1, dt * 7.5);
    if (Math.abs(diff) > 0.004) {
      /* rising liquid ripples the surface */
      cup.wobble = Math.max(cup.wobble, Math.min(0.12, Math.abs(diff) * 0.5));
    }
    const slosh = Math.sin(cup.wobblePhase * 0.7) * cup.wobble * 0.35;
    if (liquid.current) {
      const shown = Math.max(0.08, Math.min(1.06, cup.level + slosh));
      liquid.current.scale.y += (shown - liquid.current.scale.y) * Math.min(1, dt * 14);
    }

    /* --- overflow: beer sheets down the outside and pools on the table -- */
    if (cup.overflow > 0) {
      cup.overflow = Math.max(0, cup.overflow - dt * 0.85);
      const o = cup.overflow;
      if (spill.current) {
        spill.current.visible = true;
        spill.current.scale.y = Math.min(1, (1 - o) * 2.2);
        (spill.current.material as THREE.MeshStandardMaterial).opacity = o * 0.75;
      }
      if (puddle.current) {
        puddle.current.visible = true;
        puddle.current.scale.setScalar(0.4 + (1 - o) * 1.4);
        (puddle.current.material as THREE.MeshStandardMaterial).opacity = o * 0.5;
      }
    } else {
      if (spill.current) spill.current.visible = false;
      if (puddle.current) puddle.current.visible = false;
    }

    /* rim wobble decay */
    cup.wobblePhase += dt * 22;
    cup.wobble *= Math.exp(-dt * 4.5);


    if (!cup.alive) {
      cup.sinkT += dt;
      /* stage 1 (0 - 0.22s): the cup just shudders from the impact       */
      /* stage 2: gravity torque tips it over, it skids and yaws          */
      if (cup.sinkT > 0.22) {
        const angle = cup.tip * TIP_REST;
        /* torque grows as the centre of mass passes over the rim edge */
        cup.tipVel += (5.5 + Math.sin(angle) * 9) * dt;
        cup.tip = Math.min(1, cup.tip + (cup.tipVel * dt) / TIP_REST);
        cup.slide += cup.tipVel * dt * 0.018;
        cup.spinY += cup.tipVel * dt * 0.12 * cup.tipDir;
        if (cup.tip >= 1) {
          if (!cup.landed) {
            cup.landed = true;
            sfx.clink(Math.min(1, cup.tipVel * 0.35));
            cup.wobble = 0.07;
            cup.wobblePhase = 0;
          }
          /* settle: small bounce of the rim against the wood */
          cup.tipVel *= Math.exp(-dt * 9);
        }
      }
      /* stage 3: once it has come to rest, fade the cup out of play */
      if (cup.landed) cup.fade = Math.max(0, cup.fade - dt * 0.85);
    }

    const w = cup.wobble * Math.sin(cup.wobblePhase);
    const tipAngle = cup.tip * TIP_REST;
    const lean = Math.min(1, cup.fade * 1.4);
    g.current.rotation.set(
      w * 0.25 + Math.sin(cup.spinY) * tipAngle * 0.25,
      cup.spinY,
      w * 0.5 + tipAngle * cup.tipDir,
    );
    /* the cup pivots on its rim, so it drops and slides as it falls */
    g.current.position.set(
      cup.x + cup.slide * cup.tipDir,
      cup.alive ? 0 : -Math.sin(tipAngle) * CUP_R * 0.22,
      cup.z + Math.sin(cup.spinY) * cup.slide * 0.4,
    );
    g.current.scale.setScalar(cup.alive ? 1 : 0.6 + lean * 0.4);
    g.current.visible = cup.fade > 0.02;
  });


  return (
    <group ref={g} position={[cup.x, 0, cup.z]}>
      {/* body */}
      <mesh position={[0, CUP_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[CUP_R, CUP_R * 0.7, CUP_H, 40, 1, true]} />
        <meshPhysicalMaterial
          color="#c8202b"
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.85}
          clearcoatRoughness={0.24}
          sheen={0.4}
          sheenColor="#ff6b6b"
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* thick rim */}
      <mesh position={[0, CUP_H, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[CUP_R * 0.985, CUP_R * 0.075, 12, 44]} />
        <meshPhysicalMaterial color="#e14a52" roughness={0.28} clearcoat={0.9} />
      </mesh>
      {/* beer body - cup filled almost to the rim */}
      <mesh position={[0, CUP_H * 0.4, 0]}>
        <cylinderGeometry
          args={[CUP_R * 0.94, CUP_R * 0.68, CUP_H * 0.8, 36, 1, true]}
        />
        <meshPhysicalMaterial
          ref={beerMat}
          color="#d9931f"
          roughness={0.18}
          metalness={0.05}
          transmission={0.35}
          thickness={0.05}
          emissive="#8a5408"
          emissiveIntensity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* beer surface */}
      <mesh position={[0, CUP_H * 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CUP_R * 0.94, 36]} />
        <meshPhysicalMaterial
          ref={surfaceMat}
          color="#e8a72c"
          roughness={0.12}
          metalness={0.15}
          emissive="#a5670c"
          emissiveIntensity={0.35}
          clearcoat={1}
        />
      </mesh>
      {/* sink flash - expanding light ring above the rim */}
      <mesh
        ref={flash}
        visible={false}
        position={[0, CUP_H * 0.86, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[CUP_R * 0.6, CUP_R * 1.05, 40]} />
        <meshBasicMaterial color="#ffd88a" transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight
        ref={flashLight}
        position={[0, CUP_H * 1.1, 0]}
        color="#ffc65c"
        intensity={0}
        distance={0.9}
      />

      {/* foam head */}
      <mesh position={[0, CUP_H * 0.815, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CUP_R * 0.94, 36]} />
        <meshStandardMaterial color="#f7e6bd" roughness={0.9} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, CUP_H * 0.822, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CUP_R * 0.74, CUP_R * 0.94, 32]} />
        <meshStandardMaterial color="#fff6e0" roughness={0.85} transparent opacity={0.85} />
      </mesh>
      {/* opaque bottom of the beer so you can't see through the cup */}
      <mesh position={[0, CUP_H * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CUP_R * 0.68, 28]} />
        <meshStandardMaterial color="#b8781a" roughness={0.4} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[CUP_R * 0.7, 28]} />
        <meshStandardMaterial color="#8c1a20" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Ball + physics                                                     */
/* ------------------------------------------------------------------ */

function Ball({ state }: { state: PongState }) {
  const ref = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const restTimer = useRef(0);

  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f6f4ee";
    g.fillRect(0, 0, 256, 256);
    /* dirt speckles + faint seam */
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${120 + Math.random() * 60},${110 + Math.random() * 60},${100 + Math.random() * 60},${Math.random() * 0.16})`;
      const r = Math.random() * 3 + 0.5;
      g.beginPath();
      g.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(150,140,125,0.35)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 128);
    g.bezierCurveTo(64, 100, 192, 156, 256, 128);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, []);

  useFrame((_, delta) => {
    const s = state;
    const b = s.ball;
    const scale = 1 - s.slowmo * 0.72;
    const dt = Math.min(delta, 1 / 45) * scale;
    s.slowmo = Math.max(0, s.slowmo - delta * 0.9);
    /* impact shake energy bleeds off over ~0.7s for a cinematic settle */
    s.shake = Math.max(0, s.shake - delta * 1.5);

    /* ---- drop-in animation: ball funnels down into the cup ---------- */
    if (s.sink.active) {
      s.sink.t += delta;
      const p = Math.min(1, s.sink.t / 0.4);
      const ease = 1 - Math.pow(1 - p, 2.2);
      /* slide onto the cup axis quickly, then sink under the foam */
      b.x += (s.sink.x - b.x) * Math.min(1, delta * 18);
      b.z += (s.sink.z - b.z) * Math.min(1, delta * 18);
      b.y = s.sink.y0 + (CUP_H * 0.3 - s.sink.y0) * ease;
      if (ref.current) {
        ref.current.position.set(b.x, b.y, b.z);
        ref.current.rotation.x += delta * 7;
        ref.current.rotation.z += delta * 4;
        ref.current.scale.setScalar(1 - Math.max(0, (p - 0.5) / 0.5) * 0.6);
      }
      if (shadow.current)
        (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0;
      if (p >= 1) {
        s.sink.active = false;
        resetBall(s);
      }
      return;
    }

    if (!s.flying) {
      const tx = s.aim * 0.32;
      const ty = BALL_HOME.y + (s.charging ? s.power * 0.05 : 0);
      const tz = BALL_HOME.z + (s.charging ? s.power * 0.14 : 0);
      const jitter = s.charging ? s.power * 0.006 : 0;
      b.x += (tx - b.x) * Math.min(1, dt * 12) + (Math.random() - 0.5) * jitter;
      b.y += (ty - b.y) * Math.min(1, dt * 12) + (Math.random() - 0.5) * jitter;
      b.z += (tz - b.z) * Math.min(1, dt * 12);
      b.sx *= 0.9;
      b.sz *= 0.9;
    } else {
      b.vy -= 9.81 * dt;
      b.vx += s.wind * dt;
      /* magnus-ish drift from spin */
      b.vx += b.sz * 0.0009;
      const px = b.x;
      const py = b.y;
      const pz = b.z;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      /* table bounce */
      if (b.y < BALL_R) {
        const impact = Math.abs(b.vy);
        b.y = BALL_R;
        b.vy = -b.vy * 0.56;
        b.vx *= 0.82;
        b.vz *= 0.82;
        b.sx += b.vz * 6;
        b.sz -= b.vx * 6;
        if (impact > 0.5) {
          b.squash = Math.min(1, impact * 0.35);
          sfx.bounce(Math.min(1, impact * 0.5));
          s.onBounce?.();
        }
        if (Math.abs(b.vy) < 0.32) b.vy = 0;
      }

      /* swept rim-plane crossing, resolved once against ALL cups so a ball
         dropping into the gap between two cups is always claimed by the
         nearest one instead of slipping through */
      let captureIdx = -1;
      let capX = 0;
      let capZ = 0;
      if (b.vy < 0 && py >= CUP_H && b.y < CUP_H) {
        const t = (py - CUP_H) / Math.max(1e-6, py - b.y);
        const cx = px + (b.x - px) * t;
        const cz = pz + (b.z - pz) * t;
        let best = Infinity;
        for (let i = 0; i < s.cups.length; i++) {
          const c = s.cups[i];
          if (!c.alive) continue;
          const dd = Math.hypot(cx - c.x, cz - c.z);
          if (dd < best) {
            best = dd;
            captureIdx = i;
          }
        }
        /* capture radius reaches into the gap between neighbouring cups */
        if (best > CUP_R * 1.32) captureIdx = -1;
        capX = cx;
        capZ = cz;
      }

      /* cups */
      for (let i = 0; i < s.cups.length; i++) {
        const c = s.cups[i];
        if (!c.alive) continue;
        const dx = b.x - c.x;
        const dz = b.z - c.z;
        const d = Math.hypot(dx, dz);

        const mouthHit = captureIdx === i;
        const mx = mouthHit ? capX - c.x : dx;
        const insideNow = b.vy < 0 && d < CUP_R * 0.9 && b.y < CUP_H && b.y > CUP_H * 0.25;

        if (mouthHit || insideNow) {
          c.alive = false;
          c.wobble = 0.34;
          c.wobblePhase = 0;
          c.sinkT = 0;
          c.tipVel = 0;
          c.tip = 0;
          c.slide = 0;
          c.spinY = 0;
          c.landed = false;
          /* fall away from wherever the ball came in */
          c.tipDir = b.vx + mx >= 0 ? 1 : -1;
          s.flying = false;
          spawnSplash(s, c.x, c.z);
          s.shake = 1;
          /* dedicated glass + beer layer, positioned relative to the camera */
          const dist = Math.hypot(c.x - LISTENER.x, LISTENER.y, c.z - LISTENER.z);
          sfx.sink({
            distance: dist,
            pan: Math.max(-1, Math.min(1, c.x * 2.2)),
            strength: 0.8 + Math.min(0.4, Math.abs(b.vy) * 0.1),
          });
          /* splash lands with the foam burst leaving the rim, crowd reacts
             once the sink visually reads as a make */
          sfx.splash(0);
          sfx.splash(SINK_TIMELINE.foam);
          sfx.cheer(1, SINK_TIMELINE.cheer);
          /* the room gets louder and brighter with every make */
          s.hype = Math.min(1, s.hype + 0.3);
          s.hypePulse = 1;
          s.onSink?.(i);
          /* hand the ball to the drop-in animation instead of teleporting it */
          b.vx = b.vy = b.vz = 0;
          b.squash = 0;
          b.y = Math.max(b.y, CUP_H * 0.98);
          s.sink.active = true;
          s.sink.t = 0;
          s.sink.x = c.x;
          s.sink.z = c.z;
          s.sink.y0 = b.y;
          return;
        }
        /* don't deflect a ball that's dropping straight over the opening */
        const overMouth = b.vy < 0 && d < CUP_R * 0.92 && b.y > CUP_H - BALL_R;
        if (!overMouth && d < CUP_R + BALL_R && b.y < CUP_H + BALL_R) {
          const nx = dx / (d || 1);
          const nz = dz / (d || 1);
          const vn = b.vx * nx + b.vz * nz;
          if (vn < 0) {
            b.vx -= 1.65 * vn * nx;
            b.vz -= 1.65 * vn * nz;
            b.vx *= 0.72;
            b.vz *= 0.72;
            b.sz += vn * 4;
            if (b.y > CUP_H * 0.78 && b.vy < 0) b.vy = Math.abs(b.vy) * 0.5;
            c.wobble = Math.min(0.18, Math.abs(vn) * 0.06);
            c.wobblePhase = 0;
            sfx.cupHit(Math.min(1, Math.abs(vn) * 0.5));
            s.onRim?.(Math.min(1, Math.abs(vn) * 0.9));
          }
          const push = CUP_R + BALL_R - d;
          b.x += nx * push;
          b.z += nz * push;
        }
      }

      const speed = Math.hypot(b.vx, b.vy, b.vz);
      if (speed < 0.22 && b.y <= BALL_R + 0.002) restTimer.current += dt;
      else restTimer.current = 0;

      if (restTimer.current > 0.7 || b.z < -4.6 || b.z > 2.6 || Math.abs(b.x) > 2.2 || b.y < -1) {
        restTimer.current = 0;
        s.flying = false;
        sfx.groan();
        /* the crowd deflates a little on a miss */
        s.hype = Math.max(0, s.hype * 0.55);
        s.onMiss?.();
        resetBall(s);
      }
    }

    b.squash = Math.max(0, b.squash - delta * 6);

    if (ref.current) {
      ref.current.position.set(b.x, b.y, b.z);
      ref.current.rotation.x += (b.vz * 7 + b.sx * 0.4) * dt;
      ref.current.rotation.z -= (b.vx * 7 + b.sz * 0.4) * dt;
      const sq = b.squash;
      ref.current.scale.set(1 + sq * 0.28, 1 - sq * 0.32, 1 + sq * 0.28);
    }
    if (shadow.current) {
      const h = Math.max(0, b.y);
      shadow.current.position.set(b.x, 0.004, b.z);
      const k = THREE.MathUtils.clamp(1 - h * 0.7, 0.25, 1);
      shadow.current.scale.setScalar(k);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.42 * k;
    }
  });

  return (
    <>
      <mesh ref={ref} castShadow>
        <sphereGeometry args={[BALL_R, 36, 36]} />
        <meshPhysicalMaterial
          map={tex}
          color="#ffffff"
          roughness={0.42}
          clearcoat={0.7}
          clearcoatRoughness={0.3}
        />
      </mesh>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BALL_R * 1.7, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

function resetBall(s: PongState) {
  s.ball.x = s.aim * 0.32;
  s.ball.y = BALL_HOME.y;
  s.ball.z = BALL_HOME.z;
  s.ball.vx = s.ball.vy = s.ball.vz = 0;
  s.ball.sx = s.ball.sz = 0;
  s.ball.squash = 0;
}

/* ------------------------------------------------------------------ */
/*  Splash / foam particles                                            */
/* ------------------------------------------------------------------ */

function Splashes({ state }: { state: PongState }) {
  const inst = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const MAX = 220;

  /* hide every instance before the first frame renders */
  useEffect(() => {
    if (!inst.current) return;
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < MAX; i++) inst.current.setMatrixAt(i, dummy.matrix);
    inst.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);


  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 40);
    const list = state.splashes;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;
      /* foam is light and drifty, beer droplets fall fast */
      p.vy -= (p.foam ? 3.4 : 7.8) * dt;
      if (p.foam) {
        p.vx *= Math.exp(-dt * 2.2);
        p.vz *= Math.exp(-dt * 2.2);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.life > p.max || p.y < 0.002) list.splice(i, 1);
    }
    if (!inst.current) return;
    const n = Math.min(list.length, MAX);
    for (let i = 0; i < n; i++) {
      const p = list[i];
      const k = 1 - p.life / p.max;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar((p.foam ? 0.016 : 0.011) * (0.5 + k));
      dummy.updateMatrix();
      inst.current.setMatrixAt(i, dummy.matrix);
      inst.current.setColorAt(
        i,
        p.foam ? new THREE.Color("#fff2d0") : new THREE.Color("#f0b53f"),
      );
    }
    for (let i = n; i < MAX; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      inst.current.setMatrixAt(i, dummy.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, MAX]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial emissive="#c98c1c" emissiveIntensity={0.4} roughness={0.3} />
    </instancedMesh>
  );
}

/* ambient dust motes floating in the bar light */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = Math.random() * 2.4;
      pos[i * 3 + 2] = -Math.random() * 6 + 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((st) => {
    if (!ref.current) return;
    const t = st.clock.elapsedTime;
    ref.current.rotation.y = t * 0.014;
    ref.current.position.y = Math.sin(t * 0.25) * 0.05;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.012} color="#ffd9a0" transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Aim trajectory                                                     */
/* ------------------------------------------------------------------ */

function AimGuide({ state }: { state: PongState }) {
  const ref = useRef<THREE.Group>(null);
  const dots = useMemo(() => new Array(20).fill(0), []);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible = state.charging && !state.flying;
    if (!ref.current.visible) return;
    const { vx, vy, vz } = launchVector(state);
    let x = state.ball.x,
      y = state.ball.y,
      z = state.ball.z,
      ux = vx,
      uy = vy,
      uz = vz;
    const step = 0.042;
    ref.current.children.forEach((c) => {
      for (let k = 0; k < 2; k++) {
        uy -= 9.81 * step * 0.5;
        ux += state.wind * step * 0.5;
        x += ux * step * 0.5;
        y += uy * step * 0.5;
        z += uz * step * 0.5;
      }
      c.position.set(x, Math.max(y, BALL_R * 0.5), z);
      c.visible = y > 0;
    });
  });

  return (
    <group ref={ref}>
      {dots.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[Math.max(0.004, 0.016 - i * 0.0005), 8, 8]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={Math.max(0.08, 0.85 - i * 0.038)}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar environment                                                    */
/* ------------------------------------------------------------------ */

function NeonSign({
  position,
  color,
  w = 0.9,
  h = 0.34,
}: {
  position: [number, number, number];
  color: string;
  w?: number;
  h?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const f = 0.75 + Math.sin(s.clock.elapsedTime * 3.1 + position[0]) * 0.05;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = f;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <torusGeometry args={[w / 2, 0.018, 10, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={2.6} distance={3.2} />
    </group>
  );
}

/* live arena intensity, published by StadiumFX so ambient props can read it */
const arena = { hype: 0, pulse: 0 };

/* blurred crowd silhouettes far behind (DoF blurs them further) */
function Crowd() {
  const people = useMemo(
    () =>
      new Array(16).fill(0).map((_, i) => ({
        x: (Math.random() - 0.5) * 8,
        z: -5.2 - Math.random() * 1.8,
        h: 1.4 + Math.random() * 0.4,
        s: Math.random() * Math.PI * 2,
        c: ["#1b1f27", "#232833", "#171a20"][i % 3],
      })),
    [],
  );
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!g.current) return;
    /* the hotter the run, the more the crowd sways and jumps */
    const h = arena.hype + arena.pulse * 0.6;
    const t = st.clock.elapsedTime * (0.6 + h * 2.4);
    g.current.children.forEach((c, i) => {
      const p = people[i];
      c.position.x = p.x + Math.sin(t + p.s) * (0.05 + h * 0.07);
      c.position.y = Math.abs(Math.sin(t * 1.6 + p.s)) * h * 0.16;
      c.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + p.s) * (0.02 + h * 0.06);
    });
  });
  return (
    <group ref={g}>
      {people.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}>
            <capsuleGeometry args={[0.18, p.h * 0.7, 6, 12]} />
            <meshStandardMaterial color={p.c} roughness={1} />
          </mesh>
          <mesh position={[0, p.h + 0.1, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color={p.c} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Table() {
  const woodTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#5a3722";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 240; i++) {
      g.strokeStyle = `rgba(${40 + Math.random() * 60},${22 + Math.random() * 30},${10 + Math.random() * 20},${0.06 + Math.random() * 0.16})`;
      g.lineWidth = 1 + Math.random() * 5;
      g.beginPath();
      const y = Math.random() * 512;
      g.moveTo(0, y);
      g.bezierCurveTo(170, y + (Math.random() - 0.5) * 26, 340, y + (Math.random() - 0.5) * 26, 512, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 3);
    return t;
  }, []);

  return (
    <group>
      {/* table top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.1]} receiveShadow>
        <planeGeometry args={[2.3, 7.2]} />
        <MeshReflectorMaterial
          map={woodTex}
          resolution={512}
          mirror={0.08}
          mixBlur={10}
          mixStrength={0.12}
          blur={[300, 90]}
          roughness={0.62}
          metalness={0.02}
          depthScale={0.4}
          color="#7a4321"
        />

      </mesh>
      {/* edges */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, -0.03, -1.1]} castShadow>
          <boxGeometry args={[0.06, 0.07, 7.2]} />
          <meshStandardMaterial color="#2b1a11" roughness={0.6} />
        </mesh>
      ))}
      {/* apron / legs area */}
      <mesh position={[0, -0.22, -1.1]}>
        <boxGeometry args={[2.28, 0.4, 7.15]} />
        <meshStandardMaterial color="#170f0a" roughness={0.9} />
      </mesh>
      {/* centre stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -1.1]}>
        <planeGeometry args={[0.01, 7.2]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.07} />
      </mesh>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, -2]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0b0d11" roughness={0.75} metalness={0.15} />
      </mesh>
      {/* back bar wall */}
      <mesh position={[0, 1.2, -7]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#0a0c10" roughness={1} />
      </mesh>
      {/* bar shelf glow */}
      <mesh position={[0, 0.55, -6.4]}>
        <boxGeometry args={[7, 0.05, 0.4]} />
        <meshStandardMaterial color="#20160e" roughness={0.5} />
      </mesh>
      <NeonSign position={[-2.2, 1.5, -5.6]} color="#ff8a3d" w={1.2} />
      <NeonSign position={[2.1, 1.75, -6.0]} color="#38bdf8" w={0.95} />
      <NeonSign position={[0.4, 2.5, -6.8]} color="#f472b6" w={1.1} h={0.35} />
      <Crowd />
      <Dust />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera rig                                                         */
/* ------------------------------------------------------------------ */

function CameraRig({ state }: { state: PongState }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.2, -1.9));
  const pos = useRef(new THREE.Vector3(0, 1.02, 2.2));

  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = st.clock.elapsedTime;
    const b = state.ball;
    const cam = camera as THREE.PerspectiveCamera;

    let target: THREE.Vector3;
    let lookAt: THREE.Vector3;

    if (state.victory) {
      state.orbit += dt * 0.35;
      const r = 2.6;
      target = new THREE.Vector3(
        Math.sin(state.orbit) * r,
        0.95 + Math.sin(state.orbit * 0.7) * 0.2,
        RACK_Z + Math.cos(state.orbit) * r,
      );
      lookAt = new THREE.Vector3(0, 0.12, RACK_Z);
    } else if (state.flying) {
      target = new THREE.Vector3(b.x * 0.28, 0.95 + Math.max(0, b.y) * 0.2, Math.max(b.z + 1.5, 1.1));
      lookAt = new THREE.Vector3(b.x * 0.6, Math.max(b.y, 0.08), b.z - 0.7);
    } else {
      const zoom = state.charging ? state.power : 0;
      target = new THREE.Vector3(b.x * 0.35, 1.02 - zoom * 0.05, 2.2 - zoom * 0.18);
      lookAt = new THREE.Vector3(state.aim * 0.45, 0.16, -1.6);
    }

    /* idle sway */
    target.x += Math.sin(t * 0.55) * 0.012;
    target.y += Math.sin(t * 0.83) * 0.008;

    const lerp = 1 - Math.exp(-dt * (state.flying ? 5.5 : 3.4));
    pos.current.lerp(target, lerp);
    look.current.lerp(lookAt, lerp);

    /* ------------------------------------------------------------ */
    /*  Handheld operator: constant micro-jitter + cinematic impact  */
    /* ------------------------------------------------------------ */
    const s = state.shake;
    /* smooth layered noise reads as a real camera operator, not static */
    const n = (f: number, o: number) =>
      Math.sin(t * f + o) * 0.6 + Math.sin(t * f * 2.37 + o * 1.7) * 0.4;

    const micro = 0.0022; // always-on breathing handheld drift
    const punch = s * s * 0.055; // sharp, quickly-falling impact kick
    const ax = n(11.3, 0.0) * micro + n(37.1, 1.3) * punch;
    const ay = n(9.7, 2.1) * micro + n(41.7, 0.4) * punch;
    const az = n(7.9, 4.2) * micro * 0.6 + n(29.3, 2.8) * punch * 0.5;

    cam.position.set(
      pos.current.x + ax,
      pos.current.y + ay,
      pos.current.z + az,
    );

    /* nudge the look target too so the shake reads as rotation, not slide */
    cam.lookAt(
      look.current.x + n(13.1, 3.4) * micro * 1.4 + n(33.7, 5.1) * punch * 0.9,
      look.current.y + n(10.9, 1.1) * micro * 1.4 + n(39.1, 2.2) * punch * 0.9,
      look.current.z,
    );

    /* subtle dutch roll - the strongest single cue that a hit landed */
    cam.rotateZ(n(8.3, 0.7) * micro * 1.6 + n(27.9, 3.9) * s * 0.03);

    const targetFov = state.charging ? 46 - state.power * 5 : state.flying ? 48 : 47;
    /* quick punch-in on impact, eased back out */
    cam.fov += (targetFov - s * 1.8 - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();
  });
  return null;
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

/**
 * Overhead spotlight on the rack plus stadium atmosphere that ramps with the
 * player's combo: brighter beam, faster sweeping colour lights, louder crowd.
 */
function StadiumFX({ state }: { state: PongState }) {
  const spot = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  const cone = useRef<THREE.Mesh>(null);
  const pool = useRef<THREE.Mesh>(null);
  const sweepA = useRef<THREE.SpotLight>(null);
  const sweepB = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const lastPush = useRef(0);

  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current;
  }, []);

  useFrame((st, delta) => {
    const s = state;
    /* hype decays slowly so a hot streak keeps the room loud */
    s.hype = Math.max(0, s.hype - delta * 0.075);
    s.hypePulse = Math.max(0, s.hypePulse - delta * 1.6);
    const h = Math.min(1, s.hype);
    const pulse = s.hypePulse;
    arena.hype = h;
    arena.pulse = pulse;

    /* push the level into the audio bed a few times a second */
    lastPush.current += delta;
    if (lastPush.current > 0.25) {
      lastPush.current = 0;
      sfx.setHype(h);
    }

    const t = st.clock.elapsedTime;
    const flicker = 1 + Math.sin(t * 9) * 0.015;

    if (spot.current) {
      spot.current.intensity = (16 + h * 20 + pulse * 26) * flicker;
      spot.current.angle = 0.3 + h * 0.05;
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.028 + h * 0.05 + pulse * 0.05) * flicker;
    }
    if (pool.current) {
      const m = pool.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.16 + h * 0.16 + pulse * 0.25;
      pool.current.scale.setScalar(1 + pulse * 0.06);
    }
    /* sweeping arena lights - lazy when calm, whipping when the crowd is up */
    const speed = 0.25 + h * 1.5 + pulse * 1.2;
    if (sweepA.current) {
      sweepA.current.position.x = Math.sin(t * speed) * 2.6;
      sweepA.current.intensity = 2 + h * 12 + pulse * 10;
    }
    if (sweepB.current) {
      sweepB.current.position.x = Math.sin(t * speed * 1.17 + 2.1) * -2.6;
      sweepB.current.intensity = 2 + h * 11 + pulse * 10;
    }
    if (rim.current) rim.current.intensity = h * 6 + pulse * 14;
  });

  return (
    <>
      <object3D ref={target} position={[0, 0, RACK_Z + 0.28]} />
      <spotLight
        ref={spot}
        position={[0, 3.5, RACK_Z + 0.28]}
        angle={0.3}
        penumbra={0.55}
        intensity={16}
        color="#fff2d6"
        distance={8}
        decay={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* visible light shaft falling on the rack */}
      <mesh ref={cone} position={[0, 1.72, RACK_Z + 0.28]} renderOrder={2}>
        <coneGeometry args={[0.82, 3.4, 40, 1, true]} />
        <meshBasicMaterial
          color="#ffdca6"
          transparent
          opacity={0.03}
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* warm pool of light on the felt under the cups */}
      <mesh
        ref={pool}
        position={[0, 0.006, RACK_Z + 0.28]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <circleGeometry args={[0.78, 48]} />
        <meshBasicMaterial
          color="#ffca7a"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={rim} position={[0, 0.6, RACK_Z]} color="#ffd9a0" intensity={0} distance={2.4} />
      <spotLight
        ref={sweepA}
        position={[-2.4, 3.2, -3.4]}
        angle={0.55}
        penumbra={1}
        intensity={2}
        color="#38bdf8"
        distance={11}
      />
      <spotLight
        ref={sweepB}
        position={[2.4, 3.2, -3.6]}
        angle={0.55}
        penumbra={1}
        intensity={2}
        color="#ff8a3d"
        distance={11}
      />
    </>
  );
}

function Scene({ state }: { state: PongState }) {
  return (
    <>
      <color attach="background" args={["#07090d"]} />
      <fog attach="fog" args={["#07090d", 5.5, 12]} />
      <Environment preset="night" />
      <ambientLight intensity={0.26} />
      <directionalLight
        position={[2.2, 4.2, 2]}
        intensity={0.55}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      {/* soft fill over the throwing end - the rack gets its own spotlight */}
      <spotLight
        position={[0, 3.1, 0.6]}
        angle={0.75}
        penumbra={0.9}
        intensity={7}
        color="#ffd9a8"
        distance={9}
      />
      <StadiumFX state={state} />
      <pointLight position={[-1.8, 1.5, -3.2]} intensity={6} color="#ff9a4d" distance={7} />
      <pointLight position={[1.8, 1.7, -3.6]} intensity={5} color="#38bdf8" distance={7} />
      <Table />
      {state.cups.map((c, i) => (
        <Cup key={i} cup={c} />
      ))}
      <Ball state={state} />
      <Splashes state={state} />
      <AimGuide state={state} />
      <CameraRig state={state} />
      <EffectComposer enableNormalPass={false}>
        <Bloom intensity={0.5} luminanceThreshold={0.72} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette eskil={false} offset={0.22} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function BeerPongScene({ state }: { state: PongState }) {
  useEffect(() => {
    sfx.startAmbience();
    return () => sfx.stopAmbience();
  }, []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [0, 1.02, 2.2], fov: 47 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene state={state} />
    </Canvas>
  );
}
