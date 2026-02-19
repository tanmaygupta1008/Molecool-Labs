import React, { useState } from 'react';
import { Plus, X, Play } from 'lucide-react';

const StepDetailEditor = ({ step, onChange, onPreview }) => {

    if (!step) return <div className="text-gray-500 text-xs italic p-4">Select a step to edit details</div>;

    const handleChange = (key, value) => {
        onChange({ ...step, [key]: value });
    };

    const handleArrayChange = (arrayKey, index, itemKey, value) => {
        const newArray = [...(step[arrayKey] || [])];
        newArray[index] = { ...newArray[index], [itemKey]: value };
        onChange({ ...step, [arrayKey]: newArray });
    };

    const addItem = (arrayKey, defaultItem) => {
        const newArray = [...(step[arrayKey] || []), defaultItem];
        onChange({ ...step, [arrayKey]: newArray });
    };

    const removeItem = (arrayKey, index) => {
        const newArray = (step[arrayKey] || []).filter((_, i) => i !== index);
        onChange({ ...step, [arrayKey]: newArray });
    };

    return (
        <div className="bg-[#1a1a1a] p-4 h-full overflow-y-auto custom-scrollbar border-l border-white/10">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider flex justify-between">
                <span>Step Details</span>
                <button onClick={onPreview} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300">
                    <Play size={12} fill="currentColor" /> Preview Step
                </button>
            </h3>

            {/* Description */}
            <div className="mb-6">
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Description</label>
                <input
                    type="text"
                    value={step.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. User picks up Magnesium"
                />
            </div>

            {/* ANIMATIONS */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-blue-400 uppercase font-bold">Animations</label>
                    <button
                        onClick={() => addItem('animations', { target: 'tongs', type: 'move', duration: 1.0 })}
                        className="p-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/40"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                <div className="space-y-2">
                    {(step.animations || []).map((anim, idx) => (
                        <div key={idx} className="bg-black/30 border border-blue-500/20 rounded p-2 relative group">
                            <button
                                onClick={() => removeItem('animations', idx)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[9px] text-gray-500">Target</label>
                                    <input
                                        type="text"
                                        value={anim.target || ''}
                                        onChange={(e) => handleArrayChange('animations', idx, 'target', e.target.value)}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500">Type</label>
                                    <select
                                        value={anim.type || 'move'}
                                        onChange={(e) => handleArrayChange('animations', idx, 'type', e.target.value)}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                    >
                                        <option value="move">Move To</option>
                                        <option value="move_to_object">Move To Object</option>
                                        <option value="attach_to">Attach To Parent</option>
                                        <option value="rotate">Rotate</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Fields based on Type */}
                            {anim.type === 'move' && (
                                <div className="mb-1">
                                    <label className="text-[9px] text-gray-500">Position [x, y, z]</label>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <input
                                                key={i}
                                                type="number" step="0.1"
                                                value={anim.position?.[i] ?? 0}
                                                onChange={(e) => {
                                                    const newPos = [...(anim.position || [0, 0, 0])];
                                                    newPos[i] = parseFloat(e.target.value);
                                                    handleArrayChange('animations', idx, 'position', newPos);
                                                }}
                                                className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {anim.type === 'move_to_object' && (
                                <div className="mb-1">
                                    <label className="text-[9px] text-gray-500">Destination ID</label>
                                    <input
                                        type="text"
                                        value={anim.destinationId || ''}
                                        onChange={(e) => handleArrayChange('animations', idx, 'destinationId', e.target.value)}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                        placeholder="e.g. bunsen-burner"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[9px] text-gray-500">Duration (s)</label>
                                    <input
                                        type="number" step="0.1"
                                        value={anim.duration || 1.0}
                                        onChange={(e) => handleArrayChange('animations', idx, 'duration', parseFloat(e.target.value))}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                    />
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

            {/* EFFECTS */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-purple-400 uppercase font-bold">Visual Effects</label>
                    <button
                        onClick={() => addItem('effects', { type: 'smoke', color: '#ffffff', duration: 2.0 })}
                        className="p-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/40"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                <div className="space-y-2">
                    {(step.effects || []).map((effect, idx) => (
                        <div key={idx} className="bg-black/30 border border-purple-500/20 rounded p-2 relative group">
                            <button
                                onClick={() => removeItem('effects', idx)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>

                            <div className="mb-2">
                                <label className="text-[9px] text-gray-500">Effect Type</label>
                                <select
                                    value={effect.type || 'smoke'}
                                    onChange={(e) => handleArrayChange('effects', idx, 'type', e.target.value)}
                                    className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                >
                                    <option value="smoke">Smoke 💨</option>
                                    <option value="flash">Flash 💥</option>
                                    <option value="gas">Gas Flow ♨️</option>
                                    <option value="flame_interaction">Flame Interaction 🔥</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[9px] text-gray-500">Color</label>
                                    <input
                                        type="color"
                                        value={effect.color || '#ffffff'}
                                        onChange={(e) => handleArrayChange('effects', idx, 'color', e.target.value)}
                                        className="w-full h-5 rounded bg-transparent cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500">Duration (s)</label>
                                    <input
                                        type="number" step="0.1"
                                        value={effect.duration || 1.0}
                                        onChange={(e) => handleArrayChange('effects', idx, 'duration', parseFloat(e.target.value))}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TRANSFORMATIONS (Optional) */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-green-400 uppercase font-bold">Transformations</label>
                    <button
                        onClick={() => addItem('transformations', { target: 'magnesium', newModel: '', delay: 0.5 })}
                        className="p-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/40"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                <div className="space-y-2">
                    {(step.transformations || []).map((trans, idx) => (
                        <div key={idx} className="bg-black/30 border border-green-500/20 rounded p-2 relative group">
                            <button
                                onClick={() => removeItem('transformations', idx)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] text-gray-500">Target ID</label>
                                    <input
                                        type="text"
                                        value={trans.target || ''}
                                        onChange={(e) => handleArrayChange('transformations', idx, 'target', e.target.value)}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-gray-500">New Model</label>
                                    <input
                                        type="text"
                                        value={trans.newModel || ''}
                                        onChange={(e) => handleArrayChange('transformations', idx, 'newModel', e.target.value)}
                                        className="w-full bg-black/50 border border-white/5 rounded px-1 py-0.5 text-[10px]"
                                        placeholder="ModelName"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default StepDetailEditor;
