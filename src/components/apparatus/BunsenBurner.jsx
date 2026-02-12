import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere, MeshDistortMaterial, Torus, Cone } from '@react-three/drei';
import * as THREE from 'three';

const Flame = () => {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Outer flame flickering - rises and distorts
    if (outerRef.current) {
      outerRef.current.scale.y = 1 + Math.sin(t * 15) * 0.1 + Math.random() * 0.05;
      outerRef.current.scale.x = 1 - Math.sin(t * 5) * 0.05;
      outerRef.current.scale.z = outerRef.current.scale.x;
    }

    // Inner flame flickering - faster, more subtle jitter
    if (innerRef.current) {
      innerRef.current.scale.y = 1 + Math.sin(t * 20) * 0.02;
      innerRef.current.position.y = 0.3 + Math.random() * 0.01;
    }
  });

  return (
    <group position={[0, 3.25, 0]}>
      {/* Outer Flame - Wispy, tall, transparent blue envelope */}
      {/* Using a Cone with open bottom to simulate the flame jet */}
      {/* Outer Flame - Wispy, tall, transparent blue envelope */}
      {/* Using a Cone with open bottom to simulate the flame jet */}
      <Cone ref={outerRef} args={[0.25, 2.2, 32, 6, true]} position={[0, 0.7, 0]}>
        <MeshDistortMaterial
          color="#0055ff"
          speed={4}
          distort={0.3}
          radius={0.5}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </Cone>

      {/* Inner Core - Sharp, bright cyan/white cone, typical of 'roaring' flame */}
      <Cone ref={innerRef} args={[0.08, 0.6, 32]} position={[0, 0.3, 0]}>
        <meshStandardMaterial
          color="#88ffff"
          emissive="#00ffff"
          emissiveIntensity={3}
          transparent
          opacity={0.9}
          roughness={0}
          toneMapped={false}
        />
      </Cone>
    </group>
  );
};

const BunsenBurner = ({ isOn = false, ...props }) => {
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
      {isOn && <Flame />}

      {/* Light */}
      {isOn && (
        <pointLight position={[0, 3.5, 0]} intensity={2} color="#00aaff" distance={5} decay={2} />
      )}

    </group>
  );
};

export default BunsenBurner;
