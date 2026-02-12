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
//           <div className="flex items-center gap-2 mb-4 text-cyan-400">
//             <FlaskConical size={20} />
//             <span className="text-xs font-bold tracking-widest uppercase">Experiment Protocol</span>
//           </div>

//           {/* Reaction Selector (Styled) */}
//           <div className="relative mb-4 group">
//             <select 
//                 className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-lg appearance-none cursor-pointer hover:border-cyan-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
//                 onChange={(e) => handleReactionChange(e.target.value)}
//                 value={Object.keys(REACTIONS).find(key => REACTIONS[key].id === currentReaction.id)}
//             >
//                 <option value="methane_combustion">Methane Combustion</option>
//                 <option value="haber_process">Haber Process</option>
//                 <option value="contact_process">Contact Process</option>
//                 <option value="solvay_process">Solvay Process</option>
//             </select>
//             <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none group-hover:text-cyan-400 transition-colors" size={16} />
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
//                         ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
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

import { useState, useRef, useEffect } from 'react';
import ReactionViewer from '@/components/reactions/ReactionViewer';
import ReactionControls from '@/components/reactions/ReactionControls';
import EnergyProfile from '@/components/reactions/EnergyProfile';
import ReactionLibrary from '@/components/reactions/ReactionLibrary';
import ReactorConditions from '@/components/reactions/ReactorConditions';

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

  // Animation Loop
  useEffect(() => {
    let animationFrameId;
    const loop = () => {
      if (playingRef.current) {
        setProgress(prev => {
          if (prev >= 1) {
            playingRef.current = false;
            setIsPlaying(false);
            return 1;
          }

          if (!currentReaction) return prev;

          // Physics Calculation (Arrhenius-like effect)
          const optimalTemp = currentReaction.optimalTemp || 300; // Use JSON val or default
          const tempRatio = Math.max(0.1, envConditions.temp / optimalTemp);
          const physicsMultiplier = Math.min(1.5, tempRatio);

          // SPEED CALCULATION:
          const step = 0.002 * physicsMultiplier * simulationSpeed;

          return prev + step;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [envConditions.temp, currentReaction, simulationSpeed]);

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
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden font-sans text-white">

      {/* BACKGROUND: 3D SCENE */}
      <div className="absolute inset-0 z-0">
        <ReactionViewer
          reaction={currentReaction}
          viewMode={viewMode}
          progress={viewMode === 'MACRO' ? 0 : progress}
          environment={envConditions}
        />
      </div>

      {/* LEFT PANEL: Reaction Library */}
      {/* ⬅️ FIX: Changed 'top-6' to 'top-24' to clear Navbar */}
      <div className="absolute top-24 left-6 bottom-28 w-80 z-20 flex flex-col pointer-events-none">
        <div className="h-full pointer-events-auto shadow-2xl rounded-2xl overflow-hidden">
          <ReactionLibrary
            reactions={reactionsList}
            currentReaction={currentReaction}
            onSelect={handleReactionChange}
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR: Mode Switcher + Controls */}
      {/* ⬅️ FIX: Changed 'top-6' to 'top-24' to clear Navbar */}
      <div className="absolute top-24 right-6 bottom-28 w-72 z-20 flex flex-col gap-3 pointer-events-none">

        {/* Mode Switcher */}
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-lg pointer-events-auto self-end shrink-0">
          {['MACRO', 'MICRO', 'NANO'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${viewMode === mode
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {mode} VIEW
            </button>
          ))}
        </div>

        {/* Controls Area */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar pointer-events-auto pb-2">
          <ReactorConditions
            conditions={envConditions}
            setConditions={setEnvConditions}
            optimalConditions={{
              temp: currentReaction.optimalTemp,
              pressure: currentReaction.optimalPressure,
              desc: currentReaction.conditionsDesc
            }}
          />
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl shrink-0">
            <EnergyProfile progress={progress} activationEnergy={currentReaction.activationEnergy} />
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Playback Control Deck */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <ReactionControls
            progress={progress}
            setProgress={(val) => { setProgress(val); setIsPlaying(false); playingRef.current = false; }}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            speed={simulationSpeed}
            setSpeed={setSimulationSpeed}
          />
        </div>
      </div>
    </div>
  );
};

export default ChemicalReactionsPage;