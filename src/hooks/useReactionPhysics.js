// src/hooks/useReactionPhysics.js
import { useRef, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

const REPULSION_DIST = 1.2; // Atoms push away if closer than this
const K_REPULSION = 5.0;    // Strength of repulsion
const K_ATTRACTION = 2.0;   // Strength of pull toward target
const DAMPING = 0.9;        // Friction (prevents infinite bouncing)

export const useReactionPhysics = (atoms, progress, temperature = 1.0) => {
    // Initialize physics state (positions and velocities)
    const physicsState = useMemo(() => {
        return atoms.map(atom => ({
            position: new Vector3(...atom.startPos),
            velocity: new Vector3(0, 0, 0),
            target: new Vector3(), // Will be calculated based on progress
            baseStart: new Vector3(...atom.startPos),
            baseEnd: new Vector3(...atom.endPos)
        }));
    }, [atoms]);

    useFrame((state, delta) => {
        // Clamp delta to prevent explosion on lag spikes
        const dt = Math.min(delta, 0.05);

        physicsState.forEach((p, i) => {
            // 1. Calculate Target Position (The "Guide" Force)
            // Atoms want to be at the interpolated position based on reaction progress
            p.target.lerpVectors(p.baseStart, p.baseEnd, progress);

            // 2. Attraction Force (Steering toward target)
            const force = new Vector3().subVectors(p.target, p.position).multiplyScalar(K_ATTRACTION);

            // 3. Repulsion Force (Coulomb-like / Van der Waals)
            // Check against every other atom
            physicsState.forEach((other, j) => {
                if (i === j) return;
                
                const distVector = new Vector3().subVectors(p.position, other.position);
                const dist = distVector.length();

                if (dist < REPULSION_DIST && dist > 0.01) {
                    // Push away! Force gets stronger as they get closer
                    const magnitude = K_REPULSION * (1.0 / dist - 1.0 / REPULSION_DIST);
                    distVector.normalize().multiplyScalar(magnitude);
                    force.add(distVector);
                }
            });

            // 4. Thermodynamics (Heat = Random Kinetic Energy)
            // Adds random jitter based on temperature variable
            const thermalEnergy = temperature * 2.0; 
            force.x += (Math.random() - 0.5) * thermalEnergy;
            force.y += (Math.random() - 0.5) * thermalEnergy;
            force.z += (Math.random() - 0.5) * thermalEnergy;

            // 5. Integrate (Newton's Laws)
            p.velocity.add(force.multiplyScalar(dt)); // F = ma (assuming mass=1)
            p.velocity.multiplyScalar(DAMPING);       // Friction
            p.position.add(p.velocity.multiplyScalar(dt));
        });
    });

    return physicsState;
};