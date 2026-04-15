"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ElementCell from "@/components/ElementCell";
import ElementModal from "@/components/ElementModal";
import ElementComparisonModal from "@/components/ElementComparisonModal";
import { Scale } from "lucide-react";
import { TRENDS, getTrendColor } from "@/utils/periodic-trends";

// ── Module-level constants ────────────────────────────────────────────────────
// Defined OUTSIDE the component so they are never recreated on re-renders.

const ELEMENTS_CACHE_KEY = "molecool_elements_v1";
const ELEMENTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const CATEGORY_COLORS_LEGEND = [
  { category: "diatomic nonmetal",   name: "Diatomic Nonmetals",      color: "#4ade80" },
  { category: "alkali metal",         name: "Alkali Metals",            color: "#f87171" },
  { category: "alkaline earth metal", name: "Alkaline Earth Metals",   color: "#fb923c" },
  { category: "transition metal",     name: "Transition Metals",        color: "#facc15" },
  { category: "noble gas",            name: "Noble Gases",              color: "#a78bfa" },
  { category: "halogen",              name: "Halogens",                 color: "#2dd4bf" },
  { category: "lanthanide",           name: "Lanthanides",              color: "#f472b6" },
  { category: "actinide",             name: "Actinides",                color: "#818cf8" },
  { category: "post-transition metal",name: "Post-Transition Metals", color: "#60a5fa" },
  { category: "metalloid",            name: "Metalloids",               color: "#fbbf24" },
  { category: "polyatomic nonmetal",  name: "Nonmetals",                color: "#3b82f6" },
];

// ── Trend Indicator Helper ────────────────────────────────────────────────────
const TrendArrow = ({ label, direction, color, position, labelPosition = "center" }) => {
  const isHorizontal = direction === 'left' || direction === 'right';
  const labelPlacement = {
    center: 'justify-center',
    start: isHorizontal ? 'justify-start' : 'justify-start pt-12',
    end: isHorizontal ? 'justify-end' : 'justify-end pb-12'
  }[labelPosition] || 'justify-center';
  
  return (
    <div className={`absolute flex items-center ${labelPlacement} pointer-events-none z-10 ${position}`}>
      <div className={`relative flex ${isHorizontal ? 'flex-row w-full px-4' : 'flex-col h-full py-4'} items-center ${labelPlacement}`}>
        {/* The Line */}
        <div 
          className={`absolute ${isHorizontal ? 'h-[1px] w-[calc(100%-32px)]' : 'w-[1px] h-[calc(100%-32px)]'}`}
          style={{ 
            backgroundColor: `${color}44`,
            boxShadow: `0 0 10px ${color}22`
          }} 
        />
        
        {/* The Head */}
        <div 
          className="absolute text-lg font-black leading-none"
          style={{ 
            color,
            textShadow: `0 0 15px ${color}`,
            [direction === 'right' ? 'right' : direction === 'left' ? 'left' : direction === 'up' ? 'top' : 'bottom']: '8px'
          }}
        >
          {{ right: '▶', left: '◀', up: '▲', down: '▼' }[direction]}
        </div>

        {/* The Label */}
        <div 
          className="relative px-2 py-0.5 rounded-md stealth-glass border border-white/10 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap shadow-2xl z-20"
          style={{ boxShadow: `0 0 20px ${color}33`, color }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const PeriodicTablePage = () => {
  const [elements, setElements]                         = useState([]);
  const [loading, setLoading]                           = useState(true);
  const [selectedElement, setSelectedElement]           = useState(null);
  const [compareMode, setCompareMode]                   = useState(false);
  const [selectedElementsToCompare, setSelectedElementsToCompare] = useState([]);
  const [highlightedCategory, setHighlightedCategory]   = useState(null);
  const [activeTrend, setActiveTrend]                   = useState(null);

  // ── Data fetching with localStorage cache ─────────────────────────────────
  // On the first visit elements are fetched from Firestore and written to
  // localStorage.  On every subsequent visit within 24 h the data is served
  // from the cache instantly — no network round-trip, no loading spinner.
  useEffect(() => {
    const fetchElements = async () => {
      // 1. Try the cache first (zero-latency path)
      try {
        const raw = localStorage.getItem(ELEMENTS_CACHE_KEY);
        if (raw) {
          const { data, timestamp } = JSON.parse(raw);
          if (Date.now() - timestamp < ELEMENTS_CACHE_TTL) {
            setElements(data);
            setLoading(false);
            return; // ← skip Firestore entirely
          }
        }
      } catch (_) { /* corrupted cache — fall through to network */ }

      // 2. Fetch from Firestore & populate cache for next visit
      try {
        setLoading(true);
        const q = query(collection(db, "elements"), orderBy("atomic_number"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setElements(data);
        try {
          localStorage.setItem(
            ELEMENTS_CACHE_KEY,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        } catch (_) { /* storage quota exceeded — skip caching silently */ }
      } catch (e) {
        console.error("Error loading elements", e);
      } finally {
        setLoading(false);
      }
    };
    fetchElements();
  }, []);

  // ── Stable event handlers ─────────────────────────────────────────────────
  // useCallback means these functions keep the same reference across renders,
  // so memoized ElementCell children do NOT re-render when unrelated state
  // (e.g. activeTrend) changes.
  const handleLegendClick = useCallback((category) => {
    // Clear trend so legend and trend can't both be active at once
    setActiveTrend(null);
    setHighlightedCategory((prev) =>
      prev === category.toLowerCase() ? null : category.toLowerCase()
    );
  }, []);

  const handleTrendClick = useCallback((trendId) => {
    setHighlightedCategory(null);
    setActiveTrend((prev) => (prev === trendId ? null : trendId));
  }, []);

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
    setSelectedElementsToCompare([]);
    setActiveTrend(null);
    setHighlightedCategory(null);
  }, []);

  const handleElementClick = useCallback(
    (element) => {
      if (compareMode) {
        setSelectedElementsToCompare((prev) => {
          if (prev.find((e) => e.atomic_number === element.atomic_number))
            return prev.filter((e) => e.atomic_number !== element.atomic_number);
          if (prev.length >= 2) return [prev[1], element];
          return [...prev, element];
        });
      } else {
        setSelectedElement(element);
      }
    },
    [compareMode]
  );

  const handleModalClose   = useCallback(() => setSelectedElement(null), []);
  const handleCompareClose = useCallback(() => setSelectedElementsToCompare([]), []);

  // ── Derived / memoised data ───────────────────────────────────────────────

  // Filter once when data loads — not re-run on every render.
  const mainElements = useMemo(() => elements.filter((e) => e.ypos <= 7),  [elements]);
  const lanthanides  = useMemo(() => elements.filter((e) => e.ypos === 9), [elements]);
  const actinides    = useMemo(() => elements.filter((e) => e.ypos === 10),[elements]);

  // O(1) comparison lookup — replaces a `.some()` scan inside the 118-cell map.
  const compareSet = useMemo(
    () => new Set(selectedElementsToCompare.map((e) => e.atomic_number)),
    [selectedElementsToCompare]
  );

  // Compute ALL 118 trend colours in a single pass whenever the trend changes.
  // Previously getTrendColor() was called in the map body — 118 calls per render.
  const trendColorMap = useMemo(() => {
    if (!activeTrend || !elements.length) return null;
    const map = new Map();
    for (const el of elements) {
      map.set(el.atomic_number, getTrendColor(el[activeTrend], activeTrend));
    }
    return map;
  }, [activeTrend, elements]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p className="text-xl text-cyan-400 animate-pulse">
          Fetching elements and models from the Cloud... 🧪
        </p>
      </div>
    );
  }

  // ── Helpers for compact cell rendering ───────────────────────────────────
  const renderCell = (el) => (
    <ElementCell
      key={el.atomic_number}
      element={el}
      onClick={handleElementClick}
      highlightedCategory={highlightedCategory}
      trendColor={trendColorMap ? trendColorMap.get(el.atomic_number) : null}
      trendValue={activeTrend ? el[activeTrend] : undefined}
      isComparisonSelected={compareSet.has(el.atomic_number)}
      isCompareMode={compareMode}
      compareSetSize={selectedElementsToCompare.length}
    />
  );

  return (
    <div className="min-h-screen atmosphere-bg text-neutral-200 p-4 sm:p-8 relative overflow-hidden">
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px]" />
      </div>

      <header className="mb-12 text-center relative z-10">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white uppercase">
          PERIODIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">TABLE</span>
        </h1>
      </header>

      {/* Controls Container */}
      <div className="mb-8 flex flex-col gap-6">

        {/* Compare Mode Toggle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleCompareMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-xl ${
              compareMode
                ? "bg-cyan-600 text-white shadow-cyan-900/50 scale-105 border-2 border-cyan-400"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}
          >
            <Scale size={20} />
            {compareMode ? "Compare Mode Active" : "Enable Compare Mode"}
          </button>
          {compareMode && (
            <div className="text-sm text-cyan-300 animate-pulse bg-cyan-900/40 px-4 py-1.5 rounded-full border border-cyan-800">
              {selectedElementsToCompare.length === 0 && "Select 1st element..."}
              {selectedElementsToCompare.length === 1 &&
                `Selected ${selectedElementsToCompare[0].symbol}. Select 2nd element...`}
              {selectedElementsToCompare.length === 2 && "Comparing..."}
            </div>
          )}
        </div>

        {/* Periodic Trends Controls */}
        <div className="text-center bg-white/5 border border-white/5 backdrop-blur-md rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-6">Periodic Trends</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.values(TRENDS).map((trend) => {
              const isActive = activeTrend === trend.id;
              return (
                <button
                  key={trend.id}
                  onClick={() => handleTrendClick(trend.id)}
                  className={`px-4 py-2 rounded-xl border transition-all duration-500 text-xs font-bold ${
                    isActive
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                      : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {trend.label}
                </button>
              );
            })}
          </div>
          {activeTrend && (
            <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 animate-fadeIn">
              <p className="text-xs text-neutral-400">
                <span className="text-cyan-400 font-black mr-2 uppercase">{TRENDS[activeTrend].label}:</span>
                {TRENDS[activeTrend].description}
              </p>
              <div className="mt-4 flex justify-center items-center gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-600">
                <span>LOW</span>
                <div
                  className="w-48 h-1.5 rounded-full bg-gradient-to-r"
                  style={{
                    background: `linear-gradient(to right, ${TRENDS[activeTrend].colorStart}, ${TRENDS[activeTrend].colorEnd})`,
                  }}
                />
                <span>HIGH</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Periodic Table Grid Wrapper - Increased padding to create a safe zone for arrows */}
      <div className="w-full overflow-x-auto pb-40 custom-scrollbar px-32 pt-32 relative">
        <div className="relative mx-auto" style={{ maxWidth: '1200px' }}>
          
          {/* Top Trends - Centered staggered */}
          <TrendArrow label="Electronegativity Increases" direction="right" color="#f87171" position="-top-24 left-0 w-full" labelPosition="center" />
          <TrendArrow label="Atomic Radius Increases" direction="left" color="#4ade80" position="-top-14 left-0 w-full" labelPosition="center" />

          {/* Bottom Trends - Centered staggered */}
          <TrendArrow label="Ionization Energy Increases" direction="right" color="#facc15" position="-bottom-24 left-0 w-full" labelPosition="center" />
          <TrendArrow label="Electron Affinity Increases" direction="right" color="#a78bfa" position="-bottom-14 left-0 w-full" labelPosition="center" />

          <div
            className="grid gap-1 min-w-[1100px]"
            style={{
              gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(10, auto)`,
            }}
          >
            {mainElements.map(renderCell)}

          {/* Spacer rows between main table and lanthanide/actinide rows */}
          <div style={{ gridColumn: "3 / span 15", gridRow: 6 }} />
          <div style={{ gridColumn: "3 / span 15", gridRow: 7 }} />

          {/* Lanthanides */}
          <div
            style={{
              gridColumn: "4 / span 14",
              gridRow: 9,
              display: "grid",
              gridTemplateColumns: "repeat(14, 1fr)",
              marginTop: "1.5rem",
            }}
            className="gap-1"
          >
            {lanthanides.map(renderCell)}
          </div>

          {/* Actinides */}
          <div
            style={{
              gridColumn: "4 / span 14",
              gridRow: 10,
              display: "grid",
              gridTemplateColumns: "repeat(14, 1fr)",
            }}
            className="gap-1 mt-1"
          >
            {actinides.map(renderCell)}
          </div>
          </div>
        </div>
      </div>

      <ElementModal element={selectedElement} onClose={handleModalClose} />
      {selectedElementsToCompare.length === 2 && (
        <ElementComparisonModal
          elements={selectedElementsToCompare}
          onClose={handleCompareClose}
        />
      )}

      {/* Floating HUD Legend */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="stealth-glass border border-white/5 px-6 py-4 rounded-full flex gap-3 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {CATEGORY_COLORS_LEGEND.map(({ category, color, name }) => {
             const isActive = highlightedCategory === category.toLowerCase();
             const isDimmed = activeTrend !== null;
             return (
               <button
                 key={category}
                 onClick={() => handleLegendClick(category)}
                 disabled={!!activeTrend}
                 className={`flex items-center justify-center group relative ${isDimmed ? 'opacity-20 pointer-events-none grayscale' : ''}`}
                 title={name}
               >
                 <div 
                   className={`w-4 h-4 rounded-full transition-all duration-300 border border-white/10 ${isActive ? 'scale-150 border-white ring-4' : 'hover:scale-125'}`} 
                   style={{ 
                     backgroundColor: color,
                     boxShadow: isActive ? `0 0 15px ${color}` : 'none',
                     '--tw-ring-color': `${color}44`
                   }} 
                 />
                 {/* Tooltip */}
                 <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md rounded border border-white/10 text-[9px] font-black uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none tracking-widest">
                   {name}
                 </div>
               </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default PeriodicTablePage;
