// src/components/reactions/views/MacroView.jsx
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// Import all apparatus
import * as Apparatus from '../../apparatus';

import RealisticLiquid from './components/RealisticLiquid';
import ParticleSystem from './components/ParticleSystem';
import VisualRuleEngine from '../../macro/VisualRuleEngine';

import { detectApparatusTypeAbove } from '../../../utils/apparatus-logic';
import { calculateFrameState, calculateReactantState } from '../../../utils/visual-engine';
import GlobalLabTable from '../../../components/apparatus/GlobalLabTable';

// ReactionEffectManager replaced by VisualRuleEngine
// const ReactionEffectManager = ... (Removed Stub)

const ApparatusItem = ({ item, apparatusRefs, progress, allApparatus, visualRules, currentStepIndex, stepProgress }) => {
    // Alias resolution for legacy names
    let modelName = item.model;
    if (modelName === 'BoilingTube') modelName = 'TestTube';
    if (modelName === 'GlassRod') modelName = 'StirringRod';
    if (modelName === 'Cork') modelName = 'RubberCork';
    
    const Component = Apparatus[modelName] || Apparatus.Beaker;
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

        if (isHeatSource || (extraProps.isOn && extraProps.apparatusType !== 'standard')) {
            extraProps.isHeating = true;
        }
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
            position={item.position || [0, 0, 0]}
            rotation={item.rotation || [0, 0, 0]}
            scale={item.scale || [1, 1, 1]}
            visible={item.visible !== false}
        >
            <Component {...finalProps} />
            {allApparatus && allApparatus.filter(child => child.parentId === item.id).map(childItem => (
                <ApparatusItem
                    key={childItem.id}
                    item={childItem}
                    apparatusRefs={apparatusRefs}
                    progress={progress}
                    allApparatus={allApparatus}
                    visualRules={visualRules}
                    currentStepIndex={currentStepIndex}
                    stepProgress={stepProgress}
                />
            ))}
        </group>
    );
};



// --- ANIMATION & TRANSFORMATION LOGIC ---
// Helper to derive current apparatus state from timeline
const useDerivedApparatus = (reaction, progress) => {
    // 1. Initial State
    // Deep clone to avoid mutating original
    const baseApparatus = reaction.stages?.[0]?.apparatus || reaction.apparatus || [];
    let currentApparatus = JSON.parse(JSON.stringify(baseApparatus));
    const timeline = reaction.macroView?.visualRules?.timeline || {};
    const totalSteps = Object.keys(timeline).length;

    // 2. Determine Current Step & Step Progress
    // Calculate Total Duration
    let totalStepDuration = 0;
    const stepDurations = [];
    for (let i = 0; i < totalSteps; i++) {
        const s = timeline[i.toString()];
        const dur = (parseFloat(s?.duration) || 0) + (parseFloat(s?.delay) || 0);
        stepDurations.push(dur);
        totalStepDuration += dur;
    }

    let maxReactantDuration = 0;
    const reactantTimeline = reaction.macroView?.visualRules?.reactantTimeline || [];
    if (reactantTimeline.length > 0) {
        maxReactantDuration = reactantTimeline.reduce((acc, block) => {
            const end = (parseFloat(block.startTime) || 0) + (parseFloat(block.duration) || 0);
            return Math.max(acc, end);
        }, 0);
    }

    let totalDuration = Math.max(totalStepDuration, maxReactantDuration);
    if (totalDuration === 0) totalDuration = 10; // Fallback

    const currentTime = progress * totalDuration;
    let currentStepIndex = 0;
    let accumulatedTime = 0;
    let stepProgress = 0;

    for (let i = 0; i < totalSteps; i++) {
        const dur = stepDurations[i];
        if (currentTime <= accumulatedTime + dur) {
            currentStepIndex = i;
            // Calculate 0-1 progress within this specific step
            stepProgress = dur > 0 ? (currentTime - accumulatedTime) / dur : 1;
            break;
        }
        accumulatedTime += dur;
        // If we dictate the last step, ensure we clamp
        if (i === totalSteps - 1) {
            currentStepIndex = i;
            stepProgress = 1;
        }
    }

    // 3. Apply Transformations (Permanent changes from previous steps)
    if (totalSteps > 0) {
        for (let i = 0; i <= currentStepIndex; i++) {
            const step = timeline[i.toString()];
            if (step && step.transformations) {
                step.transformations.forEach(trans => {
                    const target = currentApparatus.find(a => a.id === trans.target);
                    if (target) {
                        if (trans.newModel) target.model = trans.newModel;
                        if (trans.visible !== undefined) target.visible = trans.visible;
                        if (trans.scale) target.scale = trans.scale;
                        if (trans.color) target.color = trans.color;
                    }
                });
            }
        }
    }

    // 4. Calculate Animations (Interpolated changes for CURRENT step)
    if (totalSteps > 0) {
        const currentStepConfig = timeline[currentStepIndex.toString()];
        if (currentStepConfig && currentStepConfig.animations) {
            currentStepConfig.animations.forEach(anim => {
                const target = currentApparatus.find(a => a.id === anim.target);
                if (target) {
                    if (anim.type === 'move') {
                        if (anim.position) {
                            const start = target.position || [0, 0, 0];
                            const end = anim.position;
                            target.position = [
                                start[0] + (end[0] - start[0]) * stepProgress,
                                start[1] + (end[1] - start[1]) * stepProgress,
                                start[2] + (end[2] - start[2]) * stepProgress
                            ];
                        }
                    } else if (anim.type === 'scale') {
                        if (anim.scale) {
                            const start = target.scale || [1, 1, 1];
                            const end = anim.scale;
                            target.scale = [
                                start[0] + (end[0] - start[0]) * stepProgress,
                                start[1] + (end[1] - start[1]) * stepProgress,
                                start[2] + (end[2] - start[2]) * stepProgress
                            ];
                        }
                    } else if (anim.type === 'rotate') {
                        target.rotation = [
                            (target.rotation?.[0] || 0) + stepProgress * Math.PI * (anim.speed || 1),
                            target.rotation?.[1] || 0,
                            target.rotation?.[2] || 0
                        ];
                    }
                }
            });
        }
    }

    // 5. Advanced Engine: Calculate Render State per apparatus
    const timelineData = reaction.macroView?.visualRules?.timeline || {};
    const renderState = calculateFrameState(timelineData, currentStepIndex, stepProgress, currentApparatus);

    // Calculate Reactant State
    let reactantState = {};
    if (reaction.macroView?.visualRules?.reactantTimeline) {
        reactantState = calculateReactantState(reaction.macroView.visualRules.reactantTimeline, currentTime, currentApparatus);
    }

    // Merge renderState into the currentApparatus objects so ApparatusItem receives it
    currentApparatus.forEach(app => {
        const stepState = renderState[app.id] || {};
        const rState = reactantState[app.id] || {};

        // If State Change timeline effect specifies a new model, overwrite it
        if (rState.newModel) {
            app.model = rState.newModel;
        }

        app.renderProps = { ...stepState, ...rState };
    });

    return { apparatus: currentApparatus, currentStepIndex, stepProgress, reactantState, currentTime };
};

// --- MAIN MACRO VIEW MANAGER ---
const MacroView = ({ reaction, progress, isPlaying, showTable = true }) => {
    const list = reaction.stages?.[0]?.apparatus || reaction.apparatus || [];
    if (list.length > 0) {
        return <DynamicSetup reaction={reaction} progress={progress} isPlaying={isPlaying} showTable={showTable} />;
    }
    return null;
};

const DynamicSetup = ({ reaction, progress, isPlaying, showTable }) => {
    // 1. Get List of Apparatus & Current Step from Helper
    const { apparatus: apparatusList, currentStepIndex, stepProgress, currentTime, reactantState } = useDerivedApparatus(reaction, progress);

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
                <group>
                    {/* Render List Hierarchically */}
                    {apparatusList.filter(item => !item.parentId).map(item => (
                        <ApparatusItem
                            key={item.id}
                            item={item}
                            apparatusRefs={apparatusRefs}
                            progress={progress}
                            allApparatus={apparatusList}
                            visualRules={reaction.macroView?.visualRules}
                            currentStepIndex={currentStepIndex}
                            stepProgress={stepProgress}
                        />
                    ))}

                    {/* Visual Effects Overlay (New Engine) */}
                    <VisualRuleEngine
                        apparatusList={apparatusList}
                        visualRules={reaction.macroView?.visualRules}
                        stepIndex={currentStepIndex}
                        stepProgress={stepProgress}
                        isPlaying={isPlaying ?? (progress > 0 && progress < 1)}
                        reactantState={reactantState}
                        currentTime={currentTime}
                    />

                </group>
            </group>

            {showTable && <GlobalLabTable width={reaction.tableWidth || 14} depth={reaction.tableDepth || 10} />}

            <mesh position={[0, -4.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
            </mesh>
            <gridHelper args={[50, 50, '#333', '#111']} position={[0, -4.06, 0]} />
        </group >
    );
};

export default MacroView;
