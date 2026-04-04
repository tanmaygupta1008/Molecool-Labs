import React from 'react';
import * as THREE from 'three';
import { Sphere, Cylinder, Torus } from '@react-three/drei';
import Precipitate from '../effects/Precipitate';

const VolumetricFlask = (props) => {
    return (
        <group {...props}>
            {/* Body: Bulbous bottom (squashed sphere to give it a slightly flat bottom look) */}
            <Sphere args={[1, 32, 32]} position={[0, 0.8, 0]} scale={[1, 0.9, 1]}>
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

            {/* Flat base disc for stability */}
            <Cylinder args={[0.5, 0.5, 0.1, 32]} position={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    side={THREE.DoubleSide}
                />
            </Cylinder>

            {/* Thermal Glow Overlay (Base Heating) */}
            {props.isHeating && (
                <Sphere
                    args={[1.02, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
                    position={[0, 0.8, 0]}
                    scale={[1, 0.9, 1]}
                >
                    <meshBasicMaterial
                        color="#ff4400"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.FrontSide}
                    />
                </Sphere>
            )}

            {/* Neck transition (cone) */}
            <Cylinder args={[0.15, 0.35, 0.6, 32, 1, true]} position={[0, 1.8, 0]}>
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

            {/* Long thin neck */}
            <Cylinder args={[0.15, 0.15, 2.5, 32, 1, true]} position={[0, 3.35, 0]}>
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

            {/* Graduation Mark (the ring on the neck) */}
            <Torus args={[0.151, 0.005, 8, 32]} position={[0, 3.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#4d4d4d" />
            </Torus>

            {/* Top Rim */}
            <Torus args={[0.2, 0.05, 16, 32]} position={[0, 4.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>

            {/* Top flared lip */}
            <Cylinder args={[0.2, 0.15, 0.2, 32, 1, true]} position={[0, 4.7, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                    side={THREE.DoubleSide}
                />
            </Cylinder>

            {/* Render Precipitate */}
            {props.precipitateActive && (
                <Precipitate
                    type="sphere"
                    radius={0.9}
                    amount={props.precipitateAmount}
                    color={props.precipitateColor}
                    position={[0, 0.8, 0]}
                />
            )}
        </group>
    );
};

export default VolumetricFlask;
