import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const ElectrolysisSetup = (props) => {
    return (
        <group {...props}>
            {/* Beaker Container */}
            <Cylinder args={[1, 0.9, 1.5, 32, 1, true]} position={[0, 0.75, 0]}>
                <meshPhysicalMaterial color="#ccddff" transmission={0.9} opacity={0.6} transparent side={2} />
            </Cylinder>
            <Cylinder args={[0.9, 0.9, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial color="#ccddff" transmission={0.9} opacity={0.6} transparent />
            </Cylinder>

            {/* Electrodes */}
            <Box args={[0.2, 1.2, 0.05]} position={[-0.3, 0.7, 0]}>
                <meshStandardMaterial color="#222" metalness={0.8} /> {/* Graphite anode */}
            </Box>
            <Box args={[0.2, 1.2, 0.05]} position={[0.3, 0.7, 0]}>
                <meshStandardMaterial color="#b87333" metalness={0.9} /> {/* Copper cathode example */}
            </Box>

            {/* Wires */}
            <Cylinder args={[0.02, 0.02, 0.5]} position={[-0.3, 1.4, 0]}>
                <meshStandardMaterial color="#d00" /> {/* Red wire */}
            </Cylinder>
            <Cylinder args={[0.02, 0.02, 0.5]} position={[0.3, 1.4, 0]}>
                <meshStandardMaterial color="#000" /> {/* Black wire */}
            </Cylinder>
        </group>
    );
};

export default ElectrolysisSetup;
