import React, { useMemo } from 'react';
import ParticleSystem from './components/ParticleSystem';

/**
 * Renders liquid properties and precipitates dynamically based on current engine state.
 * Finds any apparatus with `liquidState.precipitateActive` and renders dropping particles.
 */
export default function DynamicLiquidEffects({ apparatusList }) {
    // Collect active precipitate states from the engine
    const activePrecipitates = useMemo(() => {
        const precipitates = [];
        apparatusList.forEach(appObj => {
            if (appObj.liquidState && appObj.liquidState.precipitateActive && appObj.liquidState.precipitateAmount > 0) {
                precipitates.push({
                    targetId: appObj.id,
                    amount: appObj.liquidState.precipitateAmount,
                    color: appObj.liquidState.precipitateColor,
                    speed: appObj.liquidState.precipitateSettleSpeed
                });
            }
        });
        return precipitates;
    }, [apparatusList]);

    if (activePrecipitates.length === 0) return null;

    return (
        <group name="DynamicLiquidEffects">
            {activePrecipitates.map((precip, i) => {
                const targetObj = apparatusList.find(a => a.id === precip.targetId);
                const targetPos = targetObj?.position || [0, 0, 0];

                // Scale particle count linearly by the normalized density 0.0 - 1.0
                const particleCount = Math.min(Math.floor(precip.amount * 400), 500);

                const config = {
                    speed: precip.speed * 0.01,
                    spread: 0.6, // Inside container
                    scale: 1,
                    color: precip.color,
                    type: 'precipitate'
                };

                return (
                    <group
                        key={`liquid-precip-${i}`}
                        position={targetPos}
                        // Slightly lift particle spawn to simulate middle of the liquid 
                        // rather than the absolute pivot point of the beaker model
                        position-y={targetPos[1] + 1.0}
                    >
                        <ParticleSystem
                            count={particleCount}
                            config={config}
                            progress={1}
                        />
                    </group>
                );
            })}
        </group>
    );
}
