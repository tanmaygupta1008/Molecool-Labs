import React from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';

const WaterSource = ({ outlets = 1, ...props }) => {
    // Similar to gas source, but standard curved lab sink taps
    const nozzles = [];
    const angleStep = (Math.PI * 2) / Math.max(1, outlets);
    
    for (let i = 0; i < outlets; i++) {
        const angle = i * angleStep;
        nozzles.push(
            <group key={i} rotation={[0, angle, 0]} position={[0, 0.8, 0]}>
                {/* Horizontal Pipe (high up) */}
                <Cylinder args={[0.035, 0.035, 0.6, 16]} position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#eee" metalness={0.9} roughness={0.1} />
                </Cylinder>
                {/* Downward Nozzle tip (long) */}
                <Cylinder args={[0.035, 0.02, 0.25, 16]} position={[0.6, -0.125, 0]}>
                    <meshStandardMaterial color="#eee" metalness={0.9} roughness={0.1} />
                </Cylinder>
                {/* Round Knob */}
                <Sphere args={[0.06, 16, 16]} position={[0.1, 0.05, 0]}>
                    <meshStandardMaterial color="#222" metalness={0.2} roughness={0.8} />
                </Sphere>
            </group>
        );
    }

    return (
        <group {...props}>
            {/* Base plate */}
            <Cylinder args={[0.15, 0.15, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshStandardMaterial color="#eee" metalness={0.9} roughness={0.1} />
            </Cylinder>
            
            {/* Central Tall Pillar */}
            <Cylinder args={[0.05, 0.05, 0.8, 32]} position={[0, 0.4, 0]}>
                <meshStandardMaterial color="#eee" metalness={0.9} roughness={0.1} />
            </Cylinder>
            
            {nozzles}
        </group>
    );
};

export default WaterSource;
