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
import { getAllElementsList, getElementData } from '@/utils/elementColors';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

// Fallback Challenges if Firestore is empty
const DEFAULT_CHALLENGES = [
    { target: 'C4H10', expected: 2 },   // n-butane, isobutane
    { target: 'C3H8O', expected: 3 },   // propan-1-ol, propan-2-ol, methyl ethyl ether
    { target: 'C5H12', expected: 3 },   // pentane, isopentane, neopentane
    { target: 'C2H6O', expected: 2 },   // ethanol, dimethyl ether
];

// --- SUBCOMPONENTS ---
const FormulaText = ({ text }) => {
    if (!text) return null;
    return (
        <>
            {text.split(/(\d+)/).map((p, i) => /^\d+$/.test(p) ? <sub className="text-[0.7em] bottom-[-0.2em]" key={i}>{p}</sub> : p)}
        </>
    );
};

const ClickablePlane = ({ onPlaceAtom }) => (
    <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onClick={(e) => { e.stopPropagation(); onPlaceAtom(e.point); }} />
);

const CameraController = () => {
    const { camera } = useThree();
    const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, up: false, down: false });

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: true })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: true })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: true })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: true })); break;
                case 'KeyQ': setMovement(m => ({ ...m, up: true })); break;
                case 'KeyE': setMovement(m => ({ ...m, down: true })); break;
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

        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    useFrame((state, delta) => {
        const speed = 10 * delta; 
        const moveVec = new THREE.Vector3();
        if (movement.forward || movement.backward) {
            const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
            if (movement.forward) moveVec.add(forward); if (movement.backward) moveVec.sub(forward);
        }
        if (movement.left || movement.right) {
            const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
            const right = new THREE.Vector3(); right.crossVectors(forward, camera.up).normalize();
            if (movement.right) moveVec.add(right); if (movement.left) moveVec.sub(right);
        }
        if (movement.up) moveVec.y += 1;
        if (movement.down) moveVec.y -= 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(speed);
            camera.position.add(moveVec);
            if (state.controls) { state.controls.target.add(moveVec); state.controls.update(); }
        }
    });

    return null;
};

// --- MAIN PAGE ---
export default function IsomerChallengePage() {
    const { script, addAtom, updateAtomPosition, updateAtomCharge, updateAllAtomPositions, removeAtom, addBond, removeBond, updateBond, createGroup, removeGroup, clearScript } = useReactionEditor();

    // UI State
    const [mode, setMode] = useState('none'); 
    const [autoLayout, setAutoLayout] = useState(false);
    const [element, setElement] = useState('C');
    const [charge, setCharge] = useState(0);
    const [bondOrder, setBondOrder] = useState(1);
    const [selectedGroupAtoms, setSelectedGroupAtoms] = useState([]);
    const [groupChargeValue, setGroupChargeValue] = useState(-1);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    // Interaction State
    const [selectedAtomId, setSelectedAtomId] = useState(null);
    const [selectedBondId, setSelectedBondId] = useState(null);
    const [pointerPos3D, setPointerPos3D] = useState(null);

    // Game Specific State
    const [challenges, setChallenges] = useState(DEFAULT_CHALLENGES);
    const [isFetching, setIsFetching] = useState(true);
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [foundIsomers, setFoundIsomers] = useState([]);
    const [feedback, setFeedback] = useState(null);

    const currentChallenge = challenges[challengeIdx] || challenges[0];

    useEffect(() => {
        const loadChallenges = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'isomerChallenges'));
                const data = [];
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                
                if (data.length > 0) {
                    data.sort((a, b) => a.target.localeCompare(b.target));
                    setChallenges(data);
                }
            } catch (err) {
                console.error("Failed to load custom challenges:", err);
            } finally {
                setIsFetching(false);
            }
        };
        loadChallenges();
    }, []);

    useEffect(() => {
        if (mode !== 'bond' || !selectedAtomId) setPointerPos3D(null);
    }, [mode, selectedAtomId]);

    const elementList = useMemo(() => getAllElementsList(), []);

    // Canvas Handlers
    const handlePlaneClick = (point) => {
        if (mode === 'add') {
            addAtom(element, parseInt(charge), [point.x, point.y, point.z]);
            setFeedback(null);
        }
    };

    const moveSelectedAtom = (dx, dy, dz) => {
        if (!selectedAtomId) return;
        const atom = script.atoms.find(a => a.id === selectedAtomId);
        if (atom) {
            const [x, y, z] = atom.startPos;
            updateAtomPosition(selectedAtomId, [x + dx, y + dy, z + dz]);
        }
    };

    const handleAtomClick = (e, id) => {
        e.stopPropagation(); 
        setFeedback(null);
        if (mode === 'delete') removeAtom(id);
        else if (mode === 'bond') {
            if (!selectedAtomId) setSelectedAtomId(id);
            else {
                if (selectedAtomId !== id) addBond(selectedAtomId, id, bondOrder);
                setSelectedAtomId(null); setPointerPos3D(null);
            }
        } else if (mode === 'group') {
            setSelectedGroupAtoms(prev => prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]);
        } else if (mode === 'select') {
            setSelectedAtomId(id); setSelectedBondId(null);
        }
    };

    useEffect(() => {
        if (mode !== 'group') setSelectedGroupAtoms([]);
        if (mode !== 'select') { setSelectedAtomId(null); setSelectedBondId(null); }
    }, [mode]);

    // GAME HEURISTICS
    const formula = useMemo(() => {
        const counts = {};
        script.atoms.forEach(n => { counts[n.element] = (counts[n.element] || 0) + 1; });
        let result = '';
        if (counts['C']) { result += `C${counts['C'] > 1 ? counts['C'] : ''}`; delete counts['C']; }
        if (counts['H']) { result += `H${counts['H'] > 1 ? counts['H'] : ''}`; delete counts['H']; }
        Object.keys(counts).sort().forEach(el => { result += `${el}${counts[el] > 1 ? counts[el] : ''}`; });
        return result || 'Empty';
    }, [script.atoms]);

    const getCanonicalString = () => {
        const adj = {};
        script.atoms.forEach(a => adj[a.id] = []);
        script.bonds.forEach(l => { adj[l.from].push(l.to); adj[l.to].push(l.from); });

        const atomSigs = script.atoms.map(a => {
            const neighbors = adj[a.id].map(nId => script.atoms.find(at => at.id === nId).element).sort().join(',');
            return `${a.element}-[${neighbors}]`;
        });
        return atomSigs.sort().join('::');
    };

    const handleSubmit = () => {
        if (formula !== currentChallenge.target) {
            setFeedback({ type: 'error', text: `Formula is ${formula}, need ${currentChallenge.target}!` });
            return;
        }

        const visited = new Set();
        const stack = script.atoms.length > 0 ? [script.atoms[0].id] : [];
        if (stack.length > 0) {
            visited.add(stack[0]);
            while (stack.length) {
                const curr = stack.pop();
                script.bonds.forEach(l => {
                    let next = null;
                    if (l.from === curr) next = l.to;
                    if (l.to === curr) next = l.from;
                    if (next && !visited.has(next)) { visited.add(next); stack.push(next); }
                });
            }
        }
        if (visited.size !== script.atoms.length) {
            setFeedback({ type: 'error', text: `Molecule must be fully connected!` });
            return;
        }

        const canonical = getCanonicalString();
        
        if (foundIsomers.includes(canonical)) {
            setFeedback({ type: 'warning', text: "Already found this isomer!" });
        } else {
            setFoundIsomers([...foundIsomers, canonical]);
            setFeedback({ type: 'success', text: "🎉 New isomer found!" });
            if (foundIsomers.length + 1 === currentChallenge.expected) {
                setFeedback({ type: 'win', text: "🏆 Challenge Complete!" });
            }
        }
    };

    const nextChallenge = () => {
        setChallengeIdx((prev) => (prev + 1) % challenges.length);
        setFoundIsomers([]); clearScript(); setFeedback(null);
    };

    return (
        <div className="theme-internal">
            <div className="w-full h-[calc(100vh-64px)] bg-transparent text-white flex overflow-hidden relative">
                {/* Animated Background */}
                <div className="bg-mesh-container">
                    <div className="bg-mesh-blob blob-1" />
                    <div className="bg-mesh-blob blob-2" />
                    <div className="bg-mesh-blob blob-3" />
                </div>
                {/* LEFT PANEL - TOOLSET */}
                <div className="w-80 glass-card !bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col z-10 shadow-2xl shrink-0 rounded-none">
                    <div className="p-8 border-b border-white/5">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                            Isomer <br />
                            <span className="text-white/40 font-light">Challenge</span>
                        </h1>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60 mt-2 leading-relaxed">Master molecular connectivity.</p>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Logic Hub: Active</p>
                        </div>
                    </div>

                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">

                        {/* TOOLS */}
                        <div>
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                Tool Palette
                            </h2>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMode('none')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 col-span-2 relative overflow-hidden tap-animation border ${mode === 'none' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                    {mode === 'none' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                    None
                                </button>
                                <button onClick={() => setMode('add')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'add' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                    {mode === 'add' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                    Add
                                </button>
                                <button onClick={() => setMode('select')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'select' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                    {mode === 'select' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                    Select
                                </button>
                                <button onClick={() => setMode('bond')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'bond' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                    {mode === 'bond' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                    Bond
                                </button>
                                <button onClick={() => setMode('group')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 relative overflow-hidden tap-animation border ${mode === 'group' ? 'bg-white text-black border-white shadow-2xl scale-105' : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'}`}>
                                    {mode === 'group' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                                    Group
                                </button>
                                <button onClick={() => setMode('delete')} className={`px-4 py-3 rounded-none font-black text-[12px] uppercase tracking-widest transition-all duration-500 col-span-2 relative overflow-hidden tap-animation border ${mode === 'delete' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] scale-105' : 'glass-pill border-white/10 text-red-500/70 hover:border-red-400/20 hover:text-red-400'}`}>
                                    {mode === 'delete' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                                    Delete
                                </button>
                            </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <label className="flex items-center justify-between cursor-pointer group" onClick={() => setAutoLayout(!autoLayout)}>
                                <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${autoLayout ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>VSEPR Auto-Layout</span>
                                <div className={`w-12 h-6 rounded-full px-1.5 flex items-center transition-all duration-500 border ${autoLayout ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${autoLayout ? 'bg-black translate-x-5' : 'bg-white/30 translate-x-0'}`} />
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* CONTEXTUAL properties */}
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
                                <option value="-1" className="bg-black">Anion (-1)</option>
                                <option value="-2" className="bg-black">Anion (-2)</option>
                            </select>
                        </div>
                    )}

                    {mode === 'bond' && (
                        <div className="bg-white/[0.03] p-6 rounded-none border border-white/10 animate-fade-in shadow-inner backdrop-blur-md">
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white/60" />
                                Bond Order
                            </h2>
                            <p className="text-[11px] font-black text-white/60 uppercase tracking-widest mb-4">Select two atoms to connect.</p>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(order => (
                                    <button 
                                        key={order} 
                                        onClick={() => setBondOrder(order)} 
                                        className={`flex-1 py-1.5 rounded-none text-[12px] font-black transition-all border tap-animation ${bondOrder === order ? 'bg-white text-black border-white shadow-xl' : 'glass-pill border-white/10 text-white/70 hover:border-white/20'}`}
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
                                const currentY = activeAtom ? activeAtom.startPos[1] : 0;
                                return (
                                    <div className="space-y-6">
                                        <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                            Edit Selected Atom
                                        </h2>

                                        <div className="glass-pill !bg-white/5 border-white/10 p-4 rounded-none">
                                            <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2">Atom Charge</label>
                                            <select value={activeAtom.charge || 0} onChange={(e) => updateAtomCharge(selectedAtomId, e.target.value)} className="w-full bg-transparent border-none rounded p-0 text-[11px] font-bold text-white focus:outline-none appearance-none cursor-pointer">
                                                <option value="0" className="bg-black">Neutral (0)</option>
                                                <option value="1" className="bg-black">Cation (+1)</option>
                                                <option value="-1" className="bg-black">Anion (-1)</option>
                                            </select>
                                        </div>

                                        <div className="glass-pill !bg-white/5 border-white/10 p-4 rounded-none">
                                            <label className="block text-[11px] font-black text-white/60 uppercase tracking-widest mb-2 leading-relaxed">Elevation (Y): {currentY.toFixed(1)}u</label>
                                            <input type="range" min="-10" max="10" step="0.1" value={currentY} onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                if (activeAtom) updateAtomPosition(selectedAtomId, [activeAtom.startPos[0], newY, activeAtom.startPos[2]]);
                                            }} className="w-full accent-white" />
                                        </div>
                                    </div>
                                );
                            })()}

                            {selectedBondId && (
                                <div className="space-y-4">
                                    <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] flex items-center gap-2">
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
                                                    className={`flex-1 py-1.5 rounded-none text-[12px] font-black transition-all border tap-animation ${active ? 'bg-white text-black border-white shadow-xl' : 'glass-pill border-white/10 text-white/70 hover:border-white/20'}`}
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
                </div>

                <div className="p-6 border-t border-white/5 flex flex-col gap-3 bg-black/20">
                    <button onClick={clearScript} className="w-full py-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-none transition-all text-[11px] font-black uppercase tracking-widest">Clear Workspace</button>
                    <button onClick={nextChallenge} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-none transition-all text-[11px] font-black uppercase tracking-widest">Skip Challenge</button>
                    <Link href="/compounds/isomer-challenge/manager" className="w-full py-2 border border-white/5 bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center justify-center hover:bg-white/10 transition-all rounded-none">
                        ⚙️ Isomer Manager
                    </Link>
                </div>
            </div>

            {/* CENTER PANEL - 3D CANVAS */}
            <div className="flex-1 relative cursor-crosshair">
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
                    </div>
                </div>

                <Canvas camera={{ position: [0, 5, 10], fov: 45 }} onContextMenu={(e) => e.preventDefault()} onPointerMissed={() => {
                        if (mode === 'bond' || mode === 'select') { setSelectedAtomId(null); setSelectedBondId(null); }
                        if (mode === 'group') setSelectedGroupAtoms([]);
                    }}>
                    <CameraController />
                    <VSEPRPhysicsEngine active={autoLayout} script={script} updateAllAtomPositions={updateAllAtomPositions} />
                    <Suspense fallback={null}>
                        <Environment preset="city" />
                    </Suspense>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    <Grid infiniteGrid fadeDistance={40} sectionColor="#113344" cellColor="#0a192f" position={[0, 0, 0]} />

                    {mode === 'add' && <ClickablePlane onPlaceAtom={handlePlaneClick} />}

                    {script.atoms.map(atom => {
                        const isSelected = selectedAtomId === atom.id && (mode === 'select' || mode === 'bond');
                        const isGroupSelected = mode === 'group' && selectedGroupAtoms.includes(atom.id);

                        const AtomContent = (
                            <group onClick={(e) => handleAtomClick(e, atom.id)} onPointerOver={(e) => { 
                                    if (mode !== 'none') document.body.style.cursor = 'pointer';
                                    if (mode === 'bond' && selectedAtomId && selectedAtomId !== atom.id) setPointerPos3D(atom.startPos);
                                }}
                                onPointerMove={(e) => { if (mode === 'bond' && selectedAtomId && selectedAtomId !== atom.id) { e.stopPropagation(); setPointerPos3D(atom.startPos); }}}
                                onPointerOut={() => { document.body.style.cursor = 'crosshair' }}>
                                {isSelected && <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.5, 1.8, 32]} /><meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.5} /></mesh>}
                                {isGroupSelected && <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.4, 1.7, 32]} /><meshBasicMaterial color="#eab308" side={THREE.DoubleSide} transparent opacity={0.8} /></mesh>}
                                <AtomNode element={atom.element} charge={atom.charge || 0} />
                            </group>
                        );

                        return (
                            <React.Fragment key={`atom-${atom.id}`}>
                                {isSelected ? (
                                    <TransformControls mode="translate" size={0.6} position={atom.startPos} onMouseDown={() => setOrbitEnabled(false)} onMouseUp={(e) => {
                                            setOrbitEnabled(true);
                                            const { x, y, z } = e.target.object.position;
                                            updateAtomPosition(atom.id, [x, y, z]);
                                        }}>
                                        {AtomContent}
                                    </TransformControls>
                                ) : <group position={atom.startPos}>{AtomContent}</group>}
                            </React.Fragment>
                        );
                    })}

                    {script.bonds.map(bond => {
                        const a1 = script.atoms.find(a => a.id === bond.from);
                        const a2 = script.atoms.find(a => a.id === bond.to);
                        if (!a1 || !a2) return null;

                        const getChargeColor = (atom) => atom.charge ? getElementData(atom.element).color : "#ffffff";
                        const isSelected = selectedBondId === bond.id;

                        return (
                            <group key={`bond-${bond.id}`} onClick={(e) => {
                                    e.stopPropagation();
                                    if (mode === 'delete') removeBond(bond.id);
                                    else if (mode === 'select') { setSelectedBondId(bond.id); setSelectedAtomId(null); }
                                }}
                                onPointerOver={() => { if (mode === 'delete' || mode === 'select') document.body.style.cursor = 'pointer' }}
                                onPointerOut={() => { document.body.style.cursor = 'crosshair' }}>
                                <BondLine startPos={a1.startPos} endPos={a2.startPos} order={bond.order} colorStart={isSelected ? "#00ffff" : getChargeColor(a1)} colorEnd={isSelected ? "#00ffff" : getChargeColor(a2)} state="normal" />
                            </group>
                        );
                    })}

                    {mode === 'bond' && selectedAtomId && pointerPos3D && (() => {
                        const startAtom = script.atoms.find(a => a.id === selectedAtomId);
                        if (!startAtom) return null;
                        return <AnimatedDashedLine points={[startAtom.startPos, pointerPos3D]} color="#00ffff" lineWidth={2} dashed={true} dashSize={0.4} />
                    })()}

                    {mode === 'bond' && selectedAtomId && (() => {
                        const startAtom = script.atoms.find(a => a.id === selectedAtomId);
                        if (!startAtom) return null;
                        return (
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, startAtom.startPos[1], 0]} onPointerMove={(e) => { e.stopPropagation(); setPointerPos3D([e.point.x, e.point.y, e.point.z]); }}>
                                <planeGeometry args={[100, 100]} />
                                <meshBasicMaterial transparent opacity={0} depthWrite={false} color="white" />
                            </mesh>
                        );
                    })()}

                    {(script.groups || []).map(group => ( <RadicalGroupUI key={`groupUI-${group.id}`} group={group} atoms={script.atoms} /> ))}

                    <OrbitControls makeDefault enablePan={true} enabled={orbitEnabled} maxPolarAngle={Math.PI / 2.1} mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />
                </Canvas>
            </div>

            {/* RIGHT PANEL - GAME PROGRESS */}
            <div className="w-80 glass-card !bg-black/40 backdrop-blur-3xl border-l border-white/10 flex flex-col z-10 shadow-2xl shrink-0 p-8 space-y-8 rounded-none">
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.3em] text-center border-b border-white/10 pb-4">Challenge Status</h2>
                
                <div className="p-8 bg-white/[0.03] border border-white/10 rounded-none flex flex-col items-center justify-center space-y-3 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-50" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
                        {isFetching && <span className="animate-spin w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full"></span>}
                        Target Formula
                    </span>
                    <span className="font-mono text-4xl font-extrabold text-white tracking-widest relative z-10 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <FormulaText text={currentChallenge?.target || 'C'} />
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/10 overflow-hidden">
                        <div className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${(foundIsomers.length / currentChallenge.expected) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] font-black text-white/70 uppercase tracking-widest text-center leading-relaxed">
                        Found <span className="text-white text-lg font-black mx-1">{foundIsomers.length}</span> of {currentChallenge.expected} isomers
                    </p>
                </div>

                <div className="p-6 bg-black/40 border border-white/5 rounded-none flex flex-col items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Your Construction</span>
                    <span className={`font-mono text-2xl font-black tracking-widest ${formula === currentChallenge?.target ? 'text-white' : 'text-white/40'}`}>
                        <FormulaText text={formula} />
                    </span>
                </div>

                <div className="flex-1">
                    {feedback && (
                        <div className={`p-4 rounded-xl border text-sm font-bold text-center animate-in slide-in-from-bottom-2 ${
                            feedback.type === 'error' ? 'bg-red-900/40 border-red-500 text-red-300' :
                            feedback.type === 'warning' ? 'bg-yellow-900/40 border-yellow-500 text-yellow-300' :
                            feedback.type === 'success' ? 'bg-green-900/40 border-green-500 text-green-300' :
                            'bg-purple-900/40 border-purple-500 text-purple-300 scale-105 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        }`}>
                            {feedback.text}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={formula !== currentChallenge.target}
                    className={`w-full py-5 text-[14px] font-black rounded-none tracking-[0.3em] transition-all duration-500 shadow-2xl relative overflow-hidden uppercase ${
                        formula === currentChallenge.target 
                        ? 'bg-white text-black border-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                        : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed opacity-50'
                    }`}
                >
                    {formula === currentChallenge.target && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />}
                    Submit Isomer
                </button>
            </div>
        </div>
    </div>
    );
}
