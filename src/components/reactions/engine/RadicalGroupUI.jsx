'use client';
// src/components/reactions/engine/RadicalGroupUI.jsx

import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Calculates the center and extents of a group of atoms.
 * Renders a faint bounding box/aura and a single charge label.
 */
const RadicalGroupUI = ({ group, atoms }) => {
    const boxRef = useRef();

    // Find all atom objects belonging to this group
    const groupAtoms = useMemo(() => {
        return group.atomIds.map(id => atoms.find(a => a.id === id)).filter(Boolean);
    }, [group.atomIds, atoms]);

    // Calculate bounding box and center
    const { center, size, maxRadius } = useMemo(() => {
        if (groupAtoms.length === 0) return { center: [0, 0, 0], size: [1, 1, 1], maxRadius: 1 };

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        groupAtoms.forEach(a => {
            const [x, y, z] = a.startPos;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        });

        const padding = 2.0; // padding around the outermost atoms

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;

        const w = (maxX - minX) + padding;
        const h = (maxY - minY) + padding;
        const d = (maxZ - minZ) + padding;

        const maxR = Math.max(w, h, d) / 2;

        return {
            center: [cx, cy, cz],
            size: [w, h, d],
            maxRadius: maxR
        };
    }, [groupAtoms]);

    // Visuals based on charge
    const chargeVisuals = useMemo(() => {
        const c = group.charge;
        if (c > 0) return { color: "#ff4444", textClass: "text-red-400" };
        if (c < 0) return { color: "#44ccff", textClass: "text-blue-400" };
        return { color: "#ffffff", textClass: "text-white" };
    }, [group.charge]);

    // Format charge string
    const chargeString = useMemo(() => {
        const c = group.charge;
        if (c === 0) return "";
        if (c === 1) return "+";
        if (c === -1) return "−";
        return c > 0 ? `${c}+` : `${Math.abs(c)}−`;
    }, [group.charge]);

    // Pulse animation
    useFrame((state) => {
        if (boxRef.current) {
            const speed = group.charge === 0 ? 1 : 2 + Math.abs(group.charge);
            // Gentle scale pulse
            const pulse = Math.sin(state.clock.elapsedTime * speed) * 0.02 + 0.98;
            boxRef.current.scale.setScalar(pulse);

            // Very slow rotation
            boxRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            boxRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
        }
    });

    if (groupAtoms.length === 0) return null;

    return (
        <group position={center}>
            {/* Outline Box / Sphere representing the group boundary */}
            <mesh ref={boxRef}>
                <icosahedronGeometry args={[maxRadius, 2]} />
                <meshBasicMaterial
                    color={chargeVisuals.color}
                    wireframe
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Inner faint aura */}
            <mesh>
                <sphereGeometry args={[maxRadius * 0.95, 32, 32]} />
                <meshBasicMaterial
                    color={chargeVisuals.color}
                    transparent
                    opacity={0.05}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Floating Charge Label for the Group */}
            {chargeString && (
                <Html position={[0, size[1] / 2 + 1, 0]} center distanceFactor={15} zIndexRange={[100, 0]}>
                    <div className="flex flex-col items-center pointer-events-none select-none">
                        <div className={`px-2 py-1 rounded border shadow-lg backdrop-blur-md font-bold text-sm bg-black/60 border-${chargeVisuals.color.replace('#', '')}/30 ${chargeVisuals.textClass}`}>
                            [Group] {chargeString}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default RadicalGroupUI;
