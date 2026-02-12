import React from 'react';
import { Box } from '@react-three/drei';

const HeatproofMat = (props) => {
    return (
        <group {...props}>
            <Box args={[3, 0.05, 3]}>
                <meshStandardMaterial color="#ccc" map={null} roughness={1} />
                {/* Simulating fibrous texture roughly with noise if we had it, but solid gray/white is standard */}
            </Box>
            <Box args={[2.8, 0.06, 2.8]} position={[0, 0, 0]}> {/* slightly raised inner area for visual detail */}
                <meshStandardMaterial color="#dcdcdc" roughness={1} />
            </Box>
        </group>
    );
};

export default HeatproofMat;
