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
        <div className="bg-[#222] p-4 rounded-lg mb-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Initial State</h3>

            <div className="space-y-4">
                {/* Dynamically List Apparatus State */}
                {apparatusList.map(app => {
                    // Skip if BunsenBurner (handled separately below) or generic tools
                    if (['BunsenBurner', 'TripodStand', 'WireGauze', 'RetortStand', 'Clamp'].includes(app.model)) return null;

                    return (
                        <div key={app.id} className="bg-black/30 p-2 rounded">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2">{app.model} ({app.id})</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-[10px] text-gray-500">Color</label>
                                <input
                                    type="color"
                                    value={initialState[app.id]?.color || '#ffffff'}
                                    onChange={(e) => handleChange(app.id, 'color', e.target.value)}
                                    className="w-full h-6 rounded bg-transparent cursor-pointer"
                                />
                                <label className="text-[10px] text-gray-500">Visibility</label>
                                <select
                                    value={initialState[app.id]?.visible !== false ? 'true' : 'false'}
                                    onChange={(e) => handleChange(app.id, 'visible', e.target.value === 'true')}
                                    className="bg-black text-white text-[10px] p-1 rounded border border-white/10"
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
                <div className="bg-black/30 p-2 rounded">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Bunsen Burner</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-gray-500">Flame Color</label>
                            <input
                                type="color"
                                value={initialState.burner?.flameColor || '#3b82f6'}
                                onChange={(e) => handleChange('burner', 'flameColor', e.target.value)}
                                className="w-8 h-4 rounded bg-transparent cursor-pointer"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>Intensity</span>
                                <span>{initialState.burner?.intensity || 0.6}</span>
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
