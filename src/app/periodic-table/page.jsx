"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ElementCell from "@/components/ElementCell";
import ElementModal from "@/components/ElementModal";
import ElementComparisonModal from "@/components/ElementComparisonModal";
import { Scale } from "lucide-react";

// ── Module-level constants ────────────────────────────────────────────────────
// Defined OUTSIDE the component so they are never recreated on re-renders.

const ELEMENTS_CACHE_KEY = "molecool_elements_v1";
const ELEMENTS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const CATEGORY_COLORS_LEGEND = [
  { category: "diatomic nonmetal",   name: "Diatomic Nonmetals",      color: "#2d7a74" }, // Extra Muted Teal
  { category: "alkali metal",         name: "Alkali Metals",            color: "#8c3a3a" }, // Extra Muted Red
  { category: "alkaline earth metal", name: "Alkaline Earth Metals",   color: "#9c683c" }, // Extra Muted Orange
  { category: "transition metal",     name: "Transition Metals",        color: "#8a7826" }, // Extra Muted Yellow
  { category: "noble gas",            name: "Noble Gases",              color: "#41398c" }, // Extra Muted Purple
  { category: "halogen",              name: "Halogens",                 color: "#5a806c" }, // Extra Muted Green
  { category: "lanthanide",           name: "Lanthanides",              color: "#80505a" }, // Extra Muted Rose
  { category: "actinide",             name: "Actinides",                color: "#505a80" }, // Extra Muted Blue
  { category: "post-transition metal",name: "Post-Transition Metals", color: "#24628a" }, // Extra Muted Sky Blue
  { category: "metalloid",            name: "Metalloids",               color: "#6b640d" }, // Extra Muted Gold
  { category: "polyatomic nonmetal",  name: "Nonmetals",                color: "#2d4682" }, // Extra Muted Royal Blue
];


// ── Component ─────────────────────────────────────────────────────────────────
const PeriodicTablePage = () => {
  const [elements, setElements]                         = useState([]);
  const [loading, setLoading]                           = useState(true);
  const [selectedElement, setSelectedElement]           = useState(null);
  const [compareMode, setCompareMode]                   = useState(false);
  const [selectedElementsToCompare, setSelectedElementsToCompare] = useState([]);
  const [highlightedCategory, setHighlightedCategory]   = useState(null);

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
    setHighlightedCategory((prev) =>
      prev === category.toLowerCase() ? null : category.toLowerCase()
    );
  }, []);

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
    setSelectedElementsToCompare([]);
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


  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p className="text-xl text-blue-400 animate-pulse">
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
      isComparisonSelected={compareSet.has(el.atomic_number)}
      isCompareMode={compareMode}
      compareSetSize={compareSet.size}
    />
  );

  return (
    <div className="min-h-screen bg-transparent text-white p-4 sm:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="bg-mesh-container">
        <div className="bg-mesh-blob blob-1" />
        <div className="bg-mesh-blob blob-2" />
        <div className="bg-mesh-blob blob-3" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 pt-10">
        <header className="mb-20 text-center">
          <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white mb-4" style={{ textShadow: '0 10px 40px rgba(255, 255, 255, 0.2)' }}>
            MOLECOOLS <span className="text-white/40 font-light">LAB</span>
          </h1>



          <p className="text-white/80 font-black tracking-[0.3em] uppercase text-sm sm:text-base bg-white/5 py-2.5 px-12 rounded-full inline-block border border-white/10 backdrop-blur-sm shadow-xl">
            Future-Ready Interactive Periodic Table
          </p>
        </header>




        {/* Controls Container */}
        <div className="mb-16 flex flex-col gap-10">

          {/* Compare Mode Toggle */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={toggleCompareMode}
              className={`flex items-center gap-4 px-14 py-6 rounded-full font-black tracking-widest uppercase text-xs transition-all duration-700 shadow-3xl backdrop-blur-3xl border tap-animation ${
                compareMode
                  ? "bg-white text-black border-white shadow-2xl scale-110"
                  : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
              }`}
            >
              <Scale size={16} className={compareMode ? "animate-pulse" : ""} />
              {compareMode ? "Comparison Active" : "Initialize Compare Mode"}
            </button>

            {compareMode && (
              <div className="text-xs font-black tracking-[0.2em] uppercase text-blue-400 animate-pulse bg-blue-950/20 px-8 py-3 rounded-full border border-blue-500/20 backdrop-blur-md">
                {selectedElementsToCompare.length === 0 && "Step 1: Select first element"}
                {selectedElementsToCompare.length === 1 &&
                  `Step 2: Select comparison for ${selectedElementsToCompare[0].symbol}`}
                {selectedElementsToCompare.length === 2 && "Comparison engine ready"}
              </div>
            )}
          </div>

          <div className="max-w-6xl mx-auto px-6">
            {/* Categories Legend */}
            <div className="glass-card p-10 rounded-[3.5rem] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/5 backdrop-blur-xl">

              <h2 className="text-sm text-white font-black tracking-[0.2em] uppercase mb-10 flex items-center justify-center gap-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                Atomic Categories
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              </h2>

                <div className="flex flex-wrap justify-center gap-4">
                  {CATEGORY_COLORS_LEGEND.map(({ category, color, name }) => {
                    const isActive = highlightedCategory === category.toLowerCase();

                    return (
                      <button
                        key={category}
                        onClick={() => handleLegendClick(category)}
                        className={`flex items-center px-6 py-3 rounded-2xl transition-all duration-700 border glass-pill tap-animation ${
                          isActive
                            ? "bg-white/20 border-white/50 scale-110 shadow-3xl z-10"
                            : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full blur-[0.5px]" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                        <span className={`ml-3 text-white text-[13px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-80'}`}>{name}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
          </div>
        </div>



        {/* Periodic Table Grid */}
        <div
          className="grid gap-1.5 mx-auto py-10"
          style={{
            gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(10, auto)`,
          }}
        >
          {mainElements.map(renderCell)}

          {/* Spacer rows between main table and lanthanide/actinide rows */}
          <div style={{ gridColumn: "3 / span 15", gridRow: 6 }} />
          <div style={{ gridColumn: "3 / span 15", gridRow: 7 }} />

          {/* F-Block Series (Lanthanides & Actinides) */}
          <div
            style={{
              gridColumn: "4 / span 14",
              gridRow: 8,
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem", // Exactly match the main grid gap (gap-1.5)
              marginTop: "2rem",
            }}
          >
             <div className="grid grid-cols-[repeat(14,1fr)] gap-1.5">
                {lanthanides.map(renderCell)}
             </div>
             <div className="grid grid-cols-[repeat(14,1fr)] gap-1.5">
                {actinides.map(renderCell)}
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
      </div>
    </div>
  );
};


export default PeriodicTablePage;
