import React from 'react';
import { Cylinder, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

const TestTube = ({ isHardGlass = false, ...props }) => {
    return (
        <group {...props}>
            {/* Body */}
            <Cylinder args={[0.2, 0.2, 1.5, 32, 1, true]} position={[0, 0.95, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                />
            </Cylinder>

            {/* Bottom Round */}
            <Sphere args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.2, 0]} scale={[1, -1, 1]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                />
            </Sphere>

            {/* Rim - Replaced solid cylinder with Torus for open top */}
            <Torus args={[0.2, 0.03, 16, 32]} position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>
        </group>
    );
};

export default TestTube;
