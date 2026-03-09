'use client';
// src/components/reactions/engine/AtomNode.jsx

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

import { getElementData } from '@/utils/elementColors';

const AtomNode = ({
    position = [0, 0, 0],
    element = "Unknown",
    charge = 0,
    showLabel = true,
    opacity = 1,
    glowIntensity = 0.3,
    onClick
}) => {
    const meshRef = useRef();

    // Lookup element properties dynamically
    const data = getElementData(element);
    const color = data.color;
    const size = data.radius;

    // Format charge string (e.g., 1 -> "+", -2 -> "2-", 0 -> "")
    const chargeString = useMemo(() => {
        if (charge === 0) return "";
        if (charge === 1) return "+";
        if (charge === -1) return "−";
        return charge > 0 ? `${charge}+` : `${Math.abs(charge)}−`;
    }, [charge]);

    const chargeVisuals = useMemo(() => {
        if (charge > 0) {
            return { color: "#ff4444" };
        } else if (charge < 0) {
            return { color: "#44ccff" };
        }
        return { color: color };
    }, [charge, color]);

    return (
        <group position={position} onClick={onClick}>
            {/* Core Nucleus */}
            <Sphere ref={meshRef} args={[size, 32, 32]}>
                <meshStandardMaterial
                    color={color}
                    roughness={0.15}
                    metalness={0.8}
                    transparent
                    opacity={opacity}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </Sphere>

            {/* Inner Glow to simulate density */}
            <Sphere args={[size * 1.25, 32, 32]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={opacity * 0.3}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>

            {/* Dynamic HTML Label */}
            {showLabel && (
                <Html position={[0, size + 0.5, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
                    <div className="flex flex-col items-center pointer-events-none select-none">
                        <span
                            className="text-xs font-bold text-white bg-black/80 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center min-w-[32px]"
                            style={{ opacity: opacity }}
                        >
                            {element}
                            {chargeString && (
                                <sup className={`ml-0.5 font-extrabold text-[10px] ${charge > 0 ? 'text-blue-400' : 'text-red-400'
                                    }`}>
                                    {chargeString}
                                </sup>
                            )}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default AtomNode;
