import React, { useState } from 'react';
import {
    Plus, X, Play, ChevronDown, ChevronRight,
    Flame, Wind, Droplets, Snowflake, Zap, Lightbulb, Hexagon, Box
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
        heat: false, gas: false, liquid: false, precipitate: false,
        light: false, electricity: false, residue: false, animations: false
    });

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
        <div className="bg-[#1a1a1a] p-4 h-full overflow-y-auto custom-scrollbar border-l border-white/10">
            <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider flex justify-between items-center">
                <span>Step Details</span>
                <button onClick={onPreview} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
                    <Play size={12} fill="currentColor" /> Preview
                </button>
            </h3>

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
                    <select
                        value={step.heat?.source || 'bunsen_flame'}
                        onChange={(e) => handleCategoryChange('heat', 'source', e.target.value)}
                        className={inputClass}
                    >
                        <option value="bunsen_flame">Bunsen Flame</option>
                        <option value="spark">Spark / Ignition</option>
                        <option value="surface_heating">Surface / Hotplate</option>
                    </select>
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

                <div className="flex flex-col gap-3">
                    <ControlRow label="Glow Radius">
                        <input
                            type="number"
                            value={step.heat?.glowRadius || 0}
                            onChange={(e) => handleCategoryChange('heat', 'glowRadius', parseFloat(e.target.value))}
                            className={inputClass}
                        />
                    </ControlRow>
                    <ControlRow label="Temp Rise Speed">
                        <input
                            type="number"
                            value={step.heat?.riseSpeed || 1}
                            onChange={(e) => handleCategoryChange('heat', 'riseSpeed', parseFloat(e.target.value))}
                            className={inputClass}
                        />
                    </ControlRow>
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.heat?.exothermic || false}
                            onChange={(e) => handleCategoryChange('heat', 'exothermic', e.target.checked)}
                            className="accent-orange-500"
                        />
                        Exothermic Pulse
                    </label>
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.heat?.distortion || false}
                            onChange={(e) => handleCategoryChange('heat', 'distortion', e.target.checked)}
                            className="accent-orange-500"
                        />
                        Heat Distortion
                    </label>
                </div>
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
                            <option value="gas_flow">Gas Flow</option>
                        </select>
                    </ControlRow>
                    <ControlRow label="Flow Direction">
                        <select
                            value={step.gas?.direction || 'upward'}
                            onChange={(e) => handleCategoryChange('gas', 'direction', e.target.value)}
                            className={inputClass}
                        >
                            <option value="upward">Upward (Standard)</option>
                            <option value="tube">Through Delivery Tube</option>
                            <option value="jar">To Collection Jar</option>
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
                    <ControlRow label="Opacity">
                        <SliderWithInput
                            min={0} max={1} step={0.1}
                            value={step.gas?.opacity || 0.5}
                            onChange={(v) => handleCategoryChange('gas', 'opacity', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Color">
                        <input
                            type="color"
                            value={step.gas?.color || '#ffffff'}
                            onChange={(e) => handleCategoryChange('gas', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>
                <ControlRow label="Pressure">
                    <SliderWithInput
                        min={0} max={100} step={1}
                        value={step.gas?.pressure || 0}
                        onChange={(v) => handleCategoryChange('gas', 'pressure', v)}
                    />
                </ControlRow>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.gas?.sound || false}
                            onChange={(e) => handleCategoryChange('gas', 'sound', e.target.checked)}
                            className="accent-gray-500"
                        />
                        Sound FX
                    </label>
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.gas?.accumulate || false}
                            onChange={(e) => handleCategoryChange('gas', 'accumulate', e.target.checked)}
                            className="accent-gray-500"
                        />
                        Accumulate Vol
                    </label>
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
                    <ControlRow label="Turbidity">
                        <SliderWithInput
                            min={0} max={1} step={0.1}
                            value={step.liquid?.turbidity || 0}
                            onChange={(v) => handleCategoryChange('liquid', 'turbidity', v)}
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Ripple Intensity">
                        <SliderWithInput
                            min={0} max={10} step={1}
                            value={step.liquid?.ripple || 0}
                            onChange={(v) => handleCategoryChange('liquid', 'ripple', v)}
                        />
                    </ControlRow>
                    <div className="flex flex-col gap-2 pt-2">
                        <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={step.liquid?.foam || false}
                                onChange={(e) => handleCategoryChange('liquid', 'foam', e.target.checked)}
                                className="accent-blue-500"
                            />
                            Foam
                        </label>
                        <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={step.liquid?.boiling || false}
                                onChange={(e) => handleCategoryChange('liquid', 'boiling', e.target.checked)}
                                className="accent-blue-500"
                            />
                            Roiling Boil
                        </label>
                    </div>
                </div>
            </Section>

            {/* D. PRECIPITATE CONTROLS */}
            <Section
                title="Precipitate" icon={Snowflake} color="teal"
                enabled={step.precipitate?.enabled} onToggle={() => toggleCategory('precipitate')}
                isOpen={openSections.precipitate} onToggleOpen={() => toggleSection('precipitate')}
            >
                <div className="flex flex-col gap-3">
                    <ControlRow label="Particle Size">
                        <SliderWithInput
                            min={0.1} max={5} step={0.1}
                            value={step.precipitate?.size || 1}
                            onChange={(v) => handleCategoryChange('precipitate', 'size', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Density">
                        <SliderWithInput
                            min={0} max={100} step={1}
                            value={step.precipitate?.density || 0}
                            onChange={(v) => handleCategoryChange('precipitate', 'density', v)}
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Settling Speed">
                        <SliderWithInput
                            min={0} max={10} step={0.1}
                            value={step.precipitate?.speed || 1}
                            onChange={(v) => handleCategoryChange('precipitate', 'speed', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Color">
                        <input
                            type="color"
                            value={step.precipitate?.color || '#ffffff'}
                            onChange={(e) => handleCategoryChange('precipitate', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Bottom Thickness">
                        <input
                            type="number" step="0.1"
                            value={step.precipitate?.thickness || 0}
                            onChange={(e) => handleCategoryChange('precipitate', 'thickness', parseFloat(e.target.value))}
                            className={inputClass}
                        />
                    </ControlRow>
                    <ControlRow label="Cloud Intensity">
                        <SliderWithInput
                            min={0} max={1} step={0.1}
                            value={step.precipitate?.cloud || 0}
                            onChange={(v) => handleCategoryChange('precipitate', 'cloud', v)}
                        />
                    </ControlRow>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={step.precipitate?.crystal || false}
                        onChange={(e) => handleCategoryChange('precipitate', 'crystal', e.target.checked)}
                        className="accent-teal-500"
                    />
                    Crystal Mode
                </label>
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

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.light?.flicker || false}
                            onChange={(e) => handleCategoryChange('light', 'flicker', e.target.checked)}
                            className="accent-yellow-500"
                        />
                        Flicker
                    </label>
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.light?.flash || false}
                            onChange={(e) => handleCategoryChange('light', 'flash', e.target.checked)}
                            className="accent-yellow-500"
                        />
                        Flash Pulse
                    </label>
                    <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={step.light?.spark || false}
                            onChange={(e) => handleCategoryChange('light', 'spark', e.target.checked)}
                            className="accent-yellow-500"
                        />
                        Sparks
                    </label>
                </div>
            </Section>

            {/* F. ELECTRICAL EFFECTS */}
            <Section
                title="Electrical" icon={Zap} color="purple"
                enabled={step.electricity?.enabled} onToggle={() => toggleCategory('electricity')}
                isOpen={openSections.electricity} onToggleOpen={() => toggleSection('electricity')}
            >
                <ControlRow label="Electrode Selection">
                    <input
                        type="text"
                        value={step.electricity?.electrodes || ''}
                        onChange={(e) => handleCategoryChange('electricity', 'electrodes', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. anode, cathode"
                    />
                </ControlRow>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Current Intensity">
                        <SliderWithInput
                            min={0} max={100} step={1}
                            value={step.electricity?.current || 0}
                            onChange={(v) => handleCategoryChange('electricity', 'current', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Wire Glow">
                        <SliderWithInput
                            min={0} max={10} step={0.1}
                            value={step.electricity?.wireGlow || 0}
                            onChange={(v) => handleCategoryChange('electricity', 'wireGlow', v)}
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Spark Freq">
                        <SliderWithInput
                            min={0} max={10} step={1}
                            value={step.electricity?.sparkFreq || 0}
                            onChange={(v) => handleCategoryChange('electricity', 'sparkFreq', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Electrode Bubbles">
                        <SliderWithInput
                            min={0} max={10} step={1}
                            value={step.electricity?.bubbles || 0}
                            onChange={(v) => handleCategoryChange('electricity', 'bubbles', v)}
                        />
                    </ControlRow>
                </div>

                <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={step.electricity?.powerAnim || false}
                        onChange={(e) => handleCategoryChange('electricity', 'powerAnim', e.target.checked)}
                        className="accent-purple-500"
                    />
                    Power ON Animation
                </label>
            </Section>


            {/* G. RESIDUE / SOLID FORMATION */}
            <Section
                title="Residue / Solid" icon={Hexagon} color="red"
                enabled={step.residue?.enabled} onToggle={() => toggleCategory('residue')}
                isOpen={openSections.residue} onToggleOpen={() => toggleSection('residue')}
            >
                <div className="flex flex-col gap-3">
                    <ControlRow label="Texture">
                        <select
                            value={step.residue?.texture || 'powder'}
                            onChange={(e) => handleCategoryChange('residue', 'texture', e.target.value)}
                            className={inputClass}
                        >
                            <option value="powder">Powder</option>
                            <option value="metal">Metal</option>
                            <option value="crystal">Crystal</option>
                        </select>
                    </ControlRow>
                    <ControlRow label="Color">
                        <input
                            type="color"
                            value={step.residue?.color || '#888888'}
                            onChange={(e) => handleCategoryChange('residue', 'color', e.target.value)}
                            className="w-full h-8 rounded bg-transparent cursor-pointer"
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Coating Thickness">
                        <SliderWithInput
                            min={0} max={2} step={0.1}
                            value={step.residue?.coating || 0}
                            onChange={(v) => handleCategoryChange('residue', 'coating', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Deposition Speed">
                        <SliderWithInput
                            min={0} max={5} step={0.1}
                            value={step.residue?.speed || 1}
                            onChange={(v) => handleCategoryChange('residue', 'speed', v)}
                        />
                    </ControlRow>
                </div>

                <div className="flex flex-col gap-3">
                    <ControlRow label="Mass Decrease">
                        <SliderWithInput
                            min={0} max={100} step={1}
                            value={step.residue?.massDec || 0}
                            onChange={(v) => handleCategoryChange('residue', 'massDec', v)}
                        />
                    </ControlRow>
                    <ControlRow label="Roughness">
                        <SliderWithInput
                            min={0} max={1} step={0.1}
                            value={step.residue?.roughness || 0.5}
                            onChange={(v) => handleCategoryChange('residue', 'roughness', v)}
                        />
                    </ControlRow>
                </div>
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

        </div>
    );
};

export default StepDetailEditor;
