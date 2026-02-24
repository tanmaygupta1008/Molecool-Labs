import { BaseModule } from './BaseModule';

/**
 * GasSystem
 * Extends BaseModule to handle volume accumulation and displacement continuously.
 */
export class GasSystem extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the gas event
     */
    constructor(config) {
        super(config);

        // BaseModule grabs `config.target` or `config.destination`. 
        // We ensure we keep `this.target` correctly mapped for Gas rendering logic.
        this.source = config.source;
        this.gasType = config.gasType || "unknown";
        this.rate = config.rate || 0;
        this.displacement = !!config.displacement;

        // Track displacement state internally so we don't over-subtract
        this.lastDisplacedVolume = 0;
    }

    /**
     * Inherited from BaseModule. 
     * `activeMs` is directly provided bounded correctly to duration.
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        // Reset logic on scrub back
        if (activeMs === 0 && progress === 0) {
            this.lastDisplacedVolume = 0;
        }

        // Calculate generated volume. Rate is per second, active is ms.
        const currentGeneratedVolume = (activeMs / 1000) * this.rate;

        let stateChanged = false;

        // 1. Update accumulated gas state on target object
        if (!objectState.gasState) {
            objectState.gasState = { [this.gasType]: { volume: 0, fromSource: this.source, isActive: false } };
            stateChanged = true;
        } else if (!objectState.gasState[this.gasType]) {
            objectState.gasState[this.gasType] = { volume: 0, fromSource: this.source, isActive: false };
            stateChanged = true;
        }

        const gasData = objectState.gasState[this.gasType];

        // Check if actually active for rendering particles in UI
        const isActiveNow = progress >= 0 && progress < 1.0;

        if (gasData.volume !== currentGeneratedVolume || gasData.isActive !== isActiveNow) {
            gasData.volume = currentGeneratedVolume;
            gasData.isActive = isActiveNow;
            gasData.fromSource = this.source; // keep it stamped
            stateChanged = true;
        }

        // 2. Perform Water Displacement Simulation if requested
        if (this.displacement && typeof objectState.fillLevel !== 'undefined') {
            const VOLUME_TO_FILL_RATIO = 0.005;

            const currentDisplacement = currentGeneratedVolume * VOLUME_TO_FILL_RATIO;
            const deltaDisplacement = currentDisplacement - this.lastDisplacedVolume;

            if (deltaDisplacement !== 0) {
                // Deduct the newly displaced volume from the liquid level
                objectState.fillLevel = Math.max(0, objectState.fillLevel - deltaDisplacement);
                this.lastDisplacedVolume = currentDisplacement;
                stateChanged = true;
            }
        }

        return stateChanged;
    }
}
