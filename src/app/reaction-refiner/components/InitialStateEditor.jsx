import React from 'react';

const InitialStateEditor = ({ initialState = {}, onChange, apparatusList = [] }) => {

    const handleChange = (category, key, value) => {
        const newState = { ...initialState };
        if (!newState[category]) newState[category] = {};
        newState[category][key] = value;
        onChange(newState);
    };

    // Helper to get apparatus name/label
    const getAppLabel = (id) => {
        const app = apparatusList.find(a => a.id === id);
        return app ? `${app.model} (${id})` : id;
    };

    return (
        <div className="bg-[#222] p-5 rounded-xl mb-4 border border-white/5">
            <h3 className="text-base font-black text-white mb-4 uppercase tracking-[0.2em]">Initial State</h3>

            <div className="space-y-4">
                {/* Dynamically List Apparatus State */}
                {apparatusList.map(app => {
                    // Skip if BunsenBurner (handled separately below) or generic tools
                    if (['BunsenBurner', 'TripodStand', 'WireGauze', 'RetortStand', 'Clamp'].includes(app.model)) return null;

                    return (
                        <div key={app.id} className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <h4 className="text-[11px] font-black text-white/90 mb-3 uppercase tracking-widest">{app.model} ({app.id})</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-[12px] font-bold text-white uppercase tracking-tight">Color</label>
                                <input
                                    type="color"
                                    value={initialState[app.id]?.color || '#ffffff'}
                                    onChange={(e) => handleChange(app.id, 'color', e.target.value)}
                                    className="w-full h-8 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                                />
                                <label className="text-[12px] font-bold text-white uppercase tracking-tight">Visibility</label>
                                <select
                                    value={initialState[app.id]?.visible !== false ? 'true' : 'false'}
                                    onChange={(e) => handleChange(app.id, 'visible', e.target.value === 'true')}
                                    className="bg-black text-white text-[12px] p-2 rounded-lg border border-white/20 font-bold"
                                >
                                    <option value="true">Visible</option>
                                    <option value="false">Hidden</option>
                                </select>
                                {/* Add more specific props here later (e.g. fillLevel for Flasks) */}
                            </div>
                        </div>
                    );
                })}

                {/* Burner Settings (Always available if present or generic) */}
                <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <h4 className="text-[11px] font-black text-white/90 mb-3 uppercase tracking-widest">Bunsen Burner</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[12px] font-bold text-white uppercase tracking-tight">Flame Color</label>
                            <input
                                type="color"
                                value={initialState.burner?.flameColor || '#3b82f6'}
                                onChange={(e) => handleChange('burner', 'flameColor', e.target.value)}
                                className="w-10 h-6 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-[12px] font-bold text-white uppercase mb-2">
                                <span>Intensity</span>
                                <span className="text-blue-400">{initialState.burner?.intensity || 0.6}</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={initialState.burner?.intensity || 0.6}
                                onChange={(e) => handleChange('burner', 'intensity', parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InitialStateEditor;
