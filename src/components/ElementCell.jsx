// components/ElementCell.jsx
import { CATEGORY_COLORS } from '@/data/elements';

const ElementCell = ({ element, onClick, highlightedCategory, trendColor, trendValue }) => {
  const { symbol, atomic_number, atomic_mass, category, xpos, ypos } = element;

  const normalizedCategory = category?.toLowerCase().trim();
  const defaultColorClass =
    CATEGORY_COLORS[normalizedCategory] || 'bg-gray-700 hover:bg-gray-600';

  const isHighlighted =
    highlightedCategory && highlightedCategory === normalizedCategory;
  const isDimmed = highlightedCategory && !isHighlighted;

  // If a trend is active (trendColor is provided), use it. 
  // Otherwise use category color.
  const backgroundStyle = trendColor
    ? { backgroundColor: trendColor }
    : {};

  return (
    <button
      onClick={() => onClick(element)}
      className={`
        ${trendColor ? '' : defaultColorClass} text-white font-bold 
        p-1 m-[2px] relative rounded-sm shadow-lg 
        min-w-[60px] min-h-[60px] cursor-pointer
        transition-all duration-500 ease-out
        ${isHighlighted ? 'z-10 scale-110 animate-spin-slow border-4 border-glow' : ''}
        ${isDimmed ? 'opacity-30' : 'opacity-100'}
        group
      `}
      style={{
        gridColumn: xpos,
        gridRow: ypos,
        aspectRatio: '1 / 1',
        transform: isHighlighted ? 'translateY(-8px)' : 'translateY(0)',
        ...backgroundStyle
      }}
    >
      {/* Atomic number */}
      <div className="absolute top-1 left-1 text-xs text-shadow-sm">{atomic_number}</div>

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
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
          {trendValue}
        </div>
      )}
    </button>
  );
};

export default ElementCell;
