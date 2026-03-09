// src/components/reactions/views/sequences/MethaneMicroSequence.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Nucleus, AdaptiveElectron, OrbitalCloud } from '../SubatomicElements';
import { MicroHUD } from '../MicroView';

const MethaneMicroSequence = ({ reaction, progress }) => {
    // Equation: CH4 + 2O2 -> CO2 + 2H2O

    // Status Logic
    let status = "";
    if (progress < 0.3) status = "Reactants approaching... Activation energy building.";
    else if (progress < 0.6) status = "⚠ C-H and O=O bonds breaking. Electrons shifting.";
    else if (progress < 0.8) status = "New bonds forming: C=O and O-H";
    else status = "✓ Products formed: CO₂ and H₂O";

    // Atom definitions from reaction.atoms
    // 0: C, 1-4: H, 5-6: O, 7-8: O

    // Interpolate positions
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

    const cPos = getPos(0);
    const h1Pos = getPos(1);
    const h2Pos = getPos(2);
    const h3Pos = getPos(3);
    const h4Pos = getPos(4);

    const o1Pos = getPos(5); // O2 molecule 1
    const o2Pos = getPos(6);

    const o3Pos = getPos(7); // O2 molecule 2
    const o4Pos = getPos(8);

    // Bonding states
    const isCHBonded = progress < 0.45;
    const isOOBonded = progress < 0.45;
    const isCOBonded = progress > 0.65;
    const isHOBonded = progress > 0.65;

    return (
        <group>
            <MicroHUD
                title="Combustion of Methane"
                status={status}
                equation="CH₄ + 2O₂ → CO₂ + 2H₂O"
            />

            {/* --- ATOMS --- */}
            {/* Carbon */}
            <group position={cPos}>
                <Nucleus element="C" color="#444444" size={0.5} opacity={1} />
            </group>

            {/* Hydrogens */}
            <group position={h1Pos}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h2Pos}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h3Pos}><Nucleus element="H" color="#dddddd" size={0.3} /></group>
            <group position={h4Pos}><Nucleus element="H" color="#dddddd" size={0.3} /></group>

            {/* Oxygens */}
            <group position={o1Pos}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o2Pos}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o3Pos}><Nucleus element="O" color="#ff4444" size={0.4} /></group>
            <group position={o4Pos}><Nucleus element="O" color="#ff4444" size={0.4} /></group>

            {/* --- ELECTRONS & BONDS --- */}
            {/* Reactant Bonds: C-H */}
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, h1Pos]} isShared={isCHBonded} color="#00ffaa" phase={0} />
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, h2Pos]} isShared={isCHBonded} color="#00ffaa" phase={Math.PI / 2} />
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, h3Pos]} isShared={isCHBonded} color="#00ffaa" phase={Math.PI} />
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, h4Pos]} isShared={isCHBonded} color="#00ffaa" phase={Math.PI * 1.5} />

            {/* Reactant Bonds: O=O */}
            <AdaptiveElectron orbitCenter={o1Pos} sharedCenters={[o1Pos, o2Pos]} isShared={isOOBonded} color="#00aaff" phase={0} />
            <AdaptiveElectron orbitCenter={o2Pos} sharedCenters={[o1Pos, o2Pos]} isShared={isOOBonded} color="#00aaff" phase={Math.PI} />

            <AdaptiveElectron orbitCenter={o3Pos} sharedCenters={[o3Pos, o4Pos]} isShared={isOOBonded} color="#00aaff" phase={0} />
            <AdaptiveElectron orbitCenter={o4Pos} sharedCenters={[o3Pos, o4Pos]} isShared={isOOBonded} color="#00aaff" phase={Math.PI} />

            {/* Product Bonds: C=O (CO2 is linear, C is central) */}
            {/* O1 bonded to C */}
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, o1Pos]} isShared={isCOBonded} color="#ffaa00" phase={0} />
            {/* O3 bonded to C */}
            <AdaptiveElectron orbitCenter={cPos} sharedCenters={[cPos, o3Pos]} isShared={isCOBonded} color="#ffaa00" phase={Math.PI} />

            {/* Product Bonds: H-O-H (Water 1 & 2) */}
            {/* Water 1: O2 bonded with H1, H2 */}
            <AdaptiveElectron orbitCenter={o2Pos} sharedCenters={[o2Pos, h1Pos]} isShared={isHOBonded} color="#ff00ff" phase={0} />
            <AdaptiveElectron orbitCenter={o2Pos} sharedCenters={[o2Pos, h2Pos]} isShared={isHOBonded} color="#ff00ff" phase={Math.PI / 2} />

            {/* Water 2: O4 bonded with H3, H4 */}
            <AdaptiveElectron orbitCenter={o4Pos} sharedCenters={[o4Pos, h3Pos]} isShared={isHOBonded} color="#ff00ff" phase={0} />
            <AdaptiveElectron orbitCenter={o4Pos} sharedCenters={[o4Pos, h4Pos]} isShared={isHOBonded} color="#ff00ff" phase={Math.PI / 2} />

            {/* --- ORBITAL CLOUDS (Optional Polish) --- */}
            {isCOBonded && (
                <>
                    {/* Visualizing CO2 linear bonds */}
                    <OrbitalCloud
                        position={new THREE.Vector3().lerpVectors(new THREE.Vector3(...cPos), new THREE.Vector3(...o1Pos), 0.5).toArray()}
                        scale={[new THREE.Vector3(...cPos).distanceTo(new THREE.Vector3(...o1Pos)) * 0.8, 0.5, 0.5]}
                        color="#ffaa00"
                    />
                    <OrbitalCloud
                        position={new THREE.Vector3().lerpVectors(new THREE.Vector3(...cPos), new THREE.Vector3(...o3Pos), 0.5).toArray()}
                        scale={[new THREE.Vector3(...cPos).distanceTo(new THREE.Vector3(...o3Pos)) * 0.8, 0.5, 0.5]}
                        color="#ffaa00"
                    />
                </>
            )}

        </group>
    );
};

export default MethaneMicroSequence;
