// src/components/reactions/views/sequences/ContactMicroSequence.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Nucleus, AdaptiveElectron, OrbitalCloud } from '../SubatomicElements';
import { MicroHUD } from '../MicroView';

const ContactMicroSequence = ({ reaction, progress }) => {
    // Equation: 2SO2 + O2 -> 2SO3

    let status = "";
    if (progress < 0.3) status = "SO₂ and O₂ molecules approaching V₂O₅ catalyst...";
    else if (progress < 0.6) status = "⚠ O=O double bond breaking. Oxygen atoms separating.";
    else if (progress < 0.8) status = "New bonds forming: S-O (expanding to SO₃)";
    else status = "✓ Sulfur Trioxide (SO₃) formed.";

    const getPos = (atomId) => {
        const atom = reaction.atoms.find(a => a.id === atomId);
        if (!atom) return [0, 0, 0];
        const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
        const vec = new THREE.Vector3().lerpVectors(
            new THREE.Vector3(...atom.startPos),
            new THREE.Vector3(...atom.endPos),
            easedProgress
        );
        return vec.toArray();
    };

    const s1 = getPos(0);
    const o1 = getPos(1);
    const o2 = getPos(2);

    const s2 = getPos(3);
    const o3 = getPos(4);
    const o4 = getPos(5);

    const o5 = getPos(6); // O2
    const o6 = getPos(7); // O2

    const isOOBonded = progress < 0.45;
    const isNewSOBonded = progress > 0.65;

    return (
        <group>
            <MicroHUD
                title="Contact Process (Oxidation)"
                status={status}
                equation="2SO₂ + O₂ ⇌ 2SO₃"
            />

            {/* Catalyst Surface */}
            <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#88aa22" metalness={0.5} roughness={0.6} emissive="#223300" />
            </mesh>

            {/* Atoms */}
            <group position={s1}><Nucleus element="S" color="#ffdd00" size={0.6} /></group>
            <group position={o1}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o2}><Nucleus element="O" color="#ff4444" size={0.4} /></group>

            <group position={s2}><Nucleus element="S" color="#ffdd00" size={0.6} /></group>
            <group position={o3}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o4}><Nucleus element="O" color="#ff4444" size={0.4} /></group>

            <group position={o5}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o6}><Nucleus element="O" color="#ff4444" size={0.4} /></group>

            {/* Existing SO2 Bonds (Always present) */}
            <AdaptiveElectron orbitCenter={s1} sharedCenters={[s1, o1]} color="#ffffaa" phase={0} isShared={true} />
            <AdaptiveElectron orbitCenter={s1} sharedCenters={[s1, o2]} color="#ffffaa" phase={Math.PI} isShared={true} />

            <AdaptiveElectron orbitCenter={s2} sharedCenters={[s2, o3]} color="#ffffaa" phase={0} isShared={true} />
            <AdaptiveElectron orbitCenter={s2} sharedCenters={[s2, o4]} color="#ffffaa" phase={Math.PI} isShared={true} />

            {/* O2 Reactant Bond */}
            <AdaptiveElectron orbitCenter={o5} sharedCenters={[o5, o6]} isShared={isOOBonded} color="#aaddff" phase={0} speed={2} />
            <AdaptiveElectron orbitCenter={o6} sharedCenters={[o5, o6]} isShared={isOOBonded} color="#aaddff" phase={Math.PI} speed={2} />

            {/* New SO3 Bonds */}
            {/* O5 joins S1 */}
            <AdaptiveElectron orbitCenter={o5} sharedCenters={[s1, o5]} isShared={isNewSOBonded} color="#00ffaa" phase={Math.PI / 2} />
            {/* O6 joins S2 */}
            <AdaptiveElectron orbitCenter={o6} sharedCenters={[s2, o6]} isShared={isNewSOBonded} color="#00ffaa" phase={Math.PI / 2} />

        </group>
    );
};

export default ContactMicroSequence;
