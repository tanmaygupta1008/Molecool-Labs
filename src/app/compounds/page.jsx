'use client'; 

import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Molecule3DModel, { MoleculeLegend } from '@/components/Molecule3DModel'; 
import { findFunctionalGroups } from '@/lib/cheminformatics';
import { formulaToJSX } from '@/utils/formulaUtils';

const CompoundViewerPage = () => {
    const [compounds, setCompounds] = useState([]);
    const [selectedCompound, setSelectedCompound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [elementsForLegend, setElementsForLegend] = useState([]); 
    const [isClient, setIsClient] = useState(false); 

    // Advanced Feature State
    const [highlightedGroup, setHighlightedGroup] = useState(null);
    const [selectedAtomIndex, setSelectedAtomIndex] = useState(null);
    const [availableGroups, setAvailableGroups] = useState([]);

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

    useEffect(() => {
        if (selectedCompound?.structure) {
            setAvailableGroups(findFunctionalGroups(selectedCompound.structure));
            setHighlightedGroup(null);
            setSelectedAtomIndex(null);
        }
    }, [selectedCompound]);

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

    // Helper for selected atom inspector
    const getSelectedAtomDetails = () => {
        if (selectedAtomIndex === null || !selectedCompound?.structure) return null;
        const atom = selectedCompound.structure.atoms[selectedAtomIndex];
        const connectedBonds = selectedCompound.structure.bonds.filter(b => b.a === selectedAtomIndex || b.b === selectedAtomIndex);
        
        return {
            element: atom.element,
            bondsCount: connectedBonds.length,
            coords: { x: atom.x.toFixed(2), y: atom.y.toFixed(2), z: atom.z.toFixed(2) }
        };
    };

    const atomDetails = getSelectedAtomDetails();

    return (
        <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 sm:p-10">
            <header className="mb-10 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">Advanced 3D Molecular Viewer</h1>
                <p className="text-gray-400 mt-2">Explore 3D structures, inspect properties, visualize VSEPR geometries, and locate functional groups.</p>
            </header>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* Left Sidebar: Compound List */}
                <div className="md:col-span-1 bg-gray-900 p-4 rounded-lg shadow-xl h-fit max-h-[80vh] overflow-y-auto border border-gray-800">
                    <h2 className="text-xl font-bold border-b border-gray-700 pb-2 mb-3 text-cyan-300">Compounds ({compounds.length})</h2>
                    <ul className="space-y-2">
                        {compounds.map(compound => (
                            <li key={compound.id}>
                                <button
                                    onClick={() => setSelectedCompound(compound)}
                                    className={`w-full text-left p-2.5 rounded-md transition duration-150 flex justify-between items-center ${
                                        selectedCompound?.id === compound.id 
                                            ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-900/50' 
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    }`}
                                >
                                    <span>{compound.name}</span>
                                    <span className="text-xs opacity-70 font-mono">{formulaToJSX(compound.formula)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {compounds.length === 0 && <p className="text-gray-500">No compounds found.</p>}
                </div>

                {/* Right Content: 3D Viewer and Details */}
                <div className="md:col-span-3">
                    {selectedCompound ? (
                        <div className="space-y-6 flex flex-col h-full">
                            
                            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-800">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-white">{selectedCompound.name}</h2>
                                        <p className="text-cyan-400 font-mono text-lg">{formulaToJSX(selectedCompound.formula)}</p>
                                    </div>
                                    <div className="text-right text-sm text-gray-400">
                                        <p>CID: {selectedCompound.cid}</p>
                                        <p>Atoms: {selectedCompound.structure?.atoms?.length || 0}</p>
                                    </div>
                                </div>

                                {/* Functional Groups UI */}
                                {availableGroups.length > 0 && (
                                    <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                                            <span>🔍</span> Highlight Functional Groups:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => setHighlightedGroup(null)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                                    highlightedGroup === null ? 'bg-gray-600 text-white shadow-inner' : 'bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'
                                                }`}
                                            >
                                                Default View
                                            </button>
                                            {availableGroups.map(grp => (
                                                <button 
                                                    key={grp.id}
                                                    onClick={() => setHighlightedGroup(highlightedGroup?.id === grp.id ? null : grp)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                                                        highlightedGroup?.id === grp.id 
                                                        ? 'bg-cyan-500 text-white scale-105 shadow-cyan-500/50 run-animation' 
                                                        : 'bg-gray-700 text-cyan-300 hover:bg-gray-600 border border-transparent'
                                                    }`}
                                                >
                                                    {grp.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            
                                {/* 3D Model Container */}
                                <div className="relative h-[500px] w-full bg-gradient-to-b from-gray-900 to-black rounded-lg border-2 border-cyan-800 overflow-hidden shadow-inner"> 
                                    
                                    {/* Property Inspector Overlay */}
                                    {atomDetails && (
                                        <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-cyan-500 max-w-sm z-20 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-base font-bold text-white flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                                                    Atom Inspector
                                                </h4>
                                                <button onClick={() => setSelectedAtomIndex(null)} className="text-gray-400 hover:text-white transition-colors bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer">&times;</button>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between border-b border-gray-700 pb-1">
                                                    <span className="text-gray-400">Element:</span>
                                                    <span className="font-bold text-cyan-300">{atomDetails.element}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-700 pb-1">
                                                    <span className="text-gray-400">Bonds:</span>
                                                    <span className="font-bold text-white">{atomDetails.bondsCount}</span>
                                                </div>
                                                <div className="flex justify-between pt-1">
                                                    <span className="text-gray-400">Coordinates:</span>
                                                    <span className="font-mono text-xs text-gray-300">
                                                        [{atomDetails.coords.x}, {atomDetails.coords.y}, {atomDetails.coords.z}]
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Molecule3DModel 
                                        structure={selectedCompound.structure} 
                                        onElementsUsedChange={setElementsForLegend} 
                                        highlightedGroup={highlightedGroup}
                                        onAtomSelect={setSelectedAtomIndex}
                                        angleOverrides={selectedCompound.structure?.angleOverrides}
                                    />
                                    <MoleculeLegend elementsUsed={elementsForLegend} />
                                    
                                    <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex justify-center">
                                        <p className="text-xs text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                            Click atoms to inspect • Use top-right checkboxes for overlays
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800 p-10 min-h-[400px]">
                            <div className="text-6xl mb-4 opacity-50">🔬</div>
                            <p className="text-gray-400 text-lg">Select a compound to begin exploring</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompoundViewerPage;