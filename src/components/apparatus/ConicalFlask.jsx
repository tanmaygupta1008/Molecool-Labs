import React, { useMemo } from 'react';
import * as THREE from 'three';
import Ripples from '../effects/Ripples';
import { CHEMICALS } from '../../data/chemicals';
import Precipitate from '../effects/Precipitate';

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
            const overrideColor = props.reactantColorOverrides?.[r.id];
            const color = overrideColor || chemical?.color || '#ffffff';

            if (r.state === 'l' || r.state === 'aq') {
                const overrideAmt = props.reactantOverrides?.[r.id];
                const amt = overrideAmt !== undefined ? overrideAmt : (parseFloat(r.amount) || 0);
                vol += amt;

                // Simple color mixing
                const c = new THREE.Color(color);
                // Weight the color mixing by volume to ensure dominant volumes dictate the primary color
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
                    <Ripples
                        position={[0, liquidHeight / 2 + 0.01, 0]}
                        active={props.isReceivingDrips}
                        color={props.rippleColor || '#ffffff'}
                        baseScale={0.35 + (1.0 - 0.35) * (1 - (liquidHeight / 1.8))}
                    />
                </group>
            )}
            {/* Render Precipitate */}
            {props.precipitateActive && (
                <Precipitate
                    type="cylinder"
                    radius={1.0}
                    amount={props.precipitateAmount}
                    color={props.precipitateColor}
                    position={[0, 0.05, 0]}
                />
            )}

            {/* Render Solids */}
            {solids.map((s, i) => {
                // Deterministic pseudo-random placement to prevent jitter during animation
                const px = (Math.sin(i * 12.9898) * 0.5) * 0.5;
                const pz = (Math.cos(i * 78.233) * 0.5) * 0.5;
                const py = 0.1 + (i * 0.12);
                const rx = Math.sin(i * 3.14);
                const ry = Math.cos(i * 2.71);
                const rz = Math.sin(i * 1.61);
                const scale = s.scale || 1;

                return (
                    <mesh key={i} position={[px, py, pz]} rotation={[rx, ry, rz]} scale={[scale, scale, scale]}>
                        <dodecahedronGeometry args={[0.15, 0]} />
                        <meshStandardMaterial color={s.color} roughness={0.9} />
                    </mesh>
                );
            })}

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
