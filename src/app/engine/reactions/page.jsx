'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Edit3, Beaker, Plus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ReactionManagementPage() {
    const router = useRouter();
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State to hold the ID of the reaction currently prompting for deletion
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmDeleteView, setConfirmDeleteView] = useState({ id: null, type: null });

    useEffect(() => {
        fetchReactions();
    }, []);

    const fetchReactions = async () => {
        try {
            const res = await fetch('/api/reactions');
            if (!res.ok) throw new Error('Failed to load reactions');
            const data = await res.json();
            setReactions(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const saveToEngine = async (updatedReactions) => {
        try {
            const res = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReactions)
            });
            if (!res.ok) throw new Error('Failed to save changes');
            setReactions(updatedReactions);
            // Sync with local autosave so that editor pages pick up deleted/modified reactions
            localStorage.setItem('molecool_reactions_autosave', JSON.stringify(updatedReactions));
        } catch (err) {
            alert("Error saving: " + err.message);
            // Re-fetch to reset state on failure
            fetchReactions();
        }
    };

    const deleteFullReaction = (id) => {
        const updated = reactions.filter(r => r.id !== id);
        saveToEngine(updated);
        setConfirmDeleteId(null);
    };

    const deleteView = (reactionId, viewType) => {
        const updated = reactions.map(r => {
            if (r.id === reactionId) {
                const newR = { ...r };
                if (viewType === 'Macro') delete newR.macroView;
                if (viewType === 'Micro') delete newR.microView;
                return newR;
            }
            return r;
        });
        saveToEngine(updated);
        setConfirmDeleteView({ id: null, type: null });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="max-w-6xl mx-auto px-6 py-12">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-3">
                            <Beaker size={36} className="text-cyan-500" />
                            Reaction Database
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">Manage the JSON engine containing all biological and chemical reactions.</p>
                    </div>

                    <Link href="/reaction-builder">
                        <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/30">
                            <Plus size={20} />
                            Create New Reaction
                        </button>
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-8">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Reactions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {reactions.map((reaction) => {
                        // A view "exists" if it is present AND has some actual configuration data.
                        // New reactions start with placeholder templates that shouldn't count as full views.
                        const hasMacro = !!reaction.macroView && 
                                         (reaction.macroView.visuals?.length > 1 || 
                                          Object.keys(reaction.macroView.visualRules?.timeline || {}).length > 0);
                                          
                        const hasMicro = !!reaction.microView && 
                                         (reaction.microView.script?.tracks?.length > 0 ||
                                          reaction.microView.script?.atoms?.length > 0);

                        return (
                            <div key={reaction.id} className="bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl p-6 transition-all flex flex-col group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold truncate pr-4" title={reaction.name}>{reaction.name}</h2>
                                    <button 
                                        onClick={() => setConfirmDeleteId(reaction.id)}
                                        className="text-gray-600 hover:text-red-400 bg-gray-800/50 hover:bg-red-500/10 p-2 rounded-lg transition-colors z-0"
                                        title="Delete Entire Reaction"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="bg-black/50 p-3 rounded-lg border border-gray-800 font-mono text-cyan-200 text-sm mb-6 text-center">
                                    {reaction.equation}
                                </div>

                                {/* Custom Inline Confirmation Dialogs */}
                                {confirmDeleteId === reaction.id && (
                                    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-center items-center text-center z-10 border border-red-500/50">
                                        <AlertCircle size={32} className="text-red-500 mb-4" />
                                        <h3 className="font-bold text-lg mb-2 text-white">Delete Entire Reaction?</h3>
                                        <p className="text-sm text-gray-400 mb-6">This will permanently remove "{reaction.name}" from the database. This action cannot be undone.</p>
                                        <div className="flex gap-3 w-full">
                                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">Cancel</button>
                                            <button onClick={() => deleteFullReaction(reaction.id)} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors">Delete</button>
                                        </div>
                                    </div>
                                )}

                                {confirmDeleteView.id === reaction.id && (
                                    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-center items-center text-center z-10 border border-orange-500/50">
                                        <AlertCircle size={32} className="text-orange-500 mb-4" />
                                        <h3 className="font-bold text-lg mb-2 text-white">Delete {confirmDeleteView.type} View?</h3>
                                        <p className="text-sm text-gray-400 mb-6">Are you sure you want to remove the {confirmDeleteView.type} visualization data for "{reaction.name}"?</p>
                                        <div className="flex gap-3 w-full">
                                            <button onClick={() => setConfirmDeleteView({ id: null, type: null })} className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors">Cancel</button>
                                            <button onClick={() => deleteView(reaction.id, confirmDeleteView.type)} className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors">Confirm Remove</button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto space-y-3 pt-4 border-t border-gray-800/50">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Simulated Views</h3>
                                    
                                    {/* Macro View Control */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {hasMacro ? <Eye size={16} className="text-green-400"/> : <EyeOff size={16} className="text-gray-600"/>}
                                            <span className={`text-sm ${hasMacro ? 'text-gray-300' : 'text-gray-600'}`}>Macro View</span>
                                        </div>
                                        {hasMacro ? (
                                            <button 
                                                onClick={() => setConfirmDeleteView({ id: reaction.id, type: 'Macro' })}
                                                className="text-xs text-red-400/70 hover:text-red-400 hover:underline px-2 py-1"
                                            >
                                                Delete
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-600 italic">Missing</span>
                                        )}
                                    </div>

                                    {/* Micro View Control */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {hasMicro ? <Eye size={16} className="text-blue-400"/> : <EyeOff size={16} className="text-gray-600"/>}
                                            <span className={`text-sm ${hasMicro ? 'text-gray-300' : 'text-gray-600'}`}>Micro View</span>
                                        </div>
                                        {hasMicro ? (
                                            <button 
                                                onClick={() => setConfirmDeleteView({ id: reaction.id, type: 'Micro' })}
                                                className="text-xs text-red-400/70 hover:text-red-400 hover:underline px-2 py-1"
                                            >
                                                Delete
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-600 italic">Missing</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {reactions.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            <Beaker size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No reactions found in the database.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
