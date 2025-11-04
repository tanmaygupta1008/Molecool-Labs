// // app/periodic-table/page.jsx
// // Must use 'use client' because of state and user interaction (onClick)

// 'use client';
// import { useState } from 'react';
// import { ELEMENTS } from '@/data/elements';
// import ElementCell from '@/components/ElementCell';
// import ElementModal from '@/components/ElementModal';
// import Link from 'next/link'; // For better navigation/linking

// const PeriodicTablePage = () => {
//   const [selectedElement, setSelectedElement] = useState(null);

//   // Filter out Lanthanides and Actinides for the main table view (rows 6 and 7)
//   const mainTableElements = ELEMENTS.filter(e => e.y <= 7);
  
//   // Lanthanides (y=9) and Actinides (y=10)
//   const lanthActinides = ELEMENTS.filter(e => e.y >= 9);


//   return (
//     <div className="min-h-screen bg-black text-white p-4 sm:p-8">
//       <header className="mb-8">
//         <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-cyan-400">
//           Molecool Labs Periodic Table
//         </h1>
//         <p className="text-center text-gray-400 mt-2">Click an element to see its 3D model!</p>
//       </header>
      
//       {/* Main Grid Container */}
//       <div 
//         className="grid gap-1 mx-auto"
//         // 18 columns, 7 rows for main table + 2 blank for Lanthanides/Actinides (y=8)
//         style={{
//           gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
//           gridTemplateRows: `repeat(10, auto)`,
//           maxWidth: '1200px',
//         }}
//       >
        
//         {/* Render main table elements */}
//         {mainTableElements.map(element => (
//           <ElementCell 
//             key={element.number} 
//             element={element} 
//             onClick={setSelectedElement} 
//           />
//         ))}

//         {/* Placeholder for Lanthanides/Actinides gap (y=6, x=3 to x=17) */}
//         <div style={{ gridColumn: '3 / span 15', gridRow: 6 }} className="h-2"></div>
//         <div style={{ gridColumn: '3 / span 15', gridRow: 7 }} className="h-2"></div>

//         {/* Lanthanides/Actinides Container (starts at y=9, x=4) */}
//         <div 
//             style={{ 
//                 gridColumn: '4 / span 14', 
//                 gridRow: 9, 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(14, 1fr)',
//                 marginTop: '1.5rem',
//             }}
//             className="gap-1"
//         >
//             {lanthActinides.filter(e => e.category === 'lanthanide').map(element => (
//                 <ElementCell key={element.number} element={element} onClick={setSelectedElement} />
//             ))}
//         </div>
//         <div 
//             style={{ 
//                 gridColumn: '4 / span 14', 
//                 gridRow: 10, 
//                 display: 'grid', 
//                 gridTemplateColumns: 'repeat(14, 1fr)',
//             }}
//             className="gap-1 mt-1"
//         >
//             {lanthActinides.filter(e => e.category === 'actinide').map(element => (
//                 <ElementCell key={element.number} element={element} onClick={setSelectedElement} />
//             ))}
//         </div>
//       </div>

//       {/* 3D Rendering Popup Modal */}
//       <ElementModal 
//         element={selectedElement} 
//         onClose={() => setSelectedElement(null)} 
//       />
//     </div>
//   );
// };

// export default PeriodicTablePage;





// src/app/periodic-table/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ElementCell from '@/components/ElementCell';
import ElementModal from '@/components/ElementModal';

const PeriodicTablePage = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [highlightedCategory, setHighlightedCategory] = useState(null); // ✅ category to highlight

  useEffect(() => {
    const fetchElements = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'elements'), orderBy('atomic_number'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setElements(data);
      } catch (e) {
        console.error('Error loading elements', e);
      } finally {
        setLoading(false);
      }
    };
    fetchElements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p className="text-xl text-cyan-400 animate-pulse">
          Fetching elements and models from the Cloud... 🧪
        </p>
      </div>
    );
  }

  const categoryColors = [                                                                      // colors correspond to CATEGORY_COLORS in ElementCell
    { category: "diatomic nonmetal", name: 'diatomic nonmetal', color: '#2563EB' },           // bg-blue-600
    { category: "alkali metal", name: 'Alkali Metals', color: '#DC2626' },                    // bg-red-600
    { category: "alkaline earth metal", name: 'Alkaline Earth Metals', color: '#EA580C' },    // bg-orange-600
    { category: "transition metal", name: 'Transition Metals', color: '#CA8A04' },            // bg-yellow-600
    { category: "noble gas", name: 'Noble Gases', color: '#9333EA' },                         // bg-purple-600
    { category: "halogen", name: 'Halogens', color: '#0891B2' },                              // bg-cyan-600
    { category: "lanthanide", name: 'Lanthanides', color: '#DB2777' },                        // bg-pink-600
    { category: "actinide", name: 'Actinides', color: '#C026D3' },                            // bg-fuchsia-600
    { category: "post-transition metal", name: 'Post-Transition Metals', color: '#16A34A' },  // bg-gray-600
    { category: "metalloid", name: 'Metalloids', color: '#65A30D' },                          // bg-lime-600
    { category: "polyatomic nonmetal", name: 'Nonmetals', color: '#3B82F6' },                 // bg-blue-500
    
  ];

  const handleLegendClick = (category) => {
    setHighlightedCategory((prev) =>
      prev === category.toLowerCase() ? null : category.toLowerCase()
    );
  };

  const mainElements = elements.filter(e => e.ypos <= 7);
  const lanthActinides = elements.filter(e => e.ypos >= 9);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">
          Molecool Labs Periodic Table
        </h1>
        <p className="text-gray-400 mt-2">
          Click an element or a legend category to explore!
        </p>
      </header>

      {/* Legend */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl text-cyan-400 font-semibold">Legend</h2>
        <div className="flex flex-wrap justify-center gap-6 mt-4">
          {categoryColors.map(({ category, color, name }) => {
            const isActive =
              highlightedCategory === category.toLowerCase();
            return (
              <button
                key={category}
                onClick={() => handleLegendClick(category)}
                className={`flex items-center px-3 py-1 rounded-md transition-all duration-300 border
                  ${
                    isActive
                      ? 'scale-110 border-cyan-400 shadow-lg shadow-cyan-400/40'
                      : 'border-gray-600'
                  }
                `}
              >
                <div
                  className="w-6 h-6 rounded-sm"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="ml-2 text-gray-300">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Periodic Table Grid */}
      <div
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(10, auto)`,
          maxWidth: '1200px',
        }}
      >
        {mainElements.map((el) => (
          <ElementCell
            key={el.atomic_number}
            element={el}
            onClick={setSelectedElement}
            highlightedCategory={highlightedCategory} // ✅ Pass to all
          />
        ))}

        <div style={{ gridColumn: '3 / span 15', gridRow: 6 }}></div>
        <div style={{ gridColumn: '3 / span 15', gridRow: 7 }}></div>

        <div
          style={{
            gridColumn: '4 / span 14',
            gridRow: 9,
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
            marginTop: '1.5rem',
          }}
          className="gap-1"
        >
          {lanthActinides
            .filter((e) => e.ypos === 9)
            .map((el) => (
              <ElementCell
                key={el.atomic_number}
                element={el}
                onClick={setSelectedElement}
                highlightedCategory={highlightedCategory}
              />
            ))}
        </div>

        <div
          style={{
            gridColumn: '4 / span 14',
            gridRow: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
          }}
          className="gap-1 mt-1"
        >
          {lanthActinides
            .filter((e) => e.ypos === 10)
            .map((el) => (
              <ElementCell
                key={el.atomic_number}
                element={el}
                onClick={setSelectedElement}
                highlightedCategory={highlightedCategory}
              />
            ))}
        </div>
      </div>

      <ElementModal
        element={selectedElement}
        onClose={() => setSelectedElement(null)}
      />
    </div>
  );
};

export default PeriodicTablePage;
