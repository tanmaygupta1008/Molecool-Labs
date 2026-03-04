import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sphere, Cylinder, Torus } from '@react-three/drei';
import Precipitate from '../effects/Precipitate';

const RoundBottomFlask = (props) => {
    return (
        <group {...props}>
            {/* Body: Sphere */}
            <Sphere args={[1, 32, 32]} position={[0, 1, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Sphere>

            {/* Thermal Glow Overlay (Base Heating) */}
            {props.isHeating && (
                <Sphere
                    args={[1.02, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
                    position={[0, 1, 0]}
                >
                    <meshBasicMaterial
                        color="#ff4400"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.BackSide} // Render inside to look like glass volume glow? Or Front? 
                    // Let's use DoubleSide or Front. If slightly larger, FrontSide is fine.
                    />
                </Sphere>
            )}

            {/* Neck: Cylinder */}
            <Cylinder args={[0.35, 0.35, 1.5, 32, 1, true]} position={[0, 2.5, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Rim */}
            <Torus args={[0.35, 0.05, 16, 32]} position={[0, 3.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>

            {/* Render Precipitate */}
            {props.precipitateActive && (
                <Precipitate
                    type="sphere"
                    radius={1.0}
                    amount={props.precipitateAmount}
                    color={props.precipitateColor}
                    position={[0, 1.0, 0]}
                />
            )}
        </group>
    );
};

export default RoundBottomFlask;
