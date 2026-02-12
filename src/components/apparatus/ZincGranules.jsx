import React from 'react';
import { Dodecahedron } from '@react-three/drei';

const ZincGranules = (props) => {
    return (
        <group {...props}>
            {/* Scattering of small rocky shapes */}
            <Dodecahedron args={[0.08]} position={[0, 0, 0]} rotation={[0.5, 0.5, 0]}>
                <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.8} />
            </Dodecahedron>
            <Dodecahedron args={[0.07]} position={[0.12, -0.05, 0.05]} rotation={[0.2, 0.1, 0.4]}>
                <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.8} />
            </Dodecahedron>
            <Dodecahedron args={[0.09]} position={[-0.1, -0.02, -0.05]} rotation={[0.1, 0.8, 0.1]}>
                <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.8} />
            </Dodecahedron>
            <Dodecahedron args={[0.06]} position={[0.05, 0.05, -0.1]} rotation={[0.3, 0.2, 0.1]}>
                <meshStandardMaterial color="#a0a0a0" metalness={0.7} roughness={0.8} />
            </Dodecahedron>
        </group>
    );
};

export default ZincGranules;
