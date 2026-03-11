'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import DNAModel from '../../components/DNAModel';
import GeneticsRecombinationScene from '../../components/GeneticsRecombinationScene';

export default function DNAPage() {
  const [speed, setSpeed] = useState(0.4);
  const [twist, setTwist] = useState(8);
  const [numPairs, setNumPairs] = useState(40);
  const [heightMultiplier, setHeightMultiplier] = useState(1.2);

  // States for Advanced Features
  const [mode, setMode] = useState('random'); // 'random' or 'custom'
  const [sequence, setSequence] = useState('');
  const [customInput, setCustomInput] = useState('ATGCGATACTAGCTAGCTAG');
  const [searchMotif, setSearchMotif] = useState('');

  const [parentA, setParentA] = useState('ATGCATGCATGCATGCATGC');
  const [parentB, setParentB] = useState('CGTACGTACGTACGTACGTA');
  const [parentOrigins, setParentOrigins] = useState([]); // array of 'A' or 'B'
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Generate random sequence
  const generateRandomSequence = (length) => {
    const bases = ['A', 'T', 'G', 'C'];
    let seq = '';
    for (let i = 0; i < length; i++) {
        seq += bases[Math.floor(Math.random() * 4)];
    }
    return seq;
  };

  useEffect(() => {
    if (mode === 'random') {
      setSequence(generateRandomSequence(numPairs));
      setParentOrigins([]);
    } else if (mode === 'custom') {
      setParentOrigins([]);
    }
  }, [numPairs, mode]);

  const handleApplyCustom = () => {
    const validSeq = customInput.toUpperCase().replace(/[^ATGC]/g, '');
    setCustomInput(validSeq);
    setSequence(validSeq);
    setParentOrigins([]);
    if(validSeq.length > 0) {
        setNumPairs(validSeq.length);
    }
  };

  const handleSynthesizeChild = () => {
    // Determine max length
    const len = Math.max(parentA.length, parentB.length);
    if (len === 0) return;

    // Pad sequences to be equal length if needed securely
    const pA = parentA.padEnd(len, 'A');
    const pB = parentB.padEnd(len, 'A');

    // Generate 1 to 3 crossover points
    const numCrossovers = Math.floor(Math.random() * 3) + 1;
    const crossoverPoints = [];
    for (let i=0; i < numCrossovers; i++) {
       crossoverPoints.push(Math.floor(Math.random() * len));
    }
    crossoverPoints.sort((a,b) => a - b);

    let currentParent = Math.random() > 0.5 ? 'A' : 'B';
    let childSeq = '';
    const origins = [];

    let currentCrossoverIdx = 0;
    for (let i = 0; i < len; i++) {
        // Toggle parent at crossover point
        if (currentCrossoverIdx < crossoverPoints.length && i === crossoverPoints[currentCrossoverIdx]) {
            currentParent = currentParent === 'A' ? 'B' : 'A';
            currentCrossoverIdx++;
        }
        origins.push(currentParent);
        childSeq += currentParent === 'A' ? pA[i] : pB[i];
    }

    setSequence(childSeq);
    setNumPairs(childSeq.length);
    setParentOrigins(origins);
    setAnimationTrigger(prev => prev + 1);
  };

  const handleMutate = (index) => {
    if(!sequence || index < 0 || index >= sequence.length) return;
    
    const bases = ['A', 'T', 'G', 'C'];
    const currentBase = sequence[index].toUpperCase();
    const nextBaseIndex = (bases.indexOf(currentBase) + 1) % 4;
    const nextBase = bases[nextBaseIndex];
    
    const newSequence = sequence.substring(0, index) + nextBase + sequence.substring(index + 1);
    setSequence(newSequence);
    
    if (mode === 'custom') {
        setCustomInput(newSequence);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-black overflow-hidden relative font-sans text-gray-200">
      
      {/* FULL SCREEN 3D CANVAS */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <Canvas camera={{ position: [0, 0, 30], fov: 40 }} style={{ height: '100%', width: '100%' }}>
          <color attach="background" args={['#02040a']} />
          
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={1.5} color="#4bdfff" />
          <spotLight position={[0, -20, 10]} angle={0.5} penumbra={1} intensity={2} color="#00ffff" />

          <Stars radius={100} depth={50} count={3000} factor={3} saturation={1} fade speed={0.5} />
          
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
              {sequence && mode !== 'genetics' && (
                <group scale={Math.min(1, 45 / Math.max(1, sequence.length))}>
                  <DNAModel 
                    sequence={sequence} 
                    speed={speed} 
                    twist={Math.PI * twist} 
                    heightMultiplier={heightMultiplier} 
                    searchMotif={searchMotif}
                    parentOrigins={parentOrigins}
                    onMutate={handleMutate}
                  />
                </group>
              )}
              {sequence && mode === 'genetics' && (
                 <group scale={Math.min(0.6, 30 / Math.max(1, sequence.length))}>
                    <GeneticsRecombinationScene 
                        parentA={parentA}
                        parentB={parentB}
                        childSequence={sequence}
                        parentOrigins={parentOrigins}
                        animationTrigger={animationTrigger}
                    />
                 </group>
              )}
            </Float>
            
            {/* High-End Post Processing */}
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

          </Suspense>

          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            minDistance={10}
            maxDistance={60}
            autoRotate={false}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* FOREGROUND UI OVERLAYS (Glassmorphism Dashboard) */}

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 pointer-events-none flex flex-col items-center gap-4">
        <div className="flex justify-between w-full items-center pointer-events-auto px-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">DNA</span> VISUALIZER PRO
              </h1>
              <p className="text-sm text-cyan-500/80 font-mono tracking-widest uppercase mt-1">High-Fidelity R&D Engine</p>
            </div>
        </div>
      </div>

      {/* Floating Data Ticker (Top Right) */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto max-w-[40%] w-auto">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl overflow-x-auto custom-scrollbar flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
            <code className="text-white/90 font-mono text-sm tracking-[0.2em] whitespace-nowrap">
                {sequence ? (
                    parentOrigins.length > 0 ? (
                        sequence.split('').map((char, i) => (
                            <span key={i} className={parentOrigins[i] === 'A' ? 'text-cyan-400 text-shadow-cyan' : 'text-fuchsia-400 text-shadow-fuchsia'}>{char}</span>
                        ))
                    ) : sequence
                ) : "INITIALIZING_SEQUENCE..."}
            </code>
        </div>
      </div>

      {/* Left Control Panel */}
      <div className="absolute left-6 top-32 z-20 w-80 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-6 max-h-[calc(100vh-9rem)] overflow-y-auto hidden-scrollbar pointer-events-auto transition-transform hover:bg-black/50">
        
        {/* Module Title */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-cyan-500 tracking-[0.2em] uppercase">Control Matrix</span>
            <span className="text-xs text-white/40 font-mono">v2.0</span>
        </div>

        {/* Input Mode */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
            <button 
                onClick={() => setMode('random')}
                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${mode === 'random' ? 'bg-cyan-500/20 text-cyan-300 shadow-inner' : 'text-white/40 hover:text-white/70'}`}
            >
                Random
            </button>
            <button 
                onClick={() => setMode('custom')}
                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${mode === 'custom' ? 'bg-cyan-500/20 text-cyan-300 shadow-inner' : 'text-white/40 hover:text-white/70'}`}
            >
                Custom
            </button>
            <button 
                onClick={() => setMode('genetics')}
                className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${mode === 'genetics' ? 'bg-cyan-500/20 text-cyan-300 shadow-inner' : 'text-white/40 hover:text-white/70'}`}
            >
                Genetics
            </button>
        </div>

        {/* Dynamic Inputs */}
        {mode === 'random' ? (
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                     <span>CHAIN LENGTH</span>
                     <span className="text-cyan-400">{numPairs} bp</span>
                  </div>
                  <input 
                      type="range" min="10" max="150" step="5" value={numPairs} 
                      onChange={(e) => setNumPairs(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                  />
               </div>
            </div>
        ) : mode === 'custom' ? (
            <div className="space-y-3">
               <div className="text-xs font-mono text-white/60">FASTA SEQUENCE</div>
               <textarea 
                   value={customInput}
                   onChange={(e) => setCustomInput(e.target.value)}
                   spellCheck="false"
                   className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50 min-h-[80px] resize-none leading-relaxed tracking-wider"
               />
               <button 
                   onClick={handleApplyCustom}
                   className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 tracking-widest uppercase"
               >
                   Inject Sequence
               </button>
            </div>
        ) : (
            <div className="space-y-3">
               <div>
                 <div className="text-xs font-mono text-cyan-400 mb-1">PARENT A SEQUENCE</div>
                 <textarea 
                     value={parentA}
                     onChange={(e) => setParentA(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
                     spellCheck="false"
                     className="w-full bg-black/50 border border-cyan-500/30 rounded-xl p-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/80 min-h-[60px] resize-none leading-relaxed tracking-wider"
                 />
               </div>
               <div>
                 <div className="text-xs font-mono text-fuchsia-400 mb-1">PARENT B SEQUENCE</div>
                 <textarea 
                     value={parentB}
                     onChange={(e) => setParentB(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
                     spellCheck="false"
                     className="w-full bg-black/50 border border-fuchsia-500/30 rounded-xl p-2 text-xs text-fuchsia-300 font-mono focus:outline-none focus:border-fuchsia-500/80 min-h-[60px] resize-none leading-relaxed tracking-wider"
                 />
               </div>
               <button 
                   onClick={handleSynthesizeChild}
                   className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-700 hover:from-purple-500 hover:to-fuchsia-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-fuchsia-500/25 tracking-widest uppercase"
               >
                   Synthesize Child
               </button>
            </div>
        )}

        {/* Motif Targetting */}
        <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-xs font-mono text-white/60">
               <span>TARGET MOTIF</span>
               <div className={`h-1.5 w-1.5 rounded-full ${searchMotif ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-white/20'}`}></div>
            </div>
            <input 
                type="text" 
                value={searchMotif}
                onChange={(e) => setSearchMotif(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
                placeholder="e.g. TATA"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50 placeholder:text-white/20 tracking-widest uppercase"
            />
        </div>

        {/* Render Settings */}
        <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
               <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                  <span>RPM (ROTATION)</span>
                  <span className="text-cyan-400">{speed.toFixed(1)}</span>
               </div>
               <input 
                   type="range" min="0" max="2" step="0.1" value={speed} 
                   onChange={(e) => setSpeed(parseFloat(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
               />
            </div>
            <div>
               <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                  <span>HELIX DENSITY</span>
                  <span className="text-cyan-400">{twist}π</span>
               </div>
               <input 
                   type="range" min="0" max="20" step="1" value={twist} 
                   onChange={(e) => setTwist(parseInt(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
               />
            </div>
            <div>
               <div className="flex justify-between text-xs font-mono text-white/60 mb-2">
                  <span>BOND SPACING</span>
                  <span className="text-cyan-400">{heightMultiplier.toFixed(1)}x</span>
               </div>
               <input 
                   type="range" min="0.5" max="3" step="0.1" value={heightMultiplier} 
                   onChange={(e) => setHeightMultiplier(parseFloat(e.target.value))}
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
               />
            </div>
        </div>
      </div>

      {/* Right Legend Panel */}
      <div className="absolute right-6 bottom-10 z-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl pointer-events-auto flex flex-col gap-4">
        <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase border-b border-white/10 pb-2">Spectrometry Guide</span>
        <div className="flex flex-col gap-3 text-xs font-mono text-white/80">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#2ECC71] shadow-[0_0_10px_#2ECC71]"></div>
              <span>Adenine (A)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#E74C3C] shadow-[0_0_10px_#E74C3C]"></div>
              <span>Thymine (T)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#3498DB] shadow-[0_0_10px_#3498DB]"></div>
              <span>Cytosine (C)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#F39C12] shadow-[0_0_10px_#F39C12]"></div>
              <span>Guanine (G)</span>
            </div>
        </div>
        <div className="mt-2 text-[10px] text-cyan-400/80 leading-relaxed border-t border-white/10 pt-3">
            Interact with 3D model to execute point mutations.
        </div>
      </div>

      <style jsx global>{`
        .hidden-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hidden-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2); 
            border-radius: 4px;
        }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
        }
        
        .text-shadow-cyan { text-shadow: 0 0 8px rgba(34,211,238,0.8); }
        .text-shadow-fuchsia { text-shadow: 0 0 8px rgba(232,121,249,0.8); }
      `}</style>
    </div>
  );
}
