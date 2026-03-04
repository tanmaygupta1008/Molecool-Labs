import React from 'react';
import { Trash2, Plus, ArrowRight, Activity, ThermometerSun, Palette, Droplets, CloudFog, Zap, Layers } from 'lucide-react';
import { CHEMICALS } from '@/data/chemicals';

const ReactantBlockEditor = ({ block, onChange, apparatusList }) => {
    if (!block) return null;

    const updateBlock = (field, value) => {
        onChange({ ...block, [field]: value });
    };

    const getInitialVolumeForReactant = (reactantId) => {
        for (const app of apparatusList || []) {
            const reactant = app.reactants?.find(r => r.id === reactantId);
            if (reactant && (reactant.state === 'l' || reactant.state === 'aq')) {
                return parseFloat(reactant.amount) || 0;
            }
        }
        return 0;
    };

    const getUnitForReactant = (reactantId) => {
        for (const app of apparatusList || []) {
            const reactant = app.reactants?.find(r => r.id === reactantId);
            if (reactant) {
                if (reactant.state === 's') return 'g';
                if (reactant.state === 'g') return 'mol';
                return 'mL';
            }
        }
        return 'mL';
    };

    const getInitialColorForReactant = (reactantId) => {
        if (!reactantId) return '#3b82f6';
        if (reactantId.endsWith('_flame')) return '#0033cc'; // Default flame color

        for (const app of apparatusList || []) {
            const reactant = app.reactants?.find(r => r.id === reactantId);
            if (reactant) {
                const chemical = CHEMICALS?.find(c => c.id === reactant.chemicalId);
                return chemical?.color || '#3b82f6';
            }
        }
        return '#3b82f6';
    };

    const addEffect = (type) => {
        const newEffect = { id: `eff_${Date.now()}`, type, disabled: false };
        const firstReactantId = apparatusList?.flatMap(a => a.reactants || [])[0]?.id || '';
        const firstBurnerId = apparatusList?.find(a => a.model === 'BunsenBurner' || a.name?.toLowerCase().includes('burner'))?.id;

        const defaultTarget = firstReactantId || (firstBurnerId ? `${firstBurnerId}_flame` : '');

        if (type === 'COLOR_CHANGE') {
            newEffect.targetId = defaultTarget;
            const initColor = getInitialColorForReactant(defaultTarget);
            newEffect.initialColor = initColor;
            newEffect.finalColor = initColor;
        } else if (type === 'VOLUME_CHANGE') {
            const initVol = getInitialVolumeForReactant(firstReactantId);
            newEffect.targetId = firstReactantId;
            newEffect.initialVolume = initVol;
            newEffect.finalVolume = initVol + 50; // Default +50mL
        } else if (type === 'TEMPERATURE_CHANGE') {
            newEffect.targetId = firstReactantId;
            newEffect.initialTemp = 25;
            newEffect.finalTemp = 100;
        } else if (type === 'GAS_EVOLUTION') {
            newEffect.targetId = firstReactantId;
            newEffect.bubbleRate = 0.5;
            newEffect.particleSize = 1.0;
            newEffect.color = '#ffffff';
        } else if (type === 'PRECIPITATE_FORMATION') {
            newEffect.targetId = firstReactantId;
            newEffect.amount = 0.5;
            newEffect.color = '#dddddd';
        } else if (type === 'STATE_CHANGE') {
            newEffect.targetId = firstReactantId;
            newEffect.newModel = '';
        } else if (type === 'ELECTRODE_DISSOLVING') {
            const electrolysis = apparatusList?.find(a => a.model === 'ElectrolysisSetup');
            newEffect.targetId = electrolysis?.id || '';
            newEffect.electrode = 'both';
        } else if (type === 'METAL_DEPOSITION') {
            const electrolysis = apparatusList?.find(a => a.model === 'ElectrolysisSetup');
            newEffect.targetId = electrolysis?.id || '';
            newEffect.electrode = 'cathode';
            newEffect.color = '#cccccc';
        } else if (type === 'LIQUID_DRIPPING') {
            const burette = apparatusList?.find(a => a.model === 'Burette');
            newEffect.targetId = burette?.id || '';
            newEffect.dripRate = 0.5;
        }
        onChange({ ...block, effects: [...(block.effects || []), newEffect] });
    };

    const updateEffect = (index, field, value) => {
        const updatedEffects = [...(block.effects || [])];
        updatedEffects[index] = { ...updatedEffects[index], [field]: value };

        // Auto-update initial volume if target changes for a VOLUME_CHANGE effect
        if (field === 'targetId' && updatedEffects[index].type === 'VOLUME_CHANGE') {
            const initVol = getInitialVolumeForReactant(value);
            updatedEffects[index].initialVolume = initVol;
            // Optionally adjust final volume relative to new initial volume
            if (updatedEffects[index].finalVolume < initVol) {
                updatedEffects[index].finalVolume = initVol + 50;
            }
        } else if (field === 'targetId' && updatedEffects[index].type === 'COLOR_CHANGE') {
            const initColor = getInitialColorForReactant(value);
            updatedEffects[index].initialColor = initColor;
            updatedEffects[index].finalColor = initColor;
        }

        onChange({ ...block, effects: updatedEffects });
    };

    const removeEffect = (index) => {
        const updatedEffects = [...(block.effects || [])];
        updatedEffects.splice(index, 1);
        onChange({ ...block, effects: updatedEffects });
    };

    const hasElectrolysis = apparatusList?.some(a => a.model === 'ElectrolysisSetup');
    const hasBurette = apparatusList?.some(a => a.model === 'Burette');

    return (
        <div className="flex flex-col h-full bg-[#111] overflow-hidden">
            {/* Header */}
            <div className="p-3 bg-[#1a1a1a] border-b border-white/5">
                <input
                    type="text"
                    value={block.name || ''}
                    onChange={(e) => updateBlock('name', e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b focus:border-cyan-500 pb-1"
                    placeholder="Stage Name"
                />
                <div className="flex gap-4 mt-2">
                    <div className="flex flex-col">
                        <label className="text-[9px] text-gray-500 uppercase">Start (s)</label>
                        <input
                            type="number"
                            value={block.startTime || 0}
                            onChange={(e) => updateBlock('startTime', parseFloat(e.target.value))}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-cyan-400 w-16"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[9px] text-gray-500 uppercase">Duration (s)</label>
                        <input
                            type="number"
                            value={block.duration || 0}
                            onChange={(e) => updateBlock('duration', parseFloat(e.target.value))}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-cyan-400 w-16"
                        />
                    </div>
                </div>
            </div>

            {/* Effects List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400">STATE TRANSITIONS</h3>
                    <div className="relative group">
                        <button className="px-2 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                            <Plus size={12} /> ADD
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl hidden group-hover:block z-50">
                            <button onClick={() => addEffect('COLOR_CHANGE')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><Palette size={12} /> Color Change</button>
                            <button onClick={() => addEffect('VOLUME_CHANGE')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><Droplets size={12} /> Volume Change</button>
                            <button onClick={() => addEffect('TEMPERATURE_CHANGE')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><ThermometerSun size={12} /> Temp Change</button>
                            <button onClick={() => addEffect('GAS_EVOLUTION')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><CloudFog size={12} /> Gas Evolution</button>
                            <button onClick={() => addEffect('PRECIPITATE_FORMATION')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><Layers size={12} /> Precipitate</button>
                            <button onClick={() => addEffect('STATE_CHANGE')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"><Activity size={12} /> State Change</button>
                            {hasElectrolysis && (
                                <>
                                    <div className="h-px bg-white/10 my-1"></div>
                                    <button onClick={() => addEffect('ELECTRODE_DISSOLVING')} className="w-full text-left px-3 py-2 text-xs text-yellow-300 hover:bg-white/5 flex items-center gap-2"><Zap size={12} /> Electrode Dissolving</button>
                                    <button onClick={() => addEffect('METAL_DEPOSITION')} className="w-full text-left px-3 py-2 text-xs text-yellow-300 hover:bg-white/5 flex items-center gap-2"><Layers size={12} /> Metal Deposition</button>
                                </>
                            )}
                            {hasBurette && (
                                <>
                                    <div className="h-px bg-white/10 my-1"></div>
                                    <button onClick={() => addEffect('LIQUID_DRIPPING')} className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-white/5 flex items-center gap-2"><Droplets size={12} /> Liquid Dripping</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {(block.effects || []).map((eff, index) => (
                    <div key={eff.id} className="bg-[#1a1a1a] rounded-lg border border-white/5 p-3 relative">
                        <button onClick={() => removeEffect(index)} className="absolute top-2 right-2 text-gray-600 hover:text-red-400">
                            <Trash2 size={12} />
                        </button>

                        <div className="text-[10px] font-bold text-cyan-500 mb-2 border-b border-white/5 pb-1 w-fit pr-4">
                            {eff.type.replace('_', ' ')}
                        </div>

                        {/* Common Target Select for Reactant specific effects */}
                        {['COLOR_CHANGE', 'VOLUME_CHANGE', 'GAS_EVOLUTION', 'STATE_CHANGE', 'TEMPERATURE_CHANGE', 'ELECTRODE_DISSOLVING', 'METAL_DEPOSITION', 'PRECIPITATE_FORMATION'].includes(eff.type) && (
                            <div className="mb-2">
                                <label className="block text-[9px] text-gray-500 mb-1">Target</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                                    value={eff.targetId || ''}
                                    onChange={e => updateEffect(index, 'targetId', e.target.value)}
                                >
                                    {apparatusList.flatMap(a => (a.reactants || []).map(r => {
                                        const chemical = CHEMICALS?.find(c => c.id === r.chemicalId);
                                        return (
                                            <option key={r.id} value={r.id}>
                                                {chemical ? chemical.name : r.chemicalId} in {a.name || a.model}
                                            </option>
                                        );
                                    }))}
                                    {eff.type === 'COLOR_CHANGE' && apparatusList.filter(a => a.model === 'BunsenBurner' || a.name?.toLowerCase().includes('burner')).map(b => (
                                        <option key={`${b.id}_flame`} value={`${b.id}_flame`}>
                                            Flame in {b.name || b.model}
                                        </option>
                                    ))}
                                    {(eff.type === 'ELECTRODE_DISSOLVING' || eff.type === 'METAL_DEPOSITION') && apparatusList.filter(a => a.model === 'ElectrolysisSetup').map(a => (
                                        <option key={a.id} value={a.id}>
                                            Electrolysis Setup ({a.id})
                                        </option>
                                    ))}
                                    {eff.type === 'GAS_EVOLUTION' && apparatusList.filter(a => a.model === 'ElectrolysisSetup').map(a => (
                                        <option key={a.id} value={a.id}>
                                            Electrolysis Setup ({a.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {eff.type === 'COLOR_CHANGE' && (
                            <div className="flex items-center gap-2">
                                <input type="color" value={eff.initialColor} onChange={e => updateEffect(index, 'initialColor', e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer p-0" />
                                <ArrowRight size={12} className="text-gray-500" />
                                <input type="color" value={eff.finalColor} onChange={e => updateEffect(index, 'finalColor', e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer p-0" />
                            </div>
                        )}

                        {eff.type === 'VOLUME_CHANGE' && (() => {
                            const unit = getUnitForReactant(eff.targetId);
                            const actionLabel = unit === 'g' || unit === 'mol' ? 'Amount' : 'Vol';
                            return (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 justify-between">
                                        <label className="text-[9px] text-gray-500 uppercase">Initial {actionLabel} (fetch from setup)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" value={eff.initialVolume} onChange={e => updateEffect(index, 'initialVolume', parseFloat(e.target.value))} className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs" />
                                            <span className="text-[10px] text-gray-500">{unit}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center p-1">
                                        <ArrowRight size={14} className="text-gray-600" />
                                    </div>
                                    <div className="flex items-center gap-2 justify-between">
                                        <label className="text-[9px] text-gray-500 uppercase">Final {actionLabel}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" value={eff.finalVolume} onChange={e => updateEffect(index, 'finalVolume', parseFloat(e.target.value))} className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs" />
                                            <span className="text-[10px] text-gray-500">{unit}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {eff.type === 'TEMPERATURE_CHANGE' && (
                            <div className="flex items-center gap-2">
                                <input type="number" value={eff.initialTemp} onChange={e => updateEffect(index, 'initialTemp', parseFloat(e.target.value))} className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs" />
                                <span className="text-[10px] text-gray-500">°C</span>
                                <ArrowRight size={12} className="text-gray-500" />
                                <input type="number" value={eff.finalTemp} onChange={e => updateEffect(index, 'finalTemp', parseFloat(e.target.value))} className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-xs" />
                                <span className="text-[10px] text-gray-500">°C</span>
                            </div>
                        )}

                        {eff.type === 'GAS_EVOLUTION' && (
                            <div className="space-y-3">
                                {/* Color Picker - Global for both */}
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5">
                                    <label className="text-[9px] text-gray-400 font-semibold uppercase">Gas/Bubble Color</label>
                                    <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/10">
                                        <input type="color" value={eff.color} onChange={e => updateEffect(index, 'color', e.target.value)} className="w-4 h-4 rounded bg-transparent border-none cursor-pointer p-0" />
                                        <span className="text-[9px] text-white/50">{eff.color}</span>
                                    </div>
                                </div>

                                {/* Underwater Bubbles Card */}
                                <div className="p-2.5 bg-cyan-950/20 rounded border border-cyan-500/20">
                                    <div className="text-[10px] text-cyan-400 font-semibold mb-3 uppercase flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                        Underwater Bubbles
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 justify-between">
                                            <label className="text-[9px] text-cyan-100/60">Bubble Rate</label>
                                            <input type="range" min="0" max="1" step="0.1" value={eff.bubbleRate} onChange={e => updateEffect(index, 'bubbleRate', parseFloat(e.target.value))} className="w-24 accent-cyan-500" />
                                        </div>
                                        <div className="flex items-center gap-2 justify-between">
                                            <label className="text-[9px] text-cyan-100/60">Particle Size Scale</label>
                                            <div className="flex items-center gap-2">
                                                <input type="range" min="0.1" max="5" step="0.1" value={eff.particleSize !== undefined ? eff.particleSize : 1.0} onChange={e => updateEffect(index, 'particleSize', parseFloat(e.target.value))} className="w-16 accent-cyan-500" />
                                                <span className="text-[10px] text-cyan-500 font-mono w-5 text-right bg-black/30 px-1 rounded">{(eff.particleSize !== undefined ? eff.particleSize : 1.0).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-between pt-1 border-t border-cyan-500/20">
                                            <label className="text-[9px] text-cyan-400 font-semibold tracking-wider">AESTHETIC</label>
                                            <select
                                                className="w-28 bg-black/50 border border-cyan-500/30 rounded px-2 py-1 text-xs text-cyan-100 outline-none focus:border-cyan-400"
                                                value={eff.bubbleType || 'bubble'}
                                                onChange={e => updateEffect(index, 'bubbleType', e.target.value)}
                                            >
                                                <option value="bubble">Clean Bubble</option>
                                                <option value="smoke">Thick Smoke</option>
                                                <option value="gas_rise">Thin Gas</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Airborne Gas Card */}
                                {hasElectrolysis && (
                                    <div className="p-2.5 bg-yellow-950/20 rounded border border-yellow-500/20">
                                        <div className="text-[10px] text-yellow-500 font-semibold mb-3 uppercase flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                            Surface Gas Emission
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 justify-between">
                                                <label className="text-[9px] text-yellow-100/60">Emission Rate</label>
                                                <input type="range" min="0" max="1" step="0.1" value={eff.emissionRate !== undefined ? eff.emissionRate : eff.bubbleRate} onChange={e => updateEffect(index, 'emissionRate', parseFloat(e.target.value))} className="w-24 accent-yellow-500" />
                                            </div>
                                            <div className="flex items-center gap-2 justify-between">
                                                <label className="text-[9px] text-yellow-100/60">Particle Size Scale</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="range" min="0.1" max="5" step="0.1" value={eff.emissionSize !== undefined ? eff.emissionSize : (eff.particleSize !== undefined ? eff.particleSize : 1.0)} onChange={e => updateEffect(index, 'emissionSize', parseFloat(e.target.value))} className="w-16 accent-yellow-500" />
                                                    <span className="text-[10px] text-yellow-500 font-mono w-5 text-right bg-black/30 px-1 rounded">{(eff.emissionSize !== undefined ? eff.emissionSize : (eff.particleSize !== undefined ? eff.particleSize : 1.0)).toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-yellow-500/20">
                                                <label className="text-[9px] text-yellow-500 font-semibold tracking-wider">ELECTRODE</label>
                                                <select
                                                    className="w-28 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-xs text-yellow-100 outline-none focus:border-yellow-400"
                                                    value={eff.electrode || 'both'}
                                                    onChange={e => updateEffect(index, 'electrode', e.target.value)}
                                                >
                                                    <option value="both">Both Active</option>
                                                    <option value="cathode">Cathode Only</option>
                                                    <option value="anode">Anode Only</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-yellow-500/20">
                                                <label className="text-[9px] text-yellow-500 font-semibold tracking-wider">AESTHETIC</label>
                                                <select
                                                    className="w-28 bg-black/50 border border-yellow-500/30 rounded px-2 py-1 text-xs text-yellow-100 outline-none focus:border-yellow-400"
                                                    value={eff.emissionType || 'gas_rise'}
                                                    onChange={e => updateEffect(index, 'emissionType', e.target.value)}
                                                >
                                                    <option value="bubble">Clean Bubble</option>
                                                    <option value="smoke">Thick Smoke</option>
                                                    <option value="gas_rise">Thin Gas</option>
                                                </select>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {eff.type === 'ELECTRODE_DISSOLVING' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 justify-between">
                                    <label className="text-[9px] text-gray-500">Target Electrode</label>
                                    <select
                                        className="w-24 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                                        value={eff.electrode || 'anode'}
                                        onChange={e => updateEffect(index, 'electrode', e.target.value)}
                                    >
                                        <option value="both">Both</option>
                                        <option value="cathode">Cathode (Left)</option>
                                        <option value="anode">Anode (Right)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {eff.type === 'METAL_DEPOSITION' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 justify-between">
                                    <label className="text-[9px] text-gray-500">Target Electrode</label>
                                    <select
                                        className="w-24 bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                                        value={eff.electrode || 'cathode'}
                                        onChange={e => updateEffect(index, 'electrode', e.target.value)}
                                    >
                                        <option value="both">Both</option>
                                        <option value="cathode">Cathode (Left)</option>
                                        <option value="anode">Anode (Right)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 justify-between">
                                    <label className="text-[9px] text-gray-500">Deposition Color</label>
                                    <input type="color" value={eff.color} onChange={e => updateEffect(index, 'color', e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer p-0" />
                                </div>
                            </div>
                        )}

                        {eff.type === 'LIQUID_DRIPPING' && (
                            <div className="bg-blue-950/20 border border-blue-500/30 rounded-lg p-3 mt-3 shadow-inner shadow-blue-900/10">
                                <div className="text-[10px] text-blue-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-blue-500/20 pb-2">
                                    <Droplets size={14} className="text-blue-500 animate-pulse" />
                                    Burette Dripping
                                </div>
                                <div className="space-y-4 pl-1">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] text-blue-100/70 font-medium">Drip Rate Speed</label>
                                            <span className="text-[10px] text-blue-400 font-mono bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                {(eff.dripRate !== undefined ? eff.dripRate : 0.5).toFixed(2)}x
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.05"
                                            value={eff.dripRate !== undefined ? eff.dripRate : 0.5}
                                            onChange={e => updateEffect(index, 'dripRate', parseFloat(e.target.value))}
                                            className="w-full accent-blue-500 h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {eff.type === 'PRECIPITATE_FORMATION' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 justify-between">
                                    <label className="text-[9px] text-gray-500">Amount (0-100%)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="range" min="0" max="1" step="0.05" value={eff.amount !== undefined ? eff.amount : 0.5} onChange={e => updateEffect(index, 'amount', parseFloat(e.target.value))} className="w-24 accent-cyan-500" />
                                        <span className="text-[10px] text-cyan-500 font-mono w-8 text-right bg-black/30 px-1 rounded">{((eff.amount !== undefined ? eff.amount : 0.5) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 justify-between">
                                    <label className="text-[9px] text-gray-500">Color</label>
                                    <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/10">
                                        <input type="color" value={eff.color} onChange={e => updateEffect(index, 'color', e.target.value)} className="w-4 h-4 rounded bg-transparent border-none cursor-pointer p-0" />
                                        <span className="text-[9px] text-white/50">{eff.color}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {eff.type === 'STATE_CHANGE' && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] text-gray-500">New Apparatus Model</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MagnesiumOxideAsh"
                                    value={eff.newModel || ''}
                                    onChange={e => updateEffect(index, 'newModel', e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                                />
                            </div>
                        )}

                    </div>
                ))}

                {!(block.effects?.length > 0) && (
                    <div className="text-center text-gray-600 text-xs py-8 border border-dashed border-white/5 rounded-lg">
                        No effects added.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReactantBlockEditor;
