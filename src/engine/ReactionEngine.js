import { TimelineEngine } from './TimelineEngine';
import { applyMutation } from './StateMutation';
import { compileTimelineEvents } from './ReactionEngineAdapter';
import { engineRegistry } from './EngineRegistry';
import { PropertyAnimation } from './modules/PropertyAnimation';
import { RelativePropertyAnimation } from './modules/RelativePropertyAnimation';
import { ContinuousRotation } from './modules/ContinuousRotation';

/**
 * ReactionEngine
 * Master orchestrator for a reaction visualization.
 * It holds the complete state of the scene objects and delegates timing to TimelineEngine.
 */
export class ReactionEngine {
    constructor(reactionData) {
        this.reactionData = reactionData;

        // Parse legacy JSON format
        this.state = this.initializeLegacyState(reactionData);

        // Compile nested timeline into flat events
        const timelineObj = reactionData.macroView?.visualRules?.timeline || reactionData.timeline;
        let { events, totalDuration } = compileTimelineEvents(timelineObj);

        // --- Initialize Engine Modules (Dynamic Registry) ---
        this.modulesList = [];

        // 1. Convert legacy adapter mutate events into reusable Module instances
        // (This remains hardcoded as it specifically bridges legacy JSON, not modern generic arrays)
        events.forEach(event => {
            if (event.type === 'mutateProperty') {
                const anim = new PropertyAnimation(event);
                this.modulesList.push({ id: event.id, instance: anim });
            } else if (event.type === 'mutateRelativeProperty') {
                const relAnim = new RelativePropertyAnimation(event);
                this.modulesList.push({ id: event.id, instance: relAnim });
            } else if (event.type === 'rotateProperty') {
                const rotAnim = new ContinuousRotation(event);
                this.modulesList.push({ id: event.id, instance: rotAnim });
            }
        });

        // 2. Dynamically instantiate any top-level module arrays defined in JSON
        // e.g., parses reactionData.propertyChanges and reactionData.gasEvents seamlessly!
        const ruleSources = [reactionData, reactionData.macroView?.visualRules || {}];

        ruleSources.forEach(source => {
            Object.keys(source).forEach(jsonKey => {
                const ModuleClass = engineRegistry.resolveModuleClass(jsonKey);

                if (ModuleClass && Array.isArray(source[jsonKey])) {
                    source[jsonKey].forEach((config, idx) => {
                        const instance = new ModuleClass(config);
                        const eventId = `${jsonKey}-${idx}`;

                        this.modulesList.push({ id: eventId, instance });

                        // Push to timeline array so TimelineEngine emits it on active overlap
                        events.push({
                            id: eventId,
                            type: 'engineModule',
                            target: instance.target,
                            startTime: instance.startTime,
                            duration: instance.duration
                        });

                        // Stretch engine duration if the module extends past timeline limits
                        const end = instance.startTime + instance.duration;
                        if (end > totalDuration) totalDuration = end;
                    });
                }
            });
        });

        this.timeline = new TimelineEngine(events);
        this.totalDuration = totalDuration;

        // Listen for timeline ticks to apply mutations
        this.timeline.onTick = (currentTime, activeEvents, delta) => {
            this.updateState(currentTime, activeEvents, delta);
        };
        this.timeline.onTick = (currentTime, activeEvents, delta) => {
            this.updateState(currentTime, activeEvents, delta);
        };

        // Callbacks for UI updates (React state bridging)
        this.onStateChange = null;
    }

    /**
     * Clones initial state deeply and maps apparatus array from legacy JSON
     */
    initializeLegacyState(reactionData) {
        const state = {};

        // Setup initial object bounds from apparatus list
        if (reactionData.apparatus) {
            reactionData.apparatus.forEach(app => {
                state[app.id] = { ...app };
            });
        }

        // Override with visualRules.initialState if present
        const initRules = reactionData.macroView?.visualRules?.initialState;
        if (initRules) {
            // E.g. initRules.burner.intensity -> state['bunsen1'].intensity
            // To properly map, we need to know the IDs, mapping is loose right now, assuming ID matches rules or applying broadly.
        }

        return state;
    }

    /**
     * Resets the entire reaction to the beginning
     */
    reset() {
        this.state = this.initializeLegacyState(this.reactionData);
        this.timeline.reset();
        this.notifyStateChange();
    }

    /**
     * Plays the reaction
     */
    play() {
        this.timeline.play();
    }

    /**
     * Pauses the reaction
     */
    pause() {
        this.timeline.pause();
    }

    /**
     * Seeks to a specific progress amount 0.0 - 1.0 (used by UI sliders)
     */
    seekProgress(progressFraction) {
        const timeMs = progressFraction * this.totalDuration;
        this.timeline.seek(timeMs);
    }

    /**
     * Updates state based on the currently active timeline events
     * @param {number} currentTime Elapsed time in ms
     * @param {Array} activeEvents Events that overlap with currentTime
     * @param {number} delta Time since last tick in ms
     */
    updateState(currentTime, activeEvents, delta) {
        let stateChanged = false;

        activeEvents.forEach((event) => {
            const objectState = this.state[event.target];
            if (!objectState) return;

            // Polymorphic Engine Module Execution (Replaces tight coupling)
            // The timeline provides us with the active events based on the track clock.
            // We just look up our instantiated EngineModule and evaluate it automatically!
            const moduleWrapper = this.modulesList.find(m => m.id === event.id);
            if (moduleWrapper) {
                const changed = moduleWrapper.instance.evaluate(currentTime, this.state);
                if (changed) stateChanged = true;
            }
        });

        if (stateChanged) {
            this.notifyStateChange();
        }
    }

    /**
     * Should be called from the requestAnimationFrame loop or useFrame
     * @param {number} delta time passed since last tick in seconds or milliseconds
     * If R3F useFrame gives seconds, multiply by 1000 here or expect ms.
     */
    tick(deltaMs) {
        this.timeline.tick(deltaMs);
    }

    notifyStateChange() {
        if (this.onStateChange) {
            // Pass a new object reference to trigger React renders
            this.onStateChange({ ...this.state });
        }
    }

    getState() {
        return this.state;
    }
}
