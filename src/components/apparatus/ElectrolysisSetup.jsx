import React, { useMemo, useRef } from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';
import ParticleSystem from './ParticleSystem';

const ElectrolysisSetup = ({ reactants = [], reactionState = {}, ...props }) => {
    // Unpack Reaction State
    const {
        electricity = {},
        liquid = {},
        gas = {},
        heat = {}
    } = reactionState;

    // Timeline props from visual-engine
    // The visual-engine applies these directly to the apparatus for some effects,
    // but Reactant State Transitions apply them to the specific child reactant.
    // We need to check both the apparatus props and its child reactants.
    let isTimelineBubbling = props.isBubbling || false;
    let gasElectrode = props.gasElectrode || 'both';
    let gasRate = props.gasRate;
    let gasColor = props.gasColor;
    let gasSize = props.gasSize;
    let gasBubbleType = props.bubbleType || 'bubble';
    let gasEmissionRate = props.emissionRate;
    let gasEmissionSize = props.emissionSize;
    let gasEmissionType = props.emissionType || 'gas_rise';
    let dissolving = props.electrodeDissolving || {};
    let deposition = props.metalDeposition || {};

    // Check if any reactant inside has these timeline effects active
    if (!isTimelineBubbling || Object.keys(dissolving).length === 0) {
        reactants.forEach(r => {
            const reactantStateVars = reactionState[r.id] || {};
            if (reactantStateVars.isBubbling) {
                isTimelineBubbling = true;
                if (reactantStateVars.gasElectrode) gasElectrode = reactantStateVars.gasElectrode;
                if (reactantStateVars.gasRate !== undefined) gasRate = reactantStateVars.gasRate;
                if (reactantStateVars.gasColor) gasColor = reactantStateVars.gasColor;
                if (reactantStateVars.gasSize !== undefined) gasSize = reactantStateVars.gasSize;
                if (reactantStateVars.bubbleType) gasBubbleType = reactantStateVars.bubbleType;
                if (reactantStateVars.emissionRate !== undefined) gasEmissionRate = reactantStateVars.emissionRate;
                if (reactantStateVars.emissionSize !== undefined) gasEmissionSize = reactantStateVars.emissionSize;
                if (reactantStateVars.emissionType) gasEmissionType = reactantStateVars.emissionType;
            }
            if (reactantStateVars.electrodeDissolving) {
                dissolving = { ...dissolving, ...reactantStateVars.electrodeDissolving };
            }
            if (reactantStateVars.metalDeposition) {
                deposition = { ...deposition, ...reactantStateVars.metalDeposition };
            }
        });
    }

    // --- 1. LIQUID CALCULATIONS ---
    const { liquidVolume, liquidColor } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff';

            if (r.state === 'l' || r.state === 'aq') {
                const override = props.reactantOverrides?.[r.id];
                const amt = override !== undefined ? override : (parseFloat(r.amount) || 0);

                vol += amt;
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
    }, [reactants, liquid, props.reactantOverrides]);

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
    const shouldShowBubbles = (isPowerOn || isTimelineBubbling) && finalHeight > 0.2;
    const showCathodeBubbles = shouldShowBubbles && (gasElectrode === 'both' || gasElectrode === 'cathode');
    const showAnodeBubbles = shouldShowBubbles && (gasElectrode === 'both' || gasElectrode === 'anode');

    // Default rate is 50. Scale between 10 (min) and 100 (max) bubbles per electrode based on the slider.
    const activeGasRate = isTimelineBubbling ? (gasRate || 50) : 50;
    const bubbleCount = Math.floor(Math.max(10, Math.min(100, activeGasRate)));
    const bubbleSpeedScalar = isTimelineBubbling ? (activeGasRate / 50) : (electricity.current / 50 || 1);

    // Scale Surface Emission
    const activeEmissionRate = isTimelineBubbling ? (gasEmissionRate !== undefined ? gasEmissionRate : activeGasRate) : 50;
    const activeEmissionSize = isTimelineBubbling ? (gasEmissionSize !== undefined ? gasEmissionSize : (gasSize || 1)) : 1;

    useFrame((state) => {
        // Obsolete sphere loop removed. Physics hand-off to ParticleSystem inner logic.
    });

    // Helper to dynamically slice electrodes at the liquid level to shrink/grow only the submerged part
    const renderElectrode = (isCathode, posX, baseColor, metalness) => {
        const liquidLine = Math.min(Math.max(0.05 + finalHeight, 0.1), 1.3);
        const bottom = 0.1;
        const top = 1.3;
        const sideKey = isCathode ? 'cathode' : 'anode';

        // Shrink width 
        const shrinkProgress = dissolving[sideKey] || 0;
        const depProps = deposition[sideKey] || { progress: 0, color: '#cccccc' };

        const subHeight = liquidLine - bottom;
        const subCenterY = bottom + subHeight / 2;
        const subWidth = 0.2 * (1 - shrinkProgress * 0.95);

        const aboveHeight = top - liquidLine;
        const aboveCenterY = liquidLine + aboveHeight / 2;

        const isDepositing = depProps.progress > 0;
        const depWidth = 0.2 + (0.1 * depProps.progress);

        return (
            <group position={[posX, 0, 0]}>
                {/* Above Liquid (static) */}
                {aboveHeight > 0 && (
                    <Box args={[0.2, aboveHeight, 0.05]} position={[0, aboveCenterY, 0]}>
                        <meshStandardMaterial color={baseColor} metalness={metalness} />
                    </Box>
                )}
                {/* Submerged (dynamic) */}
                {subHeight > 0 && (
                    <group position={[0, subCenterY, 0]}>
                        <Box args={[subWidth, subHeight, 0.05]}>
                            <meshStandardMaterial color={baseColor} metalness={metalness} />
                        </Box>
                        {isDepositing && (
                            <Box args={[depWidth, subHeight * 0.95, 0.06]}>
                                <meshStandardMaterial color={depProps.color} metalness={metalness} transparent opacity={depProps.progress} />
                            </Box>
                        )}
                    </group>
                )}
            </group>
        );
    };

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

            {/* Electrodes (Dynamic Slicing for Dissolving/Deposition) */}
            {renderElectrode(true, -0.3, "#222", 0.8)} {/* Cathode */}
            {renderElectrode(false, 0.3, "#b87333", 0.9)} {/* Anode */}

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
                        depthWrite={false}
                        side={2}
                        roughness={0.1}
                    />
                </Cylinder>
            )}

            {/* Bubbles - Underwater phase */}
            {shouldShowBubbles && (
                <group renderOrder={3}>
                    {/* Cathode Bubbles */}
                    {showCathodeBubbles && (
                        <ParticleSystem
                            position={[-0.3, 0.1 + (finalHeight * 0.5), 0]}
                            type={gasBubbleType}
                            color={gasColor || "#ffffff"}
                            scale={(gasSize || 1) * 0.5}
                            count={activeGasRate}
                            isPlaying={true}
                            forceClampY={{ max: 0.05 + finalHeight }}
                        />
                    )}
                    {showAnodeBubbles && (
                        <ParticleSystem
                            position={[0.3, 0.1 + (finalHeight * 0.5), 0]}
                            type={gasBubbleType}
                            color={gasColor || "#ffffff"}
                            scale={(gasSize || 1) * 0.5}
                            count={activeGasRate}
                            isPlaying={true}
                            forceClampY={{ max: 0.05 + finalHeight }}
                        />
                    )}
                </group>
            )}

            {/* Surface Gas - Airborne phase */}
            {shouldShowBubbles && (
                <group position={[0, 0.05 + finalHeight, 0]}>
                    {showCathodeBubbles && (
                        <ParticleSystem
                            position={[-0.3, 0, 0]}
                            type={gasEmissionType}
                            color={gasColor || "#ffffff"}
                            scale={activeEmissionSize * 0.5}
                            count={activeEmissionRate}
                            isPlaying={true}
                        />
                    )}
                    {showAnodeBubbles && (
                        <ParticleSystem
                            position={[0.3, 0, 0]}
                            type={gasEmissionType}
                            color={gasColor || "#ffffff"}
                            scale={activeEmissionSize * 0.5}
                            count={activeEmissionRate}
                            isPlaying={true}
                        />
                    )}
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
