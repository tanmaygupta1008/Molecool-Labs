// src/components/NavBar.jsx
import Link from 'next/link';

const NavBar = () => {
  return (
    // The main container for the navigation bar
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
            
            {/* Periodic Table Link */}
            <Link 
              href="/periodic-table" 
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Periodic Table
            </Link>
            
            {/* AR/VR Link (Assuming a future route) */}
            <Link 
              href="/ar-vr" 
              className="bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              AR/VR 👓
            </Link>
            
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;