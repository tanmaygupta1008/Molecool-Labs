/**
 * Adapts the legacy nested visualRules.timeline format from the JSON
 * into the flat event array expected by TimelineEngine.
 */
export function compileTimelineEvents(timelineObj) {
    const events = [];
    if (!timelineObj) return { events, totalDuration: 0 };

    let accumulatedTime = 0;
    const steps = Object.keys(timelineObj).sort((a, b) => parseInt(a) - parseInt(b));

    steps.forEach((stepKey) => {
        const step = timelineObj[stepKey];
        if (step.disabled) return;

        const delay = parseFloat(step.delay || 0) * 1000;
        const duration = parseFloat(step.duration || 0) * 1000;
        const stepStartTime = accumulatedTime + delay;

        // 1. Compile liquid color/opacity animations
        if (step.liquid && step.liquid.enabled) {
            if (step.liquid.initialColor && step.liquid.finalColor) {
                events.push({
                    id: `step-${stepKey}-liquid-color`,
                    type: 'mutateProperty',
                    target: 'beaker', // Currently assumes beaker is the main container for liquid
                    property: 'liquidColor',
                    from: step.liquid.initialColor,
                    to: step.liquid.finalColor,
                    startTime: stepStartTime,
                    duration: duration,
                    easing: 'linear'
                });
            }
            if (step.liquid.transparency !== undefined) {
                events.push({
                    id: `step-${stepKey}-liquid-opacity`,
                    type: 'mutateProperty',
                    target: 'beaker',
                    property: 'liquidOpacity',
                    from: 1,
                    to: step.liquid.transparency,
                    startTime: stepStartTime,
                    duration: duration,
                    easing: 'linear'
                });
            }
        }

        // 2. Compile heat
        if (step.heat && step.heat.enabled && step.heat.source) {
            events.push({
                id: `step-${stepKey}-heat-intensity`,
                type: 'mutateProperty',
                target: step.heat.source,
                property: 'intensity',
                from: 0,
                to: step.heat.intensity || 1.0,
                startTime: stepStartTime,
                duration: Math.min(500, duration), // Ramp up heat quickly
                easing: 'easeInQuad'
            });
            events.push({
                id: `step-${stepKey}-heat-color`,
                type: 'mutateProperty',
                target: step.heat.source,
                property: 'flameColor',
                from: step.heat.color,
                to: step.heat.color,
                startTime: stepStartTime,
                duration: 0,
                easing: 'linear'
            });
        }

        // 3. Compile transformations (snaps)
        if (step.transformations) {
            step.transformations.forEach((trans, i) => {
                if (trans.visible !== undefined) {
                    events.push({
                        id: `step-${stepKey}-trans-${i}-visible`,
                        type: 'mutateProperty',
                        target: trans.target,
                        property: 'visible',
                        from: trans.visible,
                        to: trans.visible,
                        startTime: stepStartTime,
                        duration: 0
                    });
                }
                if (trans.scale) {
                    events.push({
                        id: `step-${stepKey}-trans-${i}-scale`,
                        type: 'mutateProperty',
                        target: trans.target,
                        property: 'scale',
                        from: trans.scale,
                        to: trans.scale,
                        startTime: stepStartTime,
                        duration: 0
                    });
                }
                if (trans.color) {
                    events.push({
                        id: `step-${stepKey}-trans-${i}-color`,
                        type: 'mutateProperty',
                        target: trans.target,
                        property: 'color',
                        from: trans.color,
                        to: trans.color,
                        startTime: stepStartTime,
                        duration: 0
                    });
                }
            });
        }

        // 4. Compile explicit animations
        if (step.animations) {
            step.animations.forEach((anim, i) => {
                if (anim.type === 'move' && anim.position) {
                    events.push({
                        id: `step-${stepKey}-anim-${i}-move`,
                        type: 'mutateRelativeProperty', // Special relative mutator
                        target: anim.target,
                        property: 'position',
                        fromOffset: [0, 0, 0],
                        to: anim.position,
                        startTime: stepStartTime,
                        duration: duration,
                        easing: 'easeInOutQuad'
                    });
                }
                if (anim.type === 'scale' && anim.scale) {
                    events.push({
                        id: `step-${stepKey}-anim-${i}-scale`,
                        type: 'mutateRelativeProperty',
                        target: anim.target,
                        property: 'scale',
                        fromOffset: [1, 1, 1],
                        to: anim.scale,
                        startTime: stepStartTime,
                        duration: duration,
                        easing: 'easeInOutQuad'
                    });
                }
                if (anim.type === 'rotate') {
                    events.push({
                        id: `step-${stepKey}-anim-${i}-rotate`,
                        type: 'rotateProperty',
                        target: anim.target,
                        property: 'rotation',
                        speed: anim.speed || 1,
                        startTime: stepStartTime,
                        duration: duration
                    });
                }
            });
        }

        accumulatedTime += (delay + duration);
    });

    return { events, totalDuration: accumulatedTime };
}
