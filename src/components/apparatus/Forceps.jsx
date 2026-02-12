import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const Forceps = (props) => {
    return (
        <group {...props}>
            {/* Similar to Tongs but straighter and smaller/finer */}
            {/* Pivot */}
            <Cylinder args={[0.03, 0.03, 0.08, 16]} rotation={[0, 0, Math.PI / 2]} position={[-1, 0, 0]}>
                <meshStandardMaterial color="#999" metalness={0.8} />
            </Cylinder>

            {/* Arms */}
            <Box args={[2, 0.02, 0.04]} position={[0, 0.05, 0]} rotation={[0, 0, -0.05]}>
                <meshStandardMaterial color="#aaa" metalness={0.7} />
            </Box>
            <Box args={[2, 0.02, 0.04]} position={[0, -0.05, 0]} rotation={[0, 0, 0.05]}>
                <meshStandardMaterial color="#aaa" metalness={0.7} />
            </Box>
        </group>
    );
};

export default Forceps;
