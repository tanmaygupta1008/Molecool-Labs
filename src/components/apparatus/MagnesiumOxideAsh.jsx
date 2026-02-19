import React from 'react';
import { useGLTF } from '@react-three/drei';

const MagnesiumOxideAsh = (props) => {
    // Placeholder geometry: A distorted white pile/clump
    // In a real app we'd load a GLTF model of ash
    // For now, we use a group of white distorted spheres/tetrahedrons
    return (
        <group {...props}>
            <mesh position={[0, -0.5, 0]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#eeeeee" roughness={1} />
            </mesh>
            <mesh position={[0.3, -0.6, 0.2]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#ffffff" roughness={1} />
            </mesh>
            <mesh position={[-0.2, -0.6, -0.2]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#e0e0e0" roughness={1} />
            </mesh>
        </group>
    );
};

export default MagnesiumOxideAsh;
