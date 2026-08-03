/* ------------------------------------------------------------------ */
/*  Mix the Cocktail - real-time 3D scene (Three.js / React Three Fiber) */
/*  Procedural premium bar: metal shaker, crystal coupe, real liquid,   */
/*  refractive ice, garnish, pour stream, HDRI-style lighting, DOF+bloom */
/* ------------------------------------------------------------------ */

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Sparkles,
} from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import { POUR_TARGET, type Phase, type Sim } from "./cocktail-sim";

const GOLD = "#c8a24a";
const BAR_Y = 1.0;
const PROP = 0.3; // barware scale: authored props are ~1 unit tall
const GLASS_X = 0.36; // local X of the coupe inside the prop group

/* ---------------- geometry helpers ---------------- */

function lathe(points: [number, number][], seg = 64) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(Math.max(0.0001, x), y)),
    seg,
  );
}

// Boston-style shaker silhouette
const SHAKER_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.2, 0.0],
  [0.215, 0.02],
  [0.22, 0.35],
  [0.205, 0.62],
  [0.175, 0.78],
  [0.163, 0.8],
  [0.168, 0.83],
  [0.15, 0.86],
  [0.152, 0.95],
  [0.135, 0.98],
  [0.0, 0.985],
];

// Crystal coupe / martini hybrid
const GLASS_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.3, 0.0],
  [0.305, 0.018],
  [0.29, 0.03],
  [0.05, 0.055],
  [0.032, 0.1],
  [0.03, 0.42],
  [0.06, 0.47],
  [0.42, 0.86],
  [0.435, 0.87],
  [0.425, 0.855],
  [0.055, 0.475],
  [0.04, 0.44],
];

const BOWL_BOTTOM = 0.475; // local y where liquid starts
const BOWL_TOP = 0.86; // rim
const BOWL_TOP_R = 0.42;
const BOWL_BOTTOM_R = 0.06;

/* ---------------- bar environment ---------------- */

function EdisonBulb({ x, z, delay }: { x: number; z: number; delay: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime + delay;
      ref.current.intensity = 5.5 + Math.sin(t * 2.1) * 0.35 + Math.sin(t * 7.3) * 0.12;
    }
  });
  return (
    <group position={[x, BAR_Y + 1.5, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.9, 6]} />
        <meshBasicMaterial color="#141010" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffb765"
          emissiveIntensity={4}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* volumetric cone */}
      <mesh position={[0, -0.75, 0]}>
        <coneGeometry args={[0.55, 1.5, 24, 1, true]} />
        <meshBasicMaterial
          color="#ffb765"
          transparent
          opacity={0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={ref} color="#ffc17a" intensity={5.5} distance={5} decay={2} castShadow />
    </group>
  );
}

function BackBar() {
  const bottles = useMemo(() => {
    const rng = (i: number, m: number) => ((Math.sin(i * 127.1) * 43758.5453) % 1 + 1) % 1 * m;
    return Array.from({ length: 26 }, (_, i) => ({
      x: -2.4 + (i % 13) * 0.38 + rng(i, 0.1),
      y: BAR_Y + 0.42 + Math.floor(i / 13) * 0.62,
      h: 0.24 + rng(i + 5, 0.16),
      r: 0.035 + rng(i + 9, 0.025),
      c: new THREE.Color().setHSL(0.06 + rng(i + 3, 0.14), 0.55, 0.3),
    }));
  }, []);

  return (
    <group position={[0, 0, -2.1]}>
      {/* dark wall */}
      <mesh position={[0, BAR_Y + 0.9, -0.35]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#120d0a" roughness={0.95} />
      </mesh>
      {[0, 1].map((s) => (
        <mesh key={s} position={[0, BAR_Y + 0.4 + s * 0.62, -0.15]} receiveShadow>
          <boxGeometry args={[5.6, 0.04, 0.36]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
      {bottles.map((b, i) => (
        <mesh key={i} position={[b.x, b.y + b.h / 2, -0.15]}>
          <cylinderGeometry args={[b.r * 0.45, b.r, b.h, 12]} />
          <meshStandardMaterial
            color={b.c}
            roughness={0.12}
            metalness={0.05}
            transparent
            opacity={0.85}
            emissive={b.c}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function Counter() {
  return (
    <group>
      <mesh position={[0, BAR_Y - 0.07, 0]} receiveShadow>
        <boxGeometry args={[8, 0.14, 2.6]} />
        <meshPhysicalMaterial
          color="#2b1a10"
          roughness={0.22}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          reflectivity={0.6}
        />
      </mesh>
      <mesh position={[0, BAR_Y - 0.42, 1.2]}>
        <boxGeometry args={[8, 0.7, 0.16]} />
        <meshStandardMaterial color="#1a100a" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ---------------- shaker ---------------- */

function Shaker({ simRef, phase }: { simRef: React.RefObject<Sim>; phase: Phase }) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => lathe(SHAKER_PROFILE), []);
  const capGeo = useMemo(
    () => lathe([[0, 0.94], [0.14, 0.945], [0.145, 1.01], [0.11, 1.05], [0, 1.055]]),
    [],
  );
  // spring state
  const rot = useRef({ z: 0, vz: 0, x: 0, vx: 0 });

  useFrame((state, dt) => {
    const g = group.current;
    const s = simRef.current;
    if (!g || !s) return;
    const d = Math.min(0.05, dt);
    const t = state.clock.elapsedTime;

    const pouring = phase === "pour" || phase === "result";
    const targetZ = pouring ? -Math.min(1.5, s.tilt) : phase === "shake" ? Math.sin(t * 13) * 0.5 * s.shakeLevel : 0;
    const targetX = phase === "shake" ? Math.cos(t * 11) * 0.3 * s.shakeLevel : 0;

    // heavy spring (never snaps)
    const k = 60;
    const damp = 9;
    rot.current.vz += ((targetZ - rot.current.z) * k - rot.current.vz * damp) * d;
    rot.current.z += rot.current.vz * d;
    rot.current.vx += ((targetX - rot.current.x) * k - rot.current.vx * damp) * d;
    rot.current.x += rot.current.vx * d;

    g.rotation.z = rot.current.z;
    g.rotation.x = rot.current.x;

    const shakeAmp = phase === "shake" ? s.shakeLevel : 0;
    g.position.set(
      (pouring ? GLASS_X - 0.16 : 0) + Math.sin(t * 17) * 0.05 * shakeAmp,
      BAR_Y + (pouring ? 0.72 : 0.0) + Math.cos(t * 21) * 0.035 * shakeAmp + (pouring ? Math.sin(t * 1.4) * 0.01 : 0),
      Math.sin(t * 0.6) * 0.004,
    );
    g.visible = phase !== "result";
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#e6e9ee"
          metalness={1}
          roughness={0.16}
          envMapIntensity={3.2}
        />
      </mesh>
      <mesh geometry={capGeo} castShadow>
        <meshStandardMaterial color="#dfe3e9" metalness={1} roughness={0.26} envMapIntensity={3} />
      </mesh>
      {/* brushed band */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.212, 0.212, 0.05, 48, 1, true]} />
        <meshStandardMaterial color="#8f949b" metalness={1} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------------- liquid surface (real 3D wave mesh) ---------------- */

type Modal = { a: number[]; v: number[] };

function useSlosh() {
  return useRef<Modal>({ a: [0, 0, 0], v: [0, 0, 0] });
}

function LiquidSurface({
  radius,
  hue,
  modal,
  froth,
}: {
  radius: number;
  hue: number;
  modal: React.RefObject<Modal>;
  froth: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.CircleGeometry(1, 56, 0, Math.PI * 2), []);
  const base = useMemo(() => geo.attributes.position.array.slice(0) as Float32Array, [geo]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    const mo = modal.current;
    if (!m || !mo) return;
    const t = clock.elapsedTime;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const r = Math.hypot(x, y);
      const th = Math.atan2(y, x);
      const w =
        mo.a[0] * r * Math.cos(th) +
        mo.a[1] * r * Math.sin(th) +
        mo.a[2] * (1 - r * r) +
        Math.sin(r * 14 - t * 3.4) * 0.006 * (1 - r * 0.6) +
        Math.sin(th * 3 + t * 2.1) * 0.004 * r;
      pos.setZ(i, w);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  const col = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.82, 0.5), [hue]);

  return (
    <mesh ref={mesh} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} scale={[radius, radius, 1]}>
      <meshPhysicalMaterial
        color={col}
        roughness={0.06 + froth * 0.5}
        metalness={0}
        transmission={0.55}
        thickness={0.4}
        ior={1.36}
        clearcoat={1}
        clearcoatRoughness={0.05}
        transparent
        opacity={0.97}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ---------------- ice, garnish ---------------- */

function roundedBox(size: number, r: number) {
  return new THREE.BoxGeometry(size, size, size, 4, 4, 4).toNonIndexed();
}

function IceCube(props: ThreeElements["mesh"] & { seed: number }) {
  const { seed, ...rest } = props;
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.055, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const n = Math.sin(i * 12.9898 + seed) * 43758.5453;
      const j = ((n % 1) + 1) % 1;
      p.setXYZ(i, p.getX(i) * (0.86 + j * 0.3), p.getY(i) * (0.9 + j * 0.22), p.getZ(i) * (0.86 + j * 0.3));
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  return (
    <mesh geometry={geo} castShadow {...rest}>
      <meshPhysicalMaterial
        color="#eaf6ff"
        roughness={0.05}
        transmission={1}
        thickness={0.09}
        ior={1.31}
        transparent
        opacity={0.92}
        clearcoat={1}
      />
    </mesh>
  );
}

function MintLeaf(props: ThreeElements["mesh"]) {
  return (
    <mesh {...props} castShadow>
      <sphereGeometry args={[0.045, 12, 8]} />
      <meshStandardMaterial color="#2f8f4e" roughness={0.45} />
    </mesh>
  );
}

function LimeWedge(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.028, 24, 1, false, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#a7d92b" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Cherry(props: ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh castShadow>
        <sphereGeometry args={[0.045, 20, 16]} />
        <meshPhysicalMaterial color="#7d0b1e" roughness={0.18} clearcoat={1} />
      </mesh>
      <mesh position={[0.01, 0.055, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.003, 0.003, 0.09, 6]} />
        <meshStandardMaterial color="#3d5220" />
      </mesh>
    </group>
  );
}

/* ---------------- pour stream ---------------- */

function PourStream({ simRef }: { simRef: React.RefObject<Sim> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const drops = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(Array.from({ length: 8 }, () => new THREE.Vector3())),
    [],
  );
  const parts = useRef(
    Array.from({ length: 40 }, () => ({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, s: 1 })),
  );

  useFrame(({ clock }, dt) => {
    const s = simRef.current;
    const m = mesh.current;
    if (!s || !m) return;
    const d = Math.min(0.05, dt);
    const t = clock.elapsedTime;
    const flow = s.pourFlow;
    m.visible = flow > 0.02;

    const from = new THREE.Vector3(GLASS_X, BAR_Y + 0.72 + 0.42, 0);
    const surfaceY = BAR_Y + BOWL_BOTTOM + (BOWL_TOP - BOWL_BOTTOM) * s.glassFill;
    const to = new THREE.Vector3(GLASS_X, surfaceY, 0);

    if (m.visible) {
      const pts = curve.points;
      for (let i = 0; i < pts.length; i++) {
        const p = i / (pts.length - 1);
        const gravity = p * p;
        pts[i].set(
          from.x + (to.x - from.x) * (p * 0.55 + gravity * 0.45) + Math.sin(t * 9 + p * 6) * 0.006 * flow,
          from.y + (to.y - from.y) * gravity,
          from.z + Math.cos(t * 7 + p * 5) * 0.004 * flow,
        );
      }
      curve.updateArcLengths?.();
      const r = 0.006 + flow * 0.016;
      const next = new THREE.TubeGeometry(curve, 22, r, 8, false);
      m.geometry.dispose();
      m.geometry = next;
    }

    // droplets / micro splashes
    const arr = parts.current;
    if (flow > 0.05 && Math.random() < flow * 0.9) {
      const free = arr.find((p) => p.life <= 0);
      if (free) {
        free.x = to.x + (Math.random() - 0.5) * 0.05;
        free.y = surfaceY + 0.01;
        free.z = to.z + (Math.random() - 0.5) * 0.05;
        free.vx = (Math.random() - 0.5) * 0.5 * flow;
        free.vy = 0.4 + Math.random() * 0.8 * flow;
        free.vz = (Math.random() - 0.5) * 0.5 * flow;
        free.life = 0.5 + Math.random() * 0.4;
        free.s = 0.4 + Math.random() * 0.9;
      }
    }
    const im = drops.current;
    if (im) {
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        if (p.life > 0) {
          p.vy -= 3.2 * d;
          p.x += p.vx * d;
          p.y += p.vy * d;
          p.z += p.vz * d;
          p.life -= d;
          dummy.position.set(p.x, p.y, p.z);
          dummy.scale.setScalar(0.012 * p.s * Math.max(0, Math.min(1, p.life * 3)));
        } else {
          dummy.position.set(0, -99, 0);
          dummy.scale.setScalar(0.0001);
        }
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  });

  const col = useMemo(() => new THREE.Color("#bfe9d6"), []);

  return (
    <group>
      <mesh ref={mesh} visible={false}>
        <cylinderGeometry args={[0.001, 0.001, 0.001]} />
        <meshPhysicalMaterial
          color={col}
          roughness={0.02}
          transmission={1}
          thickness={0.12}
          ior={1.38}
          transparent
          opacity={0.95}
          clearcoat={1}
        />
      </mesh>
      <instancedMesh ref={drops} args={[undefined, undefined, 40]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshPhysicalMaterial
          color="#dff6ea"
          roughness={0.05}
          transmission={0.9}
          thickness={0.05}
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  );
}

/* ---------------- glass + drink ---------------- */

function Drink({ simRef, phase }: { simRef: React.RefObject<Sim>; phase: Phase }) {
  const group = useRef<THREE.Group>(null);
  const liquid = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.Group>(null);
  const iceRefs = useRef<THREE.Group>(null);
  const glassGeo = useMemo(() => lathe(GLASS_PROFILE, 72), []);
  const modal = useSlosh();
  const [hue, setHue] = useState(150);
  const lastHue = useRef(150);
  const tiltRef = useRef({ x: 0, z: 0 });

  useFrame(({ clock }, dt) => {
    const s = simRef.current;
    if (!s) return;
    const d = Math.min(0.05, dt);
    const t = clock.elapsedTime;

    if (Math.abs(s.hue - lastHue.current) > 2) {
      lastHue.current = s.hue;
      setHue(s.hue);
    }

    const fill = Math.max(0, Math.min(1, s.glassFill));
    const h = (BOWL_TOP - BOWL_BOTTOM) * fill;
    const rTop = BOWL_BOTTOM_R + (BOWL_TOP_R - BOWL_BOTTOM_R) * fill;

    // slosh modes driven by pour impact + tilt + phone motion
    const mo = modal.current;
    const drive = s.pourFlow * 0.02 + (phase === "result" ? 0 : 0);
    for (let i = 0; i < 3; i++) {
      const w = 6 + i * 3.4;
      mo.v[i] += (-w * w * mo.a[i] - 2.4 * mo.v[i]) * d;
      mo.a[i] += mo.v[i] * d;
    }
    mo.v[0] += Math.sin(t * 2.3) * drive;
    mo.v[2] += drive * 1.6;

    if (liquid.current) {
      liquid.current.visible = fill > 0.01;
      liquid.current.scale.set(rTop, h, rTop);
      liquid.current.position.y = BOWL_BOTTOM + h / 2;
    }
    if (surface.current) {
      surface.current.visible = fill > 0.01;
      surface.current.position.y = BOWL_BOTTOM + h;
      surface.current.scale.setScalar(rTop * 0.985);
    }

    // ice + garnish float on the surface
    if (iceRefs.current) {
      iceRefs.current.position.y = BOWL_BOTTOM + h - 0.02;
      iceRefs.current.visible = fill > 0.08;
      iceRefs.current.children.forEach((c, i) => {
        const ph = i * 1.7;
        c.position.x = Math.sin(t * 0.7 + ph) * rTop * 0.42;
        c.position.z = Math.cos(t * 0.55 + ph * 1.3) * rTop * 0.42;
        c.position.y = Math.sin(t * 1.7 + ph) * 0.012 + (modal.current?.a[2] ?? 0);
        c.rotation.x += d * (0.4 + i * 0.12);
        c.rotation.y += d * 0.5;
      });
    }

    // glass reacts to gravity/tilt with spring inertia
    const g = group.current;
    if (g) {
      const tz = phase === "pour" ? Math.sin(t * 0.8) * 0.008 : 0;
      tiltRef.current.z += (tz - tiltRef.current.z) * Math.min(1, d * 4);
      g.rotation.z = tiltRef.current.z;
      g.position.y = BAR_Y;
    }
  });

  const liquidColor = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.85, 0.42), [hue]);
  const iceCount = Math.min(4, Math.max(0, simRef.current?.ice.length ?? 0));

  return (
    <group ref={group} position={[GLASS_X, BAR_Y, 0]}>
      {/* body of the drink */}
      <mesh ref={liquid} visible={false}>
        <coneGeometry args={[1, 1, 56, 1, false]} />
        <meshPhysicalMaterial
          color={liquidColor}
          roughness={0.08}
          transmission={0.72}
          thickness={0.5}
          ior={1.35}
          attenuationDistance={0.4}
          attenuationColor={liquidColor}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* animated surface */}
      <group ref={surface} visible={false}>
        <LiquidSurface radius={1} hue={hue} modal={modal} froth={simRef.current?.froth ?? 0} />
      </group>

      {/* ice + garnish */}
      <group ref={iceRefs} visible={false}>
        {Array.from({ length: Math.max(2, iceCount) }, (_, i) => (
          <IceCube key={i} seed={i * 3.7} />
        ))}
        <MintLeaf position={[0.1, 0.01, -0.06]} scale={[1, 0.35, 1.4]} />
        <MintLeaf position={[-0.09, 0.012, 0.07]} scale={[1, 0.32, 1.3]} rotation={[0, 0.8, 0]} />
        <LimeWedge position={[0.16, 0.005, 0.12]} rotation={[0.2, 0.6, 0]} />
        <Cherry position={[-0.14, 0.02, -0.1]} />
      </group>

      {/* the crystal itself, drawn last for correct refraction */}
      <mesh geometry={glassGeo} castShadow>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.06}
          roughness={0.03}
          ior={1.52}
          chromaticAberration={0.05}
          anisotropy={0.2}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.05}
          samples={4}
          resolution={512}
          backside
          backsideThickness={0.1}
          color="#eef6ff"
          attenuationColor="#dceaff"
          attenuationDistance={2}
        />
      </mesh>
    </group>
  );
}

/* ---------------- camera director ---------------- */

const SHOTS: Record<Phase, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  intro: { pos: [0.06, BAR_Y + 0.26, 0.62], look: [0.05, BAR_Y + 0.12, 0], fov: 34 },
  recipe: { pos: [0.12, BAR_Y + 0.3, 0.7], look: [0.05, BAR_Y + 0.12, 0], fov: 36 },
  ingredients: { pos: [0.06, BAR_Y + 0.28, 0.64], look: [0.03, BAR_Y + 0.12, 0], fov: 35 },
  shake: { pos: [0, BAR_Y + 0.3, 0.78], look: [0, BAR_Y + 0.14, 0], fov: 38 },
  pour: { pos: [0.14, BAR_Y + 0.34, 0.68], look: [0.1, BAR_Y + 0.16, 0], fov: 34 },
  result: { pos: [0.11, BAR_Y + 0.22, 0.5], look: [0.11, BAR_Y + 0.11, 0], fov: 30 },
};

function CameraRig({ phase }: { phase: Phase }) {
  const { camera, pointer, size } = useThree();
  const look = useRef(new THREE.Vector3(0, BAR_Y + 0.45, 0));

  useFrame(({ clock }, dt) => {
    const d = Math.min(0.05, dt);
    const t = clock.elapsedTime;
    const shot = SHOTS[phase] ?? SHOTS.intro;

    let [px, py, pz] = shot.pos;
    if (phase === "result") {
      // slow cinematic orbit around the finished drink
      const a = t * 0.28;
      px = GLASS_X * PROP + Math.sin(a) * 0.46;
      pz = Math.cos(a) * 0.46;
      py = BAR_Y + 0.2 + Math.sin(t * 0.4) * 0.03;
    }

    // parallax + tiny handheld drift
    px += pointer.x * 0.06 + Math.sin(t * 1.3) * 0.006;
    py += pointer.y * 0.03 + Math.cos(t * 1.7) * 0.005;

    camera.position.lerp(new THREE.Vector3(px, py, pz), Math.min(1, d * (phase === "result" ? 4 : 2.2)));
    look.current.lerp(new THREE.Vector3(shot.look[0], shot.look[1], shot.look[2]), Math.min(1, d * 2.5));
    camera.lookAt(look.current);

    const cam = camera as THREE.PerspectiveCamera;
    if (cam.isPerspectiveCamera) {
      // frame by HORIZONTAL fov so tall phone screens don't crop into the props
      const aspect = Math.max(0.35, size.width / Math.max(1, size.height));
      const hRad = (shot.fov * Math.PI) / 180;
      const vDeg = (2 * Math.atan(Math.tan(hRad / 2) / aspect) * 180) / Math.PI;
      const target = Math.min(70, vDeg);
      cam.fov += (target - cam.fov) * Math.min(1, d * 2.5);
      cam.updateProjectionMatrix();
    }
  });
  return null;
}


/* ---------------- scene ---------------- */

function Scene({ simRef, phase }: { simRef: React.RefObject<Sim>; phase: Phase }) {
  const done = phase === "result";
  return (
    <>
      <color attach="background" args={["#0a0705"]} />
      <fogExp2 attach="fog" args={["#120b06", 0.16]} />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4.2} color="#ffb26b" position={[-2, 3, -1]} scale={[6, 3, 1]} />
        <Lightformer form="circle" intensity={7} color="#ffd7a1" position={[0, 2.4, 1.4]} scale={2} />
        <Lightformer form="rect" intensity={2.6} color="#4a7fb5" position={[3, 1.6, -2]} scale={[4, 3, 1]} />
        <Lightformer form="ring" intensity={5} color="#ffffff" position={[1.4, 1.4, 1.8]} scale={1.2} />
      </Environment>

      <ambientLight intensity={done ? 0.5 : 0.24} color="#ffcf9a" />
      <spotLight
        position={[0.8, BAR_Y + 2.2, 1.2]}
        angle={0.7}
        penumbra={0.9}
        intensity={done ? 26 : 16}
        color="#ffd2a0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.5} color="#ffd9b0" />
      <EdisonBulb x={-1.15} z={-0.5} delay={0} />
      <EdisonBulb x={1.15} z={-0.5} delay={2.3} />

      <Counter />
      <BackBar />
      {/* props are authored at ~1 unit tall; scale them to real barware size */}
      <group position={[0, BAR_Y * (1 - PROP), 0]} scale={PROP}>
        <Shaker simRef={simRef} phase={phase} />
        <Drink simRef={simRef} phase={phase} />
        <PourStream simRef={simRef} />
      </group>


      <ContactShadows
        position={[0, BAR_Y + 0.002, 0]}
        opacity={0.75}
        scale={4}
        blur={2.6}
        far={1.2}
        resolution={512}
        color="#000000"
      />

      {/* haze */}
      <Sparkles count={40} scale={[4, 2, 2]} size={4} speed={0.2} opacity={0.22} color="#ffd9a8" position={[0, BAR_Y + 0.7, 0]} />
      {done && (
        <Sparkles
          count={120}
          scale={[1.6, 1.2, 1.6]}
          size={7}
          speed={0.35}
          opacity={0.9}
          color={GOLD}
          position={[0, BAR_Y + 0.55, 0]}
        />
      )}

      <CameraRig phase={phase} />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <DepthOfField focusDistance={0.017} focalLength={0.28} bokehScale={2.2} height={480} />
        <Bloom intensity={done ? 1.25 : 0.75} luminanceThreshold={0.62} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function CocktailScene({
  simRef,
  phase,
}: {
  simRef: React.RefObject<Sim>;
  phase: Phase;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ position: [0.05, BAR_Y + 0.62, 1.15], fov: 32, near: 0.05, far: 40 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.45;
      }}
      className="absolute inset-0 size-full touch-none"
    >
      <Scene simRef={simRef} phase={phase} />
    </Canvas>
  );
}

export { POUR_TARGET };
