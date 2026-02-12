import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const PowerSupply = (props) => {
    return (
        <group {...props}>
            {/* Box Case */}
            <Box args={[2, 1, 1.5]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#ddd" roughness={0.4} />
            </Box>

            {/* Display Screen */}
            <Box args={[1, 0.3, 0.05]} position={[0, 0.7, 0.75]}>
                <meshStandardMaterial color="#000" />
            </Box>

            {/* Knobs */}
            <Cylinder args={[0.1, 0.1, 0.1, 16]} position={[-0.5, 0.3, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>
            <Cylinder args={[0.1, 0.1, 0.1, 16]} position={[0.5, 0.3, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>

            {/* Terminals */}
            <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[-0.8, 0.3, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#d00" /> {/* Positive */}
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[0.8, 0.3, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#000" /> {/* Negative */}
            </Cylinder>
        </group>
    );
};

export default PowerSupply;
