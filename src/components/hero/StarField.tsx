'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Procedurally create a soft circular sprite texture to eliminate hard square edges on particles
function getSoftCircleTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function Galaxy() {
  const ref = useRef<THREE.Points>(null);
  
  const spriteTexture = useMemo(() => getSoftCircleTexture(), []);

  const [positions, colors] = useMemo(() => {
    const count = 12000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    // Color definitions for galaxy gradient
    const colorCore = new THREE.Color('#C4B5FD');  // Warm core light purple
    const colorInner = new THREE.Color('#7C3AED'); // Deep violet
    const colorOuter = new THREE.Color('#06B6D4'); // Bright Cyan
    const colorEdge = new THREE.Color('#08102c');  // Dark blue

    const arms = 3;
    const maxRadius = 160;

    for (let i = 0; i < count; i++) {
      // Exponential distribution to cluster particles towards the center core
      const r = Math.pow(Math.random(), 2.2) * maxRadius;
      const armAngle = ((i % arms) / arms) * Math.PI * 2;
      const spinAngle = r * 0.085; // Curvature of arms

      // Random dispersion that falls off outwards
      const dispersionPower = 2.5;
      const dispersion = Math.max(0, (maxRadius - r) / maxRadius);
      const randomX = Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * 16 * dispersion;
      const randomY = Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * 6 * dispersion;
      const randomZ = Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * 16 * dispersion;

      const x = Math.cos(armAngle + spinAngle) * r + randomX;
      const y = randomY;
      const z = Math.sin(armAngle + spinAngle) * r + randomZ;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Color mapping
      let mixedColor = colorCore.clone();
      
      if (r < maxRadius * 0.15) {
        // Core region (yellow-white to core purple)
        mixedColor.lerp(colorCore, r / (maxRadius * 0.15));
      } else if (r < maxRadius * 0.45) {
        // Inner arms (purple to violet)
        const t = (r - maxRadius * 0.15) / (maxRadius * 0.30);
        mixedColor = colorCore.clone().lerp(colorInner, t);
      } else if (r < maxRadius * 0.8) {
        // Mid arms (violet to cyan)
        const t = (r - maxRadius * 0.45) / (maxRadius * 0.35);
        mixedColor = colorInner.clone().lerp(colorOuter, t);
      } else {
        // Outer fringes (cyan to deep space blue)
        const t = (r - maxRadius * 0.8) / (maxRadius * 0.2);
        mixedColor = colorOuter.clone().lerp(colorEdge, t);
      }

      // Add hot white stars randomly
      if (Math.random() > 0.985) {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 1.0;
        col[i * 3 + 2] = 1.0;
      } else {
        col[i * 3] = mixedColor.r;
        col[i * 3 + 1] = mixedColor.g;
        col[i * 3 + 2] = mixedColor.b;
      }
    }
    return [pos, col];
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      // Rotation on the Y (galaxy plane) axis
      ref.current.rotation.y -= delta * 0.015;
      // Slight wobbling for dynamic depth
      ref.current.rotation.x = Math.sin(_.clock.getElapsedTime() * 0.05) * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.65}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={spriteTexture || undefined}
      />
    </Points>
  );
}

export default function StarField() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 45, 120], fov: 60 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050816']} />
        <Galaxy />
      </Canvas>
    </div>
  );
}

