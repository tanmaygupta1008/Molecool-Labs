import React, { useRef, useMemo } from 'react';
import { Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Animated falling micro-particles (form as precipitate is settling) ---
const FallingParticle = ({ spread, floorY, color, seed }) => {
    const ref = useRef();
    const init = useMemo(() => ({
        x: (Math.sin(seed * 13.7) * spread * 0.85),
        z: (Math.cos(seed * 7.3) * spread * 0.85),
        y: floorY + Math.random() * spread * 0.8 + 0.1,
        speed: 0.003 + Math.random() * 0.006,
        scale: 0.018 + Math.random() * 0.022,
        wobble: Math.random() * Math.PI * 2,
    }), [seed, spread, floorY]);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        ref.current.position.y -= init.speed;
        ref.current.position.x = init.x + Math.sin(t * 1.2 + init.wobble) * 0.015;
        // When particle hits bottom, respawn at top
        if (ref.current.position.y < floorY + 0.01) {
            ref.current.position.y = floorY + spread * 0.8 + 0.1;
        }
    });

    return (
        <mesh ref={ref} position={[init.x, init.y, init.z]}>
            <octahedronGeometry args={[init.scale, 0]} />
            <meshStandardMaterial color={color} roughness={0.9} opacity={0.75} transparent />
        </mesh>
    );
};

// --- Small crystal / grain bumps on top of the sediment bed ---
const SedimentGrains = ({ radius, floorY, color, count = 38 }) => {
    const grains = useMemo(() => {
        return Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2 + i * 0.37;
            const r = Math.sqrt(Math.random()) * radius * 0.8;
            return {
                x: Math.cos(angle) * r,
                z: Math.sin(angle) * r,
                scale: radius * (0.05 + Math.random() * 0.10), // proportional
                ry: Math.random() * Math.PI,
            };
        });
    }, [count, radius]);

    return (
        <group position={[0, floorY, 0]}>
            {grains.map((g, i) => (
                <mesh key={i} position={[g.x, g.scale, g.z]} rotation={[0, g.ry, 0]} scale={[g.scale * 1.4, g.scale, g.scale * 1.4]}>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={color} roughness={1.0} />
                </mesh>
            ))}
        </group>
    );
};

// --- Turbid cloudy suspension layer (semi-transparent blobs mid-layer) ---
const TurbidLayer = ({ radius, floorY, height, color }) => {
    const blobs = useMemo(() => {
        return Array.from({ length: 18 }, (_, i) => {
            const angle = i * 0.72;
            const r = (0.3 + Math.random() * 0.5) * radius * 0.75; // strict confinement
            return {
                x: Math.cos(angle) * r,
                z: Math.sin(angle) * r,
                y: floorY + height * (0.1 + Math.random() * 0.6),
                s: radius * (0.15 + Math.random() * 0.25), // proportional
                opacity: 0.12 + Math.random() * 0.18,
            };
        });
    }, [radius, floorY, height]);

    return (
        <group>
            {blobs.map((b, i) => (
                <mesh key={i} position={[b.x, b.y, b.z]}>
                    <sphereGeometry args={[b.s, 8, 8]} />
                    <meshStandardMaterial color={color} roughness={1} transparent opacity={b.opacity} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
};

// ================================================================
// MAIN PRECIPITATE COMPONENT
// ================================================================
const Precipitate = ({ type = 'cylinder', radius = 1, amount = 0, color = '#dddddd', position = [0, 0, 0] }) => {
    if (amount <= 0.01) return null;

    // Clamp amount
    const amt = Math.min(amount, 1.0);

    if (type === 'sphere') {
        // For round-bottom flasks: spherical cap slice from bottom up
        const maxThetaLen = Math.PI / 2; // quarter sphere
        const thetaLength = maxThetaLen * amt;
        const R = radius * 0.95;
        
        // Calculate the exact geometry bounds based on the sphere's angular slice
        // Y = R * cos(phi), Radius = R * sin(phi). Phi is from top pole.
        // Slice starts at Math.PI (bottom pole) and goes up by thetaLength
        const topPhi = Math.PI - thetaLength;
        const topY = R * Math.cos(topPhi);
        const crossSectionalRadius = R * Math.sin(topPhi);
        const floorY = -R;

        return (
            <group position={position}>
                {/* Main settled spherical cap — opaque base */}
                <Sphere args={[R, 32, 16, 0, Math.PI * 2, topPhi, thetaLength]}>
                    <meshStandardMaterial
                        color={color}
                        roughness={1.0}
                        transparent
                        opacity={0.92}
                        side={THREE.DoubleSide}
                    />
                </Sphere>

                {/* Cap for the spherical cap to make it look solid from above */}
                <mesh position={[0, topY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[crossSectionalRadius, 32]} />
                    <meshStandardMaterial color={color} roughness={1.0} transparent opacity={0.92} side={THREE.DoubleSide} />
                </mesh>

                {/* Turbid cloud above settled layer */}
                {amt > 0.05 && (
                    <TurbidLayer
                        radius={Math.max(0.01, crossSectionalRadius * 0.85)}
                        floorY={topY}
                        height={radius * amt * 0.4}
                        color={color}
                    />
                )}

                {/* Falling particles during active formation */}
                {amt < 0.95 && Array.from({ length: 14 }, (_, i) => (
                    <FallingParticle
                        key={i}
                        seed={i + 1}
                        spread={Math.max(0.01, crossSectionalRadius * 0.7)}
                        floorY={floorY}
                        color={color}
                    />
                ))}

                {/* Grain bumps on top surface */}
                <SedimentGrains radius={Math.max(0.01, crossSectionalRadius * 0.85)} floorY={topY} color={color} count={22} />
            </group>
        );
    }

    // -------- CYLINDER type (Beaker, Conical Flask, Test Tube) --------
    const maxHeight = radius * 0.7;
    const height = Math.max(0.015, amt * maxHeight);
    const floorY = position[1];

    return (
        <group position={[position[0], floorY, position[2]]}>
            {/* Settled sediment cylinder — matte, opaque base */}
            <group position={[0, height / 2, 0]}>
                <Cylinder args={[radius * 0.94, radius * 0.94, height, 48]}>
                    <meshStandardMaterial
                        color={color}
                        roughness={1.0}
                        transparent
                        opacity={0.90}
                    />
                </Cylinder>
            </group>

            {/* Uneven top surface — jagged grains */}
            <SedimentGrains radius={radius * 0.85} floorY={height} color={color} count={42} />

            {/* Turbid suspension above settled layer (visible when partially formed) */}
            {amt > 0.04 && amt < 0.98 && (
                <TurbidLayer
                    radius={radius * 0.85}
                    floorY={height}
                    height={height * 0.7 + 0.08}
                    color={color}
                />
            )}

            {/* Animated falling micro-particles (during active formation) */}
            {amt < 0.95 && Array.from({ length: 16 }, (_, i) => (
                <FallingParticle
                    key={i}
                    seed={i + 2}
                    spread={radius * 0.8}
                    floorY={0}
                    color={color}
                />
            ))}
        </group>
    );
};

export default Precipitate;

