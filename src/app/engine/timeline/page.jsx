'use client';
// src/app/engine/timeline/page.jsx

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

import TimelineController from '@/components/reactions/engine/TimelineController';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';

export default function Phase5TimelinePage() {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Timeline playback logic
    useEffect(() => {
        let animationFrameId;
        const durationMs = 3000; // 3 seconds to complete reaction

        const loop = (timestamp) => {
            if (isPlaying) {
                setProgress(prev => {
                    const delta = 16 / durationMs; // approx 60fps step
                    const next = prev + delta;
                    if (next >= 1) {
                        setIsPlaying(false);
                        return 1;
                    }
                    return next;
                });
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    // Derived Scene Logic based *strictly* on progress [0.0 - 1.0]

    // Interpolate Vector A (moving towards B)
    const vecA = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(-4, 0, 0), // Start Pos
        new THREE.Vector3(-1, 0, 0), // End Pos
        THREE.MathUtils.smoothstep(progress, 0, 0.4) // Move occurs from 0.0 to 0.4
    ).toArray();

    // Setup Target B
    const vecB = [1, 0, 0];

    // Determine Bond State based on timeline
    let bondState = "normal";
    let showBond = false;

    if (progress > 0.4 && progress < 0.6) {
        showBond = true;
        bondState = "forming";
    } else if (progress >= 0.6 && progress < 0.8) {
        showBond = true;
        bondState = "normal"; // Fully formed and chilling
    } else if (progress >= 0.8 && progress < 1.0) {
        showBond = true;
        bondState = "breaking";
    }

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg">
                <h1 className="text-3xl font-bold text-cyan-400">Phase 5: Timeline Engine</h1>
                <p className="text-gray-400 mt-2">
                    Testing generic `TimelineController`. The scene below is entirely deterministic and driven solely by the `progress` value (0 → 1).
                </p>
                <div className="mt-4 flex gap-4 text-sm font-mono text-gray-400 bg-black/50 p-3 rounded">
                    <div>[0.0 - 0.4] Atom moves</div>
                    <div>[0.4 - 0.6] Bond Forms</div>
                    <div>[0.6 - 0.8] Stationary</div>
                    <div>[0.8 - 1.0] Bond Breaks</div>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    <AtomNode position={vecA} element="C" />
                    <AtomNode position={vecB} element="O" />

                    {showBond && (
                        <BondLine
                            startPos={vecA}
                            endPos={vecB}
                            order={2}
                            color="#ffffff"
                            state={bondState}
                        />
                    )}

                    <OrbitControls makeDefault />
                </Canvas>
            </div>

            {/* Sub-component handles the UI and updates the state */}
            <TimelineController
                progress={progress}
                setProgress={setProgress}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
            />
        </div>
    );
}
