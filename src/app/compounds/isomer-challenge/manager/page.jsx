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
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#11112b] to-[#0d1430] text-gray-200 p-8 font-sans">
            
            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-900/30 rounded-2xl border border-cyan-800/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Database className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                            Isomer Database Manager
                        </h1>
                        <p className="text-sm text-gray-400 font-medium mt-1">Manage cloud-synced compounds for the Isomer Challenge.</p>
                    </div>
                </div>
                
                <div className="mt-6 md:mt-0 flex gap-3">
                    <button 
                        onClick={() => router.push('/compounds/isomer-challenge')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all backdrop-blur-md"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go to Game
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

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Form & Tools */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Add Form Card */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-cyan-500" />
                            Add Compound
                        </h2>

                        <form onSubmit={handleAddChallenge} className="space-y-5 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Chemical Formula</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. C6H14" 
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-white text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Number of Isomers</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={expected}
                                    onChange={(e) => setExpected(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-white text-lg"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isAdding || !target}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                            >
                                {isAdding ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>Append to Database</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Data Tools Card */}
                    <div className="bg-gradient-to-br from-indigo-950/30 to-purple-900/20 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Database Utilities</h2>
                        <p className="text-sm text-indigo-200/60 mb-5 leading-relaxed">
                            Initialize your Firestore database with the foundational set of isomer challenges if it's currently empty.
                        </p>
                        <button 
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        >
                            <RotateCcw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                            {isSeeding ? 'Seeding...' : 'Seed Default Compounds'}
                        </button>
                    </div>

                </div>

                {/* Right Column: Interactive Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
                        
                        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Cloud Synced Compounds
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/50 text-cyan-400 text-xs border border-cyan-800">
                                    {challenges.length} active
                                </span>
                            </h2>
                            <button onClick={fetchChallenges} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors" title="Refresh Data">
                                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {isLoading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                    <div className="w-10 h-10 border-4 border-cyan-900 border-t-cyan-500 rounded-full animate-spin"></div>
                                    <p className="font-medium animate-pulse">Syncing with Firestore...</p>
                                </div>
                            ) : challenges.length === 0 ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Database className="w-16 h-16 text-gray-700 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
                                    <p className="text-center max-w-sm mb-6 text-sm">Your isomer database is empty. You can add one manually or seed the default dataset.</p>
                                    <button onClick={handleSeedDefaults} className="px-6 py-2 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-800 font-semibold hover:bg-cyan-600/40 transition">
                                        Seed Database Now
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {challenges.map((c) => (
                                        <div key={c.id} className="group relative bg-[#090b14] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 shadow-lg transition-all hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)] hover:-translate-y-1 overflow-hidden">
                                            {/* Hover Glow Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                            
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target</p>
                                                    <h3 className="font-mono text-2xl font-extrabold text-white tracking-wide"><FormulaText text={c.target} /></h3>
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(c.id, c.target)}
                                                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all hover:bg-red-500 hover:text-white"
                                                    title="Delete Compound"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-end justify-between relative z-10">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Isomers</p>
                                                    <p className="text-lg font-bold text-cyan-400 flex items-center gap-1.5">
                                                        {c.expected} <span className="text-xs text-gray-600 font-normal ml-1">variants required</span>
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
    );
}
