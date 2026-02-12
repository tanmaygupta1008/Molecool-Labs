import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const SafetyShield = (props) => {
    return (
        <group {...props}>
            {/* Transparent pane */}
            <Box args={[3, 2, 0.1]} position={[0, 1, 0]}>
                <meshPhysicalMaterial
                    color="#ccffff"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                />
            </Box>
            {/* Frame/Feet */}
            <Box args={[3.2, 0.1, 0.2]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#333" />
            </Box>
            <Box args={[3.2, 0.1, 0.2]} position={[0, 2, 0]}>
                <meshStandardMaterial color="#333" />
            </Box>
        </group>
    );
};

export default SafetyShield;
