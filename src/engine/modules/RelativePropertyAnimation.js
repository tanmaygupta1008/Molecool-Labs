import { applyMutation } from '../StateMutation';
import { BaseModule } from './BaseModule';

/**
 * RelativePropertyAnimation
 * Extends BaseModule to handle relative interpolations (like relative transforms).
 */
export class RelativePropertyAnimation extends BaseModule {
    /**
     * @param {Object} config JSON configuration
     */
    constructor(config) {
        super(config);
        this.property = config.property;
        this.fromOffset = config.fromOffset;
        this.to = config.to;
        this.easing = config.easing || 'linear';
    }

    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        // fallback to interpolating from 0,0,0 or 1,1,1 if not caching, which is what the previous macro rules did implicitly mostly
        const newValue = applyMutation(this.fromOffset, this.to, progress, this.easing);

        // Dirty checking
        const currentValueStr = JSON.stringify(objectState[this.property]);
        const newValueStr = JSON.stringify(newValue);

        if (currentValueStr !== newValueStr) {
            objectState[this.property] = newValue;
            return true;
        }

        return false;
    }
}
