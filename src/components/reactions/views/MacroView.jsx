import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Html, Float, Center } from '@react-three/drei';
import * as THREE from 'three';

// Import all apparatus
import * as Apparatus from '../../apparatus';

import RealisticLiquid from './components/RealisticLiquid';
import ParticleSystem from './components/ParticleSystem';
import VisualRuleEngine from '../../macro/VisualRuleEngine';
import DynamicGasEffects from './DynamicGasEffects';
import DynamicLiquidEffects from './DynamicLiquidEffects';
import DynamicForceEffects from './DynamicForceEffects';

import { detectApparatusTypeAbove } from '../../../utils/apparatus-logic';
import { ReactionEngine } from '../../../engine/ReactionEngine';

// Map model names from JSON to components
const APPARATUS_MAP = {
    'BunsenBurner': Apparatus.BunsenBurner,
    'TripodStand': Apparatus.TripodStand,
    'WireGauze': Apparatus.WireGauze,
    'Crucible': Apparatus.Crucible,
    'Tongs': Apparatus.Tongs,
    'HeatproofMat': Apparatus.HeatproofMat,
    'Beaker': Apparatus.Beaker,
    'ConicalFlask': Apparatus.ConicalFlask,
    'TestTube': Apparatus.TestTube,
    'BoilingTube': Apparatus.BoilingTube || Apparatus.TestTube, // Fallback
    'MeasuringCylinder': Apparatus.MeasuringCylinder,
    'Dropper': Apparatus.Dropper,
    'StirringRod': Apparatus.StirringRod,
    'GlassRod': Apparatus.StirringRod, // Alias
    'WaterTrough': Apparatus.WaterTrough,
    'GasJar': Apparatus.GasJar,
    'DeliveryTube': Apparatus.DeliveryTube,
    'RubberCork': Apparatus.RubberCork,
    'Cork': Apparatus.RubberCork, // Alias
    'Burette': Apparatus.Burette,
    'RetortStand': Apparatus.RetortStand,
    'Clamp': Apparatus.Clamp,
    'ElectrolysisSetup': Apparatus.ElectrolysisSetup,
    'PowerSupply': Apparatus.PowerSupply,
    'MagnesiumRibbon': Apparatus.MagnesiumRibbon,
    'MagnesiumOxideAsh': Apparatus.MagnesiumOxideAsh,
    'ZincGranules': Apparatus.ZincGranules,
    'Forceps': Apparatus.Forceps,
    'SafetyShield': Apparatus.SafetyShield,
    'DropperBottle': Apparatus.DropperBottle,
    'IronNail': Apparatus.IronNail,
    'GasTap': Apparatus.GasTap,
    'LitmusPaper': Apparatus.LitmusPaper,
    'Wire': Apparatus.Wire,
};

// ReactionEffectManager replaced by VisualRuleEngine
// const ReactionEffectManager = ... (Removed Stub)

const ApparatusItem = ({ item, apparatusRefs, progress, allApparatus, visualRules, currentStepIndex, stepProgress }) => {
    const Component = APPARATUS_MAP[item.model];
    const groupRef = useRef();

    // Register ref updates
    useFrame(() => {
        if (groupRef.current && apparatusRefs && apparatusRefs.current) {
            apparatusRefs.current[item.id] = groupRef.current;
        }
    });

    // Also set immediately on mount if possible
    useEffect(() => {
        if (groupRef.current && apparatusRefs && apparatusRefs.current) {
            apparatusRefs.current[item.id] = groupRef.current;
        }
    }, [item.id, apparatusRefs]);


    if (!Component) {
        console.warn(`Apparatus model not found: ${item.model}`);
        return null;
    }

    // Similar to original: determine specialized props
    const extraProps = {};
    if (item.model === 'BunsenBurner') {
        const stepRules = visualRules?.timeline?.[currentStepIndex];
        const heatRule = stepRules?.heat;
        const isHeatSource = heatRule?.enabled && heatRule?.source === item.id;

        const initialIntensity = visualRules?.initialState?.burner?.intensity ?? 1.0;
        const currentIntensity = isHeatSource ? (heatRule.intensity ?? initialIntensity) : initialIntensity;

        extraProps.isOn = item.isOn || isHeatSource || false;
        const detection = detectApparatusTypeAbove(item, allApparatus);
        extraProps.apparatusType = detection.type;
        extraProps.flameTargetY = detection.distY;

        extraProps.intensity = currentIntensity;
        // Pass flame color from initial state OR advanced effect
        extraProps.flameColor = item.renderProps?.flameColor || (isHeatSource && heatRule?.color ? heatRule.color : null) || visualRules?.initialState?.burner?.flameColor || '#3b82f6';

        if (isHeatSource) extraProps.isHeating = true;
    }

    // Liquid Property parsing mapping
    if (['Beaker', 'ConicalFlask', 'TestTube', 'BoilingTube', 'MeasuringCylinder', 'WaterTrough', 'GasJar'].includes(item.model)) {
        const stepRules = visualRules?.timeline?.[currentStepIndex];
        const liquidRule = stepRules?.liquid;

        if (liquidRule && liquidRule.enabled) {
            const t = Math.min(1, Math.max(0, stepProgress || 0));
            if (liquidRule.initialColor && liquidRule.finalColor) {
                const c1 = new THREE.Color(liquidRule.initialColor);
                const c2 = new THREE.Color(liquidRule.finalColor);
                // Simple color lerp
                const res = c1.lerp(c2, t);
                extraProps.liquidColor = '#' + res.getHexString();
            } else if (liquidRule.initialColor) {
                extraProps.liquidColor = liquidRule.initialColor;
            }
            if (liquidRule.transparency !== undefined) {
                extraProps.liquidOpacity = liquidRule.transparency;
            }
        }
    }
    if (item.model === 'Tongs') {
        extraProps.angle = item.angle || 0;
    }

    if (item.model === 'MagnesiumRibbon' && progress > 0.5) {
        extraProps.visible = false; // "Consumed" (Though standard burning usually leaves ash, we hide the ribbon)
    };

    // Extract transform props to avoid double-application if child also uses them,
    // though most components use them on a root group anyway.
    // We pass everything else to the component (points, holeCount, specific props).
    // MERGE renderProps (dynamic effects) into the component props
    const { position, rotation, scale, id, renderProps, ...restProps } = item;
    const finalProps = { ...restProps, ...extraProps, ...renderProps };

    return (
        <group
            ref={groupRef}
            key={item.id}
            visible={item.visible !== false}
        >
            <Component {...finalProps} />
        </group>
    );
};



// --- MAIN MACRO VIEW MANAGER ---
const MacroView = ({ reaction, progress, isPlaying }) => {
    if (reaction.apparatus && reaction.apparatus.length > 0) {
        return <DynamicSetup reaction={reaction} progress={progress} isPlaying={isPlaying} />;
    }
    return null;
};

const DynamicSetup = ({ reaction, progress, isPlaying }) => {
    // 1. Initialize ReactionEngine (Once per reaction)
    const engine = useMemo(() => {
        const e = new ReactionEngine(reaction);
        e.reset(); // Establish baseline
        return e;
    }, [reaction]);

    // 2. Local State tied to Engine
    const [engineState, setEngineState] = useState(engine.getState());

    // 3. Keep State Synced to Parent Progress
    // When the top-level scrub slider moves `progress` (0 to 1), 
    // we seek the engine and grab the calculated state.
    useEffect(() => {
        engine.seekProgress(progress);
        setEngineState({ ...engine.getState() });
    }, [progress, engine]);

    // We convert the state object map into the array format expected by the rendering tree below
    const apparatusList = useMemo(() => {
        return Object.values(engineState);
    }, [engineState]);

    const currentStepIndex = 0; // Legacy step index. We may want the engine to expose this later if visual effects strictly need it.
    const stepProgress = progress;

    // Stub to hold object refs for World Position lookups
    const apparatusRefs = useRef({});

    return (
        <group>
            <group name="Lights">
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#b0c4de" />
                <rectAreaLight width={5} height={20} color="white" intensity={2} position={[5, 5, 5]} lookAt={[0, 0, 0]} />
            </group>

            <group>
                {/* Render List Flat */}
                {apparatusList.map(item => (
                    <group
                        key={item.id}
                        position={
                            item.shakeOffset
                                ? [
                                    (item.position?.[0] || 0) + item.shakeOffset[0],
                                    (item.position?.[1] || 0) + item.shakeOffset[1],
                                    (item.position?.[2] || 0) + item.shakeOffset[2]
                                ]
                                : item.position || [0, 0, 0]
                        }
                        rotation={item.rotation || [0, 0, 0]}
                        scale={item.scale || [1, 1, 1]}
                    >
                        <ApparatusItem
                            item={item}
                            apparatusRefs={apparatusRefs}
                            progress={progress}
                            allApparatus={apparatusList}
                            visualRules={reaction.macroView?.visualRules}
                            currentStepIndex={currentStepIndex}
                            stepProgress={stepProgress}
                        />
                    </group>
                ))}

                {/* Visual Effects Overlay (New Engine) */}
                <VisualRuleEngine
                    apparatusList={apparatusList}
                    visualRules={reaction.macroView?.visualRules}
                    stepIndex={currentStepIndex}
                    stepProgress={stepProgress}
                    isPlaying={isPlaying ?? (progress > 0 && progress < 1)}
                />

                {/* Native Gas System Overlay */}
                <DynamicGasEffects
                    apparatusList={apparatusList}
                    apparatusRefs={apparatusRefs}
                />

                {/* Native Liquid System Overlay */}
                <DynamicLiquidEffects
                    apparatusList={apparatusList}
                />

                {/* Native Force System Overlay (Splashes/Explosions) */}
                <DynamicForceEffects
                    apparatusList={apparatusList}
                />

            </group>

            <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
            </mesh>
            <gridHelper args={[50, 50, '#333', '#111']} position={[0, -0.01, 0]} />
        </group >
    );
};

export default MacroView;
