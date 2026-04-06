// src/utils/elementColors.js
import periodicTable from 'periodic-table';

// Standardized CPK colors for standard elements
const baseColors = {
    H: { color: "#ffffff", radius: 0.25 },
    C: { color: "#222222", radius: 0.5 },
    N: { color: "#0000ff", radius: 0.45 },
    O: { color: "#ff0000", radius: 0.4 },
    F: { color: "#00ff00", radius: 0.4 },
    P: { color: "#ff8000", radius: 0.55 },
    S: { color: "#ffff00", radius: 0.6 },
    Cl: { color: "#00ff00", radius: 0.55 },
    Na: { color: "#aa66ff", radius: 0.65 },
    K: { color: "#8f40d4", radius: 0.7 },
    Ca: { color: "#3dff00", radius: 0.65 },
    Fe: { color: "#e06633", radius: 0.6 },
    Cu: { color: "#c88033", radius: 0.6 },
    Zn: { color: "#7d80b0", radius: 0.6 },
    Br: { color: "#a62929", radius: 0.6 },
    I: { color: "#940094", radius: 0.65 },
    Ag: { color: "#c0c0c0", radius: 0.65 },
    Au: { color: "#ffd123", radius: 0.65 },
    Unknown: { color: "#ff1493", radius: 0.5 }
};

let fullTableMap = null;

export const getElementData = (symbol) => {
    if (baseColors[symbol]) return baseColors[symbol];

    if (!fullTableMap) {
        fullTableMap = { ...baseColors };
        const allElements = periodicTable.all();

        allElements.forEach(el => {
            if (!fullTableMap[el.symbol]) {
                let color = "#aaaaaa";
                if (el.groupBlock === "noble gas") color = "#00ffff";
                if (el.groupBlock === "halogen") color = "#00ff00";
                if (el.groupBlock === "alkali metal") color = "#8a2be2";
                if (el.groupBlock === "alkaline earth metal") color = "#006400";
                if (el.groupBlock === "metalloid") color = "#b8860b";
                if (el.groupBlock === "nonmetal") color = "#ff69b4";
                if (el.groupBlock === "lanthanoid" || el.groupBlock === "actinoid") color = "#ff8c00";

                let calculatedRadius = 0.5;
                if (el.atomicRadius) {
                    calculatedRadius = Math.max(0.3, Math.min(0.8, (el.atomicRadius / 300) * 0.8));
                }

                fullTableMap[el.symbol] = { color, radius: calculatedRadius };
            }
        });
    }

    return fullTableMap[symbol] || baseColors["Unknown"];
};

export const getAllElementsList = () => {
    return periodicTable.all().map(el => ({
        symbol: el.symbol,
        name: el.name,
        number: el.atomicNumber
    })).sort((a, b) => a.number - b.number);
};

// =====================================================================
// PAULING ELECTRONEGATIVITY TABLE (Pauling Scale)
// =====================================================================
export const ELECTRONEGATIVITY = {
    H: 2.20, He: 0,
    Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Ne: 0,
    Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16, Ar: 0,
    K: 0.82, Ca: 1.00, Sc: 1.36, Ti: 1.54, V: 1.63, Cr: 1.66, Mn: 1.55,
    Fe: 1.83, Co: 1.88, Ni: 1.91, Cu: 1.90, Zn: 1.65, Ga: 1.81, Ge: 2.01,
    As: 2.18, Se: 2.55, Br: 2.96, Kr: 0,
    Rb: 0.82, Sr: 0.95, Y: 1.22, Zr: 1.33, Nb: 1.60, Mo: 2.16, Tc: 2.10,
    Ru: 2.20, Rh: 2.28, Pd: 2.20, Ag: 1.93, Cd: 1.69, In: 1.78, Sn: 1.96,
    Sb: 2.05, Te: 2.10, I: 2.66, Xe: 0,
    Cs: 0.79, Ba: 0.89, La: 1.10, Ce: 1.12, Pr: 1.13, Nd: 1.14, Sm: 1.17,
    Eu: 1.20, Gd: 1.20, Tb: 1.10, Dy: 1.22, Ho: 1.23, Er: 1.24, Tm: 1.25,
    Yb: 1.10, Lu: 1.27, Hf: 1.30, Ta: 1.50, W: 1.70, Re: 1.90, Os: 2.20,
    Ir: 2.20, Pt: 2.28, Au: 2.54, Hg: 2.00, Tl: 2.04, Pb: 2.33, Bi: 2.02,
    Po: 2.00, At: 2.20, Rn: 0,
    Fr: 0.70, Ra: 0.90, Ac: 1.10, Th: 1.30, Pa: 1.50, U: 1.38,
};

/**
 * Calculates relative partial charge scores for each atom in a molecule
 * using bond-by-bond electronegativity difference accumulation.
 *
 * Returns: { scores: { [atomId]: number }, mostPositive: atomId, mostNegative: atomId }
 * - Negative score  -> electron-rich  (δ-)
 * - Positive score  -> electron-poor  (δ+)
 */
export const calculatePartialCharges = (atoms, bonds) => {
    if (!atoms || atoms.length < 2 || !bonds || bonds.length === 0) return null;

    const scores = {};
    atoms.forEach(a => { scores[a.id] = 0; });

    bonds.forEach(bond => {
        const a1 = atoms.find(a => a.id === bond.from);
        const a2 = atoms.find(a => a.id === bond.to);
        if (!a1 || !a2) return;

        // Fall back to a neutral 2.0 if element not in table
        const en1 = ELECTRONEGATIVITY[a1.element] ?? 2.0;
        const en2 = ELECTRONEGATIVITY[a2.element] ?? 2.0;
        // Weight by bond order: double bonds polarise more
        const diff = (en2 - en1) * bond.order;

        // a1 loses electron density (becomes more δ+) if en2 > en1
        scores[a1.id] = (scores[a1.id] || 0) + diff;
        // a2 gains electron density (becomes more δ-)
        scores[a2.id] = (scores[a2.id] || 0) - diff;
    });

    const entries = Object.entries(scores);
    if (entries.length === 0) return null;

    const sorted = [...entries].sort((a, b) => a[1] - b[1]);
    const mostNegative = sorted[0][0];
    const mostPositive = sorted[sorted.length - 1][0];

    // Only highlight if there is a meaningful difference
    const range = sorted[sorted.length - 1][1] - sorted[0][1];
    if (range < 0.05) return null;

    return { scores, mostPositive, mostNegative };
};
