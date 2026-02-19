'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

import Beaker from '../../components/apparatus/Beaker';
import ConicalFlask from '../../components/apparatus/ConicalFlask';
import BunsenBurner from '../../components/apparatus/BunsenBurner';
import BoilingWater from '../../components/apparatus/BoilingWater';
import Steam from '../../components/apparatus/Steam';
import Condensation from '../../components/apparatus/Condensation';
import TestTube from '../../components/apparatus/TestTube';
import RoundBottomFlask from '../../components/apparatus/RoundBottomFlask';

const FluidSimulationPage = () => {
    // Random water levels between 0.3 and 0.8
    const [beakerLevel, setBeakerLevel] = useState(0.5);
    const [flaskLevel, setFlaskLevel] = useState(0.5);

    // Burner States
    const [leftBurnerOn, setLeftBurnerOn] = useState(true);
    const [rightBurnerOn, setRightBurnerOn] = useState(true);

    // New Apparatus States
    const [ttLevel, setTtLevel] = useState(0.5);
    const [rbfLevel, setRbfLevel] = useState(0.5);
    const [ttBurnerOn, setTtBurnerOn] = useState(true);
    const [rbfBurnerOn, setRbfBurnerOn] = useState(true);

    useEffect(() => {
        setBeakerLevel(0.3 + Math.random() * 0.5);
        setFlaskLevel(0.3 + Math.random() * 0.5);
        setTtLevel(0.3 + Math.random() * 0.5);
        setRbfLevel(0.3 + Math.random() * 0.5);
    }, []);

    return (
        <div className="h-screen w-full bg-neutral-900 text-white relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded backdrop-blur-md">
                <h1 className="text-2xl font-bold text-cyan-400">Fluid Simulation 💧</h1>
                <p className="text-sm text-neutral-300">Demonstration of liquid levels in apparatus.</p>
                <button
                    onClick={() => {
                        setBeakerLevel(0.3 + Math.random() * 0.5);
                        setFlaskLevel(0.3 + Math.random() * 0.5);
                        setTtLevel(0.3 + Math.random() * 0.5);
                        setRbfLevel(0.3 + Math.random() * 0.5);
                    }}
                    className="mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-xs font-semibold"
                >
                    Randomize Levels
                </button>
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
                <div className="bg-black/60 p-3 rounded-lg backdrop-blur-md flex flex-col items-center gap-2 border border-white/10">
                    <span className="text-xs font-bold text-neutral-300">Left Burner (Beaker)</span>
                    <button
                        onClick={() => setLeftBurnerOn(!leftBurnerOn)}
                        className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${leftBurnerOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}
                    >
                        {leftBurnerOn ? 'Extinguish' : 'Ignite'}
                    </button>
                </div>

                <div className="bg-black/60 p-3 rounded-lg backdrop-blur-md flex flex-col items-center gap-2 border border-white/10">
                    <span className="text-xs font-bold text-neutral-300">Right Burner (Flask)</span>
                    <button
                        onClick={() => setRightBurnerOn(!rightBurnerOn)}
                        className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${rightBurnerOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}
                    >
                        {rightBurnerOn ? 'Extinguish' : 'Ignite'}
                    </button>
                </div>

                <div className="bg-black/60 p-3 rounded-lg backdrop-blur-md flex flex-col items-center gap-2 border border-white/10">
                    <span className="text-xs font-bold text-neutral-300">Test Tube</span>
                    <button
                        onClick={() => setTtBurnerOn(!ttBurnerOn)}
                        className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${ttBurnerOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}
                    >
                        {ttBurnerOn ? 'Extinguish' : 'Ignite'}
                    </button>
                </div>

                <div className="bg-black/60 p-3 rounded-lg backdrop-blur-md flex flex-col items-center gap-2 border border-white/10">
                    <span className="text-xs font-bold text-neutral-300">RBF</span>
                    <button
                        onClick={() => setRbfBurnerOn(!rbfBurnerOn)}
                        className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${rbfBurnerOn ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}
                    >
                        {rbfBurnerOn ? 'Extinguish' : 'Ignite'}
                    </button>
                </div>
            </div>

            <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Environment preset="city" />

                <Grid infiniteGrid sectionColor="white" cellColor="#333" fadeDistance={30} position={[0, -0.01, 0]} />
                <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />

                {/* --- SETUP 1: BEAKER --- */}
                <group position={[-2, 0, 0]}>
                    <BunsenBurner position={[0, 0, 0]} isOn={leftBurnerOn} isHeating={true} baseRadius={0.8} flameTargetY={3.9} apparatusType="beaker" />
                    <group position={[0, 3.9, 0]}>
                        <Beaker />
                        <BoilingWater
                            position={[0, 0.05, 0]}
                            radiusTop={0.75}
                            radiusBottom={0.75}
                            height={beakerLevel * 1.8}
                            isBoiling={leftBurnerOn}
                        />
                        <Steam
                            isBoiling={leftBurnerOn}
                            startHeight={beakerLevel * 1.8}
                            maxHeight={3.0}
                            radiusFunction={() => 0.7} // Beaker inner radius approx 0.7-0.75
                            count={40}
                            scale={0.8}
                        />
                    </group>
                </group>

                {/* --- SETUP 2: CONICAL FLASK --- */}
                <group position={[2, 0, 0]}>
                    <BunsenBurner position={[0, 0, 0]} isOn={rightBurnerOn} isHeating={true} baseRadius={1.0} flameTargetY={3.9} apparatusType="conical" />
                    <group position={[0, 3.9, 0]}>
                        <ConicalFlask />
                        <BoilingWater
                            position={[0, 0.05, 0]}
                            radiusBottom={0.95}
                            // Calculate top radius based on flask slope (-0.382) to match taper
                            radiusTop={0.95 + (flaskLevel * 1.5) * ((0.35 - 1.0) / 1.7)}
                            height={flaskLevel * 1.5}
                            isBoiling={rightBurnerOn}
                        />
                        <Steam
                            isBoiling={rightBurnerOn}
                            startHeight={flaskLevel * 1.5}
                            maxHeight={3.5}
                            // Conical Flask: Taper from ~0.9 at base to 0.35 at neck (y=1.8)
                            // y is relative to Steam start? No, relative to group 0,0.
                            // Steam particle y is absolute within group. Group is at [0, 3.5, 0].
                            // Flask base is at 0. Neck start at 1.8. Mouth at 2.5.
                            radiusFunction={(y) => {
                                if (y < 1.8) {
                                    // Linear interpolation: 1.0 at 0.1 -> 0.35 at 1.8
                                    // slope = (0.35 - 1.0) / (1.8 - 0.1) = -0.38
                                    return Math.max(0.3, 1.0 + (y - 0.1) * -0.38) * 0.8; // 0.8 safety factor
                                }
                                return 0.3; // Neck radius
                            }}
                            count={40}
                            scale={0.7}
                        />

                        {/* Condensation on inner walls above water */}
                        <Condensation
                            isBoiling={rightBurnerOn}
                            shape="cone"
                            count={80}
                            minHeight={flaskLevel * 1.5 + 0.1} // Start slightly above water
                            maxHeight={1.8} // Up to neck start
                            radiusFunction={(y) => {
                                // Same cone taper logic: R = 1.0 + (y - 0.1) * -0.38
                                // y is relative to flask base 0,0,0?
                                // Condensation is inside group [0, 3.5, 0]. ConicalFlask is at 0,0,0 relative to group.
                                // Yes. formula valid.
                                if (y < 0.1) return 0.95;
                                return Math.max(0.36, 0.95 + (y - 0.1) * -0.38); // fit inside glass R=1.0->0.35
                            }}
                        />
                    </group>
                </group>

                {/* --- SETUP 3: TEST TUBE --- */}
                <group position={[-6, 0, 0]}>
                    <BunsenBurner position={[0, 0, 0]} isOn={ttBurnerOn} isHeating={true} baseRadius={0.25} flameTargetY={3.9} apparatusType="round" />
                    <group position={[0, 3.9, 0]}>
                        <TestTube scale={[1.2, 1.2, 1.2]} position={[0, 0, 0]} />
                        {/* Water inside test tube (Cylindrical) */}
                        <BoilingWater
                            position={[0, 0.24, 0]}
                            radiusTop={0.17}
                            radiusBottom={0.17}
                            height={ttLevel * 1.5}
                            isBoiling={ttBurnerOn}
                            bubbleScale={0.4} // Reduce bubble size for test tube
                        />
                        <Steam
                            isBoiling={ttBurnerOn}
                            startHeight={ttLevel * 1.5}
                            maxHeight={2.0}
                            radiusFunction={() => 0.15} // Test Tube inner radius ~0.17
                            count={20}
                            scale={0.4}
                        />
                    </group>
                </group>

                {/* --- SETUP 4: ROUND BOTTOM FLASK --- */}
                <group position={[6, 0, 0]}>
                    <BunsenBurner position={[0, 0, 0]} isOn={rbfBurnerOn} isHeating={true} baseRadius={1.0} flameTargetY={3.9} apparatusType="round" />
                    <group position={[0, 3.9, 0]}>
                        <RoundBottomFlask />
                        {/* Water inside RBF - Sphere filled from bottom */}
                        <BoilingWater
                            position={[0, 0.05, 0]}
                            radiusTop={0.95}
                            radiusBottom={0.95}
                            isBoiling={rbfBurnerOn}
                            shape="sphere"
                            fillPercentage={rbfLevel}
                            height={0.95 * (1 - Math.cos((rbfLevel * 0.7 + 0.3) * Math.PI))}
                        />
                        <Steam
                            isBoiling={rbfBurnerOn}
                            startHeight={0.95 * (1 - Math.cos((rbfLevel * 0.7 + 0.3) * Math.PI))} // Start at water surface
                            maxHeight={4.0} // RBF is tall with neck
                            // RBF Geometry: Sphere Center (0,1,0) Radius 1. Neck starts around y=1.9?
                            // Actually pure sphere is y=0 to y=2. Neck is cylinder on top.
                            // RBF component: Body Sphere pos=[0,1,0]. Radius 1. Top of sphere is y=2.
                            // Neck: Cylinder pos=[0, 2.5, 0] height 1.5 -> y=1.75 to y=3.25.
                            // Overlap region y=1.75 to 2.0.
                            radiusFunction={(y) => {
                                // Sphere part: Center (0,1,0) R=1. x^2 + (y-1)^2 = 1 => x = sqrt(1 - (y-1)^2)
                                if (y < 1.8) {
                                    const val = Math.sqrt(Math.max(0, 1 - Math.pow(y - 1, 2))) || 0.35;
                                    return Math.max(0.3, val * 0.8);
                                }
                                return 0.25; // Neck radius 0.35 -> internal ~0.3
                            }}
                            count={40}
                            scale={0.7}
                        />

                        {/* Condensation on upper sphere walls */}
                        <Condensation
                            isBoiling={rbfBurnerOn}
                            shape="sphere"
                            count={60}
                            minHeight={Math.max(1.0, 0.95 * (1 - Math.cos((rbfLevel * 0.7 + 0.3) * Math.PI))) + 0.1}
                            // Start above water, minimum at equator y=1.0 to look good
                            maxHeight={2.0} // Top of sphere body
                            radiusFunction={(y) => {
                                // Sphere equation: x^2 + (y-1)^2 = 1. Center (0,1,0).
                                // Radius x = sqrt(1 - (y-1)^2).
                                // Fit inside R=1.0 glass -> R ~ 0.95
                                const val = Math.sqrt(Math.max(0, 1 - Math.pow(y - 1, 2)));
                                return val * 0.95;
                            }}
                        />
                    </group>
                </group>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
};

export default FluidSimulationPage;
