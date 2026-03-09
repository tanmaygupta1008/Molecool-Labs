// src/utils/elementColors.js
import periodicTable from 'periodic-table';

// Standardized CPK colors for standard elements
// Extended with generated colors for all 118 elements based on category or fallback
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
    Unknown: { color: "#ff1493", radius: 0.5 } // Hot pink error state
};

// Generate missing elements lazily
let fullTableMap = null;

export const getElementData = (symbol) => {
    // 1. Exact manual override
    if (baseColors[symbol]) return baseColors[symbol];

    // 2. Build map and procedurally assign if missing
    if (!fullTableMap) {
        fullTableMap = { ...baseColors };
        const allElements = periodicTable.all();

        allElements.forEach(el => {
            if (!fullTableMap[el.symbol]) {
                let color = "#aaaaaa"; // Default metal/transition metal grey

                // Try to map colors based on "groupBlock" (e.g. "alkali metal")
                if (el.groupBlock === "noble gas") color = "#00ffff"; // Cyan gases
                if (el.groupBlock === "halogen") color = "#00ff00"; // Green halogens
                if (el.groupBlock === "alkali metal") color = "#8a2be2"; // Purple-ish
                if (el.groupBlock === "alkaline earth metal") color = "#006400"; // Dark green
                if (el.groupBlock === "metalloid") color = "#b8860b"; // Goldenrod
                if (el.groupBlock === "nonmetal") color = "#ff69b4"; // Hot pink
                if (el.groupBlock === "lanthanoid" || el.groupBlock === "actinoid") color = "#ff8c00"; // Dark orange

                // Calculate visual radius relative to atomic radius, clamped
                // e.g., Helium is 31 pm, Cesium is 298 pm
                let calculatedRadius = 0.5;
                if (el.atomicRadius) {
                    // scale 30pm - 300pm to roughly 0.3 - 0.8 scale
                    calculatedRadius = Math.max(0.3, Math.min(0.8, (el.atomicRadius / 300) * 0.8));
                }

                fullTableMap[el.symbol] = {
                    color: color,
                    radius: calculatedRadius
                };
            }
        });
    }

    // 3. Return from full map, or fallback to exact unknown
    return fullTableMap[symbol] || baseColors["Unknown"];
};

// Export sorted list for dropdowns
export const getAllElementsList = () => {
    return periodicTable.all().map(el => ({
        symbol: el.symbol,
        name: el.name,
        number: el.atomicNumber
    })).sort((a, b) => a.number - b.number);
};
