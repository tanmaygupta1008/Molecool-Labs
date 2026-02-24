import React, { useState } from 'react';
import {
    Plus, X, Play, ChevronDown, ChevronRight,
    Flame, Wind, Droplets, Lightbulb, Box, Sparkles
} from 'lucide-react';

// --- HELPER COMPONENTS ---

const Section = ({ title, icon: Icon, color, children, enabled, onToggle, isOpen, onToggleOpen }) => (
    <div className={`mb-4 border rounded-lg overflow-hidden transition-all ${enabled ? `border-${color}-500/50 bg-${color}-900/10` : 'border-white/5 bg-black/20'}`}>
        <div
            className="flex items-center justify-between p-3 cursor-pointer select-none bg-black/40 hover:bg-black/60 transition-colors"
            onClick={onToggleOpen}
        >
            <div className="flex items-center gap-2">
                <Icon size={16} className={enabled ? `text-${color}-400` : 'text-gray-600'} />
                <span className={`text-xs font-bold uppercase tracking-wider ${enabled ? `text-${color}-400` : 'text-gray-500'}`}>
                    {title}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <div
                    onClick={(e) => { e.stopPropagation(); onToggle(!enabled); }}
                    className={`w-8 h-4 rounded-full relative transition-colors ${enabled ? `bg-${color}-500` : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${enabled ? 'left-4.5' : 'left-0.5'}`} style={{ left: enabled ? '1.125rem' : '0.125rem' }} />
                </div>
                {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
            </div>
        </div>

        {isOpen && (
            <div className={`p-3 border-t border-white/5 space-y-3 ${!enabled && 'opacity-50 pointer-events-none grayscale'}`}>
                {children}
            </div>
        )}
    </div>
);

const ControlRow = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold text-gray-500">{label}</label>
        {children}
    </div>
);

const inputClass = "w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:border-cyan-500 focus:outline-none placeholder-gray-700";
const sliderClass = "flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500";
const numberInputClass = "w-12 bg-black/30 border border-white/10 rounded px-1 py-0.5 text-[10px] text-right text-cyan-300 focus:outline-none";

// Helper for Slider with Input
const SliderWithInput = ({ value, min, max, step, onChange }) => (
    <div className="flex items-center gap-2 w-full">
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={sliderClass}
        />
        <input
            type="number" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={numberInputClass}
        />
    </div>
);

// Apparatus Dropdown Option Helper
const ApparatusSelect = ({ value, onChange, apparatusList, placeholder = "Select Apparatus" }) => (
    <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
    >
        <option value="" disabled>{placeholder}</option>
        {apparatusList.map(app => (
            <option key={app.id} value={app.id}>
                {app.id} ({app.model})
            </option>
        ))}
    </select>
);

const StepDetailEditor = ({ step, apparatusList = [], onChange, onPreview }) => {
    // Local state for section collapse
    const [openSections, setOpenSections] = useState({
        heat: false, gas: false, liquid: false, light: false, animations: false, effects: false
    });

    // Local state for the "Add New Effect" form
    const [newEffectType, setNewEffectType] = useState('MORPH');
    const [newEffectTarget, setNewEffectTarget] = useState('');
    const [newEffectAmount, setNewEffectAmount] = useState(50); // State for Gas Displacement slider
    const [newEffectShowGas, setNewEffectShowGas] = useState(true); // State for Show Gas toggle
    const [editingEffectIdx, setEditingEffectIdx] = useState(null);

    if (!step) return <div className="text-gray-500 text-xs italic p-4">Select a step to edit details</div>;

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleStepChange = (key, value) => {
        onChange({ ...step, [key]: value });
    };

    const handleCategoryChange = (category, field, value) => {
        const currentCategory = step[category] || {};
        onChange({
            ...step,
            [category]: { ...currentCategory, [field]: value }
        });
    };

    const toggleCategory = (category) => {
        const current = step[category] || {};
        handleCategoryChange(category, 'enabled', !current.enabled);
        if (!current.enabled) {
            setOpenSections(prev => ({ ...prev, [category]: true }));
        }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Description */}
            <div className="mb-6">
                <ControlRow label="Description">
                    <input
                        type="text"
                        value={step.description || ''}
                        onChange={(e) => handleStepChange('description', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. User picks up Magnesium"
                    />
                </ControlRow>
            </div>

            {/* --- SECTIONS --- */}

            {/* A. HEAT CONTROLS */}
            <Section
                title="Heat Controls" icon={Flame} color="orange"
                enabled={step.heat?.enabled} onToggle={() => toggleCategory('heat')}
                isOpen={openSections.heat} onToggleOpen={() => toggleSection('heat')}
            >
                <ControlRow label="Heat Source">
                    <ApparatusSelect
                        value={step.heat?.source}
                        onChange={(v) => handleCategoryChange('heat', 'source', v)}
                        apparatusList={apparatusList}
                        placeholder="Select Burner/Hotplate"
                    />
                </ControlRow>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Intensity (0-10)">
                        <SliderWithInput
                            min={0} max={10} step={0.1}
                            value={step.heat?.intensity || 0}
                            onChange={(v) => handleCategoryChange('heat', 'intensity', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Flame Color">
                        <input
                            type="color"
                            value={step.heat?.color || '#ff6600'}
                            onChange={(e) => handleCategoryChange('heat', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>
                <ControlRow label="Glow Radius">
                    <input
                        type="number"
                        value={step.heat?.glowRadius || 0}
                        onChange={(e) => handleCategoryChange('heat', 'glowRadius', parseFloat(e.target.value))}
                        className={inputClass}
                    />
                </ControlRow>
            </Section>


            {/* B. GAS CONTROLS */}
            <Section
                title="Gas Controls" icon={Wind} color="gray"
                enabled={step.gas?.enabled} onToggle={() => toggleCategory('gas')}
                isOpen={openSections.gas} onToggleOpen={() => toggleSection('gas')}
            >
                <ControlRow label="Gas Source">
                    <ApparatusSelect
                        value={step.gas?.source}
                        onChange={(v) => handleCategoryChange('gas', 'source', v)}
                        apparatusList={apparatusList}
                        placeholder="Select Source Apparatus"
                    />
                </ControlRow>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Gas Type">
                        <select
                            value={step.gas?.type || 'bubble'}
                            onChange={(e) => handleCategoryChange('gas', 'type', e.target.value)}
                            className={inputClass}
                        >
                            <option value="bubble">Bubbles</option>
                            <option value="smoke">Smoke / Fumes</option>
                        </select>
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Rate (Intensity)">
                        <SliderWithInput
                            min={0} max={200} step={1}
                            value={step.gas?.rate || 0}
                            onChange={(v) => handleCategoryChange('gas', 'rate', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Particle Size">
                        <SliderWithInput
                            min={0.1} max={3} step={0.1}
                            value={step.gas?.size || 0.5}
                            onChange={(v) => handleCategoryChange('gas', 'size', v)}
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Color">
                        <input
                            type="color"
                            value={step.gas?.color || '#ffffff'}
                            onChange={(e) => handleCategoryChange('gas', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>
            </Section>


            {/* C. LIQUID BEHAVIOR */}
            <Section
                title="Liquid Behavior" icon={Droplets} color="blue"
                enabled={step.liquid?.enabled} onToggle={() => toggleCategory('liquid')}
                isOpen={openSections.liquid} onToggleOpen={() => toggleSection('liquid')}
            >
                <div className="flex flex-col gap-3">
                    <ControlRow label="Initial Color">
                        <input
                            type="color"
                            value={step.liquid?.initialColor || '#ffffff'}
                            onChange={(e) => handleCategoryChange('liquid', 'initialColor', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                    <ControlRow label="Final Color">
                        <input
                            type="color"
                            value={step.liquid?.finalColor || '#ffffff'}
                            onChange={(e) => handleCategoryChange('liquid', 'finalColor', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>

                <ControlRow label="Transition Duration (s)">
                    <input
                        type="number" step="0.1"
                        value={step.liquid?.duration || 1}
                        onChange={(e) => handleCategoryChange('liquid', 'duration', parseFloat(e.target.value))}
                        className={inputClass}
                    />
                </ControlRow>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Transparency">
                        <SliderWithInput
                            min={0} max={1} step={0.1}
                            value={step.liquid?.transparency !== undefined ? step.liquid.transparency : 0.8}
                            onChange={(v) => handleCategoryChange('liquid', 'transparency', v)}
                        />
                    </ControlRow>
                </div>
            </Section>


            {/* E. LIGHT EFFECTS */}
            <Section
                title="Light Effects" icon={Lightbulb} color="yellow"
                enabled={step.light?.enabled} onToggle={() => toggleCategory('light')}
                isOpen={openSections.light} onToggleOpen={() => toggleSection('light')}
            >
                <div className="flex flex-col gap-3">
                    <ControlRow label="Intensity">
                        <SliderWithInput
                            min={0} max={10} step={0.1}
                            value={step.light?.intensity || 0}
                            onChange={(v) => handleCategoryChange('light', 'intensity', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Color">
                        <input
                            type="color"
                            value={step.light?.color || '#ffff00'}
                            onChange={(e) => handleCategoryChange('light', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>
                <ControlRow label="Glow Radius">
                    <SliderWithInput
                        min={0} max={5} step={0.1}
                        value={step.light?.radius || 0}
                        onChange={(v) => handleCategoryChange('light', 'radius', v)}
                    />
                </ControlRow>
            </Section>

            {/* H. TRANSFORMATIONS (Model Swap, Visibility, Scale) */}
            <Section
                title="Transformations" icon={Box} color="pink"
                enabled={true} onToggle={() => { }}
                isOpen={openSections.animations} onToggleOpen={() => toggleSection('animations')}
            >
                <div className="space-y-3">
                    <div className="text-[10px] text-gray-500 mb-2">
                        Permanent changes to apparatus state (Swap Model, Hide, Resize).
                    </div>

                    {/* List Existing Transformations */}
                    {(step.transformations || []).map((trans, idx) => (
                        <div key={idx} className="bg-black/40 p-2 rounded border border-white/10 flex justify-between items-center group">
                            <div className="text-[10px] text-gray-300">
                                <span className="text-pink-400 font-bold uppercase mr-2">{trans.type}</span>
                                {trans.target}
                            </div>
                            <button
                                onClick={() => {
                                    const newTrans = [...(step.transformations || [])];
                                    newTrans.splice(idx, 1);
                                    handleStepChange('transformations', newTrans);
                                }}
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Add New Transformation Form */}
                    <div className="bg-white/5 p-2 rounded space-y-2 border border-dashed border-white/10">
                        <div className="text-[10px] uppercase font-bold text-gray-500">Add New</div>
                        <select
                            id="new-trans-type"
                            className={inputClass}
                            defaultValue="model_swap"
                        >
                            <option value="model_swap">Swap Model (e.g. Turn to Ash)</option>
                            <option value="visibility">Show / Hide</option>
                            <option value="scale">Change Scale</option>
                            <option value="color">Change Color</option>
                        </select>
                        <div className="w-full">
                            <select
                                id="new-trans-target"
                                className={inputClass}
                                defaultValue=""
                            >
                                <option value="" disabled>Select Target</option>
                                {apparatusList.map(app => (
                                    <option key={app.id} value={app.id}>{app.id} ({app.model})</option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic Inputs */}
                        <input
                            id="new-trans-value"
                            type="text"
                            className={inputClass}
                            placeholder="Value (ModelName / true/false / 1.5)"
                        />

                        <button
                            onClick={() => {
                                const type = document.getElementById('new-trans-type').value;
                                const target = document.getElementById('new-trans-target').value;
                                const valStr = document.getElementById('new-trans-value').value;

                                if (!target) return;

                                const newTrans = { type, target };
                                if (type === 'model_swap') newTrans.newModel = valStr;
                                if (type === 'visibility') newTrans.visible = valStr === 'true';
                                if (type === 'scale') newTrans.scale = [parseFloat(valStr), parseFloat(valStr), parseFloat(valStr)];
                                if (type === 'color') newTrans.color = valStr;

                                const current = step.transformations || [];
                                handleStepChange('transformations', [...current, newTrans]);
                            }}
                            className="w-full py-1 text-xs bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded border border-pink-500/30"
                        >
                            + Add Transformation
                        </button>
                    </div>
                </div>
            </Section>

            {/* I. ADVANCED VISUAL EFFECTS (Visual Engine) */}
            <Section
                title="Advanced Visual Effects" icon={Sparkles} color="yellow"
                enabled={true} onToggle={() => { }}
                isOpen={openSections.effects} onToggleOpen={() => toggleSection('effects')}
            >
                <div className="space-y-3">
                    <div className="text-[10px] text-gray-500 mb-2">
                        Dynamic animations calculated by the Visual Engine (Morph, Lerp, Fluid).
                    </div>

                    {/* List Existing Effects */}
                    {(step.effects || []).map((eff, idx) => (
                        <div key={idx} className="bg-black/40 p-2 rounded border border-white/10 flex justify-between items-center group">
                            <div className="text-[10px] text-gray-300 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-yellow-400 font-bold uppercase">{eff.type}</span>
                                    <span className="text-gray-500">#{eff.id || idx}</span>
                                </div>
                                <div className="text-gray-400">
                                    {eff.type === 'MORPH' || eff.type === 'COLOR_LERP' ? (
                                        <>Target: <b>{eff.targetId}</b> | Prop: {eff.property} ({eff.startValue} &rarr; {eff.endValue})</>
                                    ) : eff.type === 'GAS_DISPLACEMENT' ? (
                                        <>Src: <b>{eff.sourceId}</b> &rarr; Tgt: <b>{eff.targetId}</b> (Aux: {eff.auxTargetId || 'none'})</>
                                    ) : eff.type === 'GAS' ? (
                                        <>Src: <b>{eff.sourceId || eff.target}</b> | Rate: {eff.rate}</>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex gap-2 ml-2">
                                <button
                                    onClick={() => {
                                        setEditingEffectIdx(idx);
                                        setNewEffectType(eff.type);
                                        setTimeout(() => {
                                            if (document.getElementById('eff-duration')) document.getElementById('eff-duration').value = eff.durationSteps || 1;
                                            if (eff.type === 'MORPH' || eff.type === 'COLOR_LERP') setNewEffectTarget(eff.targetId);

                                            if (eff.type === 'MORPH') {
                                                if (document.getElementById('eff-prop')) document.getElementById('eff-prop').value = eff.property;
                                                if (document.getElementById('eff-start')) document.getElementById('eff-start').value = eff.startValue;
                                                if (document.getElementById('eff-end')) document.getElementById('eff-end').value = eff.endValue;
                                            } else if (eff.type === 'COLOR_LERP') {
                                                if (document.getElementById('eff-prop')) document.getElementById('eff-prop').value = eff.property;
                                                if (document.getElementById('eff-c-start')) document.getElementById('eff-c-start').value = eff.startValue;
                                                if (document.getElementById('eff-c-end')) document.getElementById('eff-c-end').value = eff.endValue;
                                            } else if (eff.type === 'GAS') {
                                                setNewEffectTarget(eff.sourceId || eff.target);
                                                if (document.getElementById('eff-gas-type')) document.getElementById('eff-gas-type').value = eff.gasType || 'bubble';
                                                if (document.getElementById('eff-gas-rate')) document.getElementById('eff-gas-rate').value = eff.rate;
                                                if (document.getElementById('eff-gas-color')) document.getElementById('eff-gas-color').value = eff.color;
                                            } else if (eff.type === 'GAS_DISPLACEMENT') {
                                                if (document.getElementById('eff-disp-src')) document.getElementById('eff-disp-src').value = eff.sourceId;
                                                if (document.getElementById('eff-disp-tgt')) document.getElementById('eff-disp-tgt').value = eff.targetId;
                                                if (document.getElementById('eff-disp-aux') && eff.auxTargetId) document.getElementById('eff-disp-aux').value = eff.auxTargetId;
                                                // Calculate reverse amount from targetGasOpacityEnd
                                                const extractedAmount = (eff.targetGasOpacityEnd !== undefined) ? (eff.targetGasOpacityEnd * 100) : 50;
                                                setNewEffectAmount(extractedAmount);
                                                setNewEffectShowGas(eff.showGas !== false); // Default to true if undefined
                                            }
                                        }, 50);
                                    }}
                                    className="text-gray-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span style={{ fontSize: '10px' }}>EDIT</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const newEffs = [...(step.effects || [])];
                                        newEffs.splice(idx, 1);
                                        handleStepChange('effects', newEffs);
                                        if (editingEffectIdx === idx) setEditingEffectIdx(null);
                                    }}
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Effect Form */}
                    <div className="bg-white/5 p-2 rounded space-y-2 border border-dashed border-white/10 relative">
                        {editingEffectIdx !== null && (
                            <button
                                onClick={() => {
                                    setEditingEffectIdx(null);
                                    setNewEffectType('MORPH');
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        )}
                        <div className="text-[10px] uppercase font-bold text-yellow-500/80">
                            {editingEffectIdx !== null ? `Edit Effect #${editingEffectIdx}` : 'Add New Effect'}
                        </div>

                        <ControlRow label="Effect Type">
                            <select
                                value={newEffectType}
                                onChange={(e) => setNewEffectType(e.target.value)}
                                className={inputClass}
                            >
                                <option value="MORPH">Morph / Animate Value</option>
                                <option value="COLOR_LERP">Color Transition</option>
                                <option value="GAS">Gas / Bubbling</option>
                                <option value="GAS_DISPLACEMENT">Gas Displacement (Physics)</option>
                            </select>
                        </ControlRow>

                        {/* Dynamic fields based on Effect Type */}
                        {newEffectType !== 'GAS_DISPLACEMENT' && (
                            <ControlRow label="Target Apparatus">
                                <select value={newEffectTarget} onChange={(e) => setNewEffectTarget(e.target.value)} className={inputClass}>
                                    <option value="" disabled>Select Target</option>
                                    {apparatusList.map(app => (
                                        <option key={app.id} value={app.id}>{app.id} ({app.model})</option>
                                    ))}
                                </select>
                            </ControlRow>
                        )}

                        {newEffectType === 'MORPH' && (
                            <>
                                <input id="eff-prop" type="text" className={inputClass} placeholder="Property (e.g. burnProgress)" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input id="eff-start" type="number" step="0.01" className={inputClass} placeholder="Start Value" />
                                    <input id="eff-end" type="number" step="0.01" className={inputClass} placeholder="End Value" />
                                </div>
                            </>
                        )}

                        {newEffectType === 'COLOR_LERP' && (
                            <>
                                <input id="eff-prop" type="text" className={inputClass} placeholder="Property (e.g. flameColor)" />
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400">Start:</span>
                                        <input id="eff-c-start" type="color" className="w-full h-6 rounded bg-transparent" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400">End:</span>
                                        <input id="eff-c-end" type="color" className="w-full h-6 rounded bg-transparent" />
                                    </div>
                                </div>
                            </>
                        )}

                        {newEffectType === 'GAS' && (
                            <>
                                <ControlRow label="Gas Type">
                                    <select id="eff-gas-type" className={inputClass} defaultValue="bubble">
                                        <option value="bubble">Bubbles</option>
                                        <option value="smoke">Smoke / Vapor</option>
                                    </select>
                                </ControlRow>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <input id="eff-gas-rate" type="number" className={inputClass} placeholder="Rate (e.g. 50)" />
                                    <input id="eff-gas-color" type="color" className="w-full h-6 rounded bg-transparent" />
                                </div>
                            </>
                        )}

                        {newEffectType === 'GAS_DISPLACEMENT' && (
                            <>
                                <ControlRow label="Source (Gas Generator)">
                                    <select id="eff-disp-src" className={inputClass} defaultValue="">
                                        <option value="" disabled>Select Source</option>
                                        {apparatusList.map(app => <option key={app.id} value={app.id}>{app.id}</option>)}
                                    </select>
                                </ControlRow>
                                <ControlRow label="Target (Gas Receiver)">
                                    <select id="eff-disp-tgt" className={inputClass} defaultValue="">
                                        <option value="" disabled>Select Target</option>
                                        {apparatusList.map(app => <option key={app.id} value={app.id}>{app.id}</option>)}
                                    </select>
                                </ControlRow>
                                <ControlRow label="Aux Target (Water Trough)">
                                    <select id="eff-disp-aux" className={inputClass} defaultValue="">
                                        <option value="">None</option>
                                        {apparatusList.map(app => <option key={app.id} value={app.id}>{app.id}</option>)}
                                    </select>
                                </ControlRow>

                                <ControlRow label="Displacement Amount (%)">
                                    <div className="mt-2">
                                        <SliderWithInput
                                            min={0} max={100} step={1}
                                            value={newEffectAmount}
                                            onChange={(val) => setNewEffectAmount(val)}
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-500 mt-1 italic">
                                        How much gas to transfer from Source to Target. Auto-calculates liquid levels.
                                    </div>
                                </ControlRow>
                                <ControlRow label="Visuals">
                                    <label className="flex items-center gap-2 text-[11px] text-gray-300 mt-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newEffectShowGas}
                                            onChange={(e) => setNewEffectShowGas(e.target.checked)}
                                            className="w-3 h-3 accent-cyan-500"
                                        />
                                        Show Gas Bubbles traversing through Delivery Tube
                                    </label>
                                </ControlRow>
                            </>
                        )}

                        <ControlRow label="Duration (Steps)">
                            <input id="eff-duration" type="number" min="1" className={inputClass} defaultValue="1" placeholder="e.g. 3 steps" />
                        </ControlRow>

                        <button
                            onClick={() => {
                                const newEff = { type: newEffectType, id: `eff_${Date.now()}` };

                                if (newEffectType !== 'GAS_DISPLACEMENT') {
                                    if (!newEffectTarget) return;
                                    newEff.targetId = newEffectTarget;
                                    newEff.sourceId = newEffectTarget; // For GAS
                                }

                                if (newEffectType === 'MORPH') {
                                    newEff.property = document.getElementById('eff-prop').value;
                                    newEff.startValue = parseFloat(document.getElementById('eff-start').value);
                                    newEff.endValue = parseFloat(document.getElementById('eff-end').value);
                                } else if (newEffectType === 'COLOR_LERP') {
                                    newEff.property = document.getElementById('eff-prop').value;
                                    newEff.startValue = document.getElementById('eff-c-start').value;
                                    newEff.endValue = document.getElementById('eff-c-end').value;
                                } else if (newEffectType === 'GAS') {
                                    newEff.gasType = document.getElementById('eff-gas-type').value; // 'smoke' or 'bubble'
                                    newEff.rate = parseFloat(document.getElementById('eff-gas-rate').value) || 50;
                                    newEff.color = document.getElementById('eff-gas-color').value;
                                } else if (newEffectType === 'GAS_DISPLACEMENT') {
                                    newEff.sourceId = document.getElementById('eff-disp-src').value;
                                    const src = document.getElementById('eff-disp-src').value;
                                    const tgt = document.getElementById('eff-disp-tgt').value;
                                    const aux = document.getElementById('eff-disp-aux').value;
                                    const amount = newEffectAmount / 100.0; // 0 to 1

                                    if (!src || !tgt) return;

                                    newEff.sourceId = src;
                                    newEff.targetId = tgt;
                                    newEff.showGas = newEffectShowGas;
                                    if (aux) newEff.auxTargetId = aux;

                                    // AUTO CALCULATE EXTENTS BASED ON AMOUNT
                                    // 1. Source liquid drops from 100% to (1-amount)
                                    newEff.sourceLiquidStart = 1;
                                    newEff.sourceLiquidEnd = 1 - amount;

                                    // 2. Target liquid drops from 100% to (1-amount) (pushed out by gas)
                                    newEff.targetLiquidStart = 1;
                                    newEff.targetLiquidEnd = 1 - amount;

                                    // 3. Target gas opacity increases from 0 to amount
                                    newEff.targetGasOpacityStart = 0;
                                    newEff.targetGasOpacityEnd = amount;

                                    // 4. Aux target (trough) liquid increases slightly from 1 to (1 + amount*0.2)
                                    if (aux) {
                                        newEff.auxLiquidStart = 1;
                                        newEff.auxLiquidEnd = 1 + (amount * 0.2); // Just a generic slight increase
                                    }
                                }

                                newEff.durationSteps = parseInt(document.getElementById('eff-duration').value, 10) || 1;

                                const current = [...(step.effects || [])];
                                if (editingEffectIdx !== null) {
                                    current[editingEffectIdx] = newEff;
                                    setEditingEffectIdx(null);
                                } else {
                                    current.push(newEff);
                                }
                                handleStepChange('effects', current);
                            }}
                            className={`w-full py-1 mt-2 text-xs rounded border ${editingEffectIdx !== null ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30' : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30'}`}
                        >
                            {editingEffectIdx !== null ? 'Save Changes' : '+ Add Effect'}
                        </button>
                    </div>
                </div>
            </Section>
        </div>
    );
};

export default StepDetailEditor;
