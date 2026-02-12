import React from 'react';
import { Cylinder, Sphere } from '@react-three/drei';

const StirringRod = (props) => {
    return (
        <group {...props}>
            <Cylinder args={[0.03, 0.03, 2.5, 16]} position={[0, 1.25, 0]}>
                <meshPhysicalMaterial color="#d0efff" transmission={0.8} opacity={0.6} transparent roughness={0} />
            </Cylinder>
            {/* Rounded ends */}
            <Sphere args={[0.03, 16, 16]} position={[0, 0, 0]}>
                <meshPhysicalMaterial color="#d0efff" transmission={0.8} opacity={0.6} transparent roughness={0} />
            </Sphere>
            <Sphere args={[0.03, 16, 16]} position={[0, 2.5, 0]}>
                <meshPhysicalMaterial color="#d0efff" transmission={0.8} opacity={0.6} transparent roughness={0} />
            </Sphere>
        </group>
    );
};

export default StirringRod;
