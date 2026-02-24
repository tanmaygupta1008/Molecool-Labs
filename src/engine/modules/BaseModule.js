/**
 * BaseModule
 * An abstract base class for all Engine state simulators.
 * Handles the boilerplate of tracking execution bounds (start/duration).
 */
export class BaseModule {
    /**
     * @param {Object} config JSON configuration for this module 
     */
    constructor(config) {
        this.target = config.target || config.destination; // Some modules use target, some destination
        this.startTime = config.startTime || 0;     // ms
        this.duration = config.duration || 0;       // ms

        // Ensure strictly continuous calculations
        this.initialized = true;
    }

    /**
     * Entry evaluation point from the ReactionEngine iteration loop.
     * Derived classes MUST NOT override this, but instead override `onEvaluate`.
     * 
     * @param {number} currentTime Absolute elapsed ms in the timeline 
     * @param {Object} globalState The full dictionary of all object states in the engine
     * @returns {boolean} true if a state change was physically applied to trigger React re-renders
     */
    evaluate(currentTime, globalState) {
        const objectState = globalState[this.target];
        if (!objectState) return false;

        // Calculate active duration clamped strictly to event timeline bounds
        const timeElapsedMs = currentTime - this.startTime;
        let activeMs = 0;
        let progress = 0; // 0.0 to 1.0 clamped range

        if (timeElapsedMs < 0) {
            activeMs = 0;
            progress = 0;
        } else if (timeElapsedMs > this.duration) {
            activeMs = this.duration;
            progress = 1;
        } else {
            activeMs = timeElapsedMs;
            if (this.duration > 0) {
                progress = activeMs / this.duration;
            } else {
                progress = 1;
            }
        }

        // Delegate mutation logic to specialized derived class
        return this.onEvaluate(objectState, activeMs, progress, currentTime, globalState);
    }

    /**
     * Abstract hook for derived modules strictly handling isolated state logic.
     * @param {Object} objectState Local target object state
     * @param {number} activeMs Bounded active lifetime ms of this module
     * @param {number} progress 0.0 to 1.0 bounded completion fraction
     * @param {number} currentTime Absolute continuous clock
     * @param {Object} globalState Reference to external nodes if required
     * @returns {boolean}
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        throw new Error('BaseModule: Derived classes must implement onEvaluate(objectState, activeMs, progress, currentTime, globalState)');
    }
}
