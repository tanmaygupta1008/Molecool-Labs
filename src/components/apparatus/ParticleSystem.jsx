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
    scale = 1.0,
    isPlaying = true
}) => {
    const meshRef = useRef();

    // Create instanced mesh for performance
    const particleCount = useMemo(() => Math.floor(count * density), [count, density]);

    // Particle state buffer
    // [x, y, z, age, speed, scale, pathProgress]
    const particles = useMemo(() => {
        const data = new Float32Array(particleCount * 7);
        const safePos = [
            isNaN(position[0]) ? 0 : position[0],
            isNaN(position[1]) ? 0 : position[1],
            isNaN(position[2]) ? 0 : position[2]
        ];

        for (let i = 0; i < particleCount; i++) {
            const i7 = i * 7;
            // Initialize randomly
            data[i7] = safePos[0] + (Math.random() - 0.5) * 0.2; // x
            data[i7 + 1] = safePos[1] + Math.random() * 0.5;   // y
            data[i7 + 2] = safePos[2] + (Math.random() - 0.5) * 0.2; // z
            data[i7 + 3] = Math.random(); // age (0 to 1)
            data[i7 + 4] = 0.5 + Math.random() * 0.5; // speed
            data[i7 + 5] = scale * (0.5 + Math.random() * 0.5); // scale
            data[i7 + 6] = Math.random(); // pathProgress (0 to 1) for tube flow
        }
        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [particleCount, scale]); // Specifically ignore position to prevent recreation thrashing during animation

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const materialColor = useMemo(() => new THREE.Color(color), [color]);

    const pathJson = JSON.stringify(path);
    // Path Curve (if provided)
    const curve = useMemo(() => {
        if (path && path.length > 1) {
            // Convert points array to Vector3
            const vectors = path.map(p => new THREE.Vector3(p[0], p[1], p[2]));
            return new THREE.CatmullRomCurve3(vectors);
        }
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathJson]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Debugging
        if (state.clock.elapsedTime < 0.1) {
            console.log("ParticleSystem Render:", { type, count, position, color });
        }

        // Protect against massive delta spikes when unpausing or scrubbing
        const safeDelta = Math.min(delta, 0.1);

        if (!isPlaying) return; // Pause updates if not playing

        const safePos = [
            isNaN(position[0]) ? 0 : position[0],
            isNaN(position[1]) ? 0 : position[1],
            isNaN(position[2]) ? 0 : position[2]
        ];

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
                progress += speed * safeDelta * 0.5; // Move along path
                if (progress > 1) progress = 0;

                const point = curve.getPointAt(progress);
                // Add some jitter
                x = point.x + (Math.random() - 0.5) * 0.05;
                y = point.y + (Math.random() - 0.5) * 0.05;
                z = point.z + (Math.random() - 0.5) * 0.05;

                particles[i7 + 6] = progress;
            } else {
                // FREE RISE (Smoke/Gas)
                y += speed * safeDelta;
                age += safeDelta * 0.5;

                // Reset if too old or high
                if (age > 1 || y > safePos[1] + 2) {
                    y = safePos[1];
                    x = safePos[0] + (Math.random() - 0.5) * 0.2;
                    z = safePos[2] + (Math.random() - 0.5) * 0.2;
                    age = 0;
                }

                // Drift
                x += Math.sin(state.clock.elapsedTime + i) * 0.002;
            }

            // Save state
            particles[i7] = isNaN(x) ? 0 : x;
            particles[i7 + 1] = isNaN(y) ? 0 : y;
            particles[i7 + 2] = isNaN(z) ? 0 : z;
            particles[i7 + 3] = isNaN(age) ? 0 : age;

            // Update Instance
            dummy.position.set(particles[i7], particles[i7 + 1], particles[i7 + 2]);

            // Scale creates fade in/out effect, clamp to avoid negative/NaN issues
            let size = type === 'gas_flow' || type === 'flow'
                ? pScale * Math.sin(progress * Math.PI)
                : pScale * Math.sin(age * Math.PI);

            // Hard clamp size to be strictly positive
            if (isNaN(size) || !isFinite(size) || size < 0.001) {
                size = 0.001;
            }

            dummy.scale.setScalar(size);
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
