'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Grid } from '@react-three/drei';
import MacroView from '@/components/reactions/views/MacroView';
import { Save, Play, Pause, RefreshCw, Code, LayoutTemplate, MessageSquareText } from 'lucide-react';
import InitialStateEditor from './components/InitialStateEditor';
import ExplanationEditor from './components/ExplanationEditor';
import StepDetailEditor from './components/StepDetailEditor';
import GlobalTimelineEditor from './components/ReactantTimelineEditor';
import ReactantBlockEditor from './components/ReactantBlockEditor';


const ReactionRefinerPage = () => {
    const [reactions, setReactions] = useState([]);
    const [selectedReactionId, setSelectedReactionId] = useState(null);
    const [currentReaction, setCurrentReaction] = useState(null);

    // Editor State
    const [viewMode, setViewMode] = useState('VISUAL'); // 'VISUAL' or 'JSON'
    const [jsonInput, setJsonInput] = useState('');
    const [selectedExplanationId, setSelectedExplanationId] = useState(null);
    const [selectedReactantBlockId, setSelectedReactantBlockId] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    const [timelineHeight, setTimelineHeight] = useState(250); // Default timeline height in pixels
    const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(384);
    const [isDraggingLeft, setIsDraggingLeft] = useState(false);
    const [isDraggingRight, setIsDraggingRight] = useState(false);

    // Playback State
    const [progress, setProgress] = useState(0); // 0 to 1
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 0.5x, etc.
    const [isLooping, setIsLooping] = useState(false);

    // Calculate Total Duration
    const totalDuration = useMemo(() => {
        let maxStepDuration = 0; // Default to 0, not 10
        if (currentReaction?.macroView?.visualRules?.timeline) {
            maxStepDuration = Object.values(currentReaction.macroView.visualRules.timeline).reduce((acc, step) => {
                if (step.disabled) return acc;
                return acc + (parseFloat(step.duration) || 0) + (parseFloat(step.delay) || 0);
            }, 0);
        }
        let maxReactantDuration = 0;
        if (currentReaction?.macroView?.visualRules?.reactantTimeline) {
            maxReactantDuration = currentReaction.macroView.visualRules.reactantTimeline.reduce((acc, block) => {
                const end = (parseFloat(block.startTime) || 0) + (parseFloat(block.duration) || 0);
                return Math.max(acc, end);
            }, 0);
        }
        let maxExplanationDuration = 0;
        if (currentReaction?.macroView?.visualRules?.explanationTimeline) {
            maxExplanationDuration = currentReaction.macroView.visualRules.explanationTimeline.reduce((acc, block) => {
                const end = (parseFloat(block.startTime) || 0) + (parseFloat(block.duration) || 0);
                return Math.max(acc, end);
            }, 0);
        }

        // Return whichever is longest, defaulting to 5s only if both timelines are completely empty
        return Math.max(maxStepDuration, maxReactantDuration, maxExplanationDuration) || 5;
    }, [
        currentReaction?.macroView?.visualRules?.timeline, 
        currentReaction?.macroView?.visualRules?.reactantTimeline,
        currentReaction?.macroView?.visualRules?.explanationTimeline
    ]);

    // Fetch Reactions on Mount
    useEffect(() => {
        fetch('/api/reactions', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                // Recover autosaved state from local storage first to prevent losing work and stay synced with editor
                const autosaved = localStorage.getItem('molecool_reactions_autosave');
                if (autosaved) {
                    try {
                        const parsed = JSON.parse(autosaved);
                        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                            setReactions(parsed);
                            let sel = localStorage.getItem('molecool_selected_reaction') || parsed[0].id;
                            setSelectedReactionId(sel);
                            return;
                        }
                    } catch (e) {
                        console.error('Corrupted autosave', e);
                    }
                }

                setReactions(data);
                if (data.length > 0) {
                    setSelectedReactionId(data[0].id);
                }
            })
            .catch(err => console.error("Failed to load reactions", err));
    }, []);

    // Debounced autosave — prevents JSON.stringify on every reaction edit
    const autosaveTimerRef = useRef(null);
    useEffect(() => {
        if (reactions.length === 0) return;
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            localStorage.setItem('molecool_reactions_autosave', JSON.stringify(reactions));
        }, 1500);
        return () => clearTimeout(autosaveTimerRef.current);
    }, [reactions]);

    useEffect(() => {
        if (selectedReactionId) {
            localStorage.setItem('molecool_selected_reaction', selectedReactionId);
        }
    }, [selectedReactionId]);

    // Load Selected Reaction — only re-runs when the selected ID changes, not on every edit.
    // currentReaction stays in sync via the single-state handleVisualChange below.
    useEffect(() => {
        if (!selectedReactionId || reactions.length === 0) return;
        const reaction = reactions.find(r => r.id === selectedReactionId);
        if (reaction) {
            setCurrentReaction(reaction);
            setJsonInput(JSON.stringify(reaction.macroView?.visualRules || {}, null, 4));
            setProgress(0);
            setIsPlaying(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReactionId]);

    // Handle Timeline Resizer
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingTimeline) return;
            const newHeight = window.innerHeight - e.clientY;
            const clamped = Math.max(100, Math.min(newHeight, window.innerHeight * 0.8));
            setTimelineHeight(clamped);
        };
        const handleMouseUp = () => setIsDraggingTimeline(false);

        if (isDraggingTimeline) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingTimeline]);

    // Handle Sidebar Resizing — RAF-throttled so setState is called at most once per animation
    // frame (16ms) instead of on every mouse pixel, which was re-rendering the Canvas each time.
    const pendingSidebarX = useRef(null);
    const sidebarRafId = useRef(null);

    useEffect(() => {
        const commitResize = () => {
            const x = pendingSidebarX.current;
            sidebarRafId.current = null;
            if (x === null) return;
            if (isDraggingLeft) {
                setLeftSidebarWidth(Math.max(200, Math.min(x, window.innerWidth / 2.5)));
            } else if (isDraggingRight) {
                setRightSidebarWidth(Math.max(200, Math.min(window.innerWidth - x, window.innerWidth / 2.5)));
            }
            pendingSidebarX.current = null;
        };

        const handleMouseMove = (e) => {
            if (!isDraggingLeft && !isDraggingRight) return;
            pendingSidebarX.current = e.clientX;
            if (!sidebarRafId.current) {
                sidebarRafId.current = requestAnimationFrame(commitResize);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingLeft(false);
            setIsDraggingRight(false);
            if (sidebarRafId.current) {
                cancelAnimationFrame(sidebarRafId.current);
                sidebarRafId.current = null;
            }
            pendingSidebarX.current = null;
        };

        if (isDraggingLeft || isDraggingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else if (!isDraggingTimeline) {
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingLeft, isDraggingRight, isDraggingTimeline]);

    // Single setState handleVisualChange — previously called setCurrentReaction + setReactions
    // causing two consecutive re-renders. Now only setReactions is called, and currentReaction
    // is kept in sync separately for the JSON editor view.
    const handleVisualChange = useCallback((category, newData) => {
        setReactions(prevList => {
            return prevList.map(r => {
                if (r.id !== selectedReactionId) return r;
                const newRules = { ...(r.macroView?.visualRules || {}) };
                if (category === 'initialState')             newRules.initialState        = newData;
                else if (category === 'timeline')             newRules.timeline            = newData;
                else if (category === 'reactantTimeline')     newRules.reactantTimeline    = newData;
                else if (category === 'explanationTimeline')  newRules.explanationTimeline = newData;
                const updated = { ...r, macroView: { ...r.macroView, visualRules: newRules } };
                // Keep currentReaction and JSON editor in sync imperatively (no extra setState)
                setCurrentReaction(updated);
                setJsonInput(JSON.stringify(newRules, null, 4));
                return updated;
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReactionId]);

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


    if (!currentReaction) return (
        <div className="flex h-screen w-full bg-black text-white items-center justify-center">
            <div className="bg-mesh-container">
                <div className="bg-mesh-blob blob-1" />
                <div className="bg-mesh-blob blob-2" />
            </div>
            <p className="text-xl text-white font-black animate-pulse tracking-widest uppercase z-10">Initializing Reaction Refiner...</p>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans">
            {/* 3-Column Layout */}

            {/* --- LEFT PANEL: EXPLANATION TIMELINE --- */}
            <div className="flex-shrink-0 flex flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl relative group/left-sidebar" style={{ width: leftSidebarWidth }}>
                {/* Resizer Handle */}
                <div 
                    className="absolute top-0 right-0 bottom-0 w-[6px] translate-x-1/2 bg-transparent cursor-col-resize z-50 flex justify-center items-center group-hover/left-sidebar:bg-cyan-500/10 active:bg-cyan-500/30 transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); setIsDraggingLeft(true); }}
                >
                    <div className={`w-[2px] h-12 rounded-full transition-colors ${isDraggingLeft ? 'bg-cyan-400' : 'bg-white/10 group-hover/left-sidebar:bg-cyan-500/50'}`} />
                </div>

                {/* Panel Header */}
                <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent flex justify-between items-center shrink-0">
                    <h2 className="font-black text-white text-[12px] flex items-center gap-3 uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        Explanation Timeline
                    </h2>
                    <select
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black text-white/70 outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
                        value={selectedReactionId || ''}
                        onChange={(e) => setSelectedReactionId(e.target.value)}
                    >
                        {reactions.map(r => (
                            <option key={r.id} value={r.id} className="bg-black">{r.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col">
                    {viewMode === 'JSON' ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center gap-3 mt-10">
                            <span className="text-3xl opacity-20">💬</span>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Switch to Visual Mode to edit Explanations</p>
                        </div>
                    ) : (
                        <ExplanationEditor
                            explanationTimeline={currentReaction.macroView?.visualRules?.explanationTimeline || []}
                            selectedBlockId={selectedExplanationId}
                            onSelectBlock={(id) => {
                                setSelectedExplanationId(id);
                                if (id !== null) setSelectedReactantBlockId(null);
                            }}
                            onChange={(data) => handleVisualChange('explanationTimeline', data)}
                        />
                    )}
                </div>
            </div>


            {/* --- CENTER PANEL: 3D PREVIEW (Flex - Fill) --- */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-zinc-900 to-black min-w-0">
                <div className="flex-1 relative min-h-0">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'VISUAL' ? 'JSON' : 'VISUAL')}
                            className={`backdrop-blur-xl border text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${
                                viewMode === 'JSON'
                                    ? 'bg-cyan-600/20 border-cyan-500/40 hover:bg-cyan-600/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                    : 'bg-black/70 border-white/20 hover:bg-white/10 hover:border-white/40'
                            }`}
                        >
                            {viewMode === 'VISUAL' ? <Code size={16} /> : <LayoutTemplate size={16} />}
                            {viewMode === 'VISUAL' ? 'SOURCE ACCESS' : 'VISUAL INTERFACE'}
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
                        <div className="relative w-full h-full">
                            <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
                                <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
                                <OrbitControls makeDefault />
                                <Suspense fallback={null}>
                                    <Environment preset="city" />
                                </Suspense>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[5, 10, 5]} intensity={1} />
                                <MacroView
                                    reaction={currentReaction}
                                    progress={progress}
                                />
                            </Canvas>
                            
                            {/* Explanation Overlay Logic */}
                            {currentReaction.macroView?.visualRules?.explanationTimeline && (() => {
                                const activeExplanation = currentReaction.macroView.visualRules.explanationTimeline.find(block => {
                                    const currentTime = progress * totalDuration;
                                    return currentTime >= block.startTime && currentTime <= (block.startTime + block.duration);
                                });
                                
                                if (activeExplanation) {
                                    return (
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4/5 max-w-xl pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl flex items-start gap-4">
                                                <div className="mt-1 bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
                                                    <MessageSquareText size={16} className="text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-base text-white font-black leading-relaxed whitespace-pre-wrap uppercase tracking-tight">
                                                        {activeExplanation.text || "..."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}
                </div>

                {viewMode === 'VISUAL' && (
                    <>
                        {/* Timeline Resizer Bar */}
                        <div 
                            className="w-full h-[6px] bg-white/5 border-t border-b border-white/10 cursor-ns-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 relative flex items-center justify-center transition-colors shrink-0 z-50 group"
                            onMouseDown={(e) => { e.preventDefault(); setIsDraggingTimeline(true); }}
                        >
                            <div className={`w-16 h-1 rounded-full pointer-events-none transition-colors ${isDraggingTimeline ? 'bg-cyan-400' : 'bg-white/20 group-hover:bg-cyan-500/50'}`} />
                        </div>

                        <div className="flex-shrink-0" style={{ height: `${timelineHeight}px` }}>
                            <GlobalTimelineEditor
                            reactantTimeline={currentReaction.macroView?.visualRules?.reactantTimeline}
                            explanationTimeline={currentReaction.macroView?.visualRules?.explanationTimeline}
                            onChangeReactant={(data) => handleVisualChange('reactantTimeline', data)}
                            onChangeExplanation={(data) => handleVisualChange('explanationTimeline', data)}
                            selectedReactantBlockId={selectedReactantBlockId}
                            selectedExplanationBlockId={selectedExplanationId}
                            onSelectReactantBlock={(id) => {
                                setSelectedReactantBlockId(id);
                                if (id !== null) setSelectedExplanationId(null);
                            }}
                            onSelectExplanationBlock={(id) => {
                                setSelectedExplanationId(id);
                                if (id !== null) setSelectedReactantBlockId(null);
                            }}
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
                    </>
                )}
            </div>


            {/* --- RIGHT PANEL: PROPERTIES --- */}
            <div className="flex-shrink-0 flex flex-col border-l border-white/10 bg-black/60 backdrop-blur-xl relative group/right-sidebar" style={{ width: rightSidebarWidth }}>
                {/* Resizer Handle */}
                <div 
                    className="absolute top-0 left-0 bottom-0 w-[6px] -translate-x-1/2 bg-transparent cursor-col-resize z-50 flex justify-center items-center group-hover/right-sidebar:bg-cyan-500/10 active:bg-cyan-500/30 transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); setIsDraggingRight(true); }}
                >
                    <div className={`w-[2px] h-12 rounded-full transition-colors ${isDraggingRight ? 'bg-cyan-400' : 'bg-white/10 group-hover/right-sidebar:bg-cyan-500/50'}`} />
                </div>

                {/* Panel Header */}
                <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent flex justify-between items-center shrink-0">
                    <h2 className="font-black text-white text-[12px] flex items-center gap-3 uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        Component Properties
                    </h2>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className={`
                            px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2
                            ${saveStatus === 'success'
                                ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : saveStatus === 'error'
                                ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            }
                        `}
                    >
                        <Save size={14} />
                        {saveStatus === 'saving' ? 'SYNCING...' : saveStatus === 'success' ? 'SYNCED ✓' : 'COMMIT SAVE'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {viewMode === 'JSON' ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center gap-3 mt-10">
                            <span className="text-3xl opacity-20">🛠</span>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Switch to Visual Mode to edit Properties</p>
                        </div>
                    ) : (
                        <>
                            {/* Section: Initial State configuration */}
                            <InitialStateEditor
                                initialState={currentReaction.macroView?.visualRules?.initialState}
                                onChange={(newState) => handleVisualChange('initialState', newState)}
                                apparatusList={currentReaction.stages?.[0]?.apparatus || currentReaction.apparatus || []}
                            />

                            {/* Section: Step Details (Visible only when a step is selected) */}
                            {selectedExplanationId !== null ? (
                                <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[200px] shadow-xl">
                                    <div className="bg-gradient-to-r from-purple-900/30 to-transparent px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                        <span className="text-[11px] font-black text-purple-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
                                            Explanation Block
                                        </span>
                                        <span className="text-white/30 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">#{selectedExplanationId.split('_').pop()}</span>
                                    </div>
                                    <div className="p-5">
                                        <div className="text-white/60 text-[12px] font-black text-center border border-dashed border-white/15 p-5 rounded-xl bg-white/[0.03] uppercase tracking-wide leading-relaxed">
                                            Explanations are pure visual overlays.
                                            <br />
                                            <span className="text-purple-400">Drag track blocks</span> in the timeline below to adjust timing.
                                        </div>
                                    </div>
                                </div>
                            ) : selectedReactantBlockId !== null ? (
                                <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[400px] shadow-xl">
                                    <div className="bg-gradient-to-r from-pink-900/30 to-transparent px-4 py-3 border-b border-white/10 flex justify-between items-center">
                                        <span className="text-[11px] font-black text-pink-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_6px_rgba(244,114,182,0.8)]" />
                                            Reactant Track Details
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <ReactantBlockEditor
                                            block={currentReaction.macroView?.visualRules?.reactantTimeline?.find(b => b.id === selectedReactantBlockId)}
                                            apparatusList={currentReaction.stages?.[0]?.apparatus || currentReaction.apparatus || []}
                                            onChange={(updatedBlock) => {
                                                const newTimeline = [...(currentReaction.macroView?.visualRules?.reactantTimeline || [])];
                                                const idx = newTimeline.findIndex(b => b.id === selectedReactantBlockId);
                                                if (idx >= 0) {
                                                    newTimeline[idx] = updatedBlock;
                                                    handleVisualChange('reactantTimeline', newTimeline);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-white/15 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
                                    <span className="text-4xl opacity-20">🎯</span>
                                    <p className="text-[11px] font-black text-white/30 uppercase tracking-widest leading-relaxed">Select a block or reactant track to edit its properties</p>
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
