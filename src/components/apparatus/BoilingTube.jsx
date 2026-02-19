import React, { useMemo } from 'react';
import { Cylinder, Utils, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const BoilingTube = ({ reactants = [], ...props }) => {
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

    // Max volume ~50-60mL -> Height ~1.5
    const maxVol = 60;
    const liquidHeight = Math.min((liquidVolume / maxVol) * 1.5, 1.7);
    return (
        <group {...props}>
            {/* Boiling Tube is just a larger test tube */}
            {/* Body */}
            <Cylinder args={[0.3, 0.3, 1.8, 32, 1, true]} position={[0, 0, 0]}>
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2} // Double side
                />
            </Cylinder>

            {/* Rounded Bottom */}
            <mesh position={[0, -0.9, 0]}>
                <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
                <meshPhysicalMaterial
                    color="white"
                    transmission={0.9}
                    opacity={0.3}
                    transparent
                    roughness={0.1}
                    thickness={0.1}
                    ior={1.2}
                    side={2}
                />
            </mesh>

            {/* Rim - Torus for open top look */}
            <Torus args={[0.3, 0.03, 16, 32]} position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#dddddd"
                    transmission={0.8}
                    opacity={0.6}
                    transparent
                    roughness={0.2}
                />
            </Torus>
            {/* Render Liquid */}
            {liquidVolume > 0 && (
                <group position={[0, liquidHeight / 2 - 0.9, 0]}>
                    <Cylinder args={[0.28, 0.28, liquidHeight, 32]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={2}
                        />
                    </Cylinder>
                    {/* Bottom Hemisphere for liquid */}
                    <mesh position={[0, -liquidHeight / 2, 0]}>
                        <sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI]} />
                        <meshPhysicalMaterial color={liquidColor} transparent opacity={0.8} side={2} />
                    </mesh>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 0.2, -0.8 + (i * 0.08), (Math.random() - 0.5) * 0.2]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <dodecahedronGeometry args={[0.1, 0]} />
                    <meshStandardMaterial color={s.color} roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
};

export default BoilingTube;
