import React from 'react';
import { Cylinder, Sphere } from '@react-three/drei';

const Crucible = (props) => {
    return (
        <group {...props}>
            {/* Body - using a tapered cylinder or partial sphere */}
            {/* Simple approximation with a tapered cylinder and a hollowed look via CSG or just a dark top circle? 
           For simplicity in basic geometries, we'll stack two shapes. */}

            <Cylinder args={[0.6, 0.4, 0.8, 32]} position={[0, 0.4, 0]}>
                <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
            </Cylinder>

            {/* Lid (optional, can be separate) */}
            <group position={[0, 0.85, 0]} rotation={[0.2, 0, 0]}> {/* Slightly tilted lid */}
                <Cylinder args={[0.7, 0.6, 0.2, 32]}>
                    <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
                </Cylinder>
                <Sphere args={[0.1, 16, 16]} position={[0, 0.15, 0]} scale={[1, 0.5, 1]}>
                    <meshStandardMaterial color="#f0f0f0" roughness={0.7} />
                </Sphere>
            </group>
        </group>
    );
};

export default Crucible;
