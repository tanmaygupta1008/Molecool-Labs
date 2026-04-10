"use client";

// This file is automatically caught by Next.js App Router when a route segment is loading.
// It complements nextjs-toploader by showing a beautiful "synthesizing" animation 
// in the center of the page where the new content will eventually appear.
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full bg-black/50 backdrop-blur-sm animate-pulse-slow">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-b-2 border-l-2 border-cyan-400/80 animate-[spin_2s_linear_infinite]" />
        
        {/* Inner reverse rotating ring */}
        <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-cyan-600/80 animate-[spin_1.5s_linear_infinite_reverse]" />
        
        {/* Pulsing center core */}
        <div className="w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_20px_#22d3ee] animate-pulse" />
      </div>
      
      <p className="mt-8 text-cyan-400/90 font-bold tracking-[0.3em] text-sm uppercase animate-pulse">
        Synthesizing environment...
      </p>
    </div>
  );
}
