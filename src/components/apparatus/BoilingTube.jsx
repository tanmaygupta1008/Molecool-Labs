import React, { useMemo } from 'react';
import { Cylinder, Utils, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const BoilingTube = ({ reactants = [], ...props }) => {
    // Calculate contents
    const { liquidVolume, liquidColor, solids } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const solidItems = [];

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const overrideColor = props.reactantColorOverrides?.[r.id];
            const color = overrideColor || chemical?.color || '#ffffff'; // Default to white if not found

            if (r.state === 'l' || r.state === 'aq') {
                const overrideAmt = props.reactantOverrides?.[r.id];
                const amt = overrideAmt !== undefined ? overrideAmt : (parseFloat(r.amount) || 0);
                vol += amt;

                // Simple color mixing weighted by volume
                const c = new THREE.Color(color);
                rSum += c.r * amt;
                gSum += c.g * amt;
                bSum += c.b * amt;
                count += amt;
            } else if (r.state === 's') {
                const initialAmt = parseFloat(r.amount) || 0;
                const override = props.reactantOverrides?.[r.id];
                const maxOverride = props.reactantMaxOverrides?.[r.id];

                const currentAmt = Math.max(0, override !== undefined ? override : initialAmt);
                const maxAmt = Math.max(initialAmt, maxOverride !== undefined ? maxOverride : initialAmt);

                if (maxAmt > 0 && currentAmt > 0) {
                    const scaleMultiplier = currentAmt / maxAmt;
                    let remaining = maxAmt;
                    while (remaining > 0) {
                        const pieceWeight = Math.min(remaining, 50);
                        const baseScale = Math.max(0.05, pieceWeight / 50);
                        solidItems.push({
                            ...r,
                            color,
                            weight: pieceWeight,
                            scale: baseScale * scaleMultiplier
                        });
                        remaining -= pieceWeight;
                    }
                }
            }
        });

        const mixedColor = count > 0
            ? new THREE.Color(rSum / count, gSum / count, bSum / count).getStyle()
            : '#aaddff';

        return { liquidVolume: vol, liquidColor: mixedColor, solids: solidItems };
    }, [reactants, props.reactantOverrides, props.reactantMaxOverrides]);

    // Max volume ~50-60mL -> Height ~1.5
    const maxVol = 60;
    const liquidHeight = Math.min((liquidVolume / maxVol) * 1.5, 1.7);
    return (
        <group {...props}>
            {/* Boiling Tube is just a larger test tube */}
            {/* Body */}
            <Cylinder args={[0.3, 0.3, 1.8, 32, 1, true]} position={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2} // Double side
                />
            </Cylinder>

            {/* Rounded Bottom */}
            <mesh position={[0, -0.9, 0]}>
                <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2}
                />
            </mesh>

            {/* Rim - Torus for open top look */}
            <Torus args={[0.3, 0.03, 16, 32]} position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#dddddd"
                    transmission={0.8}
                    opacity={0.6}
                    transparent
                    roughness={0.2}
                />
            </Torus>
            {/* Render Liquid */}
            {liquidVolume > 0 && (
                <group position={[0, liquidHeight / 2 - 0.9, 0]}>
                    <Cylinder args={[0.28, 0.28, liquidHeight, 32]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={2}
                        />
                    </Cylinder>
                    {/* Bottom Hemisphere for liquid */}
                    <mesh position={[0, -liquidHeight / 2, 0]}>
                        <sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
                        <meshPhysicalMaterial color={liquidColor} transparent opacity={0.8} side={2} />
                    </mesh>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => {
                const py = -1.15 + (i * 0.08); // Start deep inside the hemisphere
                const spreadRadius = py < -0.9 ? Math.sqrt(Math.max(0, 0.3 * 0.3 - (-0.9 - py) * (-0.9 - py))) - 0.05 : 0.2;

                const px = (Math.sin(i * 12.9898) * spreadRadius) * 0.5;
                const pz = (Math.cos(i * 78.233) * spreadRadius) * 0.5;

                const rx = Math.sin(i * 3.14);
                const ry = Math.cos(i * 2.71);
                const rz = Math.sin(i * 1.61);
                const scale = s.scale || 1;

                return (
                    <mesh key={i} position={[px, py, pz]} rotation={[rx, ry, rz]} scale={[scale, scale, scale]}>
                        <dodecahedronGeometry args={[0.1, 0]} />
                        <meshStandardMaterial color={s.color} roughness={0.9} />
                    </mesh>
                );
            })}
        </group>
    );
};

export default BoilingTube;
