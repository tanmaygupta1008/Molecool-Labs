import React from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';

const GasSource = ({ outlets = 2, ...props }) => {
    const nozzles = [];
    const angleStep = (Math.PI * 2) / Math.max(1, outlets);
    
    for (let i = 0; i < outlets; i++) {
        const angle = i * angleStep;
        nozzles.push(
            <group key={i} rotation={[0, angle, 0]} position={[0, 0.4, 0]}>
                {/* Horizontal Pipe */}
                <Cylinder args={[0.03, 0.03, 0.5, 16]} position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
                </Cylinder>
                {/* Downward Nozzle tip */}
                <Cylinder args={[0.02, 0.03, 0.1, 16]} position={[0.48, -0.05, 0]} rotation={[0, 0, 0]}>
                    <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
                </Cylinder>
                {/* Knob (gas valve) */}
                <Box args={[0.02, 0.08, 0.15]} position={[0.15, 0.06, 0]}>
                    <meshStandardMaterial color="#eecc22" metalness={0.4} roughness={0.5} />
                </Box>
            </group>
        );
    }

    return (
        <group {...props}>
            {/* Base */}
            <Cylinder args={[0.2, 0.25, 0.1, 32]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#444" roughness={0.7} />
            </Cylinder>
            
            {/* Central Pillar */}
            <Cylinder args={[0.08, 0.08, 0.5, 32]} position={[0, 0.3, 0]}>
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
            </Cylinder>
            
            {/* Cap */}
            <Sphere args={[0.09, 16, 16]} position={[0, 0.55, 0]}>
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
            </Sphere>

            {nozzles}
        </group>
    );
};

export default GasSource;
