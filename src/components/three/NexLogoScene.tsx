import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A live 3D brand model, exported from brand/nex_logo_only.blend.
 *
 * Drives both marks: the S (`/nex-logo.glb`) in the hero and the "nex"
 * wordmark (`/nex-wordmark.glb`) in the footer. This module is loaded lazily
 * (see Model3D) because three.js is a large dependency and neither spot may
 * block first paint — a pre-rendered still stands in until it arrives.
 */

export type LogoModelUrl = '/nex-logo.glb' | '/nex-wordmark.glb';

interface SceneProps {
  url: LogoModelUrl;
  reducedMotion?: boolean;
  /** Camera distance. Lower fills more of the frame. */
  distance?: number;
  /** How far the idle sway swings, in radians. */
  sway?: number;
}

/** An emissive panel in the reflection environment: [color, intensity, position, scale]. */
const LIGHT_PANELS: [string, number, [number, number, number], [number, number]][] = [
  ['#ffffff', 3.2, [0, 3, 4], [9, 3]],
  ['#5cd6d7', 2.4, [-4, 1, 3], [4, 5]],
  ['#8ee7e8', 1.6, [4, -2, 2], [4, 4]],
  ['#ffffff', 1.2, [0, 2, -4], [6, 4]],
];

/**
 * Studio reflections for the metallic surfaces, built as a tiny scene and
 * baked with PMREMGenerator.
 *
 * Deliberately not drei's <Environment>: that spins up its own WebGLRenderer,
 * costing ~3 WebGL contexts per scene, and two scenes on one page was enough
 * to trigger `webglcontextlost`. PMREMGenerator reuses the canvas's existing
 * renderer, so this costs no extra context — and no HDRI download either.
 */
function BrandEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const envScene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(1, 1);
    const disposables: THREE.Material[] = [];

    for (const [color, intensity, position, scale] of LIGHT_PANELS) {
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      // Values above 1 are legal here: PMREM bakes into a half-float target,
      // so panels can read as genuine light sources rather than flat white.
      material.color.set(color).multiplyScalar(intensity);
      const panel = new THREE.Mesh(geometry, material);
      panel.position.set(...position);
      panel.scale.set(scale[0], scale[1], 1);
      panel.lookAt(0, 0, 0);
      envScene.add(panel);
      disposables.push(material);
    }

    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(envScene, 0.04);
    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      geometry.dispose();
      disposables.forEach((material) => material.dispose());
    };
  }, [gl, scene]);

  return null;
}

function LogoModel({
  url,
  reducedMotion,
  sway = 0.42,
}: { url: LogoModelUrl; reducedMotion: boolean; sway?: number }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  // Clone so this component owns its material/transform state rather than
  // mutating the cached GLTF that useGLTF hands out.
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    return copy;
  }, [scene]);

  useFrame((state, delta) => {
    if (!group.current) return;

    if (reducedMotion) {
      group.current.rotation.set(0, -0.3, 0);
      return;
    }

    const t = state.clock.elapsedTime;
    // A slow idle sway, nudged by where the pointer is — enough to read as
    // dimensional without turning the logo into a fidget toy.
    const targetY = -0.28 + Math.sin(t * 0.32) * sway + state.pointer.x * 0.32;
    const targetX = Math.sin(t * 0.24) * 0.1 - state.pointer.y * 0.16;

    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 2.6, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.6, delta);
    group.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  return (
    <group ref={group}>
      <Center>
        {/* Blender is Z-up and glTF is Y-up, so the exporter lays the art flat.
            Tipping it back up puts its face toward the camera. Both models are
            exported facing +Z, so this correction is the same for each. */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={model} />
        </group>
      </Center>
    </group>
  );
}

export default function NexLogoScene({
  url,
  reducedMotion = false,
  distance = 3.9,
  sway = 0.42,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, distance], fov: 40 }}
      // Transparent so the mark composites straight onto the page background
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 6]} intensity={2.1} color="#ffffff" />
      <directionalLight position={[-5, -1, 2]} intensity={1.1} color="#5cd6d7" />

      <BrandEnvironment />
      <LogoModel url={url} reducedMotion={reducedMotion} sway={sway} />
    </Canvas>
  );
}

useGLTF.preload('/nex-logo.glb');
