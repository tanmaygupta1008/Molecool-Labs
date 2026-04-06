import React from 'react';
import * as THREE from 'three';
import { Cylinder, Sphere, Torus } from '@react-three/drei';
import { useReactantsData } from '../../utils/visual-engine';

const SeparatoryFunnel = (props) => {
    const { reactants = [], ...rest } = props;
    const { liquidVolume, liquidColor, solids } = useReactantsData(reactants, props);

    // If an explicit override exists, use it, else scale volume directly (0-1000 range usually)
    const effectiveLiquidVol = props.liquidLevelOverride !== undefined 
        ? props.liquidLevelOverride 
        : liquidVolume;
        
    // max vol in funnel ~ 500.
    const volRatio = Math.min(Math.max(effectiveLiquidVol / 500, 0), 1.0);
    
    // For an inverted cone (wide top, narrow bottom), volume is highly non-linear with height.
    // A small volume occupies a large chunk of the narrow bottom stem.
    // We use Math.cbrt(volRatio) to more naturally map the liquid volume to its visual height.
    const heightRatio = Math.cbrt(volRatio);

    return (
        <group {...rest}>
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

            {/* Dynamic Liquid overlay */}
            {heightRatio > 0 && (
                <Cylinder args={[
                        ((heightRatio * 0.92) + 0.08) * 0.98, // shrink by 2% to avoid Z-fight
                        0.08 * 0.98, 
                        heightRatio * 2.5 * 0.98, 
                        32
                    ]} 
                    position={[0, 0.7 + (heightRatio * 2.5 * 0.98) / 2, 0]}
                >
                    <meshPhysicalMaterial
                        color={liquidColor}
                        transmission={0.2}
                        opacity={0.8}
                        transparent
                        roughness={0.1}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </Cylinder>
            )}

            {/* Solids render at the bottom of the funnel */}
            {solids && solids.length > 0 && (
                <group position={[0, 0.8, 0]}>
                    {solids.map((s, i) => {
                        const scale = s.scale || 1;
                        return (
                            <mesh key={i} position={[(Math.sin(i * 12) * 0.1), i * 0.2, (Math.cos(i * 78) * 0.1)]} scale={[scale, scale, scale]}>
                                <dodecahedronGeometry args={[0.08, 0]} />
                                <meshStandardMaterial color={s.color} roughness={0.9} />
                            </mesh>
                        );
                    })}
                </group>
            )}
        </group>
    );
};

export default SeparatoryFunnel;
