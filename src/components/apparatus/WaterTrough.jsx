import React from 'react';
import { Cylinder } from '@react-three/drei';

const WaterTrough = (props) => {
    return (
        <group {...props}>
            {/* Container */}
            <Cylinder args={[1.5, 1.3, 0.8, 32, 1, true]} position={[0, 0.4, 0]}>
                <meshPhysicalMaterial
                    color="#aaddff"
                    transmission={0.8}
                    opacity={0.5}
                    transparent
                    roughness={0.2}
                    side={2}
                />
            </Cylinder>
            {/* Base */}
            <Cylinder args={[1.3, 1.3, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial
                    color="#aaddff"
                    transmission={0.8}
                    opacity={0.5}
                    transparent
                    roughness={0.2}
                />
            </Cylinder>
            {/* Water Surface */}
            <Cylinder args={[1.4, 1.4, 0.02, 32]} position={[0, 0.6, 0]}>
                <meshStandardMaterial
                    color="#0077ff"
                    opacity={0.6}
                    transparent
                    roughness={0}
                />
            </Cylinder>
        </group>
    );
};

export default WaterTrough;
