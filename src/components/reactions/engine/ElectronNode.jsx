'use client';
// src/components/reactions/engine/ElectronNode.jsx

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

const ElectronNode = ({
    orbitCenter = [0, 0, 0],
    sharedCenters = null, // e.g. [[-2,0,0], [2,0,0]] if shared
    isShared = false,
    radius = 1.2,
    speed = 1,
    phase = 0,
    color = "#88ccff",
    opacity = 1
}) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime * speed + phase;

        if (isShared && sharedCenters && sharedCenters.length >= 2) {
            // FIGURE-8 COVALENT ORBIT
            const c1 = Array.isArray(sharedCenters[0]) ? new THREE.Vector3(...sharedCenters[0]) : sharedCenters[0];
            const c2 = Array.isArray(sharedCenters[1]) ? new THREE.Vector3(...sharedCenters[1]) : sharedCenters[1];

            const distance = c1.distanceTo(c2);
            const midpoint = new THREE.Vector3().addVectors(c1, c2).multiplyScalar(0.5);

            // Parametric figure-8 equation
            const a = distance * 0.55;
            const b = distance * 0.25;

            // Generate Lissajous curve
            const x = a * Math.sin(t);
            const y = b * Math.sin(t) * Math.cos(t);
            const z = b * Math.cos(t) * Math.sin(t * 0.5); // Add a twist

            const localPos = new THREE.Vector3(x, y, z);

            // Align the figure-8 with the bond axis (c1 to c2)
            const direction = new THREE.Vector3().subVectors(c2, c1).normalize();

            // Create a rotation matrix from default X-axis to the target direction
            const defaultAxis = new THREE.Vector3(1, 0, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultAxis, direction);

            localPos.applyQuaternion(quaternion);

            // Add to midpoint
            localPos.add(midpoint);
            meshRef.current.position.copy(localPos);

        } else {
            // STANDARD SPHERICAL ORBIT
            const center = Array.isArray(orbitCenter) ? new THREE.Vector3(...orbitCenter) : orbitCenter;

            // Add some wobble based on phase to spread electrons out spherically
            const orbitRadius = radius;
            const tiltX = Math.sin(phase) * Math.PI;
            const tiltY = Math.cos(phase) * Math.PI;

            // Base circular orbit
            let x = Math.sin(t) * orbitRadius;
            let y = Math.cos(t) * orbitRadius;
            let z = 0;

            const pos = new THREE.Vector3(x, y, z);

            // Apply randomized tilt per-electron
            const euler = new THREE.Euler(tiltX, tiltY, 0);
            pos.applyEuler(euler);

            // add to center
            pos.add(center);

            meshRef.current.position.copy(pos);
        }
    });

    return (
        <Sphere ref={meshRef} args={[0.08, 16, 16]}>
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                transparent
                opacity={opacity}
            />
            {/* Tiny glow halo */}
            <Sphere args={[0.15, 8, 8]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={opacity * 0.3}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>
        </Sphere>
    );
};

export default ElectronNode;
