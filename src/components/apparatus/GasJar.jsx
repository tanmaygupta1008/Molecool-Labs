import React from 'react';
import { Cylinder } from '@react-three/drei';

const Hole = ({ position }) => (
    <Cylinder args={[0.05, 0.05, 0.11, 16]} position={position}>
        <meshStandardMaterial color="#333" />
    </Cylinder>
);

const GasJar = ({ hasLid = true, holeCount = 0, ...props }) => {
    return (
        <group {...props}>
            {/* Tall Cylinder Body */}
            <Cylinder args={[0.5, 0.5, 1.5, 32, 1, true]} position={[0, 0.75, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.4}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={2}
                />
            </Cylinder>

            {/* Base */}
            <Cylinder args={[0.52, 0.52, 0.05, 32]} position={[0, 0.025, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent />
            </Cylinder>

            {/* Lid */}
            {hasLid && (
                <group position={[0, 1.55, 0]}>
                    <Cylinder args={[0.55, 0.55, 0.1, 32]}>
                        <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.6} transparent />
                    </Cylinder>

                    {/* Holes */}
                    {holeCount === 1 && <Hole position={[0, 0, 0]} />}

                    {holeCount === 2 && (
                        <>
                            <Hole position={[0.2, 0, 0]} />
                            <Hole position={[-0.2, 0, 0]} />
                        </>
                    )}

                    {holeCount >= 3 && (
                        <>
                            <Hole position={[0.2, 0, 0]} />
                            <Hole position={[-0.2, 0, 0]} />
                            <Hole position={[0, 0, 0.2]} />
                            {holeCount > 3 && <Hole position={[0, 0, -0.2]} />}
                        </>
                    )}
                </group>
            )}
        </group>
    );
};

export default GasJar;
