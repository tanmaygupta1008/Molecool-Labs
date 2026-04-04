import React from 'react';
import * as THREE from 'three';
import { Cylinder, Sphere, Torus } from '@react-three/drei';

const SeparatoryFunnel = (props) => {
    return (
        <group {...props}>
            {/* Top stopper rim */}
            <Cylinder args={[0.3, 0.25, 0.15, 32]} position={[0, 4.3, 0]}>
                <meshPhysicalMaterial
                    color="#f0f0f0"
                    transmission={0.4}
                    opacity={0.8}
                    transparent
                    roughness={0.2}
                />
            </Cylinder>
            
            {/* Top neck */}
            <Cylinder args={[0.2, 0.2, 0.5, 32, 1, true]} position={[0, 4.0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Top rounded shoulder (half sphere for the conical top) */}
            <Sphere args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 3.2, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Sphere>

            {/* Main conical body */}
            <Cylinder args={[1, 0.08, 2.5, 32, 1, true]} position={[0, 1.95, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Stem above stopcock */}
            <Cylinder args={[0.08, 0.08, 0.3, 16, 1, true]} position={[0, 0.55, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Stopcock valve assembly */}
            <group position={[0, 0.4, 0]}>
                {/* Horizontal barrel */}
                <Cylinder args={[0.15, 0.12, 0.5, 16]} rotation={[0, 0, Math.PI / 2]}>
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transmission={0.9}
                        opacity={0.6}
                        transparent
                        roughness={0.1}
                    />
                </Cylinder>
                {/* Knob/Handle */}
                <Cylinder args={[0.05, 0.05, 0.4, 16]} position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.3} />
                </Cylinder>
                <Cylinder args={[0.12, 0.12, 0.05, 16]} position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.3} />
                </Cylinder>
            </group>

            {/* Stem below stopcock */}
            <Cylinder args={[0.07, 0.05, 0.8, 16, 1, true]} position={[0, -0.1, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.05}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Liquid overlay (optional) */}
            {props.liquidValue > 0 && (
                <Cylinder args={[props.liquidValue * 0.9 + 0.1, 0.08, props.liquidValue * 2.5, 32]} position={[0, 0.7 + (props.liquidValue * 2.5) / 2, 0]}>
                    <meshPhysicalMaterial
                        color={props.liquidColor || "#aaddff"}
                        transmission={0.8}
                        opacity={0.8}
                        transparent
                        roughness={0}
                        depthWrite={false}
                    />
                </Cylinder>
            )}
        </group>
    );
};

export default SeparatoryFunnel;
