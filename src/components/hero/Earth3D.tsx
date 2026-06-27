'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const SUN_POSITION = new THREE.Vector3(28, 14, -22);

// Custom Twinkling Starfield Shader
const StarsShader = {
  vertexShader: `
    uniform float uTime;
    attribute float aSize;
    attribute float aBrightness;
    attribute float aTwinkleSpeed;
    attribute float aPhase;
    
    varying float vBrightness;
    varying float vTwinkle;
    
    void main() {
      vBrightness = aBrightness;
      
      // Twinkle only designated stars slowly and organically
      if (aTwinkleSpeed > 0.0) {
        vTwinkle = 0.35 + 0.65 * sin(uTime * aTwinkleSpeed + aPhase);
      } else {
        vTwinkle = 1.0;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation for depth
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying float vBrightness;
    varying float vTwinkle;
    
    void main() {
      // Shape points as soft circular star disks
      vec2 uv = gl_PointCoord - vec2(0.5);
      float dist = length(uv);
      if (dist > 0.5) discard;
      
      float alpha = smoothstep(0.5, 0.1, dist);
      vec3 color = vec3(1.0) * vBrightness * vTwinkle;
      gl_FragColor = vec4(color, alpha);
    }
  `
};

function TwinklingStars({ count = 600, radius = 100 }) {
  const ref = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, sizes, brightness, twinkleSpeeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const br = new Float32Array(count);
    const sp = new Float32Array(count);
    const ph = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute stars on a sphere surface with slight depth variance
      const r = radius + (Math.random() - 0.5) * 20;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Varying sizes (0.08 to 0.25)
      sz[i] = 0.08 + Math.random() * 0.17;

      // Varying base brightnesses
      br[i] = 0.35 + Math.random() * 0.65;

      // Twinkle only 15% of stars slowly
      if (Math.random() > 0.85) {
        sp[i] = 0.6 + Math.random() * 1.2;
      } else {
        sp[i] = 0.0;
      }

      ph[i] = Math.random() * 100.0;
    }
    return [pos, sz, br, sp, ph];
  }, [count, radius]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBrightness" args={[brightness, 1]} />
        <bufferAttribute attach="attributes-aTwinkleSpeed" args={[twinkleSpeeds, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={StarsShader.vertexShader}
        fragmentShader={StarsShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Starfields() {
  const ref1 = useRef<THREE.Group>(null);
  const ref2 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref1.current) ref1.current.rotation.y = t * 0.0003;
    if (ref2.current) ref2.current.rotation.y = -t * 0.00015;
  });

  return (
    <group>
      <group ref={ref1}>
        <TwinklingStars count={400} radius={90} />
      </group>
      <group ref={ref2}>
        <TwinklingStars count={600} radius={140} />
      </group>
    </group>
  );
}

// Custom Atmospheric Scattering Shaders (Fresnel Glow)
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform vec3 glowColor;
    uniform float coefficient;
    uniform float power;
    uniform vec3 sunPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 sunDir = normalize(sunPosition - vWorldPosition);
      
      // Fresnel effect peaking at the edge
      float intensity = pow(1.0 - max(dot(normal, viewDir), 0.0), power);
      
      // Atmospheric scattering: only lit on sunlit side
      float sunInfluence = dot(normal, sunDir);
      float scatter = smoothstep(-0.25, 0.25, sunInfluence);
      
      // Sunset orange rim on the terminator
      float sunsetLimb = smoothstep(0.4, 0.0, abs(sunInfluence)) * scatter;
      vec3 finalGlowColor = mix(glowColor, vec3(1.0, 0.45, 0.1), sunsetLimb * 0.5);
      
      gl_FragColor = vec4(finalGlowColor, 1.0) * intensity * coefficient * scatter;
    }
  `
};

function AtmosphereGlow({ color = '#38BDF8', size = 2.62, coefficient = 0.30, power = 7.0 }) {
  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color(color) },
    coefficient: { value: coefficient },
    power: { value: power },
    sunPosition: { value: SUN_POSITION }
  }), [color, coefficient, power]);

  return (
    <mesh>
      <sphereGeometry args={[size, 64, 64]} />
      <shaderMaterial
        vertexShader={AtmosphereShader.vertexShader}
        fragmentShader={AtmosphereShader.fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Custom Earth Shader
const EarthShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularMap;
    uniform sampler2D cloudsTexture;
    uniform float cloudsOffset;
    uniform vec3 sunPosition;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(sunPosition - vWorldPosition);
      
      float cosTheta = dot(normal, sunDir);
      
      // Sample textures
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);
      
      // Sample clouds with offset
      vec2 cloudUv = vec2(vUv.x + cloudsOffset, vUv.y);
      float cloudDensity = texture2D(cloudsTexture, cloudUv).r;
      
      // Specular ocean mask
      float specularVal = texture2D(specularMap, vUv).r;
      
      // Golden sodium city lights, masked by clouds
      vec3 cityLights = nightColor.rgb * vec3(1.6, 1.35, 1.0) * 4.5 * (1.0 - cloudDensity * 0.7);
      
      // Cloud shadow on day side
      float cloudShadow = 1.0 - cloudDensity * 0.55;
      
      // Ambient lighting (very soft space ambient)
      vec3 ambient = vec3(0.008, 0.012, 0.02) * dayColor.rgb;
      
      // Day diffuse lighting - reduced to 1.1 multiplier to prevent blown out highlights
      vec3 diffuse = dayColor.rgb * max(cosTheta, 0.0) * 1.1 * cloudShadow;
      
      // Blending Day and Night - soft twilight zone [-0.25, 0.25]
      float mixAmount = smoothstep(-0.25, 0.25, cosTheta);
      vec3 color = ambient + mix(cityLights, diffuse, mixAmount);
      
      // Rayleigh scattering orange sunrise/sunset line
      float terminatorGlow = smoothstep(0.28, 0.0, abs(cosTheta)) * smoothstep(-0.1, 0.2, cosTheta);
      vec3 sunsetColor = vec3(1.0, 0.45, 0.1) * terminatorGlow * 0.9;
      color += sunsetColor;
      
      // Specular reflection (oceans)
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(sunDir + viewDir);
      float specAngle = max(dot(normal, halfDir), 0.0);
      float specularHighlight = pow(specAngle, 32.0);
      
      vec3 oceanSpecular = vec3(0.85, 0.95, 1.0) * specularHighlight * specularVal * mixAmount * 1.8;
      color += oceanSpecular;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// Custom Clouds Shader
const CloudsShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D cloudsTexture;
    uniform float cloudsOffset;
    uniform vec3 sunPosition;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(sunPosition - vWorldPosition);
      float cosTheta = dot(normal, sunDir);
      
      // Sample clouds with offset
      vec2 cloudUv = vec2(vUv.x + cloudsOffset, vUv.y);
      float cloudDensity = texture2D(cloudsTexture, cloudUv).r;
      
      // Light factor (white on day side, dark black on night side)
      float lightFactor = smoothstep(-0.15, 0.15, cosTheta);
      vec3 cloudColor = vec3(1.0) * mix(0.01, 1.0, lightFactor);
      
      // Sunset orange tint on terminator edges
      float terminator = smoothstep(0.2, 0.0, abs(cosTheta)) * smoothstep(-0.05, 0.15, cosTheta);
      cloudColor = mix(cloudColor, vec3(1.0, 0.5, 0.15), terminator * 0.75);
      
      float opacity = cloudDensity * 0.85;
      gl_FragColor = vec4(cloudColor, opacity);
    }
  `
};

// Helper textures
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

function createNebulaTexture(color: string) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color);
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createStreakTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.35, 'rgba(6, 182, 212, 0)'); // Cyan fade
  grad.addColorStop(0.46, 'rgba(6, 182, 212, 0.35)'); // Cyan edge
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)'); // Pure white hot center
  grad.addColorStop(0.54, 'rgba(251, 191, 36, 0.35)'); // Warm amber edge
  grad.addColorStop(0.65, 'rgba(251, 191, 36, 0)'); // Amber fade
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function NebulaCloud({ color, scale, position, speed }: { color: string; scale: number; position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createNebulaTexture(color), [color]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.getElapsedTime() * speed * 0.01;
    }
  });

  if (!texture) return null;

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[scale, scale]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.10} // lowered to 10% for extremely subtle nebulae / deep space contrast
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function NebulaClouds() {
  return (
    <group>
      {/* Deep purple far back */}
      <NebulaCloud color="rgba(124, 58, 237, 0.22)" scale={65} position={[10, 4, -55]} speed={0.06} />
      {/* Cyan middle right */}
      <NebulaCloud color="rgba(6, 182, 212, 0.16)" scale={50} position={[-12, -4, -40]} speed={-0.08} />
      {/* Blue overlay */}
      <NebulaCloud color="rgba(59, 130, 246, 0.18)" scale={70} position={[2, -6, -65]} speed={0.03} />
      {/* Magenta far left */}
      <NebulaCloud color="rgba(236, 72, 153, 0.12)" scale={55} position={[-15, 6, -70]} speed={0.05} />
      {/* Teal bottom right */}
      <NebulaCloud color="rgba(20, 184, 166, 0.14)" scale={45} position={[12, -8, -50]} speed={-0.04} />
    </group>
  );
}

function useAsyncTextures(urls: { [key: string]: string }) {
  const [textures, setTextures] = useState<{ [key: string]: THREE.Texture | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    const loaded: { [key: string]: THREE.Texture } = {};
    const keys = Object.keys(urls);
    let loadedCount = 0;

    if (keys.length === 0) {
      setLoading(false);
      return;
    }

    keys.forEach((key) => {
      loader.load(
        urls[key],
        (texture) => {
          if (!active) return;
          texture.colorSpace = THREE.SRGBColorSpace;
          loaded[key] = texture;
          loadedCount++;
          if (loadedCount === keys.length) {
            setTextures(loaded);
            setLoading(false);
          }
        },
        undefined,
        () => {
          if (!active) return;
          console.warn(`Failed to load texture: ${urls[key]}`);
          setError(true);
          setLoading(false);
        }
      );
    });

    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { textures, loading, error };
}

function Earth({ earthMeshRef }: { earthMeshRef: React.RefObject<THREE.Mesh | null> }) {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudsMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const { textures, error, loading } = useAsyncTextures({
    day: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-blue-marble.jpg',
    night: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-night.jpg',
    specular: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
    bump: 'https://unpkg.com/three-globe@2.38.0/example/img/earth-topology.png'
  });

  useFrame((_, delta) => {
    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y += delta * 0.008;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.012;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.cloudsOffset.value += delta * 0.004 / (2.0 * Math.PI);
    }
    if (cloudsMaterialRef.current) {
      cloudsMaterialRef.current.uniforms.cloudsOffset.value += delta * 0.012 / (2.0 * Math.PI);
    }
  });

  const earthUniforms = useMemo(() => {
    if (!textures.day) return null;
    return {
      dayTexture: { value: textures.day },
      nightTexture: { value: textures.night },
      specularMap: { value: textures.specular },
      cloudsTexture: { value: textures.clouds },
      cloudsOffset: { value: 0.0 },
      sunPosition: { value: SUN_POSITION }
    };
  }, [textures]);

  const cloudsUniforms = useMemo(() => {
    if (!textures.clouds) return null;
    return {
      cloudsTexture: { value: textures.clouds },
      cloudsOffset: { value: 0.0 },
      sunPosition: { value: SUN_POSITION }
    };
  }, [textures]);

  if (loading) {
    return (
      <group>
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[2.6, 48, 48]} />
          <meshStandardMaterial
            color="#06B6D4"
            wireframe
            transparent
            opacity={0.15}
            emissive="#06B6D4"
            emissiveIntensity={0.2}
          />
        </mesh>
        <AtmosphereGlow color="#38BDF8" size={2.62} coefficient={0.30} power={7.0} />
      </group>
    );
  }

  if (error) {
    // Holographic Fallback
    return (
      <group>
        <mesh ref={earthMeshRef}>
          <sphereGeometry args={[2.6, 48, 48]} />
          <meshStandardMaterial
            color="#06B6D4"
            wireframe
            transparent
            opacity={0.35}
            emissive="#06B6D4"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh scale={0.99}>
          <sphereGeometry args={[2.6, 32, 32]} />
          <meshStandardMaterial
            color="#080e2b"
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.8}
          />
        </mesh>
        <AtmosphereGlow color="#38BDF8" size={2.62} coefficient={0.30} power={7.0} />
        <AtmosphereGlow color="#0284C7" size={2.66} coefficient={0.08} power={9.0} />
      </group>
    );
  }

  if (!textures.day) return null;

  return (
    <group>
      {/* Earth Surface Mesh */}
      <mesh ref={earthMeshRef}>
        <sphereGeometry args={[2.6, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={EarthShader.vertexShader}
          fragmentShader={EarthShader.fragmentShader}
          uniforms={earthUniforms || undefined}
        />
      </mesh>

      {/* Clouds Layer */}
      {textures.clouds && (
        <mesh ref={cloudsRef} scale={1.008}>
          <sphereGeometry args={[2.6, 64, 64]} />
          <shaderMaterial
            ref={cloudsMaterialRef}
            vertexShader={CloudsShader.vertexShader}
            fragmentShader={CloudsShader.fragmentShader}
            uniforms={cloudsUniforms || undefined}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Atmospheric Glow Rings - thin, sharp, and physically realistic */}
      <AtmosphereGlow color="#38BDF8" size={2.62} coefficient={0.30} power={7.0} />
      <AtmosphereGlow color="#0284C7" size={2.66} coefficient={0.08} power={9.0} />
    </group>
  );
}

function Moon() {
  const moonRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);

  const { textures, error } = useAsyncTextures({
    map: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'
  });

  useFrame(({ clock }) => {
    if (moonRef.current) {
      const t = clock.getElapsedTime() * 0.05; // orbit speed
      moonRef.current.position.x = Math.cos(t) * 5.8;
      moonRef.current.position.z = Math.sin(t) * 5.8;
      moonRef.current.position.y = Math.sin(t * 0.5) * 0.8;
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.rotation.y += 0.002;
    }
  });

  if (error) {
    return (
      <group ref={moonRef}>
        <mesh ref={moonMeshRef}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial
            color="#A78BFA"
            wireframe
            transparent
            opacity={0.4}
            emissive="#A78BFA"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={moonRef}>
      <mesh ref={moonMeshRef}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          map={textures.map || undefined}
          roughness={0.9}
          metalness={0.05}
          emissive="#111111"
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
}

function Satellites() {
  const issRef = useRef<THREE.Group>(null);
  const sat1Ref = useRef<THREE.Group>(null);
  const sat2Ref = useRef<THREE.Group>(null);

  const [blink1, setBlink1] = useState(true);
  const [blink2, setBlink2] = useState(true);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    setBlink1(Math.floor(elapsed * 4.0) % 2 === 0);
    setBlink2(Math.floor(elapsed * 2.5) % 2 === 0);

    // ISS Orbit
    if (issRef.current) {
      const t = elapsed * 0.08;
      issRef.current.position.x = Math.cos(t) * 3.3;
      issRef.current.position.z = Math.sin(t) * 3.3;
      issRef.current.position.y = Math.sin(t * 0.8) * 0.6;
      issRef.current.rotation.y = -t + Math.PI / 2;
    }

    // Satellite 1
    if (sat1Ref.current) {
      const t = elapsed * 0.12 + 1.5;
      sat1Ref.current.position.x = Math.sin(t) * 0.4;
      sat1Ref.current.position.y = Math.cos(t) * 3.5;
      sat1Ref.current.position.z = Math.sin(t) * 3.5;
    }

    // Satellite 2
    if (sat2Ref.current) {
      const t = -elapsed * 0.15 + 3.0;
      sat2Ref.current.position.x = Math.cos(t) * 3.1;
      sat2Ref.current.position.y = Math.sin(t * 0.3) * 0.2;
      sat2Ref.current.position.z = Math.sin(t) * 3.1;
    }
  });

  return (
    <group>
      {/* ISS */}
      <group ref={issRef}>
        <mesh>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[-0.08, 0, 0.08]}>
          <boxGeometry args={[0.03, 0.005, 0.18]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.08, 0, 0.08]}>
          <boxGeometry args={[0.03, 0.005, 0.18]} />
          <meshStandardMaterial color="#1e3a8a" emissive="#0284c7" emissiveIntensity={0.6} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={blink1 ? '#22c55e' : '#052e16'} />
        </mesh>
      </group>

      {/* Satellite 1 */}
      <group ref={sat1Ref}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.04, 0, 0]}>
          <boxGeometry args={[0.06, 0.002, 0.03]} />
          <meshStandardMaterial color="#1e40af" metalness={0.8} />
        </mesh>
        <mesh position={[-0.04, 0, 0]}>
          <boxGeometry args={[0.06, 0.002, 0.03]} />
          <meshStandardMaterial color="#1e40af" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color={blink2 ? '#ef4444' : '#450a0a'} />
        </mesh>
      </group>

      {/* Satellite 2 */}
      <group ref={sat2Ref}>
        <mesh>
          <boxGeometry args={[0.04, 0.008, 0.06]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.01]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial color={blink1 ? '#06b6d4' : '#083344'} />
        </mesh>
      </group>
    </group>
  );
}

function SunDisk({ earthMeshRef }: { earthMeshRef: React.RefObject<THREE.Mesh | null> }) {
  const streakRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const streakTexture = useMemo(() => createStreakTexture(), []);
  const glowTexture = useMemo(() => createNebulaTexture('rgba(124, 90, 250, 0.35)'), []);

  // Ray-Sphere Occlusion check to keep lens flare angle-dependent and restrained
  useFrame((state) => {
    let flareOpacity = 1.0;
    if (earthMeshRef.current) {
      const earthWorldPos = new THREE.Vector3();
      earthMeshRef.current.getWorldPosition(earthWorldPos);
      
      const cameraPos = state.camera.position;
      const sunPos = SUN_POSITION;
      
      const rayDir = new THREE.Vector3().subVectors(sunPos, cameraPos).normalize();
      const camToEarth = new THREE.Vector3().subVectors(earthWorldPos, cameraPos);
      const t = camToEarth.dot(rayDir);
      
      if (t > 0) {
        const closestPoint = new THREE.Vector3().addScaledVector(rayDir, t).add(cameraPos);
        const dist = closestPoint.distanceTo(earthWorldPos);
        
        const R = 2.6; // Earth radius
        const edgeVal = dist / R;
        
        // occlude flare when sun is directly behind Earth (dist/R < 0.88), emerging transition (0.88 - 1.08)
        if (edgeVal < 0.88) {
          flareOpacity = 0.0;
        } else if (edgeVal > 1.08) {
          flareOpacity = 1.0;
        } else {
          flareOpacity = (edgeVal - 0.88) / 0.2; // smooth linear ramp
        }
      }
    }
    
    if (streakRef.current) {
      const mat = streakRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.30 * flareOpacity;
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.05 * flareOpacity; // extremely faint halo
    }
  });

  return (
    <group position={SUN_POSITION}>
      {/* Note: The core sun sphere and color corona meshes have been completely removed to avoid artificial circles in space */}
      
      {/* Restrained Anamorphic Flare Streak */}
      {streakTexture && (
        <mesh ref={streakRef} rotation={[0, 0, -Math.PI / 16]}>
          <planeGeometry args={[18, 0.35]} />
          <meshBasicMaterial
            map={streakTexture}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Large Halo - scaled down and extremely faint */}
      {glowTexture && (
        <mesh ref={haloRef} scale={6}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// A lightweight distant layered nebula galaxy implementation
// Creates stunning volumetric depth with only 3 quads to optimize rendering speed
function DistantGalaxy() {
  const ref = useRef<THREE.Group>(null);
  const coreTexture = useMemo(() => createNebulaTexture('rgba(255, 255, 255, 0.9)'), []);
  const glowTexture = useMemo(() => createNebulaTexture('rgba(124, 58, 237, 0.45)'), []);
  const spiralTexture = useMemo(() => createNebulaTexture('rgba(6, 182, 212, 0.3)'), []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.z -= delta * 0.004; // extremely slow drift rotation
    }
  });

  return (
    <group ref={ref} position={[-20, -10, -75]} rotation={[0.3, 0, 0.2]}>
      {/* Outer Cyan Spiral Arms */}
      {spiralTexture && (
        <mesh scale={45}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={spiralTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.15} />
        </mesh>
      )}
      {/* Inner Purple Glow */}
      {glowTexture && (
        <mesh scale={28}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={glowTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.22} />
        </mesh>
      )}
      {/* Bright Core */}
      {coreTexture && (
        <mesh scale={10}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={coreTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function CosmicDust() {
  const ref = useRef<THREE.Points>(null);
  const count = 120; // Optimized stardust count for smooth 60 FPS
  const spriteTexture = useMemo(() => getSoftCircleTexture(), []);
  
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = Math.random() * 14 - 4; // range -4 to 10
      spd[i] = 0.05 + Math.random() * 0.06;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      const geo = ref.current.geometry;
      const posAttr = geo.attributes.position;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        array[i * 3 + 2] += speeds[i] * delta * 7;
        array[i * 3] += Math.sin(state.clock.getElapsedTime() * 0.05 + i) * 0.0015;
        array[i * 3 + 1] += Math.cos(state.clock.getElapsedTime() * 0.04 + i) * 0.001;

        if (array[i * 3 + 2] > 10) {
          array[i * 3 + 2] = -4;
          array[i * 3] = (Math.random() - 0.5) * 16;
          array[i * 3 + 1] = (Math.random() - 0.5) * 12;
        }
      }
      posAttr.needsUpdate = true;
      ref.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18} // slightly larger for realistic out-of-focus camera lens bokeh
        color="#a5f3fc" // soft cyan-white
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={spriteTexture || undefined}
      />
    </points>
  );
}

function CameraParallax({ scrollRef }: { scrollRef: React.RefObject<number> }) {
  const { size } = useThree();

  useFrame((state) => {
    const scrollRatio = scrollRef.current;
    const mouseX = state.pointer.x * 0.7;
    const mouseY = state.pointer.y * 0.5;

    // Aspect-ratio-responsive camera Z calculation:
    // Earth radius R = 2.6. Target vertical occupancy = 43% (0.43) in landscape.
    // If portrait view, pull camera back dynamically to prevent horizontal clipping.
    const aspect = size.width / size.height;
    let baseZ = 2.6 / (0.43 * Math.tan((45 * Math.PI) / 360)); // ~14.6 units
    
    if (aspect < 1.2) {
      // Screen is portrait/narrow. Keep Earth occupying ~38% of the viewport width.
      baseZ = 2.6 / (0.38 * Math.tan((45 * Math.PI) / 360) * aspect);
    }
    
    const baseY = 1.0;
    const scrollZoom = THREE.MathUtils.lerp(0, -2.5, Math.min(scrollRatio, 1.0));
    
    // Slow continuous IMAX space floating drift & orbital motion (non-repetitive wave overlay)
    const time = state.clock.getElapsedTime();
    const orbitAngle = time * 0.0035; // slow majestic horizontal orbit
    
    const floatX = Math.sin(time * 0.02) * 0.15 + Math.cos(time * 0.045) * 0.08;
    const floatY = Math.cos(time * 0.025) * 0.18 + Math.sin(time * 0.05) * 0.06;
    
    const dollyBreathing = Math.sin(time * 0.015) * 0.22;
    const radius = baseZ + scrollZoom + dollyBreathing;

    const targetX = Math.sin(orbitAngle) * radius + floatX + mouseX;
    const targetY = baseY + floatY + mouseY;
    const targetZ = Math.cos(orbitAngle) * radius;

    // Slower lerp coefficient (0.015) for high inertia, cinema-rig-like weight
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.015);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.015);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.015);
    
    state.camera.lookAt(0, 0, 0);

    // Subtle Z roll
    state.camera.rotation.z = Math.sin(time * 0.01) * 0.008;
  });
  return null;
}

function EarthSystem({ scrollRef, earthMeshRef }: { scrollRef: React.RefObject<number>; earthMeshRef: React.RefObject<THREE.Mesh | null> }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const scrollRatio = scrollRef.current;
    if (ref.current) {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        
        // Slide Earth from right (2.0) to left (-2.9) on desktop
        // On mobile, keep it centered but slide lower (to keep clear of text)
        const targetX = THREE.MathUtils.lerp(isMobile ? 0.0 : 2.0, isMobile ? 0.0 : -2.9, Math.min(scrollRatio, 1.0));
        const targetY = THREE.MathUtils.lerp(isMobile ? -0.8 : -0.4, isMobile ? -1.0 : -0.6, Math.min(scrollRatio, 1.0));
        const targetZ = THREE.MathUtils.lerp(0.0, 2.0, Math.min(scrollRatio, 1.0));

        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.08);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.08);
        ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, 0.08);
      }
    }
  });

  return (
    <group ref={ref}>
      <Earth earthMeshRef={earthMeshRef} />
      <Moon />
      <Satellites />
    </group>
  );
}

export default function Earth3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const earthMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const handleScroll = () => {
      const height = window.innerHeight || 800;
      const ratio = window.scrollY / height;
      scrollRef.current = ratio;

      if (containerRef.current) {
        const opacity = THREE.MathUtils.clamp((2.8 - ratio) / 0.6, 0.0, 1.0);
        containerRef.current.style.opacity = opacity.toString();
        containerRef.current.style.display = opacity <= 0 ? 'none' : 'block';
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 0, 
        position: 'fixed'
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 14.6], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Extremely faint ambient light for near-black shadows */}
        <ambientLight intensity={0.02} />
        
        {/* Soft warm sunlight aligned with SunDir (reduced intensity to 3.0 to prevent blown highlights) */}
        <directionalLight position={SUN_POSITION} intensity={3.0} color="#FFF8F2" />
        
        {/* Soft back fill light from deep space purple (reduced to 0.2 intensity) */}
        <pointLight position={[-12, -6, -8]} intensity={0.2} color="#7C3AED" />
        
        {/* Note: The front cyan pointLight has been removed to keep the dark hemisphere pitch black */}

        {/* Custom Twinkling Parallax Starfields */}
        <Starfields />

        <SunDisk earthMeshRef={earthMeshRef} />
        <NebulaClouds />
        <DistantGalaxy />
        <CosmicDust />
        
        {/* Earth System (slides left and zooms closer on scroll) */}
        <EarthSystem scrollRef={scrollRef} earthMeshRef={earthMeshRef} />
        
        <CameraParallax scrollRef={scrollRef} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.18} luminanceSmoothing={0.8} intensity={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
