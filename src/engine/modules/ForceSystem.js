import { BaseModule } from './BaseModule';

/**
 * ForceSystem
 * Extends BaseModule to handle physics-lite interactions without heavy physics engines.
 * Simulates explosions, radial displacement shakes, and liquid splashes natively.
 */
export class ForceSystem extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the force event
     */
    constructor(config) {
        // ForceSystem origin acts as the target for the engine iteration bounds
        config.target = config.origin || config.target;
        super(config);

        this.type = config.type || "explosion";
        this.radius = config.radius || 5;
        this.strength = config.strength || 10;

        // Single-fire triggers
        this.hasTriggeredSplash = false;
    }

    /**
     * Inherited from BaseModule. 
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        let stateChanged = false;

        // Ensure forceState tracker on the origin object
        if (!objectState.forceState) {
            objectState.forceState = {};
            stateChanged = true;
        }

        const forceData = objectState.forceState;

        if (this.type === "explosion") {
            const isActiveNow = progress > 0 && progress < 1.0;

            // 1. Particle Emitter Engine State
            if (forceData.explosionActive !== isActiveNow || forceData.explosionProgress !== progress) {
                forceData.explosionActive = isActiveNow;
                forceData.explosionProgress = progress;
                forceData.explosionStrength = this.strength;
                stateChanged = true;
            }

            // 2. Continuous Radial Force Shake Logic!
            if (isActiveNow) {
                const originPos = objectState.position || [0, 0, 0];

                // Iterate all objects physically in the simulation to apply shake displacement
                Object.values(globalState).forEach(obj => {
                    const objPos = obj.position || [0, 0, 0];

                    // Simple distance formula
                    const dx = objPos[0] - originPos[0];
                    const dy = objPos[1] - originPos[1];
                    const dz = objPos[2] - originPos[2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // Only manipulate objects within blast radius
                    if (dist <= this.radius) {
                        // Intensity decays with time (progress) and distance (distFactor)
                        const decay = 1.0 - progress;
                        const distFactor = Math.max(0, 1.0 - (dist / this.radius));

                        // 0.05 is the visual amplitude scale for subtle responsive mesh jitter
                        const intensity = this.strength * decay * distFactor * 0.05;

                        // Pseudo-random high-frequency sine waves based on global engine time
                        // We store this in `shakeOffset` which the React Scene Layer safely adds to the real position!
                        obj.shakeOffset = [
                            Math.sin(currentTime * 0.1) * intensity,
                            Math.cos(currentTime * 0.13) * intensity,
                            Math.sin(currentTime * 0.17) * intensity
                        ];

                        // 3. Trigger Liquid Splash
                        // If the shaken object contains liquid, flag a splash state
                        if (obj.liquidState && !this.hasTriggeredSplash && progress < 0.2) {
                            if (!obj.forceState) obj.forceState = {};
                            obj.forceState.splashActive = true;
                            this.hasTriggeredSplash = true;
                        }

                        stateChanged = true;
                    }
                });
            } else {
                // When elapsed, cleanup engine artifacts by zeroing shake offsets safely
                if (progress === 1 || progress === 0) {
                    Object.values(globalState).forEach(obj => {
                        if (obj.shakeOffset && (obj.shakeOffset[0] !== 0 || obj.shakeOffset[1] !== 0 || obj.shakeOffset[2] !== 0)) {
                            obj.shakeOffset = [0, 0, 0];
                            if (obj.forceState) obj.forceState.splashActive = false;
                            stateChanged = true;
                        }
                    });
                    this.hasTriggeredSplash = false;
                }
            }
        }

        return stateChanged;
    }
}
