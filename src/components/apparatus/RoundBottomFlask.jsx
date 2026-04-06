import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sphere, Cylinder, Torus } from '@react-three/drei';
import Precipitate from '../effects/Precipitate';
import SphericalContents from './SphericalContents';

const RoundBottomFlask = (props) => {
    const { necks = 1, precipitateActive, precipitateAmount, precipitateColor, isHeating, reactants, ...rest } = props;
    
    // Side neck geometry builder
    // Tilted outwards by 30 degrees (Math.PI/6)
    const renderSideNeck = (isLeft) => {
        const sign = isLeft ? -1 : 1;
        const angle = sign * (Math.PI / 6); 
        // We want the base of the neck to sit roughly on the sphere surface (r=1) at an angle.
        // The neck is a bit narrower than the main neck.
        const radius = 0.25;
        const length = 1.2;
        // Position offset from center [0,1,0]
        const rOff = 0.9; 
        const baseX = Math.sin(angle) * rOff;
        const baseY = 1 + Math.cos(angle) * rOff;
        
        // The cylinder pivot is its center. We want to orient it and position its center.
        const centerX = baseX + Math.sin(angle) * (length / 2);
        const centerY = baseY + Math.cos(angle) * (length / 2);

        // Rim
        const rimX = baseX + Math.sin(angle) * length;
        const rimY = baseY + Math.cos(angle) * length;

        return (
            <group key={isLeft ? 'leftNeck' : 'rightNeck'}>
                <Cylinder args={[radius, radius, length, 32, 1, true]} position={[centerX, centerY, 0]} rotation={[0, 0, -angle]}>
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
                <Torus args={[radius, 0.04, 16, 32]} position={[rimX, rimY, 0]} rotation={[Math.PI / 2, -angle, 0]}>
                    <meshPhysicalMaterial
                        color="#ffffff"
                        transmission={0.95}
                        opacity={0.5}
                        transparent
                        roughness={0.1}
                    />
                </Torus>
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
                <Sphere
                    args={[1.02, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
                    position={[0, 1, 0]}
                >
                    <meshBasicMaterial
                        color="#ff4400"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.FrontSide} 
                    />
                </Sphere>
            )}

            {/* Center Neck: Cylinder */}
            <Cylinder args={[0.35, 0.35, 1.5, 32, 1, true]} position={[0, 2.5, 0]}>
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
            <Torus args={[0.35, 0.05, 16, 32]} position={[0, 3.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.5}
                    transparent
                    roughness={0.1}
                />
            </Torus>

            {/* Side Necks */}
            {necks >= 2 && renderSideNeck(false)} {/* Right side */}
            {necks >= 3 && renderSideNeck(true)}  {/* Left side */}

            {/* Render Precipitate */}
            {precipitateActive && (
                <Precipitate
                    type="sphere"
                    radius={1.0}
                    amount={precipitateAmount}
                    color={precipitateColor}
                    position={[0, 1.0, 0]}
                />
            )}

            {/* Reactant Contents */}
            <SphericalContents 
                reactants={reactants} 
                radius={1.0} 
                position={[0, 1, 0]} 
                neckRadius={0.35}
                neckBaseRelativeY={0.9} // Safe intersection point within the sphere
                maxNeckHeight={1.4} // Fills most of the 1.5 neck
                {...props} 
            />
        </group>
    );
};

export default RoundBottomFlask;
