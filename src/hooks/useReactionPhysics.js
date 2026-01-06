// // src/hooks/useReactionPhysics.js
// import { useRef, useMemo } from 'react';
// import { Vector3 } from 'three';
// import { useFrame } from '@react-three/fiber';

// const REPULSION_DIST = 1.2; // Atoms push away if closer than this
// const K_REPULSION = 5.0;    // Strength of repulsion
// const K_ATTRACTION = 2.0;   // Strength of pull toward target
// const DAMPING = 0.9;        // Friction (prevents infinite bouncing)

// export const useReactionPhysics = (atoms, progress, temperature = 1.0) => {
//     // Initialize physics state (positions and velocities)
//     const physicsState = useMemo(() => {
//         return atoms.map(atom => ({
//             position: new Vector3(...atom.startPos),
//             velocity: new Vector3(0, 0, 0),
//             target: new Vector3(), // Will be calculated based on progress
//             baseStart: new Vector3(...atom.startPos),
//             baseEnd: new Vector3(...atom.endPos)
//         }));
//     }, [atoms]);

//     useFrame((state, delta) => {
//         // Clamp delta to prevent explosion on lag spikes
//         const dt = Math.min(delta, 0.05);

//         physicsState.forEach((p, i) => {
//             // 1. Calculate Target Position (The "Guide" Force)
//             // Atoms want to be at the interpolated position based on reaction progress
//             p.target.lerpVectors(p.baseStart, p.baseEnd, progress);

//             // 2. Attraction Force (Steering toward target)
//             const force = new Vector3().subVectors(p.target, p.position).multiplyScalar(K_ATTRACTION);

//             // 3. Repulsion Force (Coulomb-like / Van der Waals)
//             // Check against every other atom
//             physicsState.forEach((other, j) => {
//                 if (i === j) return;
                
//                 const distVector = new Vector3().subVectors(p.position, other.position);
//                 const dist = distVector.length();

//                 if (dist < REPULSION_DIST && dist > 0.01) {
//                     // Push away! Force gets stronger as they get closer
//                     const magnitude = K_REPULSION * (1.0 / dist - 1.0 / REPULSION_DIST);
//                     distVector.normalize().multiplyScalar(magnitude);
//                     force.add(distVector);
//                 }
//             });

//             // 4. Thermodynamics (Heat = Random Kinetic Energy)
//             // Adds random jitter based on temperature variable
//             const thermalEnergy = temperature * 2.0; 
//             force.x += (Math.random() - 0.5) * thermalEnergy;
//             force.y += (Math.random() - 0.5) * thermalEnergy;
//             force.z += (Math.random() - 0.5) * thermalEnergy;

//             // 5. Integrate (Newton's Laws)
//             p.velocity.add(force.multiplyScalar(dt)); // F = ma (assuming mass=1)
//             p.velocity.multiplyScalar(DAMPING);       // Friction
//             p.position.add(p.velocity.multiplyScalar(dt));
//         });
//     });

//     return physicsState;
// };













// src/hooks/useReactionPhysics.js
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// Physics constants
const REPULSION_DIST = 1.0;
const K_REPULSION = 10.0;      // Increased for stronger collision response
const K_ATTRACTION = 3.5;
const DAMPING = 0.93;
const COLLISION_RESTITUTION = 0.7; // Bounce elasticity

export const useReactionPhysics = (atoms, progress, environment) => {
    // Initialize Physics State
    const physicsState = useMemo(() => {
        return atoms.map(atom => ({
            position: new Vector3(...atom.startPos),
            velocity: new Vector3(0, 0, 0),
            acceleration: new Vector3(0, 0, 0),
            mass: getMass(atom.element),
            baseStart: new Vector3(...atom.startPos),
            baseEnd: new Vector3(...atom.endPos),
            noiseOffset: Math.random() * 100,
            lastCollisionTime: 0
        }));
    }, [atoms]);

    // Track collision history
    const collisionHistory = useRef(new Map());

    useFrame((state, delta) => {
        // Prevent huge time jumps
        const dt = Math.min(delta, 0.05);
        
        // Temperature affects kinetic energy (1 temp unit = 1°C in visualization)
        const tempKelvin = (environment?.temp || 150) + 273.15;
        const tempStrength = Math.sqrt(tempKelvin / 300); // Sqrt because KE ∝ √T
        
        // Boltzmann-like thermal velocity component
        const thermalVelocityScale = tempStrength * 0.15;

        physicsState.forEach((p, i) => {
            // Reset acceleration
            p.acceleration.set(0, 0, 0);

            // === A. TARGET SEEKING (Reaction Coordinate) ===
            const targetPos = new Vector3().lerpVectors(
                p.baseStart, 
                p.baseEnd, 
                progress
            );
            const toTarget = new Vector3().subVectors(targetPos, p.position);
            const seekStrength = K_ATTRACTION * (1 - progress * 0.5); // Weaker as reaction completes
            p.acceleration.add(toTarget.multiplyScalar(seekStrength));

            // === B. INTER-ATOMIC FORCES (Collision & Repulsion) ===
            physicsState.forEach((other, j) => {
                if (i === j) return;

                const distVec = new Vector3().subVectors(p.position, other.position);
                const dist = distVec.length();

                if (dist < 0.001) return; // Prevent singularity

                // Repulsion force (increases sharply at close range)
                if (dist < REPULSION_DIST) {
                    const repulsionStrength = K_REPULSION * Math.pow((1 - dist / REPULSION_DIST), 2);
                    const repulsionForce = distVec.clone().normalize().multiplyScalar(repulsionStrength);
                    p.acceleration.add(repulsionForce.divideScalar(p.mass));

                    // Elastic collision response for very close encounters
                    if (dist < (REPULSION_DIST * 0.5)) {
                        handleElasticCollision(p, other, distVec, dist);
                    }
                }

                // Weak attraction at medium range (bonding tendency)
                if (dist > REPULSION_DIST && dist < 2.0 && progress > 0.3) {
                    const attractionStrength = 0.5 * (1 - dist / 2.0);
                    const attractionForce = distVec.clone().normalize().multiplyScalar(-attractionStrength);
                    p.acceleration.add(attractionForce.divideScalar(p.mass));
                }
            });

            // === C. THERMAL MOTION (Vibration + Brownian) ===
            const time = state.clock.elapsedTime;
            
            // High-frequency vibration (molecular vibration)
            const vibrationFreq = 15 + tempStrength * 10;
            const vibration = new Vector3(
                Math.sin(time * vibrationFreq + p.noiseOffset),
                Math.cos(time * vibrationFreq * 1.2 + p.noiseOffset),
                Math.sin(time * vibrationFreq * 0.8 + p.noiseOffset)
            ).multiplyScalar(tempStrength * 0.08);

            // Low-frequency random walk (Brownian motion)
            const brownianFreq = 2;
            const brownian = new Vector3(
                Math.sin(time * brownianFreq + p.noiseOffset),
                Math.cos(time * brownianFreq * 0.7 + p.noiseOffset),
                Math.sin(time * brownianFreq * 1.3 + p.noiseOffset)
            ).multiplyScalar(0.3);

            // Thermal velocity perturbation (random kicks)
            if (Math.random() < 0.1) {
                const thermalKick = new Vector3(
                    (Math.random() - 0.5),
                    (Math.random() - 0.5),
                    (Math.random() - 0.5)
                ).multiplyScalar(thermalVelocityScale);
                p.velocity.add(thermalKick);
            }

            // === D. INTEGRATE MOTION (Velocity Verlet-like) ===
            p.acceleration.add(vibration);
            
            if (progress > 0.1 && progress < 0.9) {
                p.acceleration.add(brownian);
            }

            // Update velocity
            p.velocity.add(p.acceleration.multiplyScalar(dt));
            
            // Apply damping (simulates drag/friction)
            p.velocity.multiplyScalar(DAMPING);

            // Limit maximum velocity based on temperature
            const maxVelocity = 2 + tempStrength * 2;
            if (p.velocity.length() > maxVelocity) {
                p.velocity.normalize().multiplyScalar(maxVelocity);
            }

            // Update position
            p.position.add(p.velocity.clone().multiplyScalar(dt));

            // === E. BOUNDARY CONDITIONS ===
            // Soft boundaries (invisible walls with slight reflection)
            const boundarySize = 5;
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(p.position[axis]) > boundarySize) {
                    p.position[axis] = Math.sign(p.position[axis]) * boundarySize;
                    p.velocity[axis] *= -0.5; // Damped reflection
                }
            });
        });
    });

    return physicsState;
};

// === HELPER FUNCTIONS ===

/**
 * Get atomic mass (simplified, in atomic mass units)
 */
function getMass(element) {
    const masses = {
        H: 1,
        C: 12,
        N: 14,
        O: 16,
        Na: 23,
        S: 32,
        Cl: 35
    };
    return masses[element] || 12;
}

/**
 * Handle elastic collision between two particles
 * Uses conservation of momentum and energy
 */
function handleElasticCollision(p1, p2, distVec, dist) {
    const now = Date.now();
    
    // Cooldown to prevent jittering
    if (now - p1.lastCollisionTime < 100) return;
    p1.lastCollisionTime = now;

    // Normal vector (collision axis)
    const normal = distVec.clone().normalize();

    // Relative velocity
    const relativeVel = new Vector3().subVectors(p1.velocity, p2.velocity);
    const velAlongNormal = relativeVel.dot(normal);

    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Calculate impulse (simplified elastic collision)
    const restitution = COLLISION_RESTITUTION;
    const impulse = (-(1 + restitution) * velAlongNormal) / (1/p1.mass + 1/p2.mass);

    // Apply impulse to velocities
    const impulseVec = normal.multiplyScalar(impulse);
    p1.velocity.add(impulseVec.clone().divideScalar(p1.mass));
    p2.velocity.sub(impulseVec.clone().divideScalar(p2.mass));

    // Separate overlapping particles
    const overlap = (REPULSION_DIST * 0.5) - dist;
    if (overlap > 0) {
        const separation = normal.clone().multiplyScalar(overlap * 0.5);
        p1.position.add(separation);
        p2.position.sub(separation);
    }
}

/**
 * Calculate kinetic energy of a particle
 */
export function getKineticEnergy(particle) {
    return 0.5 * particle.mass * particle.velocity.lengthSq();
}

/**
 * Get total system kinetic energy
 */
export function getTotalKineticEnergy(physicsState) {
    return physicsState.reduce((sum, p) => sum + getKineticEnergy(p), 0);
}















// // src/hooks/useReactionPhysics.js
// import { useMemo } from 'react';
// import { Vector3 } from 'three';
// import { useFrame } from '@react-three/fiber';

// const REPULSION_DIST = 1.0; 
// const K_REPULSION = 8.0;    
// const K_ATTRACTION = 3.0;   
// const DAMPING = 0.92;        

// export const useReactionPhysics = (atoms, progress, environment) => {
//     // 1. Initialize Physics State
//     const physicsState = useMemo(() => {
//         return atoms.map(atom => ({
//             position: new Vector3(...atom.startPos),
//             velocity: new Vector3(0, 0, 0),
//             baseStart: new Vector3(...atom.startPos),
//             baseEnd: new Vector3(...atom.endPos),
//             // Random offset for brownian motion uniqueness
//             noiseOffset: Math.random() * 100 
//         }));
//     }, [atoms]);

//     useFrame((state, delta) => {
//         // Prevent huge jumps if tab was inactive
//         const dt = Math.min(delta, 0.05);
        
//         // Normalize Temperature (Visual Scale: 0°C to 1000°C maps to 0.0 to 2.0 strength)
//         const tempStrength = Math.max(0.1, environment.temp / 300); 

//         physicsState.forEach((p, i) => {
//             const force = new Vector3(0, 0, 0);

//             // A. Target Seeking (The "Reaction Coordinate" Force)
//             const targetPos = new Vector3().lerpVectors(p.baseStart, p.baseEnd, progress);
//             const seekForce = new Vector3().subVectors(targetPos, p.position).multiplyScalar(K_ATTRACTION);
//             force.add(seekForce);

//             // B. Inter-Atomic Repulsion (Collision Physics)
//             physicsState.forEach((other, j) => {
//                 if (i === j) return;
//                 const distVec = new Vector3().subVectors(p.position, other.position);
//                 const dist = distVec.length();

//                 // Soft repulsion to prevent clipping, but allow bonding
//                 if (dist < REPULSION_DIST && dist > 0.001) {
//                     const push = distVec.normalize().multiplyScalar(K_REPULSION * (1 - dist / REPULSION_DIST));
//                     force.add(push);
//                 }
//             });

//             // C. Thermodynamics (Vibrational Energy)
//             // Adds random kinetic energy based on Temperature
//             const time = state.clock.elapsedTime;
//             const vibration = new Vector3(
//                 Math.sin(time * 20 + p.noiseOffset),
//                 Math.cos(time * 25 + p.noiseOffset),
//                 Math.sin(time * 18 + p.noiseOffset)
//             ).multiplyScalar(tempStrength * 0.05); // Amplitude

//             // D. Brownian Motion (Random Wander)
//             // Atoms don't move in straight lines; they wander slightly
//             const wander = new Vector3(
//                 Math.sin(time * 0.5 + p.noiseOffset),
//                 Math.cos(time * 0.3 + p.noiseOffset),
//                 Math.sin(time * 0.7 + p.noiseOffset)
//             ).multiplyScalar(0.2);

//             // Apply Forces
//             force.add(vibration); // Heat Jitter
//             if (progress < 0.9 && progress > 0.1) force.add(wander); // Wander during reaction

//             // Integrate (Euler)
//             p.velocity.add(force.multiplyScalar(dt));
//             p.velocity.multiplyScalar(DAMPING); // Drag/Friction
//             p.position.add(p.velocity.multiplyScalar(dt));
//         });
//     });

//     return physicsState;
// };