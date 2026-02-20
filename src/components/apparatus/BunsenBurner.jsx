import React, { useRef } from 'react';
import { extend, useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere, MeshDistortMaterial, Torus, Cone, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Custom Shader for Gaseous Flame
const FlameMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.2, 0.6, 1.0),
    opacity: 0.6,
    noiseScale: 1.0,
    rimFalloff: 0.1, // Default small fade
    edgeSoftness: 0.4 // Default sharpness
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vViewPosition;
    varying vec3 vNormal;

    uniform float time;
    uniform float noiseScale;

    // Simple Perlin-like noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;

      // 1. Asymmetry / Wavering
      float waverX = snoise(vec3(0.0, time * 2.0, 0.0)); 
      float waverZ = snoise(vec3(10.0, time * 1.5, 0.0));
      pos.x += waverX * 0.08 * smoothstep(0.2, 1.0, uv.y); 
      pos.z += waverZ * 0.08 * smoothstep(0.2, 1.0, uv.y);

      // 2. Turbulence
      float mainNoise = snoise(vec3(pos.x * 2.5, pos.y * 2.5 - time * 3.0, pos.z * 2.5));
      float fineNoise = snoise(vec3(pos.x * 6.0, pos.y * 6.0 - time * 5.0, pos.z * 6.0));
      
      float combinedNoise = mainNoise + fineNoise * 0.4;
      
      float displacementFactor = smoothstep(0.0, 1.0, uv.y); 
      
      pos += normal * combinedNoise * 0.1 * displacementFactor * noiseScale;
      vElevation = combinedNoise;

      vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vViewPosition = -viewPosition.xyz;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform vec3 color;
    uniform float opacity; // This is a float
    uniform float time;
    uniform float rimFalloff;
    uniform float edgeSoftness; // New uniform for controlling blur

    void main() {
      // 1. Fresnel / Edge Softness
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      float fresnel = dot(viewDir, normal);
      float edgeAlpha = smoothstep(0.0, edgeSoftness, abs(fresnel)); 

      // 2. Vertical Fade
      float startFade = 1.0 - rimFalloff;
      float topFade = 1.0 - smoothstep(startFade, 1.0, vUv.y);
      float baseFade = smoothstep(0.0, 0.1, vUv.y);

      // 3. Core intensity & Hot spots
      float noiseVariation = vElevation; 
      
      vec3 hotColor = vec3(0.8, 0.9, 1.0); // Whitish blue
      vec3 mainColor = color;
      
      vec3 finalColor = mix(mainColor, hotColor, smoothstep(0.2, 0.8, noiseVariation));
      
      float alpha = opacity * topFade * baseFade * edgeAlpha;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

// Custom Shader for Impact Glow (Radial Gradient)
const ImpactMaterial = shaderMaterial(
  {
    color: new THREE.Color(1.0, 1.0, 1.0),
    opacity: 0.6
  },
  // Vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
  // Fragment
  `
    varying vec2 vUv;
    uniform vec3 color;
    uniform float opacity;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float strength = 1.0 - smoothstep(0.0, 0.5, dist);
      gl_FragColor = vec4(color, strength * opacity);
    }
    `
);

// Custom Shader for Heat Shimmer (Air Distortion)
const ShimmerMaterial = shaderMaterial(
  {
    time: 0,
    amount: 1.0
  },
  // Vertex
  `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment
  `
    varying vec2 vUv;
    varying vec3 vPos;
    uniform float time;
    
    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
       // Moving noise pattern
       float noise = snoise(vec2(vPos.x * 5.0, vPos.y * 5.0 - time * 2.0));
       
       // Heat haze alpha
       // Fades out at edges and top
       float alpha = smoothstep(0.0, 0.5, abs(noise)) * 0.1;
       float fade = 1.0 - smoothstep(0.0, 1.0, vUv.y);
       
       // In a real engine we'd grab the screen texture and distort UVs.
       // Here we just render faint white wisps to simulate the density change visibility.
       gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * fade * 0.3);
    }
  `
);

extend({ FlameMaterial, ImpactMaterial, ShimmerMaterial });

const Flame = ({ isHeating = false, baseRadius = 0.8, flameTargetY = 3.9, apparatusType = "standard", intensity = 1.0, flameColor = "#0033cc" }) => {
  const materialRef = useRef();
  const spreadRef1 = useRef();
  const shimmerRef = useRef();

  // Burner tip Y position
  // Burner tip Y position
  const burnerTipY = 3.35;
  const isConical = apparatusType === "conical";
  const isFlat = apparatusType === "beaker" || isConical;

  // --- GEOMETRY LOGIC ---
  const stemRadius = 0.12 * Math.sqrt(intensity);

  // These will be determined by the type logic below
  let stemHeight, stemPosY, spreadGeometry;

  // Calculate heights based on intensity
  const heightMult = 0.5 + 0.5 * intensity;

  if (isFlat) {
    // --- FLAT BOTTOM MODEL (Spreading Funnel + Wall Licks) ---
    // Instead of a flat disk, we use a "Spreading Cone" that transitions 
    // from the narrow stem to the wide base of the apparatus.

    const spreadHeight = 0.35 * heightMult; // Height of the transition from stem to base

    // Stem stops where the spread begins
    const stemTopY = flameTargetY - spreadHeight;
    stemHeight = Math.max(0.01, (stemTopY - burnerTipY) * heightMult);
    stemPosY = burnerTipY + stemHeight / 2;

    const spreadBottomRadius = stemRadius; // Starts narrow
    const spreadTopRadius = (isConical ? baseRadius * 0.9 : baseRadius * 0.8) * heightMult; // Ends slightly inside the glass base



    spreadGeometry = (
      <group>
        {/* 3. High Pressure Impact Center (Glow) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, (flameTargetY - 0.02) * heightMult + (1 - heightMult) * burnerTipY, 0]}>
          <planeGeometry args={[spreadBottomRadius * 2.5, spreadBottomRadius * 2.5]} />
          <impactMaterial color="#ffffff" opacity={0.6 * intensity} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* 1. Spreading Cone (The "Impact" zone) */}
        {/* Inverted cone: Top=Wide, Bottom=Narrow */}
        <Cylinder
          args={[spreadTopRadius, spreadBottomRadius, spreadHeight, 32, 1, true]}
          position={[0, (flameTargetY - spreadHeight / 2) * heightMult + (1 - heightMult) * burnerTipY, 0]}
        >
          <flameMaterial
            ref={spreadRef1}
            color={new THREE.Color(flameColor)}
            opacity={0.8 * intensity}
            rimFalloff={0.6} // Strong falloff for diffusion
            noiseScale={1.8 * intensity}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </Cylinder>

      </group>
    );

  } else if (apparatusType === "round") {
    // --- ROUND BOTTOM MODEL (Stem + Cup) ---
    const cupBottomY = flameTargetY - 0.25;
    const cupHeight = 0.6 * heightMult;
    const stemTopY = Math.max(burnerTipY + 0.1, cupBottomY);
    stemHeight = (stemTopY - burnerTipY) * heightMult;
    stemPosY = burnerTipY + stemHeight / 2;

    const cupRadiusBottom = stemRadius;
    const cupRadiusTop = (baseRadius + 0.1) * heightMult;

    spreadGeometry = (
      <Cylinder
        args={[cupRadiusTop, cupRadiusBottom, cupHeight, 32, 1, true]}
        position={[0, (stemTopY + cupHeight / 2) * heightMult + (1 - heightMult) * burnerTipY, 0]}
      >
        <flameMaterial
          ref={spreadRef1}
          color={new THREE.Color(flameColor)}
          opacity={0.5 * intensity}
          rimFalloff={0.5} // Gradual vertical fade
          edgeSoftness={1.0} // Very blurry edges
          noiseScale={1.5 * intensity}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </Cylinder>
    );
  } else {
    // --- STANDARD FREE BURNING ---
    stemHeight = 2.0 * intensity;
    stemPosY = burnerTipY + stemHeight / 2;
    spreadGeometry = null;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.time = t;

      // Micro-flicker animation
      // 1. Opacity flicker: High frequency, low amplitude
      // Base opacity is 0.8 (from shader prop default or passed prop)
      // We oscillate slightly around a base value
      const flicker = (Math.sin(t * 20.0) * 0.05 + Math.sin(t * 45.0) * 0.05) * intensity;
      materialRef.current.opacity = 0.8 * intensity + flicker;

      // 2. Micro-scale noise jitter
      // varied noise scale for "breathing" effect
      materialRef.current.noiseScale = (1.0 + Math.sin(t * 5.0) * 0.2) * intensity;

      // Animate Spread Parts

      if (spreadRef1.current) {
        spreadRef1.current.time = t;
        spreadRef1.current.opacity = 0.8 * intensity + flicker;
        spreadRef1.current.noiseScale = (1.0 + Math.sin(t * 5.0) * 0.2) * intensity;
      }

      // Animate Heat Shimmer
      if (shimmerRef.current) {
        shimmerRef.current.time = t;
      }
    }
  });

  return (
    <group>
      {isHeating ? (
        <group>
          {/* Common Stem */}
          <Cylinder
            args={[stemRadius, stemRadius * 0.8, stemHeight, 32, 1, true]}
            position={[0, stemPosY, 0]}
          >
            <flameMaterial
              ref={materialRef}
              color={new THREE.Color(flameColor)}
              opacity={0.8 * intensity}
              noiseScale={0.5 * intensity}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </Cylinder>

          {/* Type-Specific Spread */}
          {spreadGeometry}

          {/* Core Glow */}
          <pointLight position={[0, flameTargetY, 0]} intensity={1.5 * intensity} color="#4488ff" distance={3} decay={2} />

          {/* --- NEW: Distinct Inner Cone (Unburned Gas) --- */}
          {/* Sharp, pale blue cone at the base. Non-turbulent. */}
          <Cylinder
            args={[0.02 * intensity, 0.1 * intensity, 0.6 * intensity, 32, 1, true]} // Tapered cone
            position={[0, burnerTipY + 0.3 * intensity, 0]}
          >
            <meshBasicMaterial
              color="#aaddff"
              transparent
              opacity={0.9 * intensity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </Cylinder>



          {/* --- NEW: Heat Shimmer (Air Distortion) --- */}
          <mesh position={[0, flameTargetY + 1.2, 0]}>
            <cylinderGeometry args={[0.5, 0.3, 1.8, 16, 1, true]} />
            <shimmerMaterial ref={shimmerRef} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : (
        // IDLE MODE: Standard tall flame
        <group>
          {/* Idle Outer */}
          <Cone args={[0.2 * intensity, 2.0 * intensity, 32, 1, true]} position={[0, 3.35 + 1.0 * intensity, 0]}>
            <flameMaterial
              ref={materialRef}
              color={new THREE.Color("#0044aa")} // Darker idle
              opacity={0.5 * intensity}
              noiseScale={0.5}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </Cone>
          {/* Idle Inner */}
          <Cylinder
            args={[0.01 * intensity, 0.08 * intensity, 0.4 * intensity, 32, 1, true]}
            position={[0, 3.35 + 0.2 * intensity, 0]}
          >
            <meshBasicMaterial
              color="#88ccff"
              transparent
              opacity={0.8 * intensity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

const BunsenBurner = ({ isOn = false, isHeating = false, baseRadius = 0.8, flameTargetY = 3.9, apparatusType = "standard", intensity = 1.0, flameColor = "#0033cc", ...props }) => {
  return (
    <group {...props}>
      {/* 1. Base - Stepped metallic base */}
      {/* Bottom plate */}
      <Cylinder args={[0.9, 1.0, 0.1, 32]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </Cylinder>
      {/* Main conical base */}
      <Cylinder args={[0.5, 0.8, 0.4, 32]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#666" metalness={0.7} roughness={0.4} />
      </Cylinder>

      {/* 2. Gas Inlet Tube (Side connection) */}
      <group position={[0.6, 0.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <Cylinder args={[0.08, 0.08, 0.6, 16]}>
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </Cylinder>
        <Torus args={[0.08, 0.01, 8, 16]} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888" />
        </Torus>
        <Torus args={[0.08, 0.01, 8, 16]} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888" />
        </Torus>
      </group>

      {/* 3. Chimney / Barrel - Chrome finish */}
      <Cylinder args={[0.12, 0.12, 3, 32]} position={[0, 1.8, 0]}>
        <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
      </Cylinder>
      <Cylinder args={[0.13, 0.13, 0.05, 32]} position={[0, 3.3, 0]}>
        <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
      </Cylinder>

      {/* 4. Air Regulator Collar - Brass/Gold */}
      <group position={[0, 0.8, 0]}>
        <Cylinder args={[0.14, 0.14, 0.4, 32]}>
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.145, 0.145, 0.15, 12, 1, false, 0, 1]} position={[0, 0, 0]} rotation={[0, 1, 0]}>
          <meshStandardMaterial color="#111" />
        </Cylinder>
        <Torus args={[0.14, 0.01, 16, 32]} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#d4af37" metalness={0.8} />
        </Torus>
        <Torus args={[0.14, 0.01, 16, 32]} position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#d4af37" metalness={0.8} />
        </Torus>
      </group>

      {/* 5. Flame */}
      {isOn && <Flame isHeating={isHeating} baseRadius={baseRadius} flameTargetY={flameTargetY} apparatusType={apparatusType} intensity={intensity} flameColor={flameColor} />}

      {/* Light */}
      {isOn && (
        <pointLight position={[0, 3.5, 0]} intensity={2 * intensity} color={flameColor} distance={5} decay={2} />
      )}

    </group>
  );
};

export default BunsenBurner;
