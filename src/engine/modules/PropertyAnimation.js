import { applyMutation } from '../StateMutation';
import { BaseModule } from './BaseModule';

/**
 * PropertyAnimation
 * Extends BaseModule to cleanly handle pure property interpolation.
 */
export class PropertyAnimation extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the property change
     */
    constructor(config) {
        super(config);
        this.property = config.property;
        this.from = config.from;
        this.to = config.to;
        this.easing = config.easing || 'linear';
    }

    /**
     * Replaces the old custom evaluate(). Now receives mathematically pure bounded progress.
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
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
