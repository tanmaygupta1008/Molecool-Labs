import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Chaikin corner-cutting algorithm.
 * Each iteration replaces every segment's endpoints with 1/4 and 3/4 interpolated points,
 * which smooths sharp corners while preserving the general shape.
 */
const chaikinSmooth = (pts, iterations = 3) => {
    let result = pts;
    for (let iter = 0; iter < iterations; iter++) {
        const next = [result[0]]; // Keep first point
        for (let i = 0; i < result.length - 1; i++) {
            const a = result[i];
            const b = result[i + 1];
            next.push(new THREE.Vector3(
                a.x * 0.75 + b.x * 0.25,
                a.y * 0.75 + b.y * 0.25,
                a.z * 0.75 + b.z * 0.25,
            ));
            next.push(new THREE.Vector3(
                a.x * 0.25 + b.x * 0.75,
                a.y * 0.25 + b.y * 0.75,
                a.z * 0.25 + b.z * 0.75,
            ));
        }
        next.push(result[result.length - 1]); // Keep last point
        result = next;
    }
    return result;
};

const DeliveryTube = ({ points, ...props }) => {
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
            // Only 2 points – straight line, no smoothing needed
            return new THREE.LineCurve3(rawPoints[0], rawPoints[1]);
        }
        // Multiple points: Chaikin-smooth then use a low-tension CatmullRom
        const smoothed = chaikinSmooth(rawPoints, 3);
        return new THREE.CatmullRomCurve3(smoothed, false, 'catmullrom', 0.5);
    }, [rawPoints]);

    // Tube segment count scales with path length for uniform visual density
    const segments = useMemo(() => {
        try { return Math.max(64, Math.round(curve.getLength() * 40)); }
        catch { return 128; }
    }, [curve]);

    return (
        <group {...props}>
            {/* Outer glass shell */}
            <mesh>
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
            <mesh>
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
            <mesh>
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
