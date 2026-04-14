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
        <div className="w-full h-[calc(100vh-64px)] bg-black text-white flex overflow-hidden">

            {/* LEFT PANEL - CONTROLS */}
            <div className="w-80 bg-gray-900 border-r border-cyan-800 flex flex-col z-10 shadow-2xl shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-cyan-400">Molecule Builder</h1>
                    <p className="text-xs text-gray-400 mt-1">Visually construct structural formulas.</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">

                    {/* TOOLS */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tools</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setMode('none')} className={`px-3 py-2 rounded font-semibold text-sm transition-all col-span-2 ${mode === 'none' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>None (Navigate Only)</button>
                            <button onClick={() => setMode('add')} className={`px-3 py-2 rounded font-semibold text-sm transition-all ${mode === 'add' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Add Atom</button>
                            <button onClick={() => setMode('select')} className={`px-3 py-2 rounded font-semibold text-sm transition-all ${mode === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Select/Edit</button>
                            <button onClick={() => setMode('bond')} className={`px-3 py-2 rounded font-semibold text-sm transition-all ${mode === 'bond' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Draw Bond</button>
                            <button onClick={() => setMode('group')} className={`px-3 py-2 rounded font-semibold text-sm transition-all ${mode === 'group' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Group Actions</button>
                            <button onClick={() => setMode('delete')} className={`px-3 py-2 rounded font-semibold text-sm transition-all col-span-2 ${mode === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Delete</button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setAutoLayout(!autoLayout)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${autoLayout ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoLayout ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${autoLayout ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Auto-Layout (VSEPR)</span>
                            </label>
                            
                            <label className="flex items-center gap-2 mt-3 cursor-pointer group" onClick={() => setShowLonePairs(!showLonePairs)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${showLonePairs ? 'bg-green-600' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showLonePairs ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${showLonePairs ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Show Lone Pairs</span>
                            </label>

                            {/* INDUCTIVE EFFECT TOGGLE */}
                            <label className="flex items-center gap-2 mt-4 cursor-pointer group" onClick={() => setShowInductive(!showInductive)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${showInductive ? 'bg-orange-500' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showInductive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${showInductive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Show Inductive Effect (±I)</span>
                            </label>
                            
                            {/* MESOMERIC CLOUD TOGGLE */}
                            <label className="flex items-center gap-2 mt-3 cursor-pointer group" onClick={() => setShowMesomericCloud(!showMesomericCloud)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${showMesomericCloud ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showMesomericCloud ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${showMesomericCloud ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Show Resonance Cloud (±M)</span>
                            </label>

                            {/* MESOMERIC ARROWS TOGGLE */}
                            <label className="flex items-center gap-2 mt-3 cursor-pointer group" onClick={() => setShowMesomericArrows(!showMesomericArrows)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${showMesomericArrows ? 'bg-pink-500' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showMesomericArrows ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${showMesomericArrows ? 'text-pink-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Electron Pushing Arrows (±M)</span>
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
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                            <h2 className="text-sm font-bold text-cyan-500 mb-3">Atom Properties</h2>

                            <label className="block text-xs text-gray-400 mb-1">Element</label>
                            <select value={element} onChange={(e) => setElement(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500 mb-3">
                                {elementList.map(el => (
                                    <option key={el.symbol} value={el.symbol}>
                                        {el.number}. {el.name} ({el.symbol})
                                    </option>
                                ))}
                            </select>

                            <label className="block text-xs text-gray-400 mb-1">Charge</label>
                            <select value={charge} onChange={(e) => setCharge(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                                <option value="0">Neutral (0)</option>
                                <option value="1">Cation (+1)</option>
                                <option value="2">Cation (+2)</option>
                                <option value="3">Cation (+3)</option>
                                <option value="-1">Anion (-1)</option>
                                <option value="-2">Anion (-2)</option>
                                <option value="-3">Anion (-3)</option>
                            </select>
                        </div>
                    )}

                    {mode === 'bond' && (
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                            <h2 className="text-sm font-bold text-green-500 mb-2">Bond Order</h2>
                            <p className="text-xs text-gray-400 mb-3">Select two atoms to connect.</p>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(order => (
                                    <button
                                        key={order}
                                        onClick={() => setBondOrder(order)}
                                        className={`flex-1 py-1 rounded text-sm font-bold transition-all ${bondOrder === order ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        {order}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                            {!selectedAtomId && !selectedBondId && (
                                <p className="text-xs text-gray-400">Click an atom or bond in the 3D view to select it and see edit controls.</p>
                            )}

                            {selectedAtomId && (() => {
                                const activeAtom = script.atoms.find(a => a.id === selectedAtomId);
                                const currentY = activeAtom ? activeAtom.startPos[1] : 0;
                                return (
                                    <>
                                        <h2 className="text-sm font-bold text-blue-500 mb-2">Edit Selected Atom</h2>

                                        {/* Edit Charge */}
                                        <div className="mb-4 bg-gray-900 border border-gray-800 p-2 rounded">
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Atom Charge</label>
                                            <select
                                                value={activeAtom.charge || 0}
                                                onChange={(e) => updateAtomCharge(selectedAtomId, e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                            >
                                                <option value="0">Neutral (0)</option>
                                                <option value="1">Cation (+1)</option>
                                                <option value="2">Cation (+2)</option>
                                                <option value="3">Cation (+3)</option>
                                                <option value="-1">Anion (-1)</option>
                                                <option value="-2">Anion (-2)</option>
                                                <option value="-3">Anion (-3)</option>
                                            </select>
                                        </div>

                                        {/* Specific Elevation Slider for selected atom */}
                                        <div className="mb-4 bg-blue-900/20 p-2 rounded border border-blue-900/50">
                                            <label className="block text-xs font-bold text-cyan-400 mb-1">Elevation (Y): {currentY.toFixed(1)}u</label>
                                            <input
                                                type="range"
                                                min="-10"
                                                max="10"
                                                step="0.1"
                                                value={currentY}
                                                onChange={(e) => {
                                                    const newY = parseFloat(e.target.value);
                                                    if (activeAtom) {
                                                        const [x, , z] = activeAtom.startPos;
                                                        updateAtomPosition(selectedAtomId, [x, newY, z]);
                                                    }
                                                }}
                                                className="w-full accent-cyan-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-1 mb-2">
                                            <div></div>
                                            <button onClick={() => moveSelectedAtom(0, 0, -1)} className="bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">Bkwd</button>
                                            <div></div>
                                            <button onClick={() => moveSelectedAtom(-1, 0, 0)} className="bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">Left</button>
                                            <div className="flex items-center justify-center text-xs text-gray-500">X/Z</div>
                                            <button onClick={() => moveSelectedAtom(1, 0, 0)} className="bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">Right</button>
                                            <div></div>
                                            <button onClick={() => moveSelectedAtom(0, 0, 1)} className="bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">Fwd</button>
                                            <div></div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => moveSelectedAtom(0, 1, 0)} className="flex-1 bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">UP (+Y)</button>
                                            <button onClick={() => moveSelectedAtom(0, -1, 0)} className="flex-1 bg-gray-800 hover:bg-blue-900 border border-gray-700 rounded p-1 text-xs text-white">DN (-Y)</button>
                                        </div>
                                    </>
                                );
                            })()}

                            {selectedBondId && (
                                <>
                                    <h2 className="text-sm font-bold text-green-500 mb-2">Edit Bond Order</h2>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(order => {
                                            const active = script.bonds.find(b => b.id === selectedBondId)?.order === order;
                                            return (
                                                <button
                                                    key={order}
                                                    onClick={() => updateBond(selectedBondId, order)}
                                                    className={`flex-1 py-1 rounded text-sm font-bold transition-all ${active ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                                >
                                                    {order}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {mode === 'group' && (
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-yellow-500 mb-1">Radical Groups</h2>

                            <div className="bg-gray-900 border border-gray-800 p-2 rounded">
                                <p className="text-xs text-gray-400 mb-2">
                                    Click atoms in the 3D view to select them for grouping.
                                </p>
                                <div className="text-xs font-mono text-cyan-300 mb-3 bg-black/50 p-2 rounded min-h-[30px] flex items-center flex-wrap gap-1">
                                    {selectedGroupAtoms.length === 0 ? "No atoms selected." : selectedGroupAtoms.map(id => (
                                        <span key={id} className="bg-cyan-900/50 px-1 py-0.5 rounded">{id}</span>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[10px] text-gray-500 mb-1">Group Charge</label>
                                        <select value={groupChargeValue} onChange={(e) => setGroupChargeValue(parseInt(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded p-1.5 text-xs text-white">
                                            <option value="-1">Anion (-1)</option>
                                            <option value="-2">Anion (-2)</option>
                                            <option value="-3">Anion (-3)</option>
                                            <option value="1">Cation (+1)</option>
                                            <option value="2">Cation (+2)</option>
                                            <option value="3">Cation (+3)</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            createGroup(selectedGroupAtoms, groupChargeValue);
                                            setSelectedGroupAtoms([]);
                                        }}
                                        disabled={selectedGroupAtoms.length < 2}
                                        className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors h-fit"
                                    >
                                        Group
                                    </button>
                                </div>
                            </div>

                            {(script.groups || []).length > 0 && (
                                <div className="bg-gray-900 border border-gray-800 p-2 rounded">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">Existing Groups</label>
                                    <div className="flex flex-col gap-2">
                                        {(script.groups || []).map(g => (
                                            <div key={g.id} className="bg-black/50 border border-gray-700 p-2 rounded flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-yellow-400">{g.id}</span>
                                                    <button onClick={() => removeGroup(g.id)} className="text-[10px] bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded">Dissolve</button>
                                                </div>
                                                <div className="text-[10px] font-mono text-gray-500 break-words">{g.atomIds.join(', ')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* BOTTOM ACTIONS */}
                <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
                    <button onClick={clearScript} className="w-full py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded transition-colors text-sm font-bold">
                        Clear Workspace
                    </button>
                </div>
            </div>

            {/* CENTER PANEL - 3D CANVAS */}
            <div className="flex-1 relative cursor-crosshair">

                {/* Mode Overlay */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border border-gray-800 uppercase shadow-lg">
                        Mode: {mode}
                    </span>
                    {selectedAtomId && (
                        <span className="ml-2 bg-cyan-900/80 text-cyan-200 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border border-cyan-800 uppercase shadow-lg">
                            Atom: {selectedAtomId}
                        </span>
                    )}
                    {selectedBondId && (
                        <span className="ml-2 bg-green-900/80 text-green-200 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border border-green-800 uppercase shadow-lg">
                            Bond: {selectedBondId}
                        </span>
                    )}
                </div>

                {/* Navigation Guide Overlay */}
                <div className="absolute bottom-4 left-4 z-10 pointer-events-none bg-black/80 rounded-lg p-3 border border-gray-800 shadow-xl backdrop-blur-sm">
                    <ul className="text-gray-400 text-xs font-mono font-bold space-y-1.5 leading-tight tracking-wide">
                        <li>Left Click: Orbit</li>
                        <li>Right Click: Pan</li>
                        <li>Scroll: Zoom</li>
                        <li>W/A/S/D: Move Camera</li>
                        <li>Q/E: Up/Down</li>
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
            <div className="w-96 bg-[#0d1117] border-l border-gray-800 flex flex-col z-10 shrink-0">
                <div className="p-3 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Live JSON</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(script, null, 2))}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                    >
                        Copy
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-green-400 whitespace-pre-wrap">
                    {JSON.stringify({ atoms: script.atoms, bonds: script.bonds, groups: script.groups || [] }, null, 2)}
                </div>
            </div>

        </div>
    );
}
