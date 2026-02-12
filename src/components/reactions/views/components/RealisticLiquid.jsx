// src/components/reactions/views/components/RealisticLiquid.jsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const RealisticLiquid = ({ 
    height = 4, 
    radius = 1.1, 
    color, 
    opacity = 0.8, 
    yOffset = 0,
    wobble = 0
}) => {
    const meshRef = useRef();
    
    // Create a custom material or use MeshPhysicalMaterial for best liquid look
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        metalness: 0.1,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        ior: 1.33,
        transmission: opacity < 1 ? 0.5 : 0, // Only transmit if semi-transparent
        thickness: 0.5,
    }), [color, opacity]);

    useFrame((state) => {
        if (!meshRef.current || wobble === 0) return;
        // Simple wobble effect
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.x = Math.sin(time * 2) * wobble * 0.02;
        meshRef.current.rotation.z = Math.cos(time * 1.5) * wobble * 0.02;
    });

    return (
        <group position={[0, height / 2 + yOffset, 0]}>
            {/* Main Liquid Column */}
            <Cylinder args={[radius, radius, height, 32]} ref={meshRef}>
                 <primitive object={material} />
            </Cylinder>
            
            {/* Meniscus (Top Surface) - slightly curved up at edges */}
            {/* We can simulate this with a ring or just a flat top for now, 
                improving geometry would require a custom latch/bowl shape */}
            <mesh position={[0, height/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[radius, 32]} />
                <primitive object={material} />
            </mesh>
            
             {/* Bottom Cap */}
             <mesh position={[0, -height/2, 0]} rotation={[Math.PI/2, 0, 0]}>
                <circleGeometry args={[radius, 32]} />
                <primitive object={material} />
            </mesh>
        </group>
    );
};

export default RealisticLiquid;
