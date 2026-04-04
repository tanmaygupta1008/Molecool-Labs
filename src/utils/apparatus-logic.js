/**
 * Detects which apparatus is strictly above the burner to determine flame shape and height.
 * @param {Object} burner The burner item (with position).
 * @param {Array} allItems List of all apparatus items.
 * @param {number} gasFlow 0-1 gas flow (controls flame height for proximity calc).
 * @returns {Object} { type, distY, baseRadius, isHeating, proximity }
 */
export const detectApparatusTypeAbove = (burner, allItems, gasFlow = 0.6) => {
    if (!burner || !allItems) return { isHeating: false, type: 'standard', distY: 3.9, baseRadius: 0.8, proximity: 0 };

    // ── Flame geometry constants (must match BunsenBurner.jsx) ──────────────
    const BURNER_TIP = 3.35;          // local Y of flame start
    const gfH = (0.4 + 0.6 * gasFlow); // height scale factor
    const freeH = 2.1 * gfH;           // free-burning flame height
    const flameTipY = BURNER_TIP + freeH; // free-burning flame tip in burner-local Y
    // Interaction begins this many units above the flame tip
    const INTERACT_ZONE = freeH * 1.5;
    // ──────────────────────────────────────────────────────────────────────

    // Helper: recursively compute world position (translation only)
    const getWorldPos = (item) => {
        let pos = [...(item.position || [0, 0, 0])];
        let curr = item;
        while (curr.parentId) {
            const parent = allItems.find(i => i.id === curr.parentId);
            if (!parent) break;
            const pPos = parent.position || [0, 0, 0];
            pos[0] += pPos[0];
            pos[1] += pPos[1];
            pos[2] += pPos[2];
            curr = parent;
        }
        return pos;
    };

    const burnerWPos = getWorldPos(burner);
    const DETECTION_RADIUSSQ = 1.0 * 1.0; 
    const MIN_HEIGHT = 0.5;
    const MAX_HEIGHT = 10.0;

    let closestItem = null;
    let closestDist = Infinity;

    const FLAME_SHAPING_TYPES = {
        'Beaker': { type: 'beaker', offset: 0.6, radius: 0.8 },
        'ConicalFlask': { type: 'conical', offset: 0.8, radius: 0.9 },
        'VacuumFlask': { type: 'conical', offset: 0.8, radius: 0.9 },
        'RoundBottomFlask': { type: 'round', offset: 0.7, radius: 0.8 },
        'TwoNeckFlask': { type: 'round', offset: 0.7, radius: 0.8 },
        'ThreeNeckFlask': { type: 'round', offset: 0.7, radius: 0.8 },
        'DistillationFlask': { type: 'round', offset: 0.7, radius: 0.8 },
        'SeparatoryFunnel': { type: 'round', offset: 0.4, radius: 0.5 },
        'VolumetricFlask': { type: 'round', offset: 0.6, radius: 0.9 },
        'TestTube': { type: 'round', offset: 0.8, radius: 0.2 },
        'BoilingTube': { type: 'round', offset: 0.8, radius: 0.3 },
        'Crucible': { type: 'round', offset: 0.3, radius: 0.4 },
        'EvaporatingDish': { type: 'round', offset: 0.2, radius: 0.5 }
    };

    allItems.forEach(item => {
        if (item.id === burner.id) return;
        const info = FLAME_SHAPING_TYPES[item.model];
        if (!info) return;

        const itemWPos = getWorldPos(item);
        
        // Horizontal distance squared
        const dx = itemWPos[0] - burnerWPos[0];
        const dz = itemWPos[2] - burnerWPos[2];
        const distSq = dx * dx + dz * dz;
        
        // Vertical distance from burner base to apparatus center
        const distY = itemWPos[1] - burnerWPos[1];

        if (distSq < DETECTION_RADIUSSQ && distY > MIN_HEIGHT && distY < MAX_HEIGHT) {
            if (distY < closestDist) {
                closestDist = distY;
                closestItem = item;
            }
        }
    });

    if (closestItem) {
        const info = FLAME_SHAPING_TYPES[closestItem.model];
        let offset = info.offset;

        // Compensate for rotation (approximate)
        const rot = closestItem.rotation || [0, 0, 0];
        if (Math.abs(rot[0]) > 0.5 || Math.abs(rot[2]) > 0.5) offset *= 0.5;

        let estimatedBottom = closestDist - offset;
        // The burner tip in local space is at ~3.35 from base
        if (estimatedBottom < 3.35) estimatedBottom = 3.35;

        // ── Proximity: how deep into the flame is the apparatus? ──────────
        // 0 = apparatus just entered interaction zone (no deformation yet)
        // 1 = apparatus bottom is at/below flame tip (fully deformed)
        // Uses smooth-start curve for a natural feel
        const interactStart = flameTipY + INTERACT_ZONE;
        const rawProximity = (interactStart - estimatedBottom) / (interactStart - BURNER_TIP);
        const proximity = Math.max(0, Math.min(1, rawProximity));
        // ─────────────────────────────────────────────────────────────────

        return { 
            isHeating: true, 
            type: info.type, 
            distY: estimatedBottom,
            baseRadius: info.radius,
            proximity
        };
    }

    return { isHeating: false, type: 'standard', distY: 5.5, baseRadius: 0.8, proximity: 0 };
};
