// src/components/reactions/views/sequences/SolvayMicroSequence.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Nucleus, AdaptiveElectron, FieldLines } from '../SubatomicElements';
import { MicroHUD } from '../MicroView';

const SolvayMicroSequence = ({ reaction, progress }) => {
    // Equation: NaCl + NH4HCO3 -> NaHCO3 + NH4Cl

    let status = "";
    if (progress < 0.3) status = "Solvated ions in ammoniated brine moving freely...";
    else if (progress < 0.6) status = "Ionic exchange occurring. Electrostatic forces shifting.";
    else if (progress < 0.8) status = "Sodium Bicarbonate (NaHCO₃) precipitating.";
    else status = "✓ Products formed: NaHCO₃ (s) and NH₄Cl (aq)";

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

    const na = getPos(0);
    const cl = getPos(1);

    const n = getPos(2);
    const h1 = getPos(3);
    const h2 = getPos(4);
    const h3 = getPos(5);
    const h4 = getPos(6);

    const c = getPos(7);
    const o1 = getPos(8);
    const o2 = getPos(9);
    const o3 = getPos(10);
    const h5 = getPos(11);

    const isReactantState = progress < 0.45;
    const isProductState = progress > 0.65;
    const fieldOpacity = isProductState ? THREE.MathUtils.lerp(0, 1, (progress - 0.65) / 0.35) : 0;
    const reactantFieldOpacity = isReactantState ? THREE.MathUtils.lerp(1, 0, progress / 0.45) : 0;

    return (
        <group>
            <MicroHUD
                title="Solvay Process (Precipitation)"
                status={status}
                equation="NaCl + NH₄HCO₃ → NaHCO₃(s) + NH₄Cl(aq)"
            />

            {/* Atmosphere/Solution visual */}
            <mesh position={[0, 0, -5]}>
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial color="#001133" transparent opacity={0.5} depthWrite={false} />
            </mesh>

            {/* Ions */}
            <group position={na}><Nucleus element="Na" charge="+" color="#aa66ff" size={0.5} /></group>
            <group position={cl}><Nucleus element="Cl" charge="-" color="#00ff88" size={0.6} /></group>

            {/* NH4+ Group */}
            <group position={n}><Nucleus element="N" color="#4455ff" size={0.4} charge="+" /></group>
            <group position={h1}><Nucleus element="H" color="#dddddd" size={0.25} /></group>
            <group position={h2}><Nucleus element="H" color="#dddddd" size={0.25} /></group>
            <group position={h3}><Nucleus element="H" color="#dddddd" size={0.25} /></group>
            <group position={h4}><Nucleus element="H" color="#dddddd" size={0.25} /></group>

            {/* Static Covalent Bonds in NH4+ */}
            <AdaptiveElectron orbitCenter={n} sharedCenters={[n, h1]} isShared={true} color="#ffffff" />
            <AdaptiveElectron orbitCenter={n} sharedCenters={[n, h2]} isShared={true} color="#ffffff" />
            <AdaptiveElectron orbitCenter={n} sharedCenters={[n, h3]} isShared={true} color="#ffffff" />
            <AdaptiveElectron orbitCenter={n} sharedCenters={[n, h4]} isShared={true} color="#ffffff" />

            {/* HCO3- Group */}
            <group position={c}><Nucleus element="C" color="#444444" size={0.4} /></group>
            <group position={o1}><Nucleus element="O" color="#ff4444" size={0.35} charge="-" /></group>
            <group position={o2}><Nucleus element="O" color="#ff4444" size={0.35} /></group>
            <group position={o3}><Nucleus element="O" color="#ff4444" size={0.35} /></group>
            <group position={h5}><Nucleus element="H" color="#dddddd" size={0.25} /></group>

            {/* Static Covalent Bonds in HCO3- */}
            <AdaptiveElectron orbitCenter={c} sharedCenters={[c, o1]} isShared={true} color="#aaffff" />
            <AdaptiveElectron orbitCenter={c} sharedCenters={[c, o2]} isShared={true} color="#aaffff" />
            <AdaptiveElectron orbitCenter={c} sharedCenters={[c, o3]} isShared={true} color="#aaffff" />
            <AdaptiveElectron orbitCenter={o3} sharedCenters={[o3, h5]} isShared={true} color="#ffffff" />

            {/* Electrostatic Interactions */}
            {/* Reactant Phase: Na+ ... Cl-  and NH4+ ... HCO3- */}
            {isReactantState && (
                <>
                    <FieldLines from={na} to={cl} color="#ffaa00" opacity={reactantFieldOpacity * 0.4} count={4} />
                    <FieldLines from={n} to={c} color="#00aaff" opacity={reactantFieldOpacity * 0.4} count={4} />
                </>
            )}

            {/* Product Phase: Na+ ... HCO3- (Precipitate) and NH4+ ... Cl- */}
            {isProductState && (
                <>
                    <FieldLines from={na} to={c} color="#ffaa00" opacity={fieldOpacity * 0.8} count={8} />
                    <FieldLines from={n} to={cl} color="#00aaff" opacity={fieldOpacity * 0.4} count={4} />

                    {/* Indicate precipitation for NaHCO3 */}
                    <Html position={[-1.5, -3, 0]} center>
                        <div className="text-[10px] text-white bg-white/20 px-2 py-0.5 rounded border border-white/40">
                            Solid Lattice Formed (↓)
                        </div>
                    </Html>
                </>
            )}

        </group>
    );
};

export default SolvayMicroSequence;
