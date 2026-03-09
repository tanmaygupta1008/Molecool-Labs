'use client';
// src/app/engine/action-executor/page.jsx

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import TimelineController from '@/components/reactions/engine/TimelineController';
import ActionExecutor from '@/components/reactions/engine/ActionExecutor';

// ── SAMPLE JSON SCRIPT FOR THE EXECUTOR ──
const TEST_SCRIPT = {
    atoms: [
        { id: "A1", element: "C", startPos: [-4, 0, 0] },
        { id: "A2", element: "O", startPos: [4, 0, 0] }
    ],
    bonds: [
        { id: "B1", from: "A1", to: "A2", order: 2, color: "#ffffff" }
    ],
    actions: [
        // 1. Atoms move towards each other
        {
            type: "moveAtom", targetId: "A1",
            startProgress: 0.1, endProgress: 0.4,
            startPos: [-4, 0, 0], endPos: [-1.2, 0, 0]
        },
        {
            type: "moveAtom", targetId: "A2",
            startProgress: 0.1, endProgress: 0.4,
            startPos: [4, 0, 0], endPos: [1.2, 0, 0]
        },
        // 2. Bond forms when they are close
        {
            type: "formBond", targetId: "B1",
            startProgress: 0.4, endProgress: 0.55
        },
        // 3. Atoms move away (stretching the bond mathematically)
        {
            type: "moveAtom", targetId: "A1",
            startProgress: 0.7, endProgress: 0.9,
            startPos: [-1.2, 0, 0], endPos: [-3, 0, 0]
        },
        {
            type: "moveAtom", targetId: "A2",
            startProgress: 0.7, endProgress: 0.9,
            startPos: [1.2, 0, 0], endPos: [3, 0, 0]
        },
        // 4. Bond breaks
        {
            type: "breakBond", targetId: "B1",
            startProgress: 0.85, endProgress: 0.95
        }
    ]
};

export default function Phase6ActionExecutorPage() {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Keep basic playloop logic inside the page wrapper for the demo
    React.useEffect(() => {
        let animationFrameId;
        const durationMs = 4000;
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
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg flex gap-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-cyan-400">Phase 6: Action Execution Engine</h1>
                    <p className="text-gray-400 mt-2">
                        Testing the JSON script parser. The 3D view is completely data-driven by the `TEST_SCRIPT` object.
                    </p>
                </div>
                <div className="flex-1 bg-black/50 p-3 rounded font-mono text-xs text-gray-400 overflow-y-auto max-h-32 shadow-inner">
                    <pre>{JSON.stringify(TEST_SCRIPT.actions, null, 2)}</pre>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    {/* The singular executor component */}
                    <ActionExecutor script={TEST_SCRIPT} progress={progress} />

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
