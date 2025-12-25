// src/components/reactions/ReactionControls.jsx
import { Play, Pause, RotateCcw } from 'lucide-react'; // Assuming you have lucide-react or use similar icons

const ReactionControls = ({ progress, setProgress, isPlaying, togglePlay }) => {
    
    const handleSliderChange = (e) => {
        setProgress(parseFloat(e.target.value));
    };

    const handleReset = () => {
        setProgress(0);
    };

    // Format progress as percentage for display
    const percentage = Math.round(progress * 100);

    return (
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            {/* Timeline Slider */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-12">0%</span>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.001" 
                    value={progress} 
                    onChange={handleSliderChange}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
                />
                <span className="text-xs font-mono text-gray-400 w-12 text-right">100%</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={togglePlay}
                        className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'}`}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    
                    <button 
                        onClick={handleReset}
                        className="p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-600 transition-all"
                        title="Reset Reaction"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</p>
                    <p className={`text-sm font-bold ${percentage === 100 ? 'text-green-400' : percentage === 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                        {percentage === 0 ? "REACTANTS" : percentage === 100 ? "PRODUCTS" : "REACTING..."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReactionControls;