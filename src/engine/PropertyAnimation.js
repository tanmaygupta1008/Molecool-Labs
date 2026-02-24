import { applyMutation } from './StateMutation';

/**
 * PropertyAnimation
 * Encapsulates the logic to animate a generic object property over a specified duration
 * with assigned easing mathematically.
 */
export class PropertyAnimation {
    /**
     * @param {Object} config JSON configuration for the property change
     */
    constructor(config) {
        this.target = config.target;
        this.property = config.property;
        this.from = config.from;
        this.to = config.to;
        this.startTime = config.startTime || 0;
        this.duration = config.duration || 0;
        this.easing = config.easing || 'linear';
    }

    /**
     * Evaluates the animation given the current absolute track time
     * and mutates the global engine state directly.
     * @param {number} currentTime Elapsed ms in the timeline 
     * @param {Object} globalState The dictionary of all object states in the engine
     * @returns {boolean} true if a change was applied to the state object
     */
    evaluate(currentTime, globalState) {
        const objectState = globalState[this.target];
        if (!objectState) return false;

        // Calculate 0.0 to 1.0 clamped progress
        const timeElapsed = currentTime - this.startTime;
        let progress = 0;

        if (this.duration <= 0) {
            progress = timeElapsed >= 0 ? 1 : 0;
        } else {
            progress = Math.min(Math.max(timeElapsed / this.duration, 0), 1);
        }

        const newValue = applyMutation(this.from, this.to, progress, this.easing);

        // Dirty checking: Skip unnecessary React state clones if functionally identical
        const currentValueStr = JSON.stringify(objectState[this.property]);
        const newValueStr = JSON.stringify(newValue);

        if (currentValueStr !== newValueStr) {
            objectState[this.property] = newValue;
            return true;
        }

        return false;
    }
}
