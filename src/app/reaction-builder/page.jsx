'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Beaker, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Helper to format chemical strings with subscripts
// Leaves leading coefficients normal size, makes internal numbers subscript
const formatFormula = (text) => {
    if (!text) return '';
    // Replace any number that follows a letter or closing parenthesis with its subscript equivalent
    return text.replace(/([a-zA-Z\)])(\d+)/g, (match, p1, p2) => {
        const subscripts = p2.split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)]).join('');
        return p1 + subscripts;
    });
};

export default function ReactionBuilderPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [reactants, setReactants] = useState('');
    const [products, setProducts] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    // Computed formatted equation just for display
    const formattedReactants = formatFormula(reactants);
    const formattedProducts = formatFormula(products);
    const displayEquation = `${formattedReactants || 'Reagents'} → ${formattedProducts || 'Products'}`;

    const handleSave = async () => {
        if (!name || !reactants || !products) {
            setStatus({ type: 'error', message: 'Please fill in all fields.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Saving reaction...' });

        try {
            // First fetch existing reactions
            const res = await fetch('/api/reactions');
            if (!res.ok) throw new Error('Failed to fetch existing reactions');
            const existingReactions = await res.json();

            // Create new reaction object
            const newReaction = {
                id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: name,
                type: "Custom Built",
                equation: `${formattedReactants} → ${formattedProducts}`,
                apparatus: [],
                macroView: {
                    visuals: ["Custom reaction loaded"],
                    steps: ["Add reactants", "Observe reaction"],
                    visualRules: { timeline: {} }
                },
                microView: {
                    script: { atoms: [], bonds: [], tracks: [] }
                }
            };

            // Add to array
            const updatedReactions = [...existingReactions, newReaction];

            // Save back to API
            const saveRes = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedReactions)
            });

            if (!saveRes.ok) throw new Error('Failed to save to reactions.json');

            // Sync with local autosave so that editor pages pick up the new reaction
            localStorage.setItem('molecool_reactions_autosave', JSON.stringify(updatedReactions));

            setStatus({ type: 'success', message: 'Reaction saved successfully!' });
            
            // Redirect back to reactions dashboard after brief delay
            setTimeout(() => {
                router.push('/engine/reactions');
            }, 1500);

        } catch (error) {
            console.error("Save error:", error);
            setStatus({ type: 'error', message: 'An error occurred while saving.' });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 via-black to-black"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 h-screen flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/engine/reactions" className="p-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all bg-white/5 backdrop-blur-md">
                            <ArrowLeft size={24} className="text-white" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Reaction</span>
                                <span className="text-white/40 font-light ml-3 uppercase text-[32px]">Builder</span>
                            </h1>
                            <p className="text-white font-black tracking-widest uppercase text-xs mt-2 opacity-80">Design and balance new chemical equations.</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Input Form */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl">
                        
                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-white tracking-[0.2em] uppercase">Reaction Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Water Synthesis"
                                className="bg-white/5 border border-white/20 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold text-white placeholder:text-white/20"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-white tracking-[0.2em] uppercase flex items-center justify-between">
                                <span>Reactants</span>
                                <span className="text-white/40 font-bold normal-case text-[11px]">H₂ + O₂ Example</span>
                            </label>
                            <input 
                                type="text" 
                                value={reactants}
                                onChange={(e) => setReactants(e.target.value)}
                                placeholder="Reactants formula..."
                                className="bg-white/5 border border-white/20 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-xl text-white placeholder:text-white/10"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[13px] font-black text-white tracking-[0.2em] uppercase flex items-center justify-between">
                                <span>Products</span>
                                <span className="text-white/40 font-bold normal-case text-[11px]">H₂O Example</span>
                            </label>
                            <input 
                                type="text" 
                                value={products}
                                onChange={(e) => setProducts(e.target.value)}
                                placeholder="Products formula..."
                                className="bg-white/5 border border-white/20 rounded-2xl px-6 py-4 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-xl text-white placeholder:text-white/10"
                            />
                        </div>

                        {status.message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                                status.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            }`}>
                                {status.type === 'error' && <AlertCircle size={18} />}
                                {status.type === 'success' && <CheckCircle2 size={18} />}
                                {status.message}
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-white/10">
                            <button 
                                onClick={handleSave}
                                disabled={status.type === 'loading'}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} />
                                {status.type === 'loading' ? 'Synthesizing...' : 'Save to Engine'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live Preview */}
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center shadow-2xl relative overflow-hidden">
                        
                        {/* Decorative background grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none"></div>

                        <Beaker size={56} className="text-cyan-400 mb-8 blur-[0.5px]" />
                        
                        <h3 className="text-[13px] font-black text-white uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-3">
                            Equation Preview
                        </h3>

                        <div className="text-center w-full max-w-md mx-auto">
                            <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-inner overflow-x-auto custom-scrollbar">
                                <span className="font-mono text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 whitespace-nowrap">
                                    {displayEquation}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 text-center max-w-xs text-[13px] text-white font-bold leading-relaxed opacity-90">
                            Numbers following symbols will automatically format as <span className="text-cyan-400 font-mono">subscripts</span>. Coefficients remain normal size.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
