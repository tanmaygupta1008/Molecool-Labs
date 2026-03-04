import React, { useMemo } from 'react';
import { Cylinder, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';
import Precipitate from '../effects/Precipitate';

const TestTube = ({ isHardGlass = false, reactants = [], ...props }) => {
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

    // Max volume ~20-30mL -> Height ~1.2
    const maxVol = 30;
    const liquidHeight = Math.min((liquidVolume / maxVol) * 1.2, 1.4);
    return (
        <group {...props}>
            {/* Body */}
            <Cylinder args={[0.2, 0.2, 1.5, 32, 1, true]} position={[0, 0.95, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false} // Allow internal liquid to be seen
                />
            </Cylinder>

            {/* Bottom Round */}
            <Sphere args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.2, 0]} scale={[1, -1, 1]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Sphere>

            {/* Rim - Replaced solid cylinder with Torus for open top */}
            <Torus args={[0.2, 0.03, 16, 32]} position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>
            {/* Render Liquid */}
            {liquidVolume > 0 && (
                <group position={[0, liquidHeight / 2 + 0.2, 0]}>
                    <Cylinder args={[0.18, 0.18, liquidHeight, 32]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </Cylinder>
                    {/* Bottom Hemisphere for liquid */}
                    <mesh position={[0, -liquidHeight / 2, 0]} scale={[1, -1, 1]}>
                        <sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshPhysicalMaterial color={liquidColor} transparent opacity={0.8} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}

            {/* Render Precipitate */}
            {props.precipitateActive && (
                <Precipitate
                    type="sphere"
                    radius={0.18}
                    amount={props.precipitateAmount}
                    color={props.precipitateColor}
                    position={[0, 0.2, 0]}
                />
            )}

            {/* Render Solids */}
            {solids.map((s, i) => {
                const py = 0.05 + (i * 0.05); // Start closer to the bottom of the semi-sphere
                // Reduce horizontal spread for chunks lower in the semi-sphere
                const spreadRadius = py < 0.2 ? Math.sqrt(Math.max(0, 0.2 * 0.2 - (0.2 - py) * (0.2 - py))) - 0.04 : 0.1;

                const px = (Math.sin(i * 12.9898) * spreadRadius) * 0.5;
                const pz = (Math.cos(i * 78.233) * spreadRadius) * 0.5;

                const rx = Math.sin(i * 3.14);
                const ry = Math.cos(i * 2.71);
                const rz = Math.sin(i * 1.61);
                const scale = s.scale || 1;

                return (
                    <mesh key={i} position={[px, py, pz]} rotation={[rx, ry, rz]} scale={[scale, scale, scale]}>
                        <dodecahedronGeometry args={[0.08, 0]} />
                        <meshStandardMaterial color={s.color} roughness={0.9} />
                    </mesh>
                );
            })}
        </group>
    );
};

export default TestTube;
