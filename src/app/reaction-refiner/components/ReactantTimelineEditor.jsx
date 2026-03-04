import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Clock, Play, Pause, RotateCw } from 'lucide-react';

const ReactantTimelineEditor = ({
    reactantTimeline = [],
    onChange,
    onSelectBlock,
    selectedBlockId,
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
    const [draggingBlock, setDraggingBlock] = useState(null);
    const [dragMode, setDragMode] = useState(null); // 'move' | 'resizeLeft' | 'resizeRight'
    const [dragStartX, setDragStartX] = useState(0);
    const [initialBlockState, setInitialBlockState] = useState(null);

    // Ensure we have an array
    const blocks = Array.isArray(reactantTimeline) ? reactantTimeline : [];

    // Calculate pixels per second based on container width and total duration
    // Assuming a minimum scale of e.g. 50px per second for editing, scrolling if needed
    const PIXELS_PER_SECOND = 40;
    const timelineWidth = Math.max(800, totalDuration * PIXELS_PER_SECOND + 200);

    const handleAddBlock = () => {
        const newBlock = {
            id: `r_step_${Date.now()}`,
            name: `Reactant Stage ${blocks.length + 1}`,
            startTime: 0,
            duration: 5,
            effects: []
        };
        onChange([...blocks, newBlock]);
        onSelectBlock(newBlock.id);
    };

    const handleRemoveBlock = (id) => {
        onChange(blocks.filter(b => b.id !== id));
        if (selectedBlockId === id) onSelectBlock(null);
    };

    const updateBlock = (id, changes) => {
        onChange(blocks.map(b => b.id === id ? { ...b, ...changes } : b));
    };

    // --- Drag & Drop Logic for Blocks ---
    const handleMouseDown = (e, block, mode) => {
        e.stopPropagation();
        setDraggingBlock(block.id);
        setDragMode(mode);
        setDragStartX(e.clientX);
        setInitialBlockState({ ...block });
        onSelectBlock(block.id);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!draggingBlock || !dragMode || !initialBlockState) return;

            const deltaX = e.clientX - dragStartX;
            const deltaSeconds = deltaX / PIXELS_PER_SECOND;

            if (dragMode === 'move') {
                const newStart = Math.max(0, initialBlockState.startTime + deltaSeconds);
                updateBlock(draggingBlock, { startTime: Number(newStart.toFixed(2)) });
            } else if (dragMode === 'resizeRight') {
                const newDuration = Math.max(0.5, initialBlockState.duration + deltaSeconds);
                updateBlock(draggingBlock, { duration: Number(newDuration.toFixed(2)) });
            } else if (dragMode === 'resizeLeft') {
                const maxDelta = initialBlockState.duration - 0.5; // Min duration 0.5
                const clampedDelta = Math.min(deltaSeconds, maxDelta);

                const newStart = Math.max(0, initialBlockState.startTime + clampedDelta);
                // Adjust duration inversely to start time change
                const actualStartDelta = newStart - initialBlockState.startTime;
                const newDuration = Math.max(0.5, initialBlockState.duration - actualStartDelta);

                updateBlock(draggingBlock, {
                    startTime: Number(newStart.toFixed(2)),
                    duration: Number(newDuration.toFixed(2))
                });
            }
        };

        const handleMouseUp = () => {
            setDraggingBlock(null);
            setDragMode(null);
            setInitialBlockState(null);
        };

        if (draggingBlock) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingBlock, dragMode, dragStartX, initialBlockState]);


    // --- Formatter ---
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render 1-second interval markers
    const renderTimeMarkers = () => {
        const markers = [];
        const maxTime = Math.max(totalDuration, Math.max(...blocks.map(b => b.startTime + b.duration), 10)) + 5;
        for (let i = 0; i <= maxTime; i++) {
            markers.push(
                <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${i * PIXELS_PER_SECOND}px` }}>
                    <span className="absolute top-1 -left-2 text-[9px] text-gray-500 font-mono">{i}s</span>
                </div>
            );
        }
        return markers;
    };


    return (
        <div className="flex flex-col h-full bg-[#111] border-t border-white/10 select-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> Reactant Transitions
                    </h2>
                    <button
                        onClick={handleAddBlock}
                        className="px-2 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                        <Plus size={12} /> ADD TRACK
                    </button>
                    <span className="text-[10px] text-gray-500 font-mono italic">
                        Drag to move, drag edges to resize
                    </span>
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
                    {/* Background Markers */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        {renderTimeMarkers()}
                    </div>

                    {/* Scrubber Line (Progress) */}
                    <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-20 pointer-events-none"
                        style={{ left: `${(progress * totalDuration) * PIXELS_PER_SECOND}px` }}>
                        <div className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-red-500" />
                    </div>

                    {/* Tracks Wrapper */}
                    <div className="relative z-10 flex flex-col gap-2 px-2">
                        {blocks.map((block, index) => {
                            const isSelected = selectedBlockId === block.id;
                            const left = block.startTime * PIXELS_PER_SECOND;
                            const width = block.duration * PIXELS_PER_SECOND;

                            return (
                                <div key={block.id} className="h-8 relative flex items-center bg-white/5 rounded my-1 w-full border border-white/5">
                                    {/* The Block itself */}
                                    <div
                                        className={`absolute h-6 top-1 rounded cursor-move overflow-hidden transition-shadow select-none flex items-center
                                            ${isSelected ? 'bg-cyan-600/80 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] z-20' : 'bg-[#2a4365] border border-[#3182ce] hover:brightness-110 z-10'}
                                        `}
                                        style={{ left: `${left}px`, width: `${width}px` }}
                                        onMouseDown={(e) => handleMouseDown(e, block, 'move')}
                                        onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                                    >
                                        {/* Left Drag Handle */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 z-30"
                                            onMouseDown={(e) => handleMouseDown(e, block, 'resizeLeft')}
                                        />

                                        <div className="px-2 truncate text-[10px] font-bold text-white tracking-wide w-full flex justify-between items-center pointer-events-none">
                                            <span className="truncate">{block.name}</span>
                                            <span className="text-[9px] text-white/50">{block.duration}s</span>
                                        </div>

                                        {/* Right Drag Handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 z-30"
                                            onMouseDown={(e) => handleMouseDown(e, block, 'resizeRight')}
                                        />
                                    </div>

                                    {/* Per track delete button */}
                                    {isSelected && (
                                        <button
                                            className="absolute -right-6 text-gray-500 hover:text-red-400 p-1"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveBlock(block.id); }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {blocks.length === 0 && (
                            <div className="absolute inset-x-0 top-10 flex justify-center pointer-events-none">
                                <span className="text-gray-600 text-[10px]">Click "Add Track" to add a reactant timeline.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReactantTimelineEditor;
