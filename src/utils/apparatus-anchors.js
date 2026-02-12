import * as THREE from 'three';

/**
 * Calculates anchor points (connection points) for a given apparatus item.
 * @param {Object} item The apparatus item data (id, model, position, rotation, scale, custom props like holes).
 * @returns {Array} Array of anchor objects: { id: string, position: [x,y,z], normal: [x,y,z] }
 */
export const getApparatusAnchors = (item) => {
    const anchors = [];
    const pos = new THREE.Vector3(...(item.position || [0, 0, 0]));
    const rot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
    const scale = new THREE.Vector3(...(item.scale || [1, 1, 1]));

    const quaternion = new THREE.Quaternion().setFromEuler(rot);

    // Helper to transform local point to world
    const toWorld = (localPos) => {
        return localPos.clone().multiply(scale).applyQuaternion(quaternion).add(pos);
    };

    // Helper to transform local normal to world
    const toWorldNormal = (localNormal) => {
        return localNormal.clone().applyQuaternion(quaternion).normalize();
    };

    // --- 1. Standard Anchors (with Overrides) ---
    const getStandardAnchors = () => {
        const standard = [];
        switch (item.model) {
            case 'ConicalFlask':
                standard.push({ id: 'mouth', localPos: [0, 2.5, 0], localNormal: [0, 1, 0] });
                break;
            case 'Beaker':
                standard.push({ id: 'mouth', localPos: [0, 1.5, 0], localNormal: [0, 1, 0] });
                break;
            case 'TestTube':
                standard.push({ id: 'mouth', localPos: [0, 1.7, 0], localNormal: [0, 1, 0] });
                break;
            case 'BoilingTube':
                standard.push({ id: 'mouth', localPos: [0, 0.9, 0], localNormal: [0, 1, 0] });
                break;
            case 'GasJar':
                standard.push({ id: 'mouth', localPos: [0, 2.5, 0], localNormal: [0, 1, 0] });
                break;
            case 'RubberCork':
                const holes = item.holes || 1;
                const topY = 0.4;
                const offset = 0.1;
                if (holes === 1) {
                    standard.push({ id: 'hole-0', localPos: [0, topY, 0], localNormal: [0, 1, 0] });
                } else if (holes === 2) {
                    standard.push({ id: 'hole-0', localPos: [-offset, topY, 0], localNormal: [0, 1, 0] });
                    standard.push({ id: 'hole-1', localPos: [offset, topY, 0], localNormal: [0, 1, 0] });
                } else if (holes === 3) {
                    for (let i = 0; i < 3; i++) {
                        const angle = (i * 2 * Math.PI) / 3;
                        standard.push({
                            id: `hole-${i}`,
                            localPos: [Math.cos(angle) * offset, topY, Math.sin(angle) * offset],
                            localNormal: [0, 1, 0]
                        });
                    }
                }
                break;
            case 'DeliveryTube':
                if (item.points && item.points.length >= 2) {
                    // Start
                    const start = new THREE.Vector3(...item.points[0]);
                    const p1 = new THREE.Vector3(...item.points[1]);
                    const startNormal = new THREE.Vector3().subVectors(start, p1).normalize();

                    // End
                    const end = new THREE.Vector3(...item.points[item.points.length - 1]);
                    const pn_1 = new THREE.Vector3(...item.points[item.points.length - 2]);
                    const endNormal = new THREE.Vector3().subVectors(end, pn_1).normalize();

                    // DeliveryTube points are ALREADY in local space of the group if we built them that way,
                    // BUT currently TubeBuilder creates them in World Space and we might settle on that.
                    // For now, let's assume points are Local to the object if possible, OR we handle them specially.
                    // Actually, the current editor saves points in World Space relative to the scene if the group is at 0,0,0?
                    // No, ApparatusEditorItem renders group at item.position. Tube points are inside that group.
                    // If TubeBuilder calculates points based on World Anchors, and then we put them into `points` prop...
                    // We need to ensure consistency. 
                    // Let's assume for now `item.points` are in Local Space of the tube.

                    standard.push({ id: 'start', localPos: start.toArray(), localNormal: startNormal.toArray() });
                    standard.push({ id: 'end', localPos: end.toArray(), localNormal: endNormal.toArray() });
                }
                break;
        }
        return standard;
    };

    const standardAnchors = getStandardAnchors();

    // Process Standard Anchors
    standardAnchors.forEach(def => {
        // Check for override
        const override = item.anchorOverrides?.[def.id];
        const localPos = override ? new THREE.Vector3(...override) : new THREE.Vector3(...def.localPos);
        const localNormal = new THREE.Vector3(...def.localNormal);

        anchors.push({
            id: `${item.id}-${def.id}`, // Global unique ID
            localId: def.id,            // ID within the item (for overrides)
            position: toWorld(localPos).toArray(),
            normal: toWorldNormal(localNormal).toArray(),
            type: 'standard'
        });
    });

    // --- 2. Custom Anchors ---
    if (item.customAnchors) {
        item.customAnchors.forEach(custom => {
            const localPos = new THREE.Vector3(...custom.position);
            const localNormal = new THREE.Vector3(0, 1, 0); // Default normal for custom anchors? Or allow rotation?

            anchors.push({
                id: `${item.id}-${custom.id}`,
                localId: custom.id,
                position: toWorld(localPos).toArray(),
                normal: toWorldNormal(localNormal).toArray(),
                type: 'custom'
            });
        });
    }

    return anchors;
};
