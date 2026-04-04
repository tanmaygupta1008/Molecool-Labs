import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

const WorkTable = ({ width = 6, depth = 4, ...props }) => {
    const tableTopHeight = 0.2;
    // Ground is at Y = -4.0. Top surface of table is at Y = 0.
    // Tabletop occupies Y = -0.2 to Y = 0. (Center Y = -0.1)
    // Legs go from Y = -4.0 to Y = -0.2. (Length = 3.8, Center Y = -2.1)
    
    return (
        <group {...props}>
            {/* Table Top */}
            <Box args={[width, tableTopHeight, depth]} position={[0, -tableTopHeight / 2, 0]} receiveShadow castShadow>
                <meshStandardMaterial color="#383838" roughness={0.8} metalness={0.1} />
            </Box>
            
            {/* Legs */}
            <Cylinder args={[0.08, 0.08, 3.8, 16]} position={[width/2 - 0.3, -2.1, depth/2 - 0.3]} castShadow>
                <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 3.8, 16]} position={[-width/2 + 0.3, -2.1, depth/2 - 0.3]} castShadow>
                <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 3.8, 16]} position={[width/2 - 0.3, -2.1, -depth/2 + 0.3]} castShadow>
                <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 3.8, 16]} position={[-width/2 + 0.3, -2.1, -depth/2 + 0.3]} castShadow>
                <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
            </Cylinder>
        </group>
    );
};

export default WorkTable;
