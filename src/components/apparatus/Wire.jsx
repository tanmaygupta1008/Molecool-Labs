import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getApparatusAnchors } from '../../utils/apparatus-anchors';

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

const Wire = ({ points = [], startConnection, endConnection, sceneRefs, allItems, color = 'red', thickness = 0.02 }) => {
    const meshRef1 = React.useRef();
    const meshRef2 = React.useRef();
    const groupRef = React.useRef();

    // Maintain a local mutable copy of points for high-frequency updates
    const currentPointsRef = React.useRef([]);
    
    // Initial sync
    React.useEffect(() => {
        if (points) currentPointsRef.current = points.map(p => new THREE.Vector3(...p));
    }, [points]);

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

    // ── DYNAMIC TRACKING ──────────────────────────────────────────────────
    useFrame(() => {
        if (!sceneRefs || !sceneRefs.current || !groupRef.current) return;
        
        let needsUpdate = false;
        const tubeGroup = groupRef.current;
        const pts = currentPointsRef.current;
        if (pts.length < 2) return;

        const updatePoint = (conn, index) => {
            if (!conn) return;
            const parentGroup = sceneRefs.current[conn.parentId];
            const parentItem = allItems?.find(i => i.id === conn.parentId);
            if (!parentGroup || !parentItem) return;

            parentGroup.updateMatrixWorld();
            const localAnchors = getApparatusAnchors({ ...parentItem, position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] });
            const anchorDef = localAnchors.find(a => a.localId === conn.anchorId);
            if (!anchorDef) return;

            const localPos = new THREE.Vector3(...anchorDef.position);
            const worldPos = localPos.applyMatrix4(parentGroup.matrixWorld);
            const localToTube = tubeGroup.worldToLocal(worldPos);

            if (pts[index].distanceTo(localToTube) > 0.001) {
                pts[index].copy(localToTube);
                needsUpdate = true;
            }
        };

        updatePoint(startConnection, 0);
        updatePoint(endConnection, pts.length - 1);

        if (needsUpdate && meshRef1.current) {
            const newCurve = pts.length === 2 
                ? new THREE.LineCurve3(pts[0].clone(), pts[1].clone())
                : new THREE.CatmullRomCurve3(chaikinSmooth(pts.map(p => p.clone()), 3), false, 'catmullrom', 0.5);
            
            const newGeo = new THREE.TubeGeometry(newCurve, segments, thickness, 8, false);
            const newGeoHigh = new THREE.TubeGeometry(newCurve, segments, thickness * 1.02, 4, false);

            [meshRef1, meshRef2].forEach((ref, i) => {
                const geo = [newGeo, newGeoHigh][i];
                if (ref.current) {
                    ref.current.geometry.dispose();
                    ref.current.geometry = geo;
                }
            });
        }
    });

    // Cleanup resources
    React.useEffect(() => {
        return () => {
            [meshRef1, meshRef2].forEach(ref => {
                if (ref.current && ref.current.geometry) {
                    ref.current.geometry.dispose();
                }
            });
        };
    }, [curve, segments]);

    if (!curve) return null;

    return (
        <group ref={groupRef}>
            {/* Rubber insulation outer */}
            <mesh ref={meshRef1}>
                <tubeGeometry args={[curve, segments, thickness, 8, false]} />
                <meshStandardMaterial color={color} roughness={0.85} metalness={0.0} />
            </mesh>
            {/* Subtle sheen highlight */}
            <mesh ref={meshRef2}>
                <tubeGeometry args={[curve, segments, thickness * 1.02, 4, false]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.0} transparent opacity={0.15} />
            </mesh>
        </group>
    );
};

export default Wire;
