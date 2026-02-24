import { BaseModule } from './BaseModule';
import { applyMutation } from '../StateMutation';

/**
 * SolidSystem
 * Extends BaseModule to handle solid-state physical animations 
 * like structural deposition (scaling up / color change) and dissolving (scaling down).
 */
export class SolidSystem extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the solid event
     */
    constructor(config) {
        super(config);

        this.type = config.type || "deposition"; // 'deposition' or 'dissolve'
        this.color = config.color; // Required for deposition
        this.growthRate = config.growthRate || 0.0;

        // Internal caching for relative mutations
        this.initialScale = null;
        this.initialColor = null;
    }

    /**
     * Inherited from BaseModule. 
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        let stateChanged = false;

        // Cache the original state of the object exactly once when this module first wakes up
        if (this.initialScale === null) {
            this.initialScale = objectState.scale ? [...objectState.scale] : [1, 1, 1];
            this.initialColor = objectState.color || "#ffffff";
        }

        if (this.type === "deposition") {
            // Apply scale growth
            const currentGrowth = 1.0 + (this.growthRate * progress);
            const newScale = [
                this.initialScale[0] * currentGrowth,
                this.initialScale[1] * currentGrowth,
                this.initialScale[2] * currentGrowth
            ];

            const currentScaleStr = JSON.stringify(objectState.scale || [1, 1, 1]);
            const newScaleStr = JSON.stringify(newScale);

            if (currentScaleStr !== newScaleStr) {
                objectState.scale = newScale;
                stateChanged = true;
            }

            // Apply color interpolation if configured
            if (this.color) {
                const newColor = applyMutation(this.initialColor, this.color, progress, 'linear');
                if (objectState.color !== newColor) {
                    objectState.color = newColor;
                    stateChanged = true;
                }
            }

        } else if (this.type === "dissolve") {
            // Apply scale shrinking towards 0
            // Assuming growthRate here defines how much of it disappears (e.g. 1.0 means fully disappears)
            const shrinkFactor = Math.max(0, 1.0 - (this.growthRate * progress));
            const newScale = [
                this.initialScale[0] * shrinkFactor,
                this.initialScale[1] * shrinkFactor,
                this.initialScale[2] * shrinkFactor
            ];

            const currentScaleStr = JSON.stringify(objectState.scale || [1, 1, 1]);
            const newScaleStr = JSON.stringify(newScale);

            if (currentScaleStr !== newScaleStr) {
                objectState.scale = newScale;
                stateChanged = true;

                // If it shrunk to 0, mark invisible
                if (shrinkFactor <= 0.001 && objectState.visible !== false) {
                    objectState.visible = false;
                } else if (shrinkFactor > 0.001 && objectState.visible === false) {
                    objectState.visible = true;
                }
            }
        }

        return stateChanged;
    }
}
