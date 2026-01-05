// // src/components/reactions/EnergyProfile.jsx
// const EnergyProfile = ({ progress, activationEnergy }) => {
//     // Calculate the 'y' (Energy) based on 'x' (Progress)
//     // Simple Parabola logic for the "Hump"
//     const getEnergy = (p) => {
//         if (p < 0.5) return p * 2 * activationEnergy; // Up hill
//         return activationEnergy - ((p - 0.5) * 2 * activationEnergy); // Down hill
//     };

//     const currentEnergy = getEnergy(progress);

//     return (
//         <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
//             <h3 className="text-xs font-bold text-gray-400 mb-2">ENERGY PROFILE</h3>
//             <div className="relative h-24 w-full border-l border-b border-gray-500">
//                 {/* The Curve (Simplified SVG) */}
//                 <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
//                     <path 
//                         d={`M 0 100 Q 50 ${100 - (activationEnergy * 100)} 100 80`} 
//                         fill="none" 
//                         stroke="#4b5563" 
//                         strokeWidth="2" 
//                         strokeDasharray="4"
//                     />
//                 </svg>

//                 {/* The Reaction Ball */}
//                 <div 
//                     className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] transition-all duration-75"
//                     style={{ 
//                         left: `${progress * 100}%`, 
//                         bottom: `${currentEnergy * 80 + 20}%`, // Offset for baseline
//                         transform: 'translate(-50%, 50%)'
//                     }}
//                 />
                
//                 <span className="absolute bottom-[-20px] left-0 text-[10px] text-gray-500">Reactants</span>
//                 <span className="absolute bottom-[-20px] right-0 text-[10px] text-gray-500">Products</span>
//             </div>
//         </div>
//     );
// };

// export default EnergyProfile;







// src/components/reactions/EnergyProfile.jsx
import { Zap } from 'lucide-react';

const EnergyProfile = ({ progress, activationEnergy }) => {
    // Parabola logic for the "Hump"
    const getEnergy = (p) => {
        if (p < 0.5) return p * 2 * activationEnergy; 
        return activationEnergy - ((p - 0.5) * 2 * activationEnergy); 
    };

    const currentEnergy = getEnergy(progress);
    const humpHeightPercent = activationEnergy * 100;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Zap size={10} className="text-yellow-500" /> Potential Energy
                </span>
            </div>
            
            <div className="relative h-20 w-full border-l border-b border-gray-700 bg-gradient-to-tr from-gray-900/50 to-transparent rounded-tr-lg">
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-rows-4 grid-cols-4 opacity-10 pointer-events-none">
                    <div className="border-t border-white/50 w-full" />
                    <div className="border-t border-white/50 w-full row-start-2" />
                    <div className="border-t border-white/50 w-full row-start-3" />
                </div>

                {/* The Curve (SVG) */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path 
                        d={`M 0 100 Q 50 ${100 - humpHeightPercent} 100 80`} 
                        fill="none" 
                        stroke="#4b5563" 
                        strokeWidth="2" 
                        strokeDasharray="4,4"
                    />
                    {/* Active Path (fills up to progress) - Advanced aesthetic touch */}
                    <path 
                        d={`M 0 100 Q 50 ${100 - humpHeightPercent} 100 80`} 
                        fill="none" 
                        stroke="#22d3ee" 
                        strokeWidth="2"
                        strokeDasharray="300"
                        strokeDashoffset={300 - (progress * 300)}
                        className="transition-all duration-75 ease-linear"
                    />
                </svg>

                {/* The "Ball" Indicator */}
                <div 
                    className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff] z-10 transition-all duration-75"
                    style={{ 
                        left: `${progress * 100}%`, 
                        bottom: `${currentEnergy * 80 + 20}%`, 
                        transform: 'translate(-50%, 50%)'
                    }}
                />
            </div>
            
            <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono uppercase">
                <span>Reactants</span>
                <span>Transition State</span>
                <span>Products</span>
            </div>
        </div>
    );
};

export default EnergyProfile;