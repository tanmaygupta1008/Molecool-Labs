// src/components/reactions/views/SubatomicElements.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';

// --- ENHANCED NUCLEUS COMPONENT ---
export const Nucleus = ({ element, color, size = 0.4, label, charge = "", opacity = 1, glowIntensity = 0.3 }) => {
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
                            <sup className={`ml-1 font-extrabold text-[10px] ${charge === '+' ? 'text-blue-300' :
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
export const AdaptiveElectron = ({
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

            // Orbiting around the provided center
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
export const FieldLines = ({ from, to, color, opacity = 0.3, count = 6 }) => {
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

// --- ORBITAL CLOUD VISUALIZATION ---
export const OrbitalCloud = ({ position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], color = "#00ffaa", opacity = 0.35, innerOpacity = 0.45 }) => {
    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Main bonding cloud */}
            <mesh>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={opacity}
                    roughness={0.1}
                    metalness={0.3}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Inner high-density region */}
            <mesh scale={[0.7, 0.7, 0.7]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={innerOpacity}
                    roughness={0}
                    metalness={0.5}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
};
