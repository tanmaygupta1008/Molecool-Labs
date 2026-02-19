'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Environment, ContactShadows, Html, useGLTF, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

// Import apparatus map - we'll need to duplicate or export this from MacroView/Apparatus index
// For now, let's assume we can import from '../../components/apparatus' directly like MacroView did
import * as Apparatus from '../../components/apparatus'; // Adjust import path if needed
import Clamp from '../../components/apparatus/Clamp';
import PowerSupply from '../../components/apparatus/PowerSupply';
import Wire from '../../components/apparatus/Wire';
import RubberCork from '../../components/apparatus/RubberCork';
import { getApparatusAnchors } from '../../utils/apparatus-anchors';

// import reactionsData from '../../data/reactions.json'; // REMOVED to avoid HMR issues

// --- Re-use shared Apparatus Map ---
const APPARATUS_MAP = {
    'BunsenBurner': Apparatus.BunsenBurner,
    'TripodStand': Apparatus.TripodStand,
    'WireGauze': Apparatus.WireGauze,
    'Crucible': Apparatus.Crucible,
    'Tongs': Apparatus.Tongs,
    'HeatproofMat': Apparatus.HeatproofMat,
    'Beaker': Apparatus.Beaker,
    'ConicalFlask': Apparatus.ConicalFlask,
    'TestTube': Apparatus.TestTube,
    'BoilingTube': Apparatus.BoilingTube || Apparatus.TestTube,
    'MeasuringCylinder': Apparatus.MeasuringCylinder,
    'Dropper': Apparatus.Dropper,
    'StirringRod': Apparatus.StirringRod,
    'GlassRod': Apparatus.StirringRod,
    'WaterTrough': Apparatus.WaterTrough,
    'GasJar': Apparatus.GasJar,
    'DeliveryTube': Apparatus.DeliveryTube,
    'RubberCork': RubberCork,
    'Cork': RubberCork,
    'Burette': Apparatus.Burette,
    'RetortStand': Apparatus.RetortStand,
    'Clamp': Clamp,
    'ElectrolysisSetup': Apparatus.ElectrolysisSetup,
    'PowerSupply': PowerSupply,
    'MagnesiumRibbon': Apparatus.MagnesiumRibbon,
    'ZincGranules': Apparatus.ZincGranules,
    'Forceps': Apparatus.Forceps,
    'SafetyShield': Apparatus.SafetyShield,
    'DropperBottle': Apparatus.DropperBottle,
    'IronNail': Apparatus.IronNail,
    'GasTap': Apparatus.GasTap,
    'LitmusPaper': Apparatus.LitmusPaper,
    'Wire': Wire,
};

// --- COMPONENTS ---

// Keyboard Navigation Component
const CameraController = () => {
    const { camera, gl } = useThree();
    const [movement, setMovement] = useState({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: true })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: true })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: true })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: true })); break;
                case 'KeyQ': setMovement(m => ({ ...m, up: true })); break; // Elevation Up
                case 'KeyE': setMovement(m => ({ ...m, down: true })); break; // Elevation Down
            }
        };
        const handleKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': setMovement(m => ({ ...m, forward: false })); break;
                case 'KeyS': case 'ArrowDown': setMovement(m => ({ ...m, backward: false })); break;
                case 'KeyA': case 'ArrowLeft': setMovement(m => ({ ...m, left: false })); break;
                case 'KeyD': case 'ArrowRight': setMovement(m => ({ ...m, right: false })); break;
                case 'KeyQ': setMovement(m => ({ ...m, up: false })); break;
                case 'KeyE': setMovement(m => ({ ...m, down: false })); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        const speed = 10 * delta; // units per second
        const moveVec = new THREE.Vector3();

        // Standard FPS-like movement direction relative to camera view
        if (movement.forward || movement.backward) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0; // Lock to XZ plane if desired? Or free fly? Let's lock to XZ for "walking"
            forward.normalize();
            if (movement.forward) moveVec.add(forward);
            if (movement.backward) moveVec.sub(forward);
        }

        if (movement.left || movement.right) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const right = new THREE.Vector3();
            right.crossVectors(forward, camera.up).normalize(); // Assuming Y up
            if (movement.right) moveVec.add(right);
            if (movement.left) moveVec.sub(right);
        }

        // Vertical movement
        if (movement.up) moveVec.y += 1;
        if (movement.down) moveVec.y -= 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(speed);

            // Move Camera
            camera.position.add(moveVec);

            // Move OrbitControls Target to keep valid orbit around the new position
            // We need to access the controls instance.
            // Drei's OrbitControls usually attaches to the default controls in the store?
            if (state.controls) {
                state.controls.target.add(moveVec);
                state.controls.update();
            }
        }
    });

    return null;
};


const TubePointEditor = ({ points, position, rotation, scale, onUpdatePoints, selectedIndices = [], onSelectIndex }) => {
    // Generate stable IDs for points to avoid re-mounting controls
    const pointIds = useMemo(() => {
        return points.map((_, i) => `point-${i}-${Math.random().toString(36).substr(2, 9)}`);
    }, [points.length]);

    const [isDragging, setIsDragging] = useState(false);
    const dummyRefs = useRef([]);
    const tubeRef = useRef();

    // Ensure dummyRefs is correct size
    dummyRefs.current = points.map((_, i) => dummyRefs.current[i] || React.createRef());

    // Imperative update of the tube geometry
    useFrame(() => {
        if (isDragging && tubeRef.current && dummyRefs.current.every(r => r.current)) {
            const currentPositions = dummyRefs.current.map(r => r.current.position);
            const path = new THREE.CatmullRomCurve3(currentPositions.map(p => p.clone()));
            // Update geometry
            const newGeo = new THREE.TubeGeometry(path, 64, 0.03, 8, false);
            tubeRef.current.geometry.dispose();
            tubeRef.current.geometry = newGeo;
        }
    });

    const handleDragStart = () => setIsDragging(true);

    const handleDragChange = () => { };

    const handleDragEnd = (index) => {
        setIsDragging(false);
        const dummy = dummyRefs.current[index].current;
        if (dummy) {
            const newPos = [dummy.position.x, dummy.position.y, dummy.position.z];
            const newPoints = [...points];
            newPoints[index] = newPos;
            onUpdatePoints(newPoints);
        }
    };

    const initialCurve = useMemo(() => {
        if (points.length < 2) return null;
        return new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    }, [points]);

    return (
        <group>
            {/* Live Tube Preview - Managed via Ref and useFrame */}
            <mesh ref={tubeRef}>
                {initialCurve && <tubeGeometry args={[initialCurve, 64, 0.03, 8, false]} />}
                <meshBasicMaterial color={isDragging ? "red" : "yellow"} opacity={0.6} transparent depthTest={false} />
            </mesh>

            {points.map((p, i) => {
                const isSelected = selectedIndices.includes(i);
                return (
                    <group key={pointIds[i] || i}>
                        {isSelected ? (
                            <TransformControls
                                mode="translate"
                                size={0.3}
                                onMouseDown={handleDragStart}
                                onChange={handleDragChange}
                                onMouseUp={() => handleDragEnd(i)}
                                showX={selectedIndices.length === 1} // Only show controls if single point selected? Or all? User wants to move "the selected point". 
                                showY={selectedIndices.length === 1}
                                showZ={selectedIndices.length === 1}
                                enabled={selectedIndices.length === 1} // Disable drag if multiple selected to avoid confusion?
                            >
                                <mesh
                                    ref={dummyRefs.current[i]}
                                    position={p}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectIndex(i);
                                    }}
                                >
                                    <sphereGeometry args={[0.12, 16, 16]} />
                                    <meshBasicMaterial color="yellow" depthTest={false} transparent opacity={0.9} />
                                </mesh>
                            </TransformControls>
                        ) : (
                            <mesh
                                ref={dummyRefs.current[i]}
                                position={p}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectIndex(i);
                                }}
                            >
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshBasicMaterial color="red" depthTest={false} transparent opacity={0.6} />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

const AnchorEditor = ({ item, onUpdateItem }) => {
    const defaultAnchors = useMemo(() => getApparatusAnchors(item), [item]);

    // Merge overrides
    const anchors = defaultAnchors.map(a => {
        const override = item.anchorOverrides?.[a.id];
        if (override) return { ...a, position: override };
        return a;
    });

    const customAnchors = item.customAnchors || [];
    const allAnchors = [...anchors, ...customAnchors];

    // We need to store refs to the *objects* being moved by TransformControls
    // TransformControls usually attaches to a target object.
    // If we map TransformControls around each mesh, moving the control moves the mesh.
    // We need to read the mesh's new position on DragEnd.

    const dummyRefs = useRef([]);
    // Ensure refs array is synced
    dummyRefs.current = allAnchors.map((_, i) => dummyRefs.current[i] || React.createRef());

    const handleDragEnd = (index) => {
        const dummy = dummyRefs.current[index]?.current;
        if (dummy) {
            const newPos = [dummy.position.x, dummy.position.y, dummy.position.z];
            if (index < anchors.length) {
                // Default anchor override
                // We need to know which anchor ID this index corresponds to
                // Since we map [...anchors, ...custom], indices 0 to anchors.length-1 align.
                const anchor = anchors[index];
                const newOverrides = { ...(item.anchorOverrides || {}), [anchor.id]: newPos };
                onUpdateItem(item.id, { anchorOverrides: newOverrides });
            } else {
                // Custom anchor update
                const customIndex = index - anchors.length;
                const newCustoms = [...customAnchors];
                if (newCustoms[customIndex]) {
                    newCustoms[customIndex] = { ...newCustoms[customIndex], position: newPos };
                    onUpdateItem(item.id, { customAnchors: newCustoms });
                }
            }
        }
    };

    return (
        <group>
            {allAnchors.map((anchor, i) => (
                <TransformControls
                    key={anchor.id || `custom-${i}`}
                    mode="translate"
                    size={0.4} // Larger controls
                    onMouseUp={() => handleDragEnd(i)}
                >
                    <group ref={dummyRefs.current[i]} position={anchor.position}>
                        {/* Visual Sphere */}
                        <mesh>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshBasicMaterial color={i < anchors.length ? "cyan" : "orange"} transparent opacity={0.8} depthTest={false} />
                        </mesh>
                        {/* Invisible Hitbox Sphere */}
                        <mesh
                            onClick={(e) => e.stopPropagation()}
                            visible={false}
                        >
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshBasicMaterial />
                        </mesh>
                    </group>
                </TransformControls>
            ))}
        </group>
    );
};

const ApparatusEditorItem = ({ item, selectedId, onSelect, updateItem, onUpdateItems, transformMode, allItems, isBuilding }) => {
    const Component = APPARATUS_MAP[item.model];
    // Use state-based ref to ensure re-render when the group is actually mounted
    const [group, setGroup] = useState(null);

    if (!Component) return null;

    const isSelected = item.id === selectedId;

    const handleTransform = () => {
        if (item.isEditingPoints || item.isEditingAnchors) return;

        if (group) {
            const { position, rotation, scale } = group;
            // Current (New) Transform
            let newPos = [Number(position.x.toFixed(3)), Number(position.y.toFixed(3)), Number(position.z.toFixed(3))];
            let newScale = [Number(scale.x.toFixed(3)), Number(scale.y.toFixed(3)), Number(scale.z.toFixed(3))];
            let newRot = [Number(rotation.x.toFixed(3)), Number(rotation.y.toFixed(3)), Number(rotation.z.toFixed(3))];

            // Calculate Delta for Group Movement (only if position changed)
            const oldPos = item.position || [0, 0, 0];
            const delta = new THREE.Vector3(
                newPos[0] - oldPos[0],
                newPos[1] - oldPos[1],
                newPos[2] - oldPos[2]
            );

            // --- AUTO-SNAP LOGIC FOR RUBBER CORK ---
            if (item.model === 'RubberCork') {
                // ... (Existing Cork Logic, abbreviated for clarity if unchanged? No, keep it) ...
                // [Copying existing Cork logic strictly]
                const SNAP_THRESHOLD = 0.5;
                const SNAP_TARGETS = {
                    'ConicalFlask': { offset: [0, 2.5, 0], radius: 0.35 },
                    'TestTube': { offset: [0, 1.7, 0], radius: 0.2 },
                    'BoilingTube': { offset: [0, 0.9, 0], radius: 0.3 },
                    'GasJar': { offset: [0, 2.5, 0], radius: 0.5 },
                };
                let closestDist = Infinity;
                let snapTarget = null;
                allItems.forEach(other => {
                    if (other.id === item.id) return;
                    const targetInfo = SNAP_TARGETS[other.model];
                    if (targetInfo) {
                        const containerPos = new THREE.Vector3(...other.position);
                        const mouthWorldPos = containerPos.clone().add(new THREE.Vector3(...targetInfo.offset));
                        const corkPos = new THREE.Vector3(...newPos);
                        const dist = corkPos.distanceTo(mouthWorldPos);
                        if (dist < SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapTarget = targetInfo;
                            newPos = [mouthWorldPos.x, mouthWorldPos.y, mouthWorldPos.z];
                        }
                    }
                });
                if (snapTarget) {
                    const scaleFactor = snapTarget.radius / 0.2;
                    newScale = [scaleFactor, scaleFactor, scaleFactor];
                }
            }

            // --- AUTO-SNAP LOGIC FOR DELIVERY TUBE (3D ALIGNMENT) ---
            if (item.model === 'DeliveryTube') {
                const TUBE_SNAP_THRESHOLD = 0.5; // Increased from 0.3
                let snapOffset = new THREE.Vector3();
                let snapped = false;

                const tempObj = new THREE.Object3D();
                tempObj.position.set(...newPos);
                tempObj.rotation.set(...newRot);
                tempObj.scale.set(...newScale);
                tempObj.updateMatrix();

                const myPoints = item.points || [[0, 0, 0], [0, 1, 0]];
                const myStart = new THREE.Vector3(...myPoints[0]).applyMatrix4(tempObj.matrix);
                const myEnd = new THREE.Vector3(...myPoints[myPoints.length - 1]).applyMatrix4(tempObj.matrix);

                // Find Snap Target
                for (const other of allItems) {
                    if (other.id === item.id) continue;
                    if (other.model !== 'DeliveryTube') continue;

                    const otherObj = new THREE.Object3D();
                    otherObj.position.set(...(other.position || [0, 0, 0]));
                    otherObj.rotation.set(...(other.rotation || [0, 0, 0]));
                    otherObj.scale.set(...(other.scale || [1, 1, 1]));
                    otherObj.updateMatrix();

                    const otherPoints = other.points || [[0, 0, 0], [0, 1, 0]];
                    const otherStart = new THREE.Vector3(...otherPoints[0]).applyMatrix4(otherObj.matrix);
                    const otherEnd = new THREE.Vector3(...otherPoints[otherPoints.length - 1]).applyMatrix4(otherObj.matrix);

                    if (myStart.distanceTo(otherStart) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherStart, myStart); snapped = true; break; }
                    if (myStart.distanceTo(otherEnd) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherEnd, myStart); snapped = true; break; }
                    if (myEnd.distanceTo(otherStart) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherStart, myEnd); snapped = true; break; }
                    if (myEnd.distanceTo(otherEnd) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherEnd, myEnd); snapped = true; break; }
                }

                if (snapped) {
                    newPos[0] += snapOffset.x;
                    newPos[1] += snapOffset.y;
                    newPos[2] += snapOffset.z;
                    // Update delta to include snap
                    delta.add(snapOffset);
                    // Visual Feedback
                    document.body.style.cursor = 'crosshair';
                    setTimeout(() => document.body.style.cursor = 'default', 500);
                }
            }

            // --- AUTO-SNAP LOGIC FOR CLAMP (TO RETORT STAND) ---
            if (item.model === 'Clamp') {
                const CLAMP_SNAP_THRESHOLD = 2.0;
                const ROD_OFFSET_Z = -0.4;
                const CLAMP_LOOP_OFFSET_X = -1.65;

                let closestDist = Infinity;
                let snapPos = null;

                const rotY = newRot[1];
                const loopOffsetLocal = new THREE.Vector3(CLAMP_LOOP_OFFSET_X, 0, 0);
                loopOffsetLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

                allItems.forEach(other => {
                    if (other.model === 'RetortStand') {
                        const standPos = new THREE.Vector3(...other.position);
                        const standRot = new THREE.Euler(...(other.rotation || [0, 0, 0]));
                        const rodOffsetLocal = new THREE.Vector3(0, 0, ROD_OFFSET_Z);
                        rodOffsetLocal.applyEuler(standRot);

                        const rodWorldX = standPos.x + rodOffsetLocal.x;
                        const rodWorldZ = standPos.z + rodOffsetLocal.z;

                        const targetX = rodWorldX - loopOffsetLocal.x;
                        const targetZ = rodWorldZ - loopOffsetLocal.z;

                        const currentDist = Math.sqrt(Math.pow(newPos[0] - targetX, 2) + Math.pow(newPos[2] - targetZ, 2));

                        if (currentDist < CLAMP_SNAP_THRESHOLD && currentDist < closestDist) {
                            closestDist = currentDist;

                            const rodBaseY = standPos.y;
                            const minY = rodBaseY + 0.5;
                            const maxY = rodBaseY + 4.5;

                            let targetY = newPos[1];
                            if (targetY < minY) targetY = minY;
                            if (targetY > maxY) targetY = maxY;

                            snapPos = [targetX, targetY, targetZ];
                        }
                    }
                });

                if (snapPos) {
                    newPos[0] = snapPos[0];
                    newPos[1] = snapPos[1];
                    newPos[2] = snapPos[2];
                    document.body.style.cursor = 'crosshair';
                }
            }



            // --- AUTO-SNAP LOGIC FOR GLASSWARE (TO CLAMP) ---
            const GLASSWARE_TYPES = ['TestTube', 'BoilingTube', 'ConicalFlask', 'RoundBottomFlask', 'Beaker'];
            if (GLASSWARE_TYPES.includes(item.model)) {
                // Increased threshold for easier snapping
                const GLASS_SNAP_THRESHOLD = 1.0;
                const GRIP_OFFSETS = {
                    'TestTube': 1.4,
                    'BoilingTube': 1.4,
                    'ConicalFlask': 2.2,
                    'RoundBottomFlask': 2.0,
                    'Beaker': 1.5
                };
                const CLAMP_SETTINGS = {
                    'TestTube': { size: 1.0, angle: 0.3 },
                    'BoilingTube': { size: 1.0, angle: 0.4 },
                    'ConicalFlask': { size: 1.2, angle: 0.5 },
                    'RoundBottomFlask': { size: 1.2, angle: 0.5 },
                    'Beaker': { size: 1.5, angle: 0.7 }
                };

                const gripOffset = GRIP_OFFSETS[item.model] || 1.0;
                let snapPos = null;
                let targetClampId = null;
                let closestDist = Infinity;

                allItems.forEach(other => {
                    if (other.model === 'Clamp') {
                        const clampPos = new THREE.Vector3(...(other.position || [0, 0, 0]));
                        const clampRot = new THREE.Euler(...(other.rotation || [0, 0, 0]));
                        const headAngle = other.headAngle || 0;
                        const size = other.size || 1;

                        const gripLocal = new THREE.Vector3(0.6 * size, 0, 0);
                        gripLocal.applyAxisAngle(new THREE.Vector3(1, 0, 0), headAngle);
                        gripLocal.applyEuler(clampRot);

                        const gripWorld = clampPos.clone().add(gripLocal);

                        const glassTargetPos = gripWorld.clone().sub(new THREE.Vector3(0, gripOffset, 0));

                        const dist = new THREE.Vector3(...newPos).distanceTo(glassTargetPos);

                        if (dist < GLASS_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapPos = [glassTargetPos.x, glassTargetPos.y, glassTargetPos.z];
                            targetClampId = other.id;
                        }
                    }
                });

                if (snapPos) {
                    newPos[0] = snapPos[0];
                    newPos[1] = snapPos[1];
                    newPos[2] = snapPos[2];
                    document.body.style.cursor = 'crosshair';

                    if (targetClampId) {
                        const settings = CLAMP_SETTINGS[item.model];
                        const targetClamp = allItems.find(c => c.id === targetClampId);
                        if (targetClamp && settings) {
                            if (targetClamp.size !== settings.size || Math.abs((targetClamp.angle || 0) - settings.angle) > 0.01) {
                                setTimeout(() => {
                                    if (typeof updateItem === 'function') {
                                        updateItem(targetClampId, { size: settings.size, angle: settings.angle });
                                    }
                                }, 0);
                            }
                        }
                    }
                }
            }


            // --- GROUP MOVEMENT LOGIC (RETORT STAND + CLAMPS) ---
            if (item.model === 'RetortStand' && delta.lengthSq() > 0.0001) {
                const attachedClamps = [];
                const standPos = new THREE.Vector3(...oldPos); // Use OLD pos to check attachment
                const standRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
                const ROD_OFFSET_Z = -0.4;
                const CLAMP_LOOP_OFFSET_X = -1.65;
                const ATTACH_THRESHOLD = 0.1; // Strict attach check

                allItems.forEach(other => {
                    if (other.model === 'Clamp') {
                        const clampPos = new THREE.Vector3(...(other.position || [0, 0, 0]));
                        const clampRot = new THREE.Euler(...(other.rotation || [0, 0, 0]));

                        // Calculate where the clamp *should* be if attached
                        const rodOffsetLocal = new THREE.Vector3(0, 0, ROD_OFFSET_Z);
                        rodOffsetLocal.applyEuler(standRot);
                        const rodWorldX = standPos.x + rodOffsetLocal.x;
                        const rodWorldZ = standPos.z + rodOffsetLocal.z;

                        const loopOffsetLocal = new THREE.Vector3(CLAMP_LOOP_OFFSET_X, 0, 0);
                        loopOffsetLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), clampRot.y);

                        const targetX = rodWorldX - loopOffsetLocal.x;
                        const targetZ = rodWorldZ - loopOffsetLocal.z;

                        // Check 2D distance (X/Z)
                        const dist = Math.sqrt(Math.pow(clampPos.x - targetX, 2) + Math.pow(clampPos.z - targetZ, 2));

                        if (dist < ATTACH_THRESHOLD) {
                            attachedClamps.push(other);
                        }
                    }
                });

                if (attachedClamps.length > 0) {
                    const updates = [];
                    // Update Self
                    updates.push({ id: item.id, position: newPos, rotation: newRot, scale: newScale });

                    // Update Clamps
                    attachedClamps.forEach(clamp => {
                        const cp = clamp.position || [0, 0, 0];
                        updates.push({
                            id: clamp.id,
                            position: [cp[0] + delta.x, cp[1] + delta.y, cp[2] + delta.z]
                            // We don't rotate clamps if stand rotates for now, just translate
                        });
                    });

                    if (typeof onUpdateItems === 'function') {
                        onUpdateItems(updates);
                        return; // Skip default update
                    }
                }
            }


            // --- GROUP MOVEMENT LOGIC (TUBES) ---
            // If we moved (delta > 0), check for connected tubes
            if (item.model === 'DeliveryTube' && delta.lengthSq() > 0.0001) {
                // BFS to find all connected tubes
                const connectedIds = new Set([item.id]);
                const queue = [item.id];
                const visited = new Set([item.id]);
                const GROUP_THRESHOLD = 0.35; // Connection tolerance

                while (queue.length > 0) {
                    const currId = queue.shift();
                    const currItem = allItems.find(i => i.id === currId);
                    if (!currItem) continue;

                    // Calc curr endpoints world pos
                    // (Note: For the *moving* item, we use NewPos. For others, use OldPos unless already moved?
                    // Actually, effectively we want to find who WAS connected before move?
                    // Or who IS connected?
                    // If we move A, B is attached. B should move.
                    // We should use the positions *before* this current transform?
                    // But we only have `allItems` which has OLD positions for A (and B).
                    // Yes, use `allItems` (old state) to find connections.

                    const currObj = new THREE.Object3D();
                    currObj.position.set(...currItem.position);
                    currObj.rotation.set(...currItem.rotation);
                    currObj.scale.set(...currItem.scale);
                    currObj.updateMatrix();
                    const pts = currItem.points || [[0, 0, 0], [0, 1, 0]];
                    const s = new THREE.Vector3(...pts[0]).applyMatrix4(currObj.matrix);
                    const e = new THREE.Vector3(...pts[pts.length - 1]).applyMatrix4(currObj.matrix);

                    allItems.forEach(other => {
                        if (other.model !== 'DeliveryTube' || visited.has(other.id)) return;

                        const otherObj = new THREE.Object3D();
                        otherObj.position.set(...other.position);
                        otherObj.rotation.set(...other.rotation);
                        otherObj.scale.set(...other.scale);
                        otherObj.updateMatrix();
                        const opts = other.points || [[0, 0, 0], [0, 1, 0]];
                        const os = new THREE.Vector3(...opts[0]).applyMatrix4(otherObj.matrix);
                        const oe = new THREE.Vector3(...opts[opts.length - 1]).applyMatrix4(otherObj.matrix);

                        if (s.distanceTo(os) < GROUP_THRESHOLD || s.distanceTo(oe) < GROUP_THRESHOLD ||
                            e.distanceTo(os) < GROUP_THRESHOLD || e.distanceTo(oe) < GROUP_THRESHOLD) {
                            visited.add(other.id);
                            connectedIds.add(other.id);
                            queue.push(other.id);
                        }
                    });
                }

                if (connectedIds.size > 1) {
                    // Update all connected items
                    const updates = [];
                    connectedIds.forEach(id => {
                        if (id === item.id) {
                            updates.push({ id, position: newPos, rotation: newRot, scale: newScale });
                        } else {
                            const other = allItems.find(i => i.id === id);
                            if (other) {
                                const op = other.position || [0, 0, 0];
                                updates.push({
                                    id,
                                    position: [op[0] + delta.x, op[1] + delta.y, op[2] + delta.z]
                                });
                            }
                        }
                    });

                    if (typeof onUpdateItems === 'function') {
                        onUpdateItems(updates);
                        return; // Skip default update
                    }
                }
            }

            updateItem(item.id, {
                position: newPos,
                rotation: newRot,
                scale: newScale
            });
        }
    };

    const componentProps = {};
    if (item.model === 'Tongs' || item.model === 'Clamp') componentProps.angle = item.angle || 0;
    if (item.model === 'Clamp') {
        componentProps.headAngle = item.headAngle || 0;
        componentProps.size = item.size || 1;
    }
    if (item.model === 'BunsenBurner') componentProps.isOn = item.isOn || false;
    if (item.model === 'GasJar') { componentProps.hasLid = item.hasLid !== false; componentProps.holeCount = item.holeCount || 0; }
    if (item.model === 'RubberCork') componentProps.holes = item.holes || 1;
    if (item.model === 'DeliveryTube' && item.points?.length > 0) componentProps.points = item.points;
    if (item.model === 'Wire' && item.points?.length > 0) componentProps.points = item.points;
    if (item.model === 'Wire') componentProps.color = item.color || 'red';


    return (
        <group>
            {isSelected && group && !item.isEditingPoints && !item.isEditingAnchors && transformMode !== 'none' && (
                <TransformControls object={group} mode={transformMode} onMouseUp={handleTransform} size={0.5} />
            )}
            <group
                ref={setGroup}
                position={item.position || [0, 0, 0]}
                rotation={item.rotation || [0, 0, 0]}
                scale={item.scale || [1, 1, 1]}
                onClick={(e) => {
                    // When building, we want to Click Through constraints (apparatus).
                    // So we do NOT stop propagation if building.
                    // And we do NOT select.
                    if (isBuilding) return;

                    e.stopPropagation();
                    onSelect(item.id);
                }}
            >
                {isSelected && <axesHelper args={[2]} />}
                <Component
                    {...componentProps}
                    height={item.height}
                    legAngle={item.legAngle}
                />

                {isSelected && (item.model === 'DeliveryTube' || item.model === 'Wire') && item.isEditingPoints && (
                    <TubePointEditor
                        points={item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]]}
                        position={item.position}
                        onUpdatePoints={(newPoints) => updateItem(item.id, { points: newPoints })}
                        selectedIndices={item.selectedPointIndices || []}
                        onSelectIndex={(idx) => {
                            const current = item.selectedPointIndices || [];
                            const isSelected = current.includes(idx);
                            let newIndices;
                            if (isSelected) {
                                newIndices = current.filter(i => i !== idx);
                            } else {
                                newIndices = [...current, idx].sort((a, b) => a - b);
                            }
                            updateItem(item.id, { selectedPointIndices: newIndices });
                        }}
                    />
                )}

                {isSelected && item.isEditingAnchors && (
                    <AnchorEditor item={item} onUpdateItem={updateItem} />
                )}
            </group>
        </group>
    );
};

// ... (skipping TubeBuilderTool definition as it is fine) ...
// ... (skipping rest of file until render loop) ...

// I need to target the render loop instantiation of ApparatusEditorItem.
// Since `replace_file_content` targets a contiguous block, and the `onClick` is at ~530 and render loop is at ~1240, 
// I CANNOT do both in one block unless I replace the entire 700 lines (bad idea).

// I will do the `onClick` update first in this step.
// And use a second step for the prop passing.




const TubeBuilderTool = ({ allItems, builderState, setBuilderState, onCreateTube, planarMode }) => {
    const { camera, scene } = useThree();
    const [hoveredAnchor, setHoveredAnchor] = useState(null);
    const [phantomPos, setPhantomPos] = useState(null);

    // 1. Calculate all available anchors
    const anchors = useMemo(() => {
        const allAnchors = allItems.flatMap(item => {
            // getApparatusAnchors returns World Space anchors relative to the item's current transform
            const itemAnchors = getApparatusAnchors(item).map(a => ({
                ...a,
                parentId: item.id,
                // Ensure position is an array for safety, though getApparatusAnchors returns arrays
                position: Array.isArray(a.position) ? a.position : new THREE.Vector3(...a.position).toArray(),
                normal: a.normal || [0, 1, 0]
            }));

            // Power Supply Terminals & others are now handled in getApparatusAnchors utils

            return itemAnchors;
        });
        return allAnchors;
    }, [allItems]);

    // 2. Handle Mouse Move for Phantom Tube & ROBUST Anchor Detection
    useFrame(({ mouse, raycaster }) => {
        // A. Robust Anchor Detection (Bypass Occlusion)
        // Check distance from ray to each anchor point
        let bestAnchor = null;
        let minDist = Infinity;
        const SELECTION_THRESHOLD = 0.15; // World units distance

        for (const anchor of anchors) {
            const anchorPos = new THREE.Vector3(...anchor.position);
            // Distance from point to line (ray)
            // Ray: origin + t * direction
            // We want perpendicular distance.
            // THREE.Ray.distanceSqToPoint(point)
            const distSq = raycaster.ray.distanceSqToPoint(anchorPos);

            if (distSq < SELECTION_THRESHOLD * SELECTION_THRESHOLD) {
                // Also check distance *along* the ray to ensure it's in front? 
                // Actually, we want to select *through* glass, so depth matters less unless multiple anchors align.
                // Prioritize closer to camera? 
                const distToCam = raycaster.ray.origin.distanceTo(anchorPos);
                if (distToCam < minDist) {
                    minDist = distToCam;
                    bestAnchor = anchor;
                }
            }
        }

        // Update Hover State (Priority to robust check)
        if (bestAnchor) {
            if (hoveredAnchor?.id !== bestAnchor.id) {
                setHoveredAnchor(bestAnchor);
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredAnchor) {
                setHoveredAnchor(null);
                document.body.style.cursor = 'default';
            }
        }

        // B. Phantom Logic
        if (builderState.startAnchor) {
            let target = new THREE.Vector3();
            // Reuse bestAnchor position if hovering?
            if (bestAnchor) {
                target.set(...bestAnchor.position);
                // We don't set phantomPos to target if hovering, 
                // because phantom logic uses `hoveredAnchor` or `phantomPos`.
                // If `hoveredAnchor` is set, `phantomCurve` uses it.
                // So we just update phantomPos for the case where we are NOT hovering.
            } else {
                if (planarMode) {
                    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -builderState.startAnchor.position[2]);
                    raycaster.ray.intersectPlane(planeZ, target);
                } else {
                    const lastPoint = builderState.points?.length > 0
                        ? new THREE.Vector3(...builderState.points[builderState.points.length - 1])
                        : new THREE.Vector3(...builderState.startAnchor.position);

                    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -lastPoint.z);
                    raycaster.ray.intersectPlane(planeZ, target);

                    if (target.lengthSq() === 0) {
                        const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                        raycaster.ray.intersectPlane(planeY, target);
                    }
                }
                setPhantomPos(target);
            }
        }
    });

    const handleSceneClick = (e) => {
        if (!builderState.active) return;

        // If we simply clicked "the scene" (background plane), but our robust raycast says we are hovering an anchor,
        // then treat this as an anchor click!
        if (hoveredAnchor) {
            handleAnchorClick(e, hoveredAnchor);
            return;
        }

        if (!builderState.startAnchor) return; // Need start anchor first (which must be clicked via anchor click usually, but now robust check handles it too)

        // Add intermediate point
        // e.point is the intersection point on the plane/object? 
        // We need the phantom position which is already calculated on the correct plane.
        if (phantomPos) {
            const newPoint = [phantomPos.x, phantomPos.y, phantomPos.z];
            setBuilderState(prev => ({
                ...prev,
                points: [...(prev.points || []), newPoint]
            }));
        }
    };

    const handleAnchorClick = (e, anchor) => {
        e.stopPropagation();
        if (!builderState.startAnchor) {
            // Start
            setBuilderState(prev => ({ ...prev, startAnchor: anchor, points: [] }));
        } else {
            if (anchor.id === builderState.startAnchor.id) return; // Ignore self
            // Finish Tube
            // Combine: StartAnchor -> Intermediate Points -> EndAnchor
            const startPos = builderState.startAnchor.position;
            const endPos = anchor.position;
            const intermediate = builderState.points || [];

            // If "Straight" mode and NO intermediate points, just 2 points.
            // If "Curved" mode, we might want to generate curves?
            // The user wants "Polyline" essentially.

            // We construct the final points array:
            // [Start, ...Intermediate, End]
            const finalPoints = [startPos, ...intermediate, endPos];

            onCreateTube(builderState.startAnchor, anchor, builderState.mode, finalPoints);
            setBuilderState(prev => ({ ...prev, startAnchor: null, points: [] }));
        }
    };

    // Phantom Curve Logic (Polyline visualization)
    const phantomCurve = useMemo(() => {
        if (!builderState.startAnchor) return null;

        const start = new THREE.Vector3(...builderState.startAnchor.position);
        // Points so far
        const currentPoints = (builderState.points || []).map(p => new THREE.Vector3(...p));
        // End is hovered anchor OR phantom pos
        const end = hoveredAnchor ? new THREE.Vector3(...hoveredAnchor.position) : (phantomPos || start.clone());

        const allPath = [start, ...currentPoints, end];

        if (allPath.length < 2) return null; // Should have at least start and end

        // If mode is straight/polyline, use CatmullRom with zero tension? Or LineCurve?
        // CatmullRom with tension 0 is jagged? No, tension 1 is jagged?
        // Actually, for visual Preview, CatmullRom is easiest if we don't strict-line it.
        // But for "Straight" mode we want lines.
        // `DeliveryTube` handles array of points.
        // Here we just want to visualize.
        return new THREE.CatmullRomCurve3(allPath, false, 'catmullrom', 0.1); // 0.1 tension for straighter lines
    }, [builderState.startAnchor, builderState.points, hoveredAnchor, phantomPos, builderState.mode]);



    return (
        <group>
            {/* Anchors */}
            {anchors.map((anchor, i) => (
                <mesh
                    key={i}
                    position={anchor.position}
                    onClick={(e) => handleAnchorClick(e, anchor)}
                    onPointerOver={(e) => { e.stopPropagation(); setHoveredAnchor(anchor); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={(e) => { setHoveredAnchor(null); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial
                        color={
                            (builderState.startAnchor && builderState.startAnchor.id === anchor.id) ? "green" :
                                (hoveredAnchor && hoveredAnchor.id === anchor.id) ? "yellow" : "cyan"
                        }
                        transparent opacity={0.6} depthTest={false}
                    />
                </mesh>
            ))}

            {/* Visual Guide for Phantom Path */}
            {phantomCurve && (
                <mesh>
                    <tubeGeometry args={[phantomCurve, 64, 0.02, 8, false]} />
                    <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Click Capture Plane - Only active when building */}
            {builderState.active && builderState.startAnchor && (
                <mesh
                    visible={false}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent clicking things behind
                        handleSceneClick(e);
                    }}
                // Scale to cover reasonable area or use PlaneGeometry
                // Ideally use a Plane that always faces camera or covers the view?
                // Or just a massive plane at Z=0 (or transformed)? 
                // Raycaster in handleSceneClick uses `phantomPos` which is computed via `useFrame` raycasting against a mathematical plane.
                // So this mesh is just to capture the event.
                // But `e.point` in onClick will be on this mesh.
                // `handleSceneClick` uses `phantomPos` state, so it doesn't matter where exactly we click as long as we capture it?
                // Yes, `handleSceneClick` uses `phantomPos`.
                // So we just need a big plane.
                >
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial />
                </mesh>
            )}

            {/* Visualize Current Points */}
            {(builderState.points || []).map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="purple" />
                </mesh>
            ))}
        </group>
    );
};

export default function ApparatusEditorPage() {
    const [reactions, setReactions] = useState([]);
    const [selectedReactionId, setSelectedReactionId] = useState('');
    const [selectedApparatusId, setSelectedApparatusId] = useState(null);

    // Fetch data on mount
    useEffect(() => {
        fetch('/api/reactions')
            .then(res => res.json())
            .then(data => {
                setReactions(data);
                if (data.length > 0) setSelectedReactionId(data[0].id);
            })
            .catch(err => console.error("Failed to load reactions", err));
    }, []);
    const [status, setStatus] = useState('');

    // Tube Builder State
    const [builderState, setTubeBuilderState] = useState({ active: false, mode: 'straight', startAnchor: null });
    // Planar Mode State (New)
    const [planarMode, setPlanarMode] = useState(false); // Default to false to match current behavior, but easy to toggle.
    const [transformMode, setTransformMode] = useState('translate');
    const [selectedModelToAdd, setSelectedModelToAdd] = useState(Object.keys(APPARATUS_MAP)[0]);

    const currentReaction = reactions.find(r => r.id === selectedReactionId);

    const handleUpdateItems = (updates) => {
        // updates: [{ id, ...newProps }]
        if (!currentReaction) return;
        const updatedApparatus = currentReaction.apparatus.map(item => {
            const update = updates.find(u => u.id === item.id);
            return update ? { ...item, ...update } : item;
        });
        const updatedReactions = reactions.map(r =>
            r.id === selectedReactionId ? { ...r, apparatus: updatedApparatus } : r
        );
        setReactions(updatedReactions);
    };

    const handleUpdateItem = (id, newProps) => {
        handleUpdateItems([{ id, ...newProps }]);
    };

    const handleAddItem = (model) => {
        if (!currentReaction) return;
        // Generate a simple ID
        const id = `${model.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        const newItem = {
            id,
            model,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        };
        const updatedApparatus = [...(currentReaction.apparatus || []), newItem];
        const updatedReactions = reactions.map(r =>
            r.id === selectedReactionId ? { ...r, apparatus: updatedApparatus } : r
        );
        setReactions(updatedReactions);
        setSelectedApparatusId(id);
    };

    const handleDeleteItem = (id) => {
        if (!currentReaction) return;
        const updatedApparatus = currentReaction.apparatus.filter(item => item.id !== id);
        const updatedReactions = reactions.map(r =>
            r.id === selectedReactionId ? { ...r, apparatus: updatedApparatus } : r
        );
        setReactions(updatedReactions);
        setSelectedApparatusId(null);
    };

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reactions)
            });
            if (res.ok) {
                setStatus('Saved successfully!');
                setTimeout(() => setStatus(''), 2000);
            } else {
                setStatus('Error saving.');
            }
        } catch (e) {
            console.error(e);
            setStatus('Error saving.');
        }
    };

    const handleCreateSmartTube = (startAnchor, endAnchor, mode, customPoints) => {
        let points = [];

        if (customPoints && customPoints.length > 0) {
            // Use points from Builder (Polyline/Smart)
            points = customPoints;

            // AUTOMATIC ARCH FOR WIRES
            // If it's a wire and we only have Start/End (no manual intermediate points),
            // generate an extensive curve to avoid clipping.
            if (mode === 'wire' && points.length === 2) {
                const pStart = new THREE.Vector3(...points[0]);
                const pEnd = new THREE.Vector3(...points[1]);

                // Calculate "Arch" - midpoint raised up
                const dist = pStart.distanceTo(pEnd);
                const mid = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.5);

                // Configurable Arch Height usually depends on distance
                // But for lab wires, they usually go UP significantly.
                // Let's bias it UP.
                mid.y += Math.max(0.5, dist * 0.5);

                // Maybe 2 control points?
                // Control 1: 1/3 way, raised bit less
                // Control 2: 2/3 way, raised bit less
                // A quadratic or cubic bezier feel.

                // Let's use a simple 3-point arch for now: Start -> Mid(High) -> End
                // But CatmullRom might smooth it too much or make it weird.
                // Let's add 3 intermediate points for broad arch.
                const p1 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.25);
                p1.y += Math.max(0.3, dist * 0.3);

                const p2 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.5);
                p2.y += Math.max(0.5, dist * 0.5);

                const p3 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.75);
                p3.y += Math.max(0.3, dist * 0.3);

                points = [pStart.toArray(), p1.toArray(), p2.toArray(), p3.toArray(), pEnd.toArray()];
            }

        } else {
            // Fallback (shouldn't happen with new builder, but keep for safety)
            const start = new THREE.Vector3(...startAnchor.position);
            const end = new THREE.Vector3(...endAnchor.position);

            if (mode === 'straight') {
                points = [start.toArray(), end.toArray()];
            } else {
                const startNormal = new THREE.Vector3(...startAnchor.normal);
                const endNormal = new THREE.Vector3(...endAnchor.normal);

                const dist = start.distanceTo(end);
                const p1 = start.clone().add(startNormal.clone().multiplyScalar(dist * 0.5));
                const p2 = end.clone().add(endNormal.clone().multiplyScalar(dist * 0.5));

                // Cubic Bezier to Points
                const curve = new THREE.CubicBezierCurve3(start, p1, p2, end);
                const calculatedPoints = curve.getPoints(20); // 20 segments
                points = calculatedPoints.map(v => v.toArray());
            }
        }

        // Create Item
        const isWire = mode === 'wire';
        const modelType = isWire ? 'Wire' : 'DeliveryTube';
        const id = `${modelType.toLowerCase()}-${Date.now().toString().slice(-4)}`;

        // Determine Wire Color if it is a wire
        let color = 'red';
        if (isWire && startAnchor && startAnchor.id) {
            if (startAnchor.id.includes('neg') || startAnchor.id.includes('cathode') || startAnchor.id.includes('black')) {
                color = 'black';
            }
        }

        const newItem = {
            id,
            model: modelType,
            position: [0, 0, 0], // The points are world space, so group pos is 0,0,0
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            points: points,
            tubeMode: mode,
            isEditingPoints: false,
            color: isWire ? color : undefined
        };

        const updatedApparatus = [...(currentReaction.apparatus || []), newItem];
        const updatedReactions = reactions.map(r =>
            r.id === selectedReactionId ? { ...r, apparatus: updatedApparatus } : r
        );
        setReactions(updatedReactions);
        setSelectedApparatusId(id);
    };


    return (
        <div className="flex h-screen w-full bg-neutral-900 text-white">
            {/* Sidebar */}
            <div className="w-80 flex flex-col border-r border-white/10 p-4 gap-4 overflow-y-auto">
                <h1 className="text-xl font-bold text-blue-400">Apparatus Editor</h1>

                {/* Reaction Selector */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-neutral-400">Select Reaction</label>
                    <select
                        className="bg-black/40 border border-white/20 rounded p-2 text-sm"
                        value={selectedReactionId || ''}
                        onChange={(e) => setSelectedReactionId(e.target.value)}
                    >
                        {reactions.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                {/* Tools Section */}
                <div className="flex flex-col gap-2 p-2 bg-white/5 rounded">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase">Tools</h3>

                    {/* Transform Modes */}
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 text-xs py-1 rounded ${!builderState.active && transformMode === 'translate' ? 'bg-blue-600' : 'hover:bg-white/10'}`}
                            onClick={() => { setTubeBuilderState({ ...builderState, active: false }); setTransformMode('translate'); }}
                        >
                            Move
                        </button>
                        <button
                            className={`flex-1 text-xs py-1 rounded ${!builderState.active && transformMode === 'rotate' ? 'bg-blue-600' : 'hover:bg-white/10'}`}
                            onClick={() => { setTubeBuilderState({ ...builderState, active: false }); setTransformMode('rotate'); }}
                        >
                            Rotate
                        </button>
                    </div>

                    {/* Tube Builder Toggle */}
                    <div className="flex flex-col gap-1 mt-2 border-t border-white/10 pt-2">
                        <label className="text-xs text-purple-300">Smart Tube Builder</label>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] text-neutral-400">Planar Mode (2D)</label>
                            <input
                                type="checkbox"
                                checked={planarMode}
                                onChange={(e) => setPlanarMode(e.target.checked)}
                                className="accent-purple-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                className={`flex-1 text-xs py-1 rounded ${builderState.active && builderState.mode === 'straight' ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'}`}
                                onClick={() => setTubeBuilderState({ active: true, mode: 'straight', startAnchor: null, points: [] })}
                            >
                                Polyline
                            </button>
                            <button
                                className={`flex-1 text-xs py-1 rounded ${builderState.active && builderState.mode === 'curved' ? 'bg-purple-600' : 'bg-purple-900/30 hover:bg-purple-900/50'}`}
                                onClick={() => setTubeBuilderState({ active: true, mode: 'curved', startAnchor: null, points: [] })}
                            >
                                Curved
                            </button>
                        </div>
                        {builderState.active && (
                            <p className="text-[10px] text-neutral-400 mt-1">
                                {builderState.startAnchor
                                    ? "Click empty space to add points, or anchor to finish."
                                    : "Click 1st anchor to start."}
                            </p>
                        )}
                    </div>
                </div>

                {/* Add New Apparatus */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                    <label className="text-sm font-semibold text-green-400">Add Apparatus</label>
                    <div className="flex gap-2">
                        <select
                            className="bg-black/40 border border-white/20 rounded p-1 text-xs flex-1"
                            value={selectedModelToAdd}
                            onChange={(e) => setSelectedModelToAdd(e.target.value)}
                        >
                            {/* Filter duplicates/aliases if needed, but for now map all */}
                            {Object.keys(APPARATUS_MAP).map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => handleAddItem(selectedModelToAdd)}
                            className="bg-green-700/50 hover:bg-green-600 text-white px-3 rounded text-xs"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Apparatus List (Flat) */}
                <div className="flex flex-col gap-2 mt-4">
                    <h2 className="text-sm font-semibold text-neutral-300">Scene Objects</h2>
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                        {currentReaction?.apparatus?.map(item => (
                            <div
                                key={item.id}
                                className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedApparatusId === item.id ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                onClick={() => setSelectedApparatusId(item.id)}
                            >
                                <span className="text-xs font-mono truncate w-1/2">{item.id}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-neutral-500 truncate">{item.model}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Item Properties */}
                {selectedApparatusId && currentReaction && (() => {
                    const item = currentReaction.apparatus.find(a => a.id === selectedApparatusId);
                    if (!item) return null;
                    return (
                        <div className="flex flex-col gap-2 mt-4 border-t border-white/10 pt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-orange-400">Properties: {item.id}</h3>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-900/30 rounded border border-red-900/50"
                                >
                                    Delete
                                </button>
                            </div>

                            {/* SPECIAL CONTROLS */}
                            {item.model === 'Tongs' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-xs text-yellow-300">Tongs Opening</label>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={item.angle || 0}
                                        onChange={(e) => handleUpdateItem(item.id, { angle: parseFloat(e.target.value) })}
                                        className="w-full accent-yellow-400"
                                    />
                                </div>
                            )}

                            {item.model === 'Clamp' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-xs text-blue-300">Clamp Opening</label>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={item.angle || 0}
                                        onChange={(e) => handleUpdateItem(item.id, { angle: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-400"
                                    />
                                    <label className="text-xs text-blue-300 mt-1">Head Rotation</label>
                                    <input
                                        type="range"
                                        min={-Math.PI} max={Math.PI} step="0.1"
                                        value={item.headAngle || 0}
                                        onChange={(e) => handleUpdateItem(item.id, { headAngle: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-400"
                                    />
                                    <label className="text-xs text-blue-300 mt-1">Stand Rotation</label>
                                    <input
                                        type="range"
                                        min={-Math.PI} max={Math.PI} step="0.05"
                                        value={item.rotation ? item.rotation[1] : 0}
                                        onChange={(e) => {
                                            const newY = parseFloat(e.target.value);
                                            const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                            const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));

                                            // Pivot Offset (Local)
                                            // The clamp loop is at x = -1.65
                                            const pivotOffsetLocal = new THREE.Vector3(-1.65, 0, 0);

                                            // 1. Calculate World Pivot Position from Current State
                                            const currentOffsetWorld = pivotOffsetLocal.clone().applyEuler(currentRot);
                                            const pivotWorld = currentPos.clone().add(currentOffsetWorld);

                                            // 2. Calculate New Position based on New Rotation
                                            const newRotEuler = new THREE.Euler(currentRot.x, newY, currentRot.z);
                                            const newOffsetWorld = pivotOffsetLocal.clone().applyEuler(newRotEuler);

                                            // NewPos = PivotWorld - NewOffsetWorld
                                            const newPos = pivotWorld.clone().sub(newOffsetWorld);

                                            handleUpdateItem(item.id, {
                                                rotation: [currentRot.x, newY, currentRot.z],
                                                position: [newPos.x, newPos.y, newPos.z]
                                            });
                                        }}
                                        className="w-full accent-blue-400"
                                    />
                                    <label className="text-xs text-blue-300 mt-1">Vertical Position</label>
                                    <input
                                        type="range"
                                        min="0.5" max="10" step="0.1"
                                        value={item.position ? item.position[1] : 1}
                                        onChange={(e) => {
                                            const newY = parseFloat(e.target.value);
                                            const currentPos = item.position || [0, 0, 0];
                                            handleUpdateItem(item.id, { position: [currentPos[0], newY, currentPos[2]] });
                                        }}
                                        className="w-full accent-blue-400"
                                    />
                                    <label className="text-xs text-blue-300 mt-1">Clamp Size</label>
                                    <input
                                        type="range"
                                        min="0.5" max="2" step="0.1"
                                        value={item.size || 1}
                                        onChange={(e) => handleUpdateItem(item.id, { size: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-400"
                                    />
                                </div>
                            )}

                            {item.model === 'BunsenBurner' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-xs text-orange-300">Flame Control</label>
                                    <button
                                        onClick={() => handleUpdateItem(item.id, { isOn: !item.isOn })}
                                        className={`w-full py-1 text-xs rounded font-bold ${item.isOn ? 'bg-orange-600 text-white' : 'bg-neutral-700 text-neutral-400'}`}
                                    >
                                        {item.isOn ? 'EXTINGUISH FLAME' : 'IGNITE FLAME'}
                                    </button>
                                </div>
                            )}

                            {item.model === 'GasJar' && (
                                <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-blue-300">Lid Attached</label>
                                        <input
                                            type="checkbox"
                                            checked={item.hasLid !== false}
                                            onChange={(e) => handleUpdateItem(item.id, { hasLid: e.target.checked })}
                                            className="accent-blue-500"
                                        />
                                    </div>
                                    {(item.hasLid !== false) && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-blue-300">Holes in Lid: {item.holeCount || 0}</label>
                                            <input
                                                type="range"
                                                min="0" max="4" step="1"
                                                value={item.holeCount || 0}
                                                onChange={(e) => handleUpdateItem(item.id, { holeCount: parseInt(e.target.value) })}
                                                className="w-full accent-blue-400"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {item.model === 'RubberCork' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-xs text-orange-300">Holes: {item.holes || 1}</label>
                                    <input
                                        type="range"
                                        min="1" max="3" step="1"
                                        value={item.holes || 1}
                                        onChange={(e) => handleUpdateItem(item.id, { holes: parseInt(e.target.value) })}
                                        className="w-full accent-orange-400"
                                    />
                                </div>
                            )}

                            {item.model === 'RetortStand' && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <label className="text-xs text-blue-300">Rod Height: {item.height || 5}</label>
                                    <input
                                        type="range"
                                        min="2" max="10" step="0.5"
                                        value={item.height || 5}
                                        onChange={(e) => handleUpdateItem(item.id, { height: parseFloat(e.target.value) })}
                                        className="w-full accent-blue-400"
                                    />
                                </div>
                            )}

                            {item.model === 'TripodStand' && (
                                <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-blue-300">Height: {item.height || 3.0}</label>
                                        <input
                                            type="range"
                                            min="2.0" max="5.0" step="0.1"
                                            value={item.height || 3.0}
                                            onChange={(e) => handleUpdateItem(item.id, { height: parseFloat(e.target.value) })}
                                            className="w-full accent-blue-400"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-blue-300">Leg Angle: {((item.legAngle || 0.15) * 180 / Math.PI).toFixed(0)}°</label>
                                        <input
                                            type="range"
                                            min="0" max="0.5" step="0.01"
                                            value={item.legAngle || 0.15}
                                            onChange={(e) => handleUpdateItem(item.id, { legAngle: parseFloat(e.target.value) })}
                                            className="w-full accent-blue-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {item.model === 'DeliveryTube' && (
                                <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">

                                    {/* LOCK STRAIGHT / LENGTH CONTROLS */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-blue-300">Lock Straight</label>
                                        <input
                                            type="checkbox"
                                            checked={item.isLockedStraight || false}
                                            onChange={(e) => {
                                                const isLocked = e.target.checked;
                                                let newPoints = item.points || [[0, 0, 0], [0, 1, 0]];

                                                if (isLocked) {
                                                    // Force 2 points (Start and End)
                                                    if (newPoints.length > 2) {
                                                        newPoints = [newPoints[0], newPoints[newPoints.length - 1]];
                                                    }
                                                    // Turn off point editing mode if locking
                                                    handleUpdateItem(item.id, {
                                                        isLockedStraight: isLocked,
                                                        points: newPoints,
                                                        isEditingPoints: false,
                                                        selectedPointIndices: []
                                                    });
                                                } else {
                                                    handleUpdateItem(item.id, { isLockedStraight: isLocked });
                                                }
                                            }}
                                            className="accent-blue-500"
                                        />
                                    </div>

                                    {item.isLockedStraight && (
                                        <div className="flex flex-col gap-1 bg-white/5 p-2 rounded border border-white/10">
                                            <p className="text-[10px] text-neutral-400 text-center mb-1">Length Adjustments</p>

                                            {/* Helper Function for Entension */}
                                            {(() => {
                                                const applyExtension = (side, amount) => {
                                                    const points = item.points || [[0, 0, 0], [0, 1, 0]];
                                                    if (points.length < 2) return;

                                                    const p0 = new THREE.Vector3(...points[0]);
                                                    const p1 = new THREE.Vector3(...points[points.length - 1]);
                                                    const dir = new THREE.Vector3().subVectors(p1, p0).normalize();

                                                    if (side === 'start') {
                                                        // Extend start means moving P0 away from P1 (negative dir)
                                                        // amount > 0 means extend (longer), so move -dir
                                                        p0.addScaledVector(dir, -amount);
                                                    } else {
                                                        // Extend end means moving P1 away from P0 (positive dir)
                                                        p1.addScaledVector(dir, amount);
                                                    }

                                                    const newPoints = [p0.toArray(), p1.toArray()];
                                                    handleUpdateItem(item.id, { points: newPoints });
                                                };

                                                return (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                                                            <span className="text-[10px] text-cyan-300">Start</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => applyExtension('start', -0.05)} className="px-2 bg-white/10 hover:bg-white/20 rounded text-[10px]">Shorten</button>
                                                                <button onClick={() => applyExtension('start', 0.05)} className="px-2 bg-cyan-900/50 hover:bg-cyan-900/80 rounded text-[10px]">Extend</button>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                                                            <span className="text-[10px] text-cyan-300">End</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => applyExtension('end', -0.05)} className="px-2 bg-white/10 hover:bg-white/20 rounded text-[10px]">Shorten</button>
                                                                <button onClick={() => applyExtension('end', 0.05)} className="px-2 bg-cyan-900/50 hover:bg-cyan-900/80 rounded text-[10px]">Extend</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {!item.isLockedStraight && (
                                        <div className="flex items-center justify-between mt-1">
                                            <label className="text-xs text-green-300">Edit Shape</label>
                                            <button
                                                onClick={() => handleUpdateItem(item.id, { isEditingPoints: !item.isEditingPoints })}
                                                className={`px-2 py-1 text-[10px] rounded ${item.isEditingPoints ? 'bg-green-600 text-white' : 'bg-neutral-700'}`}
                                            >
                                                {item.isEditingPoints ? 'Done' : 'Edit'}
                                            </button>
                                        </div>
                                    )}

                                    {item.isEditingPoints && (
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] text-neutral-400">
                                                {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null
                                                    ? `Selected Point: ${item.selectedPointIndex}`
                                                    : "Select a point to edit/insert"}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const currentPoints = item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]];
                                                        const idx = item.selectedPointIndex;

                                                        // INSERT LOGIC
                                                        if (idx !== undefined && idx !== null && idx < currentPoints.length - 1) {
                                                            const p1 = currentPoints[idx];
                                                            const p2 = currentPoints[idx + 1];
                                                            // Midpoint
                                                            const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                                                            const newPoints = [...currentPoints];
                                                            newPoints.splice(idx + 1, 0, mid);
                                                            handleUpdateItem(item.id, { points: newPoints, selectedPointIndex: idx + 1 });
                                                        } else {
                                                            // APPEND LOGIC
                                                            const last = currentPoints[currentPoints.length - 1];
                                                            const secondLast = currentPoints[currentPoints.length - 2] || [0, 0, 0];
                                                            const dir = [last[0] - secondLast[0], last[1] - secondLast[1], last[2] - secondLast[2]];
                                                            const newPoint = [last[0] + (dir[0] || 0.1), last[1] + (dir[1] || 0.1), last[2] + (dir[2] || 0)];
                                                            handleUpdateItem(item.id, { points: [...currentPoints, newPoint], selectedPointIndex: currentPoints.length });
                                                        }
                                                    }}
                                                    className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1 rounded"
                                                >
                                                    {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null && item.selectedPointIndex < (item.points?.length - 1)
                                                        ? "+ Insert Point"
                                                        : "+ Add Point"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const currentPoints = item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]];
                                                        if (currentPoints.length <= 2) return;

                                                        const idx = item.selectedPointIndex;
                                                        if (idx !== undefined && idx !== null) {
                                                            // Remove selected
                                                            const newPoints = currentPoints.filter((_, i) => i !== idx);
                                                            handleUpdateItem(item.id, { points: newPoints, selectedPointIndex: null });
                                                        } else {
                                                            // Remove last
                                                            const newPoints = currentPoints.slice(0, -1);
                                                            handleUpdateItem(item.id, { points: newPoints });
                                                        }
                                                    }}
                                                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-[10px] py-1 rounded border border-red-900/50"
                                                >
                                                    {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null ? "- Remove Selected" : "- Remove Last"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* No Parent Control anymore */}

                            <div className="grid grid-cols-3 gap-1 text-center mt-2">
                                <span className="text-[10px]">X</span>
                                <span className="text-[10px]">Y</span>
                                <span className="text-[10px]">Z</span>

                                {/* Manual Input for Precise control */}
                                {['x', 'y', 'z'].map((axis, i) => (
                                    <input
                                        key={axis}
                                        type="number"
                                        step="0.1"
                                        className="bg-black/20 rounded px-1 text-xs w-full"
                                        value={item.position?.[i] || 0}
                                        onChange={(e) => {
                                            const newPos = [...(item.position || [0, 0, 0])];
                                            newPos[i] = parseFloat(e.target.value);
                                            handleUpdateItem(item.id, { position: newPos });
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 mt-4 border-t border-white/10 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-purple-300">Anchors</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                // Add Custom Anchor
                                                const newId = `custom-${Date.now()}`;
                                                // Default position slightly offset
                                                const newAnchor = { id: newId, position: [0, 0.5, 0] };
                                                const currentCustoms = item.customAnchors || [];
                                                handleUpdateItem(item.id, { customAnchors: [...currentCustoms, newAnchor], isEditingAnchors: true });
                                            }}
                                            className="px-2 py-1 text-[10px] bg-purple-900/30 hover:bg-purple-900/50 rounded border border-purple-500/30"
                                        >
                                            + Add
                                        </button>
                                        <button
                                            onClick={() => handleUpdateItem(item.id, { isEditingAnchors: !item.isEditingAnchors })}
                                            className={`px-2 py-1 text-[10px] rounded ${item.isEditingAnchors ? 'bg-purple-600 text-white' : 'bg-neutral-700'}`}
                                        >
                                            {item.isEditingAnchors ? 'Done' : 'Edit'}
                                        </button>
                                    </div>
                                </div>
                                {item.isEditingAnchors && (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-neutral-400">Drag yellow spheres to move anchors.</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateItem(item.id, { anchorOverrides: {}, customAnchors: [] })}
                                                className="text-[10px] text-red-400 hover:text-red-300"
                                            >
                                                Reset All Anchors
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                <div className="mt-auto pt-4">
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setTubeBuilderState(prev => ({ ...prev, active: !prev.active, mode: 'straight' }))}
                            className={`flex-1 py-1 rounded text-xs ${builderState.active && builderState.mode !== 'wire' ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300'}`}
                        >
                            {builderState.active && builderState.mode !== 'wire' ? 'Cancel Tube' : 'Add Tube'}
                        </button>
                        <button
                            onClick={() => setTubeBuilderState(prev => ({ ...prev, active: !prev.active, mode: 'wire' }))}
                            className={`flex-1 py-1 rounded text-xs ${builderState.active && builderState.mode === 'wire' ? 'bg-red-600 text-white' : 'bg-neutral-700 text-neutral-300'}`}
                        >
                            {builderState.active && builderState.mode === 'wire' ? 'Cancel Wire' : 'Add Wire'}
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-green-600 hover:bg-green-500 text-white rounded py-2 font-semibold transition-colors"
                    >
                        Save Changes
                    </button>
                    {status && <p className="text-center text-xs mt-2 text-yellow-400">{status}</p>}
                </div>
            </div>

            {/* 3D Viewport */}
            <div className="flex-1 relative bg-gradient-to-br from-neutral-800 to-neutral-900">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                    <color attach="background" args={['#1a1a1a']} />

                    {/* Controls */}
                    <OrbitControls makeDefault />
                    <CameraController /> {/* Add Keyboard Navigation */}

                    <Grid infiniteGrid sectionColor="white" cellColor="#333" fadeDistance={30} position={[0, -0.01, 0]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <Environment preset="city" />

                    {/* Simple Floor */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                        <planeGeometry args={[50, 50]} />
                        <meshBasicMaterial color="#222" transparent opacity={0.5} />
                    </mesh>

                    {currentReaction && currentReaction.apparatus && currentReaction.apparatus.map(item => (
                        <ApparatusEditorItem
                            key={item.id}
                            item={item}
                            selectedId={selectedApparatusId}
                            onSelect={setSelectedApparatusId}
                            updateItem={handleUpdateItem}
                            onUpdateItems={handleUpdateItems}
                            transformMode={selectedApparatusId === item.id && !builderState.active ? transformMode : 'none'}
                            allItems={currentReaction.apparatus}
                            isBuilding={builderState.active}
                        />
                    ))}

                    {/* Smart Tube Builder Overlay */}
                    {builderState.active && currentReaction && (
                        <TubeBuilderTool
                            allItems={currentReaction.apparatus}
                            builderState={builderState}
                            setBuilderState={setTubeBuilderState}
                            onCreateTube={handleCreateSmartTube}
                        />
                    )}
                </Canvas>

                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded text-xs text-white/50 pointer-events-none">
                    <p>Left Click: Orbit</p>
                    <p>Right Click: Pan</p>
                    <p>Scroll: Zoom</p>
                    <p>W/A/S/D: Move Camera</p>
                    <p>Q/E: Up/Down</p>
                    <p>Click Object: Select</p>
                    <p>Drag Arrows/Rings: Transform</p>
                    {builderState.active && (
                        <p className="text-purple-400 mt-2 font-bold">MODE: TUBE BUILDER ({builderState.mode})</p>
                    )}
                </div>
            </div>
        </div>
    );
}
