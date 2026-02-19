import React, { useMemo, useRef } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const ElectrolysisSetup = ({ reactants = [], reactionState = {}, ...props }) => {
    // Unpack Reaction State
    const {
        electricity = {},
        liquid = {},
        gas = {},
        heat = {}
    } = reactionState;

    // --- 1. LIQUID CALCULATIONS ---
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

        // Default or Reactant-based Color
        let baseColor = count > 0
            ? new THREE.Color(rSum / count, gSum / count, bSum / count)
            : new THREE.Color('#ccddff');

        // Allow 'Liquid Behavior' from Right Panel to override/animate color
        if (liquid.enabled && liquid.finalColor) {
            // For simplicity in this non-timed version, we just use finalColor if enabled
            // Ideally we lerp using stepProgress but that requires passing stepProgress down.
            // We'll simplisticly mix it.
            baseColor.lerp(new THREE.Color(liquid.finalColor), liquid.transparency || 0.5);
        }

        return { liquidVolume: vol, liquidColor: baseColor.getStyle() };
    }, [reactants, liquid]);

    const hasReactants = reactants && reactants.length > 0;
    const computedHeight = hasReactants ? Math.min((liquidVolume / 500) * 1.5, 1.3) : 0;
    const finalHeight = computedHeight;
    const finalColor = hasReactants ? liquidColor : '#ccddff';

    const bottomRadius = 0.9 * 0.96;
    const topRadius = (0.9 + (finalHeight * (0.1 / 1.5))) * 0.96;

    // --- 2. ELECTRICAL EFFECTS ---
    const isPowerOn = electricity.enabled;
    const wireColor = isPowerOn ? (electricity.wireGlow > 0 ? '#ffaa00' : '#d00') : '#d00';
    const wireEmissive = isPowerOn ? (electricity.wireGlow > 0 ? 2 : 0) : 0;


    // --- 3. BUBBLES ANIMATION (Simple Implementation) ---
    const bubblesRef = useRef();
    useFrame((state) => {
        if (bubblesRef.current && isPowerOn) {
            bubblesRef.current.children.forEach((child, i) => {
                child.position.y += 0.01 + Math.random() * 0.02 * (electricity.current / 50 || 1);
                if (child.position.y > 1.2) child.position.y = 0.2;
            });
        }
    });

    return (
        <group {...props}>
            {/* Beaker Container */}
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
                    depthWrite={false}
                />
            </Cylinder>
            <Cylinder args={[0.9, 0.9, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial color="#ccddff" transmission={0.9} opacity={0.6} transparent />
            </Cylinder>

            {/* Electrodes */}
            <Box args={[0.2, 1.2, 0.05]} position={[-0.3, 0.7, 0]}>
                <meshStandardMaterial color="#222" metalness={0.8} />
            </Box>
            <Box args={[0.2, 1.2, 0.05]} position={[0.3, 0.7, 0]}>
                <meshStandardMaterial color="#b87333" metalness={0.9} />
            </Box>

            {/* Wires - React to Electricity */}
            <Cylinder args={[0.02, 0.02, 0.5]} position={[-0.3, 1.4, 0]}>
                <meshStandardMaterial
                    color={wireColor}
                    emissive={wireColor}
                    emissiveIntensity={wireEmissive}
                />
            </Cylinder>
            <Cylinder args={[0.02, 0.02, 0.5]} position={[0.3, 1.4, 0]}>
                <meshStandardMaterial color="#000" />
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
                        opacity={liquid.transparency || 0.7}
                        transparent
                        side={2}
                        roughness={0.1}
                    />
                </Cylinder>
            )}

            {/* Bubbles - Only visible if Power On and Liquid Present */}
            {isPowerOn && finalHeight > 0.2 && (
                <group ref={bubblesRef}>
                    {/* Generate some static bubble objects that we animate in useFrame */}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Sphere key={i} args={[0.03, 8, 8]} position={[-0.3 + (Math.random() * 0.1), 0.2 + Math.random(), 0]}>
                            <meshBasicMaterial color="white" transparent opacity={0.6} />
                        </Sphere>
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Sphere key={i + 10} args={[0.03, 8, 8]} position={[0.3 + (Math.random() * 0.1), 0.2 + Math.random(), 0]}>
                            <meshBasicMaterial color="white" transparent opacity={0.6} />
                        </Sphere>
                    ))}
                </group>
            )}

            {/* Heat Glow (if enabled) */}
            {heat.enabled && (
                <pointLight position={[0, 0.5, 0]} color={heat.color || "orange"} intensity={heat.intensity || 1} distance={3} />
            )}

        </group>
    );
};

export default ElectrolysisSetup;
