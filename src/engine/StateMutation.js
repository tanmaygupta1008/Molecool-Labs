import * as THREE from 'three';

/**
 * Simple easing functions
 */
const EASING = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// Aliases for user-friendly json configurations
EASING.easeIn = EASING.easeInQuad;
EASING.easeOut = EASING.easeOutQuad;
EASING.easeInOut = EASING.easeInOutQuad;

/**
 * StateMutation
 * Pure functions to interpolate different data types based on progress
 */

// Helper to determine data type
function detectType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && value.startsWith('#')) return 'color'; // HEX Color
    if (Array.isArray(value) && value.length === 3) return 'vector3'; // [x, y, z]
    return 'unknown';
}

function interpolateNumber(start, end, progress) {
    return start + (end - start) * progress;
}

// Re-use a single Color instance to avoid garbage collection heavy loops
const tempColorStart = new THREE.Color();
const tempColorEnd = new THREE.Color();
const tempColorResult = new THREE.Color();

function interpolateColor(start, end, progress) {
    tempColorStart.set(start);
    tempColorEnd.set(end);
    tempColorResult.lerpColors(tempColorStart, tempColorEnd, progress);
    return '#' + tempColorResult.getHexString();
}

function interpolateVector3(startArr, endArr, progress) {
    return [
        interpolateNumber(startArr[0], endArr[0], progress),
        interpolateNumber(startArr[1], endArr[1], progress),
        interpolateNumber(startArr[2], endArr[2], progress)
    ];
}

/**
 * Applies mutation between two values depending on their type
 * @param {*} start Target start value
 * @param {*} end Target end value
 * @param {number} progress 0.0 to 1.0 clamped elapsed progress
 * @param {string} easingType linear, easeInQuad, etc.
 * @returns mixed Interpolated value
 */
export function applyMutation(start, end, progress, easingType = 'linear') {
    const easeFn = EASING[easingType] || EASING.linear;
    const easedProgress = easeFn(progress);

    const type = detectType(start);

    switch (type) {
        case 'number':
            return interpolateNumber(start, end, easedProgress);
        case 'color':
            return interpolateColor(start, end, easedProgress);
        case 'vector3':
            return interpolateVector3(start, end, easedProgress);
        default:
            // If we don't know how to interpolate, we snap at 50%
            return easedProgress < 0.5 ? start : end;
    }
}
