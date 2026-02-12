import React from 'react';
import { Box } from '@react-three/drei';

const LitmusPaper = ({ color = "red", ...props }) => {
    return (
        <group {...props}>
            <Box args={[0.1, 0.6, 0.005]}>
                <meshStandardMaterial color={color === "blue" ? "#6688ff" : "#ff6666"} roughness={1} />
            </Box>
        </group>
    );
};

export default LitmusPaper;
