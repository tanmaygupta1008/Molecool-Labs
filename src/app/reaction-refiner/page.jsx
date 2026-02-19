'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Grid } from '@react-three/drei';
import MacroView from '@/components/reactions/views/MacroView';
import { Save, Play, Pause, RefreshCw, Code, LayoutTemplate } from 'lucide-react';
import InitialStateEditor from './components/InitialStateEditor';
import TimelineEditor from './components/TimelineEditor';
import StepDetailEditor from './components/StepDetailEditor';


const ReactionRefinerPage = () => {
    const [reactions, setReactions] = useState([]);
    const [selectedReactionId, setSelectedReactionId] = useState(null);
    const [currentReaction, setCurrentReaction] = useState(null);

    // Editor State
    const [viewMode, setViewMode] = useState('VISUAL'); // 'VISUAL' or 'JSON'
    const [jsonInput, setJsonInput] = useState('');
    const [selectedStepIndex, setSelectedStepIndex] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    // Playback State
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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
            // Format JSON for editor
            setJsonInput(JSON.stringify(reaction.macroView?.visualRules || {}, null, 4));
            setProgress(0);
            setIsPlaying(false);
        }
    }, [selectedReactionId, reactions]);

    // Handle Visual Changes
    const handleVisualChange = (category, newData) => {
        setCurrentReaction(prev => {
            const newRules = { ...(prev.macroView?.visualRules || {}) };

            if (category === 'initialState') {
                newRules.initialState = newData;
            } else if (category === 'timeline') {
                newRules.timeline = newData;
            }

            return {
                ...prev,
                macroView: {
                    ...prev.macroView,
                    visualRules: newRules
                }
            };
        });
        // Sync JSON view
        setJsonInput(JSON.stringify(currentReaction?.macroView?.visualRules || {}, null, 4));
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/save-reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reactionId: currentReaction.id,
                    visualRules: currentReaction.macroView?.visualRules
                })
            });

            const data = await response.json();
            if (data.success) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 2000);
            } else {
                console.error(data.error);
                setSaveStatus('error');
            }
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
        }
    };

    // Animation Loop
    useEffect(() => {
        let animationFrame;
        const loop = () => {
            if (isPlaying) {
                setProgress(prev => {
                    if (prev >= 1) {
                        setIsPlaying(false);
                        return 1;
                    }
                    return prev + 0.005; // Speed
                });
                animationFrame = requestAnimationFrame(loop);
            }
        };
        loop();
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying]);



    if (!currentReaction) return <div className="text-white p-10">Loading Refiner...</div>;

    return (
        <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden">

            {/* LEFT PANEL: Editor */}
            <div className="w-1/3 flex flex-col border-r border-white/10 bg-[#1a1a1a] min-h-0">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#222]">
                    <h2 className="font-bold text-cyan-400 flex items-center gap-2">
                        🎨 Reaction Refiner
                    </h2>
                    <div className="flex gap-2">
                        <select
                            className="bg-black/50 border border-white/20 rounded px-2 py-1 text-xs"
                            value={selectedReactionId || ''}
                            onChange={(e) => setSelectedReactionId(e.target.value)}
                        >
                            {reactions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setViewMode(viewMode === 'VISUAL' ? 'JSON' : 'VISUAL')}
                            className="p-1 bg-white/10 rounded hover:bg-white/20 text-xs"
                            title="Toggle Mode"
                        >
                            {viewMode === 'VISUAL' ? <Code size={14} /> : <LayoutTemplate size={14} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                    {viewMode === 'JSON' ? (
                        <textarea
                            className="w-full h-full bg-[#0d0d0d] text-green-400 font-mono text-xs p-4 resize-none focus:outline-none"
                            value={jsonInput}
                            onChange={(e) => {
                                setJsonInput(e.target.value);
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setCurrentReaction(prev => ({
                                        ...prev,
                                        macroView: { ...prev.macroView, visualRules: parsed }
                                    }));
                                } catch (e) { }
                            }}
                            spellCheck={false}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4 h-full">
                            {/* VISUAL EDITOR LAYOUT */}
                            <div className="flex-shrink-0 max-h-[40%] overflow-y-auto custom-scrollbar">
                                <InitialStateEditor
                                    initialState={currentReaction.macroView?.visualRules?.initialState}
                                    onChange={(data) => handleVisualChange('initialState', data)}
                                />
                            </div>

                            <div className="flex-1 flex gap-4 min-h-0">
                                <div className="w-1/3 h-full flex flex-col min-h-0">
                                    <TimelineEditor
                                        timeline={currentReaction.macroView?.visualRules?.timeline}
                                        selectedStepIndex={selectedStepIndex}
                                        onSelectStep={setSelectedStepIndex}
                                        onChange={(data) => handleVisualChange('timeline', data)}
                                    />
                                </div>
                                <div className="flex-1 h-full flex flex-col min-h-0">
                                    <StepDetailEditor
                                        step={currentReaction.macroView?.visualRules?.timeline?.[selectedStepIndex]}
                                        onChange={(updatedStep) => {
                                            const newTimeline = { ...currentReaction.macroView?.visualRules?.timeline };
                                            newTimeline[selectedStepIndex] = updatedStep;
                                            handleVisualChange('timeline', newTimeline);
                                        }}
                                        onPreview={() => {
                                            const totalSteps = Object.keys(currentReaction.macroView?.visualRules?.timeline || {}).length;
                                            if (totalSteps > 0 && selectedStepIndex !== null) {
                                                const stepWidth = 1 / totalSteps;
                                                const startProgress = parseInt(selectedStepIndex) * stepWidth;
                                                setProgress(startProgress);
                                                setIsPlaying(true);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-[#222] flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-bold transition-colors
                            ${saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-cyan-700 hover:bg-cyan-600'}
                            ${saveStatus === 'error' ? 'bg-red-600' : ''}
                        `}
                    >
                        <Save size={14} />
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Preview */}
            <div className="flex-1 relative bg-black">
                <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
                    <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
                    <OrbitControls makeDefault />
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1} />

                    <Grid infiniteGrid sectionColor="#333" cellColor="#222" fadeDistance={30} />

                    <group position={[0, -2, 0]}>
                        <MacroView
                            reaction={currentReaction}
                            progress={progress}
                        />
                    </group>
                </Canvas>

                {/* Playback Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center gap-4 px-6 shadow-xl">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center text-black transition-transform hover:scale-110 active:scale-95"
                    >
                        {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                    </button>

                    <div className="flex flex-col gap-1 w-64">
                        <div className="flex justify-between text-[10px] text-cyan-200 font-mono">
                            <span>PROGRESS</span>
                            <span>{Math.round(progress * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.001"
                            value={progress}
                            onChange={(e) => {
                                setProgress(parseFloat(e.target.value));
                                setIsPlaying(false);
                            }}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setProgress(0);
                            setIsPlaying(false);
                        }}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="absolute top-4 right-4 bg-black/50 text-white/50 text-[10px] px-2 py-1 rounded pointer-events-none">
                    PREVIEW MODE
                </div>
            </div>
        </div>
    );
};

export default ReactionRefinerPage;
