// components/ElementCell.jsx
import React from "react";
import { CATEGORY_COLORS } from "@/data/elements";

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
  }) => {
    const { symbol, atomic_number, atomic_mass, category, xpos, ypos } = element;

    const normalizedCategory = category?.toLowerCase().trim();
    const defaultColorClass =
      CATEGORY_COLORS[normalizedCategory] || "bg-gray-700 hover:bg-gray-600";

    const isHighlighted =
      highlightedCategory && highlightedCategory === normalizedCategory;

    // Dim any cell that belongs to a DIFFERENT category when one is active.
    const shouldDim = highlightedCategory ? !isHighlighted : false;

    // Trend colour overrides the category colour when a trend is active.
    const backgroundStyle = trendColor ? { backgroundColor: trendColor } : {};

    return (
      <button
        onClick={() => onClick(element)}
        className={`
          ${trendColor ? "" : defaultColorClass} text-white font-bold
          p-1 m-[2px] relative rounded-sm shadow-lg
          min-w-[60px] min-h-[60px] cursor-pointer
          transition-all duration-300 ease-out
          ${isHighlighted ? "z-10 scale-110 animate-spin-slow border-4 border-glow" : ""}
          ${isComparisonSelected ? "z-20 scale-110 border-4 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" : ""}
          ${shouldDim ? "opacity-30" : "opacity-100"}
          ${isCompareMode && !isComparisonSelected ? "hover:scale-105 hover:border-2 hover:border-cyan-500/50" : ""}
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
        {/* Atomic number */}
        <div className="absolute top-1 left-1 text-xs text-shadow-sm">
          {atomic_number}
        </div>

        {/* Symbol */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl leading-none text-shadow-md">
          {symbol}
        </div>

        {/* Atomic mass or Trend Value */}
        <div className="absolute bottom-1 right-1 text-[10px] text-shadow-sm">
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
