import { PropertyAnimation } from './modules/PropertyAnimation';
import { GasSystem } from './modules/GasSystem';
import { LiquidSystem } from './modules/LiquidSystem';
import { SolidSystem } from './modules/SolidSystem';
import { ForceSystem } from './modules/ForceSystem';

/**
 * EngineRegistry
 * A central registry to dynamically instantiate concrete Engine Modules
 * based on the JSON configuration keys without tightly coupling ReactionEngine.
 */
class EngineRegistry {
    constructor() {
        this.modules = {
            propertyChanges: PropertyAnimation,
            gasEvents: GasSystem,
            liquidEvents: LiquidSystem,
            solidEvents: SolidSystem,
            forceEvents: ForceSystem
            // Add future plugins here dynamically (e.g., soundEvents: SoundSystem)
        };
    }

    /**
     * Resolves a JSON config array key to a Module class.
     * @param {string} jsonKey The key found in the reaction JSON (e.g., 'gasEvents')
     * @returns {Class} The BaseModule derived class constructor
     */
    resolveModuleClass(jsonKey) {
        return this.modules[jsonKey];
    }
}

export const engineRegistry = new EngineRegistry();
