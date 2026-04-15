import React from "react";
// import { CATEGORY_COLORS } from "@/data/elements";

const CATEGORY_HEX = {
  "diatomic nonmetal": "#2d7a74",      // Extra Muted Teal
  "alkali metal": "#8c3a3a",           // Extra Muted Red
  "alkaline earth metal": "#9c683c",    // Extra Muted Orange
  "transition metal": "#8a7826",       // Extra Muted Yellow
  "noble gas": "#41398c",              // Extra Muted Purple
  "halogen": "#5a806c",               // Extra Muted Green
  "lanthanide": "#80505a",             // Extra Muted Rose
  "actinide": "#505a80",               // Extra Muted Blue
  "post-transition metal": "#24628a",  // Extra Muted Sky Blue
  "metalloid": "#6b640d",              // Extra Muted Gold
  "polyatomic nonmetal": "#2d4682",    // Extra Muted Royal Blue
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

    // Background style with hybrid solid/glossy coloring
    const getBgStyle = () => {
      const color = trendColor || catColor;
      const opacity = shouldDim ? 0.05 : isHighlighted ? 0.95 : 0.8;
      const borderAlpha = isHighlighted || isComparisonSelected ? 'ff' : '44';
      
      const rgbaColor = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
      
      if (isHighlighted || isComparisonSelected) {
        return {
           // Selected: Solid matte core with a glossy "crystalline" rim
           background: `radial-gradient(circle at center, ${color} 60%, ${rgbaColor} 100%)`,
           borderColor: '#ffffff',
           boxShadow: `
             0 0 40px -10px ${color}, 
             inset 0 0 15px rgba(255, 255, 255, 0.4), 
             inset 0 0 2px rgba(255, 255, 255, 0.8)
           `
        };
      }

      return {
        // Normal: Muted solid look with subtle depth
        background: `linear-gradient(135deg, ${rgbaColor} 0%, ${color} 100%)`,
        borderColor: `${color}${borderAlpha}`,
        boxShadow: `inset 0 0 12px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)`
      };
    };
    
    // Explicitly override text colors for solid background contrast
    const textContrastClass = shouldDim ? "text-white/20" : "text-white shadow-sm";




    const backgroundStyle = getBgStyle();

    return (
      <button
        onClick={() => onClick(element)}
        className={`
          glass-element font-bold
          p-2 relative rounded-2xl border
          min-w-[62px] min-h-[62px] cursor-pointer
          transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
          tap-animation
          ${textContrastClass}
          ${isHighlighted ? "z-30 scale-[1.35] shadow-[0_30px_70px_rgba(0,0,0,0.5)] !border-white/80" : ""}
          ${isComparisonSelected ? "z-30 scale-[1.35] !border-white !border-2 shadow-[0_30px_70px_rgba(0,0,0,0.5)]" : ""}
          ${shouldDim ? "opacity-[0.1] grayscale" : "opacity-100"}
          ${isCompareMode && !isComparisonSelected ? "hover:scale-[1.15] hover:bg-white/20 hover:border-white/40 hover:z-20" : ""}
          group
        `}

        style={{
          gridColumn: xpos,
          gridRow: ypos,
          aspectRatio: "1 / 1",
          transform:
            isHighlighted || isComparisonSelected
              ? "translateY(-8px)"
              : "translateY(0)",
          ...backgroundStyle,
        }}
      >
        {/* Glow effect for highlighted/selected */}
        {(isHighlighted || isComparisonSelected) && (
          <div 
            className="absolute inset-0 rounded-2xl blur-3xl opacity-60 bg-inherit -z-10 animate-pulse" 
            style={{ backgroundColor: catColor }}
          />
        )}


        {/* Atomic number */}
        <div className="absolute top-2 left-2.5 text-[11px] font-black opacity-80 tracking-widest text-white/50">
          {atomic_number}
        </div>



        {/* Symbol */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-black leading-none transition-all duration-300 ${isHighlighted || isComparisonSelected ? 'scale-110 text-white brightness-150' : 'text-white/90'}`}>
          {symbol}
        </div>


        {/* Atomic mass or Trend Value */}
        <div className="absolute bottom-1 right-2 text-[10px] font-black tracking-widest opacity-80 uppercase text-white/50">
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
