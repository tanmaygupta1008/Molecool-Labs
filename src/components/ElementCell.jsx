// // components/ElementCell.jsx
// import { CATEGORY_COLORS } from '@/data/elements';

// const ElementCell = ({ element, onClick }) => {
//   const { symbol, number, mass, category } = element;
//   const colorClass = CATEGORY_COLORS[category] || 'bg-gray-700 hover:bg-gray-600';

//   return (
//     <button
//       onClick={() => onClick(element)}
//       className={`
//         col-start-${element.x} row-start-${element.y} 
//         ${colorClass} text-white font-bold 
//         p-1 m-[2px] transition-transform duration-150 transform hover:scale-105
//         flex flex-col justify-between items-start text-left rounded-sm shadow-lg
//         min-w-[60px] min-h-[60px] cursor-pointer
//       `}
//       style={{
//         gridColumn: element.x,
//         gridRow: element.y,
//         aspectRatio: '1 / 1', // Ensures square shape
//       }}
//     >
//       <div className="text-xs">{number}</div>
//       <div className="text-xl leading-none">{symbol}</div>
//       <div className="text-[10px] truncate w-full">{mass.toFixed(2)}</div>
//     </button>
//   );
// };

// export default ElementCell;




// components/ElementCell.jsx
import { CATEGORY_COLORS } from '@/data/elements';

const ElementCell = ({ element, onClick, highlightedCategory }) => {
  const { symbol, atomic_number, atomic_mass, category, xpos, ypos } = element;

  const normalizedCategory = category?.toLowerCase().trim();
  const colorClass =
    CATEGORY_COLORS[normalizedCategory] || 'bg-gray-700 hover:bg-gray-600';

  const isHighlighted =
    highlightedCategory && highlightedCategory === normalizedCategory;
  const isDimmed = highlightedCategory && !isHighlighted;

  return (
    <button
      onClick={() => onClick(element)}
      className={`
        ${colorClass} text-white font-bold 
        p-1 m-[2px] relative rounded-sm shadow-lg 
        min-w-[60px] min-h-[60px] cursor-pointer
        transition-all duration-500 ease-out
        ${isHighlighted ? 'z-10 scale-110 animate-spin-slow border-4 border-glow' : ''}
        ${isDimmed ? 'opacity-30' : 'opacity-100'}
      `}
      style={{
        gridColumn: xpos,
        gridRow: ypos,
        aspectRatio: '1 / 1',
        transform: isHighlighted ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      {/* Atomic number */}
      <div className="absolute top-1 left-1 text-xs">{atomic_number}</div>

      {/* Symbol */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl leading-none">
        {symbol}
      </div>

      {/* Atomic mass */}
      <div className="absolute bottom-1 right-1 text-[10px]">
        {atomic_mass?.toFixed(1)}
      </div>
    </button>
  );
};

export default ElementCell;

