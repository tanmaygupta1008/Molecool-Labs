// // src/components/reactions/views/NanoView.jsx
// import { useRef, useMemo } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Sphere, Html, Trail, Float } from '@react-three/drei';
// import * as THREE from 'three';

// // --- SHARED COMPONENTS ---

// const Nucleus = ({ element, color, size = 0.4, label, charge = "", opacity = 1 }) => (
//     <group>
//         <Sphere args={[size, 32, 32]}>
//             <meshStandardMaterial 
//                 color={color} 
//                 roughness={0.2} 
//                 metalness={0.8} 
//                 transparent 
//                 opacity={opacity}
//             />
//         </Sphere>
//         {/* Glow Halo */}
//         <Sphere args={[size * 1.5, 32, 32]}>
//             <meshBasicMaterial 
//                 color={color} 
//                 transparent 
//                 opacity={opacity * 0.2} 
//                 depthWrite={false}
//             />
//         </Sphere>
//         <Html position={[0, size + 0.5, 0]} center>
//             <div className="flex flex-col items-center pointer-events-none">
//                 <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border border-white/20 transition-opacity" style={{ opacity: opacity }}>
//                     {element}
//                     <sup className={`ml-0.5 font-bold ${charge === '+' ? 'text-blue-400' : charge === '-' ? 'text-red-400' : 'text-yellow-400'}`}>
//                         {charge}
//                     </sup>
//                 </span>
//             </div>
//         </Html>
//     </group>
// );

// // Smart Electron that can switch between Local Orbit and Shared Orbit
// const AdaptiveElectron = ({ 
//     orbitCenter,       // [x,y,z] for local mode
//     sharedCenters,     // [[x,y,z], [x,y,z]] for shared mode
//     isShared = false,  // Trigger to switch modes
//     speed = 1, 
//     phase = 0,
//     color = "yellow"
// }) => {
//     const ref = useRef();
    
//     useFrame((state) => {
//         if (!ref.current) return;

//         const t = state.clock.elapsedTime * speed + phase;

//         if (isShared && sharedCenters) {
//             // --- INNOVATIVE SHARED ORBIT (FIGURE-8 / LEMNISCATE) ---
//             // Calculate center point between atoms
//             const c1 = new THREE.Vector3(...sharedCenters[0]);
//             const c2 = new THREE.Vector3(...sharedCenters[1]);
//             const mid = new THREE.Vector3().lerpVectors(c1, c2, 0.5);
//             const dist = c1.distanceTo(c2);
            
//             // Parametric Figure-8 Path wrapping both nuclei
//             const width = dist * 0.65; // Width of the loop
//             const height = 0.6;        // Height of the loop
            
//             // X oscillates wide (covering both atoms)
//             ref.current.position.x = mid.x + Math.cos(t) * width;
//             // Z oscillates faster (creating the twist/cross)
//             ref.current.position.z = mid.z + Math.sin(t * 2) * (width * 0.4); 
//             // Y adds some verticality for 3D depth
//             ref.current.position.y = mid.y + Math.sin(t * 3) * (height * 0.3);

//         } else {
//             // --- STANDARD LOCAL ORBIT ---
//             const r = 0.7; // Radius
//             ref.current.position.x = orbitCenter[0] + Math.cos(t) * r;
//             ref.current.position.z = orbitCenter[2] + Math.sin(t) * r;
//             ref.current.position.y = orbitCenter[1] + Math.sin(t * 2) * (r * 0.3);
//         }
//     });

//     return (
//          <Trail 
//             width={isShared ? 0.3 : 0.1} // Trail gets thicker when shared (highlighting the bond)
//             length={isShared ? 12 : 5}   // Trail gets longer when shared
//             color={color} 
//             attenuation={(t) => t * t}
//         >
//             <mesh ref={ref}>
//                 <sphereGeometry args={[0.08, 16, 16]} />
//                 <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
//             </mesh>
//         </Trail>
//     );
// }

// // --- SCENARIO 1: IONIC BONDING (Unchanged but cleaned up) ---
// const IonicScenario = ({ progress }) => {
//     const start = new THREE.Vector3(-1.5, 0, 0); 
//     const end = new THREE.Vector3(1.5, 0, 0);   
    
//     // Electron movement interpolation
//     const electronPos = new THREE.Vector3().lerpVectors(start, end, progress);
//     const isTransferred = progress > 0.5;

//     return (
//         <group>
//             {/* Story HUD */}
//             <Html position={[0, 3, 0]} center>
//                 <div className="text-center w-64 pointer-events-none">
//                     <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-1">Ionic Mechanism</h3>
//                     <div className="text-white text-xs bg-black/80 p-2 rounded border border-cyan-500/30 shadow-lg">
//                         {isTransferred ? "Transfer Complete. Ions Formed." : "Electron Transfer in Progress..."}
//                     </div>
//                 </div>
//             </Html>

//             {/* Sodium (Na) */}
//             <group position={[-2, 0, 0]}>
//                 <Nucleus element="Na" color={isTransferred ? "#888" : "#ffaa00"} charge={isTransferred ? "+" : ""} />
//             </group>

//             {/* Chlorine (Cl) */}
//             <group position={[2, 0, 0]}>
//                 <Nucleus element="Cl" color={isTransferred ? "#00ff00" : "#00aaff"} charge={isTransferred ? "-" : ""} />
//             </group>

//             {/* The Moving Electron */}
//             <Trail width={1} length={6} color="#ffff00" attenuation={(t) => t * t}>
//                 <mesh position={electronPos}>
//                     <sphereGeometry args={[0.15, 16, 16]} />
//                     <meshBasicMaterial color="#ffff00" />
//                 </mesh>
//             </Trail>
//         </group>
//     );
// };

// // --- SCENARIO 2: COVALENT BONDING (Redesigned) ---
// const CovalentScenario = ({ progress }) => {
//     // Atoms move closer based on progress
//     // Start far (3.5) -> End close (1.2 bond length)
//     const currentDist = THREE.MathUtils.lerp(3.5, 1.4, progress);
//     const isBonded = progress > 0.6;
    
//     const posA = [-currentDist / 2, 0, 0];
//     const posB = [currentDist / 2, 0, 0];

//     return (
//         <group>
//              <Html position={[0, 3, 0]} center>
//                 <div className="text-center w-64 pointer-events-none">
//                     <h3 className="text-green-400 font-bold text-sm uppercase tracking-widest mb-1">Covalent Mechanism</h3>
//                     <div className="text-white text-xs bg-black/80 p-2 rounded border border-green-500/30 shadow-lg">
//                          {isBonded 
//                             ? "Orbitals Merged: Electrons Shared in Figure-8 Path" 
//                             : "Atoms Approaching... Overlap Imminent"}
//                     </div>
//                 </div>
//             </Html>

//             {/* Atom A */}
//             <group position={posA}>
//                 <Nucleus element="H" color="#aaaaaa" size={0.3} opacity={isBonded ? 0.6 : 1} />
//             </group>

//             {/* Atom B */}
//             <group position={posB}>
//                 <Nucleus element="H" color="#aaaaaa" size={0.3} opacity={isBonded ? 0.6 : 1} />
//             </group>

//             {/* --- VALENCE ELECTRONS --- */}
//             {/* Note: We reuse the SAME 2 electrons. They just change their path. */}
            
//             {/* Electron 1: Starts on A, switches to Shared */}
//             <AdaptiveElectron 
//                 orbitCenter={posA}
//                 sharedCenters={[posA, posB]}
//                 isShared={isBonded}
//                 speed={isBonded ? 4 : 2} // Move faster when bonded (high energy)
//                 phase={0}
//                 color={isBonded ? "#00ffaa" : "white"}
//             />

//             {/* Electron 2: Starts on B, switches to Shared */}
//             <AdaptiveElectron 
//                 orbitCenter={posB}
//                 sharedCenters={[posA, posB]}
//                 isShared={isBonded}
//                 speed={isBonded ? 4 : 2}
//                 phase={Math.PI} // Start opposite to Electron 1
//                 color={isBonded ? "#00ffaa" : "white"}
//             />

//             {/* --- THE BOND CLOUD (Visual Representation of Sigma Bond) --- */}
//             {/* Only appears when bonded to show the probability density */}
//             <mesh 
//                 position={[0, 0, 0]} 
//                 scale={[isBonded ? currentDist * 0.8 : 0, 0.6, 0.6]} // Expands from 0
//                 rotation={[0, 0, Math.PI / 2]}
//             >
//                 <sphereGeometry args={[1, 32, 32]} />
//                 <meshStandardMaterial 
//                     color="#00ffaa" 
//                     transparent 
//                     opacity={isBonded ? 0.2 : 0} 
//                     roughness={0}
//                     metalness={0.2}
//                     depthWrite={false}
//                     blending={THREE.AdditiveBlending}
//                 />
//             </mesh>
            
//             {/* Bonding Label */}
//             {isBonded && (
//                  <Html position={[0, -1, 0]} center>
//                     <span className="text-[10px] text-green-300 font-bold bg-black/30 px-2 py-1 rounded backdrop-blur-sm border border-green-500/20">
//                         Shared Electron Cloud (σ-bond)
//                     </span>
//                 </Html>
//             )}
//         </group>
//     );
// };

// // --- MAIN COMPONENT ---
// const NanoView = ({ reaction, progress }) => {
//     const isIonic = reaction.id === 'solvay_process';

//     return (
//         <group>
//             {isIonic ? (
//                 <IonicScenario progress={progress} />
//             ) : (
//                 <CovalentScenario progress={progress} />
//             )}
//         </group>
//     );
// };

// export default NanoView;






// src/components/reactions/views/NanoView.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';

// --- ENHANCED NUCLEUS COMPONENT ---
const Nucleus = ({ element, color, size = 0.4, label, charge = "", opacity = 1, glowIntensity = 0.3 }) => {
    const glowRef = useRef();
    
    useFrame((state) => {
        if (glowRef.current) {
            // Gentle pulsing glow effect
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9;
            glowRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group>
            {/* Core Nucleus */}
            <Sphere args={[size, 32, 32]}>
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.15} 
                    metalness={0.9} 
                    transparent 
                    opacity={opacity}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </Sphere>
            
            {/* Inner Glow */}
            <Sphere args={[size * 1.3, 32, 32]}>
                <meshBasicMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity * 0.3} 
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>
            
            {/* Outer Halo with animation */}
            <Sphere ref={glowRef} args={[size * 1.8, 32, 32]}>
                <meshBasicMaterial 
                    color={color} 
                    transparent 
                    opacity={opacity * glowIntensity} 
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>
            
            {/* Label */}
            <Html position={[0, size + 0.6, 0]} center distanceFactor={8}>
                <div className="flex flex-col items-center pointer-events-none">
                    <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full backdrop-blur-md border border-white/30 shadow-lg transition-all duration-300" 
                          style={{ opacity: opacity }}>
                        {element}
                        {charge && (
                            <sup className={`ml-1 font-extrabold text-[10px] ${
                                charge === '+' ? 'text-blue-300' : 
                                charge === '-' ? 'text-red-300' : 
                                'text-yellow-300'
                            }`}>
                                {charge}
                            </sup>
                        )}
                    </span>
                </div>
            </Html>
        </group>
    );
};

// --- ENHANCED ADAPTIVE ELECTRON ---
const AdaptiveElectron = ({ 
    orbitCenter,
    sharedCenters,
    isShared = false,
    speed = 1, 
    phase = 0,
    color = "yellow",
    size = 0.08
}) => {
    const ref = useRef();
    const glowRef = useRef();
    
    useFrame((state) => {
        if (!ref.current) return;

        const t = state.clock.elapsedTime * speed + phase;

        if (isShared && sharedCenters) {
            // Enhanced figure-8 path with smoother transitions
            const c1 = new THREE.Vector3(...sharedCenters[0]);
            const c2 = new THREE.Vector3(...sharedCenters[1]);
            const mid = new THREE.Vector3().lerpVectors(c1, c2, 0.5);
            const dist = c1.distanceTo(c2);
            
            const width = dist * 0.7;
            const height = 0.7;
            
            // More sophisticated parametric equations for smoother figure-8
            const angle = t % (Math.PI * 2);
            ref.current.position.x = mid.x + Math.sin(angle) * width;
            ref.current.position.z = mid.z + Math.sin(angle * 2) * (width * 0.35);
            ref.current.position.y = mid.y + Math.cos(angle * 3) * (height * 0.25);

        } else {
            // Enhanced local orbit with elliptical path
            const rx = 0.75;
            const ry = 0.5;
            const rz = 0.75;
            
            ref.current.position.x = orbitCenter[0] + Math.cos(t) * rx;
            ref.current.position.y = orbitCenter[1] + Math.sin(t * 1.5) * ry;
            ref.current.position.z = orbitCenter[2] + Math.sin(t) * rz;
        }

        // Pulsing glow effect
        if (glowRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 8 + phase) * 0.3 + 1;
            glowRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <Trail 
            width={isShared ? 0.4 : 0.15}
            length={isShared ? 15 : 8}
            color={color} 
            attenuation={(t) => t * t * t}
        >
            <group ref={ref}>
                {/* Main electron */}
                <Sphere args={[size, 16, 16]}>
                    <meshStandardMaterial 
                        color={color} 
                        emissive={color} 
                        emissiveIntensity={4}
                        toneMapped={false}
                    />
                </Sphere>
                {/* Glow sphere */}
                <Sphere ref={glowRef} args={[size * 2, 16, 16]}>
                    <meshBasicMaterial 
                        color={color} 
                        transparent 
                        opacity={0.4}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </Sphere>
            </group>
        </Trail>
    );
};

// --- ELECTROSTATIC FIELD LINES ---
const FieldLines = ({ from, to, color, opacity = 0.3, count = 6 }) => {
    const lines = useMemo(() => {
        const result = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 0.3;
            const offset = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.5,
                Math.sin(angle * 2) * radius * 0.3
            );
            
            const start = new THREE.Vector3(...from).add(offset);
            const end = new THREE.Vector3(...to).add(offset);
            
            result.push({ start, end });
        }
        return result;
    }, [from, to, count]);

    return (
        <>
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={[line.start, line.end]}
                    color={color}
                    lineWidth={1}
                    transparent
                    opacity={opacity}
                    dashed
                    dashScale={10}
                    dashSize={0.1}
                    gapSize={0.05}
                />
            ))}
        </>
    );
};

// --- ENHANCED IONIC SCENARIO ---
const IonicScenario = ({ progress }) => {
    const naPos = useMemo(() => new THREE.Vector3(-2.5, 0, 0), []);
    const clPos = useMemo(() => new THREE.Vector3(2.5, 0, 0), []);
    
    // Smooth electron transfer
    const electronPos = useMemo(() => {
        const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
        return new THREE.Vector3().lerpVectors(naPos, clPos, easedProgress);
    }, [progress, naPos, clPos]);
    
    const isTransferred = progress > 0.7;
    const attractionStrength = isTransferred ? THREE.MathUtils.lerp(0, 1, (progress - 0.7) / 0.3) : 0;

    // Atoms move slightly closer after ion formation
    const separation = THREE.MathUtils.lerp(5, 3.5, attractionStrength);
    const finalNaPos = [-separation / 2, 0, 0];
    const finalClPos = [separation / 2, 0, 0];

    return (
        <group>
            {/* Enhanced HUD */}
            <Html position={[0, 3.5, 0]} center distanceFactor={10}>
                <div className="text-center w-80 pointer-events-none">
                    <h3 className="text-cyan-400 font-bold text-lg uppercase tracking-widest mb-2 drop-shadow-lg">
                        Ionic Bonding
                    </h3>
                    <div className="text-white text-sm bg-gradient-to-br from-black/90 to-cyan-900/50 p-3 rounded-lg border-2 border-cyan-400/40 shadow-2xl backdrop-blur-md">
                        {progress < 0.3 && "⚡ Na loses electron → oxidation"}
                        {progress >= 0.3 && progress < 0.7 && "→ Electron transfer in progress..."}
                        {progress >= 0.7 && "✓ Cl gains electron → reduction | Electrostatic attraction forms"}
                    </div>
                    <div className="mt-2 text-xs text-cyan-200 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
                        Na → Na⁺ + e⁻ | Cl + e⁻ → Cl⁻
                    </div>
                </div>
            </Html>

            {/* Sodium (Na) */}
            <group position={finalNaPos}>
                <Nucleus 
                    element="Na" 
                    color={isTransferred ? "#6699ff" : "#ffaa00"} 
                    charge={isTransferred ? "+" : ""} 
                    size={isTransferred ? 0.35 : 0.45}
                    glowIntensity={isTransferred ? 0.5 : 0.3}
                />
            </group>

            {/* Chlorine (Cl) */}
            <group position={finalClPos}>
                <Nucleus 
                    element="Cl" 
                    color={isTransferred ? "#00ff88" : "#00aaff"} 
                    charge={isTransferred ? "-" : ""} 
                    size={isTransferred ? 0.55 : 0.45}
                    glowIntensity={isTransferred ? 0.5 : 0.3}
                />
            </group>

            {/* Electrostatic field lines after ion formation */}
            {isTransferred && (
                <FieldLines 
                    from={finalNaPos} 
                    to={finalClPos} 
                    color="#ffaa00" 
                    opacity={attractionStrength * 0.4}
                    count={8}
                />
            )}

            {/* The Moving Electron with enhanced trail */}
            <Trail 
                width={2} 
                length={12} 
                color="#ffff00" 
                attenuation={(t) => t * t * t}
            >
                <mesh position={electronPos}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial 
                        color="#ffff00" 
                        emissive="#ffff00"
                        emissiveIntensity={3}
                        toneMapped={false}
                    />
                </mesh>
            </Trail>

            {/* Energy release indicator */}
            {isTransferred && (
                <Html position={[0, -2, 0]} center>
                    <div className="text-xs text-orange-300 font-semibold bg-black/60 px-3 py-1 rounded-full border border-orange-500/40 animate-pulse">
                        ⚡ Energy Released: Lattice Formation
                    </div>
                </Html>
            )}
        </group>
    );
};

// --- ENHANCED COVALENT SCENARIO ---
const CovalentScenario = ({ progress }) => {
    const easedProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
    const currentDist = THREE.MathUtils.lerp(4, 1.2, easedProgress);
    const isBonded = progress > 0.65;
    const bondStrength = isBonded ? THREE.MathUtils.lerp(0, 1, (progress - 0.65) / 0.35) : 0;
    
    const posA = [-currentDist / 2, 0, 0];
    const posB = [currentDist / 2, 0, 0];

    return (
        <group>
            {/* Enhanced HUD */}
            <Html position={[0, 3.5, 0]} center distanceFactor={10}>
                <div className="text-center w-80 pointer-events-none">
                    <h3 className="text-green-400 font-bold text-lg uppercase tracking-widest mb-2 drop-shadow-lg">
                        Covalent Bonding
                    </h3>
                    <div className="text-white text-sm bg-gradient-to-br from-black/90 to-green-900/50 p-3 rounded-lg border-2 border-green-400/40 shadow-2xl backdrop-blur-md">
                        {progress < 0.4 && "🔬 Atoms approaching | Electron clouds begin overlap"}
                        {progress >= 0.4 && progress < 0.65 && "⚛️ Orbital overlap increasing..."}
                        {progress >= 0.65 && "✓ Shared electron pair | σ-bond formed | Lower energy state achieved"}
                    </div>
                    <div className="mt-2 text-xs text-green-200 bg-black/50 px-3 py-1 rounded-full border border-green-500/30">
                        H • + • H → H:H (H₂ molecule)
                    </div>
                </div>
            </Html>

            {/* Bond axis line */}
            {progress > 0.3 && (
                <Line
                    points={[posA, posB]}
                    color="#00ff88"
                    lineWidth={2}
                    transparent
                    opacity={bondStrength * 0.3}
                />
            )}

            {/* Atom A (Hydrogen) */}
            <group position={posA}>
                <Nucleus 
                    element="H" 
                    color="#dddddd" 
                    size={0.3} 
                    opacity={isBonded ? 0.7 : 1}
                    glowIntensity={isBonded ? 0.2 : 0.3}
                />
            </group>

            {/* Atom B (Hydrogen) */}
            <group position={posB}>
                <Nucleus 
                    element="H" 
                    color="#dddddd" 
                    size={0.3} 
                    opacity={isBonded ? 0.7 : 1}
                    glowIntensity={isBonded ? 0.2 : 0.3}
                />
            </group>

            {/* Valence Electrons */}
            <AdaptiveElectron 
                orbitCenter={posA}
                sharedCenters={[posA, posB]}
                isShared={isBonded}
                speed={isBonded ? 3.5 : 2}
                phase={0}
                color={isBonded ? "#00ffaa" : "#ffffff"}
                size={isBonded ? 0.09 : 0.08}
            />

            <AdaptiveElectron 
                orbitCenter={posB}
                sharedCenters={[posA, posB]}
                isShared={isBonded}
                speed={isBonded ? 3.5 : 2}
                phase={Math.PI}
                color={isBonded ? "#00ffaa" : "#ffffff"}
                size={isBonded ? 0.09 : 0.08}
            />

            {/* Molecular Orbital (Electron Density Cloud) */}
            <group position={[0, 0, 0]}>
                {/* Main bonding cloud */}
                <mesh 
                    scale={[
                        isBonded ? currentDist * 0.85 : 0, 
                        isBonded ? 0.65 : 0, 
                        isBonded ? 0.65 : 0
                    ]}
                    rotation={[0, 0, Math.PI / 2]}
                >
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial 
                        color="#00ffaa" 
                        transparent 
                        opacity={bondStrength * 0.25} 
                        roughness={0.1}
                        metalness={0.3}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                
                {/* Inner high-density region */}
                <mesh 
                    scale={[
                        isBonded ? currentDist * 0.6 : 0, 
                        isBonded ? 0.45 : 0, 
                        isBonded ? 0.45 : 0
                    ]}
                    rotation={[0, 0, Math.PI / 2]}
                >
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial 
                        color="#00ffdd" 
                        transparent 
                        opacity={bondStrength * 0.35} 
                        roughness={0}
                        metalness={0.5}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </group>
            
            {/* Bond label */}
            {isBonded && (
                <Html position={[0, -1.2, 0]} center>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-green-300 font-bold bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-green-500/40">
                            σ-bond (Sigma)
                        </span>
                        <span className="text-[10px] text-green-200/80 bg-black/50 px-2 py-0.5 rounded">
                            Electron density: HIGH
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
};

// --- MAIN COMPONENT ---
const NanoView = ({ reaction, progress }) => {
    const isIonic = reaction?.id === 'solvay_process';

    return (
        <group>
            {/* Ambient particles for atmosphere */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4488ff" />
            
            {isIonic ? (
                <IonicScenario progress={progress} />
            ) : (
                <CovalentScenario progress={progress} />
            )}
        </group>
    );
};

export default NanoView;