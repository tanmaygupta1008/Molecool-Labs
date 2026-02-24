import { BaseModule } from './BaseModule';

/**
 * ContinuousRotation
 * Extends BaseModule to cleanly handle pure delta-based rotation.
 */
export class ContinuousRotation extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the rotation change
     */
    constructor(config) {
        // Rotations from legacy adapter might not have explicit duration, often continuous.
        // If duration is 0, BaseModule logic will clamp `progress` to 1 but keep `activeMs` increasing
        super(config);
        this.property = config.property;
        this.speed = config.speed || 1;

        // Internal tracking for continuous delta application
        this.lastActiveMs = 0;
    }

    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        // Calculate the delta in ms since the last evaluate tick
        const deltaMs = activeMs - this.lastActiveMs;
        this.lastActiveMs = activeMs;

        // Scrubbing backwards or stalled
        if (deltaMs <= 0) return false;

        const currentRot = objectState[this.property] || [0, 0, 0];
        objectState[this.property] = [
            currentRot[0] + (this.speed * deltaMs / 1000 * Math.PI),
            currentRot[1],
            currentRot[2]
        ];

        return true;
    }
}
