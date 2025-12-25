// src/lib/reactionsData.js

export const REACTIONS = {
  // --- 1. COMBUSTION OF METHANE (Existing) ---
  methane_combustion: {
    id: "methane_combustion",
    name: "Combustion of Methane",
    equation: "CH₄ + 2O₂ → CO₂ + 2H₂O",
    description: "Methane reacts with oxygen to produce carbon dioxide and water.",
    activationEnergy: 0.7, 
    macro: { color: "#ffaa00", intensity: 2.0, type: "fire" },
    atoms: [
      { element: "C", id: 0, startPos: [0, 0, 0], endPos: [0, 0, 0] },
      { element: "H", id: 1, startPos: [0.6, 0.6, 0.6], endPos: [2.5, 0.5, 0] }, 
      { element: "H", id: 2, startPos: [-0.6, -0.6, 0.6], endPos: [2.5, -0.5, 0] },
      { element: "H", id: 3, startPos: [0.6, -0.6, -0.6], endPos: [-2.5, 0.5, 0] },
      { element: "H", id: 4, startPos: [-0.6, 0.6, -0.6], endPos: [-2.5, -0.5, 0] },
      { element: "O", id: 5, startPos: [-3, 0, 0], endPos: [-1.2, 0, 0] },
      { element: "O", id: 6, startPos: [-3, 1, 0], endPos: [-3.2, 0, 0] },
      { element: "O", id: 7, startPos: [3, 0, 0], endPos: [1.2, 0, 0] },
      { element: "O", id: 8, startPos: [3, 1, 0], endPos: [3.2, 0, 0] },
    ]
  },

  // --- 2. HABER PROCESS (Ammonia Synthesis) ---
  haber_process: {
    id: "haber_process",
    name: "Haber Process",
    equation: "N₂ + 3H₂ ⇌ 2NH₃",
    description: "Industrial production of ammonia from nitrogen and hydrogen using an iron catalyst at high pressure.",
    activationEnergy: 0.85, // High activation energy (requires catalyst)
    macro: { color: "#aaddff", intensity: 0.8, type: "gas" }, // Blue/White gas flow
    atoms: [
      // Nitrogen Molecule (N2) - Splitting apart
      { element: "N", id: 0, startPos: [-1, 0, 0], endPos: [-2, 0, 0] }, // Becomes Left NH3
      { element: "N", id: 1, startPos: [1, 0, 0], endPos: [2, 0, 0] },   // Becomes Right NH3

      // Hydrogen Molecules (3H2) - Splitting and attaching to N
      // H2 Group 1
      { element: "H", id: 2, startPos: [-3, 2, 0], endPos: [-2.5, 0.8, 0] }, // To Left NH3
      { element: "H", id: 3, startPos: [-3, 2.5, 0], endPos: [-1.5, 0.8, 0] }, // To Left NH3
      
      // H2 Group 2
      { element: "H", id: 4, startPos: [0, 3, 0], endPos: [-2, -0.8, 0.5] }, // To Left NH3
      { element: "H", id: 5, startPos: [0, 3.5, 0], endPos: [2, -0.8, 0.5] }, // To Right NH3

      // H2 Group 3
      { element: "H", id: 6, startPos: [3, 2, 0], endPos: [2.5, 0.8, 0] }, // To Right NH3
      { element: "H", id: 7, startPos: [3, 2.5, 0], endPos: [1.5, 0.8, 0] }, // To Right NH3
    ]
  },

  // --- 3. CONTACT PROCESS (Sulfuric Acid Step 2: SO2 -> SO3) ---
  // Focusing on the key catalytic oxidation step (2SO2 + O2 -> 2SO3)
  contact_process: {
    id: "contact_process",
    name: "Contact Process (Oxidation)",
    equation: "2SO₂ + O₂ ⇌ 2SO₃",
    description: "Oxidation of sulfur dioxide to sulfur trioxide using Vanadium(V) oxide catalyst.",
    activationEnergy: 0.6,
    macro: { color: "#ffffaa", intensity: 0.5, type: "fumes" }, // Yellowish sulfur fumes
    atoms: [
      // SO2 Molecule Left
      { element: "S", id: 0, startPos: [-2, 0, 0], endPos: [-2, 0, 0] },
      { element: "O", id: 1, startPos: [-2.8, 0.5, 0], endPos: [-2.8, 0.5, 0] },
      { element: "O", id: 2, startPos: [-1.2, 0.5, 0], endPos: [-1.2, 0.5, 0] },

      // SO2 Molecule Right
      { element: "S", id: 3, startPos: [2, 0, 0], endPos: [2, 0, 0] },
      { element: "O", id: 4, startPos: [1.2, 0.5, 0], endPos: [1.2, 0.5, 0] },
      { element: "O", id: 5, startPos: [2.8, 0.5, 0], endPos: [2.8, 0.5, 0] },

      // O2 Molecule (Incoming Oxidizer) -> Splits to join SO2s
      { element: "O", id: 6, startPos: [0, 3, 0], endPos: [-2, -1.2, 0] }, // Joins Left SO2 -> SO3
      { element: "O", id: 7, startPos: [0, 3.5, 0], endPos: [2, -1.2, 0] },  // Joins Right SO2 -> SO3
    ]
  },

  // --- 4. SOLVAY PROCESS (Ammonia-Soda Process) ---
  // Focusing on the precipitation step: NaCl + NH4HCO3 -> NaHCO3 + NH4Cl
  solvay_process: {
    id: "solvay_process",
    name: "Solvay Process (Precipitation)",
    equation: "NaCl + NH₄HCO₃ → NaHCO₃ + NH₄Cl",
    description: "Formation of sodium bicarbonate precipitate by reacting brine with ammoniated brine and CO2.",
    activationEnergy: 0.4, // Lower barrier (ionic reaction in solution)
    macro: { color: "#ffffff", intensity: 0.3, type: "precipitate" }, // White cloudy precipitate
    atoms: [
      // Sodium Chloride (NaCl) - Dissociated/Approaching
      { element: "Na", id: 0, startPos: [-2, 1, 0], endPos: [-2, -1, 0] }, // Na moves to HCO3
      { element: "Cl", id: 1, startPos: [-3, 1, 0], endPos: [2, 1, 0] },   // Cl moves to NH4

      // Ammonium Bicarbonate (NH4)(HCO3) components
      // Ammonium (NH4) Group
      { element: "N", id: 2, startPos: [2, -1, 0], endPos: [2, 0, 0] }, // Center of NH4Cl
      { element: "H", id: 3, startPos: [1.5, -1.5, 0], endPos: [1.5, -0.5, 0] },
      { element: "H", id: 4, startPos: [2.5, -1.5, 0], endPos: [2.5, -0.5, 0] },
      { element: "H", id: 5, startPos: [1.5, -0.5, 0], endPos: [1.5, 0.5, 0] },
      { element: "H", id: 6, startPos: [2.5, -0.5, 0], endPos: [2.5, 0.5, 0] },

      // Bicarbonate (HCO3) Group
      { element: "C", id: 7, startPos: [-1, -2, 0], endPos: [-2, -2, 0] }, // Center of NaHCO3
      { element: "O", id: 8, startPos: [-0.5, -1.5, 0], endPos: [-1.5, -1.5, 0] },
      { element: "O", id: 9, startPos: [-1.5, -2.5, 0], endPos: [-2.5, -2.5, 0] },
      { element: "O", id: 10, startPos: [-0.5, -2.5, 0], endPos: [-1.5, -2.5, 0] },
      { element: "H", id: 11, startPos: [0, -2, 0], endPos: [-1, -2, 0] },
    ]
  }
};