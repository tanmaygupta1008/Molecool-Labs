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
    onClick,
    isInductiveView = false // Prop to determine if we should separate sigma vs pi
}) => {
    const groupRef = useRef();
    const materialRef = useRef();

    // Animation progress tracker for breaking/forming
    const animTracker = useRef({
        t: 0,
        prevState: "normal"
    });

    useFrame(() => {
        if (!groupRef.current) return;

        const vStart = Array.isArray(startPos) ? new THREE.Vector3(...startPos) : startPos.clone();
        const vEnd = Array.isArray(endPos) ? new THREE.Vector3(...endPos) : endPos.clone();

        const midpoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
        groupRef.current.position.copy(midpoint);

        const distance = vStart.distanceTo(vEnd);
        const safeDistance = Math.max(distance, 0.01);

        let finalRadiusScale = 1;
        let finalOpacity = opacity;

        if (state !== animTracker.current.prevState) {
            animTracker.current.t = 0;
            animTracker.current.prevState = state;
        }

        if (state === "forming") {
            let t = progress !== null ? progress : Math.min(animTracker.current.t + 0.02, 1);
            if (progress === null) animTracker.current.t = t;

            finalOpacity = opacity * t;
            finalRadiusScale = t;
            groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance * t);
        } else if (state === "breaking") {
            let t = progress !== null ? progress : Math.min(animTracker.current.t + 0.05, 1);
            if (progress === null) animTracker.current.t = t;

            finalOpacity = opacity * (1 - t);
            finalRadiusScale = 1 - t;
            if (t < 0.99) {
                groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance);
            } else {
                groupRef.current.scale.set(0, 0, 0); 
            }
        } else if (state === "stretching") {
            const wobble = Math.sin(Date.now() / 50) * 0.02;
            finalRadiusScale = 0.7 + wobble; 
            groupRef.current.scale.set(finalRadiusScale, finalRadiusScale, safeDistance);
            finalOpacity = opacity * (0.8 + Math.abs(wobble) * 5);
        } else {
            groupRef.current.scale.set(1, 1, safeDistance);
        }

        groupRef.current.lookAt(vEnd);

        if (materialRef.current) {
            materialRef.current.opacity = finalOpacity;
            if (state === "stretching") {
                materialRef.current.color.setHex(0xff5500); 
            } else if (state === "breaking") {
                materialRef.current.color.setHex(0xff0000); 
            } else {
                materialRef.current.color.setHex(0xffffff);
            }
        }
    });

    const geometry = useMemo(() => {
        const geo = new THREE.CylinderGeometry(radius, radius, 1, 16, 12);
        geo.rotateX(Math.PI / 2); 

        const colors = new Float32Array(geo.attributes.position.count * 3);
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return geo;
    }, [radius]);

    useEffect(() => {
        const cStart = new THREE.Color(colorStart || color);
        const cEnd = new THREE.Color(colorEnd || color);

        const pos = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;

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
            let t = (z - minZ) / zRange; 

            if (t < 0.4) {
                t = 0;
            } else if (t > 0.6) {
                t = 1.0;
            } else {
                t = (t - 0.4) / 0.2; 
            }

            const vertexColor = cStart.clone().lerp(cEnd, t);
            colorAttr.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
        }

        colorAttr.needsUpdate = true;
    }, [colorStart, colorEnd, color, geometry]);

    const renderCylinders = () => {
        const offsetAmount = radius * 2.5;

        // Sigma Material receives the gradient calculation natively via vertexColors
        const sigmaMaterial = (
            <meshStandardMaterial
                ref={materialRef}
                color={0xffffff} 
                vertexColors={true}
                roughness={0.4}
                metalness={0.5}
                transparent
                opacity={opacity}
            />
        );

        // Pi Material is neutral white and faint. It ignores vertexColors.
        const piMaterial = (
            <meshStandardMaterial
                color={0xd0d0d0} 
                vertexColors={false}
                roughness={0.8}
                metalness={0.1}
                transparent
                opacity={opacity * 0.35} // Faint cloud logic for pi bond
            />
        );

        if (order === 1) {
            return <mesh geometry={geometry}>{sigmaMaterial}</mesh>;
        }

        if (order === 2) {
            return (
                <group>
                    <mesh position={[offsetAmount, 0, 0]} geometry={geometry}>{sigmaMaterial}</mesh>
                    <mesh 
                        position={[-offsetAmount, 0, 0]} 
                        geometry={geometry} 
                        scale={isInductiveView ? [0.2, 0.2, 1.0] : [1, 1, 1]}
                    >
                        {isInductiveView ? piMaterial : sigmaMaterial}
                    </mesh>
                </group>
            );
        }

        if (order === 3) {
            return (
                <group>
                    <mesh position={[0, offsetAmount, 0]} geometry={geometry}>{sigmaMaterial}</mesh>
                    <mesh 
                        position={[offsetAmount, -offsetAmount * 0.8, 0]} 
                        geometry={geometry} 
                        scale={isInductiveView ? [0.2, 0.2, 1.0] : [1, 1, 1]}
                    >
                        {isInductiveView ? piMaterial : sigmaMaterial}
                    </mesh>
                    <mesh 
                        position={[-offsetAmount, -offsetAmount * 0.8, 0]} 
                        geometry={geometry} 
                        scale={isInductiveView ? [0.2, 0.2, 1.0] : [1, 1, 1]}
                    >
                        {isInductiveView ? piMaterial : sigmaMaterial}
                    </mesh>
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
