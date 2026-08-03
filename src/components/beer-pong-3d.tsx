import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sfx } from "./beer-pong-audio";

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
  onSink?: (index: number) => void;
  onMiss?: () => void;
  onBounce?: () => void;
};

export const BALL_R = 0.03;
export const CUP_R = 0.065; // +30% vs previous
export const CUP_H = 0.17;
const RACK_Z = -1.75;
const BALL_HOME = { y: 0.34, z: 0.42 };

/* cup formations, chosen by how many cups remain */
export function makeCups(formation: "triangle" | "diamond" | "line" | "tight" = "triangle") {
  const gap = CUP_R * 2 + 0.014;
  const cups: Cup[] = [];
  const push = (x: number, z: number) =>
    cups.push({ x, z, alive: true, wobble: 0, wobblePhase: 0, tip: 0, fade: 1 });

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
  };
}

export function launchVector(s: PongState) {
  const speed = 4.0 + s.power * 3.4;
  const lift = 0.9 - s.power * 0.08;
  const lateral = s.aim * 0.5;
  const v = new THREE.Vector3(lateral, lift, -1).normalize().multiplyScalar(speed);
  return { vx: v.x, vy: v.y, vz: v.z };
}

export function spawnSplash(s: PongState, x: number, z: number) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.6 + 0.25;
    s.splashes.push({
      x,
      y: CUP_H * 0.9,
      z,
      vx: Math.cos(a) * r,
      vy: 1.2 + Math.random() * 1.5,
      vz: Math.sin(a) * r,
      life: 0,
      max: 0.55 + Math.random() * 0.5,
      foam: i % 3 === 0,
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Cups                                                               */
/* ------------------------------------------------------------------ */

function Cup({ cup }: { cup: Cup }) {
  const g = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 40);
    if (!g.current) return;
    /* wobble decay */
    cup.wobblePhase += dt * 22;
    cup.wobble *= Math.exp(-dt * 4.5);
    if (!cup.alive) {
      cup.tip = Math.min(1, cup.tip + dt * 3.2);
      cup.fade = Math.max(0, cup.fade - dt * 1.5);
    }
    const w = cup.wobble * Math.sin(cup.wobblePhase);
    g.current.rotation.z = w * 0.5 + cup.tip * 0.9;
    g.current.rotation.x = w * 0.25;
    g.current.position.set(cup.x, cup.tip * -0.01, cup.z);
    const sc = 0.4 + cup.fade * 0.6;
    g.current.scale.setScalar(cup.alive ? 1 : sc);
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
      {/* beer */}
      <mesh position={[0, CUP_H * 0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CUP_R * 0.92, 36]} />
        <meshPhysicalMaterial
          color="#e8a72c"
          roughness={0.12}
          metalness={0.15}
          emissive="#a5670c"
          emissiveIntensity={0.35}
          clearcoat={1}
        />
      </mesh>
      {/* foam ring */}
      <mesh position={[0, CUP_H * 0.755, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CUP_R * 0.72, CUP_R * 0.92, 32]} />
        <meshStandardMaterial color="#f7e6bd" roughness={0.85} transparent opacity={0.75} />
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
    s.shake = Math.max(0, s.shake - delta * 2.4);

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

      /* cups */
      for (let i = 0; i < s.cups.length; i++) {
        const c = s.cups[i];
        if (!c.alive) continue;
        const dx = b.x - c.x;
        const dz = b.z - c.z;
        const d = Math.hypot(dx, dz);

        if (b.vy < 0 && d < CUP_R * 0.8 && b.y < CUP_H && b.y > CUP_H * 0.3) {
          c.alive = false;
          c.wobble = 0.22;
          s.flying = false;
          spawnSplash(s, c.x, c.z);
          s.shake = 1;
          sfx.splash();
          sfx.cheer(1);
          s.onSink?.(i);
          resetBall(s);
          return;
        }
        if (d < CUP_R + BALL_R && b.y < CUP_H + BALL_R) {
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
      p.vy -= 7.5 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.life > p.max || p.y < 0) list.splice(i, 1);
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
    g.current.children.forEach((c, i) => {
      c.position.x = people[i].x + Math.sin(st.clock.elapsedTime * 0.6 + people[i].s) * 0.05;
      c.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + people[i].s) * 0.02;
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

    /* impact shake */
    if (state.shake > 0.001) {
      const k = state.shake * 0.035;
      target.x += (Math.random() - 0.5) * k;
      target.y += (Math.random() - 0.5) * k;
    }

    const lerp = 1 - Math.exp(-dt * (state.flying ? 5.5 : 3.4));
    pos.current.lerp(target, lerp);
    look.current.lerp(lookAt, lerp);
    cam.position.copy(pos.current);
    cam.lookAt(look.current);

    const targetFov = state.charging ? 46 - state.power * 5 : state.flying ? 48 : 47;
    cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();
  });
  return null;
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

function Scene({ state }: { state: PongState }) {
  return (
    <>
      <color attach="background" args={["#07090d"]} />
      <fog attach="fog" args={["#07090d", 5.5, 12]} />
      <Environment preset="night" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[2.2, 4.2, 2]}
        intensity={0.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      <spotLight
        position={[0, 3.1, -1.4]}
        angle={0.7}
        penumbra={0.85}
        intensity={13}
        color="#ffd9a8"
        distance={9}
        castShadow
      />
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
