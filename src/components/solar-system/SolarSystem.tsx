'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { PLANET_DATA } from '@/lib/constants';

const PLANET_STORIES = {
  Mercury: "Mercury is a land of extremes. With no atmosphere, its surface ranges from a scorching 430°C in the day to a freezing -180°C at night. If you stood on Mercury, the Sun would appear three times larger than it does on Earth.",
  Venus: "Venus is Earth's evil twin. Its thick carbon dioxide atmosphere traps heat, creating a runaway greenhouse effect with surface temperatures hot enough to melt lead. It also rotates backwards, so the Sun rises in the west.",
  Earth: "Earth is our fragile blue oasis, the only known place in the universe harboring life. Its liquid water, protective atmosphere, and magnetic shield create the perfect cosmic goldilocks zone.",
  Mars: "Mars is a cold, desert world covered in iron oxide dust, giving it its iconic rusty red color. It is home to Olympus Mons, the largest volcano in the Solar System, which is three times taller than Mount Everest.",
  Jupiter: "Jupiter is a gas giant twice as massive as all other planets combined. Its iconic Great Red Spot is a giant storm wider than Earth that has raged for over 300 years.",
  Saturn: "Saturn is 1.4 billion km away. If you drove a car at 100 km/h continuously, it would take over 1500 years to reach Saturn. Its majestic rings are made of billions of ice particles, rocky debris, and dust.",
  Uranus: "Uranus is an ice giant that rotates completely on its side, rolling around the Sun like a bowling ball. This extreme tilt gives it 21-year-long seasons.",
  Neptune: "Neptune is the most distant planet, swept by supersonic winds reaching up to 2,100 km/h. It is a deep-blue ice giant with active storm systems and a freezing moon, Triton, that orbits backwards.",
};

function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.05; });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[3.0, 64, 64]} />
      <meshBasicMaterial color="#FFF580" />
      <pointLight intensity={8} distance={300} decay={0.8} color="#FFEB60" />
    </mesh>
  );
}

function SunCorona() {
  const coronaRef1 = useRef<THREE.Mesh>(null);
  const coronaRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (coronaRef1.current) {
      coronaRef1.current.rotation.z = elapsed * 0.04;
      const s = 1.0 + Math.sin(elapsed * 1.5) * 0.03;
      coronaRef1.current.scale.set(s, s, s);
    }
    if (coronaRef2.current) {
      coronaRef2.current.rotation.z = -elapsed * 0.02;
      const s = 1.0 + Math.cos(elapsed * 2.0) * 0.02;
      coronaRef2.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <mesh ref={coronaRef1}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#FF9000" transparent opacity={0.35} side={THREE.BackSide} />
      </mesh>
      <mesh ref={coronaRef2}>
        <sphereGeometry args={[3.6, 32, 32]} />
        <meshBasicMaterial color="#FF3A00" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

function OrbitPath({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line>
      <primitive object={lineGeometry} attach="geometry" />
      <lineBasicMaterial color="#7C3AED" transparent opacity={0.12} />
    </line>
  );
}

function AsteroidBelt({ innerRadius = 24.5, outerRadius = 27.5, count = 800 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.45; // thin belt disc
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [innerRadius, outerRadius, count]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <points>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial color="#a78bfa" size={0.05} transparent opacity={0.28} sizeAttenuation />
    </points>
  );
}

// Procedural concentric ring shader for Saturn's ring system
function SaturnRings({ radius }: { radius: number }) {
  const RingShader = {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vLocalPosition;
      void main() {
        vUv = uv;
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vLocalPosition;
      void main() {
        float dist = length(vLocalPosition.xz);
        
        // Multi-frequency sine waves to create gaps and dense rings
        float stripe = sin(dist * 28.0) * 0.35 + 0.65;
        stripe += sin(dist * 90.0) * 0.15;
        stripe += sin(dist * 220.0) * 0.08;
        
        // Fade opacity smoothly at the inner/outer borders
        float borderFade = smoothstep(1.3 * ${radius.toFixed(2)}, 1.45 * ${radius.toFixed(2)}, dist) *
                           (1.0 - smoothstep(2.1 * ${radius.toFixed(2)}, 2.3 * ${radius.toFixed(2)}, dist));
        
        vec3 ringColor = vec3(0.85, 0.76, 0.58) * stripe;
        gl_FragColor = vec4(ringColor, borderFade * 0.7);
      }
    `
  };

  return (
    <mesh rotation={[0, 0, 0]}>
      {/* Flat ring plane aligned horizontally on XZ */}
      <ringGeometry args={[radius * 1.35, radius * 2.3, 128]} />
      <shaderMaterial
        vertexShader={RingShader.vertexShader}
        fragmentShader={RingShader.fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Planet({
  name, radius, distance, speed, color, hasRings, onSelectPlanet, isSelected,
}: {
  name: string; radius: number; distance: number;
  speed: number; color: string; hasRings?: boolean;
  onSelectPlanet: (name: string) => void; isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() * speed * 0.1;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * distance;
      groupRef.current.position.z = Math.sin(t) * distance;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }

    // Smoothly scale up on hover
    const scaleFactor = isSelected ? 1.35 : hovered ? 1.25 : 1.0;
    if (meshRef.current) {
      const curScale = meshRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(curScale, scaleFactor, 0.1);
      meshRef.current.scale.set(nextScale, nextScale, nextScale);
    }
    
    // Animate glow mesh opacity
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = hovered || isSelected ? 0.28 : 0.06;
      glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity, 0.1);
      const glowScale = scaleFactor * 1.12;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }
  });

  return (
    <>
      <OrbitPath radius={distance} />
      <group ref={groupRef}>
        <mesh 
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlanet(name);
          }}
        >
          <sphereGeometry args={[radius, 48, 48]} />
          {/* Upgrade planet materials to look far more detailed and organic */}
          <meshStandardMaterial
            color={color}
            roughness={name === 'Venus' ? 0.95 : name === 'Earth' ? 0.35 : 0.7}
            metalness={name === 'Mercury' ? 0.6 : 0.1}
            emissive={color}
            emissiveIntensity={hovered || isSelected ? 0.35 : 0.12}
          />
        </mesh>

        {/* Dynamic Glow Aura */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Saturn Ring System */}
        {hasRings && <SaturnRings radius={radius} />}
      </group>
    </>
  );
}

// Camera manager to smoothly interpolation position & target on click
function SolarSystemCameraManager({ selectedPlanet }: { selectedPlanet: string | null }) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ clock }) => {
    if (selectedPlanet) {
      const p = PLANET_DATA.find(x => x.name === selectedPlanet);
      if (p) {
        // Recalculate orbiting planet position
        const t = clock.getElapsedTime() * p.speed * 0.1;
        const px = Math.cos(t) * p.distance;
        const pz = Math.sin(t) * p.distance;
        const targetPos = new THREE.Vector3(px, 0, pz);

        // Smoothly lerp camera focus coordinate towards the planet
        currentTarget.current.lerp(targetPos, 0.06);
        camera.lookAt(currentTarget.current);

        // Camera offset relative to the planet's orbital coordinate
        const zoomDist = p.radius * 3.5 + 4.5;
        const targetCameraPos = new THREE.Vector3(
          px,
          p.radius * 1.5 + 2.0,
          pz + zoomDist
        );
        camera.position.lerp(targetCameraPos, 0.05);
      }
    } else {
      // Return to overview layout
      const targetPos = new THREE.Vector3(0, 0, 0);
      currentTarget.current.lerp(targetPos, 0.05);
      camera.lookAt(currentTarget.current);

      const defaultCameraPos = new THREE.Vector3(0, 30, 70);
      camera.position.lerp(defaultCameraPos, 0.05);
    }
  });

  return null;
}

export default function SolarSystem() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error("Error exiting fullscreen", err);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <section className="solar-section" id="solar">
      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">Our Solar System</span>
          <h2 className="section-title">
            Explore the{' '}
            <span className="gradient-span-warm">Cosmos</span>
          </h2>
          <p className="section-subtitle">
            Interact with all 8 planets in real-time 3D. Drag to rotate, scroll to zoom. Click a planet to inspect it.
          </p>
        </motion.div>
      </div>

      {/* 3D Canvas */}
      <div 
        ref={containerRef} 
        className="solar-canvas-wrap" 
        style={{ 
          position: 'relative', 
          height: isFullscreen ? '100vh' : undefined,
          background: isFullscreen ? '#000' : undefined
        }}
      >
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 35,
            background: 'rgba(5, 8, 22, 0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#A78BFA',
            borderRadius: '0.5rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(5, 8, 22, 0.75)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          {isFullscreen ? '🔍 Exit Fullscreen' : '🔍 Fullscreen Orbit View'}
        </button>

        <Canvas
          camera={{ position: [0, 30, 70], fov: 55 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.28} />
          <directionalLight position={[-15, 20, -10]} intensity={1.8} color="#7c3aed" />
          
          {/* Subtle star particles background */}
          <Stars radius={250} depth={40} count={3500} factor={4} saturation={0.5} fade speed={0.4} />

          <Sun />
          <SunCorona />

          {PLANET_DATA.map((p) => (
            <Planet 
              key={p.name} 
              {...p} 
              hasRings={'hasRings' in p ? p.hasRings : false} 
              onSelectPlanet={setSelectedPlanet}
              isSelected={selectedPlanet === p.name}
            />
          ))}

          <AsteroidBelt />

          {/* Dynamic Programmatic Camera Controller */}
          <SolarSystemCameraManager selectedPlanet={selectedPlanet} />

          <OrbitControls
            enablePan={false}
            maxDistance={140}
            minDistance={8}
            autoRotate={!selectedPlanet}
            autoRotateSpeed={0.25}
          />

          <EffectComposer>
            <Bloom luminanceThreshold={0.12} luminanceSmoothing={0.8} intensity={0.9} />
          </EffectComposer>
        </Canvas>

        {/* Back to overview button when zoomed in */}
        {selectedPlanet && (
          <motion.button
            className="btn-ghost"
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              background: 'rgba(5, 8, 22, 0.85)',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              backdropFilter: 'blur(16px)',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedPlanet(null)}
            whileHover={{ scale: 1.05, border: '1px solid rgba(124, 58, 237, 0.8)' }}
          >
            ⬅ Back to Overview
          </motion.button>
        )}
      </div>

      {/* Planet legend */}
      <div className="planet-legend">
        {PLANET_DATA.map((p) => (
          <div 
            key={p.name} 
            className={`planet-chip ${selectedPlanet === p.name ? 'active-chip' : ''}`}
            onClick={() => setSelectedPlanet(p.name)}
            style={{ 
              cursor: 'pointer',
              border: selectedPlanet === p.name ? '1px solid rgba(124, 58, 237, 0.5)' : '1px solid rgba(255,255,255,0.06)',
              background: selectedPlanet === p.name ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="planet-dot" style={{ backgroundColor: p.color }} />
            <span className="planet-name">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Cosmic Story Mode Modal */}
      <AnimatePresence>
        {selectedPlanet && (
          <div className="story-overlay" onClick={() => setSelectedPlanet(null)}>
            <motion.div 
              className="story-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="story-modal-header">
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.2em', color: '#38D1F0', textTransform: 'uppercase' }}>Cosmic Story Mode</span>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem' }}>{selectedPlanet}</h3>
                </div>
                <button 
                  onClick={() => setSelectedPlanet(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  ✕
                </button>
              </div>
              <div className="story-modal-body">
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '2rem' }}>
                  {PLANET_STORIES[selectedPlanet as keyof typeof PLANET_STORIES]}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  borderRadius: '1.25rem',
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎙️</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA' }}>Cosmic Narrator</p>
                      <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>Audio Guide Active</p>
                    </div>
                  </div>
                  <div className="story-audio-visualizer">
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
