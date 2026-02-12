import React from 'react';
import { Cylinder } from '@react-three/drei';

const IronNail = (props) => {
    return (
        <group {...props}>
            {/* Shaft */}
            <Cylinder args={[0.02, 0.01, 0.8, 12]} position={[0, 0.4, 0]}>
                <meshStandardMaterial color="#777" metalness={0.9} roughness={0.4} />
            </Cylinder>
            {/* Head */}
            <Cylinder args={[0.06, 0.06, 0.02, 16]} position={[0, 0.8, 0]}>
                <meshStandardMaterial color="#777" metalness={0.9} roughness={0.4} />
            </Cylinder>
        </group>
    );
};

export default IronNail;
