// // src/components/NavBar.jsx
// import Link from 'next/link';

// const NavBar = () => {
//   return (
//     <nav className="bg-gray-900 border-b border-cyan-800 text-white shadow-lg sticky top-0 z-40">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">

//           {/* Logo/Project Name */}
//           <div className="flex-shrink-0 flex items-center">
//             <Link href="/" className="text-2xl font-extrabold text-cyan-400 hover:text-cyan-300 transition duration-150">
//                 MOLECOOL LABS 🧪
//             </Link>
//           </div>

//           {/* Navigation Links */}
//           <div className="flex items-center space-x-4">

//             <Link 
//               href="/periodic-table" 
//               className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
//             >
//               Periodic Table
//             </Link>

//             {/* ⬅️ NEW COMPOUND LINK */}
//             <Link 
//               href="/compounds" 
//               className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
//             >
//               Compounds 🧬
//             </Link>

//             <Link 
//               href="/ar-vr" 
//               className="bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-2 rounded-md text-base font-medium transition duration-150"
//             >
//               AR/VR 👓
//             </Link>

//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default NavBar;






// src/components/NavBar.jsx
import Link from 'next/link';

const NavBar = () => {
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

            {/* ⬅️ NEW: Angle Editor Link */}
            <Link
              href="/compound-editor"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Edit Angles 📐
            </Link>

            {/* ⬅️ NEW: Reaction Lab Link */}
            <Link
              href="/chemical-reactions"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-base font-medium transition duration-150"
            >
              Reaction Lab ⚗️
            </Link>

            {/* ⬅️ NEW: Apparatus Gallery Link */}
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
              href="/ar-vr"
              className="bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-2 rounded-md text-base font-medium transition duration-150 ml-2"
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