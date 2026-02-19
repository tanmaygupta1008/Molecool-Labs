import React, { useState } from 'react';
import {
    Plus, Trash2, ArrowUp, ArrowDown, Copy,
    Play, Pause, RotateCw, FastForward, Clock,
    Zap, Flame, Beaker, MousePointer, MoreVertical,
    Eye, EyeOff
} from 'lucide-react';

const TimelineEditor = ({
    timeline = {},
    onChange,
    onSelectStep,
    selectedStepIndex,
    // Global Playback Props
    isPlaying,
    onPlayPause,
    progress,
    onSeek,
    playbackSpeed,
    setPlaybackSpeed,
    isLooping,
    setIsLooping,
    totalDuration
}) => {

    const steps = timeline && typeof timeline === 'object'
        ? Object.keys(timeline).sort((a, b) => parseInt(a) - parseInt(b))
        : [];

    const handleAddStep = () => {
        const newStepIndex = steps.length.toString();
        const newTimeline = {
            ...timeline,
            [newStepIndex]: {
                description: "New Step",
                duration: 2.0,
                delay: 0,
                trigger: 'auto', // auto, heat, mix, electricity, manual
                disabled: false,
                animations: [],
                effects: []
            }
        };
        onChange(newTimeline);
        onSelectStep(newStepIndex);
    };

    const handleDuplicateStep = (index, e) => {
        e.stopPropagation();
        const newStepIndex = steps.length.toString();
        const newTimeline = {
            ...timeline,
            [newStepIndex]: {
                ...timeline[index],
                description: `${timeline[index].description} (Copy)`
            }
        };
        onChange(newTimeline);
    };

    const handleRemoveStep = (index) => {
        const newTimeline = {};
        let newIndex = 0;
        steps.forEach(stepIdx => {
            if (stepIdx !== index) {
                newTimeline[newIndex.toString()] = timeline[stepIdx];
                newIndex++;
            }
        });
        onChange(newTimeline);
        if (selectedStepIndex === index) onSelectStep(null);
    };

    const handleMoveStep = (index, direction) => {
        const idx = parseInt(index);
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= steps.length) return;

        const newTimeline = { ...timeline };
        const temp = newTimeline[idx.toString()];
        newTimeline[idx.toString()] = newTimeline[targetIdx.toString()];
        newTimeline[targetIdx.toString()] = temp;

        onChange(newTimeline);
        if (selectedStepIndex === index) onSelectStep(targetIdx.toString());
    };

    const updateStep = (index, field, value) => {
        const newTimeline = {
            ...timeline,
            [index]: {
                ...timeline[index],
                [field]: value
            }
        };
        onChange(newTimeline);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTriggerIcon = (type) => {
        switch (type) {
            case 'heat': return <Flame size={12} className="text-orange-400" />;
            case 'electricity': return <Zap size={12} className="text-yellow-400" />;
            case 'mix': return <Beaker size={12} className="text-blue-400" />;
            case 'manual': return <MousePointer size={12} className="text-pink-400" />;
            default: return <Clock size={12} className="text-gray-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">

            {/* B. GLOBAL TIMELINE CONTROLS */}
            <div className="p-3 bg-[#222] border-b border-white/10 flex flex-col gap-2">
                {/* Scrub Bar */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-300 w-8">
                        {Math.round(progress * 100)}%
                    </span>
                    <input
                        type="range"
                        min="0" max="1" step="0.001"
                        value={progress}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                        {formatTime(totalDuration * progress)}
                    </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={onPlayPause}
                            className={`p-1.5 rounded hover:bg-white/10 ${isPlaying ? 'text-cyan-400' : 'text-gray-300'}`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                        <button
                            onClick={() => setIsLooping(!isLooping)}
                            className={`p-1.5 rounded hover:bg-white/10 ${isLooping ? 'text-green-400 bg-green-900/20' : 'text-gray-400'}`}
                            title="Toggle Loop"
                        >
                            <RotateCw size={14} />
                        </button>
                        <button
                            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.5 : 1)}
                            className={`p-1.5 rounded hover:bg-white/10 text-xs font-mono w-10 ${playbackSpeed !== 1 ? 'text-yellow-400' : 'text-gray-400'}`}
                            title="Toggle Slow Motion"
                        >
                            {playbackSpeed}x
                        </button>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                        Total: {totalDuration}s
                    </span>
                </div>
            </div>

            {/* A. STAGE LIST */}
            <div className="flex-1 overflow-y-auto space-y-1 p-2 custom-scrollbar">
                <div className="flex justify-between items-center px-1 mb-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stages</h3>
                    <button
                        onClick={handleAddStep}
                        className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Add Stage"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {steps.map((stepIdx) => {
                    const step = timeline[stepIdx];
                    const isSelected = selectedStepIndex === stepIdx;

                    return (
                        <div
                            key={stepIdx}
                            onClick={() => onSelectStep(stepIdx)}
                            className={`
                                relative rounded-lg border transition-all duration-200 overflow-hidden group
                                ${isSelected
                                    ? 'bg-[#1f2937] border-cyan-500/50' // Selected
                                    : 'bg-[#151515] border-white/5 hover:border-white/10' // Default
                                }
                                ${step.disabled ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            {/* Header / Drag Handle */}
                            <div className="flex items-center gap-2 p-2 bg-black/20 border-b border-white/5">
                                <span className="text-[10px] font-mono text-gray-500 w-4">#{parseInt(stepIdx) + 1}</span>
                                <input
                                    type="text"
                                    value={step.description || ''}
                                    onChange={(e) => updateStep(stepIdx, 'description', e.target.value)}
                                    className="flex-1 bg-transparent border-none text-xs text-gray-200 focus:outline-none focus:text-cyan-400 font-medium placeholder-gray-600"
                                    placeholder="Stage Name"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateStep(stepIdx, 'disabled', !step.disabled); }}
                                        className={`p-1 rounded hover:bg-white/10 ${step.disabled ? 'text-gray-600' : 'text-gray-400'}`}
                                        title={step.disabled ? "Enable" : "Disable"}
                                    >
                                        {step.disabled ? <EyeOff size={11} /> : <Eye size={11} />}
                                    </button>
                                    <button
                                        onClick={(e) => handleDuplicateStep(stepIdx, e)}
                                        className="p-1 text-gray-500 hover:text-white"
                                        title="Duplicate"
                                    >
                                        <Copy size={11} />
                                    </button>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="p-2 grid grid-cols-2 gap-2 text-[10px]">
                                {/* Duration & Delay */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock size={10} className="text-gray-500" />
                                        <input
                                            type="number"
                                            value={step.duration || 0}
                                            onChange={(e) => updateStep(stepIdx, 'duration', parseFloat(e.target.value))}
                                            className="w-8 bg-black/30 border border-white/10 rounded px-1 text-right focus:border-cyan-500/50 focus:outline-none"
                                        />
                                        <span className="text-gray-500">sec</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 w-3 text-right">Dly</span>
                                        <input
                                            type="number"
                                            value={step.delay || 0}
                                            onChange={(e) => updateStep(stepIdx, 'delay', parseFloat(e.target.value))}
                                            className="w-8 bg-black/30 border border-white/10 rounded px-1 text-right focus:border-cyan-500/50 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Trigger */}
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-1 mb-1">
                                        {getTriggerIcon(step.trigger)}
                                        <span className="text-gray-400 capitalize">{step.trigger || 'auto'}</span>
                                    </div>
                                    <select
                                        value={step.trigger || 'auto'}
                                        onChange={(e) => updateStep(stepIdx, 'trigger', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded px-1 py-0.5 text-gray-300 focus:outline-none focus:border-cyan-500/50"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="heat">On Heat</option>
                                        <option value="mix">On Mix</option>
                                        <option value="electricity">On Elec</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reorder / Delete Hover Overlay (optional/or keep visible) */}
                            <div className="flex justify-end gap-1 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'up'); }} className="p-1 hover:text-white text-gray-600"><ArrowUp size={10} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'down'); }} className="p-1 hover:text-white text-gray-600"><ArrowDown size={10} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveStep(stepIdx); }} className="p-1 hover:text-red-400 text-gray-600 ml-2"><Trash2 size={10} /></button>
                            </div>

                        </div>
                    );
                })}

                {steps.length === 0 && (
                    <div className="text-center text-gray-600 text-xs py-10 border border-dashed border-white/5 rounded-lg">
                        No stages defined.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelineEditor;
