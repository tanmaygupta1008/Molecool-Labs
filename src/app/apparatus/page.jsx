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
        <div className="theme-internal">
            <div className="flex h-[calc(100vh-64px)] bg-transparent text-white overflow-hidden relative">
                
                {/* Animated Background Mesh */}
                <div className="bg-mesh-container">
                    <div className="bg-mesh-blob blob-1" />
                    <div className="bg-mesh-blob blob-2" />
                    <div className="bg-mesh-blob blob-3" />
                </div>

                {/* LEFT PANEL - APPARATUS REPOSITORY */}
                <div className="w-85 glass-card !bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col z-10 shadow-2xl shrink-0 overflow-hidden rounded-none">
                    <div className="p-8 border-b border-white/5">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                            Apparatus <br />
                            <span className="text-white/40 font-light text-2xl">Repository</span>
                        </h1>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60 mt-4 leading-relaxed">System-wide inventory of virtual laboratory hardware.</p>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Inventory Sync: Online</p>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                        {Object.entries(categories).map(([category, items]) => (
                            <div key={category}>
                                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    {category}
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {items.map((item) => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setSelectedApparatus(item);
                                                setIsFlameOn(false);
                                            }}
                                            className={`px-4 py-3 rounded-none font-black text-[11px] uppercase tracking-widest transition-all duration-300 relative overflow-hidden border tap-animation ${selectedApparatus === item
                                                ? 'bg-white text-black border-white shadow-2xl scale-105 z-10'
                                                : 'glass-pill !bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                                                }`}
                                        >
                                            {selectedApparatus === item && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                            {item.replace(/([A-Z])/g, ' $1').trim()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3D VIEWPORT */}
                <div className="flex-1 relative z-0">
                    {/* Floating Info Overlay */}
                    <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
                        <div className="glass-card !bg-black/60 backdrop-blur-xl p-8 border border-white/10 rounded-none shadow-3xl">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Subject Identification</p>
                            <h2 className="text-4xl font-black text-white tracking-widest filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mb-1">
                                {selectedApparatus.replace(/([A-Z])/g, ' $1').trim()}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-white/20" />
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Stereoscopic Visualization Active</p>
                            </div>
                        </div>

                        {/* Flame Toggle Button */}
                        {hasFlame && (
                            <button
                                onClick={() => setIsFlameOn(!isFlameOn)}
                                className={`px-8 py-4 rounded-none font-black text-[12px] uppercase tracking-widest transition-all shadow-2xl tap-animation border ${isFlameOn
                                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                        : 'glass-pill !bg-black/60 backdrop-blur-xl border-white/10 text-white hover:border-white/30'
                                    }`}
                            >
                                {isFlameOn ? '🔥 Extinguish Flame' : '🔥 Ignite Component'}
                            </button>
                        )}
                    </div>

                    {/* Interaction Hint */}
                    <div className="absolute bottom-8 right-8 z-10 flex items-center gap-4 py-3 px-6 glass-pill !bg-black/40 border border-white/10 pointer-events-none">
                        <div className="flex gap-1.5">
                            {['R', 'O', 'T', 'A', 'T', 'E'].map((char, i) => (
                                <span key={i} className="text-[10px] font-black text-white/20">{char}</span>
                            ))}
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">MANIPULATE 3D MODEL</p>
                    </div>

                    <div className="w-full h-full">
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
            </div>
        </div>
    );
};

export default ApparatusGallery;
