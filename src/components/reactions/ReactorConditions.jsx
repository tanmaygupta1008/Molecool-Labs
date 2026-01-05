// // src/components/reactions/ReactorConditions.jsx
// import { Thermometer, Gauge, Info, CheckCircle, AlertTriangle } from 'lucide-react';

// const ConditionSlider = ({ label, icon: Icon, value, onChange, min, max, unit, optimal }) => {
//     // Calculate color based on how close we are to optimal
//     const diff = Math.abs(value - optimal);
//     const range = max - min;
//     const isOptimal = diff < (range * 0.1); // Within 10% range
    
//     return (
//         <div className="mb-6">
//             <div className="flex justify-between items-center mb-2">
//                 <div className="flex items-center gap-2 text-gray-400">
//                     <Icon size={16} />
//                     <span className="text-xs font-bold uppercase">{label}</span>
//                 </div>
//                 <div className={`text-sm font-mono font-bold ${isOptimal ? 'text-green-400' : 'text-white'}`}>
//                     {value} <span className="text-xs text-gray-600">{unit}</span>
//                 </div>
//             </div>

//             <div className="relative h-2 w-full bg-gray-800 rounded-full">
//                 {/* Optimal Range Marker */}
//                 <div 
//                     className="absolute top-0 bottom-0 bg-green-500/20 z-0"
//                     style={{ 
//                         left: `${((optimal - (max*0.1) - min) / (max - min)) * 100}%`, 
//                         width: '10%' // 10% tolerance zone
//                     }} 
//                 />
//                 <div 
//                     className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-green-500 z-0 opacity-50"
//                     style={{ left: `${((optimal - min) / (max - min)) * 100}%` }} 
//                 />

//                 <input 
//                     type="range" 
//                     min={min} 
//                     max={max} 
//                     value={value} 
//                     onChange={(e) => onChange(Number(e.target.value))}
//                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//                 />
//                 <div 
//                     className={`absolute top-0 left-0 h-full rounded-full transition-all duration-75 ${isOptimal ? 'bg-green-500' : 'bg-cyan-500'}`}
//                     style={{ width: `${((value - min) / (max - min)) * 100}%` }}
//                 />
                
//                 {/* Thumb Graphic */}
//                 <div 
//                     className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-black pointer-events-none transition-all duration-75"
//                     style={{ left: `${((value - min) / (max - min)) * 100}%` }}
//                 />
//             </div>
            
//             <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
//                 <span>{min}{unit}</span>
//                 <span>{max}{unit}</span>
//             </div>
//         </div>
//     );
// };

// const ReactorConditions = ({ conditions, setConditions, optimalConditions }) => {
//     // Check if overall conditions are good for reaction
//     const isTempGood = Math.abs(conditions.temp - optimalConditions.temp) < 50;
//     const isPressureGood = Math.abs(conditions.pressure - optimalConditions.pressure) < (optimalConditions.pressure * 0.2); // 20% tolerance
//     const isOptimized = isTempGood && isPressureGood;

//     return (
//         <div className="bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl w-72">
//             <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
//                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reactor Conditions</h3>
//                 {isOptimized ? (
//                     <CheckCircle size={16} className="text-green-500" />
//                 ) : (
//                     <AlertTriangle size={16} className="text-yellow-500" />
//                 )}
//             </div>

//             <ConditionSlider 
//                 label="Temperature" 
//                 icon={Thermometer} 
//                 value={conditions.temp} 
//                 onChange={(v) => setConditions(prev => ({ ...prev, temp: v }))}
//                 min={0} 
//                 max={1000} 
//                 unit="°C"
//                 optimal={optimalConditions.temp}
//             />

//             <ConditionSlider 
//                 label="Pressure" 
//                 icon={Gauge} 
//                 value={conditions.pressure} 
//                 onChange={(v) => setConditions(prev => ({ ...prev, pressure: v }))}
//                 min={1} 
//                 max={300} 
//                 unit=" atm"
//                 optimal={optimalConditions.pressure}
//             />

//             <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${isOptimized ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'}`}>
//                 <div className="flex gap-2">
//                     <Info size={14} className="shrink-0 mt-0.5" />
//                     <p>{optimalConditions.desc}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ReactorConditions;





// src/components/reactions/ReactorConditions.jsx
import { Thermometer, Gauge, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const ConditionSlider = ({ label, icon: Icon, value, onChange, min, max, unit, optimal }) => {
    const diff = Math.abs(value - optimal);
    const range = max - min;
    const isOptimal = diff < (range * 0.1); 
    
    // Reduced mb-6 to mb-4 for compactness
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-gray-400">
                    <Icon size={16} />
                    <span className="text-xs font-bold uppercase">{label}</span>
                </div>
                <div className={`text-sm font-mono font-bold ${isOptimal ? 'text-green-400' : 'text-white'}`}>
                    {value} <span className="text-xs text-gray-600">{unit}</span>
                </div>
            </div>

            <div className="relative h-2 w-full bg-gray-800 rounded-full">
                {/* Optimal Range Marker */}
                <div 
                    className="absolute top-0 bottom-0 bg-green-500/20 z-0"
                    style={{ 
                        left: `${((optimal - (max*0.1) - min) / (max - min)) * 100}%`, 
                        width: '10%' 
                    }} 
                />
                <div 
                    className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-green-500 z-0 opacity-50"
                    style={{ left: `${((optimal - min) / (max - min)) * 100}%` }} 
                />

                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-75 ${isOptimal ? 'bg-green-500' : 'bg-cyan-500'}`}
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                />
                
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-black pointer-events-none transition-all duration-75"
                    style={{ left: `${((value - min) / (max - min)) * 100}%` }}
                />
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

const ReactorConditions = ({ conditions, setConditions, optimalConditions }) => {
    const isTempGood = Math.abs(conditions.temp - optimalConditions.temp) < 50;
    const isPressureGood = Math.abs(conditions.pressure - optimalConditions.pressure) < (optimalConditions.pressure * 0.2); 
    const isOptimized = isTempGood && isPressureGood;

    return (
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-xl w-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reactor Conditions</h3>
                {isOptimized ? (
                    <CheckCircle size={16} className="text-green-500" />
                ) : (
                    <AlertTriangle size={16} className="text-yellow-500" />
                )}
            </div>

            <ConditionSlider 
                label="Temperature" 
                icon={Thermometer} 
                value={conditions.temp} 
                onChange={(v) => setConditions(prev => ({ ...prev, temp: v }))}
                min={0} 
                max={1000} 
                unit="°C"
                optimal={optimalConditions.temp}
            />

            <ConditionSlider 
                label="Pressure" 
                icon={Gauge} 
                value={conditions.pressure} 
                onChange={(v) => setConditions(prev => ({ ...prev, pressure: v }))}
                min={1} 
                max={300} 
                unit=" atm"
                optimal={optimalConditions.pressure}
            />

            <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${isOptimized ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'}`}>
                <div className="flex gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p>{optimalConditions.desc}</p>
                </div>
            </div>
        </div>
    );
};

export default ReactorConditions;