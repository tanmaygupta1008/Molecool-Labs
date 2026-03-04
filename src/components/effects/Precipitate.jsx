import React from 'react';
import { Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Precipitate = ({ type = 'cylinder', radius = 1, amount = 0, color = '#ffffff', position = [0, 0, 0] }) => {
    if (amount <= 0.01) return null;

    // max precipitate volume is represented visually as a slice of the bottom
    const maxHeight = type === 'cylinder' ? radius * 0.8 : radius * 1.5;
    const height = Math.max(0.01, amount * maxHeight);

    if (type === 'sphere') {
        // Fill up to hemisphere (Math.PI / 2) based on amount
        const thetaLength = (Math.PI / 2) * amount;
        return (
            <group position={position}>
                {/* For round bottoms, we slice a sphere from the bottom up */}
                <Sphere args={[radius * 0.98, 32, 16, 0, Math.PI * 2, Math.PI - thetaLength, thetaLength]}>
                    <meshStandardMaterial
                        color={color}
                        roughness={1.0}
                        transparent
                        opacity={0.95}
                        side={THREE.DoubleSide}
                    />
                </Sphere>
            </group>
        );
    }

    // Default cylinder (Beaker, Conical Flask) - radius scaled slightly down to fit inside glass
    return (
        <group position={[position[0], position[1] + height / 2, position[2]]}>
            <Cylinder args={[radius * 0.95, radius * 0.95, height, 32]}>
                <meshStandardMaterial
                    color={color}
                    roughness={1.0}
                    transparent
                    opacity={0.95}
                />
            </Cylinder>
        </group>
    );
};

export default Precipitate;
