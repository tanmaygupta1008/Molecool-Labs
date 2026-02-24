import React, { useMemo } from 'react';
import ParticleSystem from './components/ParticleSystem';

/**
 * Renders force-based visual effects like explosions and splashes dynamically.
 * Reads the `forceState` from any apparatus flagged by the ForceSystem module.
 */
export default function DynamicForceEffects({ apparatusList }) {
    // Collect active force trackers
    const activeForces = useMemo(() => {
        const forces = [];
        apparatusList.forEach(appObj => {
            if (appObj.forceState) {
                if (appObj.forceState.explosionActive) {
                    forces.push({
                        id: `${appObj.id}-explosion`,
                        type: 'explosion',
                        strength: appObj.forceState.explosionStrength,
                        // Float explosion slightly above origin
                        pos: [(appObj.position?.[0] || 0), (appObj.position?.[1] || 0) + 0.5, (appObj.position?.[2] || 0)]
                    });
                }
                if (appObj.forceState.splashActive) {
                    forces.push({
                        id: `${appObj.id}-splash`,
                        type: 'splash',
                        // Splashes happen near tops of containers usually
                        pos: [(appObj.position?.[0] || 0), (appObj.position?.[1] || 0) + 1.5, (appObj.position?.[2] || 0)]
                    });
                }
            }
        });
        return forces;
    }, [apparatusList]);

    if (activeForces.length === 0) return null;

    return (
        <group name="DynamicForceEffects">
            {activeForces.map(force => {
                const isExplode = force.type === 'explosion';

                // Route to appropriate particle subsystem config
                // Utilizing existing gas particle visuals with tuned spread/speed
                const config = {
                    type: isExplode ? 'explosion' : 'gas',
                    speed: isExplode ? force.strength * 0.2 : 5,
                    spread: isExplode ? 3.14 : 0.8, // 3.14 radians for full sphere burst
                    color: isExplode ? '#ff8800' : '#44ccff',
                    scale: isExplode ? 1.5 : 1.0,
                    opacity: 0.8
                };

                // Burst particle counts
                const count = isExplode ? Math.min(Math.floor(force.strength * 10), 300) : 50;

                return (
                    <group key={force.id} position={force.pos}>
                        <ParticleSystem
                            count={count}
                            config={config}
                            progress={1}
                        />
                    </group>
                );
            })}
        </group>
    );
}
