'use client';
// src/app/engine/electrons/page.jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import AtomNode from '@/components/reactions/engine/AtomNode';
import ElectronNode from '@/components/reactions/engine/ElectronNode';

export default function Phase4ElectronsPage() {
    const [isShared, setIsShared] = useState(false);

    const posA = [-2, 0, 0];
    const posB = [2, 0, 0];

    return (
        <div className="w-full h-screen bg-black text-white flex flex-col">
            <div className="p-6 bg-gray-900 border-b border-cyan-800 z-10 shadow-lg flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-cyan-400">Phase 4: Electron Orbit System</h1>
                    <p className="text-gray-400 mt-2">
                        Testing logic for local spherical orbits and covalent figure-8 shared orbitals.
                    </p>
                </div>

                {/* Control Panel */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsShared(false)}
                        className={`px-4 py-2 rounded font-bold transition-all ${!isShared ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Local Orbits (Unbonded)
                    </button>
                    <button
                        onClick={() => setIsShared(true)}
                        className={`px-4 py-2 rounded font-bold transition-all ${isShared ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Shared Orbit (Covalent Bond)
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    <AtomNode position={posA} element="H" />
                    <AtomNode position={posB} element="H" />

                    {/* Electron 1: Starts on Atom A, becomes shared */}
                    <ElectronNode
                        orbitCenter={posA}
                        sharedCenters={[posA, posB]}
                        isShared={isShared}
                        phase={0}
                        color="#ffffff"
                        speed={3}
                        radius={0.8}
                    />

                    {/* Electron 2: Starts on Atom B, becomes shared */}
                    <ElectronNode
                        orbitCenter={posB}
                        sharedCenters={[posA, posB]}
                        isShared={isShared}
                        phase={Math.PI} // Offset by 180 degrees so they chase each other
                        color="#ffffff"
                        speed={3}
                        radius={0.8}
                    />

                    <OrbitControls makeDefault />
                </Canvas>
            </div>
        </div>
    );
}
