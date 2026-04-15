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
    <div className="h-full flex flex-col bg-[#0f0f15] border border-white/10 rounded-[2.5rem] p-6 relative shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-black text-white tracking-widest uppercase italic">Orbital Matrix</h3>
          <p className="text-[10px] text-white/60 mt-1 font-black uppercase tracking-[0.2em]">
            Align valence electrons for <span className="text-white underline decoration-white/30">{element.name}</span>
          </p>
        </div>


        <div className="flex gap-2">
          <button 
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 px-4 py-1.5 glass-pill border-white/20 text-white/50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black tap-animation"
          >
            <HelpCircle size={12} /> Matrix Hint
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-1.5 glass-pill border-white/20 text-white/50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white hover:text-black tap-animation"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>


      </div>



      {showHint && (
        <div className="mb-4 p-3 bg-white/10 border border-white/20 rounded-xl text-white font-black uppercase tracking-widest flex justify-between items-center animate-fadeIn backdrop-blur-xl">
          <span className="text-[9px] text-white/60">Target Logic:</span>
          <span className="font-mono text-white tracking-[0.3em] bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
             {corePrefix} {targetConfig.map(t => `${t.subshell}${t.targetCount}`).join(' ')}
          </span>
        </div>
      )}



      {/* Electron Pool */}
      <div className="mb-6 text-center bg-black/40 p-4 rounded-[2rem] shadow-inner border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        {isSuccess && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl flex items-center justify-center animate-shimmer z-10 font-black">
            <div className="flex items-center gap-2 text-black text-[10px] uppercase tracking-[0.3em] bg-white px-8 py-3 rounded-full shadow-2xl transition-all scale-105">
               <CheckCircle2 size={16} /> Matrix Authenticated
            </div>
          </div>
        )}
        <h4 className="text-white font-black text-[10px] mb-2 uppercase tracking-[0.2em] opacity-30">Valence Population Status</h4>
        <div className="text-6xl font-black text-white mb-1 tracking-tighter">
          {availableElectrons}
        </div>
        <p className="text-[9px] text-white mt-1 uppercase tracking-widest font-black opacity-20">Select Access Nodes to Allocate</p>


      </div>



      {/* Subshells */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6 pb-2">
        <div className="flex items-center justify-center flex-wrap gap-4 bg-white/[0.05] p-6 rounded-[2.5rem] border border-white/10 w-full shadow-inner overflow-y-auto custom-scrollbar">
          
          {/* Core Prefix display */}
          {corePrefix && (
            <div className="flex items-center gap-3 px-6 py-3 glass-card border-white/20 rounded-xl shadow-2xl opacity-80 border-dashed">
               <span className="text-white font-black text-lg tracking-widest">{corePrefix}</span>
               <span className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">Core Node</span>
            </div>
          )}

          {targetConfig.map((t, idx) => {
             const maxCapacity = MAX_ELECTRONS[t.type] || 2;
             const isFull = currentAllocation[t.subshell] === maxCapacity;
             const isFinished = availableElectrons === 0;
             const isCorrect = isFinished && currentAllocation[t.subshell] === t.targetCount;
             const isWrong = isFinished && currentAllocation[t.subshell] > 0 && !isCorrect;
             
             return (
               <div key={idx} className={`p-4 rounded-[2rem] border transition-all duration-700 flex flex-col items-center gap-4 shadow-xl relative overflow-hidden group/shell ${
                 isSuccess 
                  ? 'border-green-400 bg-green-400 text-black scale-105 z-20 shadow-[0_0_40px_rgba(74,222,128,0.4)]' 
                  : isCorrect 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : isWrong
                      ? 'border-red-500/50 bg-red-500/10 scale-95'
                      : 'border-white/10 glass-card'
               }`}>
                  <div className={`text-2xl font-black tracking-tighter min-w-16 text-center transition-colors duration-500 ${isSuccess ? 'text-black' : isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-white'}`}>
                     {t.subshell}<sup className={`text-xs ml-0.5 ${isSuccess ? 'text-black/60' : isCorrect ? 'text-green-400/60' : isWrong ? 'text-red-400/60' : 'text-white/60'}`}>{currentAllocation[t.subshell]}</sup>
                  </div>
                  
                  <div className={`flex items-center gap-2 p-1.5 rounded-full border transition-all duration-500 ${isSuccess ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <button 
                      onClick={() => handleRemoveElectron(t.subshell)}
                      disabled={currentAllocation[t.subshell] === 0 || isSuccess}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 tap-animation ${isSuccess ? 'bg-black/10 text-black' : 'bg-white/10 text-white hover:bg-white/20 shadow-lg'}`}
                    >
                      <span className="font-black text-lg leading-none">-</span>
                    </button>
                    <div className={`w-10 text-center font-black text-[9px] uppercase tracking-widest ${isSuccess ? 'text-black/60' : isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-white/80'}`}>
                      {currentAllocation[t.subshell]}
                    </div>
                    <button 
                      onClick={() => handleAddElectron(t.subshell, maxCapacity)}
                      disabled={availableElectrons === 0 || isFull || isSuccess}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 tap-animation ${isSuccess ? 'bg-black/10 text-black' : 'bg-white text-black shadow-xl'}`}
                    >
                      <span className="font-black text-lg leading-none">+</span>
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
