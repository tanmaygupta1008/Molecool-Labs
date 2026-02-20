/**
 * Detects which apparatus is strictly above the burner to determine flame shape and height.
 * @param {Object} burner The burner item (with position).
 * @param {Array} allItems List of all apparatus items.
 * @returns {Object} { type: 'beaker' | 'conical' | 'round' | 'standard', distY: number }
 */
export const detectApparatusTypeAbove = (burner, allItems) => {
    if (!burner || !allItems) return { type: 'standard', distY: 3.9 };

    const burnerPos = burner.position || [0, 0, 0];
    const DETECTION_RADIUS = 1.5; // Increased significantly to catch angled tubes
    const MIN_HEIGHT = 0.5;
    const MAX_HEIGHT = 10.0; // Increased to 10 for very high setups

    let closestItem = null;
    let closestDist = Infinity;

    const FLAME_SHAPING_TYPES = {
        'Beaker': 'beaker',
        'ConicalFlask': 'conical',
        'RoundBottomFlask': 'round',
        'TestTube': 'round',
        'BoilingTube': 'round',
        'Crucible': 'round',
        'EvaporatingDish': 'round'
    };

    // Approximate half-heights to find bottom of object
    // (Assuming pivots are roughly center or bottom - tuning for visuals)
    const BOTTOM_OFFSETS = {
        'Beaker': 0.6,
        'ConicalFlask': 0.8,
        'RoundBottomFlask': 0.7,
        'TestTube': 0.8,
        'BoilingTube': 0.8,
        'Crucible': 0.3,
        'EvaporatingDish': 0.2
    };

    allItems.forEach(item => {
        if (item.id === burner.id) return;
        if (!FLAME_SHAPING_TYPES[item.model]) return;

        const itemPos = item.position || [0, 0, 0];

        // Horizontal Distance (XZ)
        const distXZ = Math.sqrt(Math.pow(itemPos[0] - burnerPos[0], 2) + Math.pow(itemPos[2] - burnerPos[2], 2));

        // Vertical Distance (Y) - relative to burner base
        const distY = itemPos[1] - burnerPos[1];

        if (distXZ < DETECTION_RADIUS && distY > MIN_HEIGHT && distY < MAX_HEIGHT) {
            if (distY < closestDist) {
                closestDist = distY;
                closestItem = item;
            }
        }
    });

    if (closestItem) {
        const type = FLAME_SHAPING_TYPES[closestItem.model];
        // Calculate relative height from burner base to object bottom
        // distY is center-to-center (approx). Subtract offset to get bottom.
        let offset = BOTTOM_OFFSETS[closestItem.model] || 0.5;

        // Compensation for rotation (e.g., angled test tube)
        // If rotated, the "bottom" relative to center changes. 
        // We reduce offset to let flame penetrate slightly or hit the side.
        const rot = closestItem.rotation || [0, 0, 0];
        if (Math.abs(rot[0]) > 0.5 || Math.abs(rot[2]) > 0.5) {
            offset *= 0.5;
        }

        let estimatedBottom = closestDist - offset;

        // Clamp minimum flame height to be just above burner tip (3.35)
        // If object is LOWER than tip (impossible physically if solid, but graphically possible), clamp it.
        if (estimatedBottom < 3.5) estimatedBottom = 3.5;

        return { type, distY: estimatedBottom };
    }

    return { type: 'standard', distY: 3.9 }; // Default standard flame height
};
