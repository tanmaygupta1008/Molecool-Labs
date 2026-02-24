import React from 'react';

const AdvancedEngineEditor = ({ visualRules = {}, onChange, apparatusList = [] }) => {

    const updateEvents = (category, index, key, value) => {
        const newRules = { ...visualRules };
        if (!newRules[category]) newRules[category] = [];

        // Ensure array
        let arr = [...newRules[category]];

        if (index === -1) {
            // Add new blank
            arr.push(getBlankTemplate(category));
        } else if (key === 'DELETE') {
            // Remove
            arr.splice(index, 1);
        } else {
            // Update
            arr[index][key] = value;
        }

        newRules[category] = arr;
        onChange(newRules);
    };

    const getBlankTemplate = (category) => {
        const base = { target: '', startTime: 0, duration: 1000 };
        switch (category) {
            case 'gasEvents': return { source: '', destination: '', gasType: 'H2', rate: 10, startTime: 0, duration: 1000 };
            case 'liquidEvents': return { ...base, type: 'precipitateFormation', color: '#ffffff', density: 0.5, settleSpeed: 0.5 };
            case 'solidEvents': return { ...base, type: 'dissolve', growthRate: 1.0 };
            case 'forceEvents': return { ...base, type: 'explosion', origin: '', radius: 5, strength: 10, target: undefined };
            default: return base;
        }
    };

    const EventBlock = ({ title, category, fields }) => {
        const events = visualRules[category] || [];
        return (
            <div className="mb-4 border border-white/5 bg-black/20 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-black/40 border-b border-white/5">
                    <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-wider">{title}</h3>
                    <button
                        onClick={() => updateEvents(category, -1)}
                        className="bg-black/50 text-cyan-400 hover:text-white px-2 py-0.5 rounded text-[10px] border border-cyan-900 transition-colors"
                    >
                        + Add
                    </button>
                </div>

                <div className="p-3">
                    {events.length === 0 && <div className="text-[10px] text-gray-500 italic">No {category} defined.</div>}

                    {events.map((ev, index) => (
                        <div key={index} className="bg-black/30 p-2 rounded mb-2 border border-white/5 relative group">
                            <button
                                onClick={() => updateEvents(category, index, 'DELETE')}
                                className="absolute top-1 right-2 text-red-500 opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                            >×</button>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {fields.map(f => (
                                    <React.Fragment key={f.key}>
                                        <label className="text-[10px] text-gray-500 capitalize">{f.label || f.key}</label>
                                        {f.type === 'select' ? (
                                            <select
                                                className="bg-black text-white text-[10px] p-1 rounded border border-white/10"
                                                value={ev[f.key] || ''}
                                                onChange={(e) => updateEvents(category, index, f.key, e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.type || "text"}
                                                value={ev[f.key] || ''}
                                                onChange={(e) => updateEvents(category, index, f.key, f.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                                className={`bg-black text-white text-[10px] p-1 rounded border border-white/10 ${f.type === 'color' ? 'h-6 w-full p-0 border-0' : ''}`}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const apparatusIds = apparatusList.map(a => a.id);

    return (
        <div className="space-y-4">
            <EventBlock
                title="💨 Gas Engine"
                category="gasEvents"
                fields={[
                    { key: 'source', type: 'select', options: apparatusIds },
                    { key: 'destination', type: 'select', options: apparatusIds },
                    { key: 'gasType' },
                    { key: 'rate', type: 'number' },
                    { key: 'startTime', type: 'number' },
                    { key: 'duration', type: 'number' }
                ]}
            />

            <EventBlock
                title="💧 Liquid Engine"
                category="liquidEvents"
                fields={[
                    { key: 'target', type: 'select', options: apparatusIds },
                    { key: 'type', type: 'select', options: ['precipitateFormation'] },
                    { key: 'color', type: 'color' },
                    { key: 'density', type: 'number' },
                    { key: 'settleSpeed', type: 'number' },
                    { key: 'startTime', type: 'number' },
                    { key: 'duration', type: 'number' }
                ]}
            />

            <EventBlock
                title="🪨 Solid Engine"
                category="solidEvents"
                fields={[
                    { key: 'target', type: 'select', options: apparatusIds },
                    { key: 'type', type: 'select', options: ['deposition', 'dissolve'] },
                    { key: 'color', type: 'color' },
                    { key: 'growthRate', type: 'number' },
                    { key: 'startTime', type: 'number' },
                    { key: 'duration', type: 'number' }
                ]}
            />

            <EventBlock
                title="💥 Force Engine (Physics)"
                category="forceEvents"
                fields={[
                    { key: 'origin', type: 'select', options: apparatusIds },
                    { key: 'type', type: 'select', options: ['explosion'] },
                    { key: 'radius', type: 'number' },
                    { key: 'strength', type: 'number' },
                    { key: 'startTime', type: 'number' },
                    { key: 'duration', type: 'number' }
                ]}
            />
        </div>
    );
};

export default AdvancedEngineEditor;
