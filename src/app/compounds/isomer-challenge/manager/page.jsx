'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Database, CheckCircle2, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DEFAULT_CHALLENGES = [
    { target: 'C4H10', expected: 2 },
    { target: 'C3H8O', expected: 3 },
    { target: 'C5H12', expected: 3 },
    { target: 'C2H6O', expected: 2 },
];

const FormulaText = ({ text }) => {
    if (!text) return null;
    return (
        <>
            {text.split(/(\d+)/).map((p, i) => /^\d+$/.test(p) ? <sub className="text-[0.7em] bottom-[-0.2em]" key={i}>{p}</sub> : p)}
        </>
    );
};

export default function IsomerChallengeManager() {
    const [challenges, setChallenges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [target, setTarget] = useState('');
    const [expected, setExpected] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', body: string }

    const router = useRouter();

    const fetchChallenges = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'isomerChallenges'));
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            // Sort to ensure deterministic order (assuming we have createdAt, or just by target string)
            data.sort((a, b) => a.target.localeCompare(b.target));
            setChallenges(data);
        } catch (error) {
            console.error("Error fetching challenges:", error);
            setMessage({ type: 'error', body: 'Failed to fetch challenges from Firebase.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    const showMessage = (type, body) => {
        setMessage({ type, body });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleAddChallenge = async (e) => {
        e.preventDefault();
        if(!target || expected < 1) return;
        setIsAdding(true);
        try {
            await addDoc(collection(db, 'isomerChallenges'), {
                target: target.trim().toUpperCase(),
                expected: parseInt(expected, 10),
                createdAt: serverTimestamp()
            });
            showMessage('success', `${target.trim().toUpperCase()} added successfully!`);
            setTarget('');
            setExpected(1);
            fetchChallenges();
        } catch (error) {
            console.error("Error adding:", error);
            showMessage('error', 'Error adding compound. Check console.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id, targetName) => {
        if(!window.confirm(`Are you sure you want to delete ${targetName}?`)) return;
        try {
            await deleteDoc(doc(db, 'isomerChallenges', id));
            showMessage('success', `${targetName} deleted.`);
            setChallenges(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
            showMessage('error', 'Failed to delete compound.');
        }
    };

    const handleSeedDefaults = async () => {
        if(!window.confirm('This will append the default 4 base formulas to the database. Continue?')) return;
        setIsSeeding(true);
        try {
            for(let ch of DEFAULT_CHALLENGES) {
                await addDoc(collection(db, 'isomerChallenges'), {
                    target: ch.target,
                    expected: ch.expected,
                    createdAt: serverTimestamp()
                });
            }
            showMessage('success', 'Default compounds seeded successfully!');
            fetchChallenges();
        } catch (error) {
            console.error("Error seeding:", error);
            showMessage('error', 'Failed to seed defaults.');
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="theme-internal">
            <div className="min-h-screen bg-transparent text-white p-8 relative overflow-hidden">
                {/* Animated Background */}
                <div className="bg-mesh-container">
                    <div className="bg-mesh-blob blob-1" />
                    <div className="bg-mesh-blob blob-2" />
                    <div className="bg-mesh-blob blob-3" />
                </div>
                
                {/* Header */}
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 pb-8 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 glass-card !bg-white/5 border-white/10 rounded-none shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <Database className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                                Isomer <br />
                                <span className="text-white/40 font-light text-2xl">Database Manager</span>
                            </h1>
                            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/60 mt-2 leading-relaxed">System-wide compound repository administrator.</p>
                        </div>
                    </div>
                    
                    <div className="mt-8 md:mt-0 flex gap-4">
                        <button 
                            onClick={() => router.push('/compounds/isomer-challenge')}
                            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-widest transition-all tap-animation backdrop-blur-md rounded-none"
                        >
                            <ArrowLeft className="w-4 h-4" /> Exit to Lab
                        </button>
                    </div>
                </div>

            {/* Notification Toast */}
            {message && (
                <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
                        message.type === 'success' 
                        ? 'bg-green-950/80 border-green-800 text-green-300 shadow-green-900/20' 
                        : 'bg-red-950/80 border-red-800 text-red-300 shadow-red-900/20'
                    } backdrop-blur-xl`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-semibold">{message.body}</span>
                    </div>
                </div>
            )}

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                    
                    {/* Left Column: Form & Tools */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Add Form Card */}
                        <div className="glass-card !bg-black/40 backdrop-blur-3xl border border-white/10 rounded-none p-8 shadow-2xl relative overflow-hidden">
                            <h2 className="text-[12px] font-black text-white/70 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Plus className="w-5 h-5 text-white/60" />
                                Add Compound
                            </h2>

                            <form onSubmit={handleAddChallenge} className="space-y-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Chemical Formula
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. C6H14" 
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="w-full glass-pill !bg-white/5 border border-white/10 rounded-none px-5 py-4 placeholder-white/40 focus:outline-none focus:border-white/30 transition-all font-mono text-white text-xl font-black"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        Expected Isomers
                                    </label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={expected}
                                        onChange={(e) => setExpected(e.target.value)}
                                        className="w-full glass-pill !bg-white/5 border border-white/10 rounded-none px-5 py-4 focus:outline-none focus:border-white/30 transition-all font-mono text-white text-xl font-black"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isAdding || !target}
                                    className="w-full mt-4 flex items-center justify-center gap-3 py-5 rounded-none bg-white text-black hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed font-black text-[12px] uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] relative overflow-hidden"
                                >
                                    {isAdding ? (
                                        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent animate-shimmer" />
                                            Append to Database
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Data Tools Card */}
                        <div className="glass-card !bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-none p-8 shadow-xl">
                            <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em] mb-4">Database Utilities</h2>
                            <p className="text-[11px] font-black text-white/50 uppercase tracking-widest leading-relaxed mb-6">
                                Initialize your cloud database with the foundational set of challenges.
                            </p>
                            <button 
                                onClick={handleSeedDefaults}
                                disabled={isSeeding}
                                className="w-full flex items-center justify-center gap-3 py-4 border border-white/20 bg-white/10 hover:bg-white/20 text-[11px] font-black text-white uppercase tracking-widest rounded-none transition-all tap-animation"
                            >
                                <RotateCcw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                                {isSeeding ? 'Syncing...' : 'Seed Defaults'}
                            </button>
                        </div>

                    </div>

                    {/* Right Column: Interactive Table */}
                    <div className="lg:col-span-2">
                        <div className="glass-card !bg-black/40 backdrop-blur-3xl border border-white/10 rounded-none overflow-hidden shadow-2xl flex flex-col h-full min-h-[600px]">
                            
                            <div className="p-8 border-b border-white/10 bg-white/[0.05] flex justify-between items-center">
                                <h2 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                                    Cloud Database
                                    <span className="px-3 py-1 rounded-none bg-white text-black text-[11px] font-black">
                                        {challenges.length} ENTRIES
                                    </span>
                                </h2>
                                <button onClick={fetchChallenges} className="p-3 rounded-none bg-white font-black text-black hover:bg-white/90 transition-all tap-animation shadow-2xl" title="Refresh Sync">
                                    <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                                {isLoading ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 space-y-6">
                                        <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Firestore...</p>
                                    </div>
                                ) : challenges.length === 0 ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                        <Database className="w-20 h-20 mb-6 text-white animate-pulse" />
                                        <h3 className="text-[18px] font-black text-white uppercase tracking-[0.3em] mb-3">No Data Entries</h3>
                                        <p className="text-center text-[11px] font-black uppercase tracking-widest max-w-sm mb-8 text-white/60">The repository is currently empty. Initialize a seed or manually append compounds to begin.</p>
                                        <button onClick={handleSeedDefaults} className="px-12 py-4 bg-white text-black text-[12px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all tap-animation shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                            Seed Repository
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {challenges.map((c) => (
                                            <div key={c.id} className="group relative glass-pill !bg-white/[0.03] border-white/10 hover:border-white/30 rounded-none p-8 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:-translate-y-1 overflow-hidden">
                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                                
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div>
                                                        <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Structure</p>
                                                        <h3 className="font-mono text-3xl font-black text-white tracking-widest filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"><FormulaText text={c.target} /></h3>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDelete(c.id, c.target)}
                                                        className="p-3 bg-white text-black opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white border border-transparent shadow-2xl"
                                                        title="Delete entry"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-white/10 flex items-end justify-between relative z-10">
                                                    <div>
                                                        <p className="text-[11px] text-white font-black uppercase tracking-widest mb-2">Challenge Constraints</p>
                                                        <p className="text-2xl font-black text-white flex items-center gap-3">
                                                            {c.expected} <span className="text-[11px] text-white/40 font-black uppercase tracking-widest">Known Isomers</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
