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
  { category: "diatomic nonmetal",   name: "Diatomic Nonmetals",      color: "#2d7a74" },
  { category: "alkali metal",         name: "Alkali Metals",            color: "#8c3a3a" },
  { category: "alkaline earth metal", name: "Alkaline Earth Metals",   color: "#9c683c" },
  { category: "transition metal",     name: "Transition Metals",        color: "#8a7826" },
  { category: "noble gas",            name: "Noble Gases",              color: "#41398c" },
  { category: "halogen",              name: "Halogens",                 color: "#5a806c" },
  { category: "lanthanide",           name: "Lanthanides",              color: "#80505a" },
  { category: "actinide",             name: "Actinides",                color: "#505a80" },
  { category: "post-transition metal",name: "Post-Transition Metals", color: "#24628a" },
  { category: "metalloid",            name: "Metalloids",               color: "#6b640d" },
  { category: "polyatomic nonmetal",  name: "Nonmetals",                color: "#2d4682" },
];

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
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">
          Molecools Lab Periodic Table
        </h1>
        <p className="text-gray-400 mt-2">
          Click an element or a legend category to explore!
        </p>
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
        <div className="text-center">
          <h2 className="text-xl text-cyan-400 font-semibold mb-3">Periodic Trends</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.values(TRENDS).map((trend) => {
              const isActive = activeTrend === trend.id;
              return (
                <button
                  key={trend.id}
                  onClick={() => handleTrendClick(trend.id)}
                  className={`px-4 py-2 rounded-full border transition-all duration-300 font-medium text-sm ${
                    isActive
                      ? "bg-cyan-900 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                      : "bg-gray-900 border-gray-700 text-gray-400 hover:border-cyan-700 hover:text-gray-200"
                  }`}
                >
                  {trend.label}
                </button>
              );
            })}
          </div>
          {activeTrend && (
            <div className="mt-2 text-sm text-gray-400 animate-fadeIn">
              Showing:{" "}
              <span className="text-cyan-300 font-bold">
                {TRENDS[activeTrend].label}
              </span>
              <span className="mx-2">|</span>
              {TRENDS[activeTrend].description}
              <div className="mt-1 flex justify-center items-center gap-2 text-xs">
                <span>Low</span>
                <div
                  className="w-32 h-2 rounded bg-gradient-to-r from-[var(--color-start)] to-[var(--color-end)]"
                  style={{
                    "--color-start": TRENDS[activeTrend].colorStart,
                    "--color-end": TRENDS[activeTrend].colorEnd,
                  }}
                />
                <span>High</span>
              </div>
            </div>
          )}
        </div>

        {/* Categories Legend */}
        <div className="text-center border-t border-gray-800 pt-6">
          <h2 className="text-lg text-gray-500 font-medium mb-3">Element Categories</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORY_COLORS_LEGEND.map(({ category, color, name }) => {
              const isActive = highlightedCategory === category.toLowerCase();
              const isDimmed = activeTrend !== null;
              return (
                <button
                  key={category}
                  onClick={() => handleLegendClick(category)}
                  disabled={!!activeTrend}
                  className={`flex items-center px-3 py-1 rounded-md transition-all duration-300 border ${
                    isActive
                      ? "scale-110 border-cyan-400 shadow-lg shadow-cyan-400/40"
                      : "border-gray-600"
                  } ${
                    isDimmed
                      ? "opacity-40 cursor-not-allowed grayscale"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="ml-2 text-gray-300 text-xs sm:text-sm">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Periodic Table Grid */}
      <div className="w-full overflow-x-auto pb-16 custom-scrollbar px-4 pt-8">
        <div
          className="grid gap-1 mx-auto min-w-[1100px]"
          style={{
            gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(10, auto)`,
            maxWidth: "1200px",
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

      <ElementModal element={selectedElement} onClose={handleModalClose} />
      {selectedElementsToCompare.length === 2 && (
        <ElementComparisonModal
          elements={selectedElementsToCompare}
          onClose={handleCompareClose}
        />
      )}
    </div>
  );
};

export default PeriodicTablePage;
