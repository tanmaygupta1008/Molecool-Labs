import React from 'react';
import { Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import Ripples from '../effects/Ripples';
import { useReactantsData } from '../../utils/visual-engine';

const SphericalContents = ({ 
    reactants = [], 
    radius = 1.0, 
    maxVolume = 500, // typical ml
    position = [0, 1, 0], // Center of the sphere
    isReceivingDrips = false,
    rippleColor = '#ffffff',
    ...props 
}) => {
    const { liquidVolume, liquidColor, solids, gasOpacity, gasColor } = useReactantsData(reactants, props);

    // If there is an explicit apparatus override, use it (0 to 1000 scale usually)
    const effectiveLiquidLevel = props.liquidLevelOverride !== undefined 
        ? props.liquidLevelOverride 
        : liquidVolume;

    // Define neck geometry. Assuming standard neck is 0.35 radius.
    const neckRadius = props.neckRadius || 0.35;
    const maxNeckHeight = props.maxNeckHeight || 1.0;
    const neckBaseRelativeY = props.neckBaseRelativeY || (radius * 0.90); // Where the neck cylinder starts

    // 1.0 fillRatio means spherical bowl is adequately full (up to neck base).
    const fillRatio = Math.min(Math.max(effectiveLiquidLevel / maxVolume, 0), 1.0 + (maxNeckHeight / (radius * 2)));

    // Split fill into sphere portion and neck portion
    const sphereFillRatio = Math.min(fillRatio, 1.0);
    const neckFillRatio = Math.max(0, fillRatio - 1.0);

    // Map sphere fill ratio to height (0 to neckBaseRelativeY + radius)
    // When sphereFillRatio is 1.0, liquid is exactly at the neck base.
    const maxSphereH = neckBaseRelativeY + radius; 
    const h = sphereFillRatio * maxSphereH;
    
    const ySurfaceLoc = h - radius; // relative to sphere center
    const thetaSurface = Math.acos(Math.max(Math.min(ySurfaceLoc / radius, 1), -1));
    const thetaLength = Math.PI - thetaSurface;
    
    // Top radius of the sphere chunk
    const surfaceRadius = radius * Math.sin(thetaSurface);
    
    const hasNeckLiquid = neckFillRatio > 0;
    const currentNeckH = neckFillRatio * maxNeckHeight;

    return (
        <group position={position}>
            {/* Liquid Volume */}
            {h > 0 && (
                <group>
                    {/* The Bowl of liquid */}
                    <Sphere args={[radius * 0.98, 32, 16, 0, Math.PI * 2, thetaSurface, thetaLength]}>
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </Sphere>
                    
                    {/* The Top Surface (Meniscus) - Only render if liquid is not spilling into neck */}
                    {!hasNeckLiquid && (
                        <mesh position={[0, ySurfaceLoc, 0]} rotation={[-Math.PI/2, 0, 0]}>
                            <circleGeometry args={[surfaceRadius * 0.98, 32]} />
                            <meshPhysicalMaterial
                                color={liquidColor}
                                transparent
                                opacity={0.8}
                                transmission={0.2}
                                roughness={0.1}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}

                    {/* Neck Liquid Volume vertically expanding upwards */}
                    {hasNeckLiquid && (
                        <group position={[0, neckBaseRelativeY + currentNeckH / 2, 0]}>
                            <Cylinder args={[neckRadius * 0.98, neckRadius * 0.98, currentNeckH, 32]}>
                                <meshPhysicalMaterial
                                    color={liquidColor}
                                    transparent
                                    opacity={0.8}
                                    transmission={0.2}
                                    roughness={0.1}
                                    side={THREE.DoubleSide}
                                />
                            </Cylinder>
                            
                            {/* Neck Top Meniscus */}
                            <mesh position={[0, currentNeckH / 2, 0]} rotation={[-Math.PI/2, 0, 0]}>
                                <circleGeometry args={[neckRadius * 0.98, 32]} />
                                <meshPhysicalMaterial
                                    color={liquidColor}
                                    transparent
                                    opacity={0.8}
                                    transmission={0.2}
                                    roughness={0.1}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        </group>
                    )}

                    {/* Ripples on the surface */}
                    <Ripples
                        position={[0, ySurfaceLoc + 0.01, 0]}
                        active={isReceivingDrips}
                        color={rippleColor}
                        baseScale={surfaceRadius * 0.9}
                    />
                </group>
            )}

            {/* Gas Volume */}
            {gasOpacity > 0 && (
                <Sphere args={[radius * 0.99, 32, 16]}>
                    <meshBasicMaterial 
                        color={gasColor} 
                        transparent 
                        opacity={gasOpacity} 
                        depthWrite={false}
                    />
                </Sphere>
            )}

            {/* Solid Render */}
            {solids && solids.length > 0 && (
                <group position={[0, -radius + 0.1, 0]}>
                    {solids.map((s, i) => {
                        const px = (Math.sin(i * 12.9898) * 0.5) * (radius * 0.5);
                        const pz = (Math.cos(i * 78.233) * 0.5) * (radius * 0.5);
                        const py = (i * 0.12);
                        const rx = Math.sin(i * 3.14);
                        const ry = Math.cos(i * 2.71);
                        const rz = Math.sin(i * 1.61);
                        const scale = s.scale || 1;

                        return (
                            <mesh key={i} position={[px, py, pz]} rotation={[rx, ry, rz]} scale={[scale, scale, scale]}>
                                <dodecahedronGeometry args={[0.15, 0]} />
                                <meshStandardMaterial color={s.color} roughness={0.9} />
                            </mesh>
                        );
                    })}
                </group>
            )}
        </group>
    );
};

export default SphericalContents;
