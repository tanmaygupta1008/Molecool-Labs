import React, { useMemo } from 'react';
import { Tube, Curve } from '@react-three/drei';
import * as THREE from 'three';

const DeliveryTube = ({ points, ...props }) => {
    // If points are provided, use them. Otherwise default shape.
    const pathPoints = useMemo(() => {
        if (points && points.length >= 2) {
            let p = points.map(v => new THREE.Vector3(...v));
            // Safety check: if only 2 points and they are identical, offset the second one slightly
            if (p.length === 2 && p[0].distanceTo(p[1]) < 0.001) {
                p[1].y += 0.001;
            }
            return p;
        }
        return [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0.5, 1.5, 0),
            new THREE.Vector3(1.5, 1.5, 0),
            new THREE.Vector3(1.5, 0.5, 0)
        ];
    }, [points]);

    const curve = useMemo(() => {
        if (pathPoints.length === 2) {
            return new THREE.LineCurve3(pathPoints[0], pathPoints[1]);
        }
        return new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.1);
    }, [pathPoints]);

    return (
        <group {...props}>
            <mesh>
                <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </mesh>
        </group>
    );
};

export default DeliveryTube;
