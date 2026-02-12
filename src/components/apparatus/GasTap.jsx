import React from 'react';
import { Cylinder, Box } from '@react-three/drei';

const GasTap = (props) => {
    return (
        <group {...props}>
            {/* Base mounting */}
            <Box args={[0.4, 0.1, 0.4]}>
                <meshStandardMaterial color="#555" />
            </Box>
            {/* Vertical body */}
            <Cylinder args={[0.1, 0.1, 0.4, 16]} position={[0, 0.2, 0]}>
                <meshStandardMaterial color="#d4af37" metalness={0.8} /> {/* Brass */}
            </Cylinder>
            {/* Nozzle/Outlet */}
            <Cylinder args={[0.05, 0.04, 0.3, 16]} position={[0.15, 0.3, 0]} rotation={[0, 0, -Math.PI / 2.5]}>
                <meshStandardMaterial color="#d4af37" metalness={0.8} />
            </Cylinder>
            {/* Handle */}
            <Box args={[0.05, 0.4, 0.05]} position={[0, 0.45, 0]} rotation={[0, 0, 0]}>
                <meshStandardMaterial color="#2d2d2d" />
            </Box>
        </group>
    );
};

export default GasTap;
