// // components/Atom3DModel.jsx
// // Must use 'use client' since it relies on browser/WebGL features

// 'use client';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Sphere, Ring } from '@react-three/drei';
// import { useMemo } from 'react';

// const Shells = ({ numElectrons }) => {
//   // A simplified rule for shells (2, 8, 18, 32, 50, 72, 98)
//   const shellCapacities = [2, 8, 18, 32, 32, 18, 8];
//   let remainingElectrons = numElectrons;
//   const shellRadii = [];
//   let radius = 1.5;

//   // Calculate electron configuration and radii
//   for (const capacity of shellCapacities) {
//     if (remainingElectrons > 0) {
//       const electronsInShell = Math.min(remainingElectrons, capacity);
//       shellRadii.push({ radius, count: electronsInShell });
//       remainingElectrons -= electronsInShell;
//       radius += 1.0;
//     } else {
//       break;
//     }
//   }

//   return shellRadii.map(({ radius, count }, index) => {
//     const electronPositions = [];
//     // Place electrons evenly on the ring
//     for (let i = 0; i < count; i++) {
//       const angle = (i / count) * Math.PI * 2;
//       electronPositions.push([
//         Math.cos(angle) * radius,
//         Math.sin(angle) * radius,
//         0,
//       ]);
//     }

//     return (
//       <group key={index}>
//         {/* Orbit Ring */}
//         <Ring args={[radius - 0.01, radius, 64]} material-side={2} rotation={[0, 0, Math.PI / 2]} >
//             <meshBasicMaterial attach="material" color="white" transparent opacity={0.3} />
//         </Ring>

//         {/* Electrons */}
//         {electronPositions.map((pos, i) => (
//           <Sphere key={i} position={pos} args={[0.08, 16, 16]}>
//             <meshStandardMaterial color="cyan" />
//           </Sphere>
//         ))}
//       </group>
//     );
//   });
// };


// const Atom3DModel = ({ element }) => {
//   const numElectrons = element.number; // For a neutral atom, electrons = protons
//   const nucleusColor = element.category.includes('metal') ? 'gold' : 'hotpink';

//   return (
//     <div className="h-full w-full bg-black rounded-lg">
//       <Canvas camera={{ position: [0, 0, 8] }}>
//         <ambientLight intensity={0.5} />
//         <pointLight position={[10, 10, 10]} intensity={1.5} />
        
//         {/* Nucleus */}
//         <Sphere args={[0.5, 32, 32]}>
//           <meshStandardMaterial color={nucleusColor} />
//         </Sphere>

//         {/* Electron Shells and Electrons */}
//         <Shells numElectrons={numElectrons} />
        
//         <OrbitControls enableZoom={true} enablePan={false} />
//       </Canvas>
//     </div>
//   );
// };

// export default Atom3DModel;





// src/components/Atom3DModel.jsx
'use client';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Suspense } from 'react';

// Component to load and display the GLB model
const Model = ({ url }) => {
  // Use the useLoader hook with suspense to load the GLB model
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} scale={3} />; // Adjust scale as necessary
};

const LoadingFallback = () => (
  <Html center>
    <div className="text-cyan-400 font-bold">Loading 3D Model...</div>
  </Html>
);

const Atom3DModel = ({ glbUrl }) => {
  if (!glbUrl) {
    return (
      <div className="h-full w-full bg-gray-900 flex items-center justify-center rounded-lg">
        <p className="text-red-400">3D Model URL not available for this element.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full bg-black rounded-lg">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* Environmental lighting */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* Add a light environment for better model visibility */}
        <Environment preset="city" /> 
        
        <Suspense fallback={<LoadingFallback />}>
          <Model url={glbUrl} />
        </Suspense>

        {/* User controls */}
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={5}
        />
      </Canvas>
    </div>
  );
};

export default Atom3DModel;