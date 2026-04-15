// src/data/categories.js

// Mappings for Tailwind colors based on the 'category' field from Firebase
export const CATEGORY_COLORS = {
  'diatomic nonmetal': 'bg-blue-950/60 border-2 border-blue-400 text-blue-100 shadow-[0_0_15px_#60a5fa,inset_0_0_10px_#60a5fa] hover:bg-blue-900/80',
  'noble gas': 'bg-purple-950/60 border-2 border-purple-400 text-purple-100 shadow-[0_0_15px_#c084fc,inset_0_0_10px_#c084fc] hover:bg-purple-900/80',
  'alkali metal': 'bg-red-950/60 border-2 border-red-400 text-red-100 shadow-[0_0_15px_#f87171,inset_0_0_10px_#f87171] hover:bg-red-900/80',
  'alkaline earth metal': 'bg-orange-950/60 border-2 border-orange-400 text-orange-100 shadow-[0_0_15px_#fb923c,inset_0_0_10px_#fb923c] hover:bg-orange-900/80',
  'metalloid': 'bg-lime-950/60 border-2 border-lime-400 text-lime-100 shadow-[0_0_15px_#a3e635,inset_0_0_10px_#a3e635] hover:bg-lime-900/80',
  'polyatomic nonmetal': 'bg-indigo-950/60 border-2 border-indigo-400 text-indigo-100 shadow-[0_0_15px_#818cf8,inset_0_0_10px_#818cf8] hover:bg-indigo-900/80',
  'halogen': 'bg-cyan-950/60 border-2 border-cyan-400 text-cyan-100 shadow-[0_0_15px_#22d3ee,inset_0_0_10px_#22d3ee] hover:bg-cyan-900/80',
  'transition metal': 'bg-yellow-950/60 border-2 border-yellow-400 text-yellow-100 shadow-[0_0_15px_#facc15,inset_0_0_10px_#facc15] hover:bg-yellow-900/80',
  'post-transition metal': 'bg-emerald-950/60 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_15px_#34d399,inset_0_0_10px_#34d399] hover:bg-emerald-900/80',
  'lanthanide': 'bg-pink-950/60 border-2 border-pink-400 text-pink-100 shadow-[0_0_15px_#f472b6,inset_0_0_10px_#f472b6] hover:bg-pink-900/80',
  'actinide': 'bg-fuchsia-950/60 border-2 border-fuchsia-400 text-fuchsia-100 shadow-[0_0_15px_#e879f9,inset_0_0_10px_#e879f9] hover:bg-fuchsia-900/80',
  'unknown, probably transition metal': 'bg-zinc-950/60 border-2 border-zinc-400 text-zinc-100 shadow-[0_0_15px_#a1a1aa,inset_0_0_10px_#a1a1aa] hover:bg-zinc-900/80',
  'unknown, probably post-transition metal': 'bg-zinc-950/60 border-2 border-zinc-400 text-zinc-100 shadow-[0_0_15px_#a1a1aa,inset_0_0_10px_#a1a1aa] hover:bg-zinc-900/80',
  'unknown, probably metalloid': 'bg-zinc-950/60 border-2 border-zinc-400 text-zinc-100 shadow-[0_0_15px_#a1a1aa,inset_0_0_10px_#a1a1aa] hover:bg-zinc-900/80',
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