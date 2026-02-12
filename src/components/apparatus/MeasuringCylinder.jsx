import React from 'react';
import { Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

const MeasuringCylinder = (props) => {
    return (
        <group {...props}>
            {/* Base - Hexagonal */}
            <Cylinder args={[0.6, 0.6, 0.2, 6]} position={[0, 0.1, 0]}>
                <meshPhysicalMaterial color="#e0f7fa" transmission={0.6} opacity={0.8} transparent />
            </Cylinder>

            {/* Cylinder Body */}
            <Cylinder args={[0.25, 0.25, 3, 32, 1, true]} position={[0, 1.6, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                />
            </Cylinder>

            {/* Spout/Rim - Replaced solid cylinder with Torus */}
            <Torus args={[0.25, 0.03, 16, 32]} position={[0, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.5} transparent />
            </Torus>

            {/* Markings */}
            {[0.5, 1, 1.5, 2, 2.5].map((y, i) => (
                <React.Fragment key={i}>
                    {/* Ring marking - using Torus or thin Tube for visibility on both sides? 
                 Or just a thin cylinder slightly larger than the body */}
                    <Cylinder args={[0.255, 0.255, 0.015, 32, 1, true]} position={[0, y + 0.1, 0]} side={THREE.DoubleSide}>
                        <meshBasicMaterial color="#000" opacity={0.4} transparent />
                    </Cylinder>
                </React.Fragment>
            ))}
        </group>
    );
};

export default MeasuringCylinder;
