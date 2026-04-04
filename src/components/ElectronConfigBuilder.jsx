import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';

// Maps noble gas symbols to their electron counts
const NOBLE_GAS_CORES = {
  '[He]': 2,
  '[Ne]': 10,
  '[Ar]': 18,
  '[Kr]': 36,
  '[Xe]': 54,
  '[Rn]': 86,
};

// Max electrons per orbital type
const MAX_ELECTRONS = {
  s: 2,
  p: 6,
  d: 10,
  f: 14,
};

const ElectronConfigBuilder = ({ element }) => {
  const [targetConfig, setTargetConfig] = useState([]);
  const [corePrefix, setCorePrefix] = useState('');
  const [currentAllocation, setCurrentAllocation] = useState({});
  const [availableElectrons, setAvailableElectrons] = useState(0);
  const [totalElectronsToAllocate, setTotalElectronsToAllocate] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!element?.electron_configuration) return;

    let configStr = element.electron_configuration.replace(/\*/g, '').trim();
    let coreStr = '';
    
    // Check if it starts with a noble gas core, e.g., "[Ar] 4s2 3d10 4p5"
    const coreMatch = configStr.match(/^(\[[A-Za-z]{2}\])\s*(.*)$/);
    if (coreMatch) {
      coreStr = coreMatch[1];
      configStr = coreMatch[2];
    } else {
      // If it's a full string like "1s2 2s2 2p6 3s1"
      // Let's manually identify the core if we want to only show valence.
      // For simplicity, if we don't have brackets, we just present the last few terms as editable
      // or we just parse the whole string and make them all editable.
      // But the user requested "only let them fill valence electrons".
      // Let's find the last 'p6' and make everything before it the "core".
      const parts = configStr.split(' ');
      let lastP6Index = -1;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].endsWith('p6')) lastP6Index = i;
      }
      
      if (lastP6Index >= 0 && lastP6Index < parts.length - 1) {
        coreStr = parts.slice(0, lastP6Index + 1).join(' '); // We'll just show this string directly
        configStr = parts.slice(lastP6Index + 1).join(' ');
      }
    }

    setCorePrefix(coreStr);

    const parts = configStr.split(/\s+/).filter(Boolean);
    const target = [];
    let initialAlloc = {};
    let totalToAllocate = 0;

    parts.forEach(part => {
      // e.g., 3s2, 4f14, 3d10
      const match = part.match(/^(\d[spdf])(\d+)$/);
      if (match) {
        const subshell = match[1]; // 3s
        const count = parseInt(match[2], 10); // 2
        target.push({ subshell, targetCount: count, type: subshell[1] });
        initialAlloc[subshell] = 0;
        totalToAllocate += count;
      } else {
         // Some databases might have irregular formats, fail gracefully
         target.push({ subshell: part, targetCount: 1, type: 's' });
         initialAlloc[part] = 0;
         totalToAllocate += 1;
      }
    });

    setTargetConfig(target);
    setCurrentAllocation(initialAlloc);
    setAvailableElectrons(totalToAllocate);
    setTotalElectronsToAllocate(totalToAllocate);
    setIsSuccess(false);
    setShowHint(false);
  }, [element]);

  const handleAddElectron = (subshell, maxForType) => {
    if (availableElectrons > 0 && currentAllocation[subshell] < maxForType) {
      setCurrentAllocation(prev => ({ ...prev, [subshell]: prev[subshell] + 1 }));
      setAvailableElectrons(prev => prev - 1);
    }
  };

  const handleRemoveElectron = (subshell) => {
    if (currentAllocation[subshell] > 0) {
      setCurrentAllocation(prev => ({ ...prev, [subshell]: prev[subshell] - 1 }));
      setAvailableElectrons(prev => prev + 1);
    }
  };

  const handleReset = () => {
    const initialAlloc = {};
    targetConfig.forEach(t => initialAlloc[t.subshell] = 0);
    setCurrentAllocation(initialAlloc);
    setAvailableElectrons(totalElectronsToAllocate);
    setIsSuccess(false);
    setShowHint(false);
  };

  // Check for win condition
  useEffect(() => {
    if (targetConfig.length === 0) return;
    
    // Win if all allocs match target
    const isWin = targetConfig.every(t => currentAllocation[t.subshell] === t.targetCount);
    if (isWin && availableElectrons === 0) {
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
    }
  }, [currentAllocation, availableElectrons, targetConfig]);

  if (!element || targetConfig.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-gray-400">
        <p>No electron configuration data available for this element.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div>
          <h3 className="text-xl font-bold text-cyan-300">Configuration Builder</h3>
          <p className="text-sm text-gray-400 mt-1">
            Allocate the valence electrons for <span className="text-white font-semibold">{element.name}</span>!
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
          >
            <HelpCircle size={16} /> Hint
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {showHint && (
        <div className="mb-4 p-3 bg-cyan-900/30 border border-cyan-800 rounded text-cyan-200 text-sm flex justify-between items-center animate-fadeIn">
          <span>Target Configuration:</span>
          <span className="font-mono text-white tracking-widest bg-black/50 px-2 py-1 rounded">
             {corePrefix} {targetConfig.map(t => `${t.subshell}${t.targetCount}`).join(' ')}
          </span>
        </div>
      )}

      {/* Electron Pool */}
      <div className="mb-8 text-center bg-gray-800 p-4 rounded-lg shadow-inner shadow-black/50 border border-gray-700 relative overflow-hidden">
        {isSuccess && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center animate-pulse z-10">
            <div className="flex items-center gap-2 text-green-400 font-bold text-xl bg-gray-900 px-6 py-2 rounded-full border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]">
               <CheckCircle2 size={24} /> Configuration Complete!
            </div>
          </div>
        )}
        <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Available Electrons</h4>
        <div className="text-5xl font-extrabold text-cyan-400 mb-2 font-mono">
          {availableElectrons}
        </div>
        <p className="text-xs text-gray-500 mt-1 italic">Click '+' to allocate an electron to a subshell below.</p>
      </div>

      {/* Subshells */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="flex items-center justify-center flex-wrap gap-4 bg-black/40 p-6 rounded-xl border border-gray-800 w-full">
          
          {/* Core Prefix display */}
          {corePrefix && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/50 rounded-lg shadow-lg">
               <span className="text-purple-300 font-bold text-lg">{corePrefix}</span>
               <span className="text-xs text-purple-400/80 uppercase tracking-widest">(Core)</span>
            </div>
          )}

          {targetConfig.map((t, idx) => {
             const maxCapacity = MAX_ELECTRONS[t.type] || 2;
             const isFull = currentAllocation[t.subshell] === maxCapacity;
             const isCorrect = currentAllocation[t.subshell] === t.targetCount;
             
             return (
               <div key={idx} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-colors duration-300 shadow-xl ${
                 isSuccess 
                  ? 'border-green-500 bg-green-900/20 shadow-green-900/40' 
                  : isCorrect 
                    ? 'border-cyan-700 bg-cyan-900/10' 
                    : 'border-gray-700 bg-gray-800'
               }`}>
                  <div className="text-2xl font-bold font-mono min-w-16 text-center text-white">
                     {t.subshell}<sup className="text-cyan-400 ml-0.5">{currentAllocation[t.subshell]}</sup>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-full border border-gray-700">
                    <button 
                      onClick={() => handleRemoveElectron(t.subshell)}
                      disabled={currentAllocation[t.subshell] === 0 || isSuccess}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 active:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <span className="text-white font-bold text-lg leading-none">-</span>
                    </button>
                    <div className="w-10 text-center font-mono text-gray-300 text-sm">
                      {currentAllocation[t.subshell]}/{maxCapacity}
                    </div>
                    <button 
                      onClick={() => handleAddElectron(t.subshell, maxCapacity)}
                      disabled={availableElectrons === 0 || isFull || isSuccess}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <span className="text-white font-bold text-lg leading-none">+</span>
                    </button>
                  </div>
               </div>
             )
          })}
        </div>
      </div>
      
    </div>
  );
};

export default ElectronConfigBuilder;
