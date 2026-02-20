'use client';
// src/components/navbar.jsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const NavBar = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-cyan-800 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo/Project Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-cyan-400 hover:text-cyan-300 transition duration-150">
              MOLECOOL LABS 🧪
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">

            <Link
              href="/periodic-table"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Periodic Table
            </Link>

            <Link
              href="/compounds"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Compounds 🧬
            </Link>

            <Link
              href="/compound-editor"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Edit Angles 📐
            </Link>

            <Link
              href="/chemical-reactions"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Reaction Lab ⚗️
            </Link>

            <Link
              href="/reaction-refiner"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Refiner 🎨
            </Link>

            <Link
              href="/fluid-simulation"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Fluid Sim 💧
            </Link>

            <Link
              href="/apparatus"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Apparatus 🧪
            </Link>

            <Link
              href="/apparatus-editor"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Editor 🛠️
            </Link>

            <Link
              href="/reactant-config"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Reactants 🧪
            </Link>

            <Link
              href="/ar-vr"
              className="bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-2 rounded-md text-base font-medium transition duration-150 ml-2"
            >
              AR/VR 👓
            </Link>

            {/* ── Auth Section ── */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              /* User Avatar + Dropdown */
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1 rounded-full border border-cyan-700 hover:border-cyan-400 transition-colors duration-150 focus:outline-none"
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
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-gray-900 border border-cyan-800 rounded-xl shadow-2xl shadow-cyan-900/40 overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                    {/* Profile link */}
                    <button
                      onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-100 flex items-center gap-2"
                    >
                      <span>👤</span> My Profile
                    </button>
                    {/* Logout */}
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
              /* Sign In Button */
              <button
                onClick={() => router.push('/login')}
                className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-cyan-900/40"
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