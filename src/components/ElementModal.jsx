// // components/ElementModal.jsx
// import Atom3DModel from './Atom3DModel';

// const ElementModal = ({ element, onClose }) => {
//   if (!element) return null;

//   return (
//     <div 
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
//       onClick={onClose} // Close on backdrop click
//     >
//       <div 
//         className="bg-gray-800 text-white p-6 rounded-lg shadow-2xl max-w-2xl w-full mx-4"
//         onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
//       >
//         <div className="flex justify-between items-start mb-4">
//           <h2 className="text-3xl font-extrabold">{element.name} ({element.symbol})</h2>
//           <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* 3D Model Area */}
//           <div className="h-64 w-full bg-black rounded-lg border border-gray-700">
//             <Atom3DModel element={element} />
//           </div>
          
//           {/* Properties List */}
//           <div>
//             <p className="text-lg mb-2">
//               <span className="font-semibold">Atomic atomic_number:</span> {element.atomic_number}
//             </p>
//             <p className="text-lg mb-2">
//               <span className="font-semibold">Atomic Mass:</span> {element.mass.toFixed(4)} u
//             </p>
//             <p className="text-lg mb-2">
//               <span className="font-semibold">Category:</span> <span className="capitalize">{element.category.replace('-', ' ')}</span>
//             </p>
//             {/* Add more properties here as needed */}
//             <p className="mt-4 text-sm text-gray-400 italic">
//                 * Drag and zoom the 3D model to interact with the atom.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ElementModal;




// src/components/ElementModal.jsx
import Atom3DModel from './Atom3DModel';

const ElementModal = ({ element, onClose }) => {
  if (!element) return null;
  
  // Destructure fields for display
  const { name, symbol, atomic_number, atomic_mass, category, summary, melt, boil, phase, discovered_by, bohr_model_3d } = element;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white p-6 rounded-lg shadow-2xl max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-3">
          <h2 className="text-4xl font-extrabold text-cyan-300">{name} ({symbol})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3D Model Area */}
          <div className="md:col-span-2 h-80 w-full bg-black rounded-lg border border-gray-700">
            {/* Pass the GLB URL from Firebase */}
            <Atom3DModel glbUrl={bohr_model_3d} /> 
          </div>
          
          {/* Summary and Properties */}
          <div className="md:col-span-1">
            <p className="text-sm italic text-gray-400 mb-3">{summary.substring(0, 150)}...</p>
            <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-cyan-300">Atomic No:</span> {atomic_number}</p>
                <p><span className="font-semibold text-cyan-300">Atomic Mass:</span> {atomic_mass.toFixed(4)} u</p>
                <p><span className="font-semibold text-cyan-300">Category:</span> <span className="capitalize">{category}</span></p>
                <p><span className="font-semibold text-cyan-300">Phase:</span> {phase}</p>
                <p><span className="font-semibold text-cyan-300">Melting Pt:</span> {melt ? `${melt.toFixed(2)} K` : 'N/A'}</p>
                <p><span className="font-semibold text-cyan-300">Boiling Pt:</span> {boil ? `${boil.toFixed(2)} K` : 'N/A'}</p>
                <p><span className="font-semibold text-cyan-300">Discovered By:</span> {discovered_by}</p>
            </div>
            <p className="mt-4 text-xs text-gray-400 italic">
                * Drag and zoom the 3D model above to interact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementModal;