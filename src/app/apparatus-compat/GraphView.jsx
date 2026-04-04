'use client';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG = {
    'Stands & Clamps': { color: '#3b82f6' },
    'Glassware':       { color: '#06b6d4' },
    'Heating':         { color: '#f97316' },
    'Accessories':     { color: '#a855f7' },
    'Electrical':      { color: '#eab308' },
    'Chemicals':       { color: '#22c55e' },
    'Safety':          { color: '#ef4444' },
    'Unknown':         { color: '#6b7280' },
};
const getColor = (cat) => CAT_CONFIG[cat]?.color || '#6b7280';

const ALL_INFO = {};
[
    { id: 'BunsenBurner',      label: 'Bunsen Burner',       icon: '🔥', category: 'Heating' },
    { id: 'TripodStand',       label: 'Tripod Stand',         icon: '🗼', category: 'Stands & Clamps' },
    { id: 'WireGauze',         label: 'Wire Gauze',           icon: '🔲', category: 'Stands & Clamps' },
    { id: 'HeatproofMat',      label: 'Heatproof Mat',        icon: '🟫', category: 'Heating' },
    { id: 'Crucible',          label: 'Crucible',             icon: '🏺', category: 'Glassware' },
    { id: 'Tongs',             label: 'Tongs',                icon: '🦞', category: 'Accessories' },
    { id: 'Beaker',            label: 'Beaker',               icon: '⚗️', category: 'Glassware' },
    { id: 'ConicalFlask',      label: 'Conical Flask',        icon: '🧪', category: 'Glassware' },
    { id: 'TestTube',          label: 'Test Tube',            icon: '🧪', category: 'Glassware' },
    { id: 'BoilingTube',       label: 'Boiling Tube',         icon: '🧪', category: 'Glassware' },
    { id: 'MeasuringCylinder', label: 'Measuring Cylinder',   icon: '📏', category: 'Glassware' },
    { id: 'Dropper',           label: 'Dropper',              icon: '💧', category: 'Accessories' },
    { id: 'StirringRod',       label: 'Stirring Rod',         icon: '🥢', category: 'Accessories' },
    { id: 'GlassRod',          label: 'Glass Rod',            icon: '🥢', category: 'Accessories' },
    { id: 'WaterTrough',       label: 'Water Trough',         icon: '🚰', category: 'Glassware' },
    { id: 'GasJar',            label: 'Gas Jar',              icon: '🔋', category: 'Glassware' },
    { id: 'DeliveryTube',      label: 'Delivery Tube',        icon: '〰️', category: 'Accessories' },
    { id: 'RubberCork',        label: 'Rubber Cork',          icon: '🍾', category: 'Accessories' },
    { id: 'Cork',              label: 'Cork',                 icon: '🍾', category: 'Accessories' },
    { id: 'Burette',           label: 'Burette',              icon: '💉', category: 'Glassware' },
    { id: 'RetortStand',       label: 'Retort Stand',         icon: '🏗️', category: 'Stands & Clamps' },
    { id: 'Clamp',             label: 'Clamp',                icon: '🗜️', category: 'Stands & Clamps' },
    { id: 'ElectrolysisSetup', label: 'Electrolysis Setup',   icon: '⚡', category: 'Electrical' },
    { id: 'PowerSupply',       label: 'Power Supply',         icon: '🔌', category: 'Electrical' },
    { id: 'MagnesiumRibbon',   label: 'Magnesium Ribbon',     icon: '🎀', category: 'Chemicals' },
    { id: 'ZincGranules',      label: 'Zinc Granules',        icon: '⬛', category: 'Chemicals' },
    { id: 'Forceps',           label: 'Forceps',              icon: '✂️', category: 'Accessories' },
    { id: 'SafetyShield',      label: 'Safety Shield',        icon: '🛡️', category: 'Safety' },
    { id: 'DropperBottle',     label: 'Dropper Bottle',       icon: '🧴', category: 'Accessories' },
    { id: 'IronNail',          label: 'Iron Nail',            icon: '📌', category: 'Chemicals' },
    { id: 'GasTap',            label: 'Gas Tap',              icon: '🚰', category: 'Electrical' },
    { id: 'LitmusPaper',       label: 'Litmus Paper',         icon: '📄', category: 'Chemicals' },
    { id: 'Wire',              label: 'Wire',                 icon: '〰️', category: 'Electrical' },
    { id: 'RoundBottomFlask',  label: 'Round Bottom Flask',   icon: '⚗️', category: 'Glassware' },
].forEach(a => { ALL_INFO[a.id] = a; });

const getInfo = (id) => ALL_INFO[id] || { id, label: id, icon: '🔬', category: 'Unknown' };

// ── Deterministic Radial Sector Layout ───────────────────────────────────────
// Each category gets an equal pie slice. Nodes are placed in concentric arcs
// within their slice with guaranteed minimum spacing.
function computeLayout(nodeIds) {
    const NODE_SPACING  = 110; // min spacing between node centres
    const INNER_RADIUS  = 180; // innermost ring radius
    const RING_GAP      = 130; // radial gap between rings

    // Group by category
    const byCategory = {};
    nodeIds.forEach(id => {
        const cat = getInfo(id).category;
        (byCategory[cat] = byCategory[cat] || []).push(id);
    });
    const cats = Object.keys(byCategory).sort(
        (a, b) => byCategory[b].length - byCategory[a].length
    );

    const positions = {};
    const sectorAngle = (2 * Math.PI) / cats.length;

    cats.forEach((cat, ci) => {
        const members = byCategory[cat];
        const sectorMid = ci * sectorAngle - Math.PI / 2 + sectorAngle / 2;

        // How many nodes fit on each ring?
        let placed = 0;
        let ring = 0;
        while (placed < members.length) {
            const r = INNER_RADIUS + ring * RING_GAP;
            // Arc length available = sector angle * radius, but cap to 80% of sector
            const arcLen = r * sectorAngle * 0.78;
            const countOnRing = Math.max(1, Math.min(
                members.length - placed,
                Math.floor(arcLen / NODE_SPACING)
            ));
            const halfSpread = (countOnRing === 1)
                ? 0
                : (Math.min(countOnRing - 1, 5) * NODE_SPACING) / (2 * r);

            for (let k = 0; k < countOnRing && placed < members.length; k++, placed++) {
                const angle = countOnRing === 1
                    ? sectorMid
                    : sectorMid - halfSpread + (k / (countOnRing - 1)) * halfSpread * 2;
                positions[members[placed]] = { x: r * Math.cos(angle), y: r * Math.sin(angle) };
            }
            ring++;
        }
    });

    return positions;
}

// ── Compute canvas bounds so everything fits ──────────────────────────────────
function getBounds(positions, nodeR = 44) {
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    const minX = Math.min(...xs) - nodeR - 60;
    const minY = Math.min(...ys) - nodeR - 60;
    const maxX = Math.max(...xs) + nodeR + 60;
    const maxY = Math.max(...ys) + nodeR + 60;
    return { minX, minY, maxX, maxY, W: maxX - minX, H: maxY - minY };
}

// ── Clean edge path: arc that curves through the centre region ────────────────
// This keeps edges away from the outer node ring and avoids overlapping nodes.
function edgePath(sx, sy, tx, ty, curvature = 0.22) {
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    // Push control point toward origin (0,0 is centre of our coordinate system)
    const cpx = mx - mx * curvature;
    const cpy = my - my * curvature;
    // Shorten ends so arrow doesn't overlap node
    const R = 38;
    const dx = tx - cpx, dy = ty - cpy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const ex = tx - (dx / d) * R;
    const ey = ty - (dy / d) * R;
    return `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;
}

// ── Main GraphView ────────────────────────────────────────────────────────────
export default function GraphView({ rules, onSelectNode, selectedNode, onToggleConnection, onSave }) {
    const svgRef    = useRef(null);
    const outerRef  = useRef(null);
    const [pan,   setPan]   = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(0.6);
    const isPanning = useRef(false);
    const panStart  = useRef(null);
    const [draggingNode, setDraggingNode] = useState(null);
    const [overrides, setOverrides] = useState({}); // dragged positions
    const [hoveredEdge, setHoveredEdge] = useState(null);
    const [filterCat, setFilterCat] = useState('All');

    // Create-connection mode
    const [connectMode, setConnectMode] = useState(false);
    const [connectSource, setConnectSource] = useState(null);
    const [pendingConnection, setPendingConnection] = useState(null); // { source, target }
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Build node list and edges from rules
    const { nodeIds, edges } = useMemo(() => {
        if (!rules) return { nodeIds: [], edges: [] };
        const ids = new Set(Object.keys(rules));
        Object.values(rules).forEach(r => (r.canAttachTo || []).forEach(id => ids.add(id)));
        const edges = [];
        Object.entries(rules).forEach(([src, r]) => {
            (r.canAttachTo || []).forEach(tgt => edges.push({ source: src, target: tgt }));
        });
        return { nodeIds: [...ids], edges };
    }, [rules]);

    // Layout positions (deterministic — no simulation)
    const basePositions = useMemo(() => computeLayout(nodeIds), [nodeIds]);
    const bounds = useMemo(() => getBounds(basePositions), [basePositions]);

    const centeredRef = useRef(false);
    // Auto-center: compute pan so the graph is centred in the container
    const centerView = useCallback((s) => {
        const el = outerRef.current;
        if (!el || !bounds) return;
        const cw = el.clientWidth;
        const ch = el.clientHeight;
        setPan({
            x: (cw - bounds.W * s) / 2,
            y: (ch - bounds.H * s) / 2,
        });
    }, [bounds]);

    // Final world-space position of each node
    const pos = useCallback((id) => {
        const ov = overrides[id];
        const bp = basePositions[id] || { x: 0, y: 0 };
        // Shift from layout origin (0,0 = centre) to SVG space
        return {
            x: (ov?.x ?? bp.x) - bounds.minX,
            y: (ov?.y ?? bp.y) - bounds.minY,
        };
    }, [overrides, basePositions, bounds]);

    // ── Fix wheel zoom: attach listener directly with { passive: false } ──────
    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const factor = e.deltaY < 0 ? 1.1 : 0.91;
            // Zoom toward mouse pointer
            const rect = el.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            setScale(prev => {
                const next = Math.max(0.15, Math.min(5, prev * factor));
                // Adjust pan so zoom origin stays under pointer
                setPan(p => ({
                    x: mx - (mx - p.x) * (next / prev),
                    y: my - (my - p.y) * (next / prev),
                }));
                return next;
            });
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, []);

    // Auto-center on first load (once bounds are available)
    useEffect(() => {
        if (bounds && !centeredRef.current && outerRef.current) {
            centeredRef.current = true;
            centerView(0.6);
        }
    }, [bounds, centerView]);

    // ── Pan handlers ──────────────────────────────────────────────────────────
    const onMouseDown = (e) => {
        if (e.button !== 0 || e.target.closest('.gnode')) return;
        isPanning.current = true;
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    };
    const onMouseMove = useCallback((e) => {
        if (isPanning.current && panStart.current)
            setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
        if (draggingNode) {
            const rect = svgRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
            const wx = (e.clientX - rect.left - pan.x) / scale + bounds.minX;
            const wy = (e.clientY - rect.top  - pan.y) / scale + bounds.minY;
            setOverrides(prev => ({ ...prev, [draggingNode]: { x: wx, y: wy } }));
        }
    }, [draggingNode, pan, scale, bounds]);
    const onMouseUp = () => { isPanning.current = false; panStart.current = null; setDraggingNode(null); };

    // Category filter
    const categories = useMemo(() => [...new Set(nodeIds.map(id => getInfo(id).category))].sort(), [nodeIds]);
    const visibleIds = useMemo(() =>
        filterCat === 'All' ? new Set(nodeIds) : new Set(nodeIds.filter(id => getInfo(id).category === filterCat)),
        [nodeIds, filterCat]
    );
    const visibleEdges = useMemo(() =>
        edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target)),
        [edges, visibleIds]
    );

    // Highlight connected nodes when one is selected
    const connected = useMemo(() => {
        if (!selectedNode) return null;
        const s = new Set([selectedNode]);
        edges.forEach(e => {
            if (e.source === selectedNode) s.add(e.target);
            if (e.target === selectedNode) s.add(e.source);
        });
        return s;
    }, [selectedNode, edges]);

    // ── Node click handler ────────────────────────────────────────────────────
    const handleNodeClick = (id) => {
        if (connectMode) {
            if (!connectSource) {
                setConnectSource(id);
            } else if (connectSource !== id) {
                // Check if already connected
                const alreadyExists = edges.some(e => e.source === connectSource && e.target === id);
                setPendingConnection({ source: connectSource, target: id, exists: alreadyExists });
                setConnectSource(null);
                setConnectMode(false);
            }
            return;
        }
        onSelectNode(selectedNode === id ? null : id);
    };

    // ── Confirm/cancel pending connection ─────────────────────────────────────
    const confirmConnection = async () => {
        if (!pendingConnection) return;
        onToggleConnection(pendingConnection.source, pendingConnection.target);
        setPendingConnection(null);
        showStatus('Connection added — click Save All to persist');
    };
    const cancelConnection = () => setPendingConnection(null);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave();
            showStatus('✅ Saved!');
        } catch {
            showStatus('❌ Save failed');
        } finally {
            setSaving(false);
        }
    };

    const showStatus = (msg) => {
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Degree for sizing nodes
    const degree = useMemo(() => {
        const d = {};
        edges.forEach(e => {
            d[e.source] = (d[e.source] || 0) + 1;
            d[e.target] = (d[e.target] || 0) + 1;
        });
        return d;
    }, [edges]);

    // ── Category sector halos ─────────────────────────────────────────────────
    const sectorHalos = useMemo(() => {
        if (filterCat !== 'All') return [];
        const byCategory = {};
        nodeIds.forEach(id => {
            const cat = getInfo(id).category;
            (byCategory[cat] = byCategory[cat] || []).push(id);
        });
        return Object.entries(byCategory).map(([cat, ids]) => {
            const pts = ids.map(id => pos(id));
            const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
            const r = Math.max(60, ...pts.map(p => Math.hypot(p.x - cx, p.y - cy))) + 56;
            return { cat, cx, cy, r, color: getColor(cat) };
        });
    }, [nodeIds, pos, filterCat]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#06060f]">
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#090916] shrink-0 flex-wrap gap-y-1">
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterCat('All')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${filterCat === 'All' ? 'bg-white/10 text-white border-white/20' : 'text-neutral-600 border-transparent hover:text-neutral-300'}`}>
                        All
                    </button>
                    {categories.map(cat => {
                        const color = getColor(cat);
                        const active = filterCat === cat;
                        return (
                            <button key={cat} onClick={() => setFilterCat(active ? 'All' : cat)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${active ? 'border-opacity-50 bg-white/5' : 'border-transparent text-neutral-600 hover:text-neutral-300'}`}
                                style={active ? { borderColor: color + '60', color } : {}}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                {cat}
                            </button>
                        );
                    })}
                </div>

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    {statusMsg && (
                        <span className="text-[10px] text-cyan-300 bg-cyan-900/20 px-2 py-1 rounded-lg border border-cyan-500/20">{statusMsg}</span>
                    )}
                    {connectSource && (
                        <span className="text-[10px] text-yellow-300 bg-yellow-900/20 px-2.5 py-1 rounded-lg border border-yellow-500/30 animate-pulse">
                            🎯 Now click target node…
                        </span>
                    )}
                    <button
                        onClick={() => { setConnectMode(!connectMode); setConnectSource(null); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${connectMode ? 'bg-green-600/20 border-green-500/40 text-green-300' : 'bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.07]'}`}>
                        {connectMode ? '✕ Cancel' : '+ Connect'}
                    </button>
                    <button
                        onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-cyan-900/30 transition-all">
                        {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾'}
                        Save
                    </button>
                    <button onClick={() => { setScale(0.6); centerView(0.6); }}
                        className="px-2.5 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-[10px] text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                        Reset
                    </button>
                    <span className="text-[10px] text-neutral-700 hidden xl:block">Scroll: zoom · Drag bg: pan · Drag node: move</span>
                </div>
            </div>

            {/* ── Canvas ── */}
            <div
                ref={outerRef}
                className="flex-1 relative overflow-hidden"
                style={{ cursor: connectMode ? 'crosshair' : 'grab' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                <svg ref={svgRef} width="100%" height="100%">
                    <defs>
                        <radialGradient id="bg-rg" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stopColor="#0d0d22" />
                            <stop offset="100%" stopColor="#06060f" />
                        </radialGradient>
                        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <filter id="glow-sm"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        {/* One arrowhead per category colour */}
                        {Object.entries(CAT_CONFIG).map(([cat, { color }]) => (
                            <marker key={cat} id={`ar-${cat.replace(/[\s&]/g, '_')}`}
                                markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                                <path d="M0,0.5 L0,6.5 L7,3.5 z" fill={color} opacity="0.85" />
                            </marker>
                        ))}
                        <marker id="ar-dim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.15)" />
                        </marker>
                        <marker id="ar-pending" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                            <path d="M0,0.5 L0,6.5 L7,3.5 z" fill="#22c55e" />
                        </marker>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#bg-rg)" />

                    <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                        {/* ── Category halos ── */}
                        {sectorHalos.map(({ cat, cx, cy, r, color }) => (
                            <g key={cat}>
                                <circle cx={cx} cy={cy} r={r}
                                    fill={color + '07'} stroke={color + '28'} strokeWidth="1.5"
                                    strokeDasharray="8 5" />
                                <text x={cx} y={cy - r + 18}
                                    textAnchor="middle" fontSize="12" fontWeight="600"
                                    fontFamily="system-ui, sans-serif" letterSpacing="0.6"
                                    fill={color + '90'} style={{ pointerEvents: 'none' }}>
                                    {cat}
                                </text>
                            </g>
                        ))}

                        {/* ── Edges ── */}
                        {visibleEdges.map(edge => {
                            const s = pos(edge.source);
                            const t = pos(edge.target);
                            const isHighlighted = !selectedNode
                                || edge.source === selectedNode
                                || edge.target === selectedNode;
                            const isHov = hoveredEdge === `${edge.source}→${edge.target}`;
                            const srcCat = getInfo(edge.source).category;
                            const color = getColor(srcCat);
                            const markerId = `ar-${srcCat.replace(/[\s&]/g, '_')}`;
                            const path = edgePath(s.x, s.y, t.x, t.y, 0.28);

                            return (
                                <g key={`${edge.source}→${edge.target}`}
                                    onMouseEnter={() => setHoveredEdge(`${edge.source}→${edge.target}`)}
                                    onMouseLeave={() => setHoveredEdge(null)}>
                                    {/* Wide transparent hit area */}
                                    <path d={path} fill="none" stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer' }} />
                                    <path d={path} fill="none"
                                        stroke={isHighlighted ? color : 'rgba(255,255,255,0.06)'}
                                        strokeWidth={isHov ? 2.5 : isHighlighted ? 1.5 : 1}
                                        strokeOpacity={isHighlighted ? (isHov ? 1 : 0.6) : 0.25}
                                        markerEnd={isHighlighted ? `url(#${markerId})` : 'url(#ar-dim)'}
                                        filter={isHov ? 'url(#glow-sm)' : undefined}
                                    />
                                    {isHov && (() => {
                                        const mx = (s.x + t.x) / 2 * (1 - 0.28);
                                        const my = (s.y + t.y) / 2 * (1 - 0.28);
                                        return (
                                            <text x={mx} y={my - 11} textAnchor="middle"
                                                fontSize="10" fill={color} fontFamily="monospace"
                                                fontWeight="600" style={{ pointerEvents: 'none' }}
                                                paintOrder="stroke" stroke="#06060f" strokeWidth="4">
                                                {getInfo(edge.source).label} → {getInfo(edge.target).label}
                                            </text>
                                        );
                                    })()}
                                </g>
                            );
                        })}

                        {/* ── Nodes ── */}
                        {nodeIds.filter(id => visibleIds.has(id)).map(id => {
                            const { x, y } = pos(id);
                            const info = getInfo(id);
                            const color = getColor(info.category);
                            const deg = degree[id] || 0;
                            const R = Math.max(32, Math.min(46, 32 + deg * 2));
                            const isSelected = selectedNode === id;
                            const isConnectSrc = connectSource === id;
                            const isDimmed = connected && !connected.has(id);

                            return (
                                <g key={id} className="gnode"
                                    transform={`translate(${x},${y})`}
                                    style={{ opacity: isDimmed ? 0.12 : 1, transition: 'opacity 0.18s', cursor: connectMode ? 'crosshair' : draggingNode === id ? 'grabbing' : 'pointer' }}
                                    onMouseDown={e => { e.stopPropagation(); setDraggingNode(id); }}
                                    onClick={(e) => { e.stopPropagation(); handleNodeClick(id); }}
                                >
                                    {/* Glow / selection ring */}
                                    {(isSelected || isConnectSrc) && (
                                        <circle r={R + 12} fill="none"
                                            stroke={isConnectSrc ? '#22c55e' : color}
                                            strokeWidth="2" strokeOpacity="0.55"
                                            filter="url(#glow)" />
                                    )}
                                    {/* Outer thin ring */}
                                    <circle r={R + 3} fill="none" stroke={color}
                                        strokeWidth={isSelected ? 2.2 : 1}
                                        strokeOpacity={isSelected ? 0.85 : 0.28} />
                                    {/* Body */}
                                    <circle r={R} fill={color + '1a'} />

                                    {/* Icon */}
                                    <text textAnchor="middle" dominantBaseline="central"
                                        fontSize={Math.max(15, R * 0.62)} y={-3}
                                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                        {info.icon}
                                    </text>
                                    {/* Label — painted with stroke so it's always legible */}
                                    <text textAnchor="middle" y={R + 15}
                                        fontSize="10.5" fontFamily="system-ui, sans-serif"
                                        fontWeight={isSelected ? '700' : '400'}
                                        fill={isSelected ? color : 'rgba(255,255,255,0.72)'}
                                        paintOrder="stroke" stroke="#06060f" strokeWidth="4"
                                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                        {info.label.length > 14 ? info.label.slice(0, 13) + '…' : info.label}
                                    </text>
                                    {/* Degree badge */}
                                    {deg > 0 && (
                                        <g transform={`translate(${R * 0.72},${-R * 0.72})`}>
                                            <circle r={9} fill={color} opacity="0.92" />
                                            <text textAnchor="middle" dominantBaseline="central"
                                                fontSize="7.5" fill="black" fontWeight="800"
                                                style={{ pointerEvents: 'none' }}>{deg}</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Stats overlay */}
                <div className="absolute top-3 right-4 flex items-center gap-3 text-[10px] text-neutral-600 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 pointer-events-none">
                    <span><span className="text-white/50 font-bold">{nodeIds.length}</span> nodes</span>
                    <span>·</span>
                    <span><span className="text-cyan-400/70 font-bold">{edges.length}</span> connections</span>
                </div>

                {/* ── Pending connection confirm card ── */}
                {pendingConnection && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0e0e1e]/95 backdrop-blur border border-green-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 min-w-[340px] z-20">
                        <p className="text-sm font-bold text-white">Confirm New Connection</p>
                        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2.5 text-xs font-mono">
                            <span>{getInfo(pendingConnection.source).icon}</span>
                            <span className="text-cyan-300">{pendingConnection.source}</span>
                            <span className="text-neutral-500 mx-1">→</span>
                            <span>{getInfo(pendingConnection.target).icon}</span>
                            <span className="text-blue-300">{pendingConnection.target}</span>
                        </div>
                        {pendingConnection.exists && (
                            <p className="text-[10px] text-yellow-400 bg-yellow-900/20 rounded-lg px-2 py-1 border border-yellow-500/30">
                                ⚠️ This connection already exists — confirming will remove it.
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button onClick={confirmConnection}
                                className="flex-1 py-2 bg-green-600/25 border border-green-500/40 text-green-300 rounded-xl text-xs font-bold hover:bg-green-600/40 transition-all">
                                {pendingConnection.exists ? 'Remove Connection' : '✓ Add Connection'}
                            </button>
                            <button onClick={cancelConnection}
                                className="px-4 py-2 bg-white/5 border border-white/10 text-neutral-300 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected node info panel */}
                {selectedNode && !connectMode && (() => {
                    const info = getInfo(selectedNode);
                    const color = getColor(info.category);
                    const rule = rules[selectedNode] || {};
                    const attachesTo = rule.canAttachTo || [];
                    const attachedFrom = Object.entries(rules).filter(([, v]) => v.canAttachTo?.includes(selectedNode)).map(([k]) => k);
                    return (
                        <div className="absolute bottom-4 left-4 bg-[#0e0e1e]/95 backdrop-blur border rounded-2xl p-4 shadow-2xl flex flex-col gap-3 min-w-[280px] max-w-[360px] z-10"
                            style={{ borderColor: color + '40' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">{info.icon}</span>
                                    <div>
                                        <p className="text-sm font-bold text-white">{info.label}</p>
                                        <p className="text-[10px] font-mono" style={{ color }}>{selectedNode} · {info.category}</p>
                                    </div>
                                </div>
                                <button onClick={() => onSelectNode(null)} className="text-neutral-600 hover:text-white text-lg leading-none">✕</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/[0.03] rounded-xl p-2.5">
                                    <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Attaches To ({attachesTo.length})</p>
                                    {attachesTo.length === 0
                                        ? <p className="text-[10px] text-neutral-700 italic">None</p>
                                        : attachesTo.map(id => (
                                            <div key={id} onClick={() => onSelectNode(id)} className="flex items-center gap-1.5 mb-1 cursor-pointer hover:opacity-70">
                                                <span className="text-sm leading-none">{getInfo(id).icon}</span>
                                                <span className="text-[10px] text-neutral-300">{getInfo(id).label}</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="bg-white/[0.03] rounded-xl p-2.5">
                                    <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Attached From ({attachedFrom.length})</p>
                                    {attachedFrom.length === 0
                                        ? <p className="text-[10px] text-neutral-700 italic">None</p>
                                        : attachedFrom.map(id => (
                                            <div key={id} onClick={() => onSelectNode(id)} className="flex items-center gap-1.5 mb-1 cursor-pointer hover:opacity-70">
                                                <span className="text-sm leading-none">{getInfo(id).icon}</span>
                                                <span className="text-[10px] text-neutral-300">{getInfo(id).label}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
