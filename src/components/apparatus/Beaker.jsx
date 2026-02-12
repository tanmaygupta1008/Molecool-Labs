import React from 'react';
import { Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

const Beaker = ({ size = 1, ...props }) => {
    const scale = size;

    return (
        <group {...props} scale={[scale, scale, scale]}>
            {/* Main Body */}
            <Cylinder args={[0.8, 0.8, 1.8, 32, 1, true]} position={[0, 0.9, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    metalness={0.1}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                />
            </Cylinder>

            {/* Bottom */}
            <Cylinder args={[0.8, 0.8, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    metalness={0.1}
                    thickness={0.05}
                />
            </Cylinder>

            {/* Rim - Torus */}
            <Torus args={[0.8, 0.035, 16, 32]} position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.5} transparent />
            </Torus>

            {/* Markings */}
            {[0.5, 0.9, 1.3].map((y, i) => (
                <React.Fragment key={i}>
                    {/* Major graduation */}
                    <group position={[0, y, 0]} rotation={[0, 0, 0]}>
                        <Cylinder args={[0.805, 0.805, 0.01, 32, 1, true, 0, Math.PI]} side={THREE.DoubleSide}>
                            <meshBasicMaterial color="#333" opacity={0.6} transparent />
                        </Cylinder>
                    </group>
                </React.Fragment>
            ))}

            {/* "White patch" area often seen on beakers for labeling */}
            <Cylinder args={[0.81, 0.81, 0.6, 32, 1, true, -Math.PI / 4, Math.PI / 2]} position={[0, 1.1, 0]} side={THREE.DoubleSide}>
                <meshStandardMaterial color="#ffffff" opacity={0.8} transparent roughness={0.8} />
            </Cylinder>

        </group>
    );
};

export default Beaker;
