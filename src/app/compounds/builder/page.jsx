'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Plane, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import AnimatedDashedLine from '@/components/reactions/engine/AnimatedDashedLine';
import { useReactionEditor } from '@/context/ReactionEditorContext';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';
import RadicalGroupUI from '@/components/reactions/engine/RadicalGroupUI';
import VSEPRPhysicsEngine from '@/components/reactions/engine/VSEPRPhysicsEngine';
import { getAllElementsList, getElementData, calculatePartialCharges } from '@/utils/elementColors';

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
    const [showPartialCharges, setShowPartialCharges] = useState(false);
    const [element, setElement] = useState('C');
    const [charge, setCharge] = useState(0);
    const [bondOrder, setBondOrder] = useState(1);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    // Partial charge computation - recalculated whenever atoms/bonds change
    const partialChargeData = useMemo(() => {
        if (!showPartialCharges) return null;
        return calculatePartialCharges(script.atoms, script.bonds);
    }, [showPartialCharges, script.atoms, script.bonds]);

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

                            <label className="flex items-center gap-2 mt-3 cursor-pointer group" onClick={() => setShowPartialCharges(!showPartialCharges)}>
                                <div className={`w-10 h-5 rounded-full px-1 flex items-center transition-colors ${showPartialCharges ? 'bg-orange-500' : 'bg-gray-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showPartialCharges ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <span className={`text-sm font-bold transition-colors ${showPartialCharges ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Show Partial Charges (δ)</span>
                            </label>
                            {showPartialCharges && partialChargeData && (
                                <div className="mt-2 p-2 bg-black/40 rounded border border-orange-900/40 text-[10px] font-mono leading-relaxed">
                                    <span className="text-blue-400 font-bold">δ+</span>
                                    <span className="text-gray-400"> most e-poor: </span>
                                    <span className="text-white">{partialChargeData.mostPositive}</span>
                                    <br />
                                    <span className="text-red-400 font-bold">δ−</span>
                                    <span className="text-gray-400"> most e-rich: </span>
                                    <span className="text-white">{partialChargeData.mostNegative}</span>
                                </div>
                            )}
                            {showPartialCharges && !partialChargeData && script.bonds.length > 0 && (
                                <p className="text-[10px] text-orange-600 mt-1">Electronegativity difference too small — molecule is nonpolar.</p>
                            )}
                            {showPartialCharges && script.bonds.length === 0 && (
                                <p className="text-[10px] text-gray-600 mt-1">Add bonds between atoms to calculate partial charges.</p>
                            )}

                            <p className="text-[10px] text-gray-500 mt-2 leading-tight">Continuously applies repulsive forces to bonds, arranging atoms into minimum-energy 3D geometry.</p>
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
                    onContextMenu={(e) => e.preventDefault()} // Block browser right-click menu
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

                    {/* Partial charge highlight glows */}
                    {showPartialCharges && partialChargeData && (() => {
                        const { mostPositive, mostNegative } = partialChargeData;
                        return script.atoms.map(atom => {
                            if (atom.id !== mostPositive && atom.id !== mostNegative) return null;
                            const isPositive = atom.id === mostPositive;
                            const baseRadius = getElementData(atom.element).radius;
                            const glowRadius = baseRadius * 3.2;
                            const color = isPositive ? '#4488ff' : '#ff3333';
                            const label = isPositive ? 'δ+' : 'δ−';
                            return (
                                <group key={`pc-halo-${atom.id}`} position={atom.startPos}>
                                    {/* Outer soft glow sphere */}
                                    <mesh>
                                        <sphereGeometry args={[glowRadius, 32, 32]} />
                                        <meshBasicMaterial
                                            color={color}
                                            transparent
                                            opacity={0.12}
                                            depthWrite={false}
                                        />
                                    </mesh>
                                    {/* Inner ring */}
                                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                        <ringGeometry args={[baseRadius * 1.6, baseRadius * 2.2, 48]} />
                                        <meshBasicMaterial
                                            color={color}
                                            transparent
                                            opacity={0.55}
                                            depthWrite={false}
                                            side={THREE.DoubleSide}
                                        />
                                    </mesh>
                                </group>
                            );
                        });
                    })()}

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
                                // Instead of red/cyan, use the element's actual color
                                return getElementData(atom.element).color;
                            }
                            return "#ffffff"; // Neutral: White
                        };

                        const isSelected = selectedBondId === bond.id;
                        const colorStart = isSelected ? "#00ffff" : getChargeColor(a1);
                        const colorEnd = isSelected ? "#00ffff" : getChargeColor(a2);

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
