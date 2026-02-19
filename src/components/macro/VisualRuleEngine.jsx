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
    const stepRules = visualRules?.timeline?.[stepIndex] || {};

    // Helper to find apparatus by ID
    const findApparatus = (id) => apparatusList.find(a => a.id === id);

    return (
        <group name="visual-rule-engine">
            {/* A. GAS EFFECTS (Bubbles / Smoke) */}
            {stepRules.gas?.enabled && (() => {
                const sourceId = stepRules.gas.source;
                const sourceItem = findApparatus(sourceId);
                const container = physicsState.containers[sourceId]; // Is source a container?

                // Position: Default to source item pos, or fallback to center
                const pos = sourceItem ? sourceItem.position : [0, 0, 0];

                if (container && container.isSealed && container.ventPath && container.ventPath.length > 0) {
                    // Gas traveling through tube
                    return (
                        <ParticleSystem
                            key={`gas-tube-${sourceId}`}
                            config={{
                                type: 'smoke', // or gas_flow
                                color: stepRules.gas.color || '#fff',
                                speed: (stepRules.gas.rate || 50) * 0.002,
                                scale: stepRules.gas.size || 0.5
                            }}
                            count={stepRules.gas.rate || 20}
                            path={container.ventPath}
                        />
                    );
                } else {
                    // Rising Gas (Bubbles or Smoke)

                    return (
                        <group position={pos}>
                            <ParticleSystem
                                key={`gas-rise-${stepRules.gas.type}-${sourceId || 'default'}`}
                                config={{
                                    type: stepRules.gas.type || (stepRules.gas.color === '#ffffff' ? 'smoke' : 'bubble'),
                                    color: stepRules.gas.color || '#fff',
                                    speed: (stepRules.gas.rate || 50) * 0.001,
                                    scale: stepRules.gas.size || 0.5,
                                    spread: 0.5
                                }}
                                count={stepRules.gas.rate || 20}
                            />
                        </group>
                    );
                }
            })()}

            {/* B. LIGHT EFFECTS (Flash / Glow) */}
            {stepRules.light?.enabled && (() => {
                // Simple Point Light for now
                const intensity = stepRules.light.intensity || 1;
                const color = stepRules.light.color || '#fff';
                const radius = stepRules.light.radius || 5;

                // Flicker logic could be here or in a shader. 
                // For now, we rely on React Three Fiber reactivity if we passed a ref, 
                // but here we just render the light.
                return (
                    <pointLight
                        position={[0, 2, 0]} // Center of scene approx
                        intensity={intensity}
                        color={color}
                        distance={radius * 5}
                        decay={2}
                    />
                );
            })()}

            {/* C. HEAT EFFECTS (Glow) */}
            {stepRules.heat?.enabled && (() => {
                const sourceId = stepRules.heat.source;
                const sourceItem = findApparatus(sourceId);
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

            {/* D. PRECIPITATE / LIQUID (Handled via props to specific Apparatus usually, but could add overlays here) */}
        </group>
    );
};

export default VisualRuleEngine;
