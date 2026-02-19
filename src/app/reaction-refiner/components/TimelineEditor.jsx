import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const TimelineEditor = ({ timeline = {}, onChange, onSelectStep, selectedStepIndex }) => {

    const steps = timeline && typeof timeline === 'object'
        ? Object.keys(timeline).sort((a, b) => parseInt(a) - parseInt(b))
        : [];

    const handleAddStep = () => {
        const newStepIndex = steps.length.toString();
        const newTimeline = { ...timeline, [newStepIndex]: { description: "New Step", animations: [], effects: [] } };
        onChange(newTimeline);
        onSelectStep(newStepIndex);
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
        // Swap
        const temp = newTimeline[idx.toString()];
        newTimeline[idx.toString()] = newTimeline[targetIdx.toString()];
        newTimeline[targetIdx.toString()] = temp;

        // Re-key everything to be safe (though swapping values at keys is cleaner if keys are just indices)
        // Actually, since keys are "0", "1", "2"... swapping values at keys is the correct approach.

        onChange(newTimeline);
        if (selectedStepIndex === index) onSelectStep(targetIdx.toString());
    };

    return (
        <div className="bg-[#222] p-4 rounded-lg flex flex-col h-full min-h-[200px] border border-white/5">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Timeline</h3>
                <button
                    onClick={handleAddStep}
                    className="p-1 bg-cyan-600/20 text-cyan-400 rounded hover:bg-cyan-600/40 transition-colors border border-cyan-800/30"
                    title="Add Step"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {steps.map((stepIdx) => {
                    const step = timeline[stepIdx];
                    const isSelected = selectedStepIndex === stepIdx;

                    return (
                        <div
                            key={stepIdx}
                            onClick={() => onSelectStep(stepIdx)}
                            className={`
                                relative p-3 rounded-lg border cursor-pointer group transition-all duration-200
                                ${isSelected
                                    ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                    : 'bg-black/40 border-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-mono ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`}>
                                    STEP {stepIdx}
                                </span>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'up'); }}
                                        className="p-1 hover:text-white text-gray-500"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMoveStep(stepIdx, 'down'); }}
                                        className="p-1 hover:text-white text-gray-500"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveStep(stepIdx); }}
                                        className="p-1 hover:text-red-400 text-gray-500"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-xs font-medium text-gray-200 truncate">
                                {step.description || "Untitled Step"}
                            </h4>

                            <div className="mt-2 flex gap-2 text-[10px] text-gray-400">
                                {step.animations?.length > 0 && (
                                    <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                                        {step.animations.length} Anim
                                    </span>
                                )}
                                {step.effects?.length > 0 && (
                                    <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                        {step.effects.length} FX
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {steps.length === 0 && (
                    <div className="text-center text-gray-500 text-xs py-8 border border-dashed border-white/10 rounded-lg">
                        No steps yet. Click + to add one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelineEditor;
