import React, { useMemo } from 'react';
import * as THREE from 'three';

const Wire = ({ points = [], color = 'red', thickness = 0.02 }) => {
    const curve = useMemo(() => {
        if (!points || points.length < 2) return null;
        const vectors = points.map(p => new THREE.Vector3(...p));
        return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
    }, [points]);

    if (!curve) return null;

    return (
        <group>
            <mesh>
                <tubeGeometry args={[curve, 64, thickness, 8, false]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Terminals/Connectors at ends? Optional for now */}
        </group>
    );
};

export default Wire;
