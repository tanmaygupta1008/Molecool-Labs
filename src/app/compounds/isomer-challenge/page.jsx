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
        <div className="w-full h-[calc(100vh-64px)] bg-black text-white flex overflow-hidden">
            {/* LEFT PANEL - TOOLSET (Identical to Engine/Atoms) */}
            <div className="w-80 bg-gray-900 border-r border-cyan-800 flex flex-col z-10 shadow-2xl shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-cyan-400">Isomer Challenge</h1>
                    <p className="text-xs text-gray-400 mt-1">Build structural isomers using tools.</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">

                    {/* TOOLS */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tools</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setMode('none')} className={`px-3 py-2 rounded font-semibold text-sm transition-all col-span-2 ${mode === 'none' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>None</button>
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
                        </div>
                    </div>

                    {/* CONTEXTUAL properties */}
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
                                <option value="-1">Anion (-1)</option>
                                <option value="-2">Anion (-2)</option>
                            </select>
                        </div>
                    )}

                    {mode === 'bond' && (
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                            <h2 className="text-sm font-bold text-green-500 mb-2">Bond Order</h2>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(order => (
                                    <button key={order} onClick={() => setBondOrder(order)} className={`flex-1 py-1 rounded text-sm font-bold transition-all ${bondOrder === order ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{order}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'select' && (
                        <div className="bg-black/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                            {!selectedAtomId && !selectedBondId && <p className="text-xs text-gray-400">Click to select.</p>}

                            {selectedAtomId && (() => {
                                const activeAtom = script.atoms.find(a => a.id === selectedAtomId);
                                const currentY = activeAtom ? activeAtom.startPos[1] : 0;
                                return (
                                    <>
                                        <h2 className="text-sm font-bold text-blue-500 mb-2">Edit Selected Atom</h2>
                                        <div className="mb-4 bg-gray-900 border border-gray-800 p-2 rounded">
                                            <label className="block text-xs text-gray-400 mb-1">Atom Charge</label>
                                            <select value={activeAtom.charge || 0} onChange={(e) => updateAtomCharge(selectedAtomId, e.target.value)} className="w-full bg-gray-800 rounded p-1.5 text-xs text-white">
                                                <option value="0">Neutral (0)</option>
                                                <option value="1">Cation (+1)</option>
                                                <option value="-1">Anion (-1)</option>
                                            </select>
                                        </div>

                                        <div className="mb-4 bg-blue-900/20 p-2 rounded">
                                            <label className="block text-xs text-cyan-400 mb-1">Elevation (Y): {currentY.toFixed(1)}u</label>
                                            <input type="range" min="-10" max="10" step="0.1" value={currentY} onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                if (activeAtom) updateAtomPosition(selectedAtomId, [activeAtom.startPos[0], newY, activeAtom.startPos[2]]);
                                            }} className="w-full accent-cyan-500" />
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
                                            return <button key={order} onClick={() => updateBond(selectedBondId, order)} className={`flex-1 py-1 rounded text-sm transition-all ${active ? 'bg-green-600' : 'bg-gray-800 text-gray-400'}`}>{order}</button>
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={clearScript} className="w-full py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded transition-colors text-sm font-bold mb-2">Clear Workspace</button>
                    <button onClick={nextChallenge} className="w-full py-2 bg-gray-800 border border-cyan-800 text-cyan-300 rounded hover:bg-gray-700 transition text-sm font-bold mb-2">Skip Challenge ⏭️</button>
                    <Link href="/compounds/isomer-challenge/manager" className="w-full flex justify-center py-2 bg-indigo-900/30 border border-indigo-900/50 text-indigo-400 rounded hover:bg-indigo-900/60 transition text-xs font-bold">
                        ⚙️ Isomer Manager
                    </Link>
                </div>
            </div>

            {/* CENTER PANEL - 3D CANVAS */}
            <div className="flex-1 relative cursor-crosshair">
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border border-gray-800 uppercase shadow-lg">Mode: {mode}</span>
                    {selectedAtomId && <span className="ml-2 bg-cyan-900/80 text-cyan-200 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase shadow-lg">Atom: {selectedAtomId}</span>}
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
            <div className="w-80 bg-[#0d1117] border-l border-gray-800 flex flex-col z-10 shrink-0 p-6">
                <h2 className="text-xl font-bold mb-4 text-white text-center">Challenge Status</h2>
                
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg flex flex-col items-center justify-center space-y-2 mb-6">
                    <span className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                        Target {isFetching && <span className="animate-spin w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full ml-1"></span>}
                    </span>
                    <span className={`font-mono text-3xl font-bold text-cyan-400`}><FormulaText text={currentChallenge?.target || 'C'} /></span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-4 mb-2 border border-gray-700 overflow-hidden">
                    <div className="bg-cyan-500 h-4 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${(foundIsomers.length / currentChallenge.expected) * 100}%` }}></div>
                </div>
                <p className="text-gray-300 font-medium mb-6 text-center text-sm">
                    Found <span className="text-cyan-400 text-xl font-bold">{foundIsomers.length}</span> of {currentChallenge.expected} isomers
                </p>

                <div className="p-3 bg-black border border-gray-800 rounded-lg flex flex-col items-center justify-center mb-6">
                    <span className="text-gray-500 text-[10px] uppercase mb-1">Your Formula</span>
                    <span className={`font-mono text-xl ${formula === currentChallenge?.target ? 'text-green-500' : 'text-gray-400'}`}>
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
                    className={`w-full py-4 text-xl font-extrabold rounded-xl transition-all shadow-lg ${
                        formula === currentChallenge.target 
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105 active:scale-95 shadow-cyan-900/80 cursor-pointer' 
                        : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                    }`}
                >
                    SUBMIT
                </button>
            </div>
        </div>
    );
}
