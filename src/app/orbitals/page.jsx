'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import { OrbitalViewer } from '@/components/orbitals/OrbitalShapes';
import { Info, Atom, Maximize } from 'lucide-react';
import * as THREE from 'three';

const ORBITALS_LIBRARY = [
    {
        group: 'S-Block (l = 0)',
        items: [
            { id: '1s', label: '1s', n: 1, l: 0, ml: '0', nodes: 0, desc: 'The fundamental spherical boundary surface. Lowest energy state of an electron.' },
            { id: '2s', label: '2s', n: 2, l: 0, ml: '0', nodes: 1, desc: 'A larger spherical boundary with one internal radial node (a region of zero probability).' },
        ]
    },
    {
        group: 'P-Block (l = 1)',
        items: [
            { id: '2px', label: '2px', n: 2, l: 1, ml: '-1, 0, or 1', nodes: 1, desc: 'A dumbbell shape aligned perfectly along the X coordinate axis, passing through the origin.' },
            { id: '2py', label: '2py', n: 2, l: 1, ml: '-1, 0, or 1', nodes: 1, desc: 'A dumbbell shape aligned perfectly along the Y coordinate axis (vertical).' },
            { id: '2pz', label: '2pz', n: 2, l: 1, ml: '-1, 0, or 1', nodes: 1, desc: 'A dumbbell shape aligned perfectly along the Z coordinate axis (depth).' },
        ]
    },
    {
        group: 'D-Block (l = 2)',
        items: [
            { id: '3dxy', label: '3dxy', n: 3, l: 2, ml: '-2, ..., 2', nodes: 2, desc: 'A four-leaf clover shape lying entirely on the XY plane, situated BETWEEN the axes.' },
            { id: '3dxz', label: '3dxz', n: 3, l: 2, ml: '-2, ..., 2', nodes: 2, desc: 'A four-leaf clover shape lying entirely on the XZ plane, situated BETWEEN the axes.' },
            { id: '3dyz', label: '3dyz', n: 3, l: 2, ml: '-2, ..., 2', nodes: 2, desc: 'A four-leaf clover shape lying entirely on the YZ plane, situated BETWEEN the axes.' },
            { id: '3dx2-y2', label: '3dx²-y²', n: 3, l: 2, ml: '-2, ..., 2', nodes: 2, desc: 'A four-leaf clover shape lying on the XY plane, aligned DIRECTLY ON the X and Y axes.' },
            { id: '3dz2', label: '3dz²', n: 3, l: 2, ml: '0', nodes: 2, desc: 'A unique shape consisting of two lobes along the Z axis and a doughnut-shaped torus localized in the XY plane.' },
        ]
    },
    {
        group: 'F-Block (l = 3)',
        items: [
            { id: '4fz3', label: '4fz³', n: 4, l: 3, ml: '0', nodes: 3, desc: 'Two axial lobes on the Z-axis with two concentric tori (donuts) around it.' },
            { id: '4fx3', label: '4fx³', n: 4, l: 3, ml: '±1', nodes: 3, desc: 'Two axial lobes on the X-axis with two concentric tori.' },
            { id: '4fy3', label: '4fy³', n: 4, l: 3, ml: '±1', nodes: 3, desc: 'Two axial lobes on the Y-axis with two concentric tori.' },
            { id: '4fxyz', label: '4fxyz', n: 4, l: 3, ml: '±2', nodes: 3, desc: 'Eight lobes pointing into the corners of a cube (the octants).' },
            { id: '4fz(x2-y2)', label: '4fz(x²-y²)', n: 4, l: 3, ml: '±2', nodes: 3, desc: 'Eight lobes originating along planar intersections.' },
            { id: '4fx(z2-y2)', label: '4fx(z²-y²)', n: 4, l: 3, ml: '±3', nodes: 3, desc: 'Eight lobes originating along planar intersections.' },
            { id: '4fy(z2-x2)', label: '4fy(z²-x²)', n: 4, l: 3, ml: '±3', nodes: 3, desc: 'Eight lobes originating along planar intersections.' },
        ]
    },
    {
        group: 'Hybridized Orbitals',
        items: [
            { id: 'h_sp', label: 'sp', isHybrid: true, mix: '1s + 1p', angle: '180°', shapeStr: 'Linear', desc: 'Constructed from one s and one p orbital, resulting in two large lobes extending in opposite directions.' },
            { id: 'h_sp2', label: 'sp²', isHybrid: true, mix: '1s + 2p', angle: '120°', shapeStr: 'Trigonal Planar', desc: 'Constructed from one s and two p orbitals, resulting in three large lobes distributed symmetrically in a 2D plane.' },
            { id: 'h_sp3', label: 'sp³', isHybrid: true, mix: '1s + 3p', angle: '109.5°', shapeStr: 'Tetrahedral', desc: 'Constructed from one s and three p orbitals, forming four lobes pointing towards the corners of a tetrahedron.' },
            { id: 'h_sp3d', label: 'sp³d', isHybrid: true, mix: '1s + 3p + 1d', angle: '90° & 120°', shapeStr: 'Trigonal Bipyramidal', desc: 'A five-lobed hybrid system featuring three equatorial lobes (120°) and two axial lobes (90°).' },
            { id: 'h_sp3d2', label: 'sp³d²', isHybrid: true, mix: '1s + 3p + 2d', angle: '90°', shapeStr: 'Octahedral', desc: 'A six-lobed hybrid system perfectly aligned along the primary Cartesian X, Y, and Z axes.' },
        ]
    }
];

export default function OrbitalsPage() {
    const [selectedId, setSelectedId] = useState('2px');
    
    // Find active data
    let activeOrbital = null;
    for(const group of ORBITALS_LIBRARY) {
        const found = group.items.find(i => i.id === selectedId);
        if (found) activeOrbital = found;
    }

    const formatOrbitalLabel = (orb) => {
        if (orb.isHybrid) return orb.label;
        
        const match = orb.label.match(/([spdf])/);
        if (!match) return orb.label; 
        
        const splitIdx = match.index + 1;
        const base = orb.label.slice(0, splitIdx);
        const sub = orb.label.slice(splitIdx);
        
        if (!sub) return base; // e.g. '1s'
        
        return (
            <span>
                {base}
                <sub className="text-[0.7em] ml-[1px]">{sub}</sub>
            </span>
        );
    };

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-[#05050f] text-white flex overflow-hidden font-sans">
            
            {/* L-PANEL: Selector */}
            <div className="w-80 bg-[#0a0a1a] border-r border-[#1e1e3f] flex flex-col z-10 shrink-0 shadow-2xl">
                <div className="p-6 border-b border-[#1e1e3f] bg-gradient-to-b from-[#0f0f2a] to-transparent">
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 flex items-center gap-2">
                        <Atom className="w-6 h-6 text-cyan-500" /> Orbitals
                    </h1>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        Visualize quantum probability density bounds and wave functions.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {ORBITALS_LIBRARY.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-3">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">
                                {group.group}
                            </h2>
                            <div className="grid grid-cols-2 gap-2">
                                {group.items.map(orb => {
                                    const isActive = selectedId === orb.id;
                                    return (
                                        <button
                                            key={orb.id}
                                            onClick={() => setSelectedId(orb.id)}
                                            className={`px-3 py-2.5 rounded-xl font-mono text-sm font-bold transition-all border ${
                                                isActive 
                                                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                                : 'bg-black/40 text-gray-400 border-white/5 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                            } ${orb.id.startsWith('3d') && !isActive ? 'col-span-2' : ''}`}
                                            // Handle grid spans safely
                                            style={orb.id.startsWith('3d') || orb.id.startsWith('4f') ? { gridColumn: 'span 2' } : {}}
                                        >
                                            {formatOrbitalLabel(orb)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER: Canvas Sandbox */}
            <div className="flex-1 relative bg-gradient-to-br from-[#020205] via-[#0a0a14] to-[#04091a]">
                
                {/* Overlay UI */}
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 shadow-xl">
                        <h2 className="text-3xl font-mono font-black text-white">{formatOrbitalLabel(activeOrbital)} <span className="text-sm font-sans text-gray-400 tracking-wide font-normal uppercase ml-2">Orbital</span></h2>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/5">
                            <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                            <span className="text-xs font-bold text-gray-300">Positive Phase (+)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/5">
                            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                            <span className="text-xs font-bold text-gray-300">Negative Phase (-)</span>
                        </div>
                    </div>
                </div>

                <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#4444ff" />
                    
                    {/* Visual Coordinate System */}
                    <group>
                        <axesHelper args={[4]} />
                        <gridHelper args={[10, 10, '#ffffff', '#222222']} position={[0, -0.01, 0]} material-opacity={0.2} material-transparent />
                        {/* Axis Labels */}
                        <Text position={[4.2, 0, 0]} color="red" fontSize={0.3} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">X</Text>
                        <Text position={[0, 4.2, 0]} color="green" fontSize={0.3} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">Y</Text>
                        <Text position={[0, 0, 4.2]} color="blue" fontSize={0.3} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">Z</Text>
                    </group>

                    <group scale={1.2}>
                        <OrbitalViewer orbitalData={activeOrbital} />
                    </group>
                    
                    <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                </Canvas>
            </div>

            {/* R-PANEL: Quantum Analytics */}
            <div className="w-80 bg-[#0a0a1a] border-l border-[#1e1e3f] flex flex-col z-10 shrink-0 shadow-2xl p-6">
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <Info className="w-5 h-5 text-cyan-500" /> Quantum State
                </h2>

                <div className="space-y-6">
                    {/* Conditional Panel Profile */}
                    {activeOrbital.isHybrid ? (
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Hybridization Profile</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 col-span-2 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                                    <span className="text-xs text-yellow-500 mb-1 font-mono italic">Geometry</span>
                                    <span className="text-xl font-black text-white text-center leading-tight">{activeOrbital.shapeStr}</span>
                                </div>
                                
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                                    <span className="text-xs text-green-500 mb-1 font-mono italic">Orbitals Mixed</span>
                                    <span className="text-[14px] font-black text-white">{activeOrbital.mix}</span>
                                </div>
                                
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors"></div>
                                    <span className="text-xs text-pink-500 mb-1 font-mono italic">Bond Angle</span>
                                    <span className="text-[14px] font-black text-white">{activeOrbital.angle}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Quantum Numbers</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
                                    <span className="text-xs text-cyan-500 mb-1 font-mono italic">n</span>
                                    <span className="text-2xl font-black text-white">{activeOrbital.n}</span>
                                    <span className="text-[9px] text-gray-500 uppercase mt-1">Principal</span>
                                </div>
                                
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                                    <span className="text-xs text-blue-500 mb-1 font-mono italic">l</span>
                                    <span className="text-2xl font-black text-white">{activeOrbital.l}</span>
                                    <span className="text-[9px] text-gray-500 uppercase mt-1">Azimuthal</span>
                                </div>
                                
                                <div className="bg-black/40 border border-white/5 col-span-2 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                                    <span className="text-xs text-purple-500 mb-1 font-mono italic">m_l</span>
                                    <span className="text-xl font-black text-white">{activeOrbital.ml}</span>
                                    <span className="text-[9px] text-gray-500 uppercase mt-1">Magnetic</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Theoretical Explanation */}
                    <div>
                        <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Probability Density</h3>
                        <p className="text-sm text-gray-300 leading-relaxed bg-blue-900/10 border border-blue-900/30 p-4 rounded-xl">
                            {activeOrbital.desc}
                        </p>
                    </div>

                    {!activeOrbital.isHybrid && (
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Angular Nodes</span>
                            <span className="text-lg font-black text-white">{activeOrbital.nodes}</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-xl">
                        <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                            <strong className="text-cyan-400">Remember:</strong> Orbitals are not exact flight paths, but mathematical probability clouds representing where an electron is 90% likely to be found.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}
