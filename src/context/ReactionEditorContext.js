'use client';
// src/context/ReactionEditorContext.js

import React, { createContext, useContext, useState, useCallback } from 'react';

const ReactionEditorContext = createContext();

export const useReactionEditor = () => useContext(ReactionEditorContext);

export const ReactionEditorProvider = ({ children }) => {
    // Shared state across all engine editor phases
    const [selectedReactionId, setSelectedReactionId] = useState('new_reaction');

    const [script, setScript] = useState({
        atoms: [],
        bonds: [],
        groups: [],
        tracks: []
    });

    // --- ATOM ACTIONS ---

    const addAtom = useCallback((element, charge, position) => {
        setScript(prev => {
            // Generate simple ID like "C1", "O2" by finding the max existing suffix
            const existingIds = prev.atoms
                .filter(a => a.element === element)
                .map(a => parseInt(a.id.replace(element, ''), 10))
                .filter(n => !isNaN(n));
            const maxSuffix = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            const id = `${element}${maxSuffix + 1}`;

            return {
                ...prev,
                atoms: [...prev.atoms, { id, element, charge, startPos: position }]
            };
        });
    }, []);

    const updateAtomPosition = useCallback((id, newPosition) => {
        setScript(prev => ({
            ...prev,
            atoms: prev.atoms.map(atom =>
                atom.id === id ? { ...atom, startPos: newPosition } : atom
            )
        }));
    }, []);

    const updateAtomCharge = useCallback((id, newCharge) => {
        setScript(prev => ({
            ...prev,
            atoms: prev.atoms.map(atom =>
                atom.id === id ? { ...atom, charge: parseInt(newCharge) } : atom
            )
        }));
    }, []);

    const updateAllAtomPositions = useCallback((positionsMap) => {
        setScript(prev => ({
            ...prev,
            atoms: prev.atoms.map(atom => ({
                ...atom,
                startPos: positionsMap[atom.id] || atom.startPos
            }))
        }));
    }, []);

    const removeAtom = useCallback((id) => {
        setScript(prev => {
            const newAtoms = prev.atoms.filter(a => a.id !== id);
            const newBonds = prev.bonds.filter(b => b.from !== id && b.to !== id);

            // Clean up groups: remove atom from groups, and remove groups that are now empty (or < 2 atoms)
            let newGroups = prev.groups ? prev.groups.map(g => ({
                ...g,
                atomIds: g.atomIds.filter(aId => aId !== id)
            })).filter(g => g.atomIds.length > 0) : [];

            return {
                ...prev,
                atoms: newAtoms,
                bonds: newBonds,
                groups: newGroups
            };
        });
    }, []);

    // --- BOND ACTIONS ---

    const addBond = useCallback((fromId, toId, order) => {
        setScript(prev => {
            // Prevent duplicate bonds between same atoms
            const exists = prev.bonds.some(b =>
                (b.from === fromId && b.to === toId) ||
                (b.from === toId && b.to === fromId)
            );
            if (exists) return prev;

            const bondId = `B_${fromId}_${toId}`;
            return {
                ...prev,
                bonds: [...prev.bonds, { id: bondId, from: fromId, to: toId, order, color: "#ffffff" }]
            };
        });
    }, []);

    const removeBond = useCallback((id) => {
        setScript(prev => ({
            ...prev,
            bonds: prev.bonds.filter(b => b.id !== id)
        }));
    }, []);

    const updateBond = useCallback((id, newOrder) => {
        setScript(prev => ({
            ...prev,
            bonds: prev.bonds.map(b =>
                b.id === id ? { ...b, order: newOrder } : b
            )
        }));
    }, []);

    // --- GROUP ACTIONS ---

    const createGroup = useCallback((atomIds, charge) => {
        setScript(prev => {
            // Find max group id
            const existingIds = (prev.groups || [])
                .map(g => parseInt(g.id.replace('G', ''), 10))
                .filter(n => !isNaN(n));
            const maxSuffix = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            const groupId = `G${maxSuffix + 1}`;

            return {
                ...prev,
                groups: [...(prev.groups || []), { id: groupId, atomIds, charge }]
            };
        });
    }, []);

    const removeGroup = useCallback((id) => {
        setScript(prev => ({
            ...prev,
            groups: (prev.groups || []).filter(g => g.id !== id)
        }));
    }, []);

    const updateGroupCharge = useCallback((id, newCharge) => {
        setScript(prev => ({
            ...prev,
            groups: (prev.groups || []).map(g =>
                g.id === id ? { ...g, charge: newCharge } : g
            )
        }));
    }, []);

    // --- TIMELINE TRACK ACTIONS ---

    const updateTracks = useCallback((newTracks) => {
        setScript(prev => ({
            ...prev,
            tracks: newTracks
        }));
    }, []);

    const addEventToTrack = useCallback((trackId, event) => {
        setScript(prev => {
            const currentTracks = prev.tracks || [];
            return {
                ...prev,
                tracks: currentTracks.map(t =>
                    t.id === trackId
                        ? { ...t, events: [...(t.events || []), event] }
                        : t
                )
            };
        });
    }, []);

    const removeEventFromTrack = useCallback((trackId, eventIndex) => {
        setScript(prev => {
            const currentTracks = prev.tracks || [];
            return {
                ...prev,
                tracks: currentTracks.map(t =>
                    t.id === trackId
                        ? { ...t, events: (t.events || []).filter((_, idx) => idx !== eventIndex) }
                        : t
                )
            };
        });
    }, []);

    const updateTrackPositions = useCallback((trackId, positionsMap) => {
        setScript(prev => {
            const currentTracks = prev.tracks || [];
            return {
                ...prev,
                tracks: currentTracks.map(t => {
                    if (t.id !== trackId) return t;
                    // Merge existing positions with new ones
                    const updatedPositions = { ...(t.targetPositions || {}) };
                    for (const [atomId, pos] of Object.entries(positionsMap)) {
                        updatedPositions[atomId] = pos;
                    }
                    return { ...t, targetPositions: updatedPositions };
                })
            };
        });
    }, []);

    // --- UTILS ---

    const clearScript = useCallback((force = false) => {
        if (force || confirm("Are you sure you want to clear the entire editor script?")) {
            setScript({ atoms: [], bonds: [], groups: [], tracks: [] });
        }
    }, []);

    const loadScript = useCallback((newScript) => {
        setScript(newScript);
    }, []);

    const value = {
        selectedReactionId,
        setSelectedReactionId,
        script,
        addAtom,
        updateAtomPosition,
        updateAtomCharge,
        updateAllAtomPositions,
        removeAtom,
        addBond,
        removeBond,
        updateBond,
        createGroup,
        removeGroup,
        updateGroupCharge,
        updateTracks,
        addEventToTrack,
        removeEventFromTrack,
        updateTrackPositions,
        clearScript,
        loadScript
    };

    return (
        <ReactionEditorContext.Provider value={value}>
            {children}
        </ReactionEditorContext.Provider>
    );
};
