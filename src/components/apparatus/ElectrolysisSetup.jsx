import React, { useMemo } from 'react';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const ElectrolysisSetup = ({ reactants = [], ...props }) => {
    // Calculate electrolyte (liquid)
    const { liquidVolume, liquidColor } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff';

            if (r.state === 'l' || r.state === 'aq') {
                vol += (parseFloat(r.amount) || 0);
                const c = new THREE.Color(color);
                rSum += c.r;
                gSum += c.g;
                bSum += c.b;
                count++;
            }
        });

        const mixedColor = count > 0
            ? new THREE.Color(rSum / count, gSum / count, bSum / count).getStyle()
            : '#ccddff';

        return { liquidVolume: vol, liquidColor: mixedColor };
    }, [reactants]);

    // Use volume or default if empty for visual check
    // If reactants exist, use calculated volume.
    const hasReactants = reactants && reactants.length > 0;

    // Calculate fractional height relative to max capacity (500ml -> 1.5 units? Adjust to fit container)
    // Container height is 1.5. Max safe liquid height is around 1.2
    const computedHeight = hasReactants ? Math.min((liquidVolume / 500) * 1.5, 1.3) : 0;

    // NO minimum clamp if we have explicit 0 volume
    const finalHeight = computedHeight;
    const finalColor = hasReactants ? liquidColor : '#ccddff';

    // Taper Calculations matching the container (0.9 bottom -> 1.0 top over 1.5 height)
    // Slope = (1.0 - 0.9) / 1.5 = 0.0666...
    const bottomRadius = 0.9 * 0.96; // Slightly smaller to avoid z-fighting
    const topRadius = (0.9 + (finalHeight * (0.1 / 1.5))) * 0.96;
    return (
        <group {...props}>
            {/* Beaker Container - Render AFTER liquid (Order 2) */}
            <Cylinder args={[1, 0.9, 1.5, 32, 1, true]} position={[0, 0.75, 0]} renderOrder={2}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.99}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    ior={1.5}
                    side={THREE.DoubleSide}
                    depthWrite={false} // Crucial for seeing objects inside
                />
            </Cylinder>
            <Cylinder args={[0.9, 0.9, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial color="#ccddff" transmission={0.9} opacity={0.6} transparent />
            </Cylinder>

            {/* Electrodes */}
            <Box args={[0.2, 1.2, 0.05]} position={[-0.3, 0.7, 0]}>
                <meshStandardMaterial color="#222" metalness={0.8} /> {/* Graphite anode */}
            </Box>
            <Box args={[0.2, 1.2, 0.05]} position={[0.3, 0.7, 0]}>
                <meshStandardMaterial color="#b87333" metalness={0.9} /> {/* Copper cathode example */}
            </Box>

            {/* Wires */}
            <Cylinder args={[0.02, 0.02, 0.5]} position={[-0.3, 1.4, 0]}>
                <meshStandardMaterial color="#d00" /> {/* Red wire */}
            </Cylinder>
            <Cylinder args={[0.02, 0.02, 0.5]} position={[0.3, 1.4, 0]}>
                <meshStandardMaterial color="#000" /> {/* Black wire */}
            </Cylinder>
            {/* Electrolyte Liquid */}
            {finalHeight > 0.01 && (
                <Cylinder
                    args={[topRadius, bottomRadius, finalHeight, 32]}
                    position={[0, 0.05 + finalHeight / 2, 0]}
                    renderOrder={1}
                >
                    <meshPhysicalMaterial
                        color={finalColor}
                        transmission={0.8}
                        opacity={0.7}
                        transparent
                        side={2}
                        roughness={0.1}
                    />
                </Cylinder>
            )}
        </group>
    );
};

export default ElectrolysisSetup;
