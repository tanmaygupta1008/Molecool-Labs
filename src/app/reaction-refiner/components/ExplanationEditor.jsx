import React from 'react';
import { Plus, Trash2, MessageSquareText } from 'lucide-react';

const ExplanationEditor = ({
    explanationTimeline = [],
    onChange,
    onSelectBlock,
    selectedBlockId
}) => {
    const blocks = Array.isArray(explanationTimeline) ? explanationTimeline : [];

    const handleAddExplanation = () => {
        const newBlock = {
            id: `exp_${Date.now()}`,
            text: `New Explanation`,
            startTime: 0,
            duration: 5
        };
        onChange([...blocks, newBlock]);
        onSelectBlock(newBlock.id);
    };

    const handleRemoveBlock = (id, e) => {
        e.stopPropagation();
        onChange(blocks.filter(b => b.id !== id));
        if (selectedBlockId === id) onSelectBlock(null);
    };

    const updateText = (id, newText) => {
        onChange(blocks.map(b => b.id === id ? { ...b, text: newText } : b));
    };

    const updateTiming = (id, field, value) => {
        const parsedValue = Math.max(0, value); // never negative

        onChange(blocks.map(b => {
            if (b.id !== id) return b;
            
            const newBlock = { ...b, [field]: parsedValue };
            
            // Anti-collision logic
            const isColliding = blocks.some(other => {
                if (other.id === id) return false;
                const startA = newBlock.startTime;
                const endA = newBlock.startTime + newBlock.duration;
                const startB = other.startTime;
                const endB = other.startTime + other.duration;
                return (startA < endB - 0.01) && (endA > startB + 0.01);
            });

            // If user types an overlapping value, we ignore it to protect timeline integrity
            if (isColliding) {
                return b;
            }

            return newBlock;
        }));
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#222]">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                    <MessageSquareText size={14} className="text-purple-400" /> Reaction Explanations
                </h3>
                <button
                    onClick={handleAddExplanation}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors text-[10px] font-bold"
                    title="Add Explanation"
                >
                    <Plus size={12} /> ADD
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-4 custom-scrollbar">
                {blocks.map((block, i) => {
                    const isSelected = selectedBlockId === block.id;

                    return (
                        <div
                            key={block.id}
                            onClick={() => onSelectBlock(block.id)}
                            className={`
                                relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col
                                ${isSelected
                                    ? 'bg-gradient-to-br from-[#2d1b36] to-[#1a1025] border-purple-500/40 shadow-lg shadow-purple-900/10'
                                    : 'bg-[#151515] border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]'
                                }
                            `}
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between p-2 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-purple-400/80 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {isSelected ? (
                                        <div className="flex items-center gap-1">
                                            <input 
                                                type="number" 
                                                value={block.startTime} 
                                                onChange={(e) => updateTiming(block.id, 'startTime', parseFloat(e.target.value) || 0)}
                                                className="w-12 bg-black/40 border border-white/10 rounded px-1 text-[10px] text-purple-400 font-mono text-center focus:outline-none focus:border-purple-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-[10px] text-gray-500">s -</span>
                                            <input 
                                                type="number" 
                                                value={block.duration} 
                                                onChange={(e) => updateTiming(block.id, 'duration', parseFloat(e.target.value) || 0)}
                                                className="w-12 bg-black/40 border border-white/10 rounded px-1 text-[10px] text-purple-400 font-mono text-center focus:outline-none focus:border-purple-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-[10px] text-gray-500">s</span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-gray-400 font-mono">
                                            [{block.startTime}s - {parseFloat(block.startTime + block.duration).toFixed(1)}s]
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => handleRemoveBlock(block.id, e)}
                                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Editor */}
                            <div className="p-3">
                                {isSelected ? (
                                    <textarea
                                        value={block.text}
                                        onChange={(e) => updateText(block.id, e.target.value)}
                                        placeholder="Write reaction explanation here..."
                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-md p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500/50 resize-none"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400 line-clamp-2 italic">
                                        {block.text || 'No explanation text...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {blocks.length === 0 && (
                    <div className="text-center text-gray-600 text-xs py-10 border border-dashed border-white/5 rounded-lg flex flex-col items-center gap-2">
                        <MessageSquareText size={24} className="opacity-50" />
                        No explanations defined.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplanationEditor;
