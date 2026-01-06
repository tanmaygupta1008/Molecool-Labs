// // src/components/reactions/ReactionControls.jsx
// import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

// const ReactionControls = ({ progress, setProgress, isPlaying, togglePlay }) => {
//     const percentage = Math.round(progress * 100);


//     return (
//         <div className="group relative">
//             {/* Glowing Backdrop */}
//             <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
//             <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-6">
                
//                 {/* Play/Pause Button - Big and Tactile */}
//                 <button 
//                     onClick={togglePlay}
//                     className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg border border-white/10 ${
//                         isPlaying 
//                         ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
//                         : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'
//                     }`}
//                 >
//                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
//                 </button>

//                 {/* Timeline Section */}
//                 <div className="flex-1 flex flex-col gap-2">
//                     <div className="flex justify-between items-end">
//                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
//                             <Activity size={12} className={isPlaying ? "animate-pulse text-cyan-400" : ""} />
//                             Reaction Progress
//                         </span>
//                         <span className="font-mono text-cyan-400 font-bold">{percentage}%</span>
//                     </div>

//                     {/* Custom Styled Slider */}
//                     <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden">
//                         {/* Progress Bar Fill */}
//                         <div 
//                             className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-100 ease-out"
//                             style={{ width: `${percentage}%` }}
//                         />
//                         {/* Invisible Input for Interaction */}
//                         <input 
//                             type="range" 
//                             min="0" 
//                             max="1" 
//                             step="0.001" 
//                             value={progress} 
//                             onChange={(e) => setProgress(parseFloat(e.target.value))}
//                             className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
//                         />
//                     </div>
//                 </div>

//                 {/* Reset Action */}
//                 <button 
//                     onClick={() => setProgress(0)}
//                     className="p-3 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
//                     title="Reset Simulation"
//                 >
//                     <RotateCcw size={20} />
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default ReactionControls;







// src/components/reactions/ReactionControls.jsx
import { Play, Pause, RotateCcw, Activity, Gauge } from 'lucide-react';

const ReactionControls = ({ progress, setProgress, isPlaying, togglePlay, speed, setSpeed }) => {
    
    const percentage = Math.round(progress * 100);

    // Cycle through speeds: 1x -> 2x -> 0.5x -> 1x
    const cycleSpeed = () => {
        if (speed === 1) setSpeed(2);
        else if (speed === 2) setSpeed(0.5);
        else setSpeed(1);
    };

    return (
        <div className="group relative">
            {/* Glowing Backdrop */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-6">
                
                {/* Play/Pause Button */}
                <button 
                    onClick={togglePlay}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg border border-white/10 shrink-0 ${
                        isPlaying 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                        : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                    }`}
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>

                {/* Timeline Section */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Activity size={12} className={isPlaying ? "animate-pulse text-cyan-400" : ""} />
                            Reaction Progress
                        </span>
                        <div className="flex gap-4">
                            <span className="font-mono text-cyan-400 font-bold">{percentage}%</span>
                        </div>
                    </div>

                    <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden group/slider">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-100 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.001" 
                            value={progress} 
                            onChange={(e) => setProgress(parseFloat(e.target.value))}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                    
                    {/* 🆕 SPEED CONTROL */}
                    <button 
                        onClick={cycleSpeed}
                        className="flex flex-col items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors group/speed relative"
                        title="Toggle Simulation Speed"
                    >
                        <span className="text-xs font-bold font-mono">{speed}x</span>
                        <Gauge size={12} className="opacity-50 mt-0.5" />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-black px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover/speed:opacity-100 pointer-events-none whitespace-nowrap border border-white/20">
                            Speed
                        </div>
                    </button>

                    {/* Reset Button */}
                    <button 
                        onClick={() => setProgress(0)}
                        className="p-2.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Reset Simulation"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReactionControls;