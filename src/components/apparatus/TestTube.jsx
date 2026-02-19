import React, { useMemo } from 'react';
import { Cylinder, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const TestTube = ({ isHardGlass = false, reactants = [], ...props }) => {
    // Calculate contents
    const { liquidVolume, liquidColor, solids } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const solidItems = [];

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff';

            if (r.state === 'l' || r.state === 'aq') {
                vol += (parseFloat(r.amount) || 0);
                const c = new THREE.Color(color);
                rSum += c.r;
                gSum += c.g;
                bSum += c.b;
                count++;
            } else if (r.state === 's') {
                solidItems.push({ ...r, color });
            }
        });

        const mixedColor = count > 0
            ? new THREE.Color(rSum / count, gSum / count, bSum / count).getStyle()
            : '#aaddff';

        return { liquidVolume: vol, liquidColor: mixedColor, solids: solidItems };
    }, [reactants]);

    // Max volume ~20-30mL -> Height ~1.2
    const maxVol = 30;
    const liquidHeight = Math.min((liquidVolume / maxVol) * 1.2, 1.4);
    return (
        <group {...props}>
            {/* Body */}
            <Cylinder args={[0.2, 0.2, 1.5, 32, 1, true]} position={[0, 0.95, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false} // Allow internal liquid to be seen
                />
            </Cylinder>

            {/* Bottom Round */}
            <Sphere args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.2, 0]} scale={[1, -1, 1]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    thickness={isHardGlass ? 0.08 : 0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Sphere>

            {/* Rim - Replaced solid cylinder with Torus for open top */}
            <Torus args={[0.2, 0.03, 16, 32]} position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color={isHardGlass ? "#e0f7fa" : "#ffffff"}
                    transmission={0.9}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>
            {/* Render Liquid */}
            {liquidVolume > 0 && (
                <group position={[0, liquidHeight / 2 + 0.2, 0]}>
                    <Cylinder args={[0.18, 0.18, liquidHeight, 32]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </Cylinder>
                    {/* Bottom Hemisphere for liquid */}
                    <mesh position={[0, -liquidHeight / 2, 0]}>
                        <sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshPhysicalMaterial color={liquidColor} transparent opacity={0.8} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 0.1, 0.3 + (i * 0.05), (Math.random() - 0.5) * 0.1]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <dodecahedronGeometry args={[0.08, 0]} />
                    <meshStandardMaterial color={s.color} roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
};

export default TestTube;
