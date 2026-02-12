import React from 'react';
import { Cylinder, Sphere } from '@react-three/drei';

const DropperBottle = (props) => {
    return (
        <group {...props}>
            {/* Bottle Body */}
            <Cylinder args={[0.3, 0.3, 0.6, 32]} position={[0, 0.3, 0]}>
                <meshPhysicalMaterial color="#8B4513" transmission={0.6} opacity={0.9} transparent roughness={0.2} /> {/* Amber glass */}
            </Cylinder>
            <Sphere args={[0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.6, 0]}>
                <meshPhysicalMaterial color="#8B4513" transmission={0.6} opacity={0.9} transparent roughness={0.2} />
            </Sphere>

            {/* Cap/Dropper Top */}
            <Cylinder args={[0.1, 0.1, 0.2, 16]} position={[0, 0.8, 0]}>
                <meshStandardMaterial color="#222" />
            </Cylinder>
            <Sphere args={[0.12, 16, 16]} position={[0, 0.95, 0]} scale={[1, 0.8, 1]}>
                <meshStandardMaterial color="#222" />
            </Sphere>
        </group>
    );
};

export default DropperBottle;
