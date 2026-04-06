import React from 'react';
import * as THREE from 'three';
import { Cylinder, Sphere } from '@react-three/drei';
import { useReactantsData } from '../../utils/visual-engine';

const DroppingFunnel = (props) => {
    const { reactants = [], ...rest } = props;
    const { liquidVolume, liquidColor, solids } = useReactantsData(reactants, props);

    const effectiveLiquidVol = props.liquidLevelOverride !== undefined 
        ? props.liquidLevelOverride 
        : liquidVolume;
        
    // max vol in funnel ~ 250. Cylindrical, so linear ratio.
    const volRatio = Math.min(Math.max(effectiveLiquidVol / 250, 0), 1.0);
    const heightRatio = volRatio;

    // Shared glass material helper
    const glassMat = {
        color: "#e8f4ff",
        transmission: 0.96,
        opacity: 0.28,
        transparent: true,
        roughness: 0.02,
        thickness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
    };

    const frostedMat = {
        color: "#d0e4f0",
        transmission: 0.45,
        opacity: 0.85,
        transparent: true,
        roughness: 0.25,
    };

    // Body dimensions
    const BODY_RADIUS = 0.45;
    const BODY_HEIGHT = 2.4;
    const BODY_Y = 2.0;
    const NECK_RADIUS = 0.16;

    // Dome cap centers
    const TOP_DOME_Y = BODY_Y + BODY_HEIGHT / 2; // 3.2
    const BOT_DOME_Y = BODY_Y - BODY_HEIGHT / 2; // 0.8

    return (
        <group {...rest}>

            {/* ── TOP RECEPTACLE (Female Joint) ── */}
            {/* Rim cap */}
            <Cylinder args={[0.24, 0.21, 0.1, 22]} position={[0, 4.4, 0]}>
                <meshPhysicalMaterial {...frostedMat} />
            </Cylinder>
            {/* Ground glass socket */}
            <Cylinder args={[0.21, 0.18, 0.55, 22]} position={[0, 4.075, 0]}>
                <meshPhysicalMaterial {...frostedMat} />
            </Cylinder>

            {/* ── TOP NECK ── */}
            <Cylinder args={[NECK_RADIUS, NECK_RADIUS, 0.18, 20]} position={[0, 3.71, 0]}>
                <meshPhysicalMaterial {...glassMat} />
            </Cylinder>

            {/* ── TOP SHOULDER DOME ── */}
            {/* Hemisphere transitioning to neck */}
            <Sphere args={[BODY_RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, TOP_DOME_Y, 0]}>
                <meshPhysicalMaterial {...glassMat} />
            </Sphere>

            {/* ── MAIN CYLINDRICAL BODY ── */}
            {/* Open ended cylinder (capless) */}
            <Cylinder args={[BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 30, 1, true]} position={[0, BODY_Y, 0]}>
                <meshPhysicalMaterial {...glassMat} />
            </Cylinder>

            {/* ── BOTTOM SHOULDER DOME ── */}
            {/* Inverted hemisphere funneling down */}
            <Sphere args={[BODY_RADIUS, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} position={[0, BOT_DOME_Y, 0]}>
                <meshPhysicalMaterial {...glassMat} />
            </Sphere>

            {/* ── MAIN VERTICAL STEM (passes through stopcock) ── */}
            <Cylinder args={[NECK_RADIUS, NECK_RADIUS, 0.78, 20, 1, true]} position={[0, -0.01, 0]}>
                <meshPhysicalMaterial {...glassMat} />
            </Cylinder>

            {/* ── STOPCOCK VALVE ASSEMBLY (Teflon style) ── */}
            <group position={[0, 0.1, 0]}>
                {/* Horizontal glass outer barrel */}
                <Cylinder args={[0.13, 0.13, 0.45, 16]} rotation={[0, 0, Math.PI / 2]}>
                    <meshPhysicalMaterial color="#e8f4ff" transmission={0.92} opacity={0.45} transparent roughness={0.05} />
                </Cylinder>
                
                {/* PTFE Plug Body (White) */}
                <Cylinder args={[0.07, 0.09, 0.55, 16]} position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                </Cylinder>

                {/* Right Red Nut */}
                <Cylinder args={[0.10, 0.08, 0.1, 14]} position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#cc1e1e" roughness={0.6} />
                </Cylinder>
                
                {/* Left Red Handle Base */}
                <Cylinder args={[0.12, 0.12, 0.08, 14]} position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#cc1e1e" roughness={0.6} />
                </Cylinder>

                {/* Left Red Handle Lever (pointing UP) */}
                <Cylinder args={[0.035, 0.05, 0.35, 10]} position={[-0.32, 0.175, 0]}>
                    <meshStandardMaterial color="#cc1e1e" roughness={0.6} />
                </Cylinder>
            </group>

            {/* ── BOTTOM GROUND GLASS JOINT (male plug) ── */}
            <Cylinder args={[0.17, 0.13, 0.45, 24]} position={[0, -0.625, 0]}>
                <meshPhysicalMaterial {...frostedMat} />
            </Cylinder>
            {/* Drip tip */}
            <Cylinder args={[0.13, 0.10, 0.15, 20]} position={[0, -0.925, 0]}>
                <meshPhysicalMaterial {...frostedMat} />
            </Cylinder>

            {/* ── LIQUID FILL ── */}
            {effectiveLiquidVol > 0 && (
                <group>
                    {/* Liquid inside the bottom dome */}
                    <Sphere args={[BODY_RADIUS * 0.975, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} position={[0, BOT_DOME_Y + 0.02, 0]}>
                        <meshPhysicalMaterial color={liquidColor} transmission={0.2} opacity={0.82} transparent roughness={0.1} />
                    </Sphere>

                    {/* Liquid inside the main cylinder */}
                    {heightRatio > 0 && (
                        <Cylinder 
                            args={[BODY_RADIUS * 0.975, BODY_RADIUS * 0.975, heightRatio * BODY_HEIGHT * 0.97, 28]} 
                            position={[0, BOT_DOME_Y + (heightRatio * BODY_HEIGHT * 0.97) / 2 + 0.03, 0]}
                        >
                            <meshPhysicalMaterial
                                color={liquidColor}
                                transmission={0.2}
                                opacity={0.82}
                                transparent
                                roughness={0.1}
                                side={THREE.DoubleSide}
                            />
                        </Cylinder>
                    )}
                </group>
            )}

            {/* ── SOLID PRECIPITATE ── */}
            {solids && solids.length > 0 && (
                <group position={[0, BOT_DOME_Y + 0.1, 0]}>
                    {solids.map((s, i) => {
                        const angle = i * 2.399;
                        const r = (Math.sin(i * 12.98) * 0.5 + 0.5) * BODY_RADIUS * 0.5;
                        const px = Math.cos(angle) * r;
                        const pz = Math.sin(angle) * r;
                        const py = i * 0.08;
                        const scale = s.scale || 1;
                        return (
                            <mesh key={i} position={[px, py, pz]} scale={[scale, scale, scale]}>
                                <dodecahedronGeometry args={[0.1, 0]} />
                                <meshStandardMaterial color={s.color} roughness={0.9} />
                            </mesh>
                        );
                    })}
                </group>
            )}

        </group>
    );
};

export default DroppingFunnel;
