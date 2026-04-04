import React from 'react';
import * as THREE from 'three';
import { Torus, Cylinder, Box } from '@react-three/drei';

const RingClamp = ({ ringRadius = 1.2, extendLength = 0, ...props }) => {
    // A ring clamp is a horizontal metal ring with a rod extending backwards, 
    // terminating in a bosshead fixture to attach to the retort stand.
    
    const r = ringRadius;
    const baseLength = 3.0;
    const rodLength = baseLength + extendLength - r; // Distance from ring edge to bosshead center
    const rodCenterZ = -(r + baseLength + extendLength) / 2; // Midpoint 

    return (
        <group {...props}>
            {/* The Ring */}
            <Torus args={[r, 0.08, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#909090" roughness={0.4} metalness={0.9} />
            </Torus>
            
            {/* Thick reinforced joint where rod meets ring */}
            <Box args={[0.25, 0.15, 0.4]} position={[0, 0, -r]}>
                <meshStandardMaterial color="#909090" roughness={0.4} metalness={0.9} />
            </Box>

            {/* The Rod extending back to the stand */}
            <Cylinder args={[0.08, 0.08, rodLength, 16]} position={[0, 0, rodCenterZ]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#909090" roughness={0.4} metalness={0.9} />
            </Cylinder>
            
            {/* --- Bosshead Clamp Structure --- */}
            <group position={[0, 0, -(baseLength + extendLength)]}>
                {/* Horizontal block connecting rod to the vertical sleeve */}
                <Box args={[0.3, 0.3, 0.3]} position={[0, 0, 0.15]}>
                    <meshStandardMaterial color="#888888" roughness={0.6} metalness={0.8} />
                </Box>
                
                {/* Vertical sleeve slot (for retort stand pole to pass through) */}
                <Cylinder args={[0.2, 0.2, 0.6, 32]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#888888" roughness={0.6} metalness={0.8} />
                </Cylinder>
                <Cylinder args={[0.1, 0.1, 0.61, 32]} position={[0, 0, 0]}>
                    {/* The empty hole inside the sleeve */}
                    <meshBasicMaterial color="#1a1a1a" />
                </Cylinder>

                {/* Thumbscrew mechanism */}
                <group position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    {/* Screw threading/stem */}
                    <Cylinder args={[0.04, 0.04, 0.4, 16]}>
                        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.9} />
                    </Cylinder>
                    {/* Flat thumb paddle/wing nut head */}
                    <Box args={[0.25, 0.05, 0.1]} position={[0, 0.2, 0]}>
                        <meshStandardMaterial color="#eeeeee" roughness={0.3} metalness={0.6} />
                    </Box>
                </group>
            </group>
        </group>
    );
};

export default RingClamp;
