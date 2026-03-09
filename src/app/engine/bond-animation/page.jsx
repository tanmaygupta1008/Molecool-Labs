'use client';
// src/app/engine/bond-animation/page.jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';

export default function Phase3BondAnimationPage() {
    const [state, setState] = useState("normal");

    const posA = [-2, 0, 0];
    const posB = [2, 0, 0];

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-cyan-400">Phase 3: Bond State & Animation Layer</h1>
                    <p className="text-gray-400 mt-2">
                        Testing state-driven bond animations (`normal`, `stretching`, `breaking`, `forming`).
                    </p>
                </div>

                {/* Control Panel */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setState("normal")}
                        className={`px-4 py-2 rounded font-bold transition-all ${state === "normal" ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Normal
                    </button>
                    <button
                        onClick={() => setState("stretching")}
                        className={`px-4 py-2 rounded font-bold transition-all ${state === "stretching" ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Stretching
                    </button>
                    <button
                        onClick={() => setState("breaking")}
                        className={`px-4 py-2 rounded font-bold transition-all ${state === "breaking" ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Breaking
                    </button>
                    <button
                        onClick={() => setState("forming")}
                        className={`px-4 py-2 rounded font-bold transition-all ${state === "forming" ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Forming
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    <Text position={[0, 2, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                        Current State: {state.toUpperCase()}
                    </Text>

                    <AtomNode position={posA} element="C" />
                    <AtomNode position={posB} element="O" />

                    <BondLine
                        startPos={posA}
                        endPos={posB}
                        order={2}
                        color="#ffffff"
                        state={state}
                    />

                    <OrbitControls makeDefault />
                </Canvas>
            </div>
        </div>
    );
}
