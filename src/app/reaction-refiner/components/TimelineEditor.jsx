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
            <div className="flex-1 overflow-y-auto space-y-0 p-4 custom-scrollbar relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-cyan-500/20 via-cyan-500/10 to-transparent pointer-events-none" />

                <div className="flex justify-between items-center px-1 mb-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-6">Reaction Stages</h3>
                    <button
                        onClick={handleAddStep}
                        className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 transition-colors text-[10px] font-bold"
                        title="Add Stage"
                    >
                        <Plus size={12} /> ADD
                    </button>
                </div>

                {steps.map((stepIdx) => {
                    const step = timeline[stepIdx];
                    const isSelected = selectedStepIndex === stepIdx;

                    return (
                        <div key={stepIdx} className="relative pl-10 pr-2 py-2 group">
                            {/* Timeline Node */}
                            <div className="absolute left-[11px] top-5 -translate-x-1/2 flex items-center justify-center">
                                <div className={`w-3 h-3 rounded-full border-[2px] transition-all duration-300 z-10 flex items-center justify-center
                                    ${isSelected ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-gray-600 bg-[#1a1a1a] group-hover:border-cyan-500/50'}`}
                                >
                                    {isSelected && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                                </div>
                            </div>

                            <div
                                onClick={() => onSelectStep(stepIdx)}
                                className={`
                                    relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer
                                    ${isSelected
                                        ? 'bg-gradient-to-br from-[#1f2937] to-[#111827] border-cyan-500/40 shadow-lg shadow-cyan-900/10' // Selected
                                        : 'bg-[#151515] border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]' // Default
                                    }
                                    ${step.disabled ? 'opacity-40 grayscale' : ''}
                                `}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-[10px] font-mono text-cyan-500/70 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                            {String(parseInt(stepIdx) + 1).padStart(2, '0')}
                                        </span>
                                        <input
                                            type="text"
                                            value={step.description || ''}
                                            onChange={(e) => updateStep(stepIdx, 'description', e.target.value)}
                                            className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none focus:text-white font-semibold placeholder-gray-600 truncate"
                                            placeholder="Stage Description"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'up'); }} className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Move Up"><ArrowUp size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'down'); }} className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Move Down"><ArrowDown size={12} /></button>
                                        <div className="w-px h-3 bg-white/10 mx-0.5" />
                                        <button onClick={(e) => { e.stopPropagation(); updateStep(stepIdx, 'disabled', !step.disabled); }} className={`p-1.5 rounded hover:bg-white/10 transition-colors ${step.disabled ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`} title={step.disabled ? "Enable" : "Disable"}>
                                            {step.disabled ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </button>
                                        <button onClick={(e) => handleDuplicateStep(stepIdx, e)} className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Duplicate"><Copy size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveStep(stepIdx); }} className="p-1.5 rounded hover:bg-red-500/20 text-red-500/70 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={12} /></button>
                                    </div>
                                </div>

                                {/* Details Row */}
                                <div className="p-3 flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between bg-black/20">
                                    {/* Timing Pills */}
                                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-full px-2.5 py-1 min-w-[70px]">
                                            <Clock size={10} className="text-cyan-500/70 shrink-0" />
                                            <input
                                                type="number"
                                                value={step.duration || 0}
                                                onChange={(e) => updateStep(stepIdx, 'duration', parseFloat(e.target.value))}
                                                className="w-8 bg-transparent border-none text-[11px] text-gray-300 font-mono text-center focus:outline-none focus:text-cyan-400 -moz-appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider shrink-0">s</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-full px-2.5 py-1 min-w-[70px]">
                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider shrink-0">Dly</span>
                                            <input
                                                type="number"
                                                value={step.delay || 0}
                                                onChange={(e) => updateStep(stepIdx, 'delay', parseFloat(e.target.value))}
                                                className="w-8 bg-transparent border-none text-[11px] text-gray-400 font-mono text-center focus:outline-none focus:text-cyan-400 -moz-appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Trigger Select */}
                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full px-2.5 py-0.5 shrink-0 self-start xl:self-auto">
                                        <div className="flex items-center justify-center shrink-0">
                                            {getTriggerIcon(step.trigger)}
                                        </div>
                                        <select
                                            value={step.trigger || 'auto'}
                                            onChange={(e) => updateStep(stepIdx, 'trigger', e.target.value)}
                                            className="bg-transparent border-none text-[11px] text-gray-400 font-medium focus:outline-none focus:text-cyan-400 cursor-pointer hover:text-gray-200 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="auto" className="bg-[#111]">Auto</option>
                                            <option value="heat" className="bg-[#111]">On Heat</option>
                                            <option value="mix" className="bg-[#111]">On Mix</option>
                                            <option value="electricity" className="bg-[#111]">On Elec</option>
                                            <option value="manual" className="bg-[#111]">Manual</option>
                                        </select>
                                    </div>
                                </div>
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
