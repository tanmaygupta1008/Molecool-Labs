// // src/components/reactions/views/MicroView.jsx
// import { useRef, useMemo } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Vector3 } from 'three';
// import { Sphere } from '@react-three/drei';

// const ATOM_COLORS = { C: '#333333', H: '#FFFFFF', O: '#FF0000', N: '#0000FF' };
// const ATOM_SIZES = { C: 0.4, H: 0.25, O: 0.35, N: 0.35 };

// const Atom = ({ element, startPos, endPos, progress }) => {
//     const meshRef = useRef();
    
//     // Convert arrays to Vector3
//     const start = useMemo(() => new Vector3(...startPos), [startPos]);
//     const end = useMemo(() => new Vector3(...endPos), [endPos]);
    
//     useFrame(() => {
//         if (meshRef.current) {
//             // LERP: Linear Interpolation based on progress (0 to 1)
//             // This creates the smooth movement from reactant state to product state
//             meshRef.current.position.lerpVectors(start, end, progress);
            
//             // Add a little "shake" (thermal energy) if in the middle of reaction
//             if (progress > 0.2 && progress < 0.8) {
//                 meshRef.current.position.x += (Math.random() - 0.5) * 0.02;
//                 meshRef.current.position.y += (Math.random() - 0.5) * 0.02;
//             }
//         }
//     });

//     return (
//         <Sphere ref={meshRef} args={[ATOM_SIZES[element], 32, 32]}>
//             <meshStandardMaterial color={ATOM_COLORS[element]} roughness={0.3} />
//         </Sphere>
//     );
// };

// const MicroView = ({ reaction, progress }) => {
//     return (
//         <group>
//             {reaction.atoms.map((atom) => (
//                 <Atom 
//                     key={atom.id}
//                     element={atom.element}
//                     startPos={atom.startPos}
//                     endPos={atom.endPos}
//                     progress={progress}
//                 />
//             ))}
//             {/* TODO: Add Bond Logic here. 
//                Bonds should be drawn between atoms if distance < threshold.
//             */}
//         </group>
//     );
// };

// export default MicroView;




// src/components/reactions/views/MicroView.jsx
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Instance, Instances, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useReactionPhysics } from '@/hooks/useReactionPhysics';

const ATOM_COLORS = { 
    C: '#333333', H: '#FFFFFF', O: '#FF0000', N: '#0000FF', 
    S: '#FFD700', Na: '#AB5CF2', Cl: '#00FF00' 
};
const ATOM_SIZES = { 
    C: 0.4, H: 0.25, O: 0.35, N: 0.35, 
    S: 0.45, Na: 0.5, Cl: 0.45 
};

// --- COLLISION EFFECT COMPONENT ---
const CollisionEffect = ({ position, type, onComplete }) => {
    const groupRef = useRef();
    const startTime = useRef(Date.now());
    const duration = 800; // milliseconds

    useFrame(() => {
        if (!groupRef.current) return;

        const elapsed = Date.now() - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale expansion
        const scale = 1 + progress * 2;
        groupRef.current.scale.setScalar(scale);
        
        // Fade out
        groupRef.current.traverse((child) => {
            if (child.material) {
                child.material.opacity = 1 - progress;
            }
        });

        if (progress >= 1) {
            onComplete?.();
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Shockwave Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.5, 32]} />
                <meshBasicMaterial 
                    color={type === 'successful' ? "#00ff88" : "#ff8800"}
                    transparent 
                    opacity={0.8}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            
            {/* Flash sphere for successful collisions */}
            {type === 'successful' && (
                <mesh>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshBasicMaterial 
                        color="#ffffff"
                        transparent 
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Particle burst */}
            {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                    <mesh 
                        key={i}
                        position={[
                            Math.cos(angle) * 0.3,
                            Math.sin(angle) * 0.15,
                            Math.sin(angle) * 0.3
                        ]}
                    >
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial 
                            color={type === 'successful' ? "#00ff88" : "#ff8800"}
                            transparent 
                            opacity={0.8}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

// --- ENHANCED PHYSICS ATOM WITH TRAILS ---
const PhysicsAtom = ({ physicsObj, element, temperature, showTrail = true }) => {
    const meshRef = useRef();
    const glowRef = useRef();
    const trailPositions = useRef([]);
    const maxTrailLength = 20;

    useFrame((state) => {
        if (!meshRef.current) return;

        // Update position
        meshRef.current.position.copy(physicsObj.position);

        // Update trail
        if (showTrail) {
            trailPositions.current.unshift(physicsObj.position.clone());
            if (trailPositions.current.length > maxTrailLength) {
                trailPositions.current.pop();
            }
        }

        // Pulsing glow based on temperature
        if (glowRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.1 + 0.9;
            glowRef.current.scale.setScalar(pulse * (1 + temperature * 0.3));
        }
    });

    return (
        <group>
            {/* Trail visualization */}
            {showTrail && trailPositions.current.length > 1 && (
                <Line
                    points={trailPositions.current}
                    color={ATOM_COLORS[element]}
                    lineWidth={1}
                    transparent
                    opacity={0.3}
                />
            )}

            {/* Main atom */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[ATOM_SIZES[element], 32, 32]} />
                <meshStandardMaterial 
                    color={ATOM_COLORS[element]} 
                    roughness={0.2} 
                    metalness={0.3}
                    emissive={ATOM_COLORS[element]}
                    emissiveIntensity={temperature * 0.3}
                />
            </mesh>

            {/* Thermal glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[ATOM_SIZES[element] * 1.4, 16, 16]} />
                <meshBasicMaterial 
                    color={ATOM_COLORS[element]} 
                    transparent 
                    opacity={0.15 + temperature * 0.15} 
                    depthWrite={false} 
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Heat aura for high temperatures */}
            {temperature > 0.8 && (
                <mesh>
                    <sphereGeometry args={[ATOM_SIZES[element] * 1.8, 16, 16]} />
                    <meshBasicMaterial 
                        color="#ff8800"
                        transparent 
                        opacity={0.1 * temperature}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
};

// --- ENHANCED DYNAMIC BONDS WITH STRETCHING ---
const DynamicBonds = ({ atoms, physicsState, onBondBreak }) => {
    const previousBonds = useRef(new Set());

    useFrame(() => {
        const currentBonds = new Set();

        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const posA = physicsState[i].position;
                const posB = physicsState[j].position;
                const dist = posA.distanceTo(posB);

                if (dist < 1.8) {
                    currentBonds.add(`${i}-${j}`);
                }
            }
        }

        // Detect broken bonds
        previousBonds.current.forEach(bondKey => {
            if (!currentBonds.has(bondKey)) {
                onBondBreak?.(bondKey);
            }
        });

        previousBonds.current = currentBonds;
    });

    return (
        <group>
            {atoms.map((a, i) => 
                atoms.slice(i + 1).map((b, j) => {
                    const actualJ = i + j + 1;
                    const posA = physicsState[i].position;
                    const posB = physicsState[actualJ].position;
                    const dist = posA.distanceTo(posB);
                    
                    if (dist > 1.8) return null;
                    
                    const idealDist = 1.1;
                    const tension = Math.max(0, Math.min(1, (dist - idealDist) / 0.7));
                    const isStretched = tension > 0.5;
                    
                    // Color transitions: gray -> yellow -> red
                    let color;
                    if (tension < 0.3) {
                        color = '#888888'; // Stable
                    } else if (tension < 0.7) {
                        color = '#ffaa00'; // Stretching
                    } else {
                        color = '#ff3333'; // Breaking
                    }
                    
                    const opacity = Math.max(0.3, 1 - tension * 0.5);

                    return (
                        <group key={`bond-${i}-${j}`}>
                            <Line
                                points={[posA, posB]}
                                color={color}
                                opacity={opacity}
                                transparent
                                lineWidth={isStretched ? 3 : 2}
                                dashed={isStretched}
                                dashScale={isStretched ? 15 : 1}
                                dashSize={0.1}
                                gapSize={0.05}
                            />
                            
                            {/* Breaking warning label */}
                            {tension > 0.7 && (
                                <Html position={[
                                    (posA.x + posB.x) / 2,
                                    (posA.y + posB.y) / 2 + 0.3,
                                    (posA.z + posB.z) / 2
                                ]}>
                                    <span className="text-[8px] text-red-400 font-bold animate-pulse pointer-events-none">
                                        ⚠ BREAKING
                                    </span>
                                </Html>
                            )}
                        </group>
                    );
                })
            )}
        </group>
    );
};

// --- ENHANCED SOLVENT PARTICLES ---
const SolventParticles = ({ count = 60 }) => {
    const instancesRef = useRef();
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10 - 2
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            scale: Math.random() * 0.15 + 0.15
        }));
    }, [count]);

    useFrame((state, delta) => {
        if (!instancesRef.current) return;

        particles.forEach((p, i) => {
            // Update position
            p.position.add(p.velocity);
            
            // Wrap around boundaries
            ['x', 'y', 'z'].forEach(axis => {
                if (p.position[axis] > 8) p.position[axis] = -8;
                if (p.position[axis] < -8) p.position[axis] = 8;
            });

            // Update rotation
            p.rotation += p.rotationSpeed;

            // Apply to instance
            const matrix = new THREE.Matrix4();
            matrix.compose(
                p.position,
                new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rotation, p.rotation * 0.7, 0)),
                new THREE.Vector3(p.scale, p.scale, p.scale)
            );
            instancesRef.current.setMatrixAt(i, matrix);
        });

        instancesRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={instancesRef} args={[null, null, count]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshBasicMaterial 
                color="#88ccff" 
                transparent 
                opacity={0.08} 
                depthWrite={false}
            />
        </instancedMesh>
    );
};

// --- COLLISION DETECTOR ---
const CollisionDetector = ({ atoms, physicsState, temperature, activationEnergy = 0.6 }) => {
    const [activeEffects, setActiveEffects] = useState([]);
    const lastCollisionTime = useRef({});
    const collisionCooldown = 500; // milliseconds

    useFrame(() => {
        const now = Date.now();

        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const posA = physicsState[i].position;
                const posB = physicsState[j].position;
                const dist = posA.distanceTo(posB);
                const collisionDist = ATOM_SIZES[atoms[i].element] + ATOM_SIZES[atoms[j].element];

                if (dist < collisionDist) {
                    const pairKey = `${i}-${j}`;
                    const lastTime = lastCollisionTime.current[pairKey] || 0;

                    // Check cooldown to avoid spam
                    if (now - lastTime > collisionCooldown) {
                        lastCollisionTime.current[pairKey] = now;

                        // Determine success based on temperature (activation energy)
                        const hasEnergy = temperature >= activationEnergy;
                        const isSuccessful = hasEnergy && Math.random() > 0.6;

                        const midpoint = new THREE.Vector3()
                            .addVectors(posA, posB)
                            .multiplyScalar(0.5);

                        setActiveEffects(prev => [...prev, {
                            id: `${pairKey}-${now}`,
                            position: midpoint.toArray(),
                            type: isSuccessful ? 'successful' : 'bounce'
                        }]);
                    }
                }
            }
        }
    });

    const handleEffectComplete = (id) => {
        setActiveEffects(prev => prev.filter(e => e.id !== id));
    };

    return (
        <>
            {activeEffects.map(effect => (
                <CollisionEffect
                    key={effect.id}
                    position={effect.position}
                    type={effect.type}
                    onComplete={() => handleEffectComplete(effect.id)}
                />
            ))}
        </>
    );
};

// --- STATISTICS HUD ---
const StatisticsHUD = ({ temperature, collisions, bondBreaks }) => {
    return (
        <Html position={[0, 5.5, 0]} center>
            <div className="text-center w-96 pointer-events-none">
                <h3 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-2 drop-shadow-lg">
                    ⚛️ Kinetic Molecular Theory
                </h3>
                <div className="bg-gradient-to-br from-black/90 to-blue-900/40 p-3 rounded-xl border-2 border-blue-400/40 shadow-2xl backdrop-blur-md">
                    <div className="grid grid-cols-3 gap-3 text-xs text-white mb-2">
                        <div className="bg-black/40 p-2 rounded-lg">
                            <div className="text-orange-400 font-bold text-base">{Math.round(temperature * 300)}°C</div>
                            <div className="text-[10px] text-gray-400">Temperature</div>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg">
                            <div className="text-green-400 font-bold text-base">{collisions.successful}</div>
                            <div className="text-[10px] text-gray-400">✓ Reactions</div>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg">
                            <div className="text-red-400 font-bold text-base">{collisions.bounces}</div>
                            <div className="text-[10px] text-gray-400">✗ Bounce-offs</div>
                        </div>
                    </div>
                    
                    {bondBreaks > 0 && (
                        <div className="text-[10px] text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/30 mb-2">
                            ⚡ Bonds broken: {bondBreaks}
                        </div>
                    )}
                    
                    <div className="text-[11px] mt-2">
                        {temperature < 0.6 ? (
                            <span className="text-blue-300">❄️ Low energy - minimal reactions</span>
                        ) : temperature < 1.2 ? (
                            <span className="text-green-300">✓ Optimal energy - reactions occurring</span>
                        ) : (
                            <span className="text-orange-300">🔥 High energy - rapid collisions</span>
                        )}
                    </div>
                </div>
            </div>
        </Html>
    );
};

// --- MAIN COMPONENT ---
const MicroView = ({ reaction, progress, environment }) => {
    const [collisionStats, setCollisionStats] = useState({ successful: 0, bounces: 0 });
    const [bondBreaks, setBondBreaks] = useState(0);
    
    // Normalize temperature (0-1 scale for internal use)
    const temperature = Math.max(0.1, environment?.temp ? environment.temp / 300 : 0.5);
    
    // Physics Engine Hook
    const physicsState = useReactionPhysics(
        reaction.atoms, 
        progress, 
        { temp: environment?.temp || 150 }
    );
    
    const isAqueous = reaction.id === 'solvay_process';

    const handleBondBreak = (bondKey) => {
        setBondBreaks(prev => prev + 1);
    };

    // Track collision stats
    const handleCollision = (type) => {
        setCollisionStats(prev => ({
            ...prev,
            [type === 'successful' ? 'successful' : 'bounces']: prev[type === 'successful' ? 'successful' : 'bounces'] + 1
        }));
    };

    return (
        <group>
            {/* Statistics HUD */}
            <StatisticsHUD 
                temperature={temperature}
                collisions={collisionStats}
                bondBreaks={bondBreaks}
            />

            {/* Solvent Context */}
            {isAqueous && <SolventParticles count={50} />}
            
            {/* The Reacting Atoms */}
            {reaction.atoms.map((atom, i) => (
                <PhysicsAtom 
                    key={atom.id}
                    element={atom.element}
                    physicsObj={physicsState[i]}
                    temperature={temperature}
                    showTrail={temperature > 0.5}
                />
            ))}

            {/* Dynamic Bonds with Stretching */}
            <DynamicBonds 
                atoms={reaction.atoms} 
                physicsState={physicsState}
                onBondBreak={handleBondBreak}
            />

            {/* Collision Detection System */}
            <CollisionDetector 
                atoms={reaction.atoms}
                physicsState={physicsState}
                temperature={temperature}
                activationEnergy={0.6}
            />

            {/* Ambient lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={0.5} />
            <pointLight 
                position={[-5, -5, -5]} 
                intensity={0.3 + temperature * 0.2} 
                color="#ff8800" 
            />
        </group>
    );
};

export default MicroView;