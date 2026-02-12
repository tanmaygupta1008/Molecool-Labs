// src/components/reactions/views/components/BurnStation.jsx
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';

// Animated Candle/Bunsen Flame Component
const Flame = () => {
    const outerRef = useRef();
    const innerRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Flicker effect using sine waves + noise-like motion
        // Outer flame flickers more; Inner flame is more stable but moves with outer
        if (outerRef.current) {
            outerRef.current.scale.y = 1 + Math.sin(time * 10) * 0.05 + Math.sin(time * 23) * 0.05;
            outerRef.current.rotation.z = Math.sin(time * 5) * 0.05;
            outerRef.current.scale.x = 1 - Math.sin(time * 10) * 0.05; // squashes when stretches
            outerRef.current.scale.z = outerRef.current.scale.x;
        }

        if (innerRef.current) {
            innerRef.current.scale.y = 1 + Math.sin(time * 15) * 0.02;
            innerRef.current.rotation.z = Math.sin(time * 5) * 0.02;
        }
    });

    return (
        <group position={[0, 2.2, 0]}>
            {/* Outer Flame (Orange/Transparent) */}
            <mesh ref={outerRef} position={[0, 0, 0]}>
                <coneGeometry args={[0.2, 0.8, 16, 1, true]} />
                <meshBasicMaterial
                    color="#ffaa00"
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Core Flame (Blue/White - Hotter) */}
            <mesh ref={innerRef} position={[0, -0.1, 0]}>
                <coneGeometry args={[0.1, 0.5, 16, 1, true]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Point light for local illumination (subtle) */}
            <pointLight distance={3} intensity={0.5} color="#ffaa00" position={[0, 0.2, 0]} />
        </group>
    );
};

// Helper to render the Magnesium Ribbon
const MagnesiumRibbon = ({ progress }) => {
    // As reaction progresses, the ribbon turns white and crumbles (scales down)
    const ribbonColor = useMemo(() => new THREE.Color('#c0c0c0').lerp(new THREE.Color('#ffffff'), progress), [progress]);

    // Scale Y goes from 1 to 0.1 as it burns away
    const burnScale = Math.max(0.1, 1 - progress);

    return (
        <group position={[0, 2.5, 0]} rotation={[0, 0, Math.PI / 6]}>
            {/* Visual Mesh for Ribbon */}
            <mesh scale={[0.5, 3 * burnScale, 0.05]}>
                <boxGeometry />
                <meshStandardMaterial
                    color={ribbonColor}
                    roughness={0.4}
                    metalness={0.8}
                    emissive="white"
                    emissiveIntensity={progress * 2} // Glows brighter as it burns
                />
            </mesh>
        </group>
    );
};

const BurnStation = ({ reaction, progress }) => {
    const { nodes } = useGLTF('/3D-Models/apparatus_bunsen_burner.glb');

    // Intense Light logic (Magnesium Flash)
    // Flash peaks at 0.5 progress, then fades slightly
    const flashIntensity = progress > 0.1 && progress < 0.9
        ? 5 + (Math.sin(progress * Math.PI) * 15) // Pulsing intense flash
        : 1;

    return (
        <group>
            <Center top>
                <group>
                    {/* 1. The Bunsen Burner */}
                    {/* Assuming nodes has a mesh. If not, fallback to cylinder */}
                    {/* We use a simple cylinder if model is complex to check, but let's try rendering the GLB nodes if we can. 
                         For safety given previous issues, let's use a nice procedural burner if GLB fails, 
                         but here we will assume the GLB is valid or wrap in ErrorBoundary kind of logic? 
                         Let's stick to simple procedural fallback for reliability in this demo if needed, 
                         but let's try the GLB path first.
                     */}
                    <group position={[0, -2, 0]} scale={[3, 3, 3]}>
                        {/* Placeholder procedural burner base if GLB usage is complex without inspection */}
                        <mesh position={[0, 0.1, 0]}>
                            <cylinderGeometry args={[0.5, 0.6, 0.2, 32]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                        <mesh position={[0, 1, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 2, 32]} />
                            <meshStandardMaterial color="#888" metalness={0.8} />
                        </mesh>
                        {/* Flame */}
                        <Flame />
                    </group>

                    {/* 2. The Magnesium Ribbon being held */}
                    {/* Tongs (Simple Cylinders) */}
                    <group position={[2, 2.5, 0]} rotation={[0, 0, 1]}>
                        <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
                            <meshStandardMaterial color="#555" metalness={0.6} />
                        </mesh>
                    </group>

                    <MagnesiumRibbon progress={progress} />

                    {/* 3. The Reaction Effects */}
                    {/* Smoke/Fumes rising */}
                    {progress > 0.2 && (
                        <group position={[0, 3, 0]}>
                            <ParticleSystem
                                count={40}
                                config={{ speed: 0.05, spread: 0.5, scale: 0.8, type: 'smoke', color: '#eeeeee' }}
                                progress={progress}
                            />
                        </group>
                    )}

                    {/* The Ash falling (Precipitate logic reused) */}
                    {progress > 0.5 && (
                        <group position={[0, 1, 0]}>
                            <ParticleSystem
                                count={20}
                                config={{ speed: -0.05, spread: 0.3, scale: 0.2, type: 'precipitate', color: '#ffffff' }}
                                progress={progress}
                            />
                        </group>
                    )}

                </group>
            </Center>

            {/* Lighting for the Flash */}
            {progress > 0.1 && (
                <pointLight
                    position={[0, 3, 1]}
                    intensity={flashIntensity}
                    color="white"
                    distance={20}
                    decay={2}
                    castShadow
                />
            )}

            <ambientLight intensity={0.5} />

            {/* Labels */}
            <Html position={[2, 3, 0]} distanceFactor={8}>
                <div className="flex flex-col gap-1 items-start">
                    <div className="backdrop-blur-md bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-xl">
                        <span className="text-orange-400 text-xs uppercase tracking-wider block mb-0.5">Combustion</span>
                        {progress < 0.1 ? 'Ready to Ignite' : progress > 0.9 ? 'Ash Formed' : 'Burning...'}
                    </div>
                </div>
            </Html>
        </group>
    );
};

export default BurnStation;
