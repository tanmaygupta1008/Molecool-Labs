'use client';
import React, { useRef, useEffect, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, CylinderGeometry, SphereGeometry, MeshStandardMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Precise VSEPR Valence Electron Logic
const getExpectedLonePairs = (atom, bondOrderSum) => {
    let valence = 0;
    if (['F', 'Cl', 'Br', 'I'].includes(atom.element)) valence = 7;
    else if (['O', 'S', 'Se'].includes(atom.element)) valence = 6;
    else if (['N', 'P'].includes(atom.element)) valence = 5;
    else if (['C', 'Si'].includes(atom.element)) valence = 4;
    else if (['B', 'Al'].includes(atom.element)) valence = 3;
    else return 0;
    const charge = atom.charge || 0;
    const remaining = valence - charge - bondOrderSum;
    return Math.max(0, Math.floor(remaining / 2));
};

/**
 * VSEPR Repulsion Strength Table
 * Matches: LP–LP > LP–BP₃ > LP–BP₂ > LP–BP₁ > BP₃–BP₃ > BP₃–BP₂ > BP₃–BP₁ > BP₂–BP₂ > BP₂–BP₁ > BP₁–BP₁
 *
 * typeA and typeB are: 'LP' | 'BP1' | 'BP2' | 'BP3'
 */
const VSEPR_BASE = 100.0; // Base repulsion unit

const getRepulsionStrength = (typeA, typeB) => {
    // Canonical order: LP > BP3 > BP2 > BP1 — sort to normalize pair
    const rank = { LP: 3, BP3: 2, BP2: 1, BP1: 0 };
    const [hi, lo] = rank[typeA] >= rank[typeB] ? [typeA, typeB] : [typeB, typeA];

    if (hi === 'LP'  && lo === 'LP')  return VSEPR_BASE * 2.20; // LP–LP:  Highest
    if (hi === 'LP'  && lo === 'BP3') return VSEPR_BASE * 1.80; // LP–BP₃: Very High
    if (hi === 'LP'  && lo === 'BP2') return VSEPR_BASE * 1.50; // LP–BP₂: High
    if (hi === 'LP'  && lo === 'BP1') return VSEPR_BASE * 1.20; // LP–BP₁: Moderate
    if (hi === 'BP3' && lo === 'BP3') return VSEPR_BASE * 1.50; // BP₃–BP₃: High
    if (hi === 'BP3' && lo === 'BP2') return VSEPR_BASE * 1.30; // BP₃–BP₂: Medium-High
    if (hi === 'BP3' && lo === 'BP1') return VSEPR_BASE * 1.10; // BP₃–BP₁: Medium
    if (hi === 'BP2' && lo === 'BP2') return VSEPR_BASE * 1.00; // BP₂–BP₂: Medium
    if (hi === 'BP2' && lo === 'BP1') return VSEPR_BASE * 0.85; // BP₂–BP₁: Low-Medium
    if (hi === 'BP1' && lo === 'BP1') return VSEPR_BASE * 0.70; // BP₁–BP₁: Lowest
    return VSEPR_BASE; // Fallback
};

/** Convert bond order integer to BP type string */
const bpType = (order) => {
    if (order >= 3) return 'BP3';
    if (order === 2) return 'BP2';
    return 'BP1';
};

// Orbital Visual Component (Teardrop shape pointing towards +Y local up)
const LonePairOrbital = forwardRef((props, ref) => {
    const combinedRef = useRef(null);
    const electronsRef = useRef(null);

    // Merge forwarded ref so parent can animate position directly without re-renders
    useEffect(() => {
        if (typeof ref === 'function') ref(combinedRef.current);
        else if (ref) ref.current = combinedRef.current;
    }, [ref]);

    useFrame(() => {
        if (electronsRef.current && combinedRef.current?.visible) {
            electronsRef.current.rotation.y += 0.03; // Slow rotation of electrons
        }
    });

    return (
        <group ref={combinedRef} visible={false}>
            {/* The Lobe - Increased size and length */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.3, 0.05, 1.0, 16]} />
                <meshStandardMaterial color="#88ddff" transparent opacity={0.3} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.1, 0]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#88ddff" transparent opacity={0.3} roughness={0.1} />
            </mesh>
            
            {/* Rotating Electrons container */}
            <group ref={electronsRef} position={[0, 1.1, 0]}>
                {/* Electron 1 */}
                <mesh position={[-0.15, 0, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={0.8} />
                </mesh>
                {/* Electron 2 */}
                <mesh position={[0.15, 0, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={0.8} />
                </mesh>
            </group>
        </group>
    );
});
LonePairOrbital.displayName = 'LonePairOrbital';

/**
 * Physics Engine that runs every frame to simulate VSEPR layout
 * Uses mathematical constrained spherical projection for perfect VSEPR geometry.
 */
const VSEPRPhysicsEngine = ({ active, script, updateAllAtomPositions, showLonePairs = false }) => {
    const velocities = useRef({});
    
    // Physics Refs for virtual Lone Pairs (LPs)
    const lpPositions = useRef([]);
    const lpVelocities = useRef([]);
    const lpRefs = useRef([]); 

    // Initialize velocities
    useEffect(() => {
        script.atoms.forEach(a => {
            if (!velocities.current[a.id]) velocities.current[a.id] = new THREE.Vector3();
        });
    }, [script.atoms]);

    // Pre-calculate molecule adjacencies
    const { atomMoleculeMap, adjMap } = useMemo(() => {
        const molMap = {};
        const adj = {};
        script.atoms.forEach(a => { adj[a.id] = []; molMap[a.id] = null; });
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
                        molMap[curr] = molId;
                        (adj[curr] || []).forEach(neighbor => {
                            if (!visited.has(neighbor)) q.push(neighbor);
                        });
                    }
                }
            }
        });
        return { atomMoleculeMap: molMap, adjMap: adj };
    }, [script.atoms, script.bonds]);

    useFrame((state, delta) => {
        // Total completely empty script exit
        if (script.atoms.length === 0) return;

        // If the engine is fully off (no layout AND no lone pairs requested), we can just idle
        if (!active && !showLonePairs) {
            lpRefs.current.forEach(ref => { if(ref) ref.visible = false; });
            return;
        }

        const dt = Math.min(delta, 0.05); 
        const k_spring = 300.0;
        const target_L = 2.0;
        const k_repel_atoms = 150.0; 
        const damping = 0.6; 

        // Strictly defined VSEPR parameters
        const LP_DISTANCE = 0.8;

        const forces = {};
        const lpForces = [];
        
        // Count actual bonds and bond orders for precise electron accounting
        const bondOrderSums = {};
        script.atoms.forEach(a => bondOrderSums[a.id] = 0);
        script.bonds.forEach(b => { 
            if(bondOrderSums[b.from]!==undefined) bondOrderSums[b.from] += b.order; 
            if(bondOrderSums[b.to]!==undefined) bondOrderSums[b.to] += b.order; 
        });

        script.atoms.forEach(a => {
            forces[a.id] = new THREE.Vector3();
            // Origin Centering Force to suppress overall drift
            const p = new THREE.Vector3(...(a.currentPos || a.startPos));
            forces[a.id].add(p.multiplyScalar(-1.5)); 
            
            // Add tiny thermal noise to break 2D planar symmetry (crucial for 3D VSEPR)
            forces[a.id].add(new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).multiplyScalar(8.0)); // Micro-force allows breaking out of Z=0 local minimum
        });

        // 1. Spring forces (Bonds)
        script.bonds.forEach(b => {
            const a1 = script.atoms.find(a => a.id === b.from);
            const a2 = script.atoms.find(a => a.id === b.to);
            if (a1 && a2) {
                const p1 = new THREE.Vector3(...(a1.currentPos || a1.startPos));
                const p2 = new THREE.Vector3(...(a2.currentPos || a2.startPos));
                const diff = p2.clone().sub(p1);
                let dist = diff.length();
                if (dist < 0.01) { diff.set(0.01, 0, 0); dist = 0.01; }

                const actualTargetL = target_L - (b.order - 1) * 0.3;
                let current_k = k_spring;
                if (b.state === 'breaking') current_k = k_spring * Math.max(0, 1.0 - (b.progress || 0));
                else if (b.state === 'forming') current_k = k_spring * Math.max(0, b.progress || 0);

                const f = (dist - actualTargetL) * current_k;
                const forceVec = diff.normalize().multiplyScalar(f);
                forces[a1.id].add(forceVec);
                forces[a2.id].sub(forceVec); 
            }
        });

        // 2. Base Atom Coulomb Repulsion (keeps non-bonded atoms from crashing)
        for (let i = 0; i < script.atoms.length; i++) {
            for (let j = i + 1; j < script.atoms.length; j++) {
                const a1 = script.atoms[i];
                const a2 = script.atoms[j];
                // Skip directly bonded, their spring controls their distance
                if (adjMap[a1.id].includes(a2.id)) continue;

                const p1 = new THREE.Vector3(...(a1.currentPos || a1.startPos));
                const p2 = new THREE.Vector3(...(a2.currentPos || a2.startPos));

                const diff = p1.clone().sub(p2);
                let distSq = diff.lengthSq();

                if (distSq < 0.01) { diff.set(0.1, 0.1, 0); distSq = 0.02; }

                let f = 0;
                if (atomMoleculeMap[a1.id] !== atomMoleculeMap[a2.id]) {
                    f = 150.0 / distSq;
                    if (distSq < 4.0) f += 500.0 * Math.exp(-distSq);
                } else {
                    f = k_repel_atoms / distSq;
                }

                const forceVec = diff.normalize().multiplyScalar(f);
                forces[a1.id].add(forceVec);
                forces[a2.id].sub(forceVec); 
            }
        }

        // 3. STRICT MATHEMATICAL VSEPR SOLVER (Spherical Domains)
        let lpIndex = 0;
        
        const totalLPs = script.atoms.reduce((count, a) => count + getExpectedLonePairs(a, bondOrderSums[a.id]), 0);
        for(let l=0; l<totalLPs; l++) lpForces.push(new THREE.Vector3());

        script.atoms.forEach((a) => {
            const numLP = getExpectedLonePairs(a, bondOrderSums[a.id]);
            const pCenter = new THREE.Vector3(...(a.currentPos || a.startPos));
            
            // Collect Bonded Vectors normalized onto the surface of the sphere
            // Each entry also carries the bond order so repulsion can be scaled correctly
            const bondedPoints = adjMap[a.id].map(neighborId => {
                const bond = script.bonds.find(b =>
                    (b.from === a.id && b.to === neighborId) ||
                    (b.to === a.id && b.from === neighborId)
                );
                const bondOrder = bond ? (bond.order || 1) : 1;
                const otherAtom = script.atoms.find(oa => oa.id === neighborId);
                const pOther = new THREE.Vector3(...(otherAtom.currentPos || otherAtom.startPos));
                const dir = pOther.clone().sub(pCenter);
                if (dir.lengthSq() < 0.01) dir.set(1, 0, 0);
                return {
                    id: neighborId,
                    bondOrder,
                    type: bpType(bondOrder),
                    posOnSphere: pCenter.clone().add(dir.normalize().multiplyScalar(LP_DISTANCE)),
                    realPos: pOther
                };
            });

            // C. Explicit BP vs BP Angular Repulsion (VSEPR Engine Core)
            // Mathematically guarantees perfect Linear (2), TrigPlanar (3), Tetrahedral (4), TriBipyramidal (5), Octahedral (6)
            for (let i = 0; i < bondedPoints.length; i++) {
                for (let j = i + 1; j < bondedPoints.length; j++) {
                    const bp1 = bondedPoints[i];
                    const bp2 = bondedPoints[j];

                    // Calculate distance along the valence shell projection
                    const dir = bp1.posOnSphere.clone().sub(bp2.posOnSphere);
                    let ds = dir.lengthSq();
                    if (ds < 0.01) { dir.set(0.1, 0.1, 0); ds = 0.02; }

                    // Use the exact VSEPR repulsion table for BP vs BP (e.g. BP3 repels BP1 stronger than BP1 repels BP1)
                    const fmag = getRepulsionStrength(bp1.type, bp2.type) / ds;
                    const bendingForce = dir.normalize().multiplyScalar(fmag * 0.5);

                    // Push the actual physical atoms apart to achieve the ideal VSEPR angle
                    forces[bp1.id].add(bendingForce);
                    forces[bp2.id].sub(bendingForce);
                }
            }

            for (let l = 0; l < numLP; l++) {
                const currentLpIndex = lpIndex + l;
                
                // Initialize LP strictly on the boundary sphere
                if (!lpPositions.current[currentLpIndex]) {
                    const offset = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(LP_DISTANCE);
                    lpPositions.current[currentLpIndex] = pCenter.clone().add(offset);
                    lpVelocities.current[currentLpIndex] = new THREE.Vector3();
                }
                const pLp = lpPositions.current[currentLpIndex];
                const fLp = new THREE.Vector3(); // Local accumulator

                // A. LP vs LP Repulsion  (Highest — from table)
                for (let ol = l + 1; ol < numLP; ol++) {
                    const otherLpIndex = lpIndex + ol;
                    const oLpPos = lpPositions.current[otherLpIndex];
                    if (oLpPos) {
                        const dir = pLp.clone().sub(oLpPos);
                        let ds = dir.lengthSq();
                        if (ds < 0.01) { dir.set(0.1, 0, 0); ds = 0.01; }

                        const fmag = getRepulsionStrength('LP', 'LP') / ds;
                        const fvec = dir.normalize().multiplyScalar(fmag);
                        fLp.add(fvec);
                        lpForces[otherLpIndex].sub(fvec);
                    }
                }

                // B. LP vs Bond-Pair Repulsion (LP – BP₁/₂/₃ — from table)
                bondedPoints.forEach(bp => {
                    const dir = pLp.clone().sub(bp.posOnSphere);
                    let ds = dir.lengthSq();
                    if (ds < 0.01) { dir.set(0.1, 0, 0); ds = 0.01; }

                    // Use VSEPR table: LP vs this bond's type (BP1/BP2/BP3)
                    const fmag = getRepulsionStrength('LP', bp.type) / ds;
                    const fvec = dir.normalize().multiplyScalar(fmag);

                    fLp.add(fvec); // Pushes LP away from bond along sphere

                    // Backforce: bends the actual bonded atom (gives the 104.5° effect)
                    const bendingForce = bp.realPos.clone().sub(pLp).normalize().multiplyScalar(fmag * 0.4);
                    forces[bp.id].add(bendingForce);
                    forces[a.id].sub(bendingForce);
                });
                
                // Apply all gathered symmetric forces to the master tracker
                lpForces[currentLpIndex].add(fLp);
            }
            lpIndex += numLP;
        });

        // Integrate Kinematics for Lone Pairs using Tangential Projection
        for(let l = 0; l < totalLPs; l++) {
            const pLp = lpPositions.current[l];
            const vLp = lpVelocities.current[l];
            
            // Find which central atom this LP belongs to
            let lpOwnerAtomIdx = -1, acc = 0;
            for(let ai=0; ai<script.atoms.length; ai++) {
                const lpCount = getExpectedLonePairs(script.atoms[ai], bondOrderSums[script.atoms[ai].id]);
                if(l >= acc && l < acc + lpCount) { lpOwnerAtomIdx = ai; break; }
                acc += lpCount;
            }

            if (lpOwnerAtomIdx !== -1) {
                const aOwner = script.atoms[lpOwnerAtomIdx];
                const pCenter = new THREE.Vector3(...(aOwner.currentPos || aOwner.startPos));

                // Constrain forces to surface tangent
                const normal = pLp.clone().sub(pCenter).normalize();
                const fTangent = lpForces[l].clone().sub(normal.clone().multiplyScalar(lpForces[l].dot(normal)));

                vLp.add(fTangent.multiplyScalar(dt));
                vLp.multiplyScalar(1.0 - 0.7); // High damping on sphere
                if (vLp.lengthSq() > 100) vLp.normalize().multiplyScalar(10);
                pLp.add(vLp.clone().multiplyScalar(dt));

                // Strictly Restrict to sphere surface distance
                const updatedNormal = pLp.clone().sub(pCenter).normalize();
                pLp.copy(pCenter.clone().add(updatedNormal.multiplyScalar(LP_DISTANCE)));

                // Visual update: Lobe anchors to central atom, points to `pLp`
                if (lpRefs.current[l]) {
                    lpRefs.current[l].position.copy(pCenter);
                    const orientation = updatedNormal.clone();
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), orientation);
                    lpRefs.current[l].quaternion.copy(quaternion);
                    lpRefs.current[l].visible = showLonePairs;
                }
            }
        }

        for(let l = totalLPs; l < lpRefs.current.length; l++) {
            if (lpRefs.current[l]) lpRefs.current[l].visible = false;
        }

        // Apply Kinematics for ATOMS (only if Auto-Layout is active)
        if (active) {
            const newPositions = {};
            let needsUpdate = false;

            script.atoms.forEach(a => {
                if (!velocities.current[a.id]) return;

                const acc = forces[a.id];
                velocities.current[a.id].add(acc.multiplyScalar(dt));
                velocities.current[a.id].multiplyScalar(1.0 - damping); 

                if (velocities.current[a.id].lengthSq() > 100) velocities.current[a.id].normalize().multiplyScalar(10);

                const speed = velocities.current[a.id].length();
                if (speed > 0.05) { 
                    needsUpdate = true;
                    const baseP = new THREE.Vector3(...(a.currentPos || a.startPos));
                    const p = baseP.add(velocities.current[a.id].clone().multiplyScalar(dt));
                    newPositions[a.id] = [p.x, p.y, p.z];
                } else {
                    velocities.current[a.id].set(0, 0, 0);
                }
            });

            if (needsUpdate && updateAllAtomPositions) {
                updateAllAtomPositions(newPositions);
            }
        }
    });

    return (
        <group>
            {Array(40).fill().map((_, i) => (
                <LonePairOrbital key={`vsepr-lp-${i}`} ref={el => lpRefs.current[i] = el} />
            ))}
        </group>
    );
};

export default VSEPRPhysicsEngine;
