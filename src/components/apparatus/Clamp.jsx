import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const Clamp = (props) => {
    return (
        <group {...props}>
            {/* Connection to stand */}
            <Box args={[0.3, 0.3, 0.3]}>
                <meshStandardMaterial color="#555" metalness={0.6} />
            </Box>

            {/* Arm */}
            <Cylinder args={[0.04, 0.04, 1.5, 16]} rotation={[0, 0, Math.PI / 2]} position={[0.8, 0, 0]}>
                <meshStandardMaterial color="#888" metalness={0.7} />
            </Cylinder>

            {/* Jaws */}
            <group position={[1.6, 0, 0]}>
                <Cylinder args={[0.05, 0.05, 0.4, 16]} rotation={[0, 0, 0.5]} position={[0, 0.1, 0]}>
                    <meshStandardMaterial color="#555" />
                </Cylinder>
                <Cylinder args={[0.05, 0.05, 0.4, 16]} rotation={[0, 0, -0.5]} position={[0, -0.1, 0]}>
                    <meshStandardMaterial color="#555" />
                </Cylinder>
            </group>
        </group>
    );
};

export default Clamp;
