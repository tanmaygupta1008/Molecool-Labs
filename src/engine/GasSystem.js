/**
 * GasSystem
 * Handles continuous gas generation, displacement of liquids, 
 * and tracking accumulated volume across the timeline.
 */
export class GasSystem {
    /**
     * @param {Object} config JSON configuration for the gas event
     */
    constructor(config) {
        this.source = config.source;
        this.destination = config.destination;
        this.gasType = config.gasType || "unknown";
        this.rate = config.rate || 0; // Volume units per second
        this.duration = config.duration || 0; // ms
        this.startTime = config.startTime || 0; // ms
        this.displacement = !!config.displacement;
        
        // Track displacement state internally so we don't over-subtract
        this.lastDisplacedVolume = 0;
    }

    /**
     * Evaluates the gas generation given the current absolute track time
     * and mutates the global engine state directly.
     * @param {number} currentTime Elapsed ms in the timeline 
     * @param {Object} globalState The dictionary of all object states in the engine
     * @returns {boolean} true if a change was applied to the state object
     */
    evaluate(currentTime, globalState) {
        const destState = globalState[this.destination];
        if (!destState) return false;

        // Calculate active duration clamped to event bounds
        const timeElapsedMs = currentTime - this.startTime;
        let activeMs = 0;
        
        if (timeElapsedMs < 0) {
            activeMs = 0;
            this.lastDisplacedVolume = 0; // Reset logic on scrub back
        } else if (timeElapsedMs > this.duration) {
            activeMs = this.duration;
        } else {
            activeMs = timeElapsedMs;
        }

        // Calculate generated volume. Rate is per second, active is ms.
        const currentGeneratedVolume = (activeMs / 1000) * this.rate;

        let stateChanged = false;

        // 1. Update accumulated gas state on destination object
        if (!destState.gasState) {
            destState.gasState = { [this.gasType]: { volume: 0, fromSource: this.source, isActive: false } };
            stateChanged = true;
        } else if (!destState.gasState[this.gasType]) {
            destState.gasState[this.gasType] = { volume: 0, fromSource: this.source, isActive: false };
            stateChanged = true;
        }

        const gasData = destState.gasState[this.gasType];
        
        // Check if actually active for rendering particles in UI
        const isActiveNow = timeElapsedMs >= 0 && timeElapsedMs <= this.duration;

        if (gasData.volume !== currentGeneratedVolume || gasData.isActive !== isActiveNow) {
            gasData.volume = currentGeneratedVolume;
            gasData.isActive = isActiveNow;
            gasData.fromSource = this.source; // keep it stamped
            stateChanged = true;
        }

        // 2. Perform Water Displacement Simulation if requested
        if (this.displacement && typeof destState.fillLevel !== 'undefined') {
            // Volume to displacement ratio (Assume 1:1 for simplistic 3D model scaling or use a conversion factor)
            // The fillLevel typically ranges 0.0 to 1.0. 
            // We need a calibration factor: e.g. 100 volume = 1.0 fill level
            const VOLUME_TO_FILL_RATIO = 0.005; 
            
            const currentDisplacement = currentGeneratedVolume * VOLUME_TO_FILL_RATIO;
            const deltaDisplacement = currentDisplacement - this.lastDisplacedVolume;

            if (deltaDisplacement !== 0) {
                // Deduct the newly displaced volume from the liquid level
                destState.fillLevel = Math.max(0, destState.fillLevel - deltaDisplacement);
                this.lastDisplacedVolume = currentDisplacement;
                stateChanged = true;
            }
        }

        return stateChanged;
    }
}
