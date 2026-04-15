// // src/app/chemical-reactions/page.jsx
// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { FlaskConical, Atom, Info, ChevronDown } from 'lucide-react'; // Ensure lucide-react is installed
// import ReactionViewer from '@/components/reactions/ReactionViewer';
// import ReactionControls from '@/components/reactions/ReactionControls';
// import EnergyProfile from '@/components/reactions/EnergyProfile';
// import { REACTIONS } from '@/lib/reactionsData';

// const ChemicalReactionsPage = () => {
//   const [currentReaction, setCurrentReaction] = useState(REACTIONS.methane_combustion);
//   const [viewMode, setViewMode] = useState('MICRO');
//   const [progress, setProgress] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [showInfo, setShowInfo] = useState(true);

//   // Animation Loop
//   const playingRef = useRef(false);
//   useEffect(() => {
//     let animationFrameId;
//     const loop = () => {
//       if (playingRef.current) {
//         setProgress(prev => {
//           if (prev >= 1) {
//             playingRef.current = false;
//             setIsPlaying(false);
//             return 1;
//           }
//           return prev + 0.002; 
//         });
//       }
//       animationFrameId = requestAnimationFrame(loop);
//     };
//     loop();
//     return () => cancelAnimationFrame(animationFrameId);
//   }, []);

//   const togglePlay = () => {
//     const newState = !isPlaying;
//     setIsPlaying(newState);
//     playingRef.current = newState;
//     if (newState && progress >= 1) setProgress(0);
//   };

//   const handleReactionChange = (key) => {
//     setCurrentReaction(REACTIONS[key]);
//     setProgress(0);
//     setIsPlaying(false);
//     playingRef.current = false;
//   };

//   return (
//     <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">

//       {/* BACKGROUND: 3D SCENE */}
//       <div className="absolute inset-0 z-0">
//          <ReactionViewer 
//             reaction={currentReaction} 
//             viewMode={viewMode} 
//             progress={progress} 
//         />
//       </div>

//       {/* OVERLAY: Top Left Info Panel (Glass Card) */}
//       <div className={`absolute top-20 left-6 z-10 w-80 transition-all duration-500 ${showInfo ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
//         <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl">
//           <div className="flex items-center gap-2 mb-4 text-blue-400">
//             <FlaskConical size={20} />
//                 <option value="contact_process">Contact Process</option>
//                 <option value="solvay_process">Solvay Process</option>
//             </select>
//             <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none group-hover:text-blue-400 transition-colors" size={16} />
//           </div>

//           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
//             {currentReaction.name}
//           </h1>
//           <div className="mt-2 bg-white/5 p-2 rounded border border-white/5 font-mono text-sm text-cyan-200 break-words">
//             {currentReaction.equation}
//           </div>
//           <p className="text-sm text-gray-400 mt-3 leading-relaxed">
//             {currentReaction.description}
//           </p>

//            {/* Energy Profile Widget */}
//            <div className="mt-6 pt-6 border-t border-white/10">
//               <EnergyProfile progress={progress} activationEnergy={currentReaction.activationEnergy} />
//            </div>
//         </div>
//       </div>

//       {/* OVERLAY: Top Right Mode Switcher (Floating Segmented Control) */}
//       <div className="absolute top-20 right-6 z-10">
//         <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-lg">
//             {['MACRO', 'MICRO', 'NANO'].map(mode => (
//                 <button 
//                     key={mode}
//                     onClick={() => setViewMode(mode)}
//                     className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
//                         viewMode === mode 
//                         ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
//                         : 'text-gray-400 hover:text-white hover:bg-white/5'
//                     }`}
//                 >
//                     {mode} VIEW
//                 </button>
//             ))}
//         </div>
//       </div>

//       {/* OVERLAY: Bottom Center Controls (The "Deck") */}
//       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">
//          <ReactionControls 
//             progress={progress} 
//             setProgress={(val) => { setProgress(val); setIsPlaying(false); playingRef.current = false; }} 
//             isPlaying={isPlaying} 
//             togglePlay={togglePlay} 
//          />
//       </div>

//     </div>
//   );
// };

// export default ChemicalReactionsPage;












// src/app/chemical-reactions/page.jsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import ReactionViewer from '@/components/reactions/ReactionViewer';
import ReactionControls from '@/components/reactions/ReactionControls';
import EnergyProfile from '@/components/reactions/EnergyProfile';
import ReactionLibrary from '@/components/reactions/ReactionLibrary';
import ReactorConditions from '@/components/reactions/ReactorConditions';
import ReactionChatbot from '@/components/reactions/ReactionChatbot';
import { MessageSquareText } from 'lucide-react';

// Import JSON Configuration
// import REACTIONS_LIST from '@/data/reactions.json'; // REMOVED to avoid HMR

const ChemicalReactionsPage = () => {
  // Initialize with the first reaction in the JSON list
  const [reactionsList, setReactionsList] = useState([]);
  const [currentReaction, setCurrentReaction] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetch('/api/reactions', { cache: 'no-store', next: { revalidate: 0 } })
      .then(res => res.json())
      .then(data => {
        // Recover autosaved state from local storage first to prevent losing work and stay synced with editors
        const autosaved = localStorage.getItem('molecool_reactions_autosave');
        if (autosaved) {
            try {
                const parsed = JSON.parse(autosaved);
                if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                    setReactionsList(parsed);
                    setCurrentReaction(parsed[0]);
                    return;
                }
            } catch (e) {
                console.error("Autosave parse error in Chemical Reactions:", e);
            }
        }
        
        setReactionsList(data);
        if (data.length > 0) setCurrentReaction(data[0]);
      })
      .catch(err => console.error("Failed to load reactions", err));
  }, []);
  const [viewMode, setViewMode] = useState('MACRO');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Speed State (Default 1x)
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  const [envConditions, setEnvConditions] = useState({
    temp: 25,
    pressure: 1
  });

  // Reset conditions when reaction changes
  useEffect(() => {
    setEnvConditions({ temp: 25, pressure: 1 });
  }, [currentReaction]);

  const playingRef = useRef(false);

  // Extract explicit Macro Duration dynamically exactly like reaction-refiner
  const macroDuration = useMemo(() => {
    let maxStepDuration = 0;
    if (currentReaction?.macroView?.visualRules?.timeline) {
      maxStepDuration = Object.values(currentReaction.macroView.visualRules.timeline).reduce((acc, step) => {
        if (step.disabled) return acc;
        return acc + (parseFloat(step.duration) || 0) + (parseFloat(step.delay) || 0);
      }, 0);
    }
    let maxReactantDuration = 0;
    if (currentReaction?.macroView?.visualRules?.reactantTimeline) {
      maxReactantDuration = currentReaction.macroView.visualRules.reactantTimeline.reduce((acc, block) => {
        const end = (parseFloat(block.startTime) || 0) + (parseFloat(block.duration) || 0);
        return Math.max(acc, end);
      }, 0);
    }
    let maxExplanationDuration = 0;
    if (currentReaction?.macroView?.visualRules?.explanationTimeline) {
      maxExplanationDuration = currentReaction.macroView.visualRules.explanationTimeline.reduce((acc, block) => {
        const end = (parseFloat(block.startTime) || 0) + (parseFloat(block.duration) || 0);
        return Math.max(acc, end);
      }, 0);
    }
    return Math.max(maxStepDuration, maxReactantDuration, maxExplanationDuration) || 10;
  }, [currentReaction]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (playingRef.current) {
        setProgress(prev => {
          if (prev >= 1) {
            playingRef.current = false;
            setIsPlaying(false);
            return 1;
          }

          if (!currentReaction) return prev;

          // Extract real duration dynamically from the active view mode
          let duration = 10;
          if (viewMode === 'MICRO' && currentReaction.microView?.script?.tracks?.length > 0) {
            let maxEnd = 0;
            currentReaction.microView.script.tracks.forEach(track => {
              const end = (parseFloat(track.startTime) || 0) + (parseFloat(track.duration) || 0);
              if (end > maxEnd) maxEnd = end;
            });
            duration = Math.max(2, maxEnd);
          } else {
            duration = macroDuration;
          }

          // Physics Calculation (Arrhenius-like effect)
          const optimalTemp = currentReaction.optimalTemp || 300; // Use JSON val or default
          const tempRatio = Math.max(0.1, envConditions.temp / optimalTemp);
          const physicsMultiplier = Math.min(1.5, tempRatio);

          // Micro view is naturally slow when mapped 1:1, so we add a presentation speed multiplier
          const microSpeedBoost = viewMode === 'MICRO' ? 2.0 : 1.0;

          // SPEED CALCULATION:
          // Progress increment based on exact time elapsed (dt), scaling by duration and physics speed
          const increment = (dt * physicsMultiplier * simulationSpeed * microSpeedBoost) / duration;

          return prev + increment;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [envConditions.temp, currentReaction, simulationSpeed, viewMode]);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    playingRef.current = newState;
    if (newState && progress >= 1) setProgress(0);
  };

  const handleReactionChange = (id) => {
    // Find reaction by ID from the fetched list
    const selectedReaction = reactionsList.find(r => r.id === id);
    if (selectedReaction) {
      setCurrentReaction(selectedReaction);
      setProgress(0);
      setIsPlaying(false);
      playingRef.current = false;
    }
  };

  if (!currentReaction) return <div className="text-white text-center mt-20">Loading Reactions...</div>;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden font-sans text-white z-[30]">

      {/* BACKGROUND: 3D SCENE */}
      <div className="absolute inset-0 z-0">
        <ReactionViewer
          reaction={currentReaction}
          viewMode={viewMode}
          progress={progress}
          isPlaying={isPlaying}
          environment={envConditions}
        />
      </div>

      {/* Animated Background Mesh */}
      <div className="bg-mesh-container pointer-events-none opacity-40">
        <div className="bg-mesh-blob blob-1 will-change-transform" />
        <div className="bg-mesh-blob blob-2 will-change-transform" />
        <div className="bg-mesh-blob blob-3 will-change-transform" />
      </div>

      {/* Explanation Overlay Logic */}
      {viewMode === 'MACRO' && currentReaction?.macroView?.visualRules?.explanationTimeline && (() => {
          const activeExplanation = currentReaction.macroView.visualRules.explanationTimeline.find(block => {
              const currentTime = progress * macroDuration;
              return currentTime >= block.startTime && currentTime <= (block.startTime + block.duration);
          });
          
          if (activeExplanation) {
              return (
                  <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-4/5 max-w-xl pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300 z-40">
                      <div className="bg-mesh-solid border border-white/10 rounded-none p-5 shadow-3xl flex items-start gap-4">
                          <div className="mt-1 bg-white/5 p-2 rounded-none border border-white/10 text-blue-400">
                              <MessageSquareText size={16} />
                          </div>
                          <div className="flex-1 pointer-events-auto">
                              <p className="text-sm font-black text-white leading-relaxed whitespace-pre-wrap uppercase tracking-wider">
                                  {activeExplanation.text || "..."}
                              </p>
                          </div>
                      </div>
                  </div>
              );
          }
          return null;
      })()}

      {/* LEFT SIDEBAR: Lab Navigation & Library */}
      <div className="fixed top-16 left-0 bottom-0 w-80 bg-mesh-solid border-r border-white/10 z-40 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-black/40">
            <h1 className="text-3xl font-black tracking-tighter text-white">
                REACTION <span className="text-white/40 font-light uppercase">LAB</span>
            </h1>
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-300 mt-4 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
                Laboratory Simulation [Online]
            </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ReactionLibrary
            reactions={reactionsList}
            currentReaction={currentReaction}
            onSelect={handleReactionChange}
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR: Environmental Controls & Telemetry */}
      <div className="fixed top-16 right-0 bottom-0 w-80 bg-mesh-solid border-l border-white/10 z-40 flex flex-col shadow-2xl">
        
        {/* Mode Switcher - Integrated at the top */}
        <div className="p-6 border-b border-white/5 flex gap-1.5 bg-black/40">
          {['MACRO', 'MICRO'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-4 rounded-none text-[11px] font-black transition-all duration-300 uppercase tracking-widest border ${viewMode === mode
                ? 'bg-white text-black border-white shadow-xl'
                : 'text-white/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
            >
              {mode} VIEW
            </button>
          ))}
        </div>

        {/* Telemetry & Conditions Scrollable Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="rounded-none">
            <ReactorConditions
              conditions={envConditions}
              setConditions={setEnvConditions}
              optimalConditions={{
                temp: currentReaction.optimalTemp,
                pressure: currentReaction.optimalPressure,
                desc: currentReaction.conditionsDesc
              }}
            />
          </div>
          <div className="pt-8 border-t border-white/5">
            <EnergyProfile progress={progress} activationEnergy={currentReaction.activationEnergy} />
          </div>
        </div>

        {/* Tactical Support Hook */}
        <div className="p-5 border-t border-white/10 bg-black/40">
            <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] text-center">AI Diagnostics Active</p>
        </div>
      </div>

      {/* BOTTOM CENTER: Playback Control Deck */}
      <div className="fixed bottom-10 left-80 right-80 z-40 flex justify-center px-8 pointer-events-none">
         <div className="w-full max-w-2xl pointer-events-auto bg-mesh-solid border border-white/10 p-4 shadow-3xl">
            <ReactionControls 
                progress={progress} 
                setProgress={(val) => { setProgress(val); setIsPlaying(false); playingRef.current = false; }} 
                isPlaying={isPlaying} 
                togglePlay={togglePlay} 
                simulationSpeed={simulationSpeed}
                setSimulationSpeed={setSimulationSpeed}
            />
         </div>
      </div>

      <ReactionChatbot currentReaction={currentReaction} />
    </div>

  );
};

export default ChemicalReactionsPage;