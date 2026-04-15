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
    const [electronegativityMap, setElectronegativityMap] = useState({});

    // Advanced Feature State
    const [highlightedGroup, setHighlightedGroup] = useState(null);
    const [selectedAtomIndex, setSelectedAtomIndex] = useState(null);
    const [availableGroups, setAvailableGroups] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch Compounds
                const q = query(collection(db, 'compounds'));
                const querySnapshot = await getDocs(q);
                const compoundsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCompounds(compoundsData);
                if (compoundsData.length > 0) setSelectedCompound(compoundsData[0]);

                // 2. Load electronegativity map from periodic table cache
                const rawElements = localStorage.getItem('molecool_elements_v1');
                if (rawElements) {
                    const { data } = JSON.parse(rawElements);
                    const enMap = {};
                    data.forEach(el => {
                        if (el.symbol && el.electronegativity !== undefined) {
                            enMap[el.symbol] = el.electronegativity;
                        }
                    });
                    setElectronegativityMap(enMap);
                }

            } catch (err) {
                console.error("Error fetching data: ", err);
                setError("Failed to load project data. Check Firebase/Cache.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
                <p className="text-xl text-white font-black animate-pulse tracking-widest uppercase">Initializing Spectrometer...</p>
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
        <div className="min-h-screen bg-transparent text-white p-4 sm:p-10 relative overflow-hidden">
            {/* Animated Background */}
            <div className="bg-mesh-container">
                <div className="bg-mesh-blob blob-1" />
                <div className="bg-mesh-blob blob-2" />
                <div className="bg-mesh-blob blob-3" />
            </div>

            <div className="max-w-[1600px] mx-auto relative z-10 flex flex-col h-full">
                <header className="mb-20 text-center pt-10">
                    <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white mb-4" style={{ textShadow: '0 10px 40px rgba(255, 255, 255, 0.2)' }}>
                        MOLECOOLS <span className="text-white/40 font-light">CORE</span>
                    </h1>


                    <p className="text-white/80 font-black tracking-[0.3em] uppercase text-sm sm:text-base bg-white/5 py-2.5 px-12 rounded-full inline-block border border-white/10 backdrop-blur-sm shadow-xl">
                        Immersive 3D Structural Analysis & Advanced Chemistry
                    </p>
                </header>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Sidebar: Compound List */}
                    <div className="lg:col-span-2 glass-card p-6 rounded-[2.5rem] shadow-2xl h-[850px] flex flex-col border-white/10 overflow-hidden">

                        <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]" />
                            Database
                        </h2>
                        <ul className="space-y-4 overflow-y-auto custom-scrollbar px-3 py-4 flex-1">
                            {compounds.map(compound => {
                                const elements = Array.from(new Set(compound.formula.match(/[A-Z][a-z]*/g) || []));
                                const isSelected = selectedCompound?.id === compound.id;

                                return (
                                    <li key={compound.id} className="relative">
                                        <button
                                            onClick={() => setSelectedCompound(compound)}
                                            className={`w-full text-left px-7 py-5 rounded-full transition-all duration-700 flex justify-between items-center tap-animation border overflow-hidden relative group ${isSelected
                                                    ? 'bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.2)] scale-105 z-10'
                                                    : 'glass-pill border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                                                }`}
                                        >
                                            {/* CID Background Stamp */}
                                            <span className={`absolute -right-2 top-1/2 -translate-y-1/2 font-black text-[32px] italic opacity-[0.05] pointer-events-none transition-opacity duration-700 ${isSelected ? 'opacity-[0.1]' : ''}`}>
                                                {compound.cid}
                                            </span>

                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer scale-150 rotate-12" />
                                            )}

                                            <div className="flex flex-col gap-1 relative z-10">
                                                <span className={`font-black text-[13px] uppercase tracking-tighter transition-all duration-500 ${isSelected ? 'tracking-normal text-black' : 'text-white'}`}>
                                                    {compound.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[12px] font-mono font-black tracking-widest transition-opacity ${isSelected ? 'text-black/60' : 'text-white'}`}>
                                                        {compound.formula}
                                                    </span>
                                                    {/* Atomic Fingerprint */}
                                                    <div className="flex gap-1">
                                                        {elements.slice(0, 4).map(sym => (
                                                            <div
                                                                key={sym}
                                                                className="w-1 h-1 rounded-full border border-white/10"
                                                                style={{ backgroundColor: `var(--element-${sym}, #fff)` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`transition-all duration-700 ${isSelected ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                                                <span className="text-[12px] font-black">→</span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Center Content: 3D Viewer */}
                    <div className="lg:col-span-7 space-y-8">
                        {selectedCompound ? (
                            <div className="glass-card p-10 rounded-[3rem] border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h2 className="text-5xl font-black text-white tracking-tighter mb-2">{selectedCompound.name}</h2>
                                            <p className="text-white font-black tracking-widest text-sm uppercase">{formulaToJSX(selectedCompound.formula)}</p>
                                        </div>
                                    </div>

                                    {/* Functional Groups UI */}
                                    {availableGroups.length > 0 && (
                                        <div className="mb-8 p-6 glass-card rounded-3xl border-white/5 shadow-inner">
                                            <h4 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-white/40" />
                                                Decomposition Map
                                            </h4>
                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => setHighlightedGroup(null)}
                                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 tap-animation ${highlightedGroup === null ? 'bg-white text-black shadow-2xl scale-110' : 'glass-pill border-white/10 text-white/40 hover:text-white'
                                                        }`}
                                                >
                                                    Full Spectrum
                                                </button>
                                                {availableGroups.map(grp => (
                                                    <button
                                                        key={grp.id}
                                                        onClick={() => setHighlightedGroup(highlightedGroup?.id === grp.id ? null : grp)}
                                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-700 shadow-xl tap-animation ${highlightedGroup?.id === grp.id
                                                                ? 'bg-white text-black scale-110 shadow-3xl'
                                                                : 'glass-pill text-white/60 hover:text-white border-white/10'
                                                            }`}
                                                    >
                                                        {grp.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Workspace Viewer */}
                                    <div className="relative h-[650px] w-full bg-white/[0.02] rounded-[3.5rem] border border-white/10 overflow-hidden shadow-inner group/viewer">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />


                                        {/* Property Inspector Overlay */}

                                        {atomDetails && (
                                            <div className="absolute top-8 left-8 glass-card !bg-white/10 backdrop-blur-3xl p-8 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-white/20 max-w-sm z-30 pointer-events-auto transition-all animate-fadeIn">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                                                        <span className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse" />
                                                        Atomic HUD
                                                    </h4>
                                                    <button onClick={() => setSelectedAtomIndex(null)} className="text-white/70 hover:text-white transition-all duration-300 bg-white/5 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer tap-animation text-xl">&times;</button>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Element</span>
                                                        <span className="font-black text-3xl text-white tracking-tighter">{atomDetails.element}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Bonds</span>
                                                        <span className="font-black text-2xl text-white">{atomDetails.bondsCount}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-4 pt-2">
                                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Coordinates</span>
                                                        <div className="p-5 bg-black/40 rounded-2xl border border-white/10 font-mono text-[12px] text-white tracking-tighter leading-relaxed">
                                                            X: {atomDetails.coords.x}<br />
                                                            Y: {atomDetails.coords.y}<br />
                                                            Z: {atomDetails.coords.z}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Molecule3DModel
                                            structure={selectedCompound.structure}
                                            onElementsUsedChange={setElementsForLegend}
                                            highlightedGroup={highlightedGroup}
                                            selectedAtomIndex={selectedAtomIndex}
                                            onAtomSelect={setSelectedAtomIndex}
                                            angleOverrides={selectedCompound.structure?.angleOverrides}
                                            electronegativityMap={electronegativityMap}
                                        />

                                        <MoleculeLegend elementsUsed={elementsForLegend} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center glass-card rounded-[4rem] border-white/10 p-20 min-h-[600px] text-center">
                                <div className="text-8xl mb-8 opacity-20 animate-pulse">🔬</div>
                                <h3 className="text-3xl font-black text-white/80 tracking-tighter uppercase">Initialize Database</h3>
                                <p className="text-white/60 text-[12px] font-black tracking-widest mt-6 uppercase max-w-xs leading-relaxed">Select a structural dataset from the sidebar to begin immersive analysis</p>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Molecular Specs */}
                    <div className="lg:col-span-3">
                        {selectedCompound ? (
                            <div className="glass-card p-8 rounded-[3rem] border-white/10 shadow-2xl space-y-8 animate-fadeIn h-full">
                                <div className="pb-6 border-b border-white/10">
                                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em] mb-4">Structural Abstract</h4>
                                    <p className="text-[14px] leading-relaxed text-white font-medium italic">
                                        3D structural analysis of {selectedCompound.name} derived from atomic coordinate data and bonding topology. Visualization includes localized electron domains and functional group categorization where applicable.
                                    </p>
                                </div>


                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4 px-2 hover:bg-white/[0.03] transition-colors rounded-xl">
                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Formula</span>
                                        <span className="font-black text-white text-2xl tracking-tight">{formulaToJSX(selectedCompound.formula)}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4 px-2 hover:bg-white/[0.03] transition-colors rounded-xl">
                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Molecular ID</span>
                                        <span className="font-mono text-[11px] text-white font-bold tracking-widest bg-white/10 px-4 py-2 rounded-xl border border-white/10">CID: {selectedCompound.cid}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4 px-2 hover:bg-white/[0.03] transition-colors rounded-xl">
                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Atom Count</span>
                                        <span className="font-black text-white text-xl">{selectedCompound.structure?.atoms?.length || 0} Sites</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4 px-2 hover:bg-white/[0.03] transition-colors rounded-xl">
                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Complexity</span>
                                        <span className="font-black text-white text-xl">{selectedCompound.complexity || (selectedCompound.structure?.bonds?.length * 2.5).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4 px-2 hover:bg-white/[0.03] transition-colors rounded-xl">
                                        <span className="text-[12px] font-black text-white uppercase tracking-widest">Molar Mass</span>
                                        <span className="font-black text-white text-xl">{selectedCompound.molecular_weight || '---'} g/mol</span>
                                    </div>


                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl text-center flex flex-col items-center justify-center min-h-[400px] h-full">
                                <p className="text-[12px] font-black uppercase tracking-widest text-white/80">Waiting for Data Selection</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompoundViewerPage;