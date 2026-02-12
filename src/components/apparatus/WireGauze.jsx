import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const WireGauze = (props) => {
    return (
        <group {...props}>
            {/* Mesh/Grid */}
            <Box args={[2.2, 0.02, 2.2]} position={[0, 0, 0]}>
                <meshStandardMaterial
                    color="#a0a0a0"
                    metalness={0.5}
                    roughness={0.8}
                    map={null} // In a real app we'd use a grid texture here, but for now a solid color with opacity or wireframe-like look
                    transparent={true}
                    opacity={0.8}
                />
            </Box>

            {/* Ceramic Center */}
            <Cylinder args={[0.6, 0.6, 0.03, 32]} position={[0, 0.005, 0]}>
                <meshStandardMaterial color="#eee" roughness={0.9} />
            </Cylinder>
        </group>
    );
};

export default WireGauze;
