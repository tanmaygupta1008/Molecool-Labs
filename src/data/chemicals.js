export const CHEMICALS = [
    // --- Solvents & Liquids ---
    { id: 'water', name: 'Water', formula: 'H₂O', molecularWeight: 18.015, defaultState: 'l', density: 1.0, color: '#aaddff' },
    { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', molecularWeight: 46.069, defaultState: 'l', density: 0.789, color: '#ffffff' },
    { id: 'methanol', name: 'Methanol', formula: 'CH₃OH', molecularWeight: 32.04, defaultState: 'l', density: 0.792, color: '#ffffff' },
    { id: 'acetone', name: 'Acetone', formula: 'C₃H₆O', molecularWeight: 58.08, defaultState: 'l', density: 0.784, color: '#ffffff' },
    { id: 'hexane', name: 'Hexane', formula: 'C₆H₁₄', molecularWeight: 86.18, defaultState: 'l', density: 0.655, color: '#ffffff' },
    
    // --- Acids ---
    { id: 'hcl', name: 'Hydrochloric Acid', formula: 'HCl', molecularWeight: 36.46, defaultState: 'aq', density: 1.18, color: '#ffffdd' },
    { id: 'h2so4', name: 'Sulfuric Acid', formula: 'H₂SO₄', molecularWeight: 98.079, defaultState: 'aq', density: 1.84, color: '#ffffff' },
    { id: 'hno3', name: 'Nitric Acid', formula: 'HNO₃', molecularWeight: 63.01, defaultState: 'aq', density: 1.51, color: '#ffffcc' },
    { id: 'acetic_acid', name: 'Acetic Acid', formula: 'CH₃COOH', molecularWeight: 60.052, defaultState: 'aq', density: 1.05, color: '#ffffff' },
    { id: 'h3po4', name: 'Phosphoric Acid', formula: 'H₃PO₄', molecularWeight: 97.994, defaultState: 'aq', density: 1.88, color: '#ffffff' },

    // --- Bases ---
    { id: 'naoh', name: 'Sodium Hydroxide', formula: 'NaOH', molecularWeight: 39.997, defaultState: 'aq', density: 2.13, color: '#ffffff' },
    { id: 'koh', name: 'Potassium Hydroxide', formula: 'KOH', molecularWeight: 56.105, defaultState: 'aq', density: 2.12, color: '#ffffff' },
    { id: 'nh3_aq', name: 'Ammonia Solution', formula: 'NH₃(aq)', molecularWeight: 17.031, defaultState: 'aq', density: 0.90, color: '#ffffff' },
    { id: 'caoh2', name: 'Calcium Hydroxide', formula: 'Ca(OH)₂', molecularWeight: 74.093, defaultState: 'aq', density: 2.21, color: '#ffffff' },

    // --- Metals (Solids) ---
    { id: 'magnesium', name: 'Magnesium Ribbon', formula: 'Mg', molecularWeight: 24.305, defaultState: 's', density: 1.738, color: '#c0c0c0' },
    { id: 'zinc', name: 'Zinc Granules', formula: 'Zn', molecularWeight: 65.38, defaultState: 's', density: 7.14, color: '#a9a9a9' },
    { id: 'sodium', name: 'Sodium Metal', formula: 'Na', molecularWeight: 22.99, defaultState: 's', density: 0.968, color: '#e0e0e0' },
    { id: 'potassium', name: 'Potassium Metal', formula: 'K', molecularWeight: 39.098, defaultState: 's', density: 0.862, color: '#e0e0e0' },
    { id: 'iron', name: 'Iron Filings', formula: 'Fe', molecularWeight: 55.845, defaultState: 's', density: 7.874, color: '#808080' },
    { id: 'copper', name: 'Copper Turnings', formula: 'Cu', molecularWeight: 63.546, defaultState: 's', density: 8.96, color: '#b87333' },
    { id: 'silver', name: 'Silver', formula: 'Ag', molecularWeight: 107.868, defaultState: 's', density: 10.49, color: '#c0c0c0' },
    { id: 'aluminum', name: 'Aluminum Foil', formula: 'Al', molecularWeight: 26.982, defaultState: 's', density: 2.70, color: '#a0a0a4' },
    { id: 'lead', name: 'Lead', formula: 'Pb', molecularWeight: 207.2, defaultState: 's', density: 11.34, color: '#7a7a7a' },

    // --- Salts & Compounds (Solids & Aqueous) ---
    { id: 'nacl', name: 'Sodium Chloride', formula: 'NaCl', molecularWeight: 58.44, defaultState: 'aq', density: 2.16, color: '#ffffff' },
    { id: 'agno3', name: 'Silver Nitrate', formula: 'AgNO₃', molecularWeight: 169.87, defaultState: 'aq', density: 4.35, color: '#ffffff' },
    { id: 'caco3', name: 'Calcium Carbonate', formula: 'CaCO₃', molecularWeight: 100.087, defaultState: 's', density: 2.71, color: '#ffffff' },
    { id: 'cuso4', name: 'Copper(II) Sulfate', formula: 'CuSO₄', molecularWeight: 159.609, defaultState: 'aq', density: 3.6, color: '#0000ff' },
    { id: 'nh4cl', name: 'Ammonium Chloride', formula: 'NH₄Cl', molecularWeight: 53.49, defaultState: 's', density: 1.527, color: '#ffffff' },
    { id: 'na2co3', name: 'Sodium Carbonate', formula: 'Na₂CO₃', molecularWeight: 105.988, defaultState: 'aq', density: 2.54, color: '#ffffff' },
    { id: 'nahco3', name: 'Sodium Bicarbonate', formula: 'NaHCO₃', molecularWeight: 84.007, defaultState: 's', density: 2.20, color: '#ffffff' },
    { id: 'pbno32', name: 'Lead(II) Nitrate', formula: 'Pb(NO₃)₂', molecularWeight: 331.2, defaultState: 'aq', density: 4.53, color: '#ffffff' },
    { id: 'ki', name: 'Potassium Iodide', formula: 'KI', molecularWeight: 166.0028, defaultState: 'aq', density: 3.12, color: '#ffffff' },
    { id: 'kmn04', name: 'Potassium Permanganate', formula: 'KMnO₄', molecularWeight: 158.034, defaultState: 'aq', density: 2.70, color: '#800080' },
    { id: 'k2cr2o7', name: 'Potassium Dichromate', formula: 'K₂Cr₂O7', molecularWeight: 294.185, defaultState: 'aq', density: 2.68, color: '#ff8c00' },
    { id: 'bacl2', name: 'Barium Chloride', formula: 'BaCl₂', molecularWeight: 208.23, defaultState: 'aq', density: 3.86, color: '#ffffff' },
    { id: 'feso4', name: 'Iron(II) Sulfate', formula: 'FeSO₄', molecularWeight: 151.908, defaultState: 'aq', density: 2.84, color: '#90ee90' },
    { id: 'mgso4', name: 'Magnesium Sulfate', formula: 'MgSO₄', molecularWeight: 120.366, defaultState: 'aq', density: 2.66, color: '#ffffff' },
    { id: 'cacl2', name: 'Calcium Chloride', formula: 'CaCl₂', molecularWeight: 110.98, defaultState: 's', density: 2.15, color: '#ffffff' },
    { id: 'kcl', name: 'Potassium Chloride', formula: 'KCl', molecularWeight: 74.55, defaultState: 'aq', density: 1.98, color: '#ffffff' },

    // --- Gases ---
    { id: 'oxygen', name: 'Oxygen', formula: 'O₂', molecularWeight: 31.999, defaultState: 'g', density: 0.001429, color: '#ffffff' },
    { id: 'hydrogen', name: 'Hydrogen', formula: 'H₂', molecularWeight: 2.016, defaultState: 'g', density: 0.00008988, color: '#ffffff' },
    { id: 'nitrogengas', name: 'Nitrogen', formula: 'N₂', molecularWeight: 28.014, defaultState: 'g', density: 0.00125, color: '#ffffff' },
    { id: 'carbondioxide', name: 'Carbon Dioxide', formula: 'CO₂', molecularWeight: 44.01, defaultState: 'g', density: 0.001977, color: '#ffffff' },
    { id: 'ch4', name: 'Methane', formula: 'CH₄', molecularWeight: 16.04, defaultState: 'g', density: 0.000656, color: '#ffffff' },
    { id: 'ammoniagas', name: 'Ammonia Gas', formula: 'NH₃', molecularWeight: 17.031, defaultState: 'g', density: 0.00073, color: '#ffffff' },
    { id: 'chlorine', name: 'Chlorine', formula: 'Cl₂', molecularWeight: 70.906, defaultState: 'g', density: 0.0032, color: '#ccffcc' },
    { id: 'so2', name: 'Sulfur Dioxide', formula: 'SO₂', molecularWeight: 64.066, defaultState: 'g', density: 0.0029, color: '#ffffff' },
    { id: 'no2', name: 'Nitrogen Dioxide', formula: 'NO₂', molecularWeight: 46.005, defaultState: 'g', density: 0.00188, color: '#cc5500' },
    { id: 'h2s', name: 'Hydrogen Sulfide', formula: 'H₂S', molecularWeight: 34.08, defaultState: 'g', density: 0.00136, color: '#ffffff' },
    
    // --- Indicators & Special ---
    { id: 'phenolphthalein', name: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', molecularWeight: 318.33, defaultState: 'aq', density: 1.0, color: '#ffffff' },
    { id: 'litmus_blue', name: 'Litmus Solution (Blue)', formula: 'Mix', molecularWeight: 300, defaultState: 'aq', density: 1.0, color: '#4169e1' },
    { id: 'litmus_red', name: 'Litmus Solution (Red)', formula: 'Mix', molecularWeight: 300, defaultState: 'aq', density: 1.0, color: '#ff4500' },
    { id: 'methyl_orange', name: 'Methyl Orange', formula: 'C₁₄H₁₄N₃NaO₃S', molecularWeight: 327.33, defaultState: 'aq', density: 1.0, color: '#ffa500' },
    { id: 'iodine', name: 'Iodine Solution', formula: 'I₂ (aq)', molecularWeight: 253.8, defaultState: 'aq', density: 1.0, color: '#8b4513' },
    { id: 'starch', name: 'Starch Solution', formula: '(C₆H₁₀O₅)ₙ', molecularWeight: 30000, defaultState: 'aq', density: 1.0, color: '#ffffff' },

    // --- Organics for Named Reactions ---
    { id: 'benzene', name: 'Benzene', formula: 'C₆H₆', molecularWeight: 78.11, defaultState: 'l', density: 0.876, color: '#ffffff' },
    { id: 'toluene', name: 'Toluene', formula: 'C₇H₈', molecularWeight: 92.14, defaultState: 'l', density: 0.867, color: '#ffffff' },
    { id: 'phenol', name: 'Phenol', formula: 'C₆H₅OH', molecularWeight: 94.11, defaultState: 's', density: 1.07, color: '#ffebcd' },
    { id: 'aniline', name: 'Aniline', formula: 'C₆H₅NH₂', molecularWeight: 93.13, defaultState: 'l', density: 1.02, color: '#ffffe0' },
    { id: 'benzaldehyde', name: 'Benzaldehyde', formula: 'C₆H₅CHO', molecularWeight: 106.12, defaultState: 'l', density: 1.04, color: '#ffffff' },
    { id: 'acetaldehyde', name: 'Acetaldehyde', formula: 'CH₃CHO', molecularWeight: 44.05, defaultState: 'l', density: 0.784, color: '#ffffff' },
    { id: 'cyclopentadiene', name: 'Cyclopentadiene', formula: 'C₅H₆', molecularWeight: 66.10, defaultState: 'l', density: 0.802, color: '#ffffff' },
    { id: 'maleic_anhydride', name: 'Maleic Anhydride', formula: 'C₄H₂O₃', molecularWeight: 98.06, defaultState: 's', density: 1.48, color: '#ffffff' },
    { id: 'bromobenzene', name: 'Bromobenzene', formula: 'C₆H₅Br', molecularWeight: 157.01, defaultState: 'l', density: 1.50, color: '#ffffff' },
    { id: 'diethyl_ether', name: 'Diethyl Ether', formula: '(C₂H₅)₂O', molecularWeight: 74.12, defaultState: 'l', density: 0.713, color: '#ffffff' },
    { id: 'dcm', name: 'Dichloromethane (DCM)', formula: 'CH₂Cl₂', molecularWeight: 84.93, defaultState: 'l', density: 1.33, color: '#ffffff' },
    { id: 'thf', name: 'Tetrahydrofuran (THF)', formula: 'C₄H₈O', molecularWeight: 72.11, defaultState: 'l', density: 0.889, color: '#ffffff' },
    { id: 'pyridine', name: 'Pyridine', formula: 'C₅H₅N', molecularWeight: 79.10, defaultState: 'l', density: 0.982, color: '#ffffff' },
    { id: 'ethyl_acetate', name: 'Ethyl Acetate', formula: 'CH₃COOC₂H₅', molecularWeight: 88.11, defaultState: 'l', density: 0.902, color: '#ffffff' },
    { id: 'acetyl_chloride', name: 'Acetyl Chloride', formula: 'CH₃COCl', molecularWeight: 78.50, defaultState: 'l', density: 1.10, color: '#ffffff' },
    { id: 'salicylic_acid', name: 'Salicylic Acid', formula: 'C₇H₆O₃', molecularWeight: 138.12, defaultState: 's', density: 1.44, color: '#ffffff' },
    { id: 'acetic_anhydride', name: 'Acetic Anhydride', formula: '(CH₃CO)₂O', molecularWeight: 102.09, defaultState: 'l', density: 1.08, color: '#ffffff' },

    // --- Key Inorganic Reagents (Oxidation/Reduction/Catalysts) ---
    { id: 'nabh4', name: 'Sodium Borohydride', formula: 'NaBH₄', molecularWeight: 37.83, defaultState: 's', density: 1.07, color: '#ffffff' },
    { id: 'lialh4', name: 'Lithium Aluminum Hydride', formula: 'LiAlH₄', molecularWeight: 37.95, defaultState: 's', density: 0.917, color: '#ffffff' },
    { id: 'alcl3', name: 'Aluminum Chloride', formula: 'AlCl₃', molecularWeight: 133.34, defaultState: 's', density: 2.48, color: '#ffffcc' },
    { id: 'fecl3', name: 'Iron(III) Chloride', formula: 'FeCl₃', molecularWeight: 162.20, defaultState: 'aq', density: 2.90, color: '#d2b48c' },
    { id: 'sn', name: 'Tin (Granules)', formula: 'Sn', molecularWeight: 118.71, defaultState: 's', density: 7.27, color: '#d3d4d5' },
    { id: 'h2o2', name: 'Hydrogen Peroxide (30%)', formula: 'H₂O₂', molecularWeight: 34.01, defaultState: 'aq', density: 1.11, color: '#ffffff' },
    { id: 'mno2', name: 'Manganese Dioxide', formula: 'MnO₂', molecularWeight: 86.94, defaultState: 's', density: 5.03, color: '#000000' },
    { id: 'nano2', name: 'Sodium Nitrite', formula: 'NaNO₂', molecularWeight: 69.00, defaultState: 's', density: 2.17, color: '#ffffff' },
    { id: 'naocl', name: 'Sodium Hypochlorite', formula: 'NaOCl', molecularWeight: 74.44, defaultState: 'aq', density: 1.11, color: '#ffffcc' },
    { id: 'br2_aq', name: 'Bromine Water', formula: 'Br₂ (aq)', molecularWeight: 159.8, defaultState: 'aq', density: 1.0, color: '#8b4513' },
    { id: 'kmno4_solid', name: 'Potassium Permanganate (Solid)', formula: 'KMnO₄', molecularWeight: 158.034, defaultState: 's', density: 2.70, color: '#4b0082' }
];
