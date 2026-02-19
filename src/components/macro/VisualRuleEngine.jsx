import React, { useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ParticleSystem from '../apparatus/ParticleSystem'; // Assuming this exists or will be created
import BoilingWater from '../apparatus/BoilingWater';

const VisualRuleEngine = ({ apparatusList, visualRules, stepIndex, isPlaying }) => {
    const { scene } = useThree();

    // 1. Physics & Connectivity Analysis
    // Analyze the scene graph to determine connectivity (e.g., Flask -> Cork -> Tube)
    const physicsState = useMemo(() => {
        const state = {
            containers: {}, // Map of container ID -> { isSealed: bool, ventPath: points[] }
        };

        apparatusList.forEach(item => {
            // Identify Containers
            if (['ConicalFlask', 'RoundBottomFlask', 'TestTube', 'Beaker'].includes(item.model)) {
                state.containers[item.id] = {
                    type: item.model,
                    position: item.position,
                    isSealed: false,
                    ventPath: null
                };
            }
        });

        // Check for Corks (Seals)
        apparatusList.forEach(item => {
            if (item.model === 'RubberCork') {
                // Find nearest container to seal
                // Simple distance check for now (ideal: check parent/child or specific slot)
                let nearestContainerId = null;
                let minDist = 0.5; // Threshold

                Object.entries(state.containers).forEach(([id, container]) => {
                    const dx = item.position[0] - container.position[0];
                    const dy = item.position[1] - container.position[1]; // Cork should be above
                    const dz = item.position[2] - container.position[2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // Cork is usually ~2-3 units above container origin
                    if (dist < 3.0 && dy > 1.0) { // Rough heuristic
                        nearestContainerId = id;
                    }
                });

                if (nearestContainerId) {
                    state.containers[nearestContainerId].isSealed = true;
                    // Store cork ID to find connected tubes
                    state.containers[nearestContainerId].corkId = item.id;
                }
            }
        });

        // Check for Delivery Tubes (Vents)
        apparatusList.forEach(item => {
            if (item.model === 'DeliveryTube') {
                // Determine if this tube connects to a cork
                // For now, assume if there's a tube and a sealed container, they match
                // In a real graph, we'd check Item connections

                Object.values(state.containers).forEach((container) => {
                    if (container.isSealed) {
                        // If tube start point is near cork...
                        // Simplify: Just assign the tube path if exists
                        container.ventPath = item.points || [];
                    }
                });
            }
        });

        return state;
    }, [apparatusList]);

    // 2. Render Visuals based on Rules + Physics
    return (
        <group name="visual-rule-engine">
            {Object.entries(physicsState.containers).map(([id, container]) => {
                // Check if this container should be emitting gas based on visualRules
                const currentStepRules = visualRules?.timeline?.[stepIndex];
                const activeEffects = currentStepRules?.effects || [];

                // Example: Look for 'gas' or 'smoke' effect
                const gasEffect = activeEffects.find(e => e.type === 'gas' || e.type === 'smoke');

                if (gasEffect && isPlaying) {
                    if (container.isSealed && container.ventPath && container.ventPath.length > 0) {
                        // RENDER 1: Gas traveling through tube
                        return (
                            <ParticleSystem
                                key={`gas-tube-${id}`}
                                path={container.ventPath}
                                type="gas_flow"
                                color={gasEffect.color}
                                density={gasEffect.density}
                            />
                        );
                    } else if (!container.isSealed) {
                        // RENDER 2: Gas escaping to atmosphere (Upwards)
                        return (
                            <ParticleSystem
                                key={`gas-air-${id}`}
                                position={[container.position[0], container.position[1] + 2.5, container.position[2]]}
                                type="gas_rise" // Standard rising smoke
                                color={gasEffect.color}
                                density={gasEffect.density}
                            />
                        );
                    }
                } else if (gasEffect && isPlaying) {
                    // ... (Gas Logic) ...
                }

                const flashEffect = activeEffects.find(e => e.type === 'flash');
                if (flashEffect && isPlaying) {
                    return (
                        <ParticleSystem
                            key={`flash-${id}`}
                            position={[container.position[0], container.position[1] + 1, container.position[2]]}
                            type="flash"
                            color={flashEffect.color}
                            density={flashEffect.density || 1}
                        />
                    );
                }

                const flameEffect = activeEffects.find(e => e.type === 'flame_interaction');
                if (flameEffect && isPlaying) {
                    // Just a placeholder particle for now, ideally this modifies the burner itself
                    return (
                        <ParticleSystem
                            key={`flame-${id}`}
                            position={[container.position[0], container.position[1], container.position[2]]}
                            type="gas_rise"
                            color={flameEffect.color || "#ff8800"}
                            density={2}
                            scale={0.5}
                        />
                    );
                }

                return null;
            })}
        </group>
    );
};

export default VisualRuleEngine;
