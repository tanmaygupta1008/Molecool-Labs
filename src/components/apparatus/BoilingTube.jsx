import React from 'react';
import { Cylinder, Utils, Torus } from '@react-three/drei';

const BoilingTube = (props) => {
    return (
        <group {...props}>
            {/* Boiling Tube is just a larger test tube */}
            {/* Body */}
            <Cylinder args={[0.3, 0.3, 1.8, 32, 1, true]} position={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2} // Double side
                />
            </Cylinder>

            {/* Rounded Bottom */}
            <mesh position={[0, -0.9, 0]}>
                <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2}
                />
            </mesh>

            {/* Rim - Torus for open top look */}
            <Torus args={[0.3, 0.03, 16, 32]} position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#dddddd"
                    transmission={0.8}
                    opacity={0.6}
                    transparent
                    roughness={0.2}
                />
            </Torus>
        </group>
    );
};

export default BoilingTube;
