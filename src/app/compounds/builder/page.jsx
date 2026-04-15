'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Plane, TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import AnimatedDashedLine from '@/components/reactions/engine/AnimatedDashedLine';
import { useReactionEditor } from '@/context/ReactionEditorContext';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';
import RadicalGroupUI from '@/components/reactions/engine/RadicalGroupUI';
import VSEPRPhysicsEngine from '@/components/reactions/engine/VSEPRPhysicsEngine';
import { getAllElementsList, getElementData } from '@/utils/elementColors';
import { calculateInductiveEffects, calculateMesomericEffects } from '@/utils/electronicEffects';
import { AnimatedInductiveArrow, ResonanceCloud, CurvedPushingArrow } from '@/components/effects/ElectronicEffects3D';

// --- SUBCOMPONENTS ---

/**
 * Invisible plane that captures clicks to place atoms.
 */
// Simple Error Boundary to catch Canvas crashes
class CanvasErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Canvas crashed:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center text-red-500 font-mono">
                    <span className="text-4xl mb-4">💥 WebGL Crash</span>
                    <h2 className="text-xl font-bold mb-2">The 3D Scene encountered a critical error:</h2>
                    <p className="bg-red-900/30 p-4 rounded text-sm max-w-2xl overflow-auto select-all">{this.state.error?.toString()}</p>
                    <button onClick={() => this.setState({hasError: false})} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Attempt Recovery</button>
                </div>
            );
        }
        return this.props.children;
    }
}
const ClickablePlane = ({ onPlaceAtom }) => {
    return (
        <Plane
            args={[50, 50]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
            onClick={(e) => {
                e.stopPropagation();
                onPlaceAtom(e.point);
            }}
        />
    );
};

// Keyboard Navigation Component
const CameraController = () => {
    const { camera } = useThree();
    const [movement, setMovement] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: true })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: true })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: true })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: true })); break;
                case 'KeyQ': setMovement(m => ({ ...m, up: true })); break; // Elevation Up
                case 'KeyE': setMovement(m => ({ ...m, down: true })); break; // Elevation Down
            }
        };
        const handleKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: false })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: false })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: false })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: false })); break;
                case 'KeyQ': setMovement(m => ({ ...m, up: false })); break;
                case 'KeyE': setMovement(m => ({ ...m, down: false })); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        const speed = 10 * delta; // units per second
        const moveVec = new THREE.Vector3();

        if (movement.forward || movement.backward) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            if (movement.forward) moveVec.add(forward);
            if (movement.backward) moveVec.sub(forward);
        }

        if (movement.left || movement.right) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const right = new THREE.Vector3();
            right.crossVectors(forward, camera.up).normalize();
            if (movement.right) moveVec.add(right);
            if (movement.left) moveVec.sub(right);
        }

        if (movement.up) moveVec.y += 1;
        if (movement.down) moveVec.y -= 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(speed);
            camera.position.add(moveVec);
            if (state.controls) {
                state.controls.target.add(moveVec);
                state.controls.update();
            }
        }
    });

    return null;
};



// --- MAIN PAGE ---

export default function MoleculeBuilderPage() {
    const { script, addAtom, updateAtomPosition, updateAtomCharge, updateAllAtomPositions, removeAtom, addBond, removeBond, updateBond, createGroup, removeGroup, updateGroupCharge, clearScript } = useReactionEditor();

    // UI State
    const [mode, setMode] = useState('none'); // 'none', 'add', 'select', 'bond', 'group', 'delete'
    const [autoLayout, setAutoLayout] = useState(false);
    const [showLonePairs, setShowLonePairs] = useState(false);
    const [showInductive, setShowInductive] = useState(false);
    const [showMesomericArrows, setShowMesomericArrows] = useState(false);
    const [showMesomericCloud, setShowMesomericCloud] = useState(false);
    const [element, setElement] = useState('C');
    const [charge, setCharge] = useState(0);
    const [bondOrder, setBondOrder] = useState(1);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    // Electronic Effect Computations (cached unless topology changes)
    const inductiveData = useMemo(() => {
        if (!showInductive) return null;
        return calculateInductiveEffects(script.atoms, script.bonds);
    }, [showInductive, script.atoms, script.bonds]);

    const mesomericData = useMemo(() => {
        if (!showMesomericArrows && !showMesomericCloud) return null;
        return calculateMesomericEffects(script.atoms, script.bonds);
    }, [showMesomericArrows, showMesomericCloud, script.atoms, script.bonds]);

    // Group State
    const [selectedGroupAtoms, setSelectedGroupAtoms] = useState([]);
    const [groupChargeValue, setGroupChargeValue] = useState(-1);

    // Interaction State
    const [selectedAtomId, setSelectedAtomId] = useState(null);
    const [selectedBondId, setSelectedBondId] = useState(null);
    const [pointerPos3D, setPointerPos3D] = useState(null);

    // Clear pointer tracking when not creating a bond
    useEffect(() => {
        if (mode !== 'bond' || !selectedAtomId) {
            setPointerPos3D(null);
        }
    }, [mode, selectedAtomId]);

    // Cached element list
    const elementList = useMemo(() => getAllElementsList(), []);

    // Canvas Handlers
    const handlePlaneClick = (point) => {
        if (mode === 'add') {
            addAtom(element, parseInt(charge), [point.x, point.y, point.z]);
        }
    };

    // Directional move function for the UI buttons
    const moveSelectedAtom = (dx, dy, dz) => {
        if (!selectedAtomId) return;
        const atom = script.atoms.find(a => a.id === selectedAtomId);
        if (atom) {
            const [x, y, z] = atom.startPos;
            updateAtomPosition(selectedAtomId, [x + dx, y + dy, z + dz]);
        }
    };

    const handleAtomClick = (e, id) => {
        e.stopPropagation(); // Don't trigger canvas click

        if (mode === 'delete') {
            removeAtom(id);
        } else if (mode === 'bond') {
            if (!selectedAtomId) {
                // Select first atom
                setSelectedAtomId(id);
            } else {
                // Link to second atom
                if (selectedAtomId !== id) {
                    addBond(selectedAtomId, id, bondOrder);
                }
                setSelectedAtomId(null); // Reset selection
                setPointerPos3D(null); // Clear preview line
            }
        } else if (mode === 'group') {
            setSelectedGroupAtoms(prev =>
                prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
            );
        } else if (mode === 'select') {
            setSelectedAtomId(id);
            setSelectedBondId(null);
        }
    };

    // Clear selections when mode changes
    useEffect(() => {
        if (mode !== 'group') setSelectedGroupAtoms([]);
        if (mode !== 'select') {
            setSelectedAtomId(null);
            setSelectedBondId(null);
        }
    }, [mode]);



    return (
        <div className="w-full h-[calc(100vh-64px)] bg-transparent text-white flex overflow-hidden relative">

            {/* Animated Background */}
            <div className="bg-mesh-container">
                <div className="bg-mesh-blob blob-1" />
                <div className="bg-mesh-blob blob-2" />
                <div className="bg-mesh-blob blob-3" />
            </div>

            {/* LEFT PANEL - CONTROLS */}
            <div className="w-85 glass-card !bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col z-10 shadow-2xl shrink-0 overflow-hidden rounded-none">
                <div className="p-8 border-b border-white/5">
                    <h1 className="text-3xl font-black tracking-tighter text-white">
                        MOLECULE <span className="text-white/40 font-light uppercase">BUILDER</span>
                    </h1>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60 mt-2 leading-relaxed">Visually construct structural formulas.</p>
                </div>



                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">

                    {/* TOOLS */}
                    <div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setMode('none')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 col-span-2 relative overflow-hidden tap-animation border ${mode === 'none' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                {mode === 'none' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                None
                            </button>
                            <button onClick={() => setMode('add')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'add' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                {mode === 'add' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                Add
                            </button>
                            <button onClick={() => setMode('select')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'select' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                {mode === 'select' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                Select
                            </button>
                            <button onClick={() => setMode('bond')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'bond' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                {mode === 'bond' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                Bond
                            </button>
                            <button onClick={() => setMode('group')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'group' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                {mode === 'group' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                Group
                            </button>
                            <button onClick={() => setMode('delete')} className={`px-4 py-3 rounded-sm font-black text-[12px] uppercase tracking-widest transition-all duration-500 col-span-2 relative overflow-hidden tap-animation border ${mode === 'delete' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'glass-pill border-white/10 text-red-500/70 hover:border-red-400/20 hover:text-red-400'}`}>
                                {mode === 'delete' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                                Delete
                            </button>
                        </div>



                        <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setAutoLayout(!autoLayout)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${autoLayout ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>VSEPR Auto-Layout</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${autoLayout ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${autoLayout ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>
                            
                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setShowLonePairs(!showLonePairs)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${showLonePairs ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>Atomic Lone Pairs</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${showLonePairs ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${showLonePairs ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setShowInductive(!showInductive)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${showInductive ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>Inductive Effect (±I)</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${showInductive ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${showInductive ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>
                            
                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setShowMesomericCloud(!showMesomericCloud)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${showMesomericCloud ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>Resonance Cloud (±M)</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${showMesomericCloud ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${showMesomericCloud ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setShowMesomericArrows(!showMesomericArrows)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${showMesomericArrows ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>Electron Arrows (±M)</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${showMesomericArrows ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${showMesomericArrows ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>


                            {/* Info Box */}
                            {(showInductive || (showMesomericArrows || showMesomericCloud)) && (
                                <div className="mt-4 p-3 bg-black/50 rounded border border-gray-800 text-[10px] font-mono leading-relaxed">
                                    {showInductive && inductiveData && inductiveData.vectors.length > 0 && (
                                        <div className="mb-2 text-orange-200">
                                            <span className="font-bold text-orange-400">Inductive:</span> {inductiveData.vectors.length} polarized bonds found.
                                        </div>
                                    )}
                                    {(showMesomericArrows || showMesomericCloud) && mesomericData && mesomericData.clouds.length > 0 && (
                                        <div className="text-purple-200">
                                            <span className="font-bold text-purple-400">Mesomeric:</span> {mesomericData.clouds.length} conjugated pi-system(s) detected.
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-[10px] text-gray-500 mt-4 leading-tight">These effects are computed dynamically using cheminformatics heuristics based on Pauling electronegativity and VBT conjugation rules.</p>
                        </div>
                    </div>

                    {/* CONTEXTUAL PROPERTIES */}
                    {mode === 'add' && (
                        <div className="bg-white/[0.03] p-6 rounded-none border border-white/10 animate-fade-in shadow-inner backdrop-blur-md">
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white/60" />
                                Atom Properties
                            </h2>

                            <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2">Element</label>
                            <select value={element} onChange={(e) => setElement(e.target.value)} className="w-full glass-pill !bg-white/5 border-white/5 rounded-none p-2.5 text-[11px] font-bold text-white focus:outline-none focus:border-white/20 mb-4 appearance-none custom-select">
                                {elementList.map(el => (
                                    <option key={el.symbol} value={el.symbol} className="bg-black">
                                        {el.number}. {el.name} ({el.symbol})
                                    </option>
                                ))}
                            </select>

                            <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2">Charge</label>
                            <select value={charge} onChange={(e) => setCharge(e.target.value)} className="w-full glass-pill !bg-white/5 border-white/5 rounded-none p-2.5 text-[11px] font-bold text-white focus:outline-none focus:border-white/20 appearance-none custom-select">
                                <option value="0" className="bg-black">Neutral (0)</option>
                                <option value="1" className="bg-black">Cation (+1)</option>
                                <option value="2" className="bg-black">Cation (+2)</option>
                                <option value="3" className="bg-black">Cation (+3)</option>
                                <option value="-1" className="bg-black">Anion (-1)</option>
                                <option value="-2" className="bg-black">Anion (-2)</option>
                                <option value="-3" className="bg-black">Anion (-3)</option>
                            </select>
                        </div>
                    )}


                    {mode === 'bond' && (
                        <div className="bg-white/[0.03] p-6 rounded-none border border-white/10 animate-fade-in shadow-inner backdrop-blur-md">
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                Bond Order
                            </h2>
                            <p className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-4">Select two atoms to connect.</p>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(order => (
                                    <button
                                        key={order}
                                        onClick={() => setBondOrder(order)}
                                        className={`flex-1 py-2 rounded-none text-[12px] font-black transition-all border tap-animation ${bondOrder === order ? 'bg-white text-black border-white shadow-xl' : 'glass-pill border-white/10 text-white/70 hover:border-white/20'}`}
                                    >
                                        {order}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}



                    {mode === 'select' && (
                        <div className="bg-white/[0.03] p-6 rounded-none border border-white/10 animate-fade-in shadow-inner backdrop-blur-md">
                            {!selectedAtomId && !selectedBondId && (
                                <p className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center py-4 leading-relaxed">Click an atom or bond in the 3D view to select it and see edit controls.</p>
                            )}

                            {selectedAtomId && (() => {
                                const activeAtom = script.atoms.find(a => a.id === selectedAtomId);
                                return (
                                    <div className="space-y-6">
                                        <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                            Edit Selected Atom
                                        </h2>

                                        {/* Edit Charge */}
                                        <div className="glass-pill !bg-white/5 border-white/10 p-4 rounded-none">
                                            <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2">Atom Charge</label>
                                            <select
                                                value={activeAtom.charge || 0}
                                                onChange={(e) => updateAtomCharge(selectedAtomId, e.target.value)}
                                                className="w-full bg-transparent border-none rounded p-0 text-[11px] font-bold text-white focus:outline-none"
                                            >
                                                <option value="0" className="bg-black">Neutral (0)</option>
                                                <option value="1" className="bg-black">Cation (+1)</option>
                                                <option value="2" className="bg-black">Cation (+2)</option>
                                                <option value="3" className="bg-black">Cation (+3)</option>
                                                <option value="-1" className="bg-black">Anion (-1)</option>
                                                <option value="-2" className="bg-black">Anion (-2)</option>
                                                <option value="-3" className="bg-black">Anion (-3)</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div />
                                            <button onClick={() => moveSelectedAtom(0, 0, -1)} className="glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">Bkwd</button>
                                            <div />
                                            <button onClick={() => moveSelectedAtom(-1, 0, 0)} className="glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">Left</button>
                                            <div className="flex items-center justify-center text-[10px] font-black text-white/30 font-mono">X / Z</div>
                                            <button onClick={() => moveSelectedAtom(1, 0, 0)} className="glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">Right</button>
                                            <div />
                                            <button onClick={() => moveSelectedAtom(0, 0, 1)} className="glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">Fwd</button>
                                            <div />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => moveSelectedAtom(0, 0.5, 0)} className="flex-1 glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">UP (+Y)</button>
                                            <button onClick={() => moveSelectedAtom(0, -0.5, 0)} className="flex-1 glass-pill border-white/10 hover:border-white/20 p-2 text-[11px] font-black text-white/70 hover:text-white uppercase transition-all">DN (-Y)</button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {selectedBondId && (
                                <div className="space-y-4">
                                    <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                        Edit Bond Order
                                    </h2>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(order => {
                                            const active = script.bonds.find(b => b.id === selectedBondId)?.order === order;
                                            return (
                                                <button
                                                    key={order}
                                                    onClick={() => updateBond(selectedBondId, order)}
                                                    className={`flex-1 py-2 rounded-none text-[12px] font-black transition-all border tap-animation ${active ? 'bg-white text-black border-white shadow-xl' : 'glass-pill border-white/10 text-white/70 hover:border-white/20'}`}
                                                >
                                                    {order}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {mode === 'group' && (
                        <div className="bg-white/[0.03] p-6 rounded-none border border-white/10 animate-fade-in shadow-inner backdrop-blur-md space-y-4">
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                Radical Groups
                            </h2>

                            <div className="glass-pill !bg-white/5 border-white/5 p-4 rounded-none">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-3 text-white/40">
                                    Click atoms in the 3D view to select them for grouping.
                                </p>
                                <div className="text-[12px] font-mono text-cyan-400 mb-4 bg-black/20 p-3 rounded-none min-h-[40px] flex items-center flex-wrap gap-1.5 border border-white/10">
                                    {selectedGroupAtoms.length === 0 ? <span className="text-white/20 italic">No atoms selected.</span> : selectedGroupAtoms.map(id => (
                                        <span key={id} className="bg-cyan-500/10 px-2 py-0.5 rounded-none border border-cyan-500/40 text-[11px] font-black">{id}</span>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2 font-bold">Group Charge</label>
                                        <select value={groupChargeValue} onChange={(e) => setGroupChargeValue(parseInt(e.target.value))} className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-white focus:outline-none appearance-none">
                                            <option value="-1" className="bg-black">Anion (-1)</option>
                                            <option value="-2" className="bg-black">Anion (-2)</option>
                                            <option value="-3" className="bg-black">Anion (-3)</option>
                                            <option value="1" className="bg-black">Cation (+1)</option>
                                            <option value="2" className="bg-black">Cation (+2)</option>
                                            <option value="3" className="bg-black">Cation (+3)</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            createGroup(selectedGroupAtoms, groupChargeValue);
                                            setSelectedGroupAtoms([]);
                                        }}
                                        disabled={selectedGroupAtoms.length < 2}
                                        className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-none text-xs transition-colors h-fit uppercase"
                                    >
                                        Group
                                    </button>
                                </div>
                            </div>

                            {(script.groups || []).length > 0 && (
                                <div className="space-y-3">
                                    <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest font-bold text-gray-400">Existing Groups</label>
                                    <div className="flex flex-col gap-2">
                                        {(script.groups || []).map(g => (
                                            <div key={g.id} className="glass-pill !bg-white/5 border-white/5 p-3 rounded-none flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-yellow-400">{g.id}</span>
                                                    <span className="text-[8px] font-mono text-gray-500 uppercase truncate max-w-[100px]">{g.atomIds.join(', ')}</span>
                                                </div>
                                                <button onClick={() => removeGroup(g.id)} className="text-[8px] font-black bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded-none transition-colors border border-red-900/50">Dissolve</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="p-4 border-t border-gray-800 flex flex-col gap-2 bg-black/20">
                    <button onClick={clearScript} className="w-full py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-none transition-colors text-sm font-bold">
                        Clear Workspace
                    </button>
                </div>
            </div>

            {/* CENTER PANEL - 3D CANVAS */}
            <div className="flex-1 relative cursor-crosshair group/canvas overflow-hidden">

                {/* Visual Polish: Signature Gradient Overlay */}
                <div className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
                <div className="absolute inset-0 pointer-events-none z-[1] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)]" />

                {/* Mode Overlay */}
                <div className="absolute top-8 left-8 z-10 pointer-events-none flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <span className="bg-white text-black px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border border-white uppercase shadow-2xl">
                            SYSTEM: {mode}
                        </span>
                        {selectedAtomId && (
                            <span className="bg-white/5 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border border-white/10 uppercase animate-pulse">
                                TARGET: ATOM-{selectedAtomId}
                            </span>
                        )}
                        {selectedBondId && (
                            <span className="bg-white/5 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border border-white/10 uppercase animate-pulse">
                                TARGET: BOND-{selectedBondId}
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation Guide Overlay */}
                <div className="absolute bottom-10 right-10 z-10 pointer-events-none glass-card !bg-black/60 rounded-xl p-8 border border-white/10 shadow-3xl backdrop-blur-3xl">
                    <ul className="text-white/60 text-[12px] font-black uppercase tracking-[0.2em] space-y-3.5 leading-tight">
                        <li className="flex justify-between items-center gap-12"><span>Orbit</span> <span className="text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">L-CLICK</span></li>
                        <li className="flex justify-between items-center gap-12"><span>Pan</span> <span className="text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">R-CLICK</span></li>
                        <li className="flex justify-between items-center gap-12"><span>Zoom</span> <span className="text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">SCROLL</span></li>
                        <li className="flex justify-between items-center gap-12"><span>Camera</span> <span className="text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">W/A/S/D</span></li>
                        <li className="flex justify-between items-center gap-12"><span>Y-Axis</span> <span className="text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">Q / E</span></li>
                    </ul>
                </div>



                <CanvasErrorBoundary>
                <Canvas
                    camera={{ position: [0, 5, 10], fov: 45 }}
                    dpr={[1, 1.5]}
                    gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
                    onContextMenu={(e) => e.preventDefault()}
                    onPointerMissed={() => {
                        if (mode === 'bond' || mode === 'select') {
                            setSelectedAtomId(null);
                            setSelectedBondId(null);
                        }
                        if (mode === 'group') {
                            setSelectedGroupAtoms([]);
                        }
                    }}
                >
                    <CameraController />

                    {/* Engine for auto-arranging atoms/bonds */}
                    <VSEPRPhysicsEngine active={autoLayout} script={script} updateAllAtomPositions={updateAllAtomPositions} showLonePairs={showLonePairs} />

                    <Suspense fallback={null}>
                        <Environment preset="city" />
                    </Suspense>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    {/* Visual Grid - Fixed at Y=0 */}
                    <Grid infiniteGrid fadeDistance={40} sectionColor="#113344" cellColor="#0a192f" position={[0, 0, 0]} />

                    {/* Interaction Plane - Only render in Add mode */}
                    {mode === 'add' && <ClickablePlane onPlaceAtom={handlePlaneClick} />}

                    {/* Electronic Effects Renderers */}

                    {/* 1. Inductive Effect Arrows */}
                    {showInductive && inductiveData && inductiveData.vectors.map((vec, i) => {
                        const a1 = script.atoms.find(a => a.id === vec.sourceId);
                        const a2 = script.atoms.find(a => a.id === vec.targetId);
                        if (!a1 || !a2) return null;
                        
                        let inSameRing = false;
                        if (mesomericData) {
                            inSameRing = mesomericData.clouds.some(cloud => 
                                cloud.includes(a1.id) && cloud.includes(a2.id) && cloud.length >= 4
                            );
                        }
                        if (inSameRing) return null; // NO arrows inside conjugated rings!

                        // vec.diff positive means electron pulls towards a2
                        const start = vec.diff > 0 ? a1.startPos : a2.startPos;
                        const end = vec.diff > 0 ? a2.startPos : a1.startPos;
                        
                        return (
                            <AnimatedInductiveArrow 
                                key={`ind-arrow-${i}`} 
                                startPos={new THREE.Vector3(...start)} 
                                endPos={new THREE.Vector3(...end)} 
                                magnitude={Math.abs(vec.diff)} 
                                isPositive={true} 
                            />
                        );
                    })}

                    {/* 2. Inductive Effect Labels & Halos (δ+ / δ-) */}
                    {showInductive && inductiveData && script.atoms.map(atom => {
                        const d = inductiveData.deltas[atom.id] || 0;
                        if (Math.abs(d) < 0.1) return null;
                        
                        // Enforce Rule: Remove strong δ markings inside the ring
                        let isInRing = false;
                        if (mesomericData) {
                            isInRing = mesomericData.clouds.some(cloud => cloud.includes(atom.id) && cloud.length >= 4);
                        }
                        if (isInRing && Math.abs(d) < 0.3) return null; // Only show on ring carbons if they are heavily pulled directly by a substituent

                        const isPos = d > 0;
                        const absD = Math.abs(d);
                        
                        const labelText = isPos ? `δ⁺` : `δ⁻`;
                        const labelColor = isPos ? '#f87171' : '#60a5fa'; // Red/Blue
                        const haloColor = isPos ? '#ff3333' : '#3b82f6';

                        const baseRadius = getElementData(atom.element).radius;
                        
                        let scale = Math.min(2.5, 1.0 + absD * 1.5);
                        let haloOpacity = Math.min(0.6, absD * 0.4);
                        let fontSize = 18;

                        // Reduce Hydrogen visual dominance
                        if (atom.element === 'H') {
                            scale *= 0.6;
                            haloOpacity *= 0.3;
                            fontSize = 14;
                        }

                        return (
                            <group key={`ind-label-${atom.id}`} position={atom.startPos}>
                                <mesh>
                                    <sphereGeometry args={[baseRadius * scale, 32, 32]} />
                                    <meshBasicMaterial color={haloColor} transparent opacity={haloOpacity} depthWrite={false} />
                                </mesh>
                                <Html center position={[0, -baseRadius - 0.6, 0]} zIndexRange={[100, 0]}>
                                    <div 
                                        className="select-none font-bold font-sans pointer-events-none" 
                                        style={{ 
                                            color: labelColor, 
                                            fontSize: `${fontSize}px`, 
                                            textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,1)',
                                            fontFamily: 'serif',
                                        }}
                                    >
                                        {labelText}
                                    </div>
                                </Html>
                            </group>
                        );
                    })}

                    {/* 2.5 Aromatic Ring explicitly drawn during Inductive Phase to explain missing labels */}
                    {showInductive && mesomericData && (() => {
                        const conjugatedBondPairs = [];
                        script.bonds.forEach(bond => {
                            mesomericData.clouds.forEach(cloud => {
                                if (cloud.includes(bond.from) && cloud.includes(bond.to)) {
                                    conjugatedBondPairs.push([bond.from, bond.to]);
                                }
                            });
                        });
                        
                        if (conjugatedBondPairs.length < 3) return null; // Only for meaningful networks

                        const positionMap = {};
                        script.atoms.forEach(a => { positionMap[a.id] = new THREE.Vector3(...a.startPos); });

                        return (
                            <group>
                                {/* Render the visual cloud */}
                                <ResonanceCloud atomPositions={positionMap} bondPairs={conjugatedBondPairs} />
                                {/* Render the explanatory text label at the center of the ring */}
                                {mesomericData.clouds.map((cloud, i) => {
                                    if(cloud.length < 4) return null; // Rings/long chains only
                                    const center = new THREE.Vector3();
                                    cloud.forEach(id => {
                                        const atom = script.atoms.find(a=>a.id === id);
                                        if (atom) center.add(new THREE.Vector3(...atom.startPos));
                                    });
                                    center.divideScalar(cloud.length);
                                    
                                    return (
                                        <Html key={`pi-explain-${i}`} position={[center.x, center.y + 0.5, center.z]} center zIndexRange={[50,0]}>
                                            <div className="whitespace-nowrap px-2 py-0.5 bg-indigo-900/80 text-indigo-200 text-[10px] font-bold rounded shadow-lg backdrop-blur border border-indigo-500/30 pointer-events-none select-none">
                                                π electrons delocalized
                                            </div>
                                        </Html>
                                    );
                                })}
                            </group>
                        );
                    })()}

                    {/* 3. Mesomeric Cloud */}
                    {showMesomericCloud && mesomericData && (() => {
                        // Extract all bond pairs within the conjugated systems
                        const conjugatedBondPairs = [];
                        script.bonds.forEach(bond => {
                            mesomericData.clouds.forEach(cloud => {
                                if (cloud.includes(bond.from) && cloud.includes(bond.to)) {
                                    conjugatedBondPairs.push([bond.from, bond.to]);
                                }
                            });
                        });
                        
                        // Map atom IDs to their positions
                        const positionMap = {};
                        script.atoms.forEach(a => { positionMap[a.id] = new THREE.Vector3(...a.startPos); });

                        return (
                            <ResonanceCloud atomPositions={positionMap} bondPairs={conjugatedBondPairs} />
                        );
                    })()}

                    {/* 4. Mesomeric Deltas (Resonance Halos) */}
                    {(showMesomericCloud || showMesomericArrows) && mesomericData && script.atoms.map(atom => {
                        const d = mesomericData.deltas[atom.id] || 0;
                        if (d === 0) return null;
                        
                        const color = d > 0 ? '#4488ff' : '#ff3333';
                        const baseRadius = getElementData(atom.element).radius;
                        return (
                            <mesh key={`meso-halo-${atom.id}`} position={atom.startPos}>
                                <sphereGeometry args={[baseRadius * 1.8, 32, 32]} />
                                <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} wireframe />
                            </mesh>
                        );
                    })}

                    {/* 5. Mesomeric Curved Arrows */}
                    {showMesomericArrows && mesomericData && mesomericData.pushingArrows.map((arrow, i) => {
                        
                        // Find positions for the curve
                        let startPos, endPos;
                        
                        if (arrow.fromCenter) {
                            const a = script.atoms.find(at => at.id === arrow.fromCenter);
                            if(a) startPos = new THREE.Vector3(...a.startPos).add(new THREE.Vector3(0, 0.4, 0)); // slightly offset
                        }
                        
                        if (arrow.targetAtomPair) {
                            const a1 = script.atoms.find(a => a.id === arrow.targetAtomPair[0]);
                            const a2 = script.atoms.find(a => a.id === arrow.targetAtomPair[1]);
                            if (a1 && a2) {
                                endPos = new THREE.Vector3().addVectors(new THREE.Vector3(...a1.startPos), new THREE.Vector3(...a2.startPos)).multiplyScalar(0.5);
                            }
                        }

                        if (!startPos || !endPos) return null;

                        return (
                            <CurvedPushingArrow 
                                key={`meso-arrow-${i}`} 
                                startPos={startPos} 
                                endPos={endPos} 
                                color={arrow.type === '+M' ? '#a855f7' : '#ec4899'}
                            />
                        );
                    })}

                    {/* Render AtomNodes */}
                    {script.atoms.map(atom => {
                        const isSelected = selectedAtomId === atom.id && (mode === 'select' || mode === 'bond');
                        const isGroupSelected = mode === 'group' && selectedGroupAtoms.includes(atom.id);

                        const AtomContent = (
                            <group
                                onClick={(e) => handleAtomClick(e, atom.id)}
                                onPointerOver={(e) => { 
                                    if (mode !== 'none') document.body.style.cursor = 'pointer';
                                    if (mode === 'bond' && selectedAtomId && selectedAtomId !== atom.id) {
                                        setPointerPos3D(atom.startPos);
                                    }
                                }}
                                onPointerMove={(e) => {
                                    if (mode === 'bond' && selectedAtomId && selectedAtomId !== atom.id) {
                                        e.stopPropagation();
                                        setPointerPos3D(atom.startPos);
                                    }
                                }}
                                onPointerOut={() => { document.body.style.cursor = 'crosshair' }}
                            >
                                {/* Selection Ring Base */}
                                {isSelected && (
                                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                        <ringGeometry args={[1.5, 1.8, 32]} />
                                        <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.5} />
                                    </mesh>
                                )}
                                {/* Multi-Selection Ring for Grouping */}
                                {isGroupSelected && (
                                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                        <ringGeometry args={[1.4, 1.7, 32]} />
                                        <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} transparent opacity={0.8} />
                                    </mesh>
                                )}
                                <AtomNode
                                    element={atom.element}
                                    charge={atom.charge || 0}
                                />
                            </group>
                        );

                        return (
                            <React.Fragment key={`atom-${atom.id}`}>
                                {isSelected ? (
                                    <TransformControls
                                        mode="translate"
                                        size={0.6}
                                        position={atom.startPos}
                                        onMouseDown={() => setOrbitEnabled(false)}
                                        onMouseUp={(e) => {
                                            setOrbitEnabled(true);
                                            const { x, y, z } = e.target.object.position;
                                            updateAtomPosition(atom.id, [x, y, z]);
                                        }}
                                    >
                                        {AtomContent}
                                    </TransformControls>
                                ) : (
                                    <group position={atom.startPos}>
                                        {AtomContent}
                                    </group>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Render BondLines */}
                    {script.bonds.map(bond => {
                        const a1 = script.atoms.find(a => a.id === bond.from);
                        const a2 = script.atoms.find(a => a.id === bond.to);
                        if (!a1 || !a2) return null;

                        const getChargeColor = (atom) => {
                            const currentCharge = atom.charge || 0;
                            if (currentCharge !== 0) {
                                return getElementData(atom.element).color;
                            }
                            return "#ffffff"; // Neutral: White
                        };

                        const isSelected = selectedBondId === bond.id;
                        let colorStart = isSelected ? "#00ffff" : getChargeColor(a1);
                        let colorEnd = isSelected ? "#00ffff" : getChargeColor(a2);

                        // If Inductive View is taking over, override all bond colors to neutral grey!
                        if (showInductive && !isSelected) {
                            colorStart = '#aaaaaa';
                            colorEnd = '#aaaaaa';
                        }

                        return (
                            <group
                                key={`bond-${bond.id}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (mode === 'delete') {
                                        removeBond(bond.id);
                                    } else if (mode === 'select') {
                                        setSelectedBondId(bond.id);
                                        setSelectedAtomId(null);
                                    }
                                }}
                                onPointerOver={() => { if (mode === 'delete' || mode === 'select') document.body.style.cursor = 'pointer' }}
                                onPointerOut={() => { document.body.style.cursor = 'crosshair' }}
                            >
                                <BondLine
                                    startPos={a1.startPos}
                                    endPos={a2.startPos}
                                    order={bond.order}
                                    colorStart={colorStart}
                                    colorEnd={colorEnd}
                                    state="normal"
                                    isInductiveView={showInductive}
                                />
                            </group>
                        );
                    })}

                    {/* Temporary Dotted Bond Preview */}
                    {mode === 'bond' && selectedAtomId && pointerPos3D && (() => {
                        const startAtom = script.atoms.find(a => a.id === selectedAtomId);
                        if (!startAtom) return null;
                        return (
                            <AnimatedDashedLine 
                                points={[startAtom.startPos, pointerPos3D]} 
                                color="#00ffff" 
                                lineWidth={2}
                                dashed={true}
                                dashSize={0.4}
                                dashScale={1}
                                gapSize={0.2}
                            />
                        );
                    })()}

                    {/* Invisible tracking plane for drawing dotted bonds into empty space */}
                    {mode === 'bond' && selectedAtomId && (() => {
                        const startAtom = script.atoms.find(a => a.id === selectedAtomId);
                        if (!startAtom) return null;
                        return (
                            <mesh 
                                rotation={[-Math.PI / 2, 0, 0]} 
                                position={[0, startAtom.startPos[1], 0]}
                                onPointerMove={(e) => {
                                    e.stopPropagation();
                                    setPointerPos3D([e.point.x, e.point.y, e.point.z]);
                                }}
                            >
                                <planeGeometry args={[100, 100]} />
                                <meshBasicMaterial transparent opacity={0} depthWrite={false} color="white" />
                            </mesh>
                        );
                    })()}

                    {/* Render Radical Groups */}
                    {(script.groups || []).map(group => (
                        <RadicalGroupUI
                            key={`groupUI-${group.id}`}
                            group={group}
                            atoms={script.atoms}
                        />
                    ))}

                    {/* OrbitControls - Enabled pan, left click orbit doesn't trigger plane if we drag */}
                    <OrbitControls
                        makeDefault
                        enablePan={true}
                        enabled={orbitEnabled}
                        maxPolarAngle={Math.PI / 2.1}
                        mouseButtons={{
                            LEFT: THREE.MOUSE.ROTATE,
                            MIDDLE: THREE.MOUSE.DOLLY,
                            RIGHT: THREE.MOUSE.PAN
                        }}
                    />
                </Canvas>
                </CanvasErrorBoundary>

                {/* Educational Legend UI */}
                {(showInductive || showMesomericArrows || showMesomericCloud) && (
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xl border border-gray-700/50 p-4 rounded-xl shadow-2xl z-20 pointer-events-none w-64 select-none">
                        <h4 className="text-sm font-bold text-gray-200 mb-3 uppercase tracking-wider flex items-center justify-between">
                            <span>Visual Key</span>
                            <span className="text-xs text-blue-400 font-normal ml-2 bg-blue-500/20 px-1.5 py-0.5 rounded">Learning Mode</span>
                        </h4>
                        
                        {showInductive && (
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center font-serif text-blue-300 font-bold shrink-0 mt-0.5">δ⁻</div>
                                    <div className="ml-3">
                                        <div className="text-xs text-gray-200 font-medium tracking-wide">Electron Rich</div>
                                        <div className="text-[10px] text-gray-400">Pulls electron density (–I effect)</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="w-5 h-5 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center font-serif text-red-300 font-bold shrink-0 mt-0.5">δ⁺</div>
                                    <div className="ml-3">
                                        <div className="text-xs text-gray-200 font-medium tracking-wide">Electron Deficient</div>
                                        <div className="text-[10px] text-gray-400">Loses electron density</div>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                                            <path d="M0 4H18M18 4L14 0.5M18 4L14 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-xs text-gray-200 font-medium tracking-wide">Direction of Flow</div>
                                        <div className="text-[10px] text-blue-300 font-medium mt-0.5">Travels through σ bonds only</div>
                                        <div className="text-[10px] text-gray-400 italic">Opacity decreases with distance</div>
                                    </div>
                                </div>

                                <div className="flex items-start pt-1 border-t border-gray-700/50">
                                    <div className="w-5 h-5 flex flex-col items-center justify-center shrink-0 space-y-[2px]">
                                        <div className="w-4 h-[2.5px] bg-gray-400 rounded-full"></div>
                                        <div className="w-4 h-[1px] bg-gray-500/50 rounded-full"></div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-xs text-gray-200 font-medium tracking-wide">σ vs π bonds</div>
                                        <div className="text-[10px] text-gray-400">π bonds render as thin & translucent</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!showInductive && (showMesomericCloud || showMesomericArrows) && (
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border-2 border-purple-400 shrink-0 mt-0.5"></div>
                                    <div className="ml-3">
                                        <div className="text-xs text-gray-200 font-medium tracking-wide">Delocalized π System</div>
                                        <div className="text-[10px] text-gray-400">Conjugated electron network</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT PANEL - JSON OUTPUT */}
            <div className="w-96 glass-card !bg-black/60 backdrop-blur-3xl border-l border-white/5 flex flex-col z-10 shrink-0 rounded-none">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live JSON</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(script, null, 2))}
                        className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-none transition-all border border-white/5"
                    >
                        Copy
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 text-[10px] font-mono text-white/40 whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-white/10 selection:text-white">
                    {JSON.stringify({ atoms: script.atoms, bonds: script.bonds, groups: script.groups || [] }, null, 2)}
                </div>
            </div>



        </div>
    );
}
