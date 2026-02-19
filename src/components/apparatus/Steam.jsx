import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Steam = ({
    count = 50,
    startHeight = 0,
    maxHeight = 3,
    radiusFunction = (y) => 0.5,
    color = "white",
    opacity = 0.2,
    isBoiling = false,
    scale = 1.0
}) => {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // { x, y, z, speed, scale, offset, driftX, driftZ }
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            return {
                x: 0,
                y: startHeight + Math.random() * (maxHeight - startHeight), // Distribute initially
                z: 0,
                speed: 0.2 + Math.random() * 0.3,
                scale: Math.random(),
                offset: Math.random() * 100,
                driftAngle: Math.random() * Math.PI * 2
            };
        });
    }, [count, startHeight, maxHeight]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        particles.forEach((p, i) => {
            if (isBoiling) {
                // Rise
                p.y += p.speed * delta;

                // Drift
                const t = state.clock.elapsedTime + p.offset;
                p.x += Math.sin(t * 2 + p.driftAngle) * 0.005;
                p.z += Math.cos(t * 1.5 + p.driftAngle) * 0.005;

                // Reset length
                if (p.y > maxHeight + 0.5) { // Allow slight overflow for fade out
                    p.y = startHeight;
                    // Reset to center-ish with some spread
                    const r = Math.random() * radiusFunction(startHeight) * 0.5;
                    const theta = Math.random() * Math.PI * 2;
                    p.x = r * Math.cos(theta);
                    p.z = r * Math.sin(theta);
                    p.scale = Math.random();
                }

                // Constrain
                const maxR = radiusFunction(p.y);
                const currentDist = Math.sqrt(p.x * p.x + p.z * p.z);
                if (currentDist > maxR * 0.9) {
                    // Push back inside
                    const angle = Math.atan2(p.z, p.x);
                    p.x = (maxR * 0.85) * Math.cos(angle);
                    p.z = (maxR * 0.85) * Math.sin(angle);
                }

                // Scale/Opacity based on life
                // Fade in at bottom, fade out at top
                const life = (p.y - startHeight) / (maxHeight - startHeight);
                // 0 -> 0.1 -> 1 -> 0
                let alpha = 1;
                if (life < 0.1) alpha = life * 10;
                else if (life > 0.8) alpha = 1 - (life - 0.8) * 5;

                // Visuals
                dummy.position.set(p.x, p.y, p.z);
                const s = (p.scale * 0.5 + 0.5) * scale * (1 + life); // Grow slightly
                dummy.scale.setScalar(s * 0.15); // Base size

                // We'll use color attribute for fade if using custom shader, but with standard material we can't easily per-instance opacity.
                // We can use scale 0 to hide.
                if (alpha <= 0) dummy.scale.setScalar(0);

                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            } else {
                // Shrink if not boiling
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

export default Steam;
