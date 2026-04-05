import React, { useMemo } from 'react';
import * as THREE from 'three';

const chaikinSmooth = (pts, iterations = 3) => {
    let result = pts;
    for (let iter = 0; iter < iterations; iter++) {
        const next = [result[0]];
        for (let i = 0; i < result.length - 1; i++) {
            const a = result[i], b = result[i + 1];
            next.push(new THREE.Vector3(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25, a.z * 0.75 + b.z * 0.25));
            next.push(new THREE.Vector3(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75, a.z * 0.25 + b.z * 0.75));
        }
        next.push(result[result.length - 1]);
        result = next;
    }
    return result;
};

const Wire = ({ points = [], color = 'red', thickness = 0.02 }) => {
    const curve = useMemo(() => {
        if (!points || points.length < 2) return null;
        const vectors = points.map(p => new THREE.Vector3(...p));
        if (vectors.length === 2) {
            return new THREE.LineCurve3(vectors[0], vectors[1]);
        }
        const smoothed = chaikinSmooth(vectors, 3);
        return new THREE.CatmullRomCurve3(smoothed, false, 'catmullrom', 0.5);
    }, [points]);

    const segments = useMemo(() => {
        if (!curve) return 64;
        try { return Math.max(64, Math.round(curve.getLength() * 50)); }
        catch { return 64; }
    }, [curve]);

    if (!curve) return null;

    return (
        <group>
            {/* Rubber insulation outer */}
            <mesh>
                <tubeGeometry args={[curve, segments, thickness, 8, false]} />
                <meshStandardMaterial color={color} roughness={0.85} metalness={0.0} />
            </mesh>
            {/* Subtle sheen highlight */}
            <mesh>
                <tubeGeometry args={[curve, segments, thickness * 1.02, 4, false]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.0} transparent opacity={0.15} />
            </mesh>
        </group>
    );
};

export default Wire;
