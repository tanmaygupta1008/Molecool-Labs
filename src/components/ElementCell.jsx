import React from "react";
// import { CATEGORY_COLORS } from "@/data/elements";

const CATEGORY_HEX = {
  "diatomic nonmetal": "#4ade80",      // Neon Green
  "alkali metal": "#f87171",           // Soft Red
  "alkaline earth metal": "#fb923c",    // Orange
  "transition metal": "#facc15",       // Bright Yellow
  "noble gas": "#a78bfa",              // Lavender/Purple
  "halogen": "#2dd4bf",               // Teal
  "lanthanide": "#f472b6",             // Pink
  "actinide": "#818cf8",               // Indigo
  "post-transition metal": "#60a5fa",  // Sky Blue
  "metalloid": "#fbbf24",              // Amber
  "polyatomic nonmetal": "#3b82f6",    // Blue
};



// ── ElementCell ────────────────────────────────────────────────────────────────
// Wrapped in React.memo with a custom comparison that only re-renders a cell
// when something that VISUALLY affects IT has changed.
//
// Without this, every state change in the parent (highlightedCategory, activeTrend,
// compareMode…) re-renders all 118 cells simultaneously, even those whose
// appearance hasn't changed.
const ElementCell = React.memo(
  ({
    element,
    onClick,
    highlightedCategory,
    trendColor,
    trendValue,
    isComparisonSelected,
    isCompareMode,
    compareSetSize,
  }) => {
    const { symbol, atomic_number, atomic_mass, category, xpos, ypos } = element;

    const normalizedCategory = category?.toLowerCase().trim();
    const catColor = CATEGORY_HEX[normalizedCategory] || "#4b5563"; // default gray-600

    const isHighlighted =
      highlightedCategory && highlightedCategory === normalizedCategory;

    // Dimming Logic: Dim if category is highlighted BUT not this one OR if in compare mode and not selected
    const shouldDim = (highlightedCategory && !isHighlighted) ||
                     (isCompareMode && !isComparisonSelected && compareSetSize > 0);

    // Background style: "Vivid Glass" with category-specific tints
    const getBgStyle = () => {
      const color = trendColor || catColor;
      
      if (isHighlighted || isComparisonSelected) {
        return {
           background: `${color}cc`, // High opacity on selection
           borderColor: '#ffffff',
           boxShadow: `
             0 0 40px -5px ${color}, 
             inset 0 0 15px rgba(255, 255, 255, 0.4)
           `,
           zIndex: 40
        };
      }

      if (shouldDim) {
        return {
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          opacity: 0.2
        };
      }

      return {
        // Base state: Tinted translucent glass
        background: `${catColor}33`, 
        backdropFilter: 'blur(12px) saturate(180%)',
        border: `1px solid ${catColor}66`,
        boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.1)`,
      };
    };
    
    const backgroundStyle = getBgStyle();

    return (
      <button
        onClick={() => onClick(element)}
        className={`
          stealth-glass font-bold
          p-2 relative rounded-xl
          min-w-[62px] min-h-[62px] cursor-pointer
          transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)
          tap-animation
          ${isHighlighted || isComparisonSelected ? "scale-[1.25]" : "hover:scale-[1.1] hover:bg-neutral-900/40 hover:border-white/20"}
          ${shouldDim ? "grayscale" : ""}
          group
        `}

        style={{
          gridColumn: xpos,
          gridRow: ypos,
          aspectRatio: "1 / 1",
          ...backgroundStyle,
        }}
      >
        {/* Glow Halo */}
        {(isHighlighted || isComparisonSelected) && (
          <div 
            className="absolute inset-0 rounded-xl blur-2xl opacity-40 -z-10 animate-glow" 
            style={{ backgroundColor: catColor }}
          />
        )}


        {/* Atomic number */}
        <div className={`absolute top-2 left-2.5 text-[10px] font-bold tracking-tighter transition-colors duration-500 ${isHighlighted || isComparisonSelected ? 'text-white' : 'text-white/60'}`}>
          {atomic_number}
        </div>

        {/* Symbol */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-black transition-all duration-500 ${isHighlighted || isComparisonSelected ? 'text-white scale-110' : 'text-white/90 group-hover:text-white'}`}>
          {symbol}
        </div>

        {/* Atomic mass or Trend Value */}
        <div className={`absolute bottom-2 right-2 text-[9px] font-medium tracking-tight transition-colors duration-500 ${isHighlighted || isComparisonSelected ? 'text-white' : 'text-white/40'}`}>
          {trendValue !== undefined ? trendValue : atomic_mass?.toFixed(1)}
        </div>



        {/* Tooltip for Trend Value */}
        {trendValue !== undefined && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
            {trendValue}
          </div>
        )}
      </button>
    );
  },

  // ── Custom equality check ──────────────────────────────────────────────────
  // Return true  → skip re-render (props are "equal enough" for this cell)
  // Return false → re-render
  (prevProps, nextProps) => {
    // Trend colour or value changed (whole table re-colours when trend toggles)
    if (prevProps.trendColor !== nextProps.trendColor) return false;
    if (prevProps.trendValue !== nextProps.trendValue) return false;

    // Compare-mode selection state for THIS cell
    if (prevProps.isComparisonSelected !== nextProps.isComparisonSelected) return false;

    // Compare-mode toggle changes hover styles for all cells
    if (prevProps.isCompareMode !== nextProps.isCompareMode) return false;

    // highlightedCategory: only matters if it changes whether THIS cell is
    // highlighted or dimmed.  We check both states explicitly.
    const myCategory = prevProps.element.category?.toLowerCase().trim();
    const prevHighlighted = prevProps.highlightedCategory === myCategory;
    const nextHighlighted = nextProps.highlightedCategory === myCategory;
    if (prevHighlighted !== nextHighlighted) return false;

    // "Dimmed" state: any cell that is NOT in the highlighted category gets
    // dimmed.  This flips when we go from "no selection" → "some selection" or
    // vice-versa.  Only relevant for cells that are not themselves highlighted.
    const prevAnyHighlighted = !!prevProps.highlightedCategory;
    const nextAnyHighlighted = !!nextProps.highlightedCategory;
    if (!prevHighlighted && prevAnyHighlighted !== nextAnyHighlighted) return false;

    // onClick is wrapped in useCallback in the parent (stable reference).
    // element is always the same object reference for a given atomic_number.
    // Neither needs to be compared here.

    return true; // Nothing that affects this cell changed → skip re-render
  }
);

ElementCell.displayName = "ElementCell";

export default ElementCell;
