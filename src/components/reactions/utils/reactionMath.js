// src/components/reactions/ReactionViewer.jsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sparkles } from '@react-three/drei';
import MacroView from './views/MacroView';
import MicroView from './views/MicroView';
import NanoView from './views/NanoView';

const ReactionViewer = ({ reaction, viewMode, progress }) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        {/* Render the specific mode */}
        {viewMode === 'MACRO' && <MacroView reaction={reaction} progress={progress} />}
        
        {viewMode === 'MICRO' && <MicroView reaction={reaction} progress={progress} />}
        
        {viewMode === 'NANO' && <NanoView reaction={reaction} progress={progress} />}

        {/* Common Effects */}
        <Sparkles count={50} scale={10} size={2} speed={0.4} opacity={0.2} color="#ffffff" />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default ReactionViewer;