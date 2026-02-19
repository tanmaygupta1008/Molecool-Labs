import React, { useMemo } from 'react';
import { Cylinder } from '@react-three/drei';

const WaterTrough = ({ reactants = [], customHeight = 1, ...props }) => {
    // Determine water level
    // Base height is 0.8. customHeight is a multiplier (e.g., 1.5x)
    const baseHeight = 0.8;
    const actualHeight = baseHeight * customHeight;

    // Taper logic: Radius increases by 0.2 over 0.8 height => slope = 0.25
    // Top Radius = BaseRadius (1.3) + height * slope
    const topRadius = 1.3 + actualHeight * 0.25;

    const waterHeight = useMemo(() => {
        // If no reactants configured, visual fallback
        if (!reactants || reactants.length === 0) return 0.5 * customHeight; // Scale default level

        // Find water
        const water = reactants.find(r => r.chemicalId === 'water');
        if (water) {
            const amt = parseFloat(water.amount) || 0;
            // Map 1000mL -> 0.7 height * factor
            // Let's assume max capacity scales with volume approx cylinder V = pi*r^2*h
            // For now, simpler linear scaling relative to height
            return Math.min((amt / 1000) * 0.7, actualHeight - 0.05);
        }
        return 0.1;
    }, [reactants, customHeight, actualHeight]);
    return (
        <group {...props}>
            {/* Container */}
            <Cylinder args={[topRadius, 1.3, actualHeight, 32, 1, true]} position={[0, actualHeight / 2, 0]} renderOrder={2}>
                <meshStandardMaterial
                    color="#eefcfc"
                    transparent
                    opacity={0.2}
                    roughness={0.1}
                    side={2}
                />
            </Cylinder>
            {/* Base */}
            <Cylinder args={[1.3, 1.3, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial
                    color="#aaddff"
                    transmission={0.8}
                    opacity={0.5}
                    transparent
                    roughness={0.2}
                />
            </Cylinder>
            {/* Water Surface */}
            {/* Water Surface */}
            {waterHeight > 0.01 && (
                <Cylinder
                    key={`${waterHeight}-${customHeight}`} // Force re-render
                    args={[
                        (1.3 + (0.05 + waterHeight) * 0.25) * 0.95,
                        (1.3 + 0.05 * 0.25) * 0.95,
                        waterHeight,
                        32
                    ]}
                    position={[0, 0.05 + waterHeight / 2, 0]}
                >
                    <meshStandardMaterial
                        color="#0077ff"
                        opacity={0.6}
                        transparent
                        roughness={0}
                    />
                </Cylinder>
            )}
        </group>
    );
};

export default WaterTrough;
