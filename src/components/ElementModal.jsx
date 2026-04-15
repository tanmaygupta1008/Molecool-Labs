import { useState } from 'react';
import Atom3DModel from './Atom3DModel';
import ElectronConfigBuilder from './ElectronConfigBuilder';

const ElementModal = ({ element, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!element) return null;
  
  // Destructure all relevant fields for display
  const { 
    name, 
    symbol, 
    number, 
    atomic_mass, 
    category, 
    summary, 
    melt, 
    boil, 
    phase, 
    discovered_by, 
    bohr_model_3d,
    electron_configuration, 
    shells, 
  } = element;

  // Function to format the shell electrons array (e.g., [2, 8, 18, 32] -> 2, 8, 18, 32)
  const formatShells = (shellsArray) => {
    if (!shellsArray || shellsArray.length === 0) return 'N/A';
    return shellsArray.join(', ');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

      <div 
        className="bg-[#0a0a0f] text-white p-8 sm:p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-4xl w-full mx-4 flex flex-col max-h-[90vh] relative z-10 border border-white/10"
        onClick={(e) => e.stopPropagation()} 
      >

        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-5xl font-black text-white tracking-tighter transition-all duration-700">{name} <span className="text-white/40 font-light text-base">({symbol})</span></h2>

            <div className="flex gap-4 mt-6">
               <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 tap-animation ${activeTab === 'overview' ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'bg-white/10 text-white/80 border border-white/20 hover:border-white/50'}`}
                >
                  Overview Analysis
                </button>
                <button 
                   onClick={() => setActiveTab('config')} 
                   className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 tap-animation ${activeTab === 'config' ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'bg-white/10 text-white/80 border border-white/20 hover:border-white/50'}`}
                >
                  Orbital Matrix
                </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white text-4xl leading-none transition-all duration-300 hover:rotate-90 tap-animation">&times;</button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full items-start">
               
               {/* 3D Model Area */}
               <div className="md:col-span-2 h-[450px] w-full bg-white/[0.02] rounded-[3.5rem] border border-white/5 overflow-hidden relative shadow-inner group transition-all duration-700 hover:border-white/20">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
                 <Atom3DModel glbUrl={bohr_model_3d} /> 
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.4em] text-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    Holographic Inspection Active
                 </div>
               </div>

               {/* Properties (Spans 1 column) */}
               <div className="md:col-span-1 border-l border-white/5 pl-8 space-y-6 animate-fadeIn bg-black/40 p-6 rounded-[2rem] backdrop-blur-sm shadow-inner">
                 <div className="pb-6 border-b border-white/5">
                     <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-4">Geometric Abstract</h4>
                     <p className="text-[14px] leading-relaxed text-white/80 font-medium">
                         {summary ? summary.substring(0, 200) + '...' : 'Matrix data unavailable for this node.'}
                     </p>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
                         <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Atomic No</span>
                         <span className="font-black text-white text-2xl tracking-tighter">{number || element.atomic_number}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Atomic Mass</span>
                          <span className="font-black text-white text-sm">{atomic_mass?.toFixed(4)} u</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Category</span>
                          <span className="font-black text-white capitalize text-[10px] tracking-tight">{category}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">State</span>
                          <span className="font-black text-white capitalize text-[10px]">{phase}</span>
                      </div>
                      <div className="flex flex-col gap-2 border-b border-white/5 pb-3.5">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Orbital Layers</span>
                          <span className="font-mono text-[10px] text-white/60 tracking-[0.2em] bg-black/60 px-4 py-2 rounded-xl border border-white/5">{formatShells(shells)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2.5">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Melting Pt</span>
                          <span className="font-black text-white text-[10px]">{melt ? `${melt.toFixed(2)} K` : '---'}</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <span className="text-[12px] font-black text-white uppercase tracking-widest opacity-60">Discovered By</span>
                          <span className="font-black text-white/90 uppercase text-[11px] tracking-tighter truncate max-w-[150px]">{discovered_by || 'Unknown'}</span>
                      </div>
                 </div>
               </div>
             </div>
          ) : (
             <ElectronConfigBuilder element={element} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ElementModal;