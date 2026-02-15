// src/utils/periodic-trends.js

export const TRENDS = {
    atomic_radius: {
        id: 'atomic_radius',
        label: 'Atomic Radius',
        unit: 'pm',
        description: 'Distance from the nucleus to the outermost electron.',
        colorStart: '#f7fee7', // Light Lime
        colorEnd: '#14532d',   // Dark Green
        min: 25,
        max: 298
    },
    ionization_energy: {
        id: 'ionization_energy',
        label: 'Ionization Energy',
        unit: 'kJ/mol',
        description: 'Energy required to remove an electron from the atom.',
        colorStart: '#fff7ed', // Light Orange
        colorEnd: '#7c2d12',   // Dark Orange/Brown
        min: 300,
        max: 2500
    },
    electronegativity: {
        id: 'electronegativity',
        label: 'Electronegativity',
        unit: '',
        description: 'Tendency of an atom to attract a bonding pair of electrons.',
        colorStart: '#f0f9ff', // Light Blue
        colorEnd: '#1e3a8a',   // Dark Blue
        min: 0.7,
        max: 4.0
    },
    melting_point: {
        id: 'melting_point',
        label: 'Melting Point',
        unit: 'K',
        description: 'Temperature at which the element changes from solid to liquid.',
        colorStart: '#fafafa', // White/Gray
        colorEnd: '#b91c1c',   // Red
        min: 0,
        max: 4000
    }
};

/**
 * Calculates a color between start and end based on value's position between min and max.
 * @param {number} value - The value of the trend for the element.
 * @param {string} trendId - The ID of the trend configuration.
 * @returns {string} - Hex color code.
 */
export const getTrendColor = (value, trendId) => {
    const trend = TRENDS[trendId];
    if (!trend || value === null || value === undefined) return null;

    const min = trend.min;
    const max = trend.max;

    // Clamp value
    const clampedValue = Math.max(min, Math.min(max, value));

    // Normalize 0 to 1
    const ratio = (clampedValue - min) / (max - min);

    // Interpolate color
    return interpolateColor(trend.colorStart, trend.colorEnd, ratio);
};

// Helper to interpolate hex colors
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) {
        factor = 0.5;
    }
    var result = result || "#";
    var r1 = parseInt(color1.substring(1, 3), 16);
    var g1 = parseInt(color1.substring(3, 5), 16);
    var b1 = parseInt(color1.substring(5, 7), 16);

    var r2 = parseInt(color2.substring(1, 3), 16);
    var g2 = parseInt(color2.substring(3, 5), 16);
    var b2 = parseInt(color2.substring(5, 7), 16);

    var r = Math.round(r1 + factor * (r2 - r1));
    var g = Math.round(g1 + factor * (g2 - g1));
    var b = Math.round(b1 + factor * (b2 - b1));

    var r_hex = r.toString(16).padStart(2, '0');
    var g_hex = g.toString(16).padStart(2, '0');
    var b_hex = b.toString(16).padStart(2, '0');

    return "#" + r_hex + g_hex + b_hex;
}
