// src/components/reactions/EnergyProfile.jsx
const EnergyProfile = ({ progress, activationEnergy }) => {
    // Calculate the 'y' (Energy) based on 'x' (Progress)
    // Simple Parabola logic for the "Hump"
    const getEnergy = (p) => {
        if (p < 0.5) return p * 2 * activationEnergy; // Up hill
        return activationEnergy - ((p - 0.5) * 2 * activationEnergy); // Down hill
    };

    const currentEnergy = getEnergy(progress);

    return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 mb-2">ENERGY PROFILE</h3>
            <div className="relative h-24 w-full border-l border-b border-gray-500">
                {/* The Curve (Simplified SVG) */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path 
                        d={`M 0 100 Q 50 ${100 - (activationEnergy * 100)} 100 80`} 
                        fill="none" 
                        stroke="#4b5563" 
                        strokeWidth="2" 
                        strokeDasharray="4"
                    />
                </svg>

                {/* The Reaction Ball */}
                <div 
                    className="absolute w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] transition-all duration-75"
                    style={{ 
                        left: `${progress * 100}%`, 
                        bottom: `${currentEnergy * 80 + 20}%`, // Offset for baseline
                        transform: 'translate(-50%, 50%)'
                    }}
                />
                
                <span className="absolute bottom-[-20px] left-0 text-[10px] text-gray-500">Reactants</span>
                <span className="absolute bottom-[-20px] right-0 text-[10px] text-gray-500">Products</span>
            </div>
        </div>
    );
};

export default EnergyProfile;