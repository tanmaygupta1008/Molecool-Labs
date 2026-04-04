import React from 'react';
import Atom3DModel from './Atom3DModel';

const getWinningColorClass = (val1, val2, higherIsBetter = true) => {
  if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) return 'text-gray-300';
  if (val1 === val2) return 'text-yellow-400';
  
  const isWinning = higherIsBetter ? val1 > val2 : val1 < val2;
  return isWinning ? 'text-green-400 font-bold' : 'text-red-400';
};

const ComparisonRow = ({ label, el1, el2, prop, higherIsBetter = true, unit = '' }) => {
  const val1 = el1[prop];
  const val2 = el2[prop];
  
  const color1 = getWinningColorClass(val1, val2, higherIsBetter);
  const color2 = getWinningColorClass(val2, val1, higherIsBetter);
  
  const displayVal = (v) => v !== undefined && v !== null ? `${typeof v === 'number' ? v.toFixed(2) : v} ${unit}` : 'N/A';

  return (
    <div className="grid grid-cols-3 py-3 border-b border-gray-700/50 items-center text-sm">
      <div className={`text-center ${color1}`}>{displayVal(val1)}</div>
      <div className="text-center font-semibold text-gray-400 tracking-wider text-xs uppercase">{label}</div>
      <div className={`text-center ${color2}`}>{displayVal(val2)}</div>
    </div>
  );
};

const ElementComparisonModal = ({ elements, onClose }) => {
  if (!elements || elements.length !== 2) return null;

  const [el1, el2] = elements;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 text-white p-6 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 border border-gray-700 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4 relative">
          <div className="absolute inset-x-0 text-center top-0 pointer-events-none">
            <span className="bg-gray-800 text-cyan-400 px-4 py-1 rounded-full text-sm font-bold tracking-widest border border-cyan-800/50">VS</span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-cyan-300 w-1/2 text-left">{el1.name} ({el1.symbol})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none absolute right-0 top-0 z-10">&times;</button>
          <h2 className="text-3xl font-extrabold text-purple-300 w-1/2 text-right pr-8">{el2.name} ({el2.symbol})</h2>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {/* Models */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="h-64 bg-black rounded-xl border border-gray-800 shadow-inner relative overflow-hidden">
               <div className="absolute top-2 left-2 z-10 text-xs font-mono text-cyan-500/50">{el1.electron_configuration}</div>
               <Atom3DModel glbUrl={el1.bohr_model_3d} />
            </div>
            <div className="h-64 bg-black rounded-xl border border-gray-800 shadow-inner relative overflow-hidden">
               <div className="absolute top-2 right-2 z-10 text-xs font-mono text-purple-500/50">{el2.electron_configuration}</div>
               <Atom3DModel glbUrl={el2.bohr_model_3d} />
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
             <ComparisonRow label="Atomic Number" el1={el1} el2={el2} prop="atomic_number" higherIsBetter={false} />
             <ComparisonRow label="Atomic Mass" el1={el1} el2={el2} prop="atomic_mass" unit="u" />
             
             <div className="grid grid-cols-3 py-3 border-b border-gray-700/50 items-center text-sm">
               <div className="text-center text-gray-300 capitalize">{el1.category}</div>
               <div className="text-center font-semibold text-gray-400 tracking-wider text-xs uppercase">Category</div>
               <div className="text-center text-gray-300 capitalize">{el2.category}</div>
             </div>

             <div className="grid grid-cols-3 py-3 border-b border-gray-700/50 items-center text-sm">
               <div className="text-center text-gray-300 capitalize">{el1.phase}</div>
               <div className="text-center font-semibold text-gray-400 tracking-wider text-xs uppercase">Phase</div>
               <div className="text-center text-gray-300 capitalize">{el2.phase}</div>
             </div>

             <ComparisonRow label="Densiy" el1={el1} el2={el2} prop="density" unit="g/cm³" />
             <ComparisonRow label="Melting Point" el1={el1} el2={el2} prop="melt" unit="K" />
             <ComparisonRow label="Boiling Point" el1={el1} el2={el2} prop="boil" unit="K" />
             <ComparisonRow label="Electronegativity" el1={el1} el2={el2} prop="electronegativity_pauling" />
             <ComparisonRow label="Atomic Radius" el1={el1} el2={el2} prop="atomic_radius" unit="pm" />
             <ComparisonRow label="Ionization Energy" el1={el1} el2={el2} prop="ionization_energy" unit="kJ/mol" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementComparisonModal;
