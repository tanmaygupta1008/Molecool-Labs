// // src/components/reactions/ReactionControls.jsx
// import { Play, Pause, RotateCcw } from 'lucide-react'; // Assuming you have lucide-react or use similar icons

// const ReactionControls = ({ progress, setProgress, isPlaying, togglePlay }) => {
    
//     const handleSliderChange = (e) => {
//         setProgress(parseFloat(e.target.value));
//     };

//     const handleReset = () => {
//         setProgress(0);
//     };

//     // Format progress as percentage for display
//     const percentage = Math.round(progress * 100);

//     return (
//         <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
//             {/* Timeline Slider */}
//             <div className="flex items-center gap-3">
//                 <span className="text-xs font-mono text-gray-400 w-12">0%</span>
//                 <input 
//                     type="range" 
//                     min="0" 
//                     max="1" 
//                     step="0.001" 
//                     value={progress} 
//                     onChange={handleSliderChange}
//                     className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
//                 />
//                 <span className="text-xs font-mono text-gray-400 w-12 text-right">100%</span>
//             </div>

//             {/* Control Buttons */}
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                     <button 
//                         onClick={togglePlay}
//                         className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'}`}
//                     >
//                         {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
//                     </button>
                    
//                     <button 
//                         onClick={handleReset}
//                         className="p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-600 transition-all"
//                         title="Reset Reaction"
//                     >
//                         <RotateCcw size={18} />
//                     </button>
//                 </div>

//                 <div className="text-right">
//                     <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
//                     <p className={`text-sm font-bold ${percentage === 100 ? 'text-green-400' : percentage === 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
//                         {percentage === 0 ? "REACTANTS" : percentage === 100 ? "PRODUCTS" : "REACTING..."}
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ReactionControls;






// src/components/reactions/ReactionControls.jsx
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

const ReactionControls = ({ progress, setProgress, isPlaying, togglePlay }) => {
    const percentage = Math.round(progress * 100);


    return (
        <div className="group relative">
            {/* Glowing Backdrop */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-6">
                
                {/* Play/Pause Button - Big and Tactile */}
                <button 
                    onClick={togglePlay}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg border border-white/10 ${
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
                        <span className="font-mono text-cyan-400 font-bold">{percentage}%</span>
                    </div>

                    {/* Custom Styled Slider */}
                    <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        {/* Progress Bar Fill */}
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-100 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                        {/* Invisible Input for Interaction */}
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

                {/* Reset Action */}
                <button 
                    onClick={() => setProgress(0)}
                    className="p-3 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Reset Simulation"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
};

export default ReactionControls;