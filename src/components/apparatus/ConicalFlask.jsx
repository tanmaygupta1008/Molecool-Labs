import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const ConicalFlask = ({ reactants = [], ...props }) => {
    const points = useMemo(() => {
        const p = [];
        const baseRadius = 1.0;
        const neckRadius = 0.35;
        const height = 2.5;
        const neckStart = 1.8;

        p.push(new THREE.Vector2(0, 0));
        p.push(new THREE.Vector2(baseRadius, 0));
        p.push(new THREE.Vector2(baseRadius, 0.1));
        p.push(new THREE.Vector2(neckRadius, neckStart));
        p.push(new THREE.Vector2(neckRadius, height));
        p.push(new THREE.Vector2(neckRadius + 0.1, height + 0.1));
        p.push(new THREE.Vector2(neckRadius, height + 0.1));

        return p;
    }, []);

    // Calculate contents
    const { liquidVolume, liquidColor, solids } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const solidItems = [];

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff';

            if (r.state === 'l' || r.state === 'aq') {
                vol += (parseFloat(r.amount) || 0); // Amount in mL

                // Simple color mixing
                const c = new THREE.Color(color);
                rSum += c.r;
                gSum += c.g;
                bSum += c.b;
                count++;
            } else if (r.state === 's') {
                solidItems.push({ ...r, color });
            }
        });

        const mixedColor = count > 0
            ? new THREE.Color(rSum / count, gSum / count, bSum / count).getStyle()
            : '#aaddff';

        return { liquidVolume: vol, liquidColor: mixedColor, solids: solidItems };
    }, [reactants]);

    const liquidLevelOverride = props.liquidLevelOverride !== undefined ? props.liquidLevelOverride : null;
    const effectiveLiquidVol = liquidLevelOverride !== null ? liquidLevelOverride : liquidVolume;

    // Map volume to height (Approximation)
    // Max volume ~250mL -> Height ~1.8 (Neck start)
    const maxVol = 250;
    const liquidHeight = Math.min((effectiveLiquidVol / maxVol) * 1.8, 2.2);

    return (
        <group {...props}>
            <mesh position={[0, 0, 0]}>
                <latheGeometry args={[points, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Render Liquid */}
            {effectiveLiquidVol > 0 && (
                <group position={[0, liquidHeight / 2, 0]}>
                    <mesh rotation={[0, 0, 0]}>
                        <cylinderGeometry args={[
                            0.35 + (1.0 - 0.35) * (1 - (liquidHeight / 1.8)), // Top radius interpolation
                            1.0, // Bottom radius
                            liquidHeight,
                            32
                        ]} />
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 0.5, 0.1 + (i * 0.1), (Math.random() - 0.5) * 0.5]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <dodecahedronGeometry args={[0.15, 0]} />
                    <meshStandardMaterial color={s.color} roughness={0.9} />
                </mesh>
            ))}

            {/* Thermal Glow Overlay */}
            {props.isHeating && (
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
                    <meshBasicMaterial
                        color="#ff4400"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
};

export default ConicalFlask;
