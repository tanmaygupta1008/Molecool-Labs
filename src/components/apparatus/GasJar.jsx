import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const Hole = ({ position }) => (
    <Cylinder args={[0.05, 0.05, 0.11, 16]} position={position}>
        <meshStandardMaterial color="#333" />
    </Cylinder>
);

const GasJar = ({ hasLid = true, holeCount = 0, reactants = [], ...props }) => {
    // Calculate contents
    const { liquidVolume, liquidColor, solids, gasColor, gasOpacity } = useMemo(() => {
        let lVol = 0;
        let lr = 0, lg = 0, lb = 0, lCount = 0;
        let gr = 0, gg = 0, gb = 0, gCount = 0;
        const solidItems = [];

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff';
            const c = new THREE.Color(color);

            if (r.state === 'l' || r.state === 'aq') {
                lVol += (parseFloat(r.amount) || 0);
                lr += c.r; lg += c.g; lb += c.b;
                lCount++;
            } else if (r.state === 's') {
                solidItems.push({ ...r, color });
            } else if (r.state === 'g') {
                gr += c.r; gg += c.g; gb += c.b;
                gCount++;
            }
        });

        const lColor = lCount > 0 ? new THREE.Color(lr / lCount, lg / lCount, lb / lCount).getStyle() : '#aaddff';
        const gColor = gCount > 0 ? new THREE.Color(gr / gCount, gg / gCount, gb / gCount).getStyle() : '#ffffff';
        const gOp = gCount > 0 ? 0.2 : 0; // faint gas

        return { liquidVolume: lVol, liquidColor: lColor, solids: solidItems, gasColor: gColor, gasOpacity: gOp };
    }, [reactants]);

    // Dimensions
    const radius = 0.48;
    const height = 1.45;

    const gasOpacityMultiplier = props.gasOpacityMultiplier !== undefined ? props.gasOpacityMultiplier : 1;
    const liquidLevelOverride = props.liquidLevelOverride !== undefined ? props.liquidLevelOverride : null;
    const gasColorOverride = props.gasColorOverride !== undefined ? props.gasColorOverride : null;

    // Derived properties Based on overrides or default reactants
    const effectiveLiquidVol = liquidLevelOverride !== null ? liquidLevelOverride : liquidVolume;
    const effectiveGasOpacity = Math.min(1.0, gasOpacity * gasOpacityMultiplier);
    const effectiveGasColor = gasColorOverride || gasColor;

    // Convert liquid volume to height. 
    // Assuming jar is a cylinder: vol = pi * r^2 * h -> h = vol / (pi * r^2)
    // Simplify mapping for now: Max Vol roughly 200 units = Full Height
    const liquidHeight = Math.min((effectiveLiquidVol / 200) * height, height); // 200mL max
    return (
        <group {...props}>
            {/* Tall Cylinder Body */}
            <Cylinder args={[0.5, 0.5, 1.5, 32, 1, true]} position={[0, 0.75, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.4}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={2}
                />
            </Cylinder>

            {/* Base */}
            <Cylinder args={[0.52, 0.52, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent />
            </Cylinder>

            {/* Lid */}
            {hasLid && (
                <group position={[0, 1.55, 0]}>
                    <Cylinder args={[0.55, 0.55, 0.1, 32]}>
                        <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent />
                    </Cylinder>

                    {/* Holes */}
                    {holeCount === 1 && <Hole position={[0, 0, 0]} />}

                    {holeCount === 2 && (
                        <>
                            <Hole position={[0.2, 0, 0]} />
                            <Hole position={[-0.2, 0, 0]} />
                        </>
                    )}

                    {holeCount >= 3 && (
                        <>
                            <Hole position={[0.2, 0, 0]} />
                            <Hole position={[-0.2, 0, 0]} />
                            <Hole position={[0, 0, 0.2]} />
                            {holeCount > 3 && <Hole position={[0, 0, -0.2]} />}
                        </>
                    )}
                </group>
            )}
            {/* Render Liquid */}
            {effectiveLiquidVol > 0 && (
                <group position={[0, 0.05 + liquidHeight / 2, 0]}>
                    <Cylinder args={[radius, radius, liquidHeight, 32]}>
                        <meshPhysicalMaterial color={liquidColor} transparent opacity={0.8} side={2} />
                    </Cylinder>
                </group>
            )}

            {/* Render Gas (Fills the jar) */}
            {effectiveGasOpacity > 0 && (
                <group position={[0, 0.8, 0]}>
                    <Cylinder args={[radius, radius, height, 32]}>
                        <meshBasicMaterial color={effectiveGasColor} transparent opacity={effectiveGasOpacity} side={2} depthWrite={false} />
                    </Cylinder>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 0.8, 0.1 + (i * 0.1), (Math.random() - 0.5) * 0.8]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <dodecahedronGeometry args={[0.12, 0]} />
                    <meshStandardMaterial color={s.color} roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
};

export default GasJar;
