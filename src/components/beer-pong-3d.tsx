import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Shared mutable game state (driven by the React UI layer)           */
/* ------------------------------------------------------------------ */

export type PongState = {
  /* cups still standing */
  cups: { x: number; z: number; alive: boolean }[];
  /* ball */
  ball: { x: number; y: number; z: number; vx: number; vy: number; vz: number };
  flying: boolean;
  /* aiming */
  aim: number; // -1..1 lateral
  power: number; // 0..1
  charging: boolean;
  /* events consumed by UI */
  onSink?: (index: number) => void;
  onMiss?: () => void;
};

export const BALL_R = 0.045;
export const CUP_R = 0.05;
export const CUP_H = 0.13;

export function makeCups() {
  /* 10-cup triangle pointing at the player */
  const rows = [4, 3, 2, 1];
  const gap = CUP_R * 2 + 0.012;
  const cups: { x: number; z: number; alive: boolean }[] = [];
  let z = -2.5;
  rows.forEach((n) => {
    const startX = -((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) cups.push({ x: startX + i * gap, z, alive: true });
    z += gap * 0.9;
  });
  return cups;
}

export function makePong(): PongState {
  return {
    cups: makeCups(),
    ball: { x: 0, y: 0.42, z: 0.7, vx: 0, vy: 0, vz: 0 },
    flying: false,
    aim: 0,
    power: 0,
    charging: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Cup                                                                */
/* ------------------------------------------------------------------ */

function Cup({ x, z, alive }: { x: number; z: number; alive: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (Math.random() < 0.002) console.log("CUPTICK");
    if (!g.current) return;
    const target = alive ? 1 : 0;
    g.current.scale.y += (target - g.current.scale.y) * Math.min(1, dt * 8);
    g.current.visible = g.current.scale.y > 0.02;
  });

  return (
    <group ref={g} position={[x, 0, z]}>
      {/* cup body - tapered */}
      <mesh castShadow receiveShadow position={[0, CUP_H / 2, 0]}>
        <cylinderGeometry args={[CUP_R, CUP_R * 0.72, CUP_H, 28, 1, true]} />
        <meshPhysicalMaterial
          color="#c2222c"
          roughness={0.35}
          metalness={0.05}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* beer surface */}
      <mesh position={[0, CUP_H * 0.72, 0]}>
        <circleGeometry args={[CUP_R * 0.93, 28]} />
        <meshStandardMaterial
          color="#e2a531"
          roughness={0.15}
          metalness={0.1}
          emissive="#a06a10"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CUP_H * 0.72, 0]}>
        <circleGeometry args={[CUP_R * 0.93, 28]} />
        <meshStandardMaterial color="#f0bd4d" roughness={0.2} />
      </mesh>
      {/* rim */}
      <mesh position={[0, CUP_H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CUP_R * 0.93, CUP_R, 28]} />
        <meshStandardMaterial color="#e14c54" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CUP_R * 0.72, 24]} />
        <meshStandardMaterial color="#8e1a22" roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Physics + ball                                                     */
/* ------------------------------------------------------------------ */

function Ball({ state }: { state: PongState }) {
  console.log("BALL RENDER");
  const ref = useRef<THREE.Mesh>(null);
  const restTimer = useRef(0);
  const dbg = useRef(0);

  useFrame((_, delta) => {
    const s = state;
    const b = s.ball;
    dbg.current += delta; if (dbg.current > 1) { dbg.current = 0; console.log("BALLTICK", b.x.toFixed(2), b.y.toFixed(2), b.z.toFixed(2), !!ref.current); }
    const dt = Math.min(delta, 1 / 45);

    if (!s.flying) {
      /* idle in hand - subtle bob, follows aim while charging */
      const tx = s.aim * 0.35;
      const ty = 0.42 + (s.charging ? s.power * 0.08 : 0);
      const tz = 0.7 + (s.charging ? s.power * 0.1 : 0);
      b.x += (tx - b.x) * Math.min(1, dt * 10);
      b.y += (ty - b.y) * Math.min(1, dt * 10);
      b.z += (tz - b.z) * Math.min(1, dt * 10);
    } else {
      /* integrate */
      b.vy -= 9.81 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      /* table bounce */
      if (b.y < BALL_R) {
        b.y = BALL_R;
        b.vy = -b.vy * 0.52;
        b.vx *= 0.78;
        b.vz *= 0.78;
        if (Math.abs(b.vy) < 0.35) b.vy = 0;
      }

      /* cup interaction */
      for (let i = 0; i < s.cups.length; i++) {
        const c = s.cups[i];
        if (!c.alive) continue;
        const dx = b.x - c.x;
        const dz = b.z - c.z;
        const d = Math.hypot(dx, dz);

        /* sink: dropping through the mouth */
        if (b.vy < 0 && d < CUP_R * 0.82 && b.y < CUP_H && b.y > CUP_H * 0.35) {
          c.alive = false;
          s.flying = false;
          s.onSink?.(i);
          resetBall(s);
          return;
        }
        /* rim / wall bounce */
        if (d < CUP_R + BALL_R && b.y < CUP_H + BALL_R) {
          const nx = dx / (d || 1);
          const nz = dz / (d || 1);
          const vn = b.vx * nx + b.vz * nz;
          if (vn < 0) {
            b.vx -= 1.6 * vn * nx;
            b.vz -= 1.6 * vn * nz;
            b.vx *= 0.7;
            b.vz *= 0.7;
            if (b.y > CUP_H * 0.8 && b.vy < 0) b.vy = Math.abs(b.vy) * 0.45;
          }
          const push = CUP_R + BALL_R - d;
          b.x += nx * push;
          b.z += nz * push;
        }
      }

      /* settle / out of bounds -> miss */
      const speed = Math.hypot(b.vx, b.vy, b.vz);
      if (speed < 0.25 && b.y <= BALL_R + 0.001) restTimer.current += dt;
      else restTimer.current = 0;

      if (restTimer.current > 0.45 || b.z < -4.6 || b.z > 2.4 || Math.abs(b.x) > 2.2 || b.y < -1) {
        restTimer.current = 0;
        s.flying = false;
        s.onMiss?.();
        resetBall(s);
      }
    }

    if (ref.current) {
      ref.current.position.set(b.x, b.y, b.z);
      dbg.current += dt; if (dbg.current > 1) { dbg.current = 0; console.log("BALL", b.x.toFixed(2), b.y.toFixed(2), b.z.toFixed(2), ref.current.visible, ref.current.parent?.type); }
      ref.current.rotation.x += (b.vz || 0) * dt * 6;
      ref.current.rotation.z -= (b.vx || 0) * dt * 6;
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[BALL_R, 32, 32]} />
      <meshPhysicalMaterial color="#fdfdfb" roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.25} />
    </mesh>
  );
}

function resetBall(s: PongState) {
  s.ball.x = s.aim * 0.35;
  s.ball.y = 0.42;
  s.ball.z = 0.7;
  s.ball.vx = s.ball.vy = s.ball.vz = 0;
}

/* ------------------------------------------------------------------ */
/*  Aim guide                                                          */
/* ------------------------------------------------------------------ */

function AimGuide({ state }: { state: PongState }) {
  const ref = useRef<THREE.Group>(null);
  const dots = useMemo(() => new Array(14).fill(0), []);
  useFrame(() => {
    if (Math.random() < 0.01) console.log("GUIDETICK");
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
    const step = 0.055;
    ref.current.children.forEach((c) => {
      for (let k = 0; k < 2; k++) {
        uy -= 9.81 * step * 0.5;
        x += ux * step * 0.5;
        y += uy * step * 0.5;
        z += uz * step * 0.5;
      }
      c.position.set(x, Math.max(y, BALL_R * 0.6), z);
      (c as THREE.Mesh).visible = y > 0;
    });
  });

  return (
    <group ref={ref}>
      {dots.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.012 - i * 0.0004, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.75 - i * 0.04} />
        </mesh>
      ))}
    </group>
  );
}

export function launchVector(s: PongState) {
  const speed = 3.6 + s.power * 3.2;
  const lift = 0.86 - s.power * 0.06;
  const lateral = s.aim * 0.55;
  const v = new THREE.Vector3(lateral, lift, -1).normalize().multiplyScalar(speed);
  return { vx: v.x, vy: v.y, vz: v.z };
}

/* ------------------------------------------------------------------ */
/*  Environment                                                        */
/* ------------------------------------------------------------------ */

function Table() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[2.4, 8]} />
        <meshPhysicalMaterial color="#3a2417" roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.4} />
      </mesh>
      {/* centre stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -1]}>
        <planeGeometry args={[0.012, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} />
      </mesh>
      {/* back wall glow */}
      <mesh position={[0, 1.4, -6]}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color="#0a0d12" />
      </mesh>
      <Float speed={1.4} floatIntensity={0.35}>
        <mesh position={[-1.35, 1.65, -3.4]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#ffb347" />
        </mesh>
      </Float>
      <Float speed={1.1} floatIntensity={0.3}>
        <mesh position={[1.3, 1.85, -3.9]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </Float>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

function Probe() {
  const { clock, frameloop, invalidate } = useThree((st) => ({ clock: st.clock, frameloop: st.frameloop, invalidate: st.invalidate })) as any;
  useEffect(() => {
    const id = setInterval(() => console.log("PROBE", frameloop, clock.getElapsedTime().toFixed(2), clock.running), 1500);
    return () => clearInterval(id);
  }, [clock, frameloop, invalidate]);
  return null;
}

function Scene({ state }: { state: PongState }) {
  return (
    <>
      <color attach="background" args={["#080a0e"]} />
      <fog attach="fog" args={["#080a0e", 7, 16]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 2]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.4, 1.7, -3.4]} intensity={6} color="#ffb347" distance={6} />
      <pointLight position={[1.3, 1.9, -3.9]} intensity={5} color="#38bdf8" distance={6} />

      <spotLight position={[0, 3, -1.6]} angle={0.8} penumbra={0.6} intensity={26} color="#fff1d8" castShadow />
      <Probe />
      <Table />
      {state.cups.map((c, i) => (
        <Cup key={i} x={c.x} z={c.z} alive={c.alive} />
      ))}
      <Ball state={state} />
      <AimGuide state={state} />
    </>
  );
}

export default function BeerPongScene({ state }: { state: PongState }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.75, 2.55], fov: 44 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, -0.15, -1.9)}
    >
      <Scene state={state} />
    </Canvas>
  );
}
