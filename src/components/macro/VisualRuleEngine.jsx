import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleSystem from '../apparatus/ParticleSystem';
import { getActiveEffects } from '../../utils/visual-engine';

const VisualRuleEngine = ({ stepIndex, visualRules, apparatusList, stepProgress = 0, isPlaying }) => {
    // 1. Physics & Connectivity Analysis
    const physicsState = useMemo(() => {
        const state = {
            containers: {},
        };

        apparatusList.forEach(item => {
            if (['ConicalFlask', 'RoundBottomFlask', 'TestTube', 'BoilingTube', 'Beaker'].includes(item.model)) {
                state.containers[item.id] = {
                    type: item.model,
                    position: item.position,
                    isSealed: false,
                    ventPath: null
                };
            }
        });

        apparatusList.forEach(item => {
            if (item.model === 'RubberCork') {
                let nearestContainerId = null;
                Object.entries(state.containers).forEach(([id, container]) => {
                    const dx = item.position[0] - container.position[0];
                    const dy = item.position[1] - container.position[1];
                    const dz = item.position[2] - container.position[2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < 3.0 && dy > 1.0) {
                        nearestContainerId = id;
                    }
                });
                if (nearestContainerId) {
                    state.containers[nearestContainerId].isSealed = true;
                    state.containers[nearestContainerId].corkId = item.id;
                }
            }
        });

        apparatusList.forEach(item => {
            if (item.model === 'DeliveryTube') {
                Object.values(state.containers).forEach((container) => {
                    if (container.isSealed) {
                        container.ventPath = item.points || [];
                    }
                });
            }
        });

        return state;
    }, [apparatusList]);

    const stepRules = visualRules?.timeline?.[stepIndex] || {};
    const findApparatus = (id) => apparatusList.find(a => a.id === id);

    // 2. Gather All Gas Effects (Advanced + Basic UI)
    const advancedEffects = getActiveEffects(visualRules?.timeline, stepIndex, stepProgress);
    const gasEffects = advancedEffects.filter(e => e.type === 'GAS').map(e => ({
        sourceId: e.sourceId,
        gasType: e.gasType || 'bubble',
        color: e.color || '#ffffff',
        rate: e.rate || 50,
        size: e.size || 0.5
    }));

    // Check basic UI gas
    if (stepRules.gas?.enabled && stepRules.gas?.source) {
        gasEffects.push({
            sourceId: stepRules.gas.source,
            gasType: stepRules.gas.type || 'bubble',
            color: stepRules.gas.color || '#ffffff',
            rate: stepRules.gas.rate !== undefined ? stepRules.gas.rate : 50,
            size: stepRules.gas.size || 0.5
        });
    }

    return (
        <group name="visual-rule-engine">
            {/* A. GAS EFFECTS (Bubbles / Smoke) */}
            {gasEffects.map((gasEffect, idx) => {
                const sourceId = gasEffect.sourceId;
                const sourceItem = findApparatus(sourceId);
                const container = physicsState.containers[sourceId];
                const pos = sourceItem ? sourceItem.position : [0, 0, 0];
                const keySuffix = `${gasEffect.gasType}-${sourceId || 'default'}-${idx}`;

                if (container && container.isSealed && container.ventPath && container.ventPath.length > 0) {
                    return (
                        <ParticleSystem
                            key={`gas-tube-${keySuffix}`}
                            type={gasEffect.gasType}
                            color={gasEffect.color}
                            speed={gasEffect.rate * 0.002}
                            scale={gasEffect.size}
                            count={gasEffect.rate}
                            path={container.ventPath}
                            isPlaying={isPlaying}
                        />
                    );
                } else {
                    return (
                        <group key={`gas-rise-${keySuffix}`} position={pos}>
                            <ParticleSystem
                                type={gasEffect.gasType}
                                color={gasEffect.color}
                                speed={gasEffect.rate * 0.001}
                                scale={gasEffect.size}
                                spread={0.5}
                                count={gasEffect.rate}
                                isPlaying={isPlaying}
                            />
                        </group>
                    );
                }
            })}

            {/* B. LIGHT EFFECTS */}
            {stepRules.light?.enabled && (() => {
                const intensity = stepRules.light.intensity || 1;
                const color = stepRules.light.color || '#fff';
                const radius = stepRules.light.radius || 5;

                return (
                    <pointLight
                        position={[0, 2, 0]}
                        intensity={intensity}
                        color={color}
                        distance={radius * 5}
                        decay={2}
                    />
                );
            })()}

            {/* C. HEAT EFFECTS (Ambient Glow) */}
            {stepRules.heat?.enabled && stepRules.heat?.source && (() => {
                const sourceItem = findApparatus(stepRules.heat.source);
                const pos = sourceItem ? sourceItem.position : [0, 0, 0];

                return (
                    <pointLight
                        position={pos}
                        intensity={stepRules.heat.intensity || 1}
                        color={stepRules.heat.color || '#ff8800'}
                        distance={stepRules.heat.glowRadius || 3}
                    />
                );
            })()}
        </group>
    );
};

export default VisualRuleEngine;
