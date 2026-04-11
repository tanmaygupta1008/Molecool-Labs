'use client';
// src/app/page.js  — Landing Page
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import BackgroundScene3D from '../components/BackgroundScene3D';
import TeamSection from '../components/TeamSection';

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
    <div className="bg-transparent text-white overflow-x-hidden relative">

      {/* ── 3D Scene Background ─────────────────────────────────────────── */}
      <BackgroundScene3D />

      {/* ═══════════════════════════════════════════════════════════
          HERO (Macro Level)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[110vh] px-4">

        {/* Pill badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/50 bg-sky-950/40 text-cyan-200 text-xs font-semibold tracking-widest uppercase backdrop-blur-md shadow-lg shadow-sky-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
          Virtual Chemistry Laboratory
        </div>

        {/* Heading */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6 drop-shadow-2xl">
          <span className="block text-white" style={{ textShadow: '0 4px 30px rgba(14, 165, 233, 0.4)' }}>Molecools</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(90deg, #38bdf8, #10b981, #38bdf8)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 4s linear infinite',
              filter: 'drop-shadow(0px 0px 20px rgba(56, 189, 248, 0.5))'
            }}
          >
            Lab
          </span>
        </h1>

        {/* Sub */}
        <p className="max-w-2xl text-lg sm:text-xl text-sky-100/90 leading-relaxed mb-10 drop-shadow-lg font-medium">
          An immersive, AI-powered virtual chemistry lab. Simulate reactions, explore
          molecules in 3D, and run experiments — all in your browser.
        </p>

        {/* Auth nudge */}
        {!user && (
          <p className="mt-6 text-sm text-sky-200/70 bg-black/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-sky-500/20 shadow-xl">
            <Link href="/login" className="text-cyan-300 hover:text-cyan-200 transition-colors font-bold tracking-wide">
              Sign in
            </Link>
            {' '}to save your experiments and progress.
          </p>
        )}

        {/* Scroll indicator */}
        <div className="mt-auto pb-12 flex flex-col items-center gap-2 text-sky-200/60 text-xs animate-bounce drop-shadow-lg uppercase tracking-widest font-semibold">
          <span>Scroll to explore the micro world</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES GRID (Lattice Level)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 min-h-[110vh] flex flex-col justify-center py-20 pointer-events-auto z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-white mb-3 drop-shadow-lg">Everything in one lab</h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto drop-shadow-md">
            Every tool a chemistry student or enthusiast could need, built for the web.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group relative flex flex-col gap-4 p-7 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-md hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Badge */}
              {f.badge && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {f.badge}
                </span>
              )}

              {/* Icon */}
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300 w-fit drop-shadow-lg">
                {f.icon}
              </div>

              {/* Text */}
              <div>
                <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed drop-shadow-md">{f.desc}</p>
              </div>

              {/* Arrow */}
              <div className="mt-auto flex items-center gap-1 text-xs text-cyan-300 group-hover:text-cyan-200 transition-colors duration-200 font-medium">
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
          CTA BANNER (Molecule Level)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-4 min-h-[90vh] flex flex-col justify-center pointer-events-auto z-10">
        <div
          className="max-w-5xl w-full mx-auto rounded-3xl p-12 text-center overflow-hidden relative backdrop-blur-lg border border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(12,74,110,0.4) 0%, rgba(30,27,75,0.4) 50%, rgba(12,74,110,0.4) 100%)' }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 80px rgba(6,182,212,0.2)' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="relative z-10">
            <div className="text-5xl mb-5 drop-shadow-2xl">🧪</div>
            <h2 className="text-4xl font-extrabold text-white mb-4 drop-shadow-lg">
              Start your first experiment
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto drop-shadow-md">
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
          TEAM SECTION (Atomic Level)
      ═══════════════════════════════════════════════════════════ */}
      <TeamSection />

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-800/60 py-8 px-4 text-center mt-20 relative z-10 bg-black/50 backdrop-blur-md">
        <p className="text-gray-500 text-sm">
          <span className="text-cyan-500 font-semibold">Molecools Lab</span> — Built for curious minds.
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
