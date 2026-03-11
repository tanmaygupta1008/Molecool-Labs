'use client';
// src/app/engine/actions/page.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Clock, Play, Pause, RotateCw, Eye, EyeOff } from 'lucide-react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { useReactionEditor } from '@/context/ReactionEditorContext';
import AnimatedDashedLine from '@/components/reactions/engine/AnimatedDashedLine';
import AtomNode from '@/components/reactions/engine/AtomNode';
import BondLine from '@/components/reactions/engine/BondLine';
import { getElementData } from '@/utils/elementColors';
import VSEPRPhysicsEngine from '@/components/reactions/engine/VSEPRPhysicsEngine';
import ActionTrackEditor from '@/components/reactions/engine/ActionTrackEditor';
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

export default function Phase2ActionEditorPage() {
    const {
        selectedReactionId,
        setSelectedReactionId,
        script,
        loadScript,
        clearScript,
        updateTracks,
        addEventToTrack,
        removeEventFromTrack,
        updateTrackPositions
    } = useReactionEditor();

    // UI State
    const [progress, setProgress] = useState(0.0); // 0.0 to 1.0 based on playback
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isLooping, setIsLooping] = useState(false);
    const [showJson, setShowJson] = useState(false);

    const [selectedTrackId, setSelectedTrackId] = useState(null);
    const selectedTrack = script.tracks?.find(t => t.id === selectedTrackId);

    // Dynamic state populated by VSEPR physics operating on the current bonds
    const [livePositions, setLivePositions] = useState({});

    // Calculate maximum duration of all tracks
    const totalDuration = useMemo(() => {
        let max = 2; // Default 2s minimum
        (script.tracks || []).forEach(t => {
            const end = (parseFloat(t.startTime) || 0) + (parseFloat(t.duration) || 0);
            if (end > max) max = end;
        });
        return Math.max(max, 2); // Ensure at least 2s to avoid division by zero
    }, [script.tracks]);

    // Current Time in seconds
    const currentTime = progress * totalDuration;

    // Interaction Modes for adding Events to an active Step
    const [eventMode, setEventMode] = useState('none'); // 'none', 'break_bond', 'form_bond', 'update_charge'
    const [pendingFormAtoms, setPendingFormAtoms] = useState([]); // Array of 1 or 2 atom IDs
    const [pointerPos3D, setPointerPos3D] = useState(null);

    // Clear pointer tracking when not creating a bond
    useEffect(() => {
        if (eventMode !== 'form_bond' || pendingFormAtoms.length === 0) {
            setPointerPos3D(null);
        }
    }, [eventMode, pendingFormAtoms]);

    // Data State
    const [reactions, setReactions] = useState([]);

    // Fetch Reactions on mount
    useEffect(() => {
        fetch('/api/reactions')
            .then(res => res.json())
            .then(data => {
                setReactions(data);
                if (data.length > 0 && selectedReactionId === 'new_reaction') {
                    handleSelectReaction(data[0].id, data);
                } else if (selectedReactionId !== 'new_reaction') {
                    handleSelectReaction(selectedReactionId, data);
                }
            })
            .catch(err => console.error("Failed to fetch reactions", err));
    }, []);

    // Playback loop
    useEffect(() => {
        let animationFrame;
        let lastTime = performance.now();

        const loop = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            if (isPlaying) {
                setProgress(prev => {
                    const increment = (dt * playbackSpeed) / totalDuration;
                    const next = prev + increment;
                    if (next >= 1) {
                        if (isLooping) return 0;
                        setIsPlaying(false);
                        return 1;
                    }
                    return next;
                });
            }
            animationFrame = requestAnimationFrame(loop);
        };
        animationFrame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, playbackSpeed, isLooping, totalDuration]);

    // Compute derived state at currentTime (Apply events dynamically)
    // Here we DO NOT use pre-calculated positions. We run VSEPR dynamically if bonds change.
    const derivedScript = useMemo(() => {
        let currentAtoms = script.atoms.map(a => ({ ...a, currentPos: livePositions[a.id] || a.startPos }));
        let currentBonds = [...script.bonds];

        // Fold logical states up to currentTime
        (script.tracks || []).forEach(track => {
            const trackStart = parseFloat(track.startTime) || 0;
            const trackEnd = trackStart + (parseFloat(track.duration) || 0);

            // If time hasn't reached this track's start, skip
            if (currentTime < trackStart) return;

            // Track active/progress state
            const tTrack = Math.min(1, Math.max(0, (currentTime - trackStart) / (trackEnd - trackStart)));

            (track.events || []).forEach(ev => {
                // If event has no specific delay, map it to the track's full duration
                // Example: bond breaking happens steadily over the track's duration.
                // However, logic states (like charge) snap immediately when track starts, or we can lerp them.
                if (ev.type === 'BREAK_BOND') {
                    if (tTrack >= 1) {
                        currentBonds = currentBonds.filter(b => b.id !== ev.bondId);
                    } else {
                        currentBonds = currentBonds.map(b => b.id === ev.bondId ? { ...b, state: 'breaking', progress: tTrack } : b);
                    }
                } else if (ev.type === 'FORM_BOND') {
                    if (tTrack >= 1) {
                        // Already formed
                        // Ensure it exists
                        if (!currentBonds.some(b => b.id === `B_${ev.from}_${ev.to}`)) {
                            currentBonds.push({ id: `B_${ev.from}_${ev.to}`, from: ev.from, to: ev.to, order: ev.order, state: 'normal' });
                        }
                    } else {
                        // Forming
                        if (!currentBonds.some(b => b.id === `B_${ev.from}_${ev.to}`)) {
                            currentBonds.push({ id: `B_${ev.from}_${ev.to}`, from: ev.from, to: ev.to, order: ev.order, state: 'forming', progress: tTrack });
                        }
                    }
                } else if (ev.type === 'UPDATE_CHARGE') {
                    // Snap charge instantly when track starts for simplicity
                    if (tTrack > 0) {
                        currentAtoms = currentAtoms.map(a => a.id === ev.atomId ? { ...a, charge: ev.newCharge } : a);
                    }
                } else if (ev.type === 'UPDATE_BOND_ORDER') {
                    if (tTrack > 0) {
                        currentBonds = currentBonds.map(b => b.id === ev.bondId ? { ...b, order: ev.newOrder } : b);
                    }
                }
            });
        });

        return { atoms: currentAtoms, bonds: currentBonds };
    }, [script, currentTime]);

    const handleUpdateTrack = (updates) => {
        updateTracks((script.tracks || []).map(t => t.id === selectedTrackId ? { ...t, ...updates } : t));
    };

    const handleSelectReaction = (id, reactionData = reactions) => {
        setSelectedReactionId(id);
        const rxn = reactionData.find(r => r.id === id);
        if (rxn && rxn.microView && rxn.microView.script) {
            loadScript(rxn.microView.script);
        } else {
            clearScript(true);
        }
    };

    const handleSave = async () => {
        if (!selectedReactionId || selectedReactionId === 'new_reaction') return;
        try {
            const updatedReactions = reactions.map(rxn => {
                if (rxn.id === selectedReactionId) {
                    return {
                        ...rxn,
                        microView: {
                            ...rxn.microView,
                            script: script
                        }
                    };
                }
                return rxn;
            });

            const res = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReactions)
            });

            if (res.ok) {
                setReactions(updatedReactions);
                alert("Saved to reactions.json successfully!");
            } else {
                alert("Failed to save.");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Save error.");
        }
    };

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-black text-white flex overflow-hidden">
            {/* LEFT PANEL - STEPS UI */}
            <div className="w-80 bg-gray-900 border-r border-cyan-800 flex flex-col z-10 shadow-2xl shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-cyan-400">Action Timeline</h1>
                    <p className="text-xs text-gray-400 mt-1">Sequence reaction events natively.</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
                    {/* REACTION SELECTOR */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Target Reaction</label>
                        <select
                            value={selectedReactionId}
                            onChange={(e) => handleSelectReaction(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="new_reaction" disabled>-- Select Reaction --</option>
                            {reactions.map(rxn => (
                                <option key={rxn.id} value={rxn.id}>{rxn.name || rxn.id}</option>
                            ))}
                        </select>
                        {(() => {
                            const activeRxn = reactions.find(r => r.id === selectedReactionId);
                            if (activeRxn && activeRxn.equation) {
                                return (
                                    <div className="mt-2 bg-black/40 p-2 rounded text-center text-[13px] font-mono font-bold text-green-400 border border-gray-800 shadow-inner">
                                        {activeRxn.equation}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {/* TRACKS LIST */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 mb-2">Track Editor</h2>

                        {selectedTrackId ? (
                            <div className="mt-2 border-t border-gray-800 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <input
                                        type="text"
                                        value={selectedTrack?.name || ''}
                                        onChange={(e) => handleUpdateTrack({ name: e.target.value })}
                                        className="text-sm font-bold text-blue-400 bg-transparent border-b border-transparent hover:border-gray-700 focus:border-blue-400 focus:outline-none placeholder-gray-600 px-1 py-0.5 w-[60%]"
                                        placeholder="Track Name"
                                    />
                                    <button
                                        onClick={() => updateTracks((script.tracks || []).filter(t => t.id !== selectedTrackId))}
                                        className="text-[10px] bg-red-900/30 px-2 py-1 rounded text-red-400 hover:text-white hover:bg-red-600 transition-colors"
                                    >Delete Track</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Start (s)</label>
                                        <input
                                            type="number"
                                            value={selectedTrack?.startTime !== undefined ? selectedTrack.startTime : 0}
                                            onChange={(e) => handleUpdateTrack({ startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
                                            step="0.5"
                                            min="0"
                                            className="w-full bg-black border border-gray-700 rounded p-1.5 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Duration (s)</label>
                                        <input
                                            type="number"
                                            value={selectedTrack?.duration !== undefined ? selectedTrack.duration : 1}
                                            onChange={(e) => handleUpdateTrack({ duration: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                                            step="0.5"
                                            min="0.1"
                                            className="w-full bg-black border border-gray-700 rounded p-1.5 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mb-4">
                                    {(selectedTrack?.events || []).map((ev, idx) => (
                                        <div key={idx} className="bg-gray-800 p-2 rounded text-xs border border-gray-700 flex justify-between items-center pr-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-300">{ev.type}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {ev.type === 'BREAK_BOND' && `Bond: ${ev.bondId}`}
                                                    {ev.type === 'FORM_BOND' && `${ev.from} ↔ ${ev.to} (Order ${ev.order})`}
                                                    {ev.type === 'UPDATE_CHARGE' && `${ev.atomId} → ${ev.newCharge}`}
                                                    {ev.type === 'UPDATE_BOND_ORDER' && `Bond: ${ev.bondId} → ${ev.newOrder}`}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 items-center">
                                                {ev.type === 'FORM_BOND' && (
                                                    <button
                                                        onClick={() => {
                                                            const newEvents = [...selectedTrack.events];
                                                            newEvents[idx] = { ...ev, hidePreview: !ev.hidePreview };
                                                            handleUpdateTrack({ events: newEvents });
                                                        }}
                                                        className="text-gray-500 hover:text-cyan-400 p-1 transition-colors"
                                                        title={ev.hidePreview ? "Show Dotted Line Preview" : "Hide Dotted Line Preview"}
                                                    >
                                                        {ev.hidePreview ? <EyeOff size={12} /> : <Eye size={12} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeEventFromTrack(selectedTrackId, idx)}
                                                    className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                                >✕</button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedTrack?.events || selectedTrack.events.length === 0) && (
                                        <div className="text-xs text-gray-500 italic p-2">No events attached to this track.</div>
                                    )}
                                </div>

                                <p className="text-[10px] text-cyan-400 mb-2 italic">Add events that will execute chronologically across this track's duration.</p>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => { setEventMode(eventMode === 'break_bond' ? 'none' : 'break_bond'); setPendingFormAtoms([]); }}
                                        className={`text-[10px] font-bold py-1.5 rounded transition-colors ${eventMode === 'break_bond' ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        {eventMode === 'break_bond' ? 'Cancel' : '+ Break Bond'}
                                    </button>
                                    <button
                                        onClick={() => { setEventMode(eventMode === 'form_bond' ? 'none' : 'form_bond'); setPendingFormAtoms([]); }}
                                        className={`text-[10px] font-bold py-1.5 rounded transition-colors ${eventMode === 'form_bond' ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        {eventMode === 'form_bond' ? 'Cancel' : '+ Form Bond'}
                                    </button>
                                    <button
                                        onClick={() => { setEventMode(eventMode === 'update_charge' ? 'none' : 'update_charge'); setPendingFormAtoms([]); }}
                                        className={`text-[10px] font-bold py-1.5 rounded transition-colors ${eventMode === 'update_charge' ? 'bg-yellow-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        {eventMode === 'update_charge' ? 'Cancel' : '+ Change Charge'}
                                    </button>
                                    <button
                                        onClick={() => { setEventMode(eventMode === 'update_bond_order' ? 'none' : 'update_bond_order'); setPendingFormAtoms([]); }}
                                        className={`text-[10px] font-bold py-1.5 rounded transition-colors ${eventMode === 'update_bond_order' ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                                    >
                                        {eventMode === 'update_bond_order' ? 'Cancel' : '+ Change Bond Order'}
                                    </button>
                                </div>

                                {eventMode !== 'none' && (
                                    <div className="mt-2 text-[10px] text-gray-400 italic text-center animate-pulse">
                                        {eventMode === 'break_bond' && "Click a bond in the 3D view to break it."}
                                        {eventMode === 'form_bond' && `Click two atoms to connect. (${pendingFormAtoms.length}/2 selected)`}
                                        {eventMode === 'update_charge' && "Click an atom to edit its charge."}
                                        {eventMode === 'update_bond_order' && "Click a bond to edit its order."}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border border-dashed border-gray-700 rounded p-4 text-center text-xs text-gray-500">
                                Select a track from the timeline at the bottom to configure its events.
                            </div>
                        )}
                    </div>

                </div>

                {/* BOTTOM ACTIONS */}
                <div className="p-4 border-t border-gray-800 flex flex-col gap-2">
                    <button
                        onClick={handleSave}
                        disabled={selectedReactionId === 'new_reaction'}
                        className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded transition-colors text-sm font-bold shadow-lg"
                    >
                        Save state to reactions.json
                    </button>
                    <button onClick={clearScript} className="w-full py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded transition-colors text-sm font-bold">
                        Clear Workspace
                    </button>
                </div>
            </div>

            {/* CENTER PANEL - 3D CANVAS */}
            <div className="flex-1 relative flex flex-col">
                {/* 3D Viewport */}
                <div className="flex-1 relative bg-gradient-to-b from-gray-900 to-black">
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                        <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border border-gray-800 shadow-lg">
                            TIME: {currentTime.toFixed(1)}s
                        </span>
                    </div>

                    {/* JSON Overlay Toggle */}
                    <button
                        onClick={() => setShowJson(!showJson)}
                        className="absolute top-4 right-4 z-10 bg-gray-900 border border-gray-700 text-xs px-3 py-1 text-white rounded opacity-70 hover:opacity-100 transition-opacity"
                    >
                        {showJson ? 'Hide JSON' : 'Show JSON'}
                    </button>

                    {showJson && (
                        <div className="absolute top-14 right-4 bottom-24 w-80 bg-black/90 border border-gray-700 rounded-xl z-10 overflow-auto p-4 shadow-2xl backdrop-blur-md">
                            <h3 className="text-cyan-400 font-bold text-xs mb-2">script.actions</h3>
                            <pre className="text-[10px] text-green-300 font-mono">
                                {JSON.stringify(script.actions, null, 2)}
                            </pre>
                        </div>
                    )}

                    <Canvas
                        camera={{ position: [0, 5, 10], fov: 45 }}
                        onContextMenu={(e) => e.preventDefault()}
                        onPointerMissed={() => setEventMode('none')}
                    >
                        <CameraController />
                        <OrbitControls makeDefault />

                        {/* Run continuous physics simulation linearly throughout the entire playback timeline */}
                        <VSEPRPhysicsEngine
                            active={true}
                            script={derivedScript}
                            updateAllAtomPositions={setLivePositions}
                        />

                        <Environment preset="city" />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 10]} intensity={1} />

                        <Grid infiniteGrid fadeDistance={40} sectionColor="#113344" cellColor="#0a192f" position={[0, 0, 0]} />

                        {derivedScript.atoms.map(atom => (
                            <AtomNode
                                key={`atom-${atom.id}`}
                                position={atom.currentPos}
                                element={atom.element}
                                charge={atom.charge || 0}
                                showGlow={pendingFormAtoms.includes(atom.id)}
                                onPointerOver={(e) => { 
                                    if (eventMode !== 'none') document.body.style.cursor = 'pointer';
                                    if (eventMode === 'form_bond' && pendingFormAtoms.length === 1 && pendingFormAtoms[0] !== atom.id) {
                                        setPointerPos3D(atom.currentPos);
                                    }
                                }}
                                onPointerMove={(e) => {
                                    if (eventMode === 'form_bond' && pendingFormAtoms.length === 1 && pendingFormAtoms[0] !== atom.id) {
                                        e.stopPropagation();
                                        setPointerPos3D(atom.currentPos);
                                    }
                                }}
                                onPointerOut={() => { document.body.style.cursor = 'crosshair' }}
                                onClick={(e) => {
                                    if (!selectedTrackId) return;
                                    e.stopPropagation();

                                    if (eventMode === 'update_charge') {
                                        const chargeStr = window.prompt(`Enter new charge for ${atom.id}:`, atom.charge || 0);
                                        if (chargeStr !== null && !isNaN(parseInt(chargeStr))) {
                                            addEventToTrack(selectedTrackId, { type: 'UPDATE_CHARGE', atomId: atom.id, newCharge: parseInt(chargeStr) });
                                            setEventMode('none');
                                        }
                                    } else if (eventMode === 'form_bond') {
                                        if (pendingFormAtoms.length === 0) {
                                            setPendingFormAtoms([atom.id]);
                                        } else if (pendingFormAtoms.length === 1 && pendingFormAtoms[0] !== atom.id) {
                                            const orderStr = window.prompt(`Enter bond order between ${pendingFormAtoms[0]} and ${atom.id} (1, 2, or 3):`, "1");
                                            if (orderStr && [1, 2, 3].includes(parseInt(orderStr))) {
                                                addEventToTrack(selectedTrackId, {
                                                    type: 'FORM_BOND',
                                                    from: pendingFormAtoms[0],
                                                    to: atom.id,
                                                    order: parseInt(orderStr)
                                                });
                                            }
                                            setPendingFormAtoms([]);
                                            setEventMode('none');
                                        }
                                    }
                                }}
                            />
                        ))}

                        {/* Temporary Dotted Bond Preview */}
                        {eventMode === 'form_bond' && pendingFormAtoms.length === 1 && pointerPos3D && (() => {
                            const startAtom = derivedScript.atoms.find(a => a.id === pendingFormAtoms[0]);
                            if (!startAtom) return null;
                            return (
                                <AnimatedDashedLine 
                                    points={[startAtom.currentPos, pointerPos3D]} 
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
                        {eventMode === 'form_bond' && pendingFormAtoms.length === 1 && (() => {
                            const startAtom = derivedScript.atoms.find(a => a.id === pendingFormAtoms[0]);
                            if (!startAtom) return null;
                            return (
                                <mesh 
                                    rotation={[-Math.PI / 2, 0, 0]} 
                                    position={[0, startAtom.currentPos[1], 0]}
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

                        {/* Static Event-Based Dotted Bonds when Paused */}
                        {!isPlaying && (script.tracks || []).map(track => {
                            const trackStart = parseFloat(track.startTime) || 0;
                            // Only show previews for events that happen IN THE FUTURE relative to currentTime
                            if (currentTime >= trackStart) return null;

                            return (track.events || []).map((ev, idx) => {
                                if (ev.type !== 'FORM_BOND' || ev.hidePreview) return null;

                                const startAtom = derivedScript.atoms.find(a => a.id === ev.from);
                                const endAtom = derivedScript.atoms.find(a => a.id === ev.to);
                                if (!startAtom || !endAtom) return null;

                                return (
                                    <AnimatedDashedLine 
                                        key={`ghost-bond-${track.id}-${idx}`}
                                        points={[startAtom.currentPos, endAtom.currentPos]} 
                                        color="#00ffff" 
                                        lineWidth={2}
                                        dashed={true}
                                        dashSize={0.4}
                                        dashScale={1}
                                        gapSize={0.2}
                                        opacity={0.4}
                                        transparent={true}
                                    />
                                );
                            });
                        })}

                        {derivedScript.bonds.map(bond => {
                            const a1 = derivedScript.atoms.find(a => a.id === bond.from);
                            const a2 = derivedScript.atoms.find(a => a.id === bond.to);
                            if (!a1 || !a2) return null;

                            const getChargeColor = (a) => (a.charge || 0) !== 0 ? getElementData(a.element).color : "#ffffff";

                            return (
                                <BondLine
                                    key={`bond-${bond.id}`}
                                    startPos={a1.currentPos}
                                    endPos={a2.currentPos}
                                    order={bond.order}
                                    colorStart={getChargeColor(a1)}
                                    colorEnd={getChargeColor(a2)}
                                    opacity={1.0}
                                    state={bond.state || 'normal'}
                                    progress={bond.progress !== undefined ? bond.progress : null}
                                    onClick={(e) => {
                                        if (!selectedTrackId) return;
                                        e.stopPropagation();

                                        if (eventMode === 'break_bond') {
                                            addEventToTrack(selectedTrackId, { type: 'BREAK_BOND', bondId: bond.id });
                                            setEventMode('none');
                                        } else if (eventMode === 'update_bond_order') {
                                            const orderStr = window.prompt(`Enter new bond order for ${bond.id} (1, 2, or 3):`, bond.order);
                                            if (orderStr && [1, 2, 3].includes(parseInt(orderStr))) {
                                                addEventToTrack(selectedTrackId, { type: 'UPDATE_BOND_ORDER', bondId: bond.id, newOrder: parseInt(orderStr) });
                                                setEventMode('none');
                                            }
                                        }
                                    }}
                                />
                            );
                        })}
                    </Canvas>
                </div>

                {/* BOTTOM PLAYBACK BAR - TIMELINE */}
                <div className="h-48 border-t border-gray-800 shrink-0">
                    <ActionTrackEditor
                        tracks={script.tracks || []}
                        onChange={(t) => updateTracks(t)}
                        selectedTrackId={selectedTrackId}
                        onSelectTrack={setSelectedTrackId}
                        progress={progress}
                        totalDuration={totalDuration}
                        isPlaying={isPlaying}
                        onPlayPause={() => setIsPlaying(!isPlaying)}
                        isLooping={isLooping}
                        setIsLooping={setIsLooping}
                        playbackSpeed={playbackSpeed}
                        setPlaybackSpeed={setPlaybackSpeed}
                        onSeek={setProgress}
                    />
                </div>
            </div>
        </div>
    );
}
