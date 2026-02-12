import React from 'react';
import { Cylinder, Sphere } from '@react-three/drei';

const Dropper = (props) => {
    return (
        <group {...props}>
            {/* Glass Tube */}
            <Cylinder args={[0.05, 0.02, 1.2, 16]} position={[0, 0.6, 0]}>
                <meshPhysicalMaterial color="#fff" transmission={0.9} opacity={0.4} transparent side={2} />
            </Cylinder>

            {/* Rubber Bulb */}
            <Sphere args={[0.15, 16, 16]} position={[0, 1.2, 0]} scale={[1, 1.5, 1]}>
                <meshStandardMaterial color="#333" roughness={0.9} />
            </Sphere>
        </group>
    );
};

export default Dropper;
