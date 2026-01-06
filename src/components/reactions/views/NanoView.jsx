// // src/components/reactions/views/NanoView.jsx
// import { useRef, useMemo } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Sphere, Line, Html } from '@react-three/drei';
// import * as THREE from 'three';

// // An Atom with electron shells
// const NanoAtom = ({ element, position, electrons, showTransfer, transferTarget, progress }) => {
//     return (
//         <group position={position}>
//             {/* Nucleus */}
//             <Sphere args={[0.4, 32, 32]}>
//                 <meshStandardMaterial color={element === 'Na' ? '#ffaa00' : '#00aaff'} emissiveIntensity={0.5} />
//             </Sphere>
//             <Html position={[0, 0.6, 0]} center><span className="text-xs font-bold text-white">{element}</span></Html>

//             {/* Electron Shell (Ring) */}
//             <mesh rotation={[Math.PI / 2, 0, 0]}>
//                 <ringGeometry args={[0.9, 0.95, 32]} />
//                 <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} opacity={0.3} transparent />
//             </mesh>

//             {/* Valence Electrons */}
//             {Array.from({ length: electrons }).map((_, i) => {
//                 // If this is the transferring electron
//                 if (showTransfer && i === electrons - 1) {
//                     return (
//                         <TransferElectron 
//                             key={i} 
//                             start={[1, 0, 0]} // Relative to atom
//                             target={transferTarget} // Global target position
//                             parentPos={position}
//                             progress={progress}
//                         />
//                     )
//                 }
//                 const angle = (i / electrons) * Math.PI * 2;
//                 return (
//                     <mesh key={i} position={[Math.cos(angle), 0, Math.sin(angle)]}>
//                         <sphereGeometry args={[0.08, 16, 16]} />
//                         <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
//                     </mesh>
//                 )
//             })}
//         </group>
//     );
// };

// const TransferElectron = ({ start, target, parentPos, progress }) => {
//     const ref = useRef();
//     useFrame(() => {
//         if(ref.current) {
//              // Calculate global start pos
//              const globalStart = new THREE.Vector3(...start).add(new THREE.Vector3(...parentPos));
//              const globalTarget = new THREE.Vector3(...target);
             
//              // Move electron based on progress
//              ref.current.position.lerpVectors(globalStart, globalTarget, progress);
//         }
//     })
//     return (
//         <mesh ref={ref} scale={1.5}> {/* Slightly larger transferring electron */}
//              <sphereGeometry args={[0.08, 16, 16]} />
//              <meshStandardMaterial color="#ffff00" emissive="#ff0000" emissiveIntensity={2} />
//         </mesh>
//     )
// }

// const NanoView = ({ reaction, progress }) => {
//     // Example: Showing Electron Transfer (Ionic) or Sharing (Covalent)
//     // This simplifies the view to just 2 interacting atoms for clarity
    
//     return (
//         <group>
//              <Html position={[0, 3, 0]} center>
//                 <div className="text-white text-sm bg-black/50 p-2 rounded">
//                     Observing Valence Electron Transfer
//                 </div>
//             </Html>

//             {/* Example: Na giving electron to Cl */}
//             <NanoAtom 
//                 element="Na" 
//                 position={[-2, 0, 0]} 
//                 electrons={1} 
//                 showTransfer={true} 
//                 transferTarget={[2, 0, 0]} // Target is the other atom position
//                 progress={progress}
//             />
            
//             <NanoAtom 
//                 element="Cl" 
//                 position={[2, 0, 0]} 
//                 electrons={7} 
//             />
            
//             {/* Visual Arrow showing direction */}
//             {progress < 0.1 && (
//                 <Line 
//                     points={[[-1, 0, 0], [1, 0, 0]]} 
//                     color="white" 
//                     lineWidth={2} 
//                     dashed 
//                 />
//             )}
//         </group>
//     );
// };

// export default NanoView;







// src/components/reactions/views/NanoView.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Trail, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- SHARED COMPONENTS ---

const Electron = ({ position, color = "yellow", orbitRadius = 0, speed = 1, phase = 0, center = [0,0,0] }) => {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current && orbitRadius > 0) {
            const t = state.clock.elapsedTime * speed + phase;
            // Simple orbital mechanics relative to center
            ref.current.position.x = center[0] + Math.cos(t) * orbitRadius;
            ref.current.position.z = center[2] + Math.sin(t) * orbitRadius;
            ref.current.position.y = center[1] + Math.sin(t * 2) * (orbitRadius * 0.3); // Wobbly orbit
        }
    });

    return (
        <group position={orbitRadius === 0 ? position : [0,0,0]}>
            <mesh ref={ref}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

const Nucleus = ({ element, color, size = 0.4, label, charge = "" }) => (
    <group>
        <Sphere args={[size, 32, 32]}>
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </Sphere>
        {/* Glow */}
        <Sphere args={[size * 1.5, 32, 32]}>
            <meshBasicMaterial color={color} transparent opacity={0.2} />
        </Sphere>
        <Html position={[0, size + 0.5, 0]} center>
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border border-white/20">
                    {element}
                    <sup className="text-yellow-400 ml-0.5">{charge}</sup>
                </span>
                {label && <span className="text-[10px] text-gray-300 mt-1">{label}</span>}
            </div>
        </Html>
    </group>
);

const OrbitalRing = ({ radius, opacity = 0.1 }) => (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
);

// --- SCENARIO 1: IONIC BONDING (e.g., Solvay / NaCl) ---
const IonicScenario = ({ progress }) => {
    // Na (Left) transfers electron to Cl (Right)
    const electronPos = new THREE.Vector3();
    const start = new THREE.Vector3(-1.5, 0, 1); // Orbiting Na
    const end = new THREE.Vector3(1.5, 0, 1);   // Orbiting Cl
    
    // Calculate electron position based on progress
    electronPos.lerpVectors(start, end, progress);
    
    // Charge indicators
    const naCharge = progress > 0.5 ? "+" : "";
    const clCharge = progress > 0.5 ? "-" : "";

    return (
        <group>
            {/* Context Label */}
            <Html position={[0, 3, 0]} center>
                <div className="text-center">
                    <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-widest">Ionic Mechanism</h3>
                    <p className="text-white text-xs bg-black/60 px-3 py-1 rounded-full mt-1 border border-cyan-500/30">
                        Electron Transfer: Sodium <span className="text-yellow-400">→</span> Chlorine
                    </p>
                </div>
            </Html>

            {/* Sodium Atom */}
            <group position={[-2, 0, 0]}>
                <Nucleus element="Na" color="#ffaa00" size={0.5} charge={naCharge} />
                <OrbitalRing radius={1.2} opacity={progress > 0.5 ? 0.05 : 0.3} /> {/* Shell fades after loss */}
                {/* Inner Electrons (Static) */}
                <Electron position={[0.4, 0, 0.4]} orbitRadius={0.6} speed={2} center={[-2,0,0]} />
                <Electron position={[-0.4, 0, -0.4]} orbitRadius={0.6} speed={2} phase={1} center={[-2,0,0]} />
            </group>

            {/* Chlorine Atom */}
            <group position={[2, 0, 0]}>
                <Nucleus element="Cl" color="#00aaff" size={0.6} charge={clCharge} />
                <OrbitalRing radius={1.4} opacity={0.3} />
                {/* Valence Electrons (7 existing) */}
                {Array.from({ length: 7 }).map((_, i) => (
                    <Electron 
                        key={i} 
                        orbitRadius={1.4} 
                        speed={1.5} 
                        phase={i} 
                        center={[2,0,0]} 
                    />
                ))}
            </group>

            {/* THE TRANSFERRING ELECTRON */}
            <Trail width={1} length={4} color="#ffff00" attenuation={(t) => t * t}>
                <mesh position={electronPos}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color="#ffff00" />
                </mesh>
            </Trail>
            
            {/* Electric Force Lines appearing after transfer */}
            {progress > 0.6 && (
                <Float speed={5} rotationIntensity={0} floatIntensity={0}>
                    <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
                         <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
                         <meshBasicMaterial color="#ffff00" transparent opacity={0.3 * progress} />
                    </mesh>
                    <Html position={[0, -0.5, 0]} center>
                        <span className="text-[10px] text-yellow-400 font-bold">Electrostatic Attraction</span>
                    </Html>
                </Float>
            )}
        </group>
    );
};

// --- SCENARIO 2: COVALENT BONDING (e.g., Methane/Haber) ---
const CovalentScenario = ({ progress }) => {
    // Two atoms approaching and merging orbitals
    const dist = THREE.MathUtils.lerp(3, 1.2, progress);
    
    return (
        <group>
             <Html position={[0, 3, 0]} center>
                <div className="text-center">
                    <h3 className="text-green-400 font-bold text-sm uppercase tracking-widest">Covalent Mechanism</h3>
                    <p className="text-white text-xs bg-black/60 px-3 py-1 rounded-full mt-1 border border-green-500/30">
                        Orbital Overlap: Sharing Electrons
                    </p>
                </div>
            </Html>

            {/* Atom A */}
            <group position={[-dist / 2, 0, 0]}>
                <Nucleus element="A" color="#aaaaaa" size={0.4} />
                {/* Orbital Cloud A */}
                <Sphere args={[1, 32, 32]}>
                    <meshStandardMaterial 
                        color="#00ffaa" 
                        transparent 
                        opacity={0.1 + (progress * 0.2)} 
                        roughness={0}
                    />
                </Sphere>
                {/* Electron A - Change orbit path based on progress */}
                <Electron 
                    orbitRadius={progress > 0.8 ? 1.5 : 0.8} // Orbit expands to encompass both
                    center={progress > 0.8 ? [dist/2, 0, 0] : [0,0,0]} // Center shifts to midpoint
                    speed={3} 
                />
            </group>

            {/* Atom B */}
            <group position={[dist / 2, 0, 0]}>
                <Nucleus element="B" color="#ffffff" size={0.3} />
                {/* Orbital Cloud B */}
                <Sphere args={[0.9, 32, 32]}>
                    <meshStandardMaterial 
                        color="#00ffaa" 
                        transparent 
                        opacity={0.1 + (progress * 0.2)} 
                        roughness={0}
                    />
                </Sphere>
                 {/* Electron B */}
                 <Electron 
                    orbitRadius={progress > 0.8 ? 1.5 : 0.7} 
                    center={progress > 0.8 ? [-dist/2, 0, 0] : [0,0,0]} 
                    speed={3}
                    phase={2} 
                />
            </group>

            {/* Shared Region Highlight */}
            {progress > 0.8 && (
                 <group>
                    <Html position={[0, -1.5, 0]} center>
                        <span className="text-xs text-green-300 font-bold">Shared Pair</span>
                    </Html>
                 </group>
            )}
        </group>
    );
};

// --- MAIN COMPONENT ---
const NanoView = ({ reaction, progress }) => {
    // Logic to choose scenario
    // Solvay Process involves ionic salt formation (NaCl-like steps), so we use Ionic.
    // Others are largely covalent (gas phase molecules).
    const isIonic = reaction.id === 'solvay_process';

    return (
        <group>
            {isIonic ? (
                <IonicScenario progress={progress} />
            ) : (
                <CovalentScenario progress={progress} />
            )}
        </group>
    );
};

export default NanoView;