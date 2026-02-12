'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, ContactShadows } from '@react-three/drei';
import * as Apparatus from '@/components/apparatus';

const categories = {
    'Heating Equipment': ['BunsenBurner', 'TripodStand', 'WireGauze', 'Crucible', 'Tongs', 'HeatproofMat'],
    'Glassware': ['Beaker', 'ConicalFlask', 'TestTube', 'MeasuringCylinder', 'Dropper', 'StirringRod'],
    'Gas Collection': ['WaterTrough', 'GasJar', 'DeliveryTube', 'RubberCork'],
    'Advanced Equipment': ['Burette', 'RetortStand', 'Clamp', 'ElectrolysisSetup', 'PowerSupply']
};

const ApparatusGallery = () => {
    const [selectedApparatus, setSelectedApparatus] = useState('BunsenBurner');
    const [isFlameOn, setIsFlameOn] = useState(false);

    const SelectedComponent = Apparatus[selectedApparatus];
    const hasFlame = ['BunsenBurner'].includes(selectedApparatus);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-gray-900 text-white">
            {/* Sidebar / Selection Menu */}
            <div className="w-full md:w-1/4 p-4 overflow-y-auto border-r border-gray-700">
                <h1 className="text-2xl font-bold mb-6 text-cyan-400">Apparatus Gallery 🧪</h1>

                {Object.entries(categories).map(([category, items]) => (
                    <div key={category} className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-gray-300 border-b border-gray-700 pb-1">{category}</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setSelectedApparatus(item);
                                        setIsFlameOn(false); // Reset flame when switching
                                    }}
                                    className={`p-2 text-sm rounded-md transition-all text-left truncate ${selectedApparatus === item
                                        ? 'bg-cyan-600 text-white shadow-lg'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-cyan-200'
                                        }`}
                                >
                                    {item.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 3D Viewport */}
            <div className="flex-1 relative bg-gray-950">
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="bg-black/50 p-2 rounded backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-cyan-300">
                            {selectedApparatus.replace(/([A-Z])/g, ' $1').trim()}
                        </h2>
                        <p className="text-xs text-gray-400">Drag to rotate • Scroll to zoom</p>
                    </div>

                    {/* Flame Toggle Button */}
                    {hasFlame && (
                        <button
                            onClick={() => setIsFlameOn(!isFlameOn)}
                            className={`px-4 py-2 rounded font-bold transition-all shadow-lg backdrop-blur-sm ${isFlameOn
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                }`}
                        >
                            {isFlameOn ? '🔥 Extinguish Flame' : '🔥 Ignite Flame'}
                        </button>
                    )}
                </div>

                <Canvas shadows camera={{ position: [3, 3, 3], fov: 45 }}>
                    <Suspense fallback={null}>
                        <Environment preset="city" />
                        <Stage environment="city" intensity={0.6} contactShadow={false}>
                            {SelectedComponent ? <SelectedComponent isOn={isFlameOn} /> : null}
                        </Stage>
                        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={10} blur={1.5} far={0.8} />
                        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

export default ApparatusGallery;
