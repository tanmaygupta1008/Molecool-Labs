import React from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const MagnesiumRibbon = (props) => {
    // Length of the ribbon
    const length = 1.0;
    const { burnProgress = 0, color = "#c0c0c0", ...rest } = props;

    // Calculate current length: starts full (1.0), ends near zero (0.05)
    // We clamp burnProgress between 0 and 1
    const p = Math.min(1, Math.max(0, burnProgress));
    const currentLength = length * (1 - p);

    // Position Logic:
    // Origin is [0,0,0] (the Clamp point).
    // The ribbon hangs down.
    // As it burns, the bottom burns away.
    // So the TOP remains at [0,0,0].
    // The geometry needs to be shifted so its top is always at 0.
    // A Box of height H centered at 0 extends from H/2 to -H/2.
    // To align top to 0, we shift Y by -H/2.

    const centerY = -currentLength / 2;

    return (
        <group {...rest}>
            {/* Invisible Hit Box for selection (keeps full size for easier clicking) */}
            <mesh position={[0, -length / 2, 0]} visible={false}>
                <boxGeometry args={[0.2, length + 0.2, 0.2]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Unburnt Metal Ribbon */}
            {currentLength > 0.05 && (
                <mesh position={[0, centerY, 0]} rotation={[0, 0, Math.PI / 12]}>
                    <boxGeometry args={[0.05, currentLength, 0.01]} />
                    <meshStandardMaterial color={color} metalness={0.9} roughness={0.4} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Burning Tip & Ash */}
            {p > 0.01 && p < 0.99 && (
                <group position={[0, -currentLength, 0]}>
                    {/* Glowing Tip at the burn interface */}
                    <mesh>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color="#ffaa00" />
                    </mesh>
                    <pointLight distance={0.5} intensity={2} color="#ffaa00" />

                    {/* Ash Formation - Static clumps at the tip */}
                    <group position={[0, -0.05, 0]}>
                        <mesh rotation={[Math.random(), Math.random(), 0]}>
                            <dodecahedronGeometry args={[0.03, 0]} />
                            <meshStandardMaterial color="#ffffff" roughness={1} />
                        </mesh>
                    </group>
                </group>
            )}

            {/* If fully burnt, maybe show some residue falling? (Complex, skipping for now) */}
        </group>
    );
};

export default MagnesiumRibbon;
