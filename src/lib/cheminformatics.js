import { Vector3, Quaternion, Euler } from 'three';

// Heuristics to find basic functional groups for educational highlighting
export const findFunctionalGroups = (structure) => {
    const groups = [];
    if (!structure || !structure.atoms) return groups;

    const { atoms, bonds } = structure;

    // Build adjacency list
    const adj = Array.from({ length: atoms.length }, () => []);
    bonds.forEach((b, idx) => {
        adj[b.a].push({ to: b.b, bondIdx: idx });
        adj[b.b].push({ to: b.a, bondIdx: idx });
    });

    atoms.forEach((atom, i) => {
        // Find Alcohols (-OH)
        if (atom.element === 'O' && adj[i].length >= 1) {
            const hNeighbors = adj[i].filter(n => atoms[n.to].element === 'H');
            const cNeighbors = adj[i].filter(n => atoms[n.to].element === 'C');
            if (hNeighbors.length === 1 && cNeighbors.length >= 1) {
                // simple alcohol
                groups.push({
                    id: `alcohol-${i}`,
                    name: 'Alcohol (-OH)',
                    atoms: new Set([i, hNeighbors[0].to, cNeighbors[0].to]),
                    bonds: new Set([hNeighbors[0].bondIdx, cNeighbors[0].bondIdx])
                });
            }
        }

        // Find Ketones/Aldehydes (=O)
        // Note: we might not know double bonds from JSON easily, but we can guess by valency.
        // A generic carbonyl heuristic: O connected to only 1 C.
        if (atom.element === 'O' && adj[i].length === 1) {
            const CNode = adj[i][0];
            if (atoms[CNode.to].element === 'C') {
                groups.push({
                    id: `carbonyl-${i}`,
                    name: 'Carbonyl (C=O)',
                    atoms: new Set([i, CNode.to]),
                    bonds: new Set([CNode.bondIdx])
                });
            }
        }
        
        // Find Amines (-NH2)
        if (atom.element === 'N') {
            const hNeighbors = adj[i].filter(n => atoms[n.to].element === 'H');
            const otherNeighbors = adj[i].filter(n => atoms[n.to].element !== 'H');
            if (hNeighbors.length >= 1 && otherNeighbors.length >= 1) {
                const atomSet = new Set([i, ...hNeighbors.map(n=>n.to), otherNeighbors[0].to]);
                const bondSet = new Set([...hNeighbors.map(n=>n.bondIdx), otherNeighbors[0].bondIdx]);
                groups.push({
                    id: `amine-${i}`,
                    name: 'Amine',
                    atoms: atomSet,
                    bonds: bondSet
                });
            }
        }
    });

    return groups;
};

// Heuristics to place VSEPR Lone Pairs
export const calculateLonePairs = (structure) => {
    const lonePairs = [];
    if (!structure || !structure.atoms) return lonePairs;

    const { atoms, bonds } = structure;
    const DISTANCE = 0.6; // distance of lone pair from nucleus

    // Build adjacency list
    const adj = Array.from({ length: atoms.length }, () => []);
    bonds.forEach((b, idx) => {
        adj[b.a].push(b.b);
        adj[b.b].push(b.a);
    });

    atoms.forEach((atom, i) => {
        let expectedLPs = 0;
        if (atom.element === 'O') expectedLPs = 2; // e.g. H2O
        if (atom.element === 'N') expectedLPs = 1; // e.g. NH3
        if (['F', 'Cl', 'Br', 'I'].includes(atom.element)) expectedLPs = 3;
        
        // Carbonyl O might only have 1 bond in adjacency list but expect 2 lone pairs
        if (atom.element === 'O' && adj[i].length === 1) {
            expectedLPs = 2; 
        }

        if (expectedLPs > 0) {
            const center = new Vector3(atom.x, atom.y, atom.z);
            const neighborsList = adj[i].map(nIdx => new Vector3(atoms[nIdx].x, atoms[nIdx].y, atoms[nIdx].z));
            
            // Calculate a geometry basis
            if (neighborsList.length === 2) {
                // e.g. Water. Two bonds. LPs should be in the orthogonal plane.
                const v1 = new Vector3().subVectors(neighborsList[0], center).normalize();
                const v2 = new Vector3().subVectors(neighborsList[1], center).normalize();
                
                // Normal to the plane of the three atoms
                const normal = new Vector3().crossVectors(v1, v2).normalize();
                
                // Bisecting vector between bonds
                const bisect = new Vector3().addVectors(v1, v2).normalize();
                // The LPs should be opposite the bisect, spread outwards along the normal
                const opposite = bisect.multiplyScalar(-1);
                
                // create two LPs
                if (expectedLPs === 2) {
                    const lp1Dir = new Vector3().copy(opposite).applyAxisAngle(normal, Math.PI / 6).normalize();
                    const lp2Dir = new Vector3().copy(opposite).applyAxisAngle(normal, -Math.PI / 6).normalize();
                    lonePairs.push({ atomIndex: i, pos: center.clone().add(lp1Dir.multiplyScalar(DISTANCE)) });
                    lonePairs.push({ atomIndex: i, pos: center.clone().add(lp2Dir.multiplyScalar(DISTANCE)) });
                }
            } else if (neighborsList.length === 1) {
                // e.g. carbonyl O or HF. Only 1 bond known.
                const bondDir = new Vector3().subVectors(neighborsList[0], center).normalize();
                
                // Find two arbitrary orthogonal vectors
                const up = new Vector3(0, 1, 0);
                if (Math.abs(bondDir.y) > 0.9) up.set(1, 0, 0);
                const ortho1 = new Vector3().crossVectors(bondDir, up).normalize();
                const ortho2 = new Vector3().crossVectors(bondDir, ortho1).normalize();
                
                // Propeller shape pointing opposite to bond
                const centerDir = bondDir.clone().multiplyScalar(-1);
                
                if (expectedLPs === 2) {
                    const l1 = centerDir.clone().add(ortho1.clone().multiplyScalar(0.7)).normalize();
                    const l2 = centerDir.clone().add(ortho1.clone().multiplyScalar(-0.7)).normalize();
                    lonePairs.push({ atomIndex: i, pos: center.clone().add(l1.multiplyScalar(DISTANCE)) });
                    lonePairs.push({ atomIndex: i, pos: center.clone().add(l2.multiplyScalar(DISTANCE)) });
                } else if (expectedLPs === 3) {
                    // Spread 3 LPs around a circle 120deg apart
                    [0, 2*Math.PI/3, -2*Math.PI/3].forEach(angle => {
                        const dir = centerDir.clone()
                            .add(ortho1.clone().multiplyScalar(Math.cos(angle)))
                            .add(ortho2.clone().multiplyScalar(Math.sin(angle))).normalize();
                        lonePairs.push({ atomIndex: i, pos: center.clone().add(dir.multiplyScalar(DISTANCE)) });
                    });
                } else if (expectedLPs === 1) {
                    lonePairs.push({ atomIndex: i, pos: center.clone().add(centerDir.multiplyScalar(DISTANCE)) });
                }
            } else if (neighborsList.length === 3) {
                // e.g. Ammonia. 3 bonds.
                // Average the 3 bonds to find the "base" center, point opposite.
                const avg = new Vector3();
                neighborsList.forEach(n => avg.add(n));
                avg.divideScalar(3);
                const lpDir = new Vector3().subVectors(center, avg).normalize();
                lonePairs.push({ atomIndex: i, pos: center.clone().add(lpDir.multiplyScalar(DISTANCE)) });
            }
        }
    });

    return lonePairs;
};
