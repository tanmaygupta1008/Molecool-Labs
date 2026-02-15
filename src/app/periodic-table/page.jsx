"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ElementCell from "@/components/ElementCell";
import ElementModal from "@/components/ElementModal";
import { TRENDS, getTrendColor } from "@/utils/periodic-trends";

const PeriodicTablePage = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [highlightedCategory, setHighlightedCategory] = useState(null);
  const [activeTrend, setActiveTrend] = useState(null); // 'atomic_radius' | 'ionization_energy' | ...

  useEffect(() => {
    const fetchElements = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "elements"), orderBy("atomic_number"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setElements(data);
      } catch (e) {
        console.error("Error loading elements", e);
      } finally {
        setLoading(false);
      }
    };
    fetchElements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p className="text-xl text-cyan-400 animate-pulse">
          Fetching elements and models from the Cloud... 🧪
        </p>
      </div>
    );
  }

  const categoryColors = [
    { category: "diatomic nonmetal", name: "diatomic nonmetal", color: "#2563EB" },
    { category: "alkali metal", name: "Alkali Metals", color: "#DC2626" },
    { category: "alkaline earth metal", name: "Alkaline Earth Metals", color: "#EA580C" },
    { category: "transition metal", name: "Transition Metals", color: "#CA8A04" },
    { category: "noble gas", name: "Noble Gases", color: "#9333EA" },
    { category: "halogen", name: "Halogens", color: "#0891B2" },
    { category: "lanthanide", name: "Lanthanides", color: "#DB2777" },
    { category: "actinide", name: "Actinides", color: "#C026D3" },
    { category: "post-transition metal", name: "Post-Transition Metals", color: "#16A34A" },
    { category: "metalloid", name: "Metalloids", color: "#65A30D" },
    { category: "polyatomic nonmetal", name: "Nonmetals", color: "#3B82F6" },
  ];

  const handleLegendClick = (category) => {
    // If clicking a category, disable active trend
    if (activeTrend) setActiveTrend(null);

    setHighlightedCategory((prev) =>
      prev === category.toLowerCase() ? null : category.toLowerCase()
    );
  };

  const handleTrendClick = (trendId) => {
    // If clicking a trend, disable highlighted category
    if (highlightedCategory) setHighlightedCategory(null);

    setActiveTrend((prev) => (prev === trendId ? null : trendId));
  };

  const mainElements = elements.filter((e) => e.ypos <= 7);
  const lanthActinides = elements.filter((e) => e.ypos >= 9);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">
          Molecool Labs Periodic Table
        </h1>
        <p className="text-gray-400 mt-2">
          Click an element or a legend category to explore!
        </p>
      </header>

      {/* Controls Container */}
      <div className="mb-8 flex flex-col gap-6">

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
                  className={`
                      px-4 py-2 rounded-full border transition-all duration-300 font-medium text-sm
                      ${isActive
                      ? 'bg-cyan-900 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-cyan-700 hover:text-gray-200'
                    }
                    `}
                >
                  {trend.label}
                </button>
              );
            })}
          </div>
          {activeTrend && (
            <div className="mt-2 text-sm text-gray-400 animate-fadeIn">
              Showing: <span className="text-cyan-300 font-bold">{TRENDS[activeTrend].label}</span>
              <span className="mx-2">|</span>
              {TRENDS[activeTrend].description}
              <div className="mt-1 flex justify-center items-center gap-2 text-xs">
                <span>Low</span>
                <div className="w-32 h-2 rounded bg-gradient-to-r from-[var(--color-start)] to-[var(--color-end)]"
                  style={{
                    '--color-start': TRENDS[activeTrend].colorStart,
                    '--color-end': TRENDS[activeTrend].colorEnd
                  }}
                ></div>
                <span>High</span>
              </div>
            </div>
          )}
        </div>

        {/* Categories Legend */}
        <div className="text-center border-t border-gray-800 pt-6">
          <h2 className="text-lg text-gray-500 font-medium mb-3">Element Categories</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categoryColors.map(({ category, color, name }) => {
              const isActive = highlightedCategory === category.toLowerCase();
              const isDimmed = activeTrend !== null; // Dim categories if trend is active
              return (
                <button
                  key={category}
                  onClick={() => handleLegendClick(category)}
                  disabled={!!activeTrend}
                  className={`flex items-center px-3 py-1 rounded-md transition-all duration-300 border
                    ${isActive
                      ? "scale-110 border-cyan-400 shadow-lg shadow-cyan-400/40"
                      : "border-gray-600"
                    }
                    ${isDimmed ? "opacity-40 cursor-not-allowed grayscale" : "hover:border-gray-400"}
                  `}
                >
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="ml-2 text-gray-300 text-xs sm:text-sm">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Periodic Table Grid */}
      <div
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(18, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(10, auto)`,
          maxWidth: "1200px",
        }}
      >
        {mainElements.map((el) => {
          const trendValue = activeTrend ? el[activeTrend] : undefined;
          const trendColor = activeTrend ? getTrendColor(trendValue, activeTrend) : null;

          return (
            <ElementCell
              key={el.atomic_number}
              element={el}
              onClick={setSelectedElement}
              highlightedCategory={highlightedCategory}
              trendColor={trendColor}
              trendValue={trendValue}
            />
          );
        })}

        <div style={{ gridColumn: "3 / span 15", gridRow: 6 }}></div>
        <div style={{ gridColumn: "3 / span 15", gridRow: 7 }}></div>

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
          {lanthActinides
            .filter((e) => e.ypos === 9)
            .map((el) => {
              const trendValue = activeTrend ? el[activeTrend] : undefined;
              const trendColor = activeTrend ? getTrendColor(trendValue, activeTrend) : null;
              return (
                <ElementCell
                  key={el.atomic_number}
                  element={el}
                  onClick={setSelectedElement}
                  highlightedCategory={highlightedCategory}
                  trendColor={trendColor}
                  trendValue={trendValue}
                />
              );
            })}
        </div>

        <div
          style={{
            gridColumn: "4 / span 14",
            gridRow: 10,
            display: "grid",
            gridTemplateColumns: "repeat(14, 1fr)",
          }}
          className="gap-1 mt-1"
        >
          {lanthActinides
            .filter((e) => e.ypos === 10)
            .map((el) => {
              const trendValue = activeTrend ? el[activeTrend] : undefined;
              const trendColor = activeTrend ? getTrendColor(trendValue, activeTrend) : null;
              return (
                <ElementCell
                  key={el.atomic_number}
                  element={el}
                  onClick={setSelectedElement}
                  highlightedCategory={highlightedCategory}
                  trendColor={trendColor}
                  trendValue={trendValue}
                />
              );
            })}
        </div>
      </div>

      <ElementModal
        element={selectedElement}
        onClose={() => setSelectedElement(null)}
      />
    </div>
  );
};

export default PeriodicTablePage;
