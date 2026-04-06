import React from 'react';
import * as THREE from 'three';
import { Sphere, Cylinder, Torus } from '@react-three/drei';
import SphericalContents from './SphericalContents';

const DistillationFlask = (props) => {
    const { precipitateActive, precipitateAmount, precipitateColor, isHeating, reactants, ...rest } = props;

    // Side arm: angles downwards
    const renderSideArm = () => {
        const radius = 0.12;
        const length = 4.5;
        const bendAngle = -Math.PI / 6; // gently downwards (-30 degrees)

        // Starting position of side arm attached to the neck
        const startX = 0.35;
        const startY = 3.2; 

        return (
            <group position={[startX - 0.05, startY, 0]}>
                <group rotation={[0, 0, bendAngle]}>
                    {/* Cylinder positioned such that its starting face is at 0,0,0 of this group */}
                    <Cylinder args={[radius, radius, length, 16, 1, true]} position={[length / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        <meshPhysicalMaterial
                            color="#ffffff"
                            transmission={0.95}
                            opacity={0.3}
                            transparent
                            roughness={0}
                            thickness={0.1}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </Cylinder>
                    {/* Add a small rim at the tip of the standard taper side arm */}
                    <Torus args={[radius, 0.03, 16, 32]} position={[length, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.5} transparent roughness={0.1} />
                    </Torus>
                </group>
            </group>
        );
    };

    return (
        <group {...rest}>
            {/* Body: Sphere */}
            <Sphere args={[1, 32, 32]} position={[0, 1, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Sphere>

            {/* Thermal Glow Overlay (Base Heating) */}
            {isHeating && (
                <Sphere args={[1.02, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} position={[0, 1, 0]}>
                    <meshBasicMaterial color="#ff4400" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.FrontSide} />
                </Sphere>
            )}

            {/* Center Long Neck: Cylinder */}
            <Cylinder args={[0.35, 0.35, 3.0, 32, 1, true]} position={[0, 3.0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Center Rim */}
            <Torus args={[0.35, 0.05, 16, 32]} position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>

            {/* Side Arm */}
            {renderSideArm()}

            {/* Reactant Contents */}
            <SphericalContents 
                reactants={reactants} 
                radius={1.0} 
                position={[0, 1, 0]} 
                neckRadius={0.35}
                neckBaseRelativeY={0.9} 
                maxNeckHeight={2.8} 
                {...props} 
            />
        </group>
    );
};

export default DistillationFlask;
