import React from 'react';
import * as THREE from 'three';
import { Cylinder, Sphere } from '@react-three/drei';
import Ripples from '../effects/Ripples';
import { useReactantsData } from '../../utils/visual-engine';

const ConicalContents = ({
    reactants = [],
    maxVolume = 250,
    baseRadius = 1.0,
    neckRadius = 0.35,
    coneHeight = 1.8, // The height where the cone converges to the neck
    maxVisibleHeight = 2.2, // Can fill up into the neck
    position = [0, 0, 0], // The base Y position
    isReceivingDrips = false,
    rippleColor = '#ffffff',
    ...props
}) => {
    const { liquidVolume, liquidColor, solids, gasOpacity, gasColor } = useReactantsData(reactants, props);

    const effectiveLiquidVol = props.liquidLevelOverride !== undefined 
        ? props.liquidLevelOverride 
        : liquidVolume;

    // Convert volume to height (Approximation, standard conical flask scaling)
    const h = Math.min((effectiveLiquidVol / maxVolume) * coneHeight, maxVisibleHeight);

    // If h > coneHeight, we are filling up the straight neck
    const isIntoNeck = h > coneHeight;
    // Calculate top radius of the liquid truncated cone
    const topRadius = isIntoNeck 
        ? neckRadius 
        : neckRadius + (baseRadius - neckRadius) * (1 - (h / coneHeight));

    return (
        <group position={position}>
            {/* Liquid Volume */}
            {h > 0 && (
                <group position={[0, h / 2, 0]}>
                    <mesh>
                        <cylinderGeometry args={[
                            topRadius * 0.98,
                            baseRadius * 0.98,
                            h * 0.98, // Slightly shrink height so it doesn't overlap perfectly horizontally either
                            32
                        ]} />
                        <meshPhysicalMaterial
                            color={liquidColor}
                            transparent
                            opacity={0.8}
                            transmission={0.2}
                            roughness={0.1}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    <Ripples
                        position={[0, h / 2 + 0.01, 0]}
                        active={isReceivingDrips}
                        color={rippleColor}
                        baseScale={topRadius}
                    />
                </group>
            )}

            {/* Gas Volume */}
            {gasOpacity > 0 && (
                <group position={[0, coneHeight / 2, 0]}>
                    <mesh>
                       <cylinderGeometry args={[neckRadius * 0.98, baseRadius * 0.98, coneHeight, 32]} />
                       <meshBasicMaterial 
                            color={gasColor} 
                            transparent 
                            opacity={gasOpacity} 
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            )}

            {/* Solid Render */}
            {solids && solids.length > 0 && (
                <group position={[0, 0.1, 0]}>
                    {solids.map((s, i) => {
                        const px = (Math.sin(i * 12.9898) * 0.5) * (baseRadius * 0.5);
                        const pz = (Math.cos(i * 78.233) * 0.5) * (baseRadius * 0.5);
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

export default ConicalContents;
