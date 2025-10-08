// src/app/ar-vr/page.jsx
'use client'; 

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper component to display a single marker card
const MarkerCard = ({ marker }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 hover:border-cyan-500 transition duration-300">
      <h3 className="text-xl font-bold text-cyan-400 mb-1 capitalize">{marker.name}</h3>
      <p className="text-sm text-gray-400 mb-2 italic">Type: {marker.type}</p>
      
      <div className="space-y-1 text-sm text-gray-300">
        <p><strong>Category:</strong> <span className="capitalize">{marker.category}</span></p>
        {/* You can add more details from your document structure here */}
      </div>

      <a 
        href={marker.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-4 inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded transition duration-200 text-sm"
      >
        View Marker Details
      </a>
    </div>
  );
};

const ARVRPage = () => {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all documents from the 'ARMarkers' collection
        const q = query(collection(db, 'ARMarkers'));
        const querySnapshot = await getDocs(q);
        
        const markersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setMarkers(markersData);

      } catch (err) {
        console.error("Error fetching AR markers: ", err);
        setError("Failed to load markers. Check your Firebase connection and rules.");
      } finally {
        setLoading(false);
      }
    };

    fetchMarkers();
  }, []); 

  // Categorize the markers
  const compounds = markers.filter(m => m.category?.toLowerCase() === 'compound');
  const reactions = markers.filter(m => m.category?.toLowerCase() === 'reaction');

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black text-white flex justify-center items-center">
        <p className="text-xl text-cyan-400 animate-pulse">Loading AR/VR Marker Data... 🌐</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black text-red-400 flex justify-center items-center p-8">
        <p className="text-xl border border-red-400 p-4 rounded-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black text-white p-6 sm:p-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-cyan-400">
          AR/VR Marker Labs
        </h1>
        <p className="text-gray-400 mt-2">
          Select a marker below to view its details and access the AR/VR visualization.
        </p>
      </header>
      
      <div className="max-w-7xl mx-auto">
        
        {/* Reactions Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-cyan-600 pb-2">
            Chemical Reactions 💥
          </h2>
          {reactions.length === 0 ? (
            <p className="text-gray-500">No reaction markers found in the database.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reactions.map(marker => (
                <MarkerCard key={marker.id} marker={marker} />
              ))}
            </div>
          )}
        </section>

        {/* Compounds Section (Assuming 'compound' is the other category) */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 border-b-2 border-cyan-600 pb-2">
            Compounds & Molecules 🧬
          </h2>
          {compounds.length === 0 ? (
            <p className="text-gray-500">No compound markers found in the database.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compounds.map(marker => (
                <MarkerCard key={marker.id} marker={marker} />
              ))}
            </div>
          )}
        </section>

        {/* Note about other markers */}
        {markers.filter(m => m.category?.toLowerCase() !== 'compound' && m.category?.toLowerCase() !== 'reaction').length > 0 && (
            <p className="text-gray-600 mt-10 text-center text-sm">
                * Note: Some markers were found but did not fit the 'compound' or 'reaction' categories.
            </p>
        )}
      </div>
    </div>
  );
};

export default ARVRPage;