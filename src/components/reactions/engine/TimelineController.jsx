'use client';
// src/components/reactions/engine/TimelineController.jsx

import React from 'react';

// A generic UI scrubber that controls a [0...1] progress value
const TimelineController = ({ progress, setProgress, isPlaying, setIsPlaying }) => {

    // Convert 0-1 to 0-100 for the slider
    const value = progress * 100;

    const handleSliderChange = (e) => {
        const val = parseFloat(e.target.value) / 100;
        setProgress(val);
        // Pause if user manually scrubs
        if (isPlaying) setIsPlaying(false);
    };

    return (
        <div className="bg-gray-900 border-t border-cyan-800 p-4 w-full flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
                <span>Reaction Start (0.00)</span>
                <span className="text-cyan-400 font-bold">{progress.toFixed(2)}</span>
                <span>Products Formed (1.00)</span>
            </div>

            <div className="flex gap-4 items-center">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                </button>

                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={value}
                    onChange={handleSliderChange}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />

                <button
                    onClick={() => { setProgress(0); setIsPlaying(false); }}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm font-semibold transition sm:block hidden"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default TimelineController;
