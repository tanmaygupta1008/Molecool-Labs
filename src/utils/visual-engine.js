
import * as THREE from 'three';

/**
 * Calculates which effects are currently active based on their start step and duration.
 * @param {Object} timeline - The full timeline array.
 * @param {Number} currentStepIndex - Current active step index.
 * @param {Number} stepProgress - Progress of current step (0 to 1).
 * @returns {Array} List of active effects with dynamically calculated progress.
 */
export const getActiveEffects = (timeline, currentStepIndex, stepProgress) => {
    if (!timeline || !Array.isArray(timeline)) return [];

    const activeEffects = [];

    // Look back through timeline up to current step
    for (let i = 0; i <= currentStepIndex; i++) {
        const step = timeline[i];
        if (!step || !step.effects) continue;

        step.effects.forEach(effect => {
            if (effect.disabled) return;

            const duration = effect.durationSteps || 1;
            const endStepIndex = i + duration - 1; // Inclusive end step

            // Check if this effect should still be active
            if (currentStepIndex >= i && currentStepIndex <= endStepIndex) {
                // Calculate global progress for this effect across its entire duration
                // If it starts at step 0, duration 3 (steps 0, 1, 2)
                // At step 1 with 0.5 progress: current duration = 1.5, total = 3 -> overall = 0.5
                const stepsPassed = currentStepIndex - i;
                const totalProgress = (stepsPassed + stepProgress) / duration;

                // For GAS effects that don't interpolate, we just care if it's active.
                // But we clamp progress for safety on LERPs
                const clampedProgress = Math.min(1, Math.max(0, totalProgress));

                activeEffects.push({
                    ...effect,
                    _globalProgress: clampedProgress,
                    _originalStep: i
                });
            }
        });
    }

    // console.log("Active Effects:", activeEffects.length);
    return activeEffects;
};

/**
 * Calculates current visual state for all apparatus based on timeline rules and progress.
 * @param {Object} timeline - The full timeline object from visualRules.
 * @param {Number} stepIndex - Current active step index.
 * @param {Number} stepProgress - Progress of current step (0 to 1).
 * @param {Array} apparatusList - List of apparatus (for reference if needed).
 * @returns {Object} renderState - Map of { apparatusId: { prop: value } }
 */
export const calculateFrameState = (timeline, stepIndex, stepProgress, apparatusList) => {
    const state = {};

    // Initialize state for relevant apparatus
    apparatusList.forEach(app => {
        state[app.id] = {};
    });

    // Get all parallel effects that are active at this step
    const activeEffects = getActiveEffects(timeline, stepIndex, stepProgress);

    if (activeEffects.length === 0) return state;

    // Process parallel effects
    activeEffects.forEach(effect => {
        if (effect.disabled) return;

        // 1. Interplation Effects (Morph, Color, etc.)
        if (['MORPH', 'COLOR_LERP', 'NUMBER_LERP'].includes(effect.type)) {
            const target = state[effect.targetId];
            if (!target) return;

            // Calculate current value based on progress/easing
            // Simple Linear Interp for now
            const t = Math.min(1, Math.max(0, stepProgress));

            if (effect.type === 'NUMBER_LERP' || effect.type === 'MORPH') {
                const start = effect.startValue || 0;
                const end = effect.endValue || 1;
                target[effect.property] = start + (end - start) * t;
            }

            if (effect.type === 'COLOR_LERP') {
                const c1 = new THREE.Color(effect.startValue);
                const c2 = new THREE.Color(effect.endValue);
                // clone c1 to avoid mutation if cached?
                const res = c1.clone().lerp(c2, t);
                target[effect.property] = '#' + res.getHexString();
            }
        }

        // 2. Physics / Simulation Effects (Gas Displacement, Transfer)
        if (effect.type === 'GAS_DISPLACEMENT') {
            const t = Math.min(1, Math.max(0, stepProgress));

            if (state[effect.sourceId] && state[effect.targetId]) {
                if (effect.sourceLiquidStart !== undefined && effect.sourceLiquidEnd !== undefined) {
                    state[effect.sourceId].liquidLevelOverride = effect.sourceLiquidStart + (effect.sourceLiquidEnd - effect.sourceLiquidStart) * t;
                }

                if (effect.targetLiquidStart !== undefined && effect.targetLiquidEnd !== undefined) {
                    state[effect.targetId].liquidLevelOverride = effect.targetLiquidStart + (effect.targetLiquidEnd - effect.targetLiquidStart) * t;
                }

                if (effect.targetGasOpacityStart !== undefined && effect.targetGasOpacityEnd !== undefined) {
                    state[effect.targetId].gasOpacityMultiplier = effect.targetGasOpacityStart + (effect.targetGasOpacityEnd - effect.targetGasOpacityStart) * t;
                }

                if (effect.auxTargetId && state[effect.auxTargetId]) {
                    if (effect.auxLiquidStart !== undefined && effect.auxLiquidEnd !== undefined) {
                        state[effect.auxTargetId].liquidLevelOverride = effect.auxLiquidStart + (effect.auxLiquidEnd - effect.auxLiquidStart) * t;
                    }
                }
            }
        }
    });

    return state;
};
