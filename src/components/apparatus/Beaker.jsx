import React, { useMemo } from 'react';
import { Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const Beaker = ({ size = 1, reactants = [], ...props }) => {
    const scale = size;

    // Calculate contents
    const { liquidVolume, liquidColor, solids } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const solidItems = [];

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const color = chemical?.color || '#ffffff'; // Default to white if not found

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

    // Map volume to height
    // Max volume ~250mL -> Height ~1.5
    const maxVol = 250;
    const liquidHeight = Math.min((liquidVolume / maxVol) * 1.5, 1.7);

    return (
        <group {...props} scale={[scale, scale, scale]}>
            {/* Main Body */}
            <Cylinder args={[0.8, 0.8, 1.8, 32, 1, true]} position={[0, 0.9, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    metalness={0.1}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Bottom */}
            <Cylinder args={[0.8, 0.8, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    metalness={0.1}
                    thickness={0.05}
                />
            </Cylinder>

            {/* Rim - Torus */}
            <Torus args={[0.8, 0.035, 16, 32]} position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.5} transparent />
            </Torus>

            {/* Markings */}
            {[0.5, 0.9, 1.3].map((y, i) => (
                <React.Fragment key={i}>
                    {/* Major graduation */}
                    <group position={[0, y, 0]} rotation={[0, 0, 0]}>
                        <Cylinder args={[0.805, 0.805, 0.01, 32, 1, true, 0, Math.PI]} side={THREE.DoubleSide}>
                            <meshBasicMaterial color="#333" opacity={0.6} transparent />
                        </Cylinder>
                    </group>
                </React.Fragment>
            ))}

            {/* "White patch" area often seen on beakers for labeling */}
            <Cylinder args={[0.81, 0.81, 0.6, 32, 1, true, -Math.PI / 4, Math.PI / 2]} position={[0, 1.1, 0]} side={THREE.DoubleSide}>
                <meshStandardMaterial color="#ffffff" opacity={0.8} transparent roughness={0.8} />
            </Cylinder>

            {/* Render Liquid */}
            {liquidVolume > 0 && (
                <group position={[0, 0.05 + liquidHeight / 2, 0]}>
                    <Cylinder args={[0.78, 0.78, liquidHeight, 32]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </Cylinder>
                </group>
            )}

            {/* Render Solids */}
            {solids.map((s, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 0.5, 0.1 + (i * 0.1), (Math.random() - 0.5) * 0.5]} rotation={[Math.random(), Math.random(), Math.random()]}>
                    <dodecahedronGeometry args={[0.15, 0]} />
                    <meshStandardMaterial color={s.color} roughness={0.9} />
                </mesh>
            ))}

        </group>
    );
};

export default Beaker;
