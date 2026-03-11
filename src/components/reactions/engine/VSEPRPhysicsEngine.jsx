'use client';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Physics Engine that runs every frame to simulate VSEPR layout
 * Bonded atoms are pulled together to a target length
 * All atoms repel each other via Coulomb force to maximize angles.
 */
const VSEPRPhysicsEngine = ({ active, script, updateAllAtomPositions }) => {
    const velocities = useRef({});

    // Initialize velocities
    useEffect(() => {
        script.atoms.forEach(a => {
            if (!velocities.current[a.id]) {
                velocities.current[a.id] = new THREE.Vector3();
            }
        });
    }, [script.atoms]);

    // Pre-calculate molecule groups (connected components) so separate molecules don't repel into infinity.
    const atomMoleculeMap = useMemo(() => {
        const map = {};
        const adj = {};
        script.atoms.forEach(a => {
            adj[a.id] = [];
            map[a.id] = null;
        });
        script.bonds.forEach(b => {
            if (adj[b.from]) adj[b.from].push(b.to);
            if (adj[b.to]) adj[b.to].push(b.from);
        });

        let molId = 0;
        const visited = new Set();
        script.atoms.forEach(a => {
            if (!visited.has(a.id)) {
                molId++;
                const q = [a.id];
                while (q.length > 0) {
                    const curr = q.shift();
                    if (!visited.has(curr)) {
                        visited.add(curr);
                        map[curr] = molId;
                        (adj[curr] || []).forEach(neighbor => {
                            if (!visited.has(neighbor)) q.push(neighbor);
                        });
                    }
                }
            }
        });
        return map;
    }, [script.atoms, script.bonds]);

    useFrame((state, delta) => {
        if (!active || script.atoms.length < 2) return;

        const dt = Math.min(delta, 0.05); // Cap to prevent explosions
        const k_spring = 200.0; // Stiff bonds
        const target_L = 2.0;
        const k_repel = 150.0; // Strong Coulomb constant
        const damping = 0.3; // Velocity damping (friction)

        const forces = {};

        script.atoms.forEach(a => {
            const posToUse = a.currentPos || a.startPos;
            const pos = new THREE.Vector3(...posToUse);
            forces[a.id] = new THREE.Vector3();

            // Soft spherical boundary to prevent infinite drift
            const dist = pos.length();
            if (dist > 8) {
                // Hard push back into bounding sphere of radius 8
                forces[a.id].add(pos.clone().normalize().multiplyScalar(-10 * (dist - 8)));
            } else {
                // Firm centering to keep products clustered together without drifting
                forces[a.id].add(pos.clone().multiplyScalar(-0.5));
            }
        });

        // 1. Spring forces (Bonds)
        script.bonds.forEach(b => {
            const a1 = script.atoms.find(a => a.id === b.from);
            const a2 = script.atoms.find(a => a.id === b.to);
            if (a1 && a2) {
                const p1 = new THREE.Vector3(...(a1.currentPos || a1.startPos));
                const p2 = new THREE.Vector3(...(a2.currentPos || a2.startPos));
                const diff = p2.clone().sub(p1);
                const dist = diff.length();
                if (dist > 0.001) {
                    const actualTargetL = target_L - (b.order - 1) * 0.3;

                    let current_k = k_spring;
                    if (b.state === 'breaking') {
                        current_k = k_spring * Math.max(0, 1.0 - (b.progress || 0));
                    } else if (b.state === 'forming') {
                        current_k = k_spring * Math.max(0, b.progress || 0);
                    }

                    const f = (dist - actualTargetL) * current_k;
                    const forceVec = diff.normalize().multiplyScalar(f);
                    forces[a1.id].add(forceVec);
                    forces[a2.id].sub(forceVec);
                }
            }
        });

        // 2. Coulomb Repulsion (pushes all atoms apart)
        for (let i = 0; i < script.atoms.length; i++) {
            for (let j = i + 1; j < script.atoms.length; j++) {
                const a1 = script.atoms[i];
                const a2 = script.atoms[j];
                const p1 = new THREE.Vector3(...(a1.currentPos || a1.startPos));
                const p2 = new THREE.Vector3(...(a2.currentPos || a2.startPos));

                const diff = p1.clone().sub(p2);
                let distSq = diff.lengthSq();

                // Break perfectly identical overlap traps
                if (distSq < 0.5) {
                    diff.x += (Math.random() - 0.5) * 1.5;
                    diff.y += (Math.random() - 0.5) * 1.5;
                    diff.z += (Math.random() - 0.5) * 1.5;
                    distSq = diff.lengthSq();
                }

                let f = 0;
                if (atomMoleculeMap[a1.id] !== atomMoleculeMap[a2.id]) {
                    // Different molecules: Strong push if they overlap, rapid falloff.
                    // Instead of 1/r^3 which falls off too fast to prevent clipping of large atoms,
                    // we use a strong baseline repulsion that pushes them at least 3-4 units apart.
                    f = 150.0 / Math.max(distSq, 0.1);
                    
                    // If they are dangerously close (clipping), apply a massive exponential spike force
                    if (distSq < 4.0) {
                        f += 500.0 * Math.exp(-distSq);
                    }
                } else {
                    // Same molecule: Standard VSEPR repulsion, boosted for double/triple bonds
                    let repulsionMultiplier = 1.0;
                    const maxOrderA1 = script.bonds
                        .filter(b => b.from === a1.id || b.to === a1.id)
                        .reduce((max, b) => Math.max(max, b.order), 1);
                    const maxOrderA2 = script.bonds
                        .filter(b => b.from === a2.id || b.to === a2.id)
                        .reduce((max, b) => Math.max(max, b.order), 1);

                    repulsionMultiplier = 1.0 + ((maxOrderA1 + maxOrderA2) / 2.0 - 1.0) * 0.5;
                    f = (k_repel * repulsionMultiplier) / Math.max(distSq, 0.1);
                }

                // Apply the calculated repulsion force vector to both atoms (equal and opposite)
                const forceVec = diff.normalize().multiplyScalar(f);
                forces[a1.id].add(forceVec);
                forces[a2.id].sub(forceVec);
            }
        }

        // Apply forces & limit updates
        const newPositions = {};
        let needsUpdate = false;

        script.atoms.forEach(a => {
            if (!velocities.current[a.id]) return;

            const acc = forces[a.id];
            velocities.current[a.id].add(acc.multiplyScalar(dt));
            velocities.current[a.id].multiplyScalar(1.0 - damping);

            // Cap velocity
            if (velocities.current[a.id].lengthSq() > 100) {
                velocities.current[a.id].normalize().multiplyScalar(10);
            }

            const speed = velocities.current[a.id].length();
            if (speed > 0.05) { // Threshold to prevent jitter when resting
                needsUpdate = true;
                const baseP = new THREE.Vector3(...(a.currentPos || a.startPos));
                const p = baseP.add(velocities.current[a.id].clone().multiplyScalar(dt));
                newPositions[a.id] = [p.x, p.y, p.z];
            } else {
                velocities.current[a.id].set(0, 0, 0);
                newPositions[a.id] = a.currentPos || a.startPos;
            }
        });

        if (needsUpdate && updateAllAtomPositions) {
            updateAllAtomPositions(newPositions);
        }
    });

    return null;
};

export default VSEPRPhysicsEngine;
