'use client';
// src/app/engine/bonds/page.jsx
import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';

// An animated atom that moves in a circle to test the bond updating
const MovingAtomNode = ({ basePosition, element, charge, timeOffset = 0, radius = 1, onPositionUpdate }) => {
    const [pos, setPos] = useState(basePosition);

    useFrame((state) => {
        const t = state.clock.elapsedTime + timeOffset;
        // Move in a Lissajous curve for testing
        const newPos = [
            basePosition[0] + Math.sin(t) * radius,
            basePosition[1] + Math.cos(t * 1.5) * (radius * 0.5),
            basePosition[2] + Math.sin(t * 0.5) * radius
        ];
        onPositionUpdate(newPos);
    });

    return <AtomNode position={pos} element={element} charge={charge} />;
};

export default function Phase2BondsPage() {
    // We store the dynamic positions in state so the BondLine can read them
    const [posA, setPosA] = useState([-2, 1, 0]);
    const [posB, setPosB] = useState([2, -1, 0]);

    // Static test positions
    const posO1 = [-3, -2, 0];
    const posO2 = [0, -2, 0];
    const posN1 = [3, -2, 0];
    const posN2 = [6, -2, 0];

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg">
                <h1 className="text-3xl font-bold text-cyan-400">Phase 2: Dynamic Bond Engine</h1>
                <p className="text-gray-400 mt-2">
                    Testing mathematical auto-positioning and rotation of `BondLine` connecting 3D vectors.
                </p>
                <div className="mt-4 flex gap-4 text-sm font-mono text-gray-500">
                    <div>Single Bond (Animated)</div>
                    <div>Double Bond (Static)</div>
                    <div>Triple Bond (Static)</div>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    {/* DYNAMIC SCENARIO: Moving Atoms with Single Bond */}
                    <MovingAtomNode
                        basePosition={[-2, 1, 0]}
                        element="C"
                        onPositionUpdate={setPosA}
                        timeOffset={0}
                    />
                    <MovingAtomNode
                        basePosition={[2, 1, 0]}
                        element="H"
                        onPositionUpdate={setPosB}
                        timeOffset={Math.PI}
                        radius={2}
                    />
                    {/* The dynamic bond */}
                    <BondLine startPos={posA} endPos={posB} order={1} color="#88ffaa" />

                    {/* STATIC SCENARIO: Double Bond (O=O) */}
                    <AtomNode position={posO1} element="O" />
                    <AtomNode position={posO2} element="O" />
                    <BondLine startPos={posO1} endPos={posO2} order={2} color="#aaaaaa" />

                    {/* STATIC SCENARIO: Triple Bond (N≡N) */}
                    <AtomNode position={posN1} element="N" />
                    <AtomNode position={posN2} element="N" />
                    <BondLine startPos={posN1} endPos={posN2} order={3} color="#aaaaaa" />

                    <OrbitControls makeDefault />
                </Canvas>
            </div>
        </div>
    );
}
