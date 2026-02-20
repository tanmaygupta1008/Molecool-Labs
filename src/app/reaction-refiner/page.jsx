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
    const [progress, setProgress] = useState(0); // 0 to 1
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 0.5x, etc.
    const [isLooping, setIsLooping] = useState(false);

    // Calculate Total Duration
    const totalDuration = useMemo(() => {
        if (!currentReaction?.macroView?.visualRules?.timeline) return 10; // Default 10s
        return Object.values(currentReaction.macroView.visualRules.timeline).reduce((acc, step) => {
            if (step.disabled) return acc;
            return acc + (parseFloat(step.duration) || 0) + (parseFloat(step.delay) || 0);
        }, 0) || 10; // Fallback to 10s if empty
    }, [currentReaction?.macroView?.visualRules?.timeline]);

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

    const handleVisualChange = (category, newData) => {
        setCurrentReaction(prev => {
            const newRules = { ...(prev.macroView?.visualRules || {}) };

            if (category === 'initialState') {
                newRules.initialState = newData;
            } else if (category === 'timeline') {
                newRules.timeline = newData;
            }

            const updatedReaction = {
                ...prev,
                macroView: {
                    ...prev.macroView,
                    visualRules: newRules
                }
            };

            // Sync JSON view using the updated state, not stale currentReaction
            setJsonInput(JSON.stringify(updatedReaction.macroView.visualRules, null, 4));

            return updatedReaction;
        });
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
        let lastTime = performance.now();

        const loop = (currentTime) => {
            const dt = (currentTime - lastTime) / 1000; // seconds
            lastTime = currentTime;

            if (isPlaying) {
                setProgress(prev => {
                    // Check if totalDuration is valid to avoid NaN
                    if (!totalDuration || totalDuration === 0) return 0;

                    const increment = (dt * playbackSpeed) / totalDuration;
                    const nextProgress = prev + increment;

                    if (nextProgress >= 1) {
                        if (isLooping) {
                            return 0;
                        } else {
                            setIsPlaying(false);
                            return 1;
                        }
                    }
                    return nextProgress;
                });
            }
            animationFrame = requestAnimationFrame(loop);
        };
        animationFrame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, totalDuration, playbackSpeed, isLooping]);


    if (!currentReaction) return <div className="text-white p-10">Loading Refiner...</div>;

    return (
        <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden font-sans">
            {/* 3-Column Layout */}

            {/* --- LEFT PANEL: TIMELINE (20-25%) --- */}
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#1a1a1a]">
                <div className="p-3 border-b border-white/10 bg-[#222] flex justify-between items-center">
                    <h2 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                        ⏱️ Timeline
                    </h2>
                    <select
                        className="bg-black/50 border border-white/20 rounded px-2 py-0.5 text-[10px] w-32"
                        value={selectedReactionId || ''}
                        onChange={(e) => setSelectedReactionId(e.target.value)}
                    >
                        {reactions.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col">
                    {viewMode === 'JSON' ? (
                        <div className="p-4 text-xs text-gray-500 text-center mt-10">
                            Switch to Visual Mode to edit Timeline
                        </div>
                    ) : (
                        <TimelineEditor
                            timeline={currentReaction.macroView?.visualRules?.timeline}
                            selectedStepIndex={selectedStepIndex}
                            onSelectStep={setSelectedStepIndex}
                            onChange={(data) => handleVisualChange('timeline', data)}
                            // Playback Props
                            isPlaying={isPlaying}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                            progress={progress}
                            onSeek={setProgress}
                            playbackSpeed={playbackSpeed}
                            setPlaybackSpeed={setPlaybackSpeed}
                            isLooping={isLooping}
                            setIsLooping={setIsLooping}
                            totalDuration={totalDuration}
                        />
                    )}
                </div>
            </div>


            {/* --- CENTER PANEL: 3D PREVIEW (Flex - Fill) --- */}
            <div className="flex-1 flex flex-col relative bg-black min-w-0">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'VISUAL' ? 'JSON' : 'VISUAL')}
                        className="bg-black/60 backdrop-blur border border-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all"
                    >
                        {viewMode === 'VISUAL' ? <Code size={14} /> : <LayoutTemplate size={14} />}
                        {viewMode === 'VISUAL' ? 'View JSON' : 'Visual Editor'}
                    </button>
                </div>

                {viewMode === 'JSON' ? (
                    <textarea
                        className="w-full h-full bg-[#0d0d0d] text-green-400 font-mono text-xs p-6 resize-none focus:outline-none"
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
                )}
            </div>


            {/* --- RIGHT PANEL: PROPERTIES (20-25%) --- */}
            <div className="w-96 flex-shrink-0 flex flex-col border-l border-white/10 bg-[#1a1a1a]">
                <div className="p-3 border-b border-white/10 bg-[#222] flex justify-between items-center">
                    <h2 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                        🛠️ Properties
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className={`
                            px-3 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1.5
                            ${saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-cyan-700 hover:bg-cyan-600'}
                            ${saveStatus === 'error' ? 'bg-red-600' : ''}
                        `}
                    >
                        <Save size={12} />
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {viewMode === 'JSON' ? (
                        <div className="text-xs text-gray-500 text-center mt-10">
                            Switch to Visual Mode to edit Properties
                        </div>
                    ) : (
                        <>
                            {/* Section: Initial State configuration */}
                            <InitialStateEditor
                                initialState={currentReaction.macroView?.visualRules?.initialState}
                                onChange={(newState) => handleVisualChange('initialState', newState)}
                                apparatusList={currentReaction.apparatus || []}
                            />

                            {/* Section: Step Details (Visible only when a step is selected) */}
                            {selectedStepIndex !== null ? (
                                <div className="bg-[#111] rounded-lg border border-white/5 overflow-hidden flex flex-col min-h-[400px]">
                                    <div className="bg-[#1f1f1f] px-3 py-2 border-b border-white/5 font-semibold text-xs text-cyan-300 flex justify-between">
                                        <span>Step {parseInt(selectedStepIndex) + 1} Details</span>
                                        <span className="text-white/30 font-mono">#{selectedStepIndex}</span>
                                    </div>
                                    <div className="flex-1">
                                        <StepDetailEditor
                                            step={currentReaction.macroView?.visualRules?.timeline?.[selectedStepIndex]}
                                            apparatusList={currentReaction.apparatus || []}
                                            onChange={(updatedStep) => {
                                                const newTimeline = { ...currentReaction.macroView?.visualRules?.timeline };
                                                newTimeline[selectedStepIndex] = updatedStep;
                                                handleVisualChange('timeline', newTimeline);
                                            }}
                                            onPreview={() => {
                                                const timeline = currentReaction.macroView?.visualRules?.timeline || {};
                                                let startTime = 0;
                                                // Sum duration+delay of all previous steps
                                                for (let i = 0; i < selectedStepIndex; i++) {
                                                    const s = timeline[i];
                                                    if (s && !s.disabled) {
                                                        startTime += (parseFloat(s.duration) || 0) + (parseFloat(s.delay) || 0);
                                                    }
                                                }

                                                if (totalDuration > 0) {
                                                    setProgress(startTime / totalDuration);
                                                    setIsPlaying(true);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-white/10 rounded-lg p-6 text-center text-gray-600 text-xs bg-white/5">
                                    Select a step from the Timeline on the left to edit its properties.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};


export default ReactionRefinerPage;
