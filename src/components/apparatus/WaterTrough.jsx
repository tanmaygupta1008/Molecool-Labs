import React, { useMemo } from 'react';
import { Cylinder, Torus } from '@react-three/drei';
import GasJar from './GasJar';
import TestTube from './TestTube';
import * as THREE from 'three';

const WaterTrough = ({ reactants = [], customHeight = 1, baseRadiusScale = 1, wallTaper = 0.25, ...props }) => {
    // Top Radius = BaseRadius + height * slope
    const actualHeight = 0.8 * customHeight;
    const baseRadius = 1.3 * baseRadiusScale;
    const topRadius = baseRadius + actualHeight * wallTaper;

    const liquidLevelOverride = props.liquidLevelOverride !== undefined ? props.liquidLevelOverride : null;

    const waterHeight = useMemo(() => {
        let amt = 0;

        if (liquidLevelOverride !== null) {
            amt = Math.max(liquidLevelOverride, 0);
        } else {
            // If no reactants configured, visual fallback
            if (!reactants || reactants.length === 0) return 0.5 * customHeight;

            // Find water (or interpret sum of aqueous)
            const water = reactants.find(r => r.chemicalId === 'water' || r.state === 'l' || r.state === 'aq');
            if (water) {
                amt = parseFloat(water.amount) || 0;
            } else {
                return 0.1;
            }
        }

        // Map 1000mL -> 0.7 height * customHeight
        return Math.min((amt / 1000) * (0.7 * customHeight), actualHeight - 0.05);
    }, [reactants, customHeight, actualHeight, liquidLevelOverride]);

    return (
        <group {...props}>
            {/* Container */}
            <Cylinder args={[topRadius, baseRadius, actualHeight, 32, 1, true]} position={[0, actualHeight / 2, 0]} renderOrder={2}>
                <meshStandardMaterial
                    color="#eefcfc"
                    transparent
                    opacity={0.2}
                    roughness={0.1}
                    side={THREE.DoubleSide}
                />
            </Cylinder>
            {/* Base */}
            <Cylinder args={[baseRadius, baseRadius, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial
                    color="#aaddff"
                    transmission={0.8}
                    opacity={0.5}
                    transparent
                    roughness={0.2}
                />
            </Cylinder>

            {/* Flat Rim Lip (Optional visual improvement) */}
            <Torus args={[topRadius, 0.02, 16, 32]} position={[0, actualHeight, 0]} rotation={[Math.PI/2, 0, 0]}>
                <meshStandardMaterial color="#eefcfc" transparent opacity={0.3} roughness={0.1} />
            </Torus>

            {/* Water Surface */}
            {waterHeight > 0.01 && (
                <Cylinder
                    key={`${waterHeight}-${customHeight}-${baseRadiusScale}-${wallTaper}`} // Force re-render
                    args={[
                        (baseRadius + (0.05 + waterHeight) * wallTaper) * 0.99,
                        (baseRadius + 0.05 * wallTaper) * 0.99,
                        waterHeight,
                        32
                    ]}
                    position={[0, 0.05 + waterHeight / 2, 0]}
                    renderOrder={1}
                >
                    <meshStandardMaterial
                        color="#0077ff"
                        opacity={0.6}
                        transparent
                        roughness={0}
                        depthWrite={false}
                    />
                </Cylinder>
            )}

            {/* Inverted Setup */}
            {props.invertedSetup === 'GasJar' && (
                <group position={[0, 0.05, 0]}>
                    {/* Metal Beehive Shelf (housing + vertical glass pipe) */}
                    <group>
                        <Cylinder args={[0.58, 0.58, 0.5, 32]} position={[0, 0.25, 0]}>
                            <meshStandardMaterial color="#b0b5b9" metalness={0.7} roughness={0.3} />
                        </Cylinder>
                        <Cylinder args={[0.08, 0.08, 0.01, 16]} position={[0, 0.505, 0]}>
                            <meshBasicMaterial color="#111" />
                        </Cylinder>
                        {/* Anchor pipe deep into the base to avoid gaps */}
                        <Cylinder args={[0.04, 0.04, 0.8, 16]} position={[0, 0.25 + 0.4, 0]}>
                            <meshPhysicalMaterial color="#ffffff" transmission={0.92} opacity={0.5} transparent roughness={0.1} thickness={0.02} />
                        </Cylinder>
                        {/* Side Inlet */}
                        <Cylinder args={[0.08, 0.08, 0.05, 16]} position={[0.56, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <meshBasicMaterial color="#111" />
                        </Cylinder>
                    </group>
                    {/* Inverted GasJar without lid, strictly resting on shelf */}
                    <GasJar position={[0, 2.0, 0]} rotation={[Math.PI, 0, 0]} hasLid={false} reactants={reactants} />
                </group>
            )}

            {props.invertedSetup === 'TestTube' && (
                <group position={[0, 0.05, 0]}>
                    {/* Metal Beehive Shelf */}
                    <group>
                        <Cylinder args={[0.3, 0.3, 0.4, 32]} position={[0, 0.2, 0]}>
                            <meshStandardMaterial color="#b0b5b9" metalness={0.7} roughness={0.3} />
                        </Cylinder>
                        <Cylinder args={[0.06, 0.06, 0.01, 16]} position={[0, 0.405, 0]}>
                            <meshBasicMaterial color="#111" />
                        </Cylinder>
                        {/* Anchor pipe deep into the base to avoid gaps */}
                        <Cylinder args={[0.03, 0.03, 0.6, 16]} position={[0, 0.2 + 0.3, 0]}>
                            <meshPhysicalMaterial color="#ffffff" transmission={0.92} opacity={0.5} transparent roughness={0.1} thickness={0.02} />
                        </Cylinder>
                        {/* Side Inlet */}
                        <Cylinder args={[0.06, 0.06, 0.05, 16]} position={[0.28, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <meshBasicMaterial color="#111" />
                        </Cylinder>
                    </group>
                    {/* Inverted TestTube */}
                    <TestTube position={[0, 0.4 + 1.7, 0]} rotation={[Math.PI, 0, 0]} reactants={reactants} />
                </group>
            )}
        </group>
    );
};

export default WaterTrough;
