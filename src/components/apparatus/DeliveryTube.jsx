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

const DeliveryTube = ({ points, startConnection, endConnection, sceneRefs, allItems, ...props }) => {
    const meshRef1 = React.useRef();
    const meshRef2 = React.useRef();
    const meshRef3 = React.useRef();
    const groupRef = React.useRef();
    
    // Maintain a local mutable copy of points for high-frequency updates
    const currentPointsRef = React.useRef([]);
    
    // Initial sync
    React.useEffect(() => {
        if (points) currentPointsRef.current = points.map(p => new THREE.Vector3(...p));
    }, [points]);

    const rawPoints = useMemo(() => {
        if (points && points.length >= 2) {
            return points.map(v => new THREE.Vector3(...v));
        }
        return [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0.5, 1.5, 0),
            new THREE.Vector3(1.5, 1.5, 0),
            new THREE.Vector3(1.5, 0.5, 0)
        ];
    }, [points]);

    // Smooth + fit curve
    const curve = useMemo(() => {
        if (rawPoints.length === 2) {
            return new THREE.LineCurve3(rawPoints[0], rawPoints[1]);
        }
        const smoothed = chaikinSmooth(rawPoints, 3);
        return new THREE.CatmullRomCurve3(smoothed, false, 'catmullrom', 0.5);
    }, [rawPoints]);

    const segments = useMemo(() => {
        try { return Math.max(64, Math.round(curve.getLength() * 40)); }
        catch { return 128; }
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

            // 1. Get current world matrix of parent (handles active drag or parented state)
            parentGroup.updateMatrixWorld();
            
            // 2. Find the local anchor position
            // We use getApparatusAnchors with a neutral state to find the local offsets
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
            // Re-generate geometry visually
            const newCurve = pts.length === 2 
                ? new THREE.LineCurve3(pts[0].clone(), pts[1].clone())
                : new THREE.CatmullRomCurve3(chaikinSmooth(pts.map(p => p.clone()), 3), false, 'catmullrom', 0.5);
            
            const newGeo = new THREE.TubeGeometry(newCurve, segments, 0.055, 10, false);
            const newGeoInner = new THREE.TubeGeometry(newCurve, segments, 0.038, 8, false);
            const newGeoHighlight = new THREE.TubeGeometry(newCurve, segments, 0.056, 4, false);

            [meshRef1, meshRef2, meshRef3].forEach((ref, i) => {
                const geo = [newGeo, newGeoInner, newGeoHighlight][i];
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
            [meshRef1, meshRef2, meshRef3].forEach(ref => {
                if (ref.current && ref.current.geometry) {
                    ref.current.geometry.dispose();
                }
            });
        };
    }, [curve, segments]);

    return (
        <group ref={groupRef} {...props}>
            {/* Outer glass shell */}
            <mesh ref={meshRef1}>
                <tubeGeometry args={[curve, segments, 0.055, 10, false]} />
                <meshPhysicalMaterial
                    color="#e8f4fb"
                    transmission={0.92}
                    opacity={0.35}
                    transparent
                    roughness={0.05}
                    metalness={0.0}
                    thickness={0.12}
                    ior={1.5}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Inner wall – slightly darker to give depth/volume */}
            <mesh ref={meshRef2}>
                <tubeGeometry args={[curve, segments, 0.038, 8, false]} />
                <meshPhysicalMaterial
                    color="#c8e8f8"
                    transmission={0.85}
                    opacity={0.25}
                    transparent
                    roughness={0.08}
                    side={THREE.BackSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Highlight stripe – thin bright cylinder gives glass the specular edge */}
            <mesh ref={meshRef3}>
                <tubeGeometry args={[curve, segments, 0.056, 4, false]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.08}
                    side={THREE.FrontSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};

export default DeliveryTube;
