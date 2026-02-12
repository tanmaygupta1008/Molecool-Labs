import React from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const MagnesiumRibbon = (props) => {
    // Length of the ribbon
    const length = 1.0;

    return (
        <group {...props}>
            {/* Invisible Hit Box for selection */}
            {/* Shifted down by length/2 so origin is at the top */}
            <mesh position={[0, -length / 2, 0]} visible={false}>
                <boxGeometry args={[0.2, length + 0.2, 0.2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Visual Mesh */}
            {/* Shifted down by length/2 */}
            <mesh position={[0, -length / 2, 0]} rotation={[0, 0, Math.PI / 12]}>
                {/* Add some curve/twist if possible, or just a strip */}
                <boxGeometry args={[0.05, length, 0.01, 1, 10, 1]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default MagnesiumRibbon;
