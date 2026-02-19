'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FlaskConical, TestTube, Thermometer, Gauge, Eye, Layers } from 'lucide-react';
import { CHEMICALS } from '@/data/chemicals';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import * as Apparatus from '@/components/apparatus';

const ApparatusPreview = ({ apparatus }) => {
    const Component = Apparatus[apparatus.model] || Apparatus.Beaker; // Fallback

    // Exclude 'id' from props passed to the Three.js component because Object3D.id is read-only
    const { id, ...apparatusProps } = apparatus;

    return (
        <div className="h-64 w-full bg-[#161616] rounded-xl border border-gray-800 mb-6 relative overflow-hidden">
            <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Eye size={12} /> Live Preview
            </div>
            <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Environment preset="city" />
                <Center>
                    <Component {...apparatusProps} reactants={apparatus.reactants || []} />
                </Center>
                <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
            </Canvas>
        </div>
    );
};

const FullSetupPreview = ({ reaction }) => {
    return (
        <div className="h-64 w-full bg-[#161616] rounded-xl border border-gray-800 mb-6 relative overflow-hidden">
            <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <Layers size={12} /> Full Setup
            </div>
            <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Environment preset="city" />
                <Center>
                    <group>
                        {reaction.apparatus.map(app => {
                            const Component = Apparatus[app.model] || Apparatus.Beaker;
                            // Destructure transforms to avoid double application
                            const { id, position, rotation, scale, ...props } = app;
                            return (
                                <group
                                    key={app.id}
                                    position={position || [0, 0, 0]}
                                    rotation={rotation || [0, 0, 0]}
                                    scale={scale || [1, 1, 1]}
                                >
                                    <Component {...props} reactants={app.reactants || []} />
                                </group>
                            );
                        })}
                    </group>
                </Center>
                <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
            </Canvas>
        </div>
    );
};

const ReactantConfigPage = () => {
    const [reactions, setReactions] = useState([]);
    const [selectedReactionId, setSelectedReactionId] = useState(null);
    const [currentReaction, setCurrentReaction] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    const [selectedApparatusId, setSelectedApparatusId] = useState(null);
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'full'

    // Fetch Reactions on Mount
    useEffect(() => {
        fetch('/api/reactions', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setReactions(data);
                if (data.length > 0) {
                    setSelectedReactionId(data[0].id);
                }
            })
            .catch(err => console.error("Failed to load reactions", err));
    }, []);

    // Load Selected Reaction
    useEffect(() => {
        if (!selectedReactionId || reactions.length === 0) return;
        const reaction = reactions.find(r => r.id === selectedReactionId);
        if (reaction) {
            setCurrentReaction(reaction);
        }
    }, [selectedReactionId, reactions]);

    const sanitizeReaction = (reaction) => {
        const r = JSON.parse(JSON.stringify(reaction));
        if (r.apparatus) {
            r.apparatus.forEach(app => {
                if (app.reactants) {
                    app.reactants.forEach(rect => {
                        rect.amount = parseFloat(rect.amount) || 0;
                        rect.concentration = parseFloat(rect.concentration) || 0;
                        rect.temperature = parseFloat(rect.temperature) || 0;
                        rect.pressure = parseFloat(rect.pressure) || 0;
                    });
                }
            });
        }
        return r;
    };

    const handleSave = async () => {
        if (!currentReaction) return;
        setSaveStatus('saving');
        try {
            // Sanitize current reaction data before saving
            const sanitizedCurrentReaction = sanitizeReaction(currentReaction);
            const updatedReactions = reactions.map(r => r.id === sanitizedCurrentReaction.id ? sanitizedCurrentReaction : r);

            const response = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReactions)
            });

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
        }
    };

    const updateReactants = (apparatusId, newReactants) => {
        const updatedApparatusList = currentReaction.apparatus.map(app => {
            if (app.id === apparatusId) {
                return { ...app, reactants: newReactants };
            }
            return app;
        });

        const updatedReaction = { ...currentReaction, apparatus: updatedApparatusList };
        setCurrentReaction(updatedReaction);

        // Update main list
        setReactions(prev => prev.map(r => r.id === updatedReaction.id ? updatedReaction : r));
    };

    const addReactant = (apparatusId) => {
        const apparatus = currentReaction.apparatus.find(a => a.id === apparatusId);
        const currentReactants = apparatus.reactants || [];
        const newReactant = {
            id: Date.now().toString(),
            chemicalId: CHEMICALS[0].id,
            state: CHEMICALS[0].defaultState,
            amount: 0,
            unit: 'g',
            concentration: 0,
            temperature: 25, // Celsius
            pressure: 1 // atm
        };
        updateReactants(apparatusId, [...currentReactants, newReactant]);
    };

    const removeReactant = (apparatusId, reactantId) => {
        const apparatus = currentReaction.apparatus.find(a => a.id === apparatusId);
        const currentReactants = apparatus.reactants || [];
        updateReactants(apparatusId, currentReactants.filter(r => r.id !== reactantId));
    };

    const updateReactantField = (apparatusId, reactantId, field, value) => {
        const apparatus = currentReaction.apparatus.find(a => a.id === apparatusId);
        const currentReactants = apparatus.reactants || [];
        const updatedReactants = currentReactants.map(r => {
            if (r.id === reactantId) {
                const updates = { [field]: value };
                // Reset unit defaults if state changes
                if (field === 'state') {
                    if (value === 's') updates.unit = 'g';
                    if (value === 'l' || value === 'aq') updates.unit = 'mL';
                    if (value === 'g') updates.unit = 'mol';
                }
                // Update default state if chemical changes
                if (field === 'chemicalId') {
                    const chemical = CHEMICALS.find(c => c.id === value);
                    if (chemical) {
                        updates.state = chemical.defaultState;
                        if (chemical.defaultState === 's') updates.unit = 'g';
                        if (chemical.defaultState === 'l' || chemical.defaultState === 'aq') updates.unit = 'mL';
                        if (chemical.defaultState === 'g') updates.unit = 'mol';
                    }
                }
                return { ...r, ...updates };
            }
            return r;
        });
        updateReactants(apparatusId, updatedReactants);
    };

    if (!currentReaction) return <div className="p-10 text-white">Loading Configuration...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8 pt-24">
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                            Reactant Configuration
                        </h1>
                        <p className="text-gray-400 text-sm">Define chemical compositions and initial conditions for each apparatus.</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <select
                            className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            value={selectedReactionId || ''}
                            onChange={(e) => setSelectedReactionId(e.target.value)}
                        >
                            {reactions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            className={`
                                flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-cyan-500/20
                                ${saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}
                                ${saveStatus === 'error' ? 'bg-red-600' : ''}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            <Save size={18} />
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Config'}
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Apparatus List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                            <FlaskConical size={20} className="text-cyan-400" /> Apparatus Setup
                        </h2>
                        <div className="space-y-2">
                            {currentReaction.apparatus.map((app) => (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedApparatusId(app.id)}
                                    className={`
                                        p-4 rounded-xl cursor-pointer border transition-all duration-200 group
                                        ${selectedApparatusId === app.id
                                            ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                            : 'bg-[#161616] border-gray-800 hover:border-gray-600 hover:bg-[#1f1f1f]'}
                                    `}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-200 group-hover:text-white">{app.model}</span>
                                        <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded border border-white/5">
                                            {(app.reactants?.length || 0)} Reactants
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono">ID: {app.id}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Reactant Details */}
                    <div className="lg:col-span-2 bg-[#111] rounded-2xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        {selectedApparatusId ? (
                            (() => {
                                const selectedApp = currentReaction.apparatus.find(a => a.id === selectedApparatusId);
                                if (!selectedApp) return null;

                                return (
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                    {selectedApp.model} <span className="text-gray-500 font-normal text-sm">({selectedApp.id})</span>
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1">Configure chemicals inside this container.</p>
                                            </div>
                                            <button
                                                onClick={() => addReactant(selectedApp.id)}
                                                className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                            >
                                                <Plus size={16} /> Add Reactant
                                            </button>
                                        </div>

                                        <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-gray-800">
                                            <button
                                                onClick={() => setViewMode('single')}
                                                className={`
                                                        flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all
                                                        ${viewMode === 'single' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-300'}
                                                    `}
                                            >
                                                <Eye size={14} /> Single
                                            </button>
                                            <button
                                                onClick={() => setViewMode('full')}
                                                className={`
                                                        flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all
                                                        ${viewMode === 'full' ? 'bg-purple-900/50 text-purple-200 shadow border border-purple-500/30' : 'text-gray-400 hover:text-gray-300'}
                                                    `}
                                            >
                                                <Layers size={14} /> Full Setup
                                            </button>
                                        </div>


                                        {
                                            viewMode === 'single' ? (
                                                <ApparatusPreview apparatus={selectedApp} />
                                            ) : (
                                                <FullSetupPreview reaction={currentReaction} />
                                            )
                                        }

                                        <div className="space-y-4">
                                            {(!selectedApp.reactants || selectedApp.reactants.length === 0) && (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl bg-white/5">
                                                    <TestTube size={32} className="mx-auto text-gray-600 mb-3" />
                                                    <p className="text-gray-500">No reactants configured yet.</p>
                                                    <p className="text-gray-600 text-sm mt-1">Click "Add Reactant" to start.</p>
                                                </div>
                                            )}

                                            {selectedApp.reactants?.map((reactant) => (
                                                <div key={reactant.id} className="bg-[#1a1a1a] rounded-xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-colors shadow-sm">

                                                    {/* Row 1: Chemical & State */}
                                                    <div className="grid grid-cols-12 gap-4 mb-4">
                                                        <div className="col-span-12 md:col-span-5">
                                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chemical</label>
                                                            <select
                                                                className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                                                                value={reactant.chemicalId}
                                                                onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'chemicalId', e.target.value)}
                                                            >
                                                                {CHEMICALS.map(c => (
                                                                    <option key={c.id} value={c.id}>{c.name} ({c.formula})</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="col-span-6 md:col-span-3">
                                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">State</label>
                                                            <select
                                                                className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                                                                value={reactant.state}
                                                                onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'state', e.target.value)}
                                                            >
                                                                <option value="s">Solid (s)</option>
                                                                <option value="l">Liquid (l)</option>
                                                                <option value="g">Gas (g)</option>
                                                                <option value="aq">Aqueous (aq)</option>
                                                            </select>
                                                        </div>

                                                        <div className="col-span-6 md:col-span-4 flex items-end justify-end">
                                                            <button
                                                                onClick={() => removeReactant(selectedApp.id, reactant.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                                            >
                                                                <Trash2 size={16} /> Remove
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="h-px bg-white/5 my-4" />

                                                    {/* Row 2: Properties */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                                        {/* Quantity */}
                                                        <div className="col-span-2 md:col-span-1">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Quantity</label>
                                                            <div className="flex bg-black rounded-lg border border-gray-700 focus-within:border-cyan-500 transition-colors overflow-hidden">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-transparent p-2 text-sm focus:outline-none"
                                                                    value={reactant.amount}
                                                                    onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'amount', e.target.value)}
                                                                />
                                                                <span className="bg-white/5 text-gray-400 text-xs px-2 flex items-center border-l border-white/5">{reactant.unit}</span>
                                                            </div>
                                                        </div>

                                                        {/* Concentration (Only if Aqueous) */}
                                                        {reactant.state === 'aq' && (
                                                            <div className="col-span-1">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Concentration</label>
                                                                <div className="flex bg-black rounded-lg border border-gray-700 focus-within:border-cyan-500 transition-colors overflow-hidden">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent p-2 text-sm focus:outline-none"
                                                                        value={reactant.concentration}
                                                                        onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'concentration', e.target.value)}
                                                                    />
                                                                    <span className="bg-white/5 text-gray-400 text-xs px-2 flex items-center border-l border-white/5">M</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Temperature */}
                                                        <div className="col-span-1">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                                                <Thermometer size={10} /> Temp
                                                            </label>
                                                            <div className="flex bg-black rounded-lg border border-gray-700 focus-within:border-cyan-500 transition-colors overflow-hidden">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-transparent p-2 text-sm focus:outline-none"
                                                                    value={reactant.temperature}
                                                                    onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'temperature', e.target.value)}
                                                                />
                                                                <span className="bg-white/5 text-gray-400 text-xs px-2 flex items-center border-l border-white/5">°C</span>
                                                            </div>
                                                        </div>

                                                        {/* Pressure (Only if Gas) */}
                                                        {reactant.state === 'g' && (
                                                            <div className="col-span-1">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                                                    <Gauge size={10} /> Pressure
                                                                </label>
                                                                <div className="flex bg-black rounded-lg border border-gray-700 focus-within:border-cyan-500 transition-colors overflow-hidden">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent p-2 text-sm focus:outline-none"
                                                                        value={reactant.pressure}
                                                                        onChange={(e) => updateReactantField(selectedApp.id, reactant.id, 'pressure', e.target.value)}
                                                                    />
                                                                    <span className="bg-white/5 text-gray-400 text-xs px-2 flex items-center border-l border-white/5">atm</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <FlaskConical size={64} className="mb-4 text-cyan-900" />
                                <p className="text-xl font-medium">Select an Apparatus</p>
                                <p className="text-sm">Choose an apparatus from the left to configure reactants.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ReactantConfigPage;
