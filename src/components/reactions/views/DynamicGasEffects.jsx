import React, { useMemo } from 'react';
import ParticleSystem from './components/ParticleSystem';
import * as THREE from 'three';

/**
 * Renders gas particles dynamically based on current engine state.
 * Finds any object containing an active `gasState` and spawns bubbles from
 * the source apparatus to the destination apparatus.
 */
export default function DynamicGasEffects({ apparatusList, apparatusRefs }) {
    // Collect all active gas flows from the engine state
    const activeGasFlows = useMemo(() => {
        const flows = [];
        apparatusList.forEach(destObj => {
            if (destObj.gasState) {
                Object.values(destObj.gasState).forEach(gasData => {
                    if (gasData.isActive && gasData.volume > 0) {
                        flows.push({
                            destinationId: destObj.id,
                            sourceId: gasData.fromSource,
                            volume: gasData.volume,
                            type: gasData.type || 'bubble', // default to bubble
                        });
                    }
                });
            }
        });
        return flows;
    }, [apparatusList]);

    if (activeGasFlows.length === 0) return null;

    return (
        <group name="DynamicGasEffects">
            {activeGasFlows.map((flow, i) => {
                // Look up actual 3D positions if refs are available
                // If not, fallback to JSON logical position
                let sourcePos = [0, 0, 0];
                let destPos = [0, 2, 0];

                const sourceObj = apparatusList.find(a => a.id === flow.sourceId);
                const destObj = apparatusList.find(a => a.id === flow.destinationId);

                if (sourceObj) sourcePos = sourceObj.position || [0, 0, 0];
                if (destObj) destPos = destObj.position || [0, 0, 0];

                // Scale particle count mostly by volume (rate * time), capped for performance
                const particleCount = Math.min(Math.floor(flow.volume * 50), 200);

                // Bubble config (we could extract this from JSON event config later)
                const config = {
                    speed: 0.05,
                    spread: 0.5, // spread across container width
                    scale: 1,
                    color: 'white',
                    type: 'bubble'
                };

                return (
                    <group key={`gas-flow-${i}`}>
                        {/* Render at Destination (accumulating / bubbling up) */}
                        <group position={destPos}>
                            <ParticleSystem
                                count={particleCount}
                                config={config}
                                progress={1}
                            />
                        </group>

                        {/* If source and destination are different, we could also render a subtle flow path here */}
                        {flow.sourceId !== flow.destinationId && (
                            <group position={sourcePos}>
                                {/* Tiny bubbles at source */}
                                <ParticleSystem
                                    count={Math.min(particleCount, 20)}
                                    config={{ ...config, spread: 0.2, speed: 0.02 }}
                                    progress={1}
                                />
                            </group>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
