import React from 'react';
import { Cylinder, Torus } from '@react-three/drei';

const TripodStand = (props) => {
    return (
        <group {...props}>
            {/* Ring */}
            <Torus args={[1.2, 0.08, 16, 32]} position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.5} />
            </Torus>

            {/* Legs */}
            {[0, 120, 240].map((angle, index) => (
                <group key={index} rotation={[0, (angle * Math.PI) / 180, 0]}>
                    <Cylinder args={[0.08, 0.08, 3.2, 16]} position={[1.1, 1.5, 0]} rotation={[0, 0, -0.15]}>
                        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.5} />
                    </Cylinder>
                </group>
            ))}
        </group>
    );
};

export default TripodStand;
