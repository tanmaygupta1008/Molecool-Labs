// // src/components/reactions/ReactionViewer.jsx
// 'use client';

// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Environment, Sparkles } from '@react-three/drei';
// import MacroView from './views/MacroView';
// import MicroView from './views/MicroView';
// import NanoView from './views/NanoView';

// const ReactionViewer = ({ reaction, viewMode, progress }) => {
//   return (
//     <div className="w-full h-full bg-black">
//       <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
//         <Environment preset="studio" />
//         <ambientLight intensity={0.5} />
//         <pointLight position={[10, 10, 10]} intensity={1} />

//         {/* Render the specific mode */}
//         {viewMode === 'MACRO' && <MacroView reaction={reaction} progress={progress} />}
        
//         {viewMode === 'MICRO' && <MicroView reaction={reaction} progress={progress} />}
        
//         {viewMode === 'NANO' && <NanoView reaction={reaction} progress={progress} />}

//         {/* Common Effects */}
//         <Sparkles count={50} scale={10} size={2} speed={0.4} opacity={0.2} color="#ffffff" />
//         <OrbitControls />
//       </Canvas>
//     </div>
//   );
// };

// export default ReactionViewer;






// src/components/reactions/ReactionViewer.jsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import MacroView from './views/MacroView';
import MicroView from './views/MicroView';
import NanoView from './views/NanoView';

// ⬅️ FIX: Added 'environment' to props
const ReactionViewer = ({ reaction, viewMode, progress, environment }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        
        <Environment preset="city" blur={1} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 5, -10]} intensity={0.5} />

        {/* View Modes */}
        {viewMode === 'MACRO' && <MacroView reaction={reaction} progress={progress} />}
        
        {viewMode === 'MICRO' && (
            <MicroView 
                reaction={reaction} 
                progress={progress} 
                environment={environment} // ⬅️ FIX: Pass environment to MicroView for physics
            />
        )}
        
        {viewMode === 'NANO' && <NanoView reaction={reaction} progress={progress} />}

        <OrbitControls enablePan={true} maxDistance={20} minDistance={5} />

        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={1.2} 
                mipmapBlur 
                intensity={0.5} 
                radius={0.6} 
            />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default ReactionViewer;