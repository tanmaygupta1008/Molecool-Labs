'use client';
// src/components/reactions/engine/ActionExecutor.jsx

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import AtomNode from './AtomNode';
import BondLine from './BondLine';
import VSEPRPhysicsEngine from './VSEPRPhysicsEngine';
import { getElementData } from '@/utils/elementColors';

/**
 * ActionExecutor
 * 
 * Takes the new Phase 2 script format (tracks and events)
 * and dynamically drives the VSEPR physics simulation based on the playback progress.
 */
const ActionExecutor = ({ script, progress }) => {
    // Dynamic state populated by VSEPR physics operating on the current bonds
    const [livePositions, setLivePositions] = useState({});

    // Calculate maximum duration of all tracks
    const totalDuration = useMemo(() => {
        let max = 2; // Default 2s minimum
        (script?.tracks || []).forEach(t => {
            const end = (parseFloat(t.startTime) || 0) + (parseFloat(t.duration) || 0);
            if (end > max) max = end;
        });
        return Math.max(max, 2); // Ensure at least 2s
    }, [script?.tracks]);

    // Current Time in seconds
    const currentTime = progress * totalDuration;

    // Compute derived state at currentTime (Apply events dynamically)
    const derivedScript = useMemo(() => {
        if (!script || !script.atoms) return { atoms: [], bonds: [] };

        let currentAtoms = script.atoms.map(a => ({ ...a, currentPos: livePositions[a.id] || [...a.startPos] }));
        let currentBonds = [...(script.bonds || [])];

        // Fold logical states up to currentTime
        (script.tracks || []).forEach(track => {
            const trackStart = parseFloat(track.startTime) || 0;
            const trackEnd = trackStart + (parseFloat(track.duration) || 0);

            // If time hasn't reached this track's start, skip
            if (currentTime < trackStart) return;

            // Track active/progress state
            const tTrack = Math.min(1, Math.max(0, (currentTime - trackStart) / (trackEnd - trackStart)));

            (track.events || []).forEach(ev => {
                if (ev.type === 'BREAK_BOND') {
                    if (tTrack >= 1) {
                        currentBonds = currentBonds.filter(b => b.id !== ev.bondId);
                    } else {
                        currentBonds = currentBonds.map(b => b.id === ev.bondId ? { ...b, state: 'breaking', progress: tTrack } : b);
                    }
                } else if (ev.type === 'FORM_BOND') {
                    if (tTrack >= 1) {
                        if (!currentBonds.some(b => b.id === `B_${ev.from}_${ev.to}`)) {
                            currentBonds.push({ id: `B_${ev.from}_${ev.to}`, from: ev.from, to: ev.to, order: ev.order, state: 'normal' });
                        }
                    } else {
                        if (!currentBonds.some(b => b.id === `B_${ev.from}_${ev.to}`)) {
                            currentBonds.push({ id: `B_${ev.from}_${ev.to}`, from: ev.from, to: ev.to, order: ev.order, state: 'forming', progress: tTrack });
                        }
                    }
                } else if (ev.type === 'UPDATE_CHARGE') {
                    if (tTrack > 0) {
                        currentAtoms = currentAtoms.map(a => a.id === ev.atomId ? { ...a, charge: ev.newCharge } : a);
                    }
                } else if (ev.type === 'UPDATE_BOND_ORDER') {
                    if (tTrack > 0) {
                        currentBonds = currentBonds.map(b => b.id === ev.bondId ? { ...b, order: ev.newOrder } : b);
                    }
                }
            });
        });

        return { atoms: currentAtoms, bonds: currentBonds };
    }, [script, currentTime, livePositions]);


    if (!script) return null;

    return (
        <group>
            {/* Run continuous physics simulation linearly throughout the playback timeline */}
            <VSEPRPhysicsEngine
                active={true}
                script={derivedScript}
                updateAllAtomPositions={setLivePositions}
            />

            {derivedScript.atoms.map(atom => (
                <AtomNode
                    key={`exec-atom-${atom.id}`}
                    position={atom.currentPos}
                    element={atom.element}
                    charge={atom.charge || 0}
                />
            ))}

            {derivedScript.bonds.map(bond => {
                const a1 = derivedScript.atoms.find(a => a.id === bond.from);
                const a2 = derivedScript.atoms.find(a => a.id === bond.to);
                if (!a1 || !a2) return null;

                const getChargeColor = (a) => (a.charge || 0) !== 0 ? getElementData(a.element).color : "#ffffff";

                return (
                    <BondLine
                        key={`exec-bond-${bond.id}`}
                        startPos={a1.currentPos}
                        endPos={a2.currentPos}
                        order={bond.order}
                        colorStart={getChargeColor(a1)}
                        colorEnd={getChargeColor(a2)}
                        state={bond.state || 'normal'}
                        progress={bond.progress !== undefined ? bond.progress : null}
                    />
                );
            })}
        </group>
    );
};

export default ActionExecutor;
