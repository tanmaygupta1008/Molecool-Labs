import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const RetortStand = (props) => {
    return (
        <group {...props}>
            {/* Base */}
            <Box args={[2, 0.1, 1.2]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </Box>

            {/* Vertical Rod */}
            <Cylinder args={[0.05, 0.05, 5, 16]} position={[0, 2.55, -0.4]}>
                <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
            </Cylinder>
        </group>
    );
};

export default RetortStand;
