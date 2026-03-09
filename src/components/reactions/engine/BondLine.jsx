'use client';
// src/components/reactions/engine/BondLine.jsx

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BondLine = ({
    startPos = [0, 0, 0],
    endPos = [2, 0, 0],
    order = 1, // 1 = Single, 2 = Double, 3 = Triple
    color = "#aaaaaa",
    colorStart = null,
    colorEnd = null,
    radius = 0.08,
    opacity = 1,
    state = "normal", // "normal", "stretching", "breaking", "forming"
    progress = null, // External progress driver 0.0-1.0
    onClick
}) => {
    const groupRef = useRef();
    const materialRef = useRef(); // Needed to animate opacity/color

    // Animation progress tracker for breaking/forming
    const animTracker = useRef({
        t: 0,
        prevState: "normal"
    });

    useFrame(() => {
        if (!groupRef.current) return;

        // Convert array to Vector3
        const vStart = Array.isArray(startPos) ? new THREE.Vector3(...startPos) : startPos.clone();
        const vEnd = Array.isArray(endPos) ? new THREE.Vector3(...endPos) : endPos.clone();

        // 1. Calculate the midpoint to position the cylinder
        const midpoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
        groupRef.current.position.copy(midpoint);

        // 2. Calculate the distance (length of the bond)
        const distance = vStart.distanceTo(vEnd);

        // Safety check to avoid scaling errors when distance is very small
        const safeDistance = Math.max(distance, 0.01);

        // 3. Handle Animation States
        let finalRadiusScale = 1;
        let finalOpacity = opacity;

        // Reset animation tracker if state changed
        if (state !== animTracker.current.prevState) {
            animTracker.current.t = 0;
            animTracker.current.prevState = state;
        }

        if (state === "forming") {
            // Animate scale and opacity from 0 -> 1 over time
            let t = progress !== null ? progress : Math.min(animTracker.current.t + 0.02, 1);
            if (progress === null) animTracker.current.t = t;

            finalOpacity = opacity * t;
            finalRadiusScale = t;
            // Shorter length while forming
            groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance * t);
        } else if (state === "breaking") {
            // Animate scale and opacity from 1 -> 0 over time
            let t = progress !== null ? progress : Math.min(animTracker.current.t + 0.05, 1);
            if (progress === null) animTracker.current.t = t;

            finalOpacity = opacity * (1 - t);
            finalRadiusScale = 1 - t;
            // Disappear exactly at 1.0
            if (t < 0.99) {
                groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance);
            } else {
                groupRef.current.scale.set(0, 0, 0); // Snap disappear
            }
        } else if (state === "stretching") {
            // Spring/wobble effect based on time
            const wobble = Math.sin(Date.now() / 50) * 0.02;
            finalRadiusScale = 0.7 + wobble; // Gets thinner
            groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance);

            // Pulse opacity/color
            finalOpacity = opacity * (0.8 + Math.abs(wobble) * 5);
        } else {
            // Normal State
            groupRef.current.scale.set(1, 1, safeDistance);
        }

        groupRef.current.lookAt(vEnd);

        // Apply updated opacity if we have a material ref
        if (materialRef.current) {
            materialRef.current.opacity = finalOpacity;

            if (state === "stretching") {
                materialRef.current.color.setHex(0xff5500); // Turn orange when stretching
            } else if (state === "breaking") {
                materialRef.current.color.setHex(0xff0000); // Turn red when breaking
            } else {
                // Return to white to let vertex colors show purely
                materialRef.current.color.setHex(0xffffff);
            }
        }

    });

    // 1. Create base geometry once (or when radius changes)
    const geometry = useMemo(() => {
        // Increase heightSegments to 12 to ensure proper, smooth vertex color interpolation along the cylinder
        const geo = new THREE.CylinderGeometry(radius, radius, 1, 16, 12);
        geo.rotateX(Math.PI / 2); // Align with Z axis for lookAt

        // Initialize an empty color buffer
        const colors = new Float32Array(geo.attributes.position.count * 3);
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return geo;
    }, [radius]);

    // 2. Dynamically update vertex colors when charges/colors change
    useEffect(() => {
        const cStart = new THREE.Color(colorStart || color);
        const cEnd = new THREE.Color(colorEnd || color);

        const pos = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;

        // Auto-detect the Z-range of the geometry to ensure perfect normalization
        let minZ = Infinity;
        let maxZ = -Infinity;
        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i);
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }

        const zRange = maxZ - minZ || 1;

        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i);
            let t = (z - minZ) / zRange; // 0.0 to 1.0 linearly along the cylinder

            // Sharpen the transition to keep the cation/anion colors distinct.
            // 40% solid start color, 20% gradient mix, 40% solid end color.
            if (t < 0.4) {
                t = 0;
            } else if (t > 0.6) {
                t = 1.0;
            } else {
                t = (t - 0.4) / 0.2; // Normalize the middle 20% to 0.0 -> 1.0
            }

            const vertexColor = cStart.clone().lerp(cEnd, t);
            colorAttr.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
        }

        colorAttr.needsUpdate = true;
    }, [colorStart, colorEnd, color, geometry]);

    // Helper to generate multiple cylinders for double/triple bonds
    const renderCylinders = () => {
        const offsetAmount = radius * 2.5;

        const material = (
            <meshStandardMaterial
                ref={materialRef}
                color={0xffffff} // Set to white so vertex colors show perfectly
                vertexColors={true}
                roughness={0.4}
                metalness={0.5}
                transparent
                opacity={opacity}
            />
        );

        if (order === 1) {
            return <mesh geometry={geometry}>{material}</mesh>;
        }

        if (order === 2) {
            return (
                <group>
                    <mesh position={[offsetAmount, 0, 0]} geometry={geometry}>{material}</mesh>
                    <mesh position={[-offsetAmount, 0, 0]} geometry={geometry}>{material}</mesh>
                </group>
            );
        }

        if (order === 3) {
            return (
                <group>
                    {/* Middle */}
                    <mesh position={[0, offsetAmount, 0]} geometry={geometry}>{material}</mesh>
                    {/* Bottom Left / Right */}
                    <mesh position={[offsetAmount, -offsetAmount * 0.8, 0]} geometry={geometry}>{material}</mesh>
                    <mesh position={[-offsetAmount, -offsetAmount * 0.8, 0]} geometry={geometry}>{material}</mesh>
                </group>
            );
        }

        return null;
    };

    return (
        <group ref={groupRef} onClick={onClick}>
            {renderCylinders()}
        </group>
    );
};

export default BondLine;
