// // src/app/compounds/page.jsx
// 'use client'; 

// import { useState, useEffect } from 'react';
// import { collection, getDocs, query } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import Molecule3DModel from '@/components/Molecule3DModel';

// const CompoundViewerPage = () => {
//   const [compounds, setCompounds] = useState([]);
//   const [selectedCompound, setSelectedCompound] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchCompounds = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         // Fetch all documents from the 'compounds' collection
//         const q = query(collection(db, 'compounds'));
//         const querySnapshot = await getDocs(q);
        
//         const compoundsData = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
        
//         setCompounds(compoundsData);
//         if (compoundsData.length > 0) {
//             setSelectedCompound(compoundsData[0]); // Auto-select the first one
//         }

//       } catch (err) {
//         console.error("Error fetching compounds: ", err);
//         setError("Failed to load compounds. Check Firebase connection/rules.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCompounds();
//   }, []); 

//   if (loading) {
//     return (
//       <div className="min-h-[calc(100vh-64px)] bg-black text-white flex justify-center items-center">
//         <p className="text-xl text-cyan-400 animate-pulse">Loading Compound Data... 🔬</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-[calc(100vh-64px)] bg-black text-red-400 flex justify-center items-center p-8">
//         <p className="text-xl border border-red-400 p-4 rounded-lg">Error: {error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 sm:p-10">
//       <header className="mb-10 text-center">
//         <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">
//           3D Molecular Viewer
//         </h1>
//         <p className="text-gray-400 mt-2">
//           Select a compound to view its structure in an interactive Ball-and-Stick model.
//         </p>
//       </header>
      
//       <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
//         {/* Left Sidebar: Compound List */}
//         <div className="md:col-span-1 bg-gray-900 p-4 rounded-lg shadow-xl h-fit max-h-[80vh] overflow-y-auto">
//           <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-3">Compounds List ({compounds.length})</h2>
//           <ul className="space-y-2">
//             {compounds.map(compound => (
//               <li key={compound.id}>
//                 <button
//                   onClick={() => setSelectedCompound(compound)}
//                   className={`w-full text-left p-2 rounded-md transition duration-150 ${
//                     selectedCompound?.id === compound.id 
//                       ? 'bg-cyan-600 text-white font-bold' 
//                       : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
//                   }`}
//                 >
//                   {compound.name} ({compound.formula})
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>

//         {/* Right Content: 3D Viewer and Details */}
//         <div className="md:col-span-3">
//           {selectedCompound ? (
//             <div className="space-y-6">
//               <h2 className="text-3xl font-extrabold text-white">{selectedCompound.name} ({selectedCompound.formula})</h2>
              
//               {/* 3D Model Container */}
//               <div className="h-96 bg-gray-900 rounded-lg border-2 border-cyan-500">
//                 <Molecule3DModel structure={selectedCompound.structure} />
//               </div>

//               {/* Compound Details */}
//               <div className="bg-gray-900 p-4 rounded-lg shadow-inner">
//                 <h3 className="text-xl font-bold mb-2">Details</h3>
//                 <p><strong>CID:</strong> {selectedCompound.cid}</p>
//                 <p><strong>Source:</strong> {selectedCompound.source}</p>
//                 <p><strong>Total Atoms:</strong> {selectedCompound.structure?.atoms?.length || 0}</p>
//               </div>
//             </div>
//           ) : (
//             <p className="text-gray-500 text-center mt-10">Select a compound from the list to view its 3D structure.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompoundViewerPage;





// src/app/compounds/page.jsx
'use client'; 

import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Molecule3DModel, { MoleculeLegend } from '@/components/Molecule3DModel'; 

const CompoundViewerPage = () => {
    const [compounds, setCompounds] = useState([]);
    const [selectedCompound, setSelectedCompound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [elementsForLegend, setElementsForLegend] = useState([]); 
    const [isClient, setIsClient] = useState(false); 

    // ⬅️ RESTORED AND COMBINED USE EFFECT FOR DATA FETCHING AND CLIENT CHECK
    useEffect(() => {
        const fetchCompounds = async () => {
            try {
                setLoading(true);
                setError(null);
        
                const q = query(collection(db, 'compounds'));
                const querySnapshot = await getDocs(q);
                
                const compoundsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                
                setCompounds(compoundsData);
                if (compoundsData.length > 0) {
                    // Set the first compound to be automatically viewed
                    setSelectedCompound(compoundsData[0]); 
                }
        
            } catch (err) {
                console.error("Error fetching compounds: ", err);
                setError("Failed to load compounds. Check Firebase connection/rules.");
            } finally {
                setLoading(false);
            }
        };

        fetchCompounds();
        setIsClient(true); 
    }, []); 

    // RENDER CHECK
    if (loading || !isClient) { 
        return (
            <div className="min-h-[calc(100vh-64px)] bg-black text-white flex justify-center items-center">
               <p className="text-xl text-cyan-400 animate-pulse">Loading... 🔬</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="min-h-[calc(100vh-64px)] bg-black text-red-400 flex justify-center items-center p-8">
                <p className="text-xl border border-red-400 p-4 rounded-lg">Error: {error}</p>
             </div>
        );
    }


    return (
        <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 sm:p-10">
            <header className="mb-10 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">3D Molecular Viewer</h1>
                <p className="text-gray-400 mt-2">Select a compound to view its structure in an interactive Ball-and-Stick model.</p>
            </header>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* Left Sidebar: Compound List ⬅️ RESTORED LIST */}
                <div className="md:col-span-1 bg-gray-900 p-4 rounded-lg shadow-xl h-fit max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-3">Compounds List ({compounds.length})</h2>
                    <ul className="space-y-2">
                        {compounds.map(compound => (
                            <li key={compound.id}>
                                <button
                                    onClick={() => setSelectedCompound(compound)}
                                    className={`w-full text-left p-2 rounded-md transition duration-150 ${
                                        selectedCompound?.id === compound.id 
                                            ? 'bg-cyan-600 text-white font-bold' 
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    }`}
                                >
                                    {compound.name} ({compound.formula})
                                </button>
                            </li>
                        ))}
                    </ul>
                    {compounds.length === 0 && <p className="text-gray-500">No compounds found.</p>}
                </div>

                {/* Right Content: 3D Viewer and Details */}
                <div className="md:col-span-3">
                    {selectedCompound ? (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-extrabold text-white">{selectedCompound.name} ({selectedCompound.formula})</h2>
                            
                            {/* 3D Model Container: Must be relative for absolute legend positioning */}
                            <div className="relative h-96 bg-gray-900 rounded-lg border-2 border-cyan-500"> 
                                <Molecule3DModel 
                                    structure={selectedCompound.structure} 
                                    onElementsUsedChange={setElementsForLegend} 
                                />
                                <MoleculeLegend elementsUsed={elementsForLegend} />
                            </div>

                            {/* Compound Details */}
                            <div className="bg-gray-900 p-4 rounded-lg shadow-inner">
                                <h3 className="text-xl font-bold mb-2">Details</h3>
                                <p><strong>CID:</strong> {selectedCompound.cid}</p>
                                <p><strong>Source:</strong> {selectedCompound.source}</p>
                                <p><strong>Total Atoms:</strong> {selectedCompound.structure?.atoms?.length || 0}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center mt-10">Select a compound from the list to view its 3D structure.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompoundViewerPage;