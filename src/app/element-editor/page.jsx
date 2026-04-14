"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Plus, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";

export default function ElementEditorPage() {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeElementId, setActiveElementId] = useState(null);
    
    // Form state corresponding to the active element
    const [formData, setFormData] = useState({});
    
    // Status tracking for UX
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
    
    // Add field state
    const [newFieldKey, setNewFieldKey] = useState("");
    const [newFieldValue, setNewFieldValue] = useState("");

    // Fetch elements on mount
    useEffect(() => {
        const fetchElements = async () => {
            try {
                const q = query(collection(db, "elements"), orderBy("atomic_number"));
                const snapshot = await getDocs(q);
                // Map the data AND explicitly attach the Firebase document ID needed for updates
                const data = snapshot.docs.map(doc => ({ 
                    _firebaseId: doc.id, // Prefix to avoid key collision if 'id' exists
                    ...doc.data() 
                }));
                setElements(data);
            } catch (err) {
                console.error("Failed to load elements", err);
            } finally {
                setLoading(false);
            }
        };
        fetchElements();
    }, []);

    // Load selected element into form editor
    const handleSelectElement = (el) => {
        setActiveElementId(el._firebaseId);
        
        // Strip out the internal Firebase ID so it doesn't get rendered as an editable key
        const { _firebaseId, ...cleanData } = el;
        setFormData(cleanData);
        setSaveStatus(null);
        setNewFieldKey("");
        setNewFieldValue("");
    };

    // Update form dynamically
    const handleFieldChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
        setSaveStatus(null);
    };

    // Add completely new custom field
    const handleAddField = () => {
        if (!newFieldKey.trim()) return;
        
        const cleanKey = newFieldKey.trim().toLowerCase().replace(/\s+/g, '_');
        
        // Prevent accidental overwriting of locked keys
        if (cleanKey === 'id' || cleanKey === 'atomic_number') {
            alert("Cannot manually append protected internal ID keys.");
            return;
        }

        setFormData(prev => ({
            ...prev,
            [cleanKey]: newFieldValue
        }));
        setNewFieldKey("");
        setNewFieldValue("");
        setSaveStatus(null);
    };
    
    // Delete a dynamically added field before saving
    const handleRemoveField = (keyToRemove) => {
        if (keyToRemove === 'id' || keyToRemove === 'atomic_number' || keyToRemove === 'symbol' || keyToRemove === 'name') {
            alert("This primary key cannot be removed.");
            return;
        }
        
        setFormData(prev => {
            const newState = { ...prev };
            delete newState[keyToRemove];
            return newState;
        });
        setSaveStatus(null);
    };

    // Push explicitly to Firebase
    const handleSaveChanges = async () => {
        if (!activeElementId) return;
        
        try {
            setSaveStatus("saving");
            const elementRef = doc(db, "elements", activeElementId);
            
            // Push the current form state payload to Firebase cloud
            await updateDoc(elementRef, formData);
            
            // Re-sync local elements array so sidebar names update if changed
            setElements(prev => prev.map(el => 
                el._firebaseId === activeElementId ? { ...formData, _firebaseId: activeElementId } : el
            ));
            
            setSaveStatus("success");
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error("Failed to push update:", error);
            setSaveStatus("error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050510] flex items-center justify-center text-cyan-500 font-mono">
                INITIALIZING DATABASE CONNECTION...
            </div>
        );
    }

    // Determine current read-only fields
    const lockedKeys = ['id', 'atomic_number'];

    return (
        <div className="flex w-full h-[calc(100vh-64px)] bg-[#05050a] text-white overflow-hidden font-sans">
            
            {/* SIDEBAR - Element Selection */}
            <div className="w-80 border-r border-white/5 bg-[#0a0a14] flex flex-col h-full shrink-0">
                <div className="p-5 border-b border-white/5 bg-black/40">
                    <h2 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-yellow-500" />
                        DATABASE EDITOR
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-wider">NoSQL Schema Controller</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {elements.map(el => (
                        <button
                            key={el._firebaseId}
                            onClick={() => handleSelectElement(el)}
                            className={`w-full flex items-center text-left p-3 rounded-xl transition-all border ${
                                activeElementId === el._firebaseId 
                                ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' 
                                : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'
                            }`}
                        >
                            <span className="w-10 text-xs font-mono text-gray-600 border-r border-white/10 mr-3">{el.atomic_number}</span>
                            <span className="w-8 font-bold font-mono text-gray-300">{el.symbol}</span>
                            <span className="flex-1 text-sm font-medium">{el.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN PANEL - Active Editor */}
            <div className="flex-1 flex flex-col relative bg-gradient-to-br from-[#080812] to-[#040408]">
                {activeElementId ? (
                    <>
                        {/* Header Banner */}
                        <div className="px-8 py-6 border-b border-white/5 bg-black/20 flex justify-between items-end backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h1 className="text-4xl font-extrabold text-white flex items-baseline gap-4">
                                    {formData.name || 'Unknown Element'}
                                    <span className="text-xl font-mono text-gray-500">{formData.symbol}</span>
                                </h1>
                                <p className="text-sm text-yellow-500/80 mt-2 font-mono">
                                    DOC_ID: {activeElementId}
                                </p>
                            </div>
                            
                            <button
                                onClick={handleSaveChanges}
                                disabled={saveStatus === 'saving'}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-xl disabled:opacity-50 ${
                                    saveStatus === 'success' 
                                    ? 'bg-emerald-600 text-white border border-emerald-400'
                                    : saveStatus === 'error'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-white hover:scale-105 hover:shadow-yellow-600/20 shadow-lg'
                                }`}
                            >
                                {saveStatus === 'saving' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : saveStatus === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : saveStatus === 'error' ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {saveStatus === 'saving' ? 'PUSHING...' : saveStatus === 'success' ? 'SYNCED' : 'SAVE TO CLOUD'}
                            </button>
                        </div>

                        {/* Editor Canvas */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-4xl mx-auto space-y-8">
                                
                                {/* Dynamic Dictionary Loop */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                                        Active Schema Data
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        {Object.entries(formData).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => {
                                            const isLocked = lockedKeys.includes(key);
                                            
                                            return (
                                                <div key={key} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-colors ${
                                                    isLocked ? 'bg-black/40 border-red-500/10' : 'bg-black/20 border-white/5 hover:border-white/10'
                                                }`}>
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-xs font-mono font-bold text-yellow-500 flex items-center gap-2">
                                                            {key}
                                                            {isLocked && <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">LOCKED</span>}
                                                        </label>
                                                        {!isLocked && (
                                                            <button 
                                                                onClick={() => handleRemoveField(key)}
                                                                className="text-xs text-red-500/50 hover:text-red-400 font-bold uppercase transition"
                                                            >
                                                                Delete Key
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Multiline for strings that look like paragraphs */}
                                                    {typeof value === 'string' && value.length > 50 && !isLocked ? (
                                                        <textarea 
                                                            value={value}
                                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                                            rows={4}
                                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 font-sans"
                                                        />
                                                    ) : (
                                                        <input 
                                                            type={typeof value === 'number' ? 'number' : 'text'}
                                                            value={value || ''}
                                                            onChange={(e) => {
                                                                // Convert to number if it's supposed to be
                                                                const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
                                                                handleFieldChange(key, val);
                                                            }}
                                                            disabled={isLocked}
                                                            className={`w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 font-mono ${
                                                                isLocked ? 'text-gray-500 opacity-70 cursor-not-allowed' : 'text-gray-200'
                                                            }`}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Field Instantiator */}
                                <div className="mt-12 bg-[#101018] border border-dashed border-white/20 p-6 rounded-3xl">
                                    <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-4">
                                        <Plus className="w-4 h-4 text-emerald-400" />
                                        Inject New Property Key
                                    </h3>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                value={newFieldKey}
                                                onChange={(e) => setNewFieldKey(e.target.value)}
                                                placeholder="e.g. electronegativity"
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <input 
                                                type="text" 
                                                value={newFieldValue}
                                                onChange={(e) => setNewFieldValue(e.target.value)}
                                                placeholder="Value..."
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 font-sans focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleAddField}
                                            disabled={!newFieldKey.trim()}
                                            className="px-6 py-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl font-bold transition-colors border border-emerald-500/50 disabled:opacity-30"
                                        >
                                            APPEND
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 font-mono">
                                        Fields added here will instantaneously append to the element payload upon cloud synchronization.
                                    </p>
                                </div>

                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                        <FlaskConical className="w-24 h-24 text-white mb-6" />
                        <h2 className="text-2xl font-bold text-white tracking-widest font-mono">STANDBY</h2>
                        <p className="text-gray-400 mt-2">Select an element matrix from the registry map to begin payload modulation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
