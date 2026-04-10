'use client'; 

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Molecule3DModel from '@/components/Molecule3DModel';
import { formulaToJSX } from '@/utils/formulaUtils';

export default function EditAnglesPage() {
    const [compounds, setCompounds] = useState([]);
    const [selectedCompound, setSelectedCompound] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editor State
    const [localOverrides, setLocalOverrides] = useState({});
    const [localFormula, setLocalFormula] = useState('');
    const [localBonds, setLocalBonds] = useState([]);
    const [selectedAngleKey, setSelectedAngleKey] = useState(null);
    const [enableRotate, setEnableRotate] = useState(true);
    const [activeTab, setActiveTab] = useState('angles'); // 'angles' | 'bonds'

    useEffect(() => {
        const fetchCompounds = async () => {
            try {
                const q = query(collection(db, 'compounds'));
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompounds(results);
            } catch (err) {
                console.error("Error fetching", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompounds();
    }, []);

    // When compound selects, load its overrides, formula and bonds
    useEffect(() => {
        if (selectedCompound?.structure) {
            setLocalOverrides(selectedCompound.structure.angleOverrides || {});
            setLocalBonds(selectedCompound.structure.bonds ? [...selectedCompound.structure.bonds] : []);
            setSelectedAngleKey(null);
        }
        if (selectedCompound) {
            setLocalFormula(selectedCompound.formula || '');
        }
    }, [selectedCompound]);

    const activeAngles = useMemo(() => {
        if (!selectedCompound?.structure) return [];
        const { atoms, bonds } = selectedCompound.structure;
        if (!atoms || !bonds) return [];
        
        const angles = [];
        for (let c = 0; c < atoms.length; c++) {
            const connectedBonds = bonds.filter(b => b.a === c || b.b === c);
            const neighbors = connectedBonds.map(bond => {
                return { id: bond.a === c ? bond.b : bond.a };
            });
            for (let i = 0; i < neighbors.length; i++) {
                for (let j = i + 1; j < neighbors.length; j++) {
                    const nA = neighbors[i];
                    const nB = neighbors[j];
                    const key = `${c}-${Math.min(nA.id, nB.id)}-${Math.max(nA.id, nB.id)}`;
                    angles.push({ center: c, a: nA.id, b: nB.id, key });
                }
            }
        }
        return angles;
    }, [selectedCompound]);

    const activeHighlight = useMemo(() => {
        if (!selectedAngleKey || !selectedCompound?.structure) return null;
        const [c, a, b] = selectedAngleKey.split('-').map(Number);
        
        const bonds = selectedCompound.structure.bonds;
        const targetBonds = new Set();
        
        bonds.forEach((bond, index) => {
            if ((bond.a === c && bond.b === a) || (bond.a === a && bond.b === c)) targetBonds.add(index);
            if ((bond.a === c && bond.b === b) || (bond.a === b && bond.b === c)) targetBonds.add(index);
        });

        return {
            atoms: new Set([c, a, b]),
            bonds: targetBonds
        };
    }, [selectedAngleKey, selectedCompound]);

    const handleOverrideChange = (key, field, value) => {
        setLocalOverrides(prev => {
            const updated = { ...prev };
            if (!updated[key]) updated[key] = {};
            updated[key][field] = value;
            return updated;
        });
    };

    const handleBondOrderChange = (bondIndex, newOrder) => {
        setLocalBonds(prev => prev.map((b, i) => i === bondIndex ? { ...b, order: newOrder } : b));
    };

    const handleSave = async () => {
        if (!selectedCompound) return;
        setSaving(true);
        try {
            const ref = doc(db, 'compounds', selectedCompound.id);
            const updates = {
                'structure.angleOverrides': localOverrides,
                'structure.bonds': localBonds,
            };
            // Only update formula if it was changed
            if (localFormula.trim() && localFormula.trim() !== (selectedCompound.formula || '')) {
                updates.formula = localFormula.trim();
            }
            await updateDoc(ref, updates);
            alert("Saved successfully!");
            // Update local state
            setSelectedCompound(prev => ({
                ...prev,
                formula: localFormula.trim() || prev.formula,
                structure: { ...prev.structure, angleOverrides: localOverrides, bonds: localBonds }
            }));
            
            // Re-fetch compound list to avoid sync issues
            const snapshot = await getDocs(query(collection(db, 'compounds')));
            setCompounds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-cyan-400">Loading Compounds...</div>;

    const currentOverride = selectedAngleKey ? (localOverrides[selectedAngleKey] || {}) : null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-black text-white overflow-hidden">
            
            {/* LEFT SIDEBAR - Compound List */}
            <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-xl font-bold text-cyan-400">Library</h2>
                <div className="flex flex-col gap-2">
                    {compounds.map(c => (
                        <button 
                            key={c.id} 
                            onClick={() => setSelectedCompound(c)}
                            className={`text-left p-2 rounded text-sm transition-colors ${
                                selectedCompound?.id === c.id ? 'bg-cyan-700 text-white font-bold' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}
                        >
                            <div>{c.name}</div>
                            <div className="text-xs opacity-60 font-mono mt-0.5">{formulaToJSX(c.formula)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* MIDDLE AREA - 3D Viewer */}
            <div className="flex-1 relative flex flex-col p-4 bg-black/90">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-bold">Angle Adjuster Tool</h1>
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-900 border border-gray-700 px-3 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 transition">
                            <input 
                                type="checkbox" 
                                checked={enableRotate} 
                                onChange={(e) => setEnableRotate(e.target.checked)}
                                className="accent-cyan-500 w-4 h-4"
                            />
                            Auto-Rotate 3D View
                        </label>
                    </div>
                    {selectedCompound && (
                        <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow-lg">
                            {saving ? 'Saving...' : 'Save to Database'}
                        </button>
                    )}
                </div>
                
                <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-inner relative">
                    {selectedCompound ? (
                        <Molecule3DModel 
                            structure={{ ...selectedCompound.structure, bonds: localBonds }}
                            forceShowAngles={true}
                            angleOverrides={localOverrides}
                            enableAutoRotate={enableRotate}
                            highlightedGroup={activeHighlight}
                            selectedAngleKey={selectedAngleKey}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            Select a compound from the library
                        </div>
                    )}
                </div>
                
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200">
                    <p><strong>Instructions:</strong> Angles are notoriously difficult to properly project on irregular geometric planes due to Cartesian cross products. If an arc is flipped outwards, inverted, or spans the external 360-degree major angle, click the angle in the sidebar to manually force its rendering behavior.</p>
                </div>
            </div>

            {/* RIGHT SIDEBAR - Angle List & Editor */}
            <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    {/* Tab switcher */}
                    <div className="flex gap-1 mb-3 bg-black/40 rounded-lg p-1">
                        <button 
                            onClick={() => setActiveTab('angles')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'angles' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Angles
                        </button>
                        <button 
                            onClick={() => setActiveTab('bonds')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'bonds' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Bond Orders
                        </button>
                    </div>

                    {activeTab === 'angles' && <p className="text-xs text-gray-400">Select an angle to override.</p>}
                    {activeTab === 'bonds' && <p className="text-xs text-gray-400">Set bond order (1=single, 2=double, 3=triple).</p>}

                    {/* Formula Editor */}
                    {selectedCompound && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Formula</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={localFormula}
                                    onChange={(e) => setLocalFormula(e.target.value)}
                                    className="flex-1 bg-black border border-gray-600 rounded px-2 py-1 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                                    placeholder="e.g. H2O"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Preview: <span className="font-mono text-cyan-400">{formulaToJSX(localFormula)}</span></p>
                        </div>
                    )}
                </div>

                
                <div className="flex-1 overflow-y-auto p-2">
                    {/* ANGLES TAB */}
                    {activeTab === 'angles' && (
                        <div className="flex flex-col gap-1">
                            {activeAngles.map(ang => (
                                <button
                                    key={ang.key}
                                    onClick={() => setSelectedAngleKey(ang.key)}
                                    className={`text-left text-sm py-2 px-3 rounded flex justify-between items-center ${
                                        selectedAngleKey === ang.key ? 'bg-yellow-600 text-white font-bold' : 'hover:bg-gray-800'
                                    }`}
                                >
                                    <span className="font-mono">
                                        {selectedCompound.structure.atoms[ang.a].element} ({ang.a}) - 
                                        {selectedCompound.structure.atoms[ang.center].element} ({ang.center}) - 
                                        {selectedCompound.structure.atoms[ang.b].element} ({ang.b})
                                    </span>
                                    {localOverrides[ang.key] && Object.keys(localOverrides[ang.key]).length > 0 && (
                                        <span className="text-[10px] bg-white/20 px-1 rounded">Edited</span>
                                    )}
                                </button>
                            ))}
                            {activeAngles.length === 0 && selectedCompound && (
                                <p className="text-sm text-gray-500 p-2">No angles calculated.</p>
                            )}
                        </div>
                    )}

                    {/* BOND ORDERS TAB */}
                    {activeTab === 'bonds' && (
                        <div className="flex flex-col gap-1.5">
                            {localBonds.map((bond, i) => {
                                const atoms = selectedCompound?.structure?.atoms || [];
                                const elemA = atoms[bond.a]?.element || '?';
                                const elemB = atoms[bond.b]?.element || '?';
                                const order = bond.order || 1;
                                return (
                                    <div key={i} className="flex items-center justify-between bg-gray-800/70 rounded px-3 py-2 text-sm">
                                        <span className="font-mono text-gray-300 text-xs">
                                            {elemA}<sub className="text-[9px]">{bond.a}</sub>
                                            {' — '}
                                            {elemB}<sub className="text-[9px]">{bond.b}</sub>
                                        </span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(o => (
                                                <button
                                                    key={o}
                                                    onClick={() => handleBondOrderChange(i, o)}
                                                    title={o === 1 ? 'Single' : o === 2 ? 'Double' : 'Triple'}
                                                    className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                                                        order === o
                                                            ? o === 1 ? 'bg-white text-black'
                                                            : o === 2 ? 'bg-cyan-500 text-white'
                                                            : 'bg-purple-500 text-white'
                                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {localBonds.length === 0 && (
                                <p className="text-sm text-gray-500 p-2">No bonds found.</p>
                            )}
                        </div>
                    )}
                </div>

                {selectedAngleKey && (
                    <div className="p-4 bg-gray-800 border-t border-gray-700 flex flex-col gap-4 max-h-[55vh] overflow-y-auto shrink-0">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-yellow-400">Editing: {selectedAngleKey}</h3>
                            <button onClick={() => setSelectedAngleKey(null)} className="text-gray-400 hover:text-white bg-gray-700 rounded w-6 h-6 flex items-center justify-center font-bold text-xs">&times;</button>
                        </div>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer group">
                            <div className={`w-8 h-4 rounded-full px-0.5 flex items-center transition-colors ${currentOverride?.invertNormal ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${currentOverride?.invertNormal ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-gray-300">Invert Normal (Flip Plane)</span>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={!!currentOverride?.invertNormal} 
                                onChange={(e) => handleOverrideChange(selectedAngleKey, 'invertNormal', e.target.checked)}
                            />
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer group">
                            <div className={`w-8 h-4 rounded-full px-0.5 flex items-center transition-colors ${currentOverride?.swapVectors ? 'bg-blue-500' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${currentOverride?.swapVectors ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-gray-300">Swap Vectors (Swap A/B)</span>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={!!currentOverride?.swapVectors} 
                                onChange={(e) => handleOverrideChange(selectedAngleKey, 'swapVectors', e.target.checked)}
                            />
                        </label>

                        <label className="flex items-center gap-2 text-sm cursor-pointer group">
                            <div className={`w-8 h-4 rounded-full px-0.5 flex items-center transition-colors ${currentOverride?.majorAngle ? 'bg-red-500' : 'bg-gray-600'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${currentOverride?.majorAngle ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-gray-300">Exterior Angle (360 - X°)</span>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={!!currentOverride?.majorAngle} 
                                onChange={(e) => handleOverrideChange(selectedAngleKey, 'majorAngle', e.target.checked)}
                            />
                        </label>

                        <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-700">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rotation Offsets (Degrees)</h4>
                            {['X', 'Y', 'Z'].map(axis => (
                                <div className="flex flex-col gap-1" key={`rot${axis}`}>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-300">Rotate {axis}</span>
                                        <span className="text-gray-500 font-mono">{(currentOverride?.[`rot${axis}`] || 0).toFixed(1)}°</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="-180" 
                                        max="180" 
                                        step="1" 
                                        value={currentOverride?.[`rot${axis}`] || 0}
                                        onChange={(e) => handleOverrideChange(selectedAngleKey, `rot${axis}`, parseFloat(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-700">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Position Offsets (Å)</h4>
                            {['X', 'Y', 'Z'].map(axis => (
                                <div className="flex flex-col gap-1" key={`pos${axis}`}>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-300">Offset {axis}</span>
                                        <span className="text-gray-500 font-mono">{(currentOverride?.[`pos${axis}`] || 0).toFixed(2)}Å</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="-3" 
                                        max="3" 
                                        step="0.1" 
                                        value={currentOverride?.[`pos${axis}`] || 0}
                                        onChange={(e) => handleOverrideChange(selectedAngleKey, `pos${axis}`, parseFloat(e.target.value))}
                                        className="w-full accent-green-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-1 py-3 border-t border-gray-700">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scale</h4>
                            <div className="flex justify-between items-center text-xs mb-1">
                                <span className="text-gray-300">Arc Radius (Å)</span>
                                <span className="text-gray-500 font-mono">{(currentOverride?.arcRadius || 1.0).toFixed(2)}Å</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="4.0" 
                                step="0.1" 
                                value={currentOverride?.arcRadius || 1.0}
                                onChange={(e) => handleOverrideChange(selectedAngleKey, 'arcRadius', parseFloat(e.target.value))}
                                className="w-full accent-cyan-500"
                            />
                        </div>

                        <button 
                            onClick={() => {
                                setLocalOverrides(prev => {
                                    const next = { ...prev };
                                    const savedOverride = selectedCompound?.structure?.angleOverrides?.[selectedAngleKey];
                                    if (savedOverride) {
                                        next[selectedAngleKey] = { ...savedOverride };
                                    } else {
                                        delete next[selectedAngleKey];
                                    }
                                    return next;
                                });
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 border border-red-900/50 p-2 rounded"
                        >
                            Revert Angle to Saved
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
