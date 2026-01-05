// // src/components/reactions/ReactionLibrary.jsx
// import { Search, FlaskConical, Atom } from 'lucide-react';
// import { useState } from 'react';

// const ReactionLibrary = ({ reactions, currentReaction, onSelect }) => {
//     const [searchTerm, setSearchTerm] = useState('');

//     const filteredReactions = Object.values(reactions).filter(r => 
//         r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         r.equation.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     return (
//         <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-r border-white/10 w-80">
//             {/* Header */}
//             <div className="p-6 border-b border-white/10">
//                 <div className="flex items-center gap-2 text-cyan-400 mb-1">
//                     <FlaskConical size={20} />
//                     <h2 className="text-sm font-bold tracking-widest uppercase">Reaction Library</h2>
//                 </div>
//                 <p className="text-xs text-gray-500">Select an experiment to begin.</p>
                
//                 {/* Search Bar */}
//                 <div className="mt-4 relative group">
//                     <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
//                     <input 
//                         type="text" 
//                         placeholder="Search reactions..." 
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-gray-600"
//                     />
//                 </div>
//             </div>

//             {/* List */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
//                 {filteredReactions.map((reaction) => {
//                     const isActive = currentReaction.id === reaction.id;
//                     return (
//                         <button
//                             key={reaction.id}
//                             onClick={() => onSelect(reaction.id)}
//                             className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
//                                 isActive 
//                                 ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
//                                 : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
//                             }`}
//                         >
//                             {/* Active Indicator */}
//                             {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />}

//                             <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>
//                                 {reaction.name}
//                             </h3>
//                             <div className="font-mono text-xs text-gray-500 bg-black/30 p-1.5 rounded inline-block border border-white/5 group-hover:border-white/10 transition-colors">
//                                 {reaction.equation}
//                             </div>
                            
//                             {/* Hover effect arrow */}
//                             <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${isActive ? 'translate-x-0' : '-translate-x-2'}`}>
//                                 <Atom size={16} className="text-cyan-400" />
//                             </div>
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };

// export default ReactionLibrary;






// src/components/reactions/ReactionLibrary.jsx
import { Search, FlaskConical, Atom } from 'lucide-react';
import { useState } from 'react';

const ReactionLibrary = ({ reactions, currentReaction, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReactions = Object.values(reactions).filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.equation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        // ⬅️ FIX: Updated style to Floating Panel (rounded-2xl, border-all)
        // h-full here fills the max-height defined in the parent
        <div className="flex flex-col h-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <FlaskConical size={20} />
                    <h2 className="text-sm font-bold tracking-widest uppercase">Reaction Library</h2>
                </div>
                <p className="text-xs text-gray-500">Select an experiment to begin.</p>
                
                {/* Search Bar */}
                <div className="mt-4 relative group">
                    <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search reactions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* List with Internal Scrolling */}
            {/* ⬅️ FIX: min-h-0 and overflow-y-auto ensure scrollbar is confined here */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {filteredReactions.map((reaction) => {
                    const isActive = currentReaction.id === reaction.id;
                    return (
                        <button
                            key={reaction.id}
                            onClick={() => onSelect(reaction.id)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
                                isActive 
                                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            {/* Active Indicator */}
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />}

                            <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                {reaction.name}
                            </h3>
                            <div className="font-mono text-[11px] text-gray-500 bg-black/30 p-1.5 rounded inline-block border border-white/5 group-hover:border-white/10 transition-colors">
                                {reaction.equation}
                            </div>
                            
                            {/* Hover effect arrow */}
                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${isActive ? 'translate-x-0' : '-translate-x-2'}`}>
                                <Atom size={16} className="text-cyan-400" />
                            </div>
                        </button>
                    );
                })}
                {/* Spacer at bottom for better scrolling experience */}
                <div className="h-4"></div>
            </div>
        </div>
    );
};

export default ReactionLibrary;