'use client';
// src/app/page.js  — Landing Page
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '⚗️',
    title: 'Reaction Lab',
    desc: 'Simulate chemical reactions in real-time 3D with accurate macro and micro views.',
    href: '/chemical-reactions',
    color: 'from-cyan-600/20 to-cyan-900/10',
    border: 'border-cyan-700/40',
    badge: 'Popular',
  },
  {
    icon: '🧬',
    title: 'Molecule Explorer',
    desc: 'Visualise compounds in interactive 3D. Rotate, zoom and inspect every atom.',
    href: '/compounds',
    color: 'from-purple-600/20 to-purple-900/10',
    border: 'border-purple-700/40',
  },
  {
    icon: '🔬',
    title: 'Periodic Table',
    desc: 'Full interactive periodic table with element details, electron config and more.',
    href: '/periodic-table',
    color: 'from-emerald-600/20 to-emerald-900/10',
    border: 'border-emerald-700/40',
  },
  {
    icon: '💧',
    title: 'Fluid Simulation',
    desc: 'Watch realistic fluid dynamics and particle interactions in real time.',
    href: '/fluid-simulation',
    color: 'from-blue-600/20 to-blue-900/10',
    border: 'border-blue-700/40',
  },
  {
    icon: '🛠️',
    title: 'Apparatus Editor',
    desc: 'Drag-and-drop virtual lab equipment. Build your own experiment setup.',
    href: '/apparatus-editor',
    color: 'from-orange-600/20 to-orange-900/10',
    border: 'border-orange-700/40',
  },
  {
    icon: '👓',
    title: 'AR / VR Mode',
    desc: 'Step inside your experiments with immersive augmented and virtual reality.',
    href: '/ar-vr',
    color: 'from-rose-600/20 to-rose-900/10',
    border: 'border-rose-700/40',
    badge: 'Beta',
  },
];

const STATS = [
  { value: '118', label: 'Elements' },
  { value: '50+', label: 'Reactions' },
  { value: '3D', label: 'Visualisation' },
  { value: '∞', label: 'Experiments' },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Grid overlay ─────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Glow blobs ───────────────────────────────────────────── */}
      <div className="fixed -top-60 -left-60 w-[600px] h-[600px] bg-cyan-600 opacity-10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed -bottom-60 -right-60 w-[600px] h-[600px] bg-purple-700 opacity-10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center pt-28 pb-24 px-4">

        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-700/60 bg-cyan-950/40 text-cyan-300 text-xs font-semibold tracking-widest uppercase backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Virtual Chemistry Laboratory
        </div>

        {/* Heading */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
          <span className="block text-white">Molecool</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 4s linear infinite',
            }}
          >
            Labs
          </span>
        </h1>

        {/* Sub */}
        <p className="max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed mb-10">
          An immersive, AI-powered virtual chemistry lab. Simulate reactions, explore
          molecules in 3D, and run experiments — all in your browser.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/chemical-reactions"
            className="group relative px-8 py-4 rounded-2xl font-bold text-base text-white overflow-hidden shadow-xl shadow-cyan-900/50 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)' }}
          >
            <span className="relative z-10">Open the Lab ⚗️</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </Link>

          <Link
            href="/periodic-table"
            className="px-8 py-4 rounded-2xl font-bold text-base border border-gray-700 hover:border-cyan-600 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur"
          >
            Periodic Table 🔬
          </Link>
        </div>

        {/* Auth nudge */}
        {!user && (
          <p className="mt-6 text-sm text-gray-600">
            <Link href="/login" className="text-cyan-500 hover:text-cyan-300 transition-colors">
              Sign in
            </Link>
            {' '}to save your experiments and progress.
          </p>
        )}

        {/* Scroll indicator */}
        <div className="mt-20 flex flex-col items-center gap-2 text-gray-600 text-xs animate-bounce">
          <span>Scroll to explore</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-gray-800/60 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-black text-cyan-400 tabular-nums">{value}</div>
              <div className="text-gray-500 text-sm mt-1 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white mb-3">Everything in one lab</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Every tool a chemistry student or enthusiast could need, built for the web.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group relative flex flex-col gap-4 p-7 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Badge */}
              {f.badge && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {f.badge}
                </span>
              )}

              {/* Icon */}
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300 w-fit">
                {f.icon}
              </div>

              {/* Text */}
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>

              {/* Arrow */}
              <div className="mt-auto flex items-center gap-1 text-xs text-gray-600 group-hover:text-cyan-400 transition-colors duration-200 font-medium">
                Explore
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-4 mb-24">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-12 text-center overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #1e1b4b 50%, #0c4a6e 100%)' }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 80px rgba(6,182,212,0.1)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="relative z-10">
            <div className="text-5xl mb-5">🧪</div>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Start your first experiment
            </h2>
            <p className="text-blue-200/70 text-lg mb-8 max-w-lg mx-auto">
              No equipment needed. No safety goggles required. Just pure chemistry in your browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={user ? "/chemical-reactions" : "/login"}
                className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-cyan-900/50"
              >
                {user ? "Launch Reaction Lab ⚗️" : "Get Started 🚀"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-800/60 py-8 px-4 text-center">
        <p className="text-gray-600 text-sm">
          🧪 <span className="text-cyan-500 font-semibold">Molecool Labs</span> — Built for curious minds.
        </p>
      </footer>

      {/* Gradient animation keyframe */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
