import React from 'react';
import { Cylinder, Box, Sphere } from '@react-three/drei';

const Burette = (props) => {
    return (
        <group {...props}>
            {/* Main Tube */}
            <Cylinder args={[0.08, 0.08, 4, 32, 1, true]} position={[0, 2, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    side={2}
                />
            </Cylinder>

            {/* Markings */}
            {[0, 1, 2, 3].map((y, i) => (
                <Cylinder key={i} args={[0.082, 0.082, 0.01, 32]} position={[0, y + 0.5, 0]}>
                    <meshBasicMaterial color="#000" opacity={0.5} transparent />
                </Cylinder>
            ))}

            {/* Valve/Stopcock */}
            <group position={[0, 0, 0]}>
                <Sphere args={[0.12, 16, 16]}>
                    <meshStandardMaterial color="#fff" roughness={0.5} />
                </Sphere>
                <Box args={[0.3, 0.05, 0.1]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#eeddcc" />
                </Box>
            </group>

            {/* Tip */}
            <Cylinder args={[0.08, 0.02, 0.5, 16]} position={[0, -0.3, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.4} transparent />
            </Cylinder>
        </group>
    );
};

export default Burette;
