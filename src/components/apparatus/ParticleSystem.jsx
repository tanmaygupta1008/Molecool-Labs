import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleSystem = ({
    position = [0, 0, 0],
    path = null, // Array of points for tube flow
    type = 'gas_rise', // 'gas_rise', 'gas_flow', 'smoke', 'flash'
    color = '#ffffff',
    density = 1.0,
    count = 50,
    scale = 1.0
}) => {
    const meshRef = useRef();

    // Create instanced mesh for performance
    const particleCount = useMemo(() => Math.floor(count * density), [count, density]);

    // Particle state buffer
    // [x, y, z, age, speed, scale, pathProgress]
    const particles = useMemo(() => {
        const data = new Float32Array(particleCount * 7);
        for (let i = 0; i < particleCount; i++) {
            const i7 = i * 7;
            // Initialize randomly
            data[i7] = position[0] + (Math.random() - 0.5) * 0.2; // x
            data[i7 + 1] = position[1] + Math.random() * 0.5;   // y
            data[i7 + 2] = position[2] + (Math.random() - 0.5) * 0.2; // z
            data[i7 + 3] = Math.random(); // age (0 to 1)
            data[i7 + 4] = 0.5 + Math.random() * 0.5; // speed
            data[i7 + 5] = scale * (0.5 + Math.random() * 0.5); // scale
            data[i7 + 6] = Math.random(); // pathProgress (0 to 1) for tube flow
        }
        return data;
    }, [particleCount, position, scale]);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const materialColor = useMemo(() => new THREE.Color(color), [color]);

    // Path Curve (if provided)
    const curve = useMemo(() => {
        if (path && path.length > 1) {
            // Convert points array to Vector3
            const vectors = path.map(p => new THREE.Vector3(p[0], p[1], p[2]));
            return new THREE.CatmullRomCurve3(vectors);
        }
        return null;
    }, [path]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        for (let i = 0; i < particleCount; i++) {
            const i7 = i * 7;

            let x = particles[i7];
            let y = particles[i7 + 1];
            let z = particles[i7 + 2];
            let age = particles[i7 + 3];
            let speed = particles[i7 + 4];
            let pScale = particles[i7 + 5];
            let progress = particles[i7 + 6];

            // Update Logic based on Type
            if (type === 'gas_flow' && curve) {
                // FLOW ALONG PATH
                progress += speed * delta * 0.5; // Move along path
                if (progress > 1) progress = 0;

                const point = curve.getPointAt(progress);
                // Add some jitter
                x = point.x + (Math.random() - 0.5) * 0.05;
                y = point.y + (Math.random() - 0.5) * 0.05;
                z = point.z + (Math.random() - 0.5) * 0.05;

                particles[i7 + 6] = progress;
            } else {
                // FREE RISE (Smoke/Gas)
                y += speed * delta;
                age += delta * 0.5;

                // Reset if too old or high
                if (age > 1 || y > position[1] + 2) {
                    y = position[1];
                    x = position[0] + (Math.random() - 0.5) * 0.2;
                    z = position[2] + (Math.random() - 0.5) * 0.2;
                    age = 0;
                }

                // Drift
                x += Math.sin(state.clock.elapsedTime + i) * 0.002;
            }

            // Save state
            particles[i7] = x;
            particles[i7 + 1] = y;
            particles[i7 + 2] = z;
            particles[i7 + 3] = age;

            // Update Instance
            dummy.position.set(x, y, z);

            // Scale creates fade in/out effect
            const size = type === 'gas_flow'
                ? pScale * Math.sin(progress * Math.PI) // Fade at ends of tube
                : pScale * Math.sin(age * Math.PI); // Fade in/out for rising smoke

            dummy.scale.setScalar(Math.max(0, size));
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, particleCount]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
                color={materialColor}
                transparent
                opacity={0.6}
                roughness={1}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

export default ParticleSystem;
