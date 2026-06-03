// src/data/categories.js

// Mappings for Tailwind colors based on the 'category' field from Firebase
export const CATEGORY_COLORS = {
  'diatomic nonmetal': 'bg-blue-600 hover:bg-blue-700',
  'noble gas': 'bg-purple-600 hover:bg-purple-700',
  'alkali metal': 'bg-red-600 hover:bg-red-700',
  'alkaline earth metal': 'bg-orange-600 hover:bg-orange-700',
  'metalloid': 'bg-lime-600 hover:bg-lime-700',
  'polyatomic nonmetal': 'bg-blue-500 hover:bg-blue-600',
  'halogen': 'bg-cyan-600 hover:bg-cyan-700',
  'transition metal': 'bg-yellow-600 hover:bg-yellow-700',
  'post-transition metal': 'bg-green-600 hover:bg-green-700',
  'lanthanide': 'bg-pink-600 hover:bg-pink-700',
  'actinide': 'bg-fuchsia-600 hover:bg-fuchsia-700',
  'unknown, probably transition metal': 'bg-gray-600 hover:bg-gray-700',
  'unknown, probably post-transition metal': 'bg-gray-600 hover:bg-gray-700',
  'unknown, probably metalloid': 'bg-gray-600 hover:bg-gray-700',
};

// Map the 'xpos' and 'ypos' fields from Firebase to grid columns and rows
export const mapToGrid = (element) => ({
    ...element,
    // Use the xpos and ypos fields for grid placement
    x: element.xpos, 
    y: element.ypos,
    // We'll use 'number' for mass display in the cell for brevity
    mass: element.atomic_mass,
});