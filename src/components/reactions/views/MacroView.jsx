// // src/components/reactions/views/MacroView.jsx
// import { useRef, useMemo, useState } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Instance, Instances } from '@react-three/drei';
// import * as THREE from 'three';

// // A single particle that rises and fades
// const FireParticle = ({ progress }) => {
//     const ref = useRef();
//     // Random initial positions and speeds
//     const { position, speed, scale, offset } = useMemo(() => ({
//         position: [Math.random() * 2 - 1, Math.random() * 2, Math.random() * 2 - 1],
//         speed: Math.random() * 0.05 + 0.02,
//         scale: Math.random() * 0.5 + 0.2,
//         offset: Math.random() * 100
//     }), []);

//     useFrame((state) => {
//         if (!ref.current) return;
        
//         // Only animate if reaction is active (between 0.1 and 0.9 progress)
//         const isActive = progress > 0.1 && progress < 0.9;
        
//         if (isActive) {
//             // Move up
//             ref.current.position.y += speed;
//             // Reset if too high
//             if (ref.current.position.y > 3) ref.current.position.y = 0;
            
//             // Flicker scale based on time
//             const flicker = Math.sin(state.clock.elapsedTime * 10 + offset) * 0.1 + 1;
//             ref.current.scale.setScalar(scale * flicker);
//         } else {
//             // Hide particle if not reacting
//             ref.current.scale.setScalar(0);
//             ref.current.position.y = 0;
//         }
//     });

//     return <Instance ref={ref} position={position} />;
// };

// const MacroView = ({ reaction, progress }) => {
//     // Calculate intensity of the light/fire based on progress
//     // Peak intensity at 50% progress
//     const intensity = useMemo(() => {
//         if (progress < 0.1 || progress > 0.9) return 0;
//         // Parabola peaking at 0.5
//         return Math.sin(Math.PI * (progress - 0.1) / 0.8);
//     }, [progress]);

//     // Material color changes: Grey (Reactants) -> Orange/White (Burning) -> White/Grey (Ash)
//     const baseColor = new THREE.Color();
//     if (progress < 0.5) {
//         baseColor.set('#808080').lerp(new THREE.Color('#ffaa00'), progress * 2);
//     } else {
//         baseColor.set('#ffaa00').lerp(new THREE.Color('#eeeeee'), (progress - 0.5) * 2);
//     }

//     return (
//         <group>
//             {/* The "Substance" Mesh (e.g., Magnesium Ribbon or Fuel Pile) */}
//             <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
//                 <planeGeometry args={[4, 4, 32, 32]} />
//                 <meshStandardMaterial 
//                     color={baseColor} 
//                     roughness={0.8}
//                     displacementScale={0.2}
//                 />
//             </mesh>

//             {/* Dynamic Light Source (The fire light) */}
//             <pointLight 
//                 position={[0, 1, 0]} 
//                 intensity={intensity * 10} 
//                 distance={10} 
//                 color="#ffaa00" 
//             />
            
//             {/* Particle System for Fire/Smoke */}
//             {/* We use Instances for high performance */}
//             <Instances range={100}>
//                 <sphereGeometry args={[0.2, 8, 8]} />
//                 <meshBasicMaterial color="#ff5500" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
                
//                 {Array.from({ length: 50 }).map((_, i) => (
//                     <FireParticle key={i} progress={progress} />
//                 ))}
//             </Instances>

//             {/* Ambient visual cue */}
//             {intensity > 0.1 && (
//                 <mesh position={[0, 0, 0]}>
//                     <sphereGeometry args={[intensity * 1.5, 32, 32]} />
//                     <meshBasicMaterial color="#ffaa00" transparent opacity={intensity * 0.2} />
//                 </mesh>
//             )}
//         </group>
//     );
// };

// export default MacroView;








// src/components/reactions/views/MacroView.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, MeshTransmissionMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';

// Realistic Glass Shader Component
const TestTube = ({ children }) => (
    <group>
        {/* Glass Container */}
        <Cylinder args={[1.2, 1.2, 6, 32, 1, true]} position={[0, 0, 0]}>
            <MeshTransmissionMaterial 
                thickness={0.2} 
                roughness={0} 
                transmission={0.95} 
                ior={1.5} 
                chromaticAberration={0.02} 
                backside 
            />
        </Cylinder>
        {/* Rounded Bottom */}
        <mesh position={[0, -3, 0]}>
            <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <MeshTransmissionMaterial thickness={0.2} roughness={0} transmission={0.95} ior={1.5} backside />
        </mesh>
        {/* Rim */}
        <Cylinder args={[1.3, 1.3, 0.2, 32]} position={[0, 3, 0]}>
            <meshPhysicalMaterial color="white" transmission={0.9} roughness={0.1} opacity={0.5} transparent />
        </Cylinder>
        
        {/* Contents inside */}
        <group position={[0, -3, 0]}>
            {children}
        </group>
    </group>
);

const LiquidLayer = ({ color, height, label, opacity = 0.8, yOffset = 0 }) => {
    return (
        <group position={[0, height / 2 + yOffset, 0]}>
            <Cylinder args={[1.1, 1.1, height, 32]}>
                 <meshPhysicalMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity} 
                    metalness={0.1} 
                    roughness={0.2} 
                    clearcoat={1}
                 />
            </Cylinder>
            
            {/* 3D Label attached to the liquid */}
            <Html position={[1.5, 0, 0]} center transform distanceFactor={10}>
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm border border-white/20 whitespace-nowrap">
                    {label} ↗
                </div>
            </Html>
        </group>
    );
};

const MacroView = ({ reaction, progress }) => {
    // Determine visuals based on reaction config
    // We simulate a color change or phase change based on progress
    const { color } = reaction.macro; 
    
    // Example Logic: Reactants (Blue) -> Products (Green)
    // You would define these colors in your data file
    const startColor = new THREE.Color('#3b82f6'); // Blue (Like CuSO4)
    const endColor = new THREE.Color(color);       // Target Color
    
    const currentColor = startColor.clone().lerp(endColor, progress);

    return (
        <group>
            <TestTube>
                {/* Main Liquid Volume */}
                <LiquidLayer 
                    height={4} 
                    color={currentColor} 
                    label={progress < 0.5 ? "Reactant Solution" : "Product Solution"} 
                    yOffset={0}
                />
                
                {/* Precipitate forming at the bottom? */}
                {reaction.macro.type === 'precipitate' && (
                    <LiquidLayer 
                        height={1 * progress} 
                        color="#ffffff" 
                        label="Precipitate" 
                        opacity={1} 
                        yOffset={-1.5}
                    />
                )}
                
                {/* Bubbles if gas is evolving */}
                {reaction.macro.type === 'gas' && progress > 0.1 && progress < 0.9 && (
                    <Bubbles color="white" count={20} />
                )}
            </TestTube>
        </group>
    );
};

// Simple Bubbles Effect
const Bubbles = ({ count }) => {
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 1.8, Math.random() * 4, (Math.random() - 0.5) * 1.8]}>
                     <sphereGeometry args={[0.05, 8, 8]} />
                     <meshBasicMaterial color="white" opacity={0.5} transparent />
                </mesh>
            ))}
        </group>
    )
}

export default MacroView;