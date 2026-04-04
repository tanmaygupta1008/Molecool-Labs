'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { User, Mail, Calendar, Activity, Zap, Shield, FlaskConical, Award, Edit2, Check, Star, Trophy, Flame, TrendingUp, Target, Crown } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [savedSetupsCount, setSavedSetupsCount] = useState(0);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [updateStatus, setUpdateStatus] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setNewName(user.displayName || '');
            
            // Read saved setups metric
            try {
                const autosaved = localStorage.getItem('molecool_reactions_autosave');
                if (autosaved) {
                    const parsed = JSON.parse(autosaved);
                    if (Array.isArray(parsed)) {
                        setSavedSetupsCount(parsed.length);
                    }
                }
            } catch(e) {
                console.error("Could not load local metrics", e);
            }
        }
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const getInitials = (name, email) => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
            return name.substring(0, 2).toUpperCase();
        }
        if (email) return email.substring(0, 2).toUpperCase();
        return 'ML';
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || newName === user.displayName) {
            setIsEditingName(false);
            return;
        }

        try {
            setUpdateStatus('updating');
            await updateProfile(user, { displayName: newName });
            setIsEditingName(false);
            setUpdateStatus('success');
            setTimeout(() => setUpdateStatus(''), 2000);
        } catch (error) {
            console.error(error);
            setUpdateStatus('error');
            setTimeout(() => setUpdateStatus(''), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6 overflow-x-hidden font-sans">
            <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Profile Card */}
                <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar & Rank */}
                        <div className="relative shrink-0 flex flex-col items-center">
                            <div className="relative">
                                {/* Glowing competitive ring */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full blur-[8px] opacity-70 animate-pulse"></div>
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full z-0"></div>
                                
                                <div className="w-32 h-32 rounded-full relative z-10 bg-[#0a0a0a] flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-900 to-purple-900 border-2 border-black flex items-center justify-center text-4xl font-bold text-white shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                                        {getInitials(user.displayName, user.email)}
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black px-4 py-1.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300/50 z-20 flex items-center gap-1 w-max">
                                    <Crown size={12} className="text-yellow-300" /> Diamond Tier
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                                <TrendingUp size={12} className="text-green-400" /> Rank: #42 Global
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                            <div className="flex flex-col items-center md:items-start gap-1 w-full text-center md:text-left">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 w-full max-w-sm">
                                        <input 
                                            value={newName} 
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-black/50 border border-blue-500/50 rounded-lg px-3 py-1.5 text-2xl font-bold w-full text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateName} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors">
                                            <Check size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                                            {user.displayName || 'Lab Researcher'}
                                        </h1>
                                        <button onClick={() => setIsEditingName(true)} className="text-neutral-500 hover:text-blue-400 transition-colors p-1">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                                
                                {updateStatus === 'updating' && <span className="text-xs text-blue-400">Saving...</span>}
                                {updateStatus === 'success' && <span className="text-xs text-green-400">Profile updated!</span>}
                                {updateStatus === 'error' && <span className="text-xs text-red-400">Failed to update</span>}

                                <div className="flex items-center gap-2 text-neutral-400 mt-1">
                                    <Mail size={14} />
                                    <span className="text-sm">{user.email}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                    <Calendar size={14} className="text-neutral-400" />
                                    <span className="text-xs text-neutral-300">Joined <span className="font-semibold text-white">{new Date(user.metadata.creationTime).toLocaleDateString()}</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                    <Activity size={14} className="text-green-400" />
                                    <span className="text-xs text-green-300">Last Active <span className="font-semibold text-green-400">Today</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Metrics & Stats */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Stat Card 1 */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <FlaskConical size={64} />
                                </div>
                                <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Saved Setups
                                </h3>
                                <div className="text-4xl font-black mt-2 text-white">{savedSetupsCount}</div>
                                <p className="text-[10px] text-neutral-400 mt-2">Custom laboratory configurations created.</p>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={64} />
                                </div>
                                <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> XP Earned
                                </h3>
                                <div className="text-4xl font-black mt-2 text-white">4,250</div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-full w-[65%] rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-2 text-right">350 to next level</p>
                            </div>

                            {/* Stat Card 3 - Competitive */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Target size={64} />
                                </div>
                                <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Accuracy Score
                                </h3>
                                <div className="text-4xl font-black mt-2 text-white">94.2<span className="text-xl text-red-500">%</span></div>
                                <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                                    <TrendingUp size={10} className="text-green-400"/> Top 5% of all chemists
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity Mock */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-blue-500" /> Recent Activity
                            </h2>
                            <div className="flex flex-col gap-0">
                                {[
                                    { title: "Created new setup 'Distillation Test'", time: "2 hours ago", icon: <FlaskConical size={14}/>, color: "text-blue-400" },
                                    { title: "Earned Badge: 'Safety First'", time: "Yesterday", icon: <Shield size={14}/>, color: "text-green-400" },
                                    { title: "Updated Profile details", time: "3 days ago", icon: <User size={14}/>, color: "text-purple-400" }
                                ].map((act, i, arr) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${act.color} group-hover:scale-110 transition-transform`}>
                                                {act.icon}
                                            </div>
                                            {i !== arr.length - 1 && <div className="w-[1px] h-full min-h-[30px] bg-white/10 my-1"></div>}
                                        </div>
                                        <div className="pb-6 pt-1">
                                            <p className="text-sm text-neutral-200">{act.title}</p>
                                            <span className="text-xs text-neutral-500">{act.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Achievements & Leaderboard */}
                    <div className="flex flex-col gap-8">
                        {/* Global Leaderboard Mini Widget */}
                        <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden">
                            {/* Decorative background flare */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>

                            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                                <Trophy size={16} /> Global Top Chemists
                            </h2>

                            <div className="flex flex-col gap-3 relative z-10">
                                {[
                                    { rank: 1, name: "MarieCurie_99", score: "84,250", isUser: false },
                                    { rank: 2, name: "Heisenberg", score: "81,100", isUser: false },
                                    { rank: 3, name: "ChemWizard", score: "79,500", isUser: false },
                                    { rank: 42, name: user.displayName || "You", score: "4,250", isUser: true },
                                ].map((player, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${player.isUser ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5'} transition-all`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 flex items-center justify-center font-bold text-[10px] rounded-sm ${player.rank === 1 ? 'bg-yellow-500 text-black' : player.rank === 2 ? 'bg-neutral-300 text-black' : player.rank === 3 ? 'bg-amber-700 text-white' : 'bg-white/10 text-neutral-400'}`}>
                                                {player.rank}
                                            </div>
                                            <span className={`text-xs font-bold ${player.isUser ? 'text-white' : 'text-neutral-300'}`}>{player.name}</span>
                                        </div>
                                        <span className="text-xs font-mono text-neutral-400">{player.score} XP</span>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 text-[10px] uppercase tracking-widest text-neutral-500 hover:text-blue-400 transition-colors font-bold">
                                View Full Leaderboard →
                            </button>
                        </div>

                        {/* Achievements */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-2">
                                <Flame size={16} className="text-orange-500" /> Rival Badges
                            </h2>
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl relative overflow-hidden group hover:border-yellow-500/40 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0 transform group-hover:scale-110 transition-transform">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-400">First Synthesis</h4>
                                        <p className="text-[10px] text-neutral-400">Earned by 84% of players</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-xl group hover:border-cyan-500/40 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 transform group-hover:scale-110 transition-transform">
                                        <FlaskConical size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-cyan-400">Mad Scientist</h4>
                                        <p className="text-[10px] text-neutral-400">Rare: Earned by 12% of players</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-xl group hover:border-red-500/40 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 transform group-hover:scale-110 transition-transform">
                                        <Flame size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-red-400">Reaction Chain</h4>
                                        <p className="text-[10px] text-neutral-400">Epic: Earned by 4% of players</p>
                                    </div>
                                </div>

                                {/* Locked Badge */}
                                <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl grayscale opacity-50">
                                    <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 shrink-0">
                                        <Star size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-neutral-400">Master Crafter</h4>
                                        <p className="text-[10px] text-neutral-500">Legendary (12/50 Elements)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
