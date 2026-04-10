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
      <div className={`absolute ${rightAlign ? 'right-0' : 'left-0'} mt-2 w-48 bg-[#0f172a]/90 backdrop-blur-lg border border-cyan-500/30 rounded-xl shadow-2xl shadow-emerald-900/30 overflow-hidden z-50 py-1`}>
        {children}
      </div>
    )}
  </div>
);

const NavLinkItem = ({ href, onClick, children, className }) => (
  <Link href={href} onClick={onClick} className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-100 ${className || ''}`}>
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
    <nav className="bg-[#0f172a]/60 backdrop-blur-xl border-b border-sky-500/20 text-white shadow-lg sticky top-0 z-40 transition-colors" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo/Project Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" onClick={closeDropdown} className="text-2xl font-extrabold text-cyan-400 hover:text-cyan-300 transition duration-150">
              MOLECOOL LABS 🧪
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">

            {/* Discover */}
            <NavDropdown title="Discover 🔍" name="discover" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/periodic-table" onClick={closeDropdown}>Periodic Table</NavLinkItem>
              <NavLinkItem href="/compounds" onClick={closeDropdown}>Compounds Viewer 🧬</NavLinkItem>
              <NavLinkItem href="/compounds/builder" onClick={closeDropdown}>Molecule Builder 🏗️</NavLinkItem>
              <NavLinkItem href="/compounds/isomer-challenge" onClick={closeDropdown}>Isomer Challenge 🧩</NavLinkItem>
              <NavLinkItem href="/dna" onClick={closeDropdown}>DNA 🧬</NavLinkItem>
            </NavDropdown>

            {/* Labs */}
            <NavDropdown title="Labs ⚗️" name="labs" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/chemical-reactions" onClick={closeDropdown}>Reaction Lab ⚗️</NavLinkItem>
              <NavLinkItem href="/fluid-simulation" onClick={closeDropdown}>Fluid Sim 💧</NavLinkItem>
              <NavLinkItem href="/ar-vr" onClick={closeDropdown}>AR/VR 👓</NavLinkItem>
            </NavDropdown>

            {/* Tools */}
            <NavDropdown title="Tools 🛠️" name="tools" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/apparatus" onClick={closeDropdown}>Apparatus 🧪</NavLinkItem>
              <NavLinkItem href="/apparatus-editor" onClick={closeDropdown}>Apparatus Editor 🛠️</NavLinkItem>
              <NavLinkItem href="/apparatus-compat" onClick={closeDropdown}>Snap Compatibility 🔗</NavLinkItem>
              <NavLinkItem href="/compounds/edit-angles" onClick={closeDropdown}>Edit Angles 📐</NavLinkItem>
              <NavLinkItem href="/reactant-config" onClick={closeDropdown}>Reactant Config 🧪</NavLinkItem>
              <NavLinkItem href="/reaction-refiner" onClick={closeDropdown}>Reaction Refiner 🎨</NavLinkItem>
            </NavDropdown>

            {/* Engine Phases */}
            <NavDropdown title="Engine ⚙️" name="engine" activeDropdown={activeDropdown} toggleDropdown={toggleDropdown}>
              <NavLinkItem href="/engine/reactions" onClick={closeDropdown} className="font-bold border-b border-gray-800 mb-1 pb-2">Phase 0: Reactions</NavLinkItem>
              <NavLinkItem href="/engine/atoms" onClick={closeDropdown}>Phase 1: Reactants</NavLinkItem>
              <NavLinkItem href="/engine/actions" className="font-bold text-cyan-300" onClick={closeDropdown}>Phase 2: Visuals</NavLinkItem>
              <NavLinkItem href="/engine/electrons" onClick={closeDropdown}>Phase 4: Electrons</NavLinkItem>
            </NavDropdown>

            {/* Auth Section */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ml-2" />
            ) : user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => toggleDropdown('user')}
                  className={`flex items-center gap-2 px-2 py-1 rounded-full border transition-colors duration-150 focus:outline-none ${activeDropdown === 'user' ? 'border-cyan-400 bg-gray-800' : 'border-cyan-700 hover:border-cyan-400'}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? 'User'}
                      className="w-8 h-8 rounded-full ring-2 ring-cyan-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-white font-bold text-sm">
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
                  <div className="absolute right-0 mt-2 w-60 bg-[#0f172a]/90 backdrop-blur-lg border border-cyan-500/30 rounded-xl shadow-2xl shadow-emerald-900/30 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { closeDropdown(); router.push('/profile'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-100 flex items-center gap-2"
                    >
                      <span>👤</span> My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors duration-100 flex items-center gap-2 border-t border-gray-800"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 active:scale-95 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-emerald-900/30"
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