import { ELECTRONEGATIVITY } from './elementColors';

// Calculates effective electronegativity considering formal charges
// e.g. O- is very electropositive (donating) -> lowered EN. N+ is strongly withdrawing -> boosted EN.
export const getEffectiveEN = (atom) => {
    let en = ELECTRONEGATIVITY[atom.element] ?? 2.0;
    if (atom.charge) {
        en += atom.charge * 1.5; 
    }
    return en;
};

/**
 * Calculates Inductive Effect (+I / -I) vectors and magnitudes along bonds.
 * Represents electron withdrawal/donation through sigma bonds based on Electronegativity.
 */
export const calculateInductiveEffects = (atoms, bonds) => {
    if (!atoms || !bonds) return { vectors: [], deltas: {} };
    
    // 1. Build Adjacency List
    const adj = {};
    atoms.forEach(a => adj[a.id] = []);
    bonds.forEach(b => {
        adj[b.from].push(b.to);
        adj[b.to].push(b.from);
    });

    const bondPulls = {}; 
    const deltas = {};
    atoms.forEach(a => deltas[a.id] = 0);
    
    // 2. Initialize bond pulls with primary electronegativity differences
    bonds.forEach(bond => {
        const a1 = atoms.find(a => a.id === bond.from);
        const a2 = atoms.find(a => a.id === bond.to);
        const en1 = getEffectiveEN(a1);
        const en2 = getEffectiveEN(a2);
        const diff = en2 - en1;
        
        const key = bond.from < bond.to ? `${bond.from}-${bond.to}` : `${bond.to}-${bond.from}`;
        
        let pull = 0;
        if (bond.from < bond.to) pull = diff; 
        else pull = -diff;
        
        bondPulls[key] = pull;
    });

    // 3. Propagate strong dipoles
    const DECAY = 0.45; 
    const MAX_DISTANCE = 3; 
    const propagatedPulls = { ...bondPulls };

    bonds.forEach(bond => {
        const a1 = atoms.find(a => a.id === bond.from);
        const a2 = atoms.find(a => a.id === bond.to);
        const en1 = getEffectiveEN(a1);
        const en2 = getEffectiveEN(a2);
        const diff = en2 - en1;

        if (Math.abs(diff) >= 0.2) {
            const deficientId = diff > 0 ? a1.id : a2.id;
            const richId = diff > 0 ? a2.id : a1.id;
            const magnitude = Math.abs(diff);

            let queue = [{ current: deficientId, prev: richId, depth: 1, currentMag: magnitude }];
            
            while (queue.length > 0) {
                const { current, prev, depth, currentMag } = queue.shift();
                if (depth >= MAX_DISTANCE) continue;

                const inducedMag = currentMag * DECAY;
                if (inducedMag < 0.05) continue;

                adj[current].forEach(neighbor => {
                    const nAtom = atoms.find(a => a.id === neighbor);
                    const nEn = getEffectiveEN(nAtom);
                    const cAtom = atoms.find(a => a.id === current);
                    const cEn = getEffectiveEN(cAtom);

                    // CRITICAL FIX: Only pull from neighbors that are NOT strongly electronegative themselves!
                    // e.g. Carbon pulls from Hydrogen, but Carbon should NOT pull from another Chlorine.
                    if (neighbor !== prev && nEn <= cEn + 0.1) {
                        const key = neighbor < current ? `${neighbor}-${current}` : `${current}-${neighbor}`;
                        let flowToCurrent = inducedMag;
                        
                        if (neighbor < current) { 
                            propagatedPulls[key] = (propagatedPulls[key] || 0) + flowToCurrent;
                        } else { 
                            propagatedPulls[key] = (propagatedPulls[key] || 0) - flowToCurrent;
                        }

                        queue.push({ current: neighbor, prev: current, depth: depth + 1, currentMag: inducedMag });
                    }
                });
            }
        }
    });

    // 4. Reconstruct final vectors and cumulative deltas
    const vectors = [];
    Object.keys(propagatedPulls).forEach(key => {
        const [id1, id2] = key.split('-');
        const pull = propagatedPulls[key];
        
        if (Math.abs(pull) >= 0.05) {
            vectors.push({
                sourceId: id1,
                targetId: id2,
                diff: pull
            });
            // id1 loses electrons if pull > 0 (id1 -> id2 flow)
            // But an atom doesn't perfectly replenish itself via secondary pulls. 
            // We use a dampener on the delta gain so highly substituted atoms remain strongly positive.
            deltas[id1] += pull; 
            deltas[id2] -= pull; 
        }
    });

    return { vectors, deltas };
};

/**
 * Finds conjugated pi systems and Calculates Mesomeric (+M / -M) effect electron flow.
 */
export const calculateMesomericEffects = (atoms, bonds) => {
    if (!atoms || !bonds) return { clouds: [], pushingArrows: [], deltas: {} };

    const clouds = []; // Set of atom IDs in conjugation
    const pushingArrows = []; // { fromAtomId, toAtomId, flowType: "lone-to-pi" | "pi-to-pi" | "pi-to-atom" }
    const deltas = {}; 
    atoms.forEach(a => deltas[a.id] = 0);

    // 1. Build Adjacency List with bond orders
    const adj = {};
    atoms.forEach(a => adj[a.id] = []);
    bonds.forEach(b => {
        if(adj[b.from]) adj[b.from].push({ to: b.to, order: b.order });
        if(adj[b.to]) adj[b.to].push({ to: b.from, order: b.order });
    });

    // 2. Identify atoms that might be in a pi system (involved in double/triple bonds)
    const piAtoms = new Set();
    bonds.forEach(b => {
        if (b.order > 1) {
            piAtoms.add(b.from);
            piAtoms.add(b.to);
        }
    });

    // 3. Simple heuristic for finding conjugated groups:
    // BFS from a piAtom. Follow single bonds only if they lead to another piAtom or a +M heteroatom.
    const visited = new Set();
    const conjugatedSystems = [];

    const heteroAtomsWithLonePairs = new Set(['O', 'N', 'F', 'Cl', 'Br', 'I', 'S']);

    piAtoms.forEach(startAtomId => {
        if (visited.has(startAtomId)) return;
        const system = new Set();
        const queue = [startAtomId];

        while(queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId)) continue;
            
            visited.add(currentId);
            system.add(currentId);

            // Explore neighbors
            if (adj[currentId]) {
                adj[currentId].forEach(neighbor => {
                    const nId = neighbor.to;
                    const nElement = atoms.find(a => a.id === nId)?.element;
                    
                    // If neighbor is also a pi atom, it's part of the system
                    if (piAtoms.has(nId) && !visited.has(nId)) {
                        queue.push(nId);
                    }
                    // If neighbor is a heteroatom with lone pairs (potential +M donor) attached via single bond
                    else if (neighbor.order === 1 && heteroAtomsWithLonePairs.has(nElement) && !visited.has(nId)) {
                        // It's part of the mesomeric system!
                        system.add(nId);
                        visited.add(nId); 
                        // Note: we don't queue it, because we don't want to traverse past the heteroatom unless it has other double bonds (which would make it a piAtom anyway)
                    }
                });
            }
        }
        if (system.size > 2) {
             conjugatedSystems.push(Array.from(system));
        }
    });

    // 4. Trace specific flows for curved arrows
    conjugatedSystems.forEach(systemIds => {
        const cloudSet = new Set(systemIds);
        clouds.push(systemIds);
        
        // Find Donors (+M): Heteroatoms with single bonds to pi-atoms
        systemIds.forEach(id => {
            const atom = atoms.find(a => a.id === id);
            if (!atom) return;

            // Is it a +M group?
            if (heteroAtomsWithLonePairs.has(atom.element) && !piAtoms.has(id)) {
                // Find adjacent pi-atom to push electrons towards
                const connectedPi = adj[id].find(n => piAtoms.has(n.to) && n.order === 1);
                if (connectedPi) {
                    pushingArrows.push({
                        fromCenter: id, 
                        toBond: true, // curved arrow from atom to bond
                        targetAtomPair: [id, connectedPi.to],
                        type: "+M"
                    });
                    deltas[id] += 1; // donor becomes more positive
                    // Pushes electrons... rough heuristic: push to alternating positions.
                    pushingArrows.push({
                        fromCenter: null,
                        fromBondPair: [id, connectedPi.to],
                        targetAtom: connectedPi.to, // Simplified for now.
                        type: "continue"
                    });
                }
            }

            // Is it a -M group? (Electron withdrawing multiple bond, e.g., C=O)
            if (piAtoms.has(id)) {
                const en = ELECTRONEGATIVITY[atom.element] ?? 2.0;
                // Double bonded to a LESS EN atom within the pi system? It pulls.
                const doubleBonds = adj[id].filter(n => n.order > 1 && piAtoms.has(n.to));
                doubleBonds.forEach(db => {
                    const dbAtom = atoms.find(a => a.id === db.to);
                    const dbEn = ELECTRONEGATIVITY[dbAtom?.element] ?? 2.0;
                    if (en > dbEn + 0.3) {
                        // The current atom 'id' is a -M acceptor! Pulling electrons.
                        pushingArrows.push({
                            fromCenter: null,
                            fromBondPair: [id, db.to],
                            targetAtom: id, // Pulling to itself
                            type: "-M"
                        });
                        deltas[id] -= 1; // Gets negative
                    }
                });
            }
        });
    });

    return { clouds, pushingArrows, deltas };
};
