import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Clock, Play, Pause, RotateCw, FlaskConical, MessageSquareText } from 'lucide-react';

const GlobalTimelineEditor = ({
    reactantTimeline = [],
    explanationTimeline = [],
    onChangeReactant,
    onChangeExplanation,
    onSelectReactantBlock,
    onSelectExplanationBlock,
    selectedReactantBlockId,
    selectedExplanationBlockId,
    progress,
    totalDuration,
    isPlaying,
    onPlayPause,
    isLooping,
    setIsLooping,
    playbackSpeed,
    setPlaybackSpeed,
    onSeek
}) => {
    const timelineRef = useRef(null);
    
    // Drag State
    const [draggingBlockId, setDraggingBlockId] = useState(null);
    const [draggingType, setDraggingType] = useState(null); // 'reactant' | 'explanation'
    const [dragMode, setDragMode] = useState(null); // 'move' | 'resizeLeft' | 'resizeRight'
    const [dragStartX, setDragStartX] = useState(0);
    const [initialBlockState, setInitialBlockState] = useState(null);

    const rBlocks = Array.isArray(reactantTimeline) ? reactantTimeline : [];
    const eBlocks = Array.isArray(explanationTimeline) ? explanationTimeline : [];

    // Calculate pixels per second based on container width and total duration
    const PIXELS_PER_SECOND = 40;
    const timelineWidth = Math.max(800, totalDuration * PIXELS_PER_SECOND + 200);

    const handleAddReactantTrack = () => {
        const newBlock = { id: `r_step_${Date.now()}`, name: `Reactant Stage ${rBlocks.length + 1}`, startTime: 0, duration: 5, effects: [] };
        onChangeReactant([...rBlocks, newBlock]);
        onSelectReactantBlock(newBlock.id);
        onSelectExplanationBlock(null);
    };

    const handleAddExplanationTrack = () => {
        const newBlock = { id: `exp_${Date.now()}`, text: `New Explanation`, startTime: 0, duration: 5 };
        onChangeExplanation([...eBlocks, newBlock]);
        onSelectExplanationBlock(newBlock.id);
        onSelectReactantBlock(null);
    };

    const handleRemoveReactantBlock = (id) => {
        onChangeReactant(rBlocks.filter(b => b.id !== id));
        if (selectedReactantBlockId === id) onSelectReactantBlock(null);
    };

    const handleRemoveExplanationBlock = (id) => {
        onChangeExplanation(eBlocks.filter(b => b.id !== id));
        if (selectedExplanationBlockId === id) onSelectExplanationBlock(null);
    };

    const updateReactantBlock = (id, changes) => {
        onChangeReactant(rBlocks.map(b => b.id === id ? { ...b, ...changes } : b));
    };

    const updateExplanationBlock = (id, changes) => {
        onChangeExplanation(eBlocks.map(b => b.id === id ? { ...b, ...changes } : b));
    };

    // --- Drag & Drop Logic ---
    const handleMouseDown = (e, block, type, mode) => {
        e.stopPropagation();
        setDraggingBlockId(block.id);
        setDraggingType(type);
        setDragMode(mode);
        setDragStartX(e.clientX);
        setInitialBlockState({ ...block });
        
        if (type === 'reactant') {
            onSelectReactantBlock(block.id);
            onSelectExplanationBlock(null);
        } else {
            onSelectExplanationBlock(block.id);
            onSelectReactantBlock(null);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!draggingBlockId || !dragMode || !initialBlockState || !draggingType) return;

            const deltaX = e.clientX - dragStartX;
            const deltaSeconds = deltaX / PIXELS_PER_SECOND;

            let newStart = initialBlockState.startTime;
            let newDuration = initialBlockState.duration;

            if (dragMode === 'move') {
                newStart = Math.max(0, initialBlockState.startTime + deltaSeconds);
            } else if (dragMode === 'resizeRight') {
                newDuration = Math.max(0.5, initialBlockState.duration + deltaSeconds);
            } else if (dragMode === 'resizeLeft') {
                const maxDelta = initialBlockState.duration - 0.5; // Min duration 0.5
                const clampedDelta = Math.min(deltaSeconds, maxDelta);
                newStart = Math.max(0, initialBlockState.startTime + clampedDelta);
                const actualStartDelta = newStart - initialBlockState.startTime;
                newDuration = Math.max(0.5, initialBlockState.duration - actualStartDelta);
            }

            // Anti-collision logic for Explanations
            if (draggingType === 'explanation') {
                const isColliding = eBlocks.some(b => {
                    if (b.id === draggingBlockId) return false;
                    const startA = newStart;
                    const endA = newStart + newDuration;
                    const startB = b.startTime;
                    const endB = b.startTime + b.duration;
                    // Slightly offset by a tiny epsilon to allow tracks to sit exactly next to each other
                    return (startA < endB - 0.01) && (endA > startB + 0.01);
                });

                if (isColliding) {
                    return; // Hit invisible wall, ignore updates until moved out of collision
                }
            }

            if (draggingType === 'reactant') {
                updateReactantBlock(draggingBlockId, { startTime: Number(newStart.toFixed(2)), duration: Number(newDuration.toFixed(2)) });
            } else {
                updateExplanationBlock(draggingBlockId, { startTime: Number(newStart.toFixed(2)), duration: Number(newDuration.toFixed(2)) });
            }
        };

        const handleMouseUp = () => {
            setDraggingBlockId(null);
            setDraggingType(null);
            setDragMode(null);
            setInitialBlockState(null);
        };

        if (draggingBlockId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingBlockId, draggingType, dragMode, dragStartX, initialBlockState]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderTimeMarkers = () => {
        const markers = [];
        const maxTime = Math.max(
            totalDuration, 
            Math.max(...rBlocks.map(b => b.startTime + b.duration), 10),
            Math.max(...eBlocks.map(b => b.startTime + b.duration), 10)
        ) + 5;
        for (let i = 0; i <= maxTime; i++) {
            markers.push(
                <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${i * PIXELS_PER_SECOND}px` }}>
                    <span className="absolute top-1 -left-2 text-[9px] text-gray-500 font-mono">{i}s</span>
                </div>
            );
        }
        return markers;
    };

    const TrackRow = ({ block, type, index, isSelected }) => {
        const left = block.startTime * PIXELS_PER_SECOND;
        const width = block.duration * PIXELS_PER_SECOND;
        
        const isReactant = type === 'reactant';
        const bgClass = isReactant 
            ? (isSelected ? 'bg-cyan-600/80 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-[#2a4365] border-[#3182ce]')
            : (isSelected ? 'bg-purple-600/80 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-[#442a65] border-[#805ad5]');

        const name = isReactant ? block.name : `Explanation ${index + 1}`;

        return (
            <div className="h-8 relative flex items-center bg-white/5 rounded my-1 w-full border border-white/5 group">
                <div
                    className={`absolute h-6 top-1 rounded cursor-move overflow-hidden transition-shadow select-none flex items-center border z-10 hover:brightness-110 ${bgClass}`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                    onMouseDown={(e) => handleMouseDown(e, block, type, 'move')}
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isReactant) { onSelectReactantBlock(block.id); onSelectExplanationBlock(null); }
                        else { onSelectExplanationBlock(block.id); onSelectReactantBlock(null); } 
                    }}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 z-30" onMouseDown={(e) => handleMouseDown(e, block, type, 'resizeLeft')} />
                    <div className="px-2 truncate text-[10px] font-bold text-white tracking-wide w-full flex justify-between items-center pointer-events-none">
                        <span className="truncate">{name}</span>
                        <span className="text-[9px] text-white/50">{block.duration}s</span>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 z-30" onMouseDown={(e) => handleMouseDown(e, block, type, 'resizeRight')} />
                </div>
                {isSelected && (
                    <button
                        className={`absolute -right-6 text-gray-500 p-1 ${isReactant ? 'hover:text-cyan-400' : 'hover:text-purple-400'}`}
                        onClick={(e) => { e.stopPropagation(); isReactant ? handleRemoveReactantBlock(block.id) : handleRemoveExplanationBlock(block.id); }}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#111] border-t border-white/10 select-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" /> Timeline Editor
                    </h2>
                    <div className="h-4 w-px bg-white/20 mx-1"></div>
                    <button
                        onClick={handleAddReactantTrack}
                        className="px-2 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                        <FlaskConical size={12} /> ADD REACTANT
                    </button>
                    <button
                        onClick={handleAddExplanationTrack}
                        className="px-2 py-1 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                        <MessageSquareText size={12} /> ADD EXPLANATION
                    </button>
                </div>

                {/* Scrubber Playback Controls */}
                <div className="flex flex-1 mx-6 items-center gap-2 max-w-md">
                    <button onClick={onPlayPause} className={`p-1 rounded ${isPlaying ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => setIsLooping(!isLooping)} className={`p-1 rounded ${isLooping ? 'text-green-400' : 'text-gray-500'}`}>
                        <RotateCw size={12} />
                    </button>
                    <span className="text-[10px] font-mono text-cyan-500 w-8">{formatTime(progress * totalDuration)}</span>
                    <input
                        type="range" min="0" max="1" step="0.001"
                        value={progress} onChange={e => onSeek(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
            </div>

            {/* Timeline Tracks Area */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative" ref={timelineRef}>
                <div className="min-w-full relative h-full pt-6 pb-4" style={{ width: `${timelineWidth}px` }}>
                    <div className="absolute inset-0 z-0 pointer-events-none">{renderTimeMarkers()}</div>

                    <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-20 pointer-events-none" style={{ left: `${(progress * totalDuration) * PIXELS_PER_SECOND}px` }}>
                        <div className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-red-500" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-4 px-2 mt-4">
                        {/* Reactant Group */}
                        {rBlocks.length > 0 && (
                            <div className="flex flex-col gap-1">
                                <div className="text-[9px] uppercase tracking-widest text-cyan-500/50 font-bold mb-1 ml-2">Reactant Transitions</div>
                                {rBlocks.map((block, i) => (
                                    <TrackRow key={block.id} block={block} type="reactant" index={i} isSelected={selectedReactantBlockId === block.id} />
                                ))}
                            </div>
                        )}

                        {/* Explanation Group */}
                        {eBlocks.length > 0 && (
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="text-[9px] uppercase tracking-widest text-purple-500/50 font-bold mb-1 ml-2">Explanations</div>
                                {eBlocks.map((block, i) => (
                                    <TrackRow key={block.id} block={block} type="explanation" index={i} isSelected={selectedExplanationBlockId === block.id} />
                                ))}
                            </div>
                        )}

                        {(rBlocks.length === 0 && eBlocks.length === 0) && (
                            <div className="absolute inset-x-0 top-10 flex justify-center pointer-events-none">
                                <span className="text-gray-600 text-[10px]">Click "Add Reactant" or "Add Explanation" to create timeline tracks.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalTimelineEditor;
