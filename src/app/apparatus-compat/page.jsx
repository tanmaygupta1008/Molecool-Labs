'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GraphView from './GraphView';

// ─── Complete list of all known apparatus ───────────────────────────────────
const ALL_APPARATUS = [
    { id: 'BunsenBurner', label: 'Bunsen Burner', icon: '🔥', category: 'Heating' },
    { id: 'TripodStand', label: 'Tripod Stand', icon: '🗼', category: 'Stands & Clamps' },
    { id: 'WireGauze', label: 'Wire Gauze', icon: '🔲', category: 'Stands & Clamps' },
    { id: 'HeatproofMat', label: 'Heatproof Mat', icon: '🟫', category: 'Heating' },
    { id: 'Crucible', label: 'Crucible', icon: '🏺', category: 'Glassware' },
    { id: 'Tongs', label: 'Tongs', icon: '🦞', category: 'Accessories' },
    { id: 'Beaker', label: 'Beaker', icon: '⚗️', category: 'Glassware' },
    { id: 'ConicalFlask', label: 'Conical Flask', icon: '🧪', category: 'Glassware' },
    { id: 'TestTube', label: 'Test Tube', icon: '🧪', category: 'Glassware' },
    { id: 'BoilingTube', label: 'Boiling Tube', icon: '🧪', category: 'Glassware' },
    { id: 'MeasuringCylinder', label: 'Measuring Cylinder', icon: '📏', category: 'Glassware' },
    { id: 'Dropper', label: 'Dropper', icon: '💧', category: 'Accessories' },
    { id: 'StirringRod', label: 'Stirring Rod', icon: '🥢', category: 'Accessories' },
    { id: 'GlassRod', label: 'Glass Rod', icon: '🥢', category: 'Accessories' },
    { id: 'WaterTrough', label: 'Water Trough', icon: '🚰', category: 'Glassware' },
    { id: 'GasJar', label: 'Gas Jar', icon: '🔋', category: 'Glassware' },
    { id: 'DeliveryTube', label: 'Delivery Tube', icon: '〰️', category: 'Accessories' },
    { id: 'RubberCork', label: 'Rubber Cork', icon: '🍾', category: 'Accessories' },
    { id: 'Cork', label: 'Cork', icon: '🍾', category: 'Accessories' },
    { id: 'Burette', label: 'Burette', icon: '💉', category: 'Glassware' },
    { id: 'RetortStand', label: 'Retort Stand', icon: '🏗️', category: 'Stands & Clamps' },
    { id: 'Clamp', label: 'Clamp', icon: '🗜️', category: 'Stands & Clamps' },
    { id: 'ElectrolysisSetup', label: 'Electrolysis Setup', icon: '⚡', category: 'Electrical' },
    { id: 'PowerSupply', label: 'Power Supply', icon: '🔌', category: 'Electrical' },
    { id: 'MagnesiumRibbon', label: 'Magnesium Ribbon', icon: '🎀', category: 'Chemicals' },
    { id: 'ZincGranules', label: 'Zinc Granules', icon: '⬛', category: 'Chemicals' },
    { id: 'Forceps', label: 'Forceps', icon: '✂️', category: 'Accessories' },
    { id: 'SafetyShield', label: 'Safety Shield', icon: '🛡️', category: 'Safety' },
    { id: 'DropperBottle', label: 'Dropper Bottle', icon: '🧴', category: 'Accessories' },
    { id: 'IronNail', label: 'Iron Nail', icon: '📌', category: 'Chemicals' },
    { id: 'GasTap', label: 'Gas Tap', icon: '🚰', category: 'Electrical' },
    { id: 'LitmusPaper', label: 'Litmus Paper', icon: '📄', category: 'Chemicals' },
    { id: 'Wire', label: 'Wire', icon: '〰️', category: 'Electrical' },
    { id: 'RoundBottomFlask', label: 'Round Bottom Flask', icon: '⚗️', category: 'Glassware' },
];

const CATEGORIES = [...new Set(ALL_APPARATUS.map(a => a.category))];

const CATEGORY_COLORS = {
    'Heating':         { bg: 'bg-orange-900/30', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400' },
    'Stands & Clamps': { bg: 'bg-blue-900/30',   border: 'border-blue-500/30',   text: 'text-blue-300',   dot: 'bg-blue-400' },
    'Glassware':       { bg: 'bg-cyan-900/30',    border: 'border-cyan-500/30',   text: 'text-cyan-300',   dot: 'bg-cyan-400' },
    'Accessories':     { bg: 'bg-purple-900/30',  border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
    'Electrical':      { bg: 'bg-yellow-900/30',  border: 'border-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
    'Chemicals':       { bg: 'bg-green-900/30',   border: 'border-green-500/30',  text: 'text-green-300',  dot: 'bg-green-400' },
    'Safety':          { bg: 'bg-red-900/30',     border: 'border-red-500/30',    text: 'text-red-300',    dot: 'bg-red-400' },
};

const getApparatusById = (id) => ALL_APPARATUS.find(a => a.id === id) || { id, label: id, icon: '🔬', category: 'Unknown' };

// ─── Offset Editor sub-component ────────────────────────────────────────────
const OffsetEditor = ({ sourceId, targetId, offset, onChange, onClose }) => {
    const [pos, setPos] = useState(offset?.position || [0, 0, 0]);
    const [rot, setRot] = useState(offset?.rotation || [0, 0, 0]);
    const [note, setNote] = useState(offset?.note || '');

    const axes = ['X', 'Y', 'Z'];

    const handleSave = () => {
        onChange({ position: pos, rotation: rot, note });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#151520] border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/20 p-6 w-[480px] flex flex-col gap-5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-bold text-white">Snap Offset Editor</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            <span className="text-cyan-300">{getApparatusById(sourceId).icon} {getApparatusById(sourceId).label}</span>
                            <span className="text-neutral-500 mx-2">→</span>
                            <span className="text-blue-300">{getApparatusById(targetId).icon} {getApparatusById(targetId).label}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none">×</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Position Offset (X, Y, Z)</label>
                        {axes.map((ax, i) => (
                            <div key={ax} className="flex items-center gap-2">
                                <span className="text-[10px] w-4 text-neutral-400 font-mono">{ax}</span>
                                <input
                                    type="number" step="0.05"
                                    value={pos[i]}
                                    onChange={(e) => {
                                        const newPos = [...pos];
                                        newPos[i] = parseFloat(e.target.value) || 0;
                                        setPos(newPos);
                                    }}
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Rotation Offset (rad)</label>
                        {axes.map((ax, i) => (
                            <div key={ax} className="flex items-center gap-2">
                                <span className="text-[10px] w-4 text-neutral-400 font-mono">{ax}</span>
                                <input
                                    type="number" step="0.01"
                                    value={rot[i]}
                                    onChange={(e) => {
                                        const newRot = [...rot];
                                        newRot[i] = parseFloat(e.target.value) || 0;
                                        setRot(newRot);
                                    }}
                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Note / Description</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Describe how the apparatus snaps here..."
                        rows={2}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-neutral-200 resize-none focus:outline-none focus:border-cyan-500/50 placeholder:text-neutral-600"
                    />
                </div>

                <div className="bg-black/30 rounded-lg p-3 font-mono text-[10px] text-green-300 border border-white/5">
                    position: [{pos.join(', ')}] | rotation: [{rot.map(r => r.toFixed(2)).join(', ')}]
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-sm font-bold hover:bg-cyan-600/50 transition-all"
                    >
                        Save Offset
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white/5 border border-white/10 text-neutral-300 rounded-lg text-sm font-bold hover:bg-white/10 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Add New Apparatus Dialog ────────────────────────────────────────────────
const AddApparatusDialog = ({ onAdd, onClose, existingKeys }) => {
    const [newId, setNewId] = useState('');
    const [error, setError] = useState('');

    const handleAdd = () => {
        const trimmed = newId.trim();
        if (!trimmed) { setError('Name cannot be empty'); return; }
        if (existingKeys.includes(trimmed)) { setError('Apparatus already exists in rules'); return; }
        if (!/^[A-Za-z][A-Za-z0-9]*$/.test(trimmed)) { setError('Use CamelCase letters/numbers only, e.g. RoundBottomFlask'); return; }
        onAdd(trimmed);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#151520] border border-white/10 rounded-2xl shadow-2xl p-6 w-96 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white">Add New Apparatus</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl">×</button>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Apparatus Model ID</label>
                    <input
                        type="text"
                        value={newId}
                        onChange={e => { setNewId(e.target.value); setError(''); }}
                        placeholder="e.g. ClayTriangle"
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-neutral-600"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        autoFocus
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <p className="text-xs text-neutral-500">This should match the component filename in <code className="text-neutral-300">src/components/apparatus/</code></p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleAdd} className="flex-1 py-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-sm font-bold hover:bg-blue-600/50 transition-all">Add Apparatus</button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 border border-white/10 text-neutral-300 rounded-lg text-sm font-bold hover:bg-white/10 transition-all">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ApparatusCompatPage() {
    const [rulesData, setRulesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('success');

    const [selectedApparatus, setSelectedApparatus] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [showOffsetEditor, setShowOffsetEditor] = useState(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'graph'

    // ── Load rules ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/apparatus-snap-rules')
            .then(r => r.json())
            .then(data => { setRulesData(data); setLoading(false); })
            .catch(() => { setStatus('Failed to load snap rules'); setStatusType('error'); setLoading(false); });
    }, []);

    const showStatusMsg = (msg, type = 'success') => {
        setStatus(msg);
        setStatusType(type);
        setTimeout(() => setStatus(''), 3000);
    };

    // ── Save rules ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!rulesData) return;
        setSaving(true);
        try {
            const res = await fetch('/api/apparatus-snap-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rulesData)
            });
            if (res.ok) {
                showStatusMsg('✅ Saved successfully!', 'success');
            } else {
                showStatusMsg('❌ Save failed', 'error');
            }
        } catch {
            showStatusMsg('❌ Network error', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle a connection ─────────────────────────────────────────────────
    const toggleConnection = (sourceId, targetId) => {
        setRulesData(prev => {
            const newData = { ...prev, rules: { ...prev.rules } };
            const rule = { ...newData.rules[sourceId] } || { canAttachTo: [], snapOffset: {} };
            const canAttach = [...(rule.canAttachTo || [])];

            if (canAttach.includes(targetId)) {
                // Remove connection
                rule.canAttachTo = canAttach.filter(id => id !== targetId);
                delete rule.snapOffset[targetId];
            } else {
                // Add connection with default offset
                rule.canAttachTo = [...canAttach, targetId];
                rule.snapOffset = {
                    ...rule.snapOffset,
                    [targetId]: { position: [0, 0, 0], rotation: [0, 0, 0], note: '' }
                };
            }
            newData.rules[sourceId] = rule;
            return newData;
        });
    };

    // ── Update offset ───────────────────────────────────────────────────────
    const updateOffset = (sourceId, targetId, newOffset) => {
        setRulesData(prev => {
            const newData = { ...prev, rules: { ...prev.rules } };
            newData.rules[sourceId] = {
                ...newData.rules[sourceId],
                snapOffset: {
                    ...(newData.rules[sourceId]?.snapOffset || {}),
                    [targetId]: newOffset
                }
            };
            return newData;
        });
    };

    // ── Add new apparatus ───────────────────────────────────────────────────
    const addNewApparatus = (newId) => {
        setRulesData(prev => ({
            ...prev,
            rules: {
                ...prev.rules,
                [newId]: { canAttachTo: [], snapOffset: {} }
            }
        }));
        setSelectedApparatus(newId);
        showStatusMsg(`Added '${newId}' — don't forget to save!`, 'info');
    };

    // ── Remove apparatus ────────────────────────────────────────────────────
    const removeApparatus = (id) => {
        if (!confirm(`Remove '${id}' from snap rules? This will also clear all references to it as a target.`)) return;
        setRulesData(prev => {
            const newRules = { ...prev.rules };
            delete newRules[id];
            // Also remove from all other rules as a target
            Object.keys(newRules).forEach(k => {
                newRules[k] = {
                    ...newRules[k],
                    canAttachTo: (newRules[k].canAttachTo || []).filter(t => t !== id),
                    snapOffset: Object.fromEntries(
                        Object.entries(newRules[k].snapOffset || {}).filter(([t]) => t !== id)
                    )
                };
            });
            return { ...prev, rules: newRules };
        });
        if (selectedApparatus === id) setSelectedApparatus(null);
    };

    if (loading) return (
        <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
            <div className="flex items-center gap-3 text-neutral-400">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                Loading compatibility rules…
            </div>
        </div>
    );

    if (!rulesData) return (
        <div className="flex h-screen bg-[#0a0a0a] items-center justify-center text-red-400">
            Failed to load data. Check API route.
        </div>
    );

    const allRuleKeys = Object.keys(rulesData.rules).sort();
    
    // All apparatus known (union of rule keys + ALL_APPARATUS list)
    const allKnownIds = [...new Set([
        ...allRuleKeys,
        ...ALL_APPARATUS.map(a => a.id)
    ])].sort();

    // Filter for sidebar
    const filteredList = allKnownIds.filter(id => {
        const info = getApparatusById(id);
        const matchSearch = id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            info.label.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = filterCategory === 'All' || info.category === filterCategory;
        return matchSearch && matchCat;
    });

    const selectedRule = selectedApparatus ? (rulesData.rules[selectedApparatus] || { canAttachTo: [], snapOffset: {} }) : null;
    const selectedInfo = selectedApparatus ? getApparatusById(selectedApparatus) : null;
    const catStyle = selectedInfo ? (CATEGORY_COLORS[selectedInfo.category] || CATEGORY_COLORS['Accessories']) : null;

    // Total connections count
    const totalConnections = Object.values(rulesData.rules).reduce((acc, r) => acc + (r.canAttachTo?.length || 0), 0);

    return (
        <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
            {/* ── Header ── */}
            <div className="px-6 py-4 border-b border-white/5 bg-[#0d0d0d] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-xl">
                        🔗
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Apparatus Compatibility Manager</h1>
                        <p className="text-xs text-neutral-500">Define which apparatus can snap to which, and set precise attachment offsets.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-1">
                        <button onClick={() => setViewMode('editor')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'editor' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>⚙️ Editor</button>
                        <button onClick={() => setViewMode('graph')} className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'graph' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'text-neutral-500 hover:text-neutral-300'}`}>🕸️ Graph</button>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-500 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                        <span><span className="text-white font-bold">{allRuleKeys.length}</span> apparatus</span>
                        <span className="w-px h-3 bg-white/10" />
                        <span><span className="text-cyan-300 font-bold">{totalConnections}</span> connections</span>
                    </div>
                    {status && (
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${statusType === 'error' ? 'text-red-300 bg-red-900/20 border-red-500/30' : statusType === 'info' ? 'text-yellow-300 bg-yellow-900/20 border-yellow-500/30' : 'text-green-300 bg-green-900/20 border-green-500/30'}`}>
                            {status}
                        </span>
                    )}
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-all"
                    >
                        <span>+</span> New Apparatus
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-900/30 transition-all"
                    >
                        {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾'}
                        Save All
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Sidebar: Apparatus List ── */}
                <div className="w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d10]">
                    <div className="p-3 flex flex-col gap-2 border-b border-white/5">
                        <input
                            type="text"
                            placeholder="Search apparatus…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 placeholder:text-neutral-600"
                        />
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none appearance-none"
                        >
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-0.5">
                        {filteredList.map(id => {
                            const info = getApparatusById(id);
                            const rule = rulesData.rules[id];
                            const connectionCount = rule?.canAttachTo?.length || 0;
                            const isInRules = !!rulesData.rules[id];
                            const style = CATEGORY_COLORS[info.category] || CATEGORY_COLORS['Accessories'];
                            const isSelected = selectedApparatus === id;

                            return (
                                <button
                                    key={id}
                                    onClick={() => setSelectedApparatus(id)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all group ${
                                        isSelected
                                            ? `${style.bg} ${style.border} border`
                                            : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <span className="text-base leading-none">{info.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold truncate ${isSelected ? style.text : 'text-neutral-300'}`}>
                                            {info.label}
                                        </p>
                                        <p className="text-[9px] text-neutral-600 truncate">{id}</p>
                                    </div>
                                    {isInRules ? (
                                        connectionCount > 0 ? (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text} shrink-0`}>
                                                {connectionCount}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-neutral-700 shrink-0">—</span>
                                        )
                                    ) : (
                                        <span className="text-[9px] text-amber-600 shrink-0">+</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main Panel ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {viewMode === 'graph' ? (
                        <GraphView
                            rules={rulesData.rules}
                            selectedNode={selectedApparatus}
                            onSelectNode={(id) => { setSelectedApparatus(id); }}
                            onToggleConnection={toggleConnection}
                            onSave={handleSave}
                        />
                    ) : !selectedApparatus ? (
                        // ── Welcome / Overview State ──────────────────────────────────
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
                            <div className="text-6xl opacity-20">🔗</div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-300">Select an Apparatus</h2>
                                <p className="text-sm text-neutral-600 mt-2 max-w-md">
                                    Choose an apparatus from the sidebar to define which other apparatus it can snap onto, and configure the precise 3D attachment offsets.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {['🔗 Compatibility Rules', '📐 3D Snap Offsets', '💾 Persistent JSON'].map((label) => (
                                    <div key={label} className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs text-neutral-400">
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // ── Selected Apparatus Detail ─────────────────────────────────
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Detail Header */}
                            <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 ${catStyle.bg}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedInfo.icon}</span>
                                    <div>
                                        <h2 className={`text-base font-bold ${catStyle.text}`}>{selectedInfo.label}</h2>
                                        <p className="text-xs text-neutral-500 font-mono">{selectedApparatus}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.border} ${catStyle.text} ml-1`}>
                                        {selectedInfo.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!rulesData.rules[selectedApparatus] && (
                                        <button
                                            onClick={() => addNewApparatus(selectedApparatus)}
                                            className="text-xs px-3 py-1.5 bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-600/30 transition-all font-semibold"
                                        >
                                            + Add to Rules
                                        </button>
                                    )}
                                    {rulesData.rules[selectedApparatus] && (
                                        <button
                                            onClick={() => removeApparatus(selectedApparatus)}
                                            className="text-xs px-3 py-1.5 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!rulesData.rules[selectedApparatus] ? (
                                <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
                                    This apparatus is not yet in the snap rules. Click "Add to Rules" to start defining its compatibility.
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    <div className="flex flex-col gap-6 max-w-3xl">

                                        {/* ── Can Attach To section ── */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-neutral-200">Can Attach To</h3>
                                                <span className="text-[10px] text-neutral-500">— click to toggle a connection</span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {allKnownIds
                                                    .filter(id => id !== selectedApparatus)
                                                    .map(targetId => {
                                                        const targetInfo = getApparatusById(targetId);
                                                        const isConnected = selectedRule?.canAttachTo?.includes(targetId);
                                                        const hasOffset = selectedRule?.snapOffset?.[targetId];
                                                        const tStyle = CATEGORY_COLORS[targetInfo.category] || CATEGORY_COLORS['Accessories'];

                                                        return (
                                                            <div
                                                                key={targetId}
                                                                className={`relative group rounded-xl border p-3 flex flex-col gap-1.5 cursor-pointer transition-all ${
                                                                    isConnected
                                                                        ? `${tStyle.bg} ${tStyle.border} shadow-sm`
                                                                        : 'bg-white/[0.015] border-white/5 opacity-50 hover:opacity-80'
                                                                }`}
                                                                onClick={() => toggleConnection(selectedApparatus, targetId)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-lg leading-none">{targetInfo.icon}</span>
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                                        isConnected ? `${tStyle.dot} bg-opacity-100 border-transparent` : 'border-white/20 bg-transparent'
                                                                    }`}>
                                                                        {isConnected && <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                                    </div>
                                                                </div>
                                                                <p className={`text-[10px] font-semibold leading-tight ${isConnected ? tStyle.text : 'text-neutral-500'}`}>
                                                                    {targetInfo.label}
                                                                </p>
                                                                {isConnected && (
                                                                    <button
                                                                        className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => { e.stopPropagation(); setShowOffsetEditor({ sourceId: selectedApparatus, targetId }); }}
                                                                        title="Edit snap offset"
                                                                    >
                                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${hasOffset?.note || (hasOffset?.position && hasOffset.position.some(v => v !== 0)) ? 'bg-green-900/30 text-green-400' : 'bg-white/10 text-neutral-400'}`}>
                                                                            📐 edit
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>

                                        {/* ── Current connections summary ── */}
                                        {selectedRule?.canAttachTo && selectedRule.canAttachTo.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                <h3 className="text-sm font-bold text-neutral-200">Active Connections <span className="text-neutral-500 font-normal text-xs">— offset configuration</span></h3>
                                                <div className="flex flex-col gap-2">
                                                    {selectedRule.canAttachTo.map(targetId => {
                                                        const targetInfo = getApparatusById(targetId);
                                                        const offset = selectedRule.snapOffset?.[targetId];
                                                        const tStyle = CATEGORY_COLORS[targetInfo.category] || CATEGORY_COLORS['Accessories'];
                                                        const hasCustomOffset = offset?.position?.some(v => v !== 0) || offset?.rotation?.some(v => v !== 0);

                                                        return (
                                                            <div key={targetId} className={`flex items-center gap-3 p-3 rounded-xl ${tStyle.bg} border ${tStyle.border}`}>
                                                                <span className="text-xl">{targetInfo.icon}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-xs font-bold ${tStyle.text}`}>{targetInfo.label}</p>
                                                                    {offset && (
                                                                        <p className="text-[10px] font-mono text-neutral-500 mt-0.5 truncate">
                                                                            pos: [{offset.position?.join(', ')}]
                                                                            {offset.note && <span className="ml-2 text-neutral-600 non-mono">— {offset.note}</span>}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    {hasCustomOffset && (
                                                                        <span className="text-[9px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded border border-green-500/20">
                                                                            custom
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setShowOffsetEditor({ sourceId: selectedApparatus, targetId })}
                                                                        className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 text-neutral-300 rounded hover:bg-white/10 transition-all"
                                                                    >
                                                                        📐 Offset
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            {showOffsetEditor && (
                <OffsetEditor
                    sourceId={showOffsetEditor.sourceId}
                    targetId={showOffsetEditor.targetId}
                    offset={rulesData.rules[showOffsetEditor.sourceId]?.snapOffset?.[showOffsetEditor.targetId]}
                    onChange={(offset) => updateOffset(showOffsetEditor.sourceId, showOffsetEditor.targetId, offset)}
                    onClose={() => setShowOffsetEditor(null)}
                />
            )}
            {showAddDialog && (
                <AddApparatusDialog
                    existingKeys={allRuleKeys}
                    onAdd={addNewApparatus}
                    onClose={() => setShowAddDialog(false)}
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 9999px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
        </div>
    );
}
