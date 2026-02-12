// src/components/reactions/views/components/ParticleSystem.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

const Particle = ({ config, progress }) => {
    const ref = useRef();
    const {
        speed = 0.05,
        spread = 1,
        scale = 1,
        color = 'white',
        type = 'bubble', // bubble, smoke, precipitate
        life = 1
    } = config;

    // Initial random state
    const initialState = useMemo(() => ({
        position: [
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        ],
        velocity: [0, 0, 0],
        scale: Math.random() * scale * 0.5 + scale * 0.5,
        offset: Math.random() * 100
    }), [spread, scale]);

    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.getElapsedTime();

        // Update Position based on Type
        if (type === 'bubble') {
            // Rise up
            ref.current.position.y += speed * (Math.sin(time + initialState.offset) * 0.2 + 1);
            ref.current.position.x += Math.sin(time * 2 + initialState.offset) * 0.01;

            // Loop functionality
            if (ref.current.position.y > 2) {
                ref.current.position.y = -2;
                ref.current.position.x = initialState.position[0];
            }
        } else if (type === 'smoke') {
            // Rise and spread
            ref.current.position.y += speed;
            ref.current.position.x += Math.sin(time + initialState.offset) * 0.02;

            // Reset
            if (ref.current.position.y > 4) {
                ref.current.position.y = 0;
                ref.current.scale.setScalar(initialState.scale);
            } else {
                // Grow and fade
                ref.current.scale.multiplyScalar(1.01);
            }
        } else if (type === 'precipitate') {
            // Fall down
            ref.current.position.y -= speed;
            if (ref.current.position.y < -2) {
                // Settle at bottom? For now just loop
                ref.current.position.y = 2;
            }
        } else if (type === 'flame') {
            // Flicker up
            ref.current.position.y += speed * 2;
            ref.current.scale.setScalar(initialState.scale * (Math.sin(time * 10 + initialState.offset) * 0.3 + 1));
            if (ref.current.position.y > 1) {
                ref.current.position.y = 0;
            }
        }

    });

    return <Instance ref={ref} position={initialState.position} color={color} />;
};

const ParticleSystem = ({ count = 20, config = {}, progress = 0 }) => {
    return (
        <Instances range={count}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial transparent opacity={0.6} />
            {Array.from({ length: count }).map((_, i) => (
                <Particle key={i} config={config} progress={progress} />
            ))}
        </Instances>
    );
};

export default ParticleSystem;
