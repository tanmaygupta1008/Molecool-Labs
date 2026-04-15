'use client';
// src/components/navbar.jsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const NavDropdown = ({ title, name, activeDropdown, toggleDropdown, children, rightAlign = false }) => (
  <div className="relative ml-1">
    <button
      onClick={() => toggleDropdown(name)}
      className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150 flex items-center gap-1 focus:outline-none hover:bg-gray-800 ${activeDropdown === name ? 'text-white bg-gray-800' : ''}`}
    >
      {title}
      <svg
        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeDropdown === name ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {activeDropdown === name && (
      <div className={`absolute ${rightAlign ? 'right-0' : 'left-0'} mt-4 w-60 !bg-[#0a0a0a] rounded-[2rem] overflow-hidden z-50 py-3 border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.8)] animate-fadeIn`}>
        {children}
      </div>
    )}




  </div>
);

const NavLinkItem = ({ href, onClick, children, className }) => (
  <Link href={href} onClick={onClick} className={`block px-6 py-4 text-sm font-black uppercase tracking-widest text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 ${className || ''}`}>
    {children}
  </Link>
);



const NavBar = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [activeDropdown, setActiveDropdown] = useState(null); // 'discover', 'labs', 'tools', 'engine', 'user'
  const navRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setActiveDropdown(null);
    await logout();
    router.push('/login');
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeDropdown = () => setActiveDropdown(null);

  return (
    <nav className="glass-card !bg-white/5 backdrop-blur-3xl border-b border-white/10 text-white shadow-2xl sticky top-0 z-40 transition-all duration-500 rounded-none border-x-0 border-t-0" ref={navRef}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo/Project Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" onClick={closeDropdown} className="text-2xl font-extrabold text-blue-400 hover:text-blue-300 transition duration-150">
              MOLECOOLS LAB
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">

            {/* Discover */}
            <NavDropdown title="Discover ⚛️" name="discover" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/periodic-table" onClick={closeDropdown}>Periodic Table ⚛️</NavLinkItem>
              <NavLinkItem href="/compounds" onClick={closeDropdown}>Molecules 🧬</NavLinkItem>
              <NavLinkItem href="/compounds/builder" onClick={closeDropdown}>Builder 🏗️</NavLinkItem>
              <NavLinkItem href="/compounds/isomer-challenge" onClick={closeDropdown}>Challenge 🧩</NavLinkItem>
              <NavLinkItem href="/orbitals" onClick={closeDropdown} className="font-bold text-blue-400">Atomic Orbitals ⚛️</NavLinkItem>
              <NavLinkItem href="/dna" onClick={closeDropdown}>Genome 🧬</NavLinkItem>
            </NavDropdown>

            {/* Labs */}
            <NavDropdown title="Labs 🧪" name="labs" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/chemical-reactions" onClick={closeDropdown}>Reaction Lab ⚗️</NavLinkItem>
            </NavDropdown>

            {/* Tools */}
            <NavDropdown title="Tools 🔬" name="tools" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/apparatus" onClick={closeDropdown}>Apparatus 🧪</NavLinkItem>
              <NavLinkItem href="/apparatus-editor" onClick={closeDropdown}>Editor 🛠️</NavLinkItem>
              <NavLinkItem href="/element-editor" onClick={closeDropdown} className="font-bold text-yellow-500">Element Editor 📝</NavLinkItem>
              <NavLinkItem href="/apparatus-compat" onClick={closeDropdown}>Compatibility 🔗</NavLinkItem>
              <NavLinkItem href="/compounds/edit-angles" onClick={closeDropdown}>Geometry 📐</NavLinkItem>
              <NavLinkItem href="/reactant-config" onClick={closeDropdown}>Reactants 🧪</NavLinkItem>
              <NavLinkItem href="/reaction-refiner" onClick={closeDropdown}>Refiner 🎨</NavLinkItem>
            </NavDropdown>

            {/* Engine Phases */}
            <NavDropdown title="Engine ⚙️" name="engine" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/engine/reactions" onClick={closeDropdown} className="font-bold border-b border-white/5 mb-1 pb-2 text-white/40">Management ⚙️</NavLinkItem>
              <NavLinkItem href="/engine/atoms" onClick={closeDropdown}>Phase 1: Reactants ⚛️</NavLinkItem>
              <NavLinkItem href="/engine/actions" className="font-bold text-blue-300" onClick={closeDropdown}>Phase 2: Visuals 🎨</NavLinkItem>
            </NavDropdown>


            {/* Auth Section */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
            ) : user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => toggleDropdown('user')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 focus:outline-none tap-animation ${activeDropdown === 'user' ? 'border-white/50 bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                >

                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? 'User'}
                      className="w-8 h-8 rounded-full ring-2 ring-blue-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
                      {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <svg
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${activeDropdown === 'user' ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {activeDropdown === 'user' && (
                  <div className="absolute right-0 mt-4 w-72 !bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden z-50 border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.8)] animate-fadeIn">
                    <div className="px-7 py-6 border-b border-white/10 bg-white/5">
                      <p className="text-white font-black text-base tracking-tight truncate">{user.displayName}</p>
                      <p className="text-white/60 text-[11px] truncate uppercase tracking-[0.2em] font-black mt-1">{user.email}</p>
                    </div>


                    <button
                      onClick={() => { closeDropdown(); router.push('/profile'); }}
                      className="w-full text-left px-7 py-5 text-sm font-black uppercase tracking-widest text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center gap-4 tap-animation"
                    >
                      <span className="text-lg opacity-60">👤</span> My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-7 py-5 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-white/5 hover:text-red-400 transition-all duration-300 flex items-center gap-4 border-t border-white/10 tap-animation"
                    >
                      <span className="text-lg opacity-60">🚪</span> Sign Out
                    </button>
                  </div>
                )}



              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="ml-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 active:scale-90 text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-xl tap-animation"
              >
                Sign In
              </button>

            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;