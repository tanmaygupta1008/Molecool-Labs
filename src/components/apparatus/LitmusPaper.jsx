import React from 'react';
import { Box } from '@react-three/drei';

const LitmusPaper = ({ color = "red", paperColor, reactantColorOverrides, ...props }) => {
    // Determine color
    // 1. If visual engine overrides the color (via state transition), use it
    const visualOverride = paperColor || (reactantColorOverrides && Object.values(reactantColorOverrides)[0]);
    
    // 2. Otherwise use the base 'red'/'blue' mapping or a raw hex if 'color' passed is hex
    let finalColor = color;
    if (color === "red") finalColor = "#ff6666";
    if (color === "blue") finalColor = "#6688ff";
    
    if (visualOverride) {
        finalColor = visualOverride;
    }

    return (
        <group {...props}>
            <Box args={[0.1, 0.6, 0.005]}>
                <meshStandardMaterial color={finalColor} roughness={1} />
            </Box>
        </group>
    );
};

export default LitmusPaper;
