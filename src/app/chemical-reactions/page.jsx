// // src/app/chemical-reactions/page.jsx
// 'use client';

// // ⬅️ FIX: Add useEffect to this import list
// import { useState, useRef, useEffect } from 'react';

// import ReactionViewer from '@/components/reactions/ReactionViewer';
// import ReactionControls from '@/components/reactions/ReactionControls';
// import EnergyProfile from '@/components/reactions/EnergyProfile';
// import { REACTIONS } from '@/lib/reactionsData';

// const ChemicalReactionsPage = () => {
//   const [currentReaction, setCurrentReaction] = useState(REACTIONS.methane_combustion);
//   const [viewMode, setViewMode] = useState('MICRO'); // MACRO, MICRO, NANO
//   const [progress, setProgress] = useState(0); // 0.0 to 1.0 (Reaction Coordinate)
//   const [isPlaying, setIsPlaying] = useState(false);

//   // Animation Loop simulation
//   const requestRef = useRef();
  
//   const animate = () => {
//     setProgress(prev => {
//       if (prev >= 1) {
//         setIsPlaying(false);
//         return 1;
//       }
//       return prev + 0.005; // Speed
//     });
//     requestRef.current = requestAnimationFrame(animate);
//   };

//   // Inside ChemicalReactionsPage component

//   // Use a Ref to track "Playing" status instantly without re-renders
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
//           return prev + 0.002; // Slower, smoother speed
//         });
//       }
//       animationFrameId = requestAnimationFrame(loop);
//     };
    
//     loop();
//     return () => cancelAnimationFrame(animationFrameId);
//   }, []); // Run once

//   const togglePlay = () => {
//     const newState = !isPlaying;
//     setIsPlaying(newState);
//     playingRef.current = newState; // Sync ref immediately
    
//     // Auto-reset if at end
//     if (newState && progress >= 1) {
//         setProgress(0);
//     }
//   };

//   const handleSliderChange = (e) => {
//      const val = parseFloat(e.target.value);
//      setProgress(val);
//      // Pause if user drags slider
//      setIsPlaying(false);
//      playingRef.current = false;
//   };

//   // Pass handleSliderChange to ReactionControls

//   return (
//     <div className="h-screen w-full bg-black text-white grid grid-cols-4">
//       {/* Left Panel */}
//       <div className="col-span-1 bg-gray-900 p-6 border-r border-gray-800 flex flex-col gap-6">
//         <h1 className="text-2xl font-bold text-cyan-400">Reaction Lab</h1>
        
//         {/* REACTION SELECTOR */}
//         <div>
//             <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Select Reaction</label>
//             <select 
//                 className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-cyan-500"
//                 onChange={(e) => handleReactionChange(e.target.value)}
//                 value={Object.keys(REACTIONS).find(key => REACTIONS[key].id === currentReaction.id)}
//             >
//                 <option value="methane_combustion">Methane Combustion</option>
//                 <option value="haber_process">Haber Process (Ammonia)</option>
//                 <option value="contact_process">Contact Process (Sulfuric Acid)</option>
//                 <option value="solvay_process">Solvay Process (Soda Ash)</option>
//             </select>
//         </div>

//         <div>
//           <h2 className="text-xl font-bold">{currentReaction.name}</h2>
//           <p className="text-gray-400 font-mono mt-1 text-sm">{currentReaction.equation}</p>
//           <p className="text-sm text-gray-500 mt-2">{currentReaction.description}</p>
//         </div>

//         {/* Mode Switcher */}
//         <div className="flex flex-col gap-2">
//             <label className="text-xs font-bold text-gray-500 uppercase">View Mode</label>
//             <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
//                 {['MACRO', 'MICRO', 'NANO'].map(mode => (
//                     <button 
//                         key={mode}
//                         onClick={() => setViewMode(mode)}
//                         className={`flex-1 py-2 text-xs font-bold rounded transition ${viewMode === mode ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
//                     >
//                         {mode}
//                     </button>
//                 ))}
//             </div>
//         </div>

//         {/* Energy Profile Overlay */}
//         <div className="mt-auto">
//             <EnergyProfile progress={progress} activationEnergy={currentReaction.activationEnergy} />
//         </div>
//       </div>

//       {/* Main 3D View */}
//       <div className="col-span-3 relative">
//         <ReactionViewer 
//             reaction={currentReaction} 
//             viewMode={viewMode} 
//             progress={progress} 
//         />

//         {/* Floating Controls */}
//         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2/3 max-w-lg">
//             <ReactionControls 
//                 progress={progress} 
//                 setProgress={setProgress} 
//                 isPlaying={isPlaying} 
//                 togglePlay={togglePlay} 
//             />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChemicalReactionsPage;





// src/app/chemical-reactions/page.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FlaskConical, Atom, Info, ChevronDown } from 'lucide-react'; // Ensure lucide-react is installed
import ReactionViewer from '@/components/reactions/ReactionViewer';
import ReactionControls from '@/components/reactions/ReactionControls';
import EnergyProfile from '@/components/reactions/EnergyProfile';
import { REACTIONS } from '@/lib/reactionsData';

const ChemicalReactionsPage = () => {
  const [currentReaction, setCurrentReaction] = useState(REACTIONS.methane_combustion);
  const [viewMode, setViewMode] = useState('MICRO');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Animation Loop
  const playingRef = useRef(false);
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
          return prev + 0.002; 
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    playingRef.current = newState;
    if (newState && progress >= 1) setProgress(0);
  };

  const handleReactionChange = (key) => {
    setCurrentReaction(REACTIONS[key]);
    setProgress(0);
    setIsPlaying(false);
    playingRef.current = false;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      
      {/* BACKGROUND: 3D SCENE */}
      <div className="absolute inset-0 z-0">
         <ReactionViewer 
            reaction={currentReaction} 
            viewMode={viewMode} 
            progress={progress} 
        />
      </div>

      {/* OVERLAY: Top Left Info Panel (Glass Card) */}
      <div className={`absolute top-20 left-6 z-10 w-80 transition-all duration-500 ${showInfo ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <FlaskConical size={20} />
            <span className="text-xs font-bold tracking-widest uppercase">Experiment Protocol</span>
          </div>
          
          {/* Reaction Selector (Styled) */}
          <div className="relative mb-4 group">
            <select 
                className="w-full bg-black/50 border border-white/10 text-white p-3 rounded-lg appearance-none cursor-pointer hover:border-cyan-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                onChange={(e) => handleReactionChange(e.target.value)}
                value={Object.keys(REACTIONS).find(key => REACTIONS[key].id === currentReaction.id)}
            >
                <option value="methane_combustion">Methane Combustion</option>
                <option value="haber_process">Haber Process</option>
                <option value="contact_process">Contact Process</option>
                <option value="solvay_process">Solvay Process</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none group-hover:text-cyan-400 transition-colors" size={16} />
          </div>

          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {currentReaction.name}
          </h1>
          <div className="mt-2 bg-white/5 p-2 rounded border border-white/5 font-mono text-sm text-cyan-200 break-words">
            {currentReaction.equation}
          </div>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            {currentReaction.description}
          </p>

           {/* Energy Profile Widget */}
           <div className="mt-6 pt-6 border-t border-white/10">
              <EnergyProfile progress={progress} activationEnergy={currentReaction.activationEnergy} />
           </div>
        </div>
      </div>

      {/* OVERLAY: Top Right Mode Switcher (Floating Segmented Control) */}
      <div className="absolute top-20 right-6 z-10">
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-lg">
            {['MACRO', 'MICRO', 'NANO'].map(mode => (
                <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                        viewMode === mode 
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {mode} VIEW
                </button>
            ))}
        </div>
      </div>

      {/* OVERLAY: Bottom Center Controls (The "Deck") */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4">
         <ReactionControls 
            progress={progress} 
            setProgress={(val) => { setProgress(val); setIsPlaying(false); playingRef.current = false; }} 
            isPlaying={isPlaying} 
            togglePlay={togglePlay} 
         />
      </div>

    </div>
  );
};

export default ChemicalReactionsPage;