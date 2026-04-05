import React from 'react';
import * as THREE from 'three';

const TestTubeStand = ({ ...props }) => {
    const woodColor = "#d2a87a";
    const woodRoughness = 0.8;

    // Six holes/pegs horizontally
    const xs = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];

    const shape = React.useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-1.9, -0.3);
        s.lineTo(1.9, -0.3);
        s.lineTo(1.9, 0.3);
        s.lineTo(-1.9, 0.3);
        s.lineTo(-1.9, -0.3);

        const xs = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];
        xs.forEach(x => {
            const holePath = new THREE.Path();
            holePath.absarc(x, 0, 0.22, 0, Math.PI * 2, false);
            s.holes.push(holePath);
        });
        return s;
    }, []);

    return (
        <group {...props}>
            {/* Base */}
            <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
                <boxGeometry args={[3.8, 0.1, 1.4]} />
                <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
            </mesh>
            
            {/* Left Vertical */}
            <mesh position={[-1.85, 0.75, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.1, 1.5, 1.4]} />
                <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
            </mesh>

            {/* Right Vertical */}
            <mesh position={[1.85, 0.75, 0]} receiveShadow castShadow>
                <boxGeometry args={[0.1, 1.5, 1.4]} />
                <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
            </mesh>

            {/* Top Shelf with Circular Holes */}
            <mesh position={[0, 1.15, -0.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
                <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
            </mesh>

            {/* Base dimples for the tubes to sit in (visual markers) */}
            {xs.map((x, i) => (
                <mesh key={`dimple-${i}`} position={[x, 0.1, -0.3]} receiveShadow>
                    <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
                    <meshStandardMaterial color="#b38a5b" roughness={0.9} />
                </mesh>
            ))}

            {/* Drying Pegs in the front (Z = 0.3) */}
            {xs.map((x, i) => (
                <mesh key={`peg-${i}`} position={[x, 0.5, 0.3]} receiveShadow castShadow>
                    <cylinderGeometry args={[0.06, 0.06, 0.8, 12]} />
                    <meshStandardMaterial color={woodColor} roughness={woodRoughness} />
                </mesh>
            ))}
        </group>
    );
};

export default TestTubeStand;
