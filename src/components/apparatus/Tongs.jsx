import React from 'react';
import { Torus, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';

const Tongs = ({ angle = 0, ...props }) => {
    // Metal material
    const materialParams = { color: "#b0b0b0", metalness: 0.7, roughness: 0.3 };

    // Clamp angle 
    const effectiveAngle = Math.max(0, Math.min(angle, 1.0));
    const rotationOffset = effectiveAngle * 0.5;

    return (
        <group {...props}>
            {/* Pivot Pin */}
            <group rotation={[Math.PI / 2, 0, 0]}>
                <Cylinder args={[0.06, 0.06, 0.15, 16]} >
                    <meshStandardMaterial {...materialParams} color="#888" />
                </Cylinder>
            </group>

            {/* Left Arm */}
            <group rotation={[0, 0, 0.1 + rotationOffset]}>
                {/* Handle Shaft */}
                <Box args={[1.5, 0.05, 0.04]} position={[-0.75, 0, 0.04]}>
                    <meshStandardMaterial {...materialParams} />
                </Box>
                {/* Finger Loop */}
                <group position={[-1.6, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}>
                    <Torus args={[0.12, 0.025, 12, 24]}>
                        <meshStandardMaterial {...materialParams} />
                    </Torus>
                </group>

                {/* Jaw Section */}
                {/* 1. Straight part after pivot */}
                <Box args={[0.4, 0.05, 0.04]} position={[0.2, 0, 0.04]}>
                    <meshStandardMaterial {...materialParams} />
                </Box>

                {/* 2. Outward Curve (Diamond shape start) */}
                <group position={[0.4, 0, 0.04]} rotation={[0, 0, -0.8]}>
                    <Box args={[0.4, 0.05, 0.04]} position={[0.2, 0, 0]}>
                        <meshStandardMaterial {...materialParams} />
                    </Box>
                    {/* 3. Inward Curve (Diamond shape end) */}
                    <group position={[0.4, 0, 0]} rotation={[0, 0, 1.4]}>
                        <Box args={[0.5, 0.05, 0.04]} position={[0.25, 0, 0]}>
                            <meshStandardMaterial {...materialParams} />
                        </Box>
                        {/* 4. Tip (Bent down/in for gripping) */}
                        <group position={[0.5, 0, 0]} rotation={[0, 0, -1.0]}>
                            <Box args={[0.2, 0.05, 0.04]} position={[0.1, 0, 0]}>
                                <meshStandardMaterial {...materialParams} />
                            </Box>
                        </group>
                    </group>
                </group>
            </group>

            {/* Right Arm (Mirrored) */}
            <group rotation={[0, 0, -0.1 - rotationOffset]}>
                {/* Handle Shaft */}
                <Box args={[1.5, 0.05, 0.04]} position={[-0.75, 0, -0.04]}>
                    <meshStandardMaterial {...materialParams} />
                </Box>
                {/* Finger Loop */}
                <group position={[-1.6, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
                    <Torus args={[0.12, 0.025, 12, 24]}>
                        <meshStandardMaterial {...materialParams} />
                    </Torus>
                </group>

                {/* Jaw Section */}
                <Box args={[0.4, 0.05, 0.04]} position={[0.2, 0, -0.04]}>
                    <meshStandardMaterial {...materialParams} />
                </Box>
                {/* Outward Curve */}
                <group position={[0.4, 0, -0.04]} rotation={[0, 0, 0.8]}>
                    <Box args={[0.4, 0.05, 0.04]} position={[0.2, 0, 0]}>
                        <meshStandardMaterial {...materialParams} />
                    </Box>
                    {/* Inward Curve */}
                    <group position={[0.4, 0, 0]} rotation={[0, 0, -1.4]}>
                        <Box args={[0.5, 0.05, 0.04]} position={[0.25, 0, 0]}>
                            <meshStandardMaterial {...materialParams} />
                        </Box>
                        {/* Tip */}
                        <group position={[0.5, 0, 0]} rotation={[0, 0, 1.0]}>
                            <Box args={[0.2, 0.05, 0.04]} position={[0.1, 0, 0]}>
                                <meshStandardMaterial {...materialParams} />
                            </Box>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
};

export default Tongs;
