import { BaseModule } from './BaseModule';

/**
 * LiquidSystem
 * Extends BaseModule to handle liquid-specific effects over time, 
 * such as precipitate formation, turbidity, and color transitions.
 */
export class LiquidSystem extends BaseModule {
    /**
     * @param {Object} config JSON configuration for the liquid event
     */
    constructor(config) {
        super(config);

        this.type = config.type || "precipitateFormation";
        this.color = config.color || "#ffffff";
        this.density = config.density || 1.0;
        this.settleSpeed = config.settleSpeed || 0.5;
    }

    /**
     * Inherited from BaseModule. 
     */
    onEvaluate(objectState, activeMs, progress, currentTime, globalState) {
        let stateChanged = false;

        // Ensure liquidState dictionary exists on the target object
        if (!objectState.liquidState) {
            objectState.liquidState = {};
            stateChanged = true;
        }

        const liquidData = objectState.liquidState;

        if (this.type === "precipitateFormation") {
            const currentAmount = progress * this.density;

            // Check if active for rendering
            const isActiveNow = progress > 0 && progress <= 1.0;

            if (liquidData.precipitateAmount !== currentAmount ||
                liquidData.precipitateActive !== isActiveNow ||
                liquidData.precipitateColor !== this.color) {

                liquidData.precipitateAmount = currentAmount;
                liquidData.precipitateActive = isActiveNow;
                liquidData.precipitateColor = this.color;
                liquidData.precipitateSettleSpeed = this.settleSpeed;

                // Turbidity typically increases as precipitate forms
                // Simple assumption: max turbidity matches max density
                liquidData.turbidity = currentAmount;

                stateChanged = true;
            }
        }

        return stateChanged;
    }
}
