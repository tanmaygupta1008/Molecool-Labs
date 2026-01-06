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

const ReactionViewer = ({ reaction, viewMode, progress, environment }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black">
      {/* - dpr={[1, 2]}: Handles high-DPI screens (Retina)
         - antialias: true: Smooth edges
      */}
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
        
        {/* 🎥 CAMERA ADJUSTMENT:
           - position: [0, 0, 20] -> Moved back (was 12) to fit content between sidebars.
           - fov: 50 -> Slightly wider angle (was 45).
        */}
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={50} />
        
        <Environment preset="city" blur={1} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 5, -10]} intensity={0.5} />

        {/* --- VIEW MODES --- */}
        <group>
            {viewMode === 'MACRO' && <MacroView reaction={reaction} progress={progress} />}
            
            {viewMode === 'MICRO' && (
                <MicroView 
                    reaction={reaction} 
                    progress={progress} 
                    environment={environment} 
                />
            )}
            
            {viewMode === 'NANO' && <NanoView reaction={reaction} progress={progress} />}
        </group>

        {/* 🎮 CONTROLS ADJUSTMENT:
            - maxDistance: 35 -> Allows zooming out further (was 20).
            - minDistance: 5 -> Prevents clipping by zooming too close.
        */}
        <OrbitControls enablePan={true} maxDistance={35} minDistance={5} />

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