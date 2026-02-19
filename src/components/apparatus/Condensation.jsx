import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Condensation = ({
    count = 100,
    isBoiling = false,
    shape = 'cone', // 'cone' | 'sphere'
    // Dimensions
    minHeight = 0, // Water level
    maxHeight = 1,
    radiusFunction = (y) => 0.5,
    center = [0, 0, 0] // Offset if needed, usually 0,0,0 local
}) => {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const inwardOffset = 0.05; // Offset to prevent clipping

    // { x, y, z, scale, opacitySpeed, maxOpacity, currentOpacity }
    const droplets = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            let x, y, z;

            if (shape === 'cone') {
                // Random height between water and top
                y = minHeight + Math.random() * (maxHeight - minHeight);
                const r = radiusFunction(y);
                const rClean = Math.max(0, r - inwardOffset);
                const theta = Math.random() * Math.PI * 2;
                x = rClean * Math.cos(theta);
                z = rClean * Math.sin(theta);
            } else if (shape === 'sphere') {
                // Sphere logic
                y = minHeight + Math.random() * (maxHeight - minHeight);
                const r = radiusFunction(y);
                const rClean = Math.max(0, r - inwardOffset);
                const theta = Math.random() * Math.PI * 2;
                x = rClean * Math.cos(theta);
                z = rClean * Math.sin(theta);
            }

            return {
                x, y, z,
                // Slightly larger droplets (scale ~0.03 mean)
                scale: 0.015 + Math.random() * 0.025,
                opacitySpeed: 0.5 + Math.random() * 0.5,
                maxOpacity: 0.6 + Math.random() * 0.4, // Higher opacity for visibility since they are tiny
                currentOpacity: 0,
                targetOpacity: 0
            };
        });
    }, [count, minHeight, maxHeight, shape]); // Re-generate if dimensions change (water level)

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Fading logic
        const targetGlobal = isBoiling ? 1 : 0;

        droplets.forEach((d, i) => {
            // Individual random flicker or just steady fade
            d.targetOpacity = targetGlobal * d.maxOpacity;

            if (d.currentOpacity < d.targetOpacity) {
                d.currentOpacity += d.opacitySpeed * delta * 0.5;
            } else if (d.currentOpacity > d.targetOpacity) {
                d.currentOpacity -= d.opacitySpeed * delta; // Fade out faster
            }
            d.currentOpacity = Math.max(0, Math.min(1, d.currentOpacity));

            dummy.position.set(d.x, d.y, d.z);

            // Scale by opacity to "dry up" visually
            const s = d.scale * (d.currentOpacity > 0.01 ? 1 : 0);
            dummy.scale.setScalar(s);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshPhysicalMaterial
                color="#ffffff"
                transmission={0.95}
                roughness={0.1}
                metalness={0.1}
                ior={1.33}
                transparent
                opacity={0.8}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

export default Condensation;
