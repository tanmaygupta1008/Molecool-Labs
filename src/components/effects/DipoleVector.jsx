'use client';

import React, { useMemo } from 'react';
import { Vector3, Quaternion, MeshStandardMaterial, CylinderGeometry, ConeGeometry } from 'three';

const DipoleVector = ({ 
    start = new Vector3(0, 0, 0), 
    end = new Vector3(0, 1, 0), 
    color = "#FFD700", 
    magnitude = 1,
    isNet = false 
}) => {
    const direction = useMemo(() => new Vector3().subVectors(end, start).normalize(), [start, end]);
    const length = useMemo(() => start.distanceTo(end) * magnitude, [start, end, magnitude]);
    
    const midPoint = useMemo(() => new Vector3().addVectors(start, end).multiplyScalar(0.5), [start, end]);
    
    const quaternion = useMemo(() => {
        const q = new Quaternion();
        q.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        return q;
    }, [direction]);

    // Radii: Net dipole is thicker
    const stemRadius = isNet ? 0.05 : 0.02;
    const headRadius = isNet ? 0.12 : 0.06;
    const crossBarRadius = isNet ? 0.015 : 0.008;

    return (
        <group position={start.toArray()} quaternion={quaternion}>
            {/* Stem */}
            <mesh position={[0, length / 2, 0]}>
                <cylinderGeometry args={[stemRadius, stemRadius, length, 8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>

            {/* Head (pointing towards end) */}
            <mesh position={[0, length, 0]}>
                <coneGeometry args={[headRadius, length * 0.2, 8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
            </mesh>

            {/* Plus sign at the tail (Chemistry notation) */}
            <group position={[0, 0.05, 0]}>
                {/* Horizontal component */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[crossBarRadius, crossBarRadius, length * 0.15, 4]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {/* Vertical component (already oriented along stem) */}
                <mesh rotation={[0, 0, 0]}>
                    {/* Just visual cross-bar, not full cross */}
                </mesh>
            </group>
        </group>
    );
};

export default DipoleVector;
