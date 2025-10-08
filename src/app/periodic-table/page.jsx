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
// NOTE: We only import the DB, the CATEGORY_COLORS are now handled in the Cell component

const PeriodicTablePage = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);

  useEffect(() => {
    const fetchElements = async () => {
      try {
        setLoading(true);
        // Query the 'elements' collection, ordered by atomic number ('number' field)
        const q = query(collection(db, 'elements'), orderBy('atomic_number'));
        const querySnapshot = await getDocs(q);
        
        const elementsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          // Ensure key number fields are correctly parsed, though Firestore often handles this
          number: doc.data().number, 
          xpos: doc.data().xpos,
          ypos: doc.data().ypos,
        }));
        
        setElements(elementsData);
      } catch (error) {
        console.error("Error fetching documents: ", error);
        // Handle error (e.g., show an error message to the user)
      } finally {
        setLoading(false);
      }
    };

    fetchElements();
  }, []); 
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p className="text-xl text-cyan-400 animate-pulse">Fetching elements and models from the Cloud... 🧪</p>
      </div>
    );
  }

  // Use ypos from Firebase data for filtering
  const mainTableElements = elements.filter(e => e.ypos <= 7);
  // Lanthanides (ypos=9) and Actinides (ypos=10)
  const lanthActinides = elements.filter(e => e.ypos >= 9);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-cyan-400">
          Molecool Labs Periodic Table
        </h1>
        <p className="text-center text-gray-400 mt-2">
            Click an element to see its detailed properties and 3D GLB model!
        </p>
      </header>
      
      {/* 1. Main Grid Container */}
      <div 
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(10, auto)`,
          maxWidth: '1200px',
        }}
      >
        
        {/* Render Main Table Elements (Uses xpos/ypos from ElementCell) */}
        {mainTableElements.map(element => (
          <ElementCell 
            key={element.number} 
            element={element} 
            onClick={setSelectedElement} 
          />
        ))}

        {/* --- SPACER AREA --- */}
        <div style={{ gridColumn: '3 / span 15', gridRow: 6 }} className="h-2"></div>
        <div style={{ gridColumn: '3 / span 15', gridRow: 7 }} className="h-2"></div>

        {/* 2. Lanthanides Container (ypos=9) */}
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
            {lanthActinides.filter(e => e.ypos === 9).map(element => (
                <ElementCell key={element.number} element={element} onClick={setSelectedElement} />
            ))}
        </div>
        
        {/* 3. Actinides Container (ypos=10) */}
        <div 
            style={{ 
                gridColumn: '4 / span 14', 
                gridRow: 10, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(14, 1fr)',
            }}
            className="gap-1 mt-1"
        >
            {lanthActinides.filter(e => e.ypos === 10).map(element => (
                <ElementCell key={element.number} element={element} onClick={setSelectedElement} />
            ))}
        </div>
      </div>

      {/* 4. 3D Rendering Popup Modal */}
      <ElementModal 
        element={selectedElement} 
        onClose={() => setSelectedElement(null)} 
      />
    </div>
  );
};

export default PeriodicTablePage;