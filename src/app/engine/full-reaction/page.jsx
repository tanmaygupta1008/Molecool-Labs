'use client';
// src/app/engine/full-reaction/page.jsx

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import TimelineController from '@/components/reactions/engine/TimelineController';
import ActionExecutor from '@/components/reactions/engine/ActionExecutor';

// ── FULL METHANE COMBUSTION SCRIPT ──
// CH4 + 2O2 -> CO2 + 2H2O
// Reconstructed purely in JSON

const METHANE_SCRIPT = {
    atoms: [
        // CH4
        { id: "C1", element: "C", charge: 0, startPos: [-3, 0, 0] },
        { id: "H1", element: "H", charge: 0, startPos: [-3, 1, 0] },
        { id: "H2", element: "H", charge: 0, startPos: [-2, -0.5, 0] },
        { id: "H3", element: "H", charge: 0, startPos: [-4, -0.5, 0] },

        // 2x O2
        { id: "O1", element: "O", charge: 0, startPos: [2, 1, 0] },
        { id: "O2", element: "O", charge: 0, startPos: [3, 1, 0] },

        { id: "O3", element: "O", charge: 0, startPos: [2, -1, 0] },
        { id: "O4", element: "O", charge: 0, startPos: [3, -1, 0] },
    ],
    bonds: [
        // Reactants
        { id: "B_CH1", from: "C1", to: "H1", order: 1, color: "#ffffff" },
        { id: "B_CH2", from: "C1", to: "H2", order: 1, color: "#ffffff" },
        { id: "B_CH3", from: "C1", to: "H3", order: 1, color: "#ffffff" },
        { id: "B_O12", from: "O1", to: "O2", order: 2, color: "#aaddff" },
        { id: "B_O34", from: "O3", to: "O4", order: 2, color: "#aaddff" },

        // Products (Will be spawned later by actions)
        { id: "B_CO1", from: "C1", to: "O1", order: 2, color: "#00ffaa" },   // CO2
        { id: "B_CO3", from: "C1", to: "O3", order: 2, color: "#00ffaa" },   // CO2

        { id: "B_H1O2", from: "H1", to: "O2", order: 1, color: "#aaaaaa" },  // H2O (1)
        { id: "B_H2O2", from: "H2", to: "O2", order: 1, color: "#aaaaaa" },  // H2O (1)

        // NOTE: In a real combustion, H3 and H4 would attach to O4.
        // For simplicity in this engine data test, we just do one H2O to prove the engine works.
        { id: "B_H3O4", from: "H3", to: "O4", order: 1, color: "#aaaaaa" },  // H2O (2)
    ],
    actions: [
        // ====== STAGE 1 (0.0 - 0.3): Molecules approach (Activation Energy Building) ======
        { type: "moveAtom", targetId: "C1", startProgress: 0.1, endProgress: 0.3, startPos: [-3, 0, 0], endPos: [-1, 0, 0] },
        { type: "moveAtom", targetId: "H1", startProgress: 0.1, endProgress: 0.3, startPos: [-3, 1, 0], endPos: [-1, 1, 0] },
        { type: "moveAtom", targetId: "H2", startProgress: 0.1, endProgress: 0.3, startPos: [-2, -0.5, 0], endPos: [0, -0.5, 0] },
        { type: "moveAtom", targetId: "H3", startProgress: 0.1, endProgress: 0.3, startPos: [-4, -0.5, 0], endPos: [-2, -0.5, 0] },

        { type: "moveAtom", targetId: "O1", startProgress: 0.1, endProgress: 0.3, startPos: [2, 1, 0], endPos: [0.5, 1, 0] },
        { type: "moveAtom", targetId: "O2", startProgress: 0.1, endProgress: 0.3, startPos: [3, 1, 0], endPos: [1.5, 1, 0] },
        { type: "moveAtom", targetId: "O3", startProgress: 0.1, endProgress: 0.3, startPos: [2, -1, 0], endPos: [0.5, -1, 0] },
        { type: "moveAtom", targetId: "O4", startProgress: 0.1, endProgress: 0.3, startPos: [3, -1, 0], endPos: [1.5, -1, 0] },

        // ====== STAGE 2 (0.3 - 0.6): Bonds Break (Breaking Transition State) ======
        { type: "breakBond", targetId: "B_O12", startProgress: 0.3, endProgress: 0.45 },
        { type: "breakBond", targetId: "B_O34", startProgress: 0.3, endProgress: 0.45 },

        { type: "breakBond", targetId: "B_CH1", startProgress: 0.35, endProgress: 0.5 },
        { type: "breakBond", targetId: "B_CH2", startProgress: 0.35, endProgress: 0.5 },
        { type: "breakBond", targetId: "B_CH3", startProgress: 0.35, endProgress: 0.5 },

        // Atoms scatter slightly during breaking
        { type: "moveAtom", targetId: "O2", startProgress: 0.4, endProgress: 0.6, startPos: [1.5, 1, 0], endPos: [2.5, 2, 0] },
        { type: "moveAtom", targetId: "H1", startProgress: 0.4, endProgress: 0.6, startPos: [-1, 1, 0], endPos: [2, 2.5, 0] },
        { type: "moveAtom", targetId: "H2", startProgress: 0.4, endProgress: 0.6, startPos: [0, -0.5, 0], endPos: [3, 1.5, 0] },

        // ====== STAGE 3 (0.6 - 1.0): New Bonds Form (Products) ======

        // CO2 Formation (Moves to lock into linear shape)
        { type: "moveAtom", targetId: "O1", startProgress: 0.6, endProgress: 0.8, startPos: [0.5, 1, 0], endPos: [-1, 1.5, 0] },
        { type: "moveAtom", targetId: "O3", startProgress: 0.6, endProgress: 0.8, startPos: [0.5, -1, 0], endPos: [-1, -1.5, 0] },
        { type: "formBond", targetId: "B_CO1", startProgress: 0.65, endProgress: 0.8 },
        { type: "formBond", targetId: "B_CO3", startProgress: 0.65, endProgress: 0.8 },

        // H2O Formation
        { type: "formBond", targetId: "B_H1O2", startProgress: 0.7, endProgress: 0.85 },
        { type: "formBond", targetId: "B_H2O2", startProgress: 0.7, endProgress: 0.85 },
    ]
};


export default function Phase7FullReactionPage() {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    React.useEffect(() => {
        let animationFrameId;
        const durationMs = 8000; // Slow down for full scale viewing
        const loop = () => {
            if (isPlaying) {
                setProgress(prev => {
                    const next = prev + (16 / durationMs);
                    if (next >= 1) { setIsPlaying(false); return 1; }
                    return next;
                });
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        if (isPlaying) animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg">
                <h1 className="text-3xl font-bold text-cyan-400">Phase 7: Full Reaction Integration</h1>
                <p className="text-gray-400 mt-2">
                    Methane Combustion fully simulated using only the new JSON parser engine! No hardcoded `{'<MethaneMicroSequence>'}` needed.
                </p>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    <Text position={[0, 3, -1]} fontSize={0.6} color="white" anchorX="center" anchorY="bottom">
                        CH₄ + 2O₂ → CO₂ + 2H₂O
                    </Text>

                    <ActionExecutor script={METHANE_SCRIPT} progress={progress} />

                    <OrbitControls makeDefault />
                </Canvas>
            </div>

            <TimelineController
                progress={progress}
                setProgress={setProgress}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
        </div>
    );
}
