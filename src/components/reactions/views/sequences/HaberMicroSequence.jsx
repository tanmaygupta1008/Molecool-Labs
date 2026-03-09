// src/components/reactions/views/sequences/HaberMicroSequence.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Nucleus, AdaptiveElectron, OrbitalCloud } from '../SubatomicElements';
import { MicroHUD } from '../MicroView';

const HaberMicroSequence = ({ reaction, progress }) => {
    // Equation: N2 + 3H2 -> 2NH3

    let status = "";
    if (progress < 0.3) status = "Reactants adsorbing onto iron catalyst surface...";
    else if (progress < 0.6) status = "⚠ N≡N and H-H bonds breaking (Highest Energy State)";
    else if (progress < 0.8) status = "New bonds forming: N-H";
    else status = "✓ Ammonia (NH₃) molecules synthesizing.";

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

    const n1 = getPos(0);
    const n2 = getPos(1);

    const h1 = getPos(2);
    const h2 = getPos(3);
    const h3 = getPos(4);
    const h4 = getPos(5);
    const h5 = getPos(6);
    const h6 = getPos(7);

    const isNNBonded = progress < 0.45;
    const isHHBonded = progress < 0.45;
    const isNHBonded = progress > 0.65;

    return (
        <group>
            <MicroHUD
                title="Haber Process"
                status={status}
                equation="N₂ + 3H₂ ⇌ 2NH₃"
            />

            {/* Iron Catalyst Platform (Just a visual floor) */}
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[15, 10]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
            </mesh>
            <pointLight position={[0, -1, 0]} color="#aaaaaa" intensity={0.5} />

            {/* Nitrogen */}
            <group position={n1}><Nucleus element="N" color="#4455ff" size={0.5} /></group>
            <group position={n2}><Nucleus element="N" color="#4455ff" size={0.5} /></group>

            {/* Hydrogen */}
            <group position={h1}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h2}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h3}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h4}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h5}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h6}><Nucleus element="H" color="#dddddd" size={0.3} /></group>

            {/* Reactant Bonds */}
            {/* N2 Triple Bond (represented by 3 fast electrons) */}
            <AdaptiveElectron orbitCenter={n1} sharedCenters={[n1, n2]} isShared={isNNBonded} color="#aaddff" phase={0} speed={4} size={0.1} />
            <AdaptiveElectron orbitCenter={n2} sharedCenters={[n1, n2]} isShared={isNNBonded} color="#aaddff" phase={Math.PI / 1.5} speed={4} size={0.1} />
            <AdaptiveElectron orbitCenter={n1} sharedCenters={[n1, n2]} isShared={isNNBonded} color="#aaddff" phase={Math.PI * 1.3} speed={4} size={0.1} />

            {/* H2 Bonds */}
            <AdaptiveElectron orbitCenter={h1} sharedCenters={[h1, h2]} isShared={isHHBonded} color="#ffffff" phase={0} />
            <AdaptiveElectron orbitCenter={h3} sharedCenters={[h3, h4]} isShared={isHHBonded} color="#ffffff" phase={0} />
            <AdaptiveElectron orbitCenter={h5} sharedCenters={[h5, h6]} isShared={isHHBonded} color="#ffffff" phase={0} />

            {/* Product Bonds (NH3) */}
            {/* NH3 Left: n1 + h1, h2, h3 */}
            <AdaptiveElectron orbitCenter={n1} sharedCenters={[n1, h1]} isShared={isNHBonded} color="#00ffaa" phase={0} />
            <AdaptiveElectron orbitCenter={n1} sharedCenters={[n1, h2]} isShared={isNHBonded} color="#00ffaa" phase={Math.PI / 2} />
            <AdaptiveElectron orbitCenter={n1} sharedCenters={[n1, h3]} isShared={isNHBonded} color="#00ffaa" phase={Math.PI} />

            {/* NH3 Right: n2 + h4, h5, h6 */}
            <AdaptiveElectron orbitCenter={n2} sharedCenters={[n2, h4]} isShared={isNHBonded} color="#00ffaa" phase={0} />
            <AdaptiveElectron orbitCenter={n2} sharedCenters={[n2, h5]} isShared={isNHBonded} color="#00ffaa" phase={Math.PI / 2} />
            <AdaptiveElectron orbitCenter={n2} sharedCenters={[n2, h6]} isShared={isNHBonded} color="#00ffaa" phase={Math.PI} />

        </group>
    );
};

export default HaberMicroSequence;
