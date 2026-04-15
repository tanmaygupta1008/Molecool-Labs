'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// Import apparatus map - we'll need to duplicate or export this from MacroView/Apparatus index
// For now, let's assume we can import from '../../components/apparatus' directly like MacroView did
import * as Apparatus from '../../components/apparatus'; // Adjust import path if needed
import Clamp from '../../components/apparatus/Clamp';
import PowerSupply from '../../components/apparatus/PowerSupply';
import Wire from '../../components/apparatus/Wire';
import RubberCork from '../../components/apparatus/RubberCork';
import WorkTable from '../../components/apparatus/WorkTable';
import GasSource from '../../components/apparatus/GasSource';
import WaterSource from '../../components/apparatus/WaterSource';
import { getApparatusAnchors } from '../../utils/apparatus-anchors';
import { detectApparatusTypeAbove } from '../../utils/apparatus-logic';

// import reactionsData from '../../data/reactions.json'; // REMOVED to avoid HMR issues

// Simple Error Boundary to catch Canvas crashes
class CanvasErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Canvas crashed:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center text-red-500 font-mono">
                    <span className="text-4xl mb-4">💥 WebGL Crash</span>
                    <h2 className="text-xl font-bold mb-2">The 3D Scene encountered a critical error:</h2>
                    <p className="bg-red-900/30 p-4 rounded text-sm max-w-2xl overflow-auto select-all">{this.state.error?.toString()}</p>
                    <button onClick={() => this.setState({hasError: false})} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Attempt Recovery</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Re-use shared Apparatus Map ---
const APPARATUS_MAP = {
    'BunsenBurner': Apparatus.BunsenBurner,
    'TripodStand': Apparatus.TripodStand,
    'WireGauze': Apparatus.WireGauze,
    'Crucible': Apparatus.Crucible,
    'Tongs': Apparatus.Tongs,
    'HeatproofMat': Apparatus.HeatproofMat,
    'Beaker': Apparatus.Beaker,
    'ConicalFlask': Apparatus.ConicalFlask,
    'RoundBottomFlask': Apparatus.RoundBottomFlask,
    'TwoNeckFlask': Apparatus.TwoNeckFlask,
    'ThreeNeckFlask': Apparatus.ThreeNeckFlask,
    'SeparatoryFunnel': Apparatus.SeparatoryFunnel,
    'VolumetricFlask': Apparatus.VolumetricFlask,
    'DistillationFlask': Apparatus.DistillationFlask,
    'VacuumFlask': Apparatus.VacuumFlask,
    'DroppingFunnel': Apparatus.DroppingFunnel,
    'RefluxCondenser': Apparatus.RefluxCondenser,
    'Thermometer': Apparatus.Thermometer,
    'TestTube': Apparatus.TestTube,
    'TestTubeStand': Apparatus.TestTubeStand,
    'BoilingTube': Apparatus.BoilingTube || Apparatus.TestTube,
    'MeasuringCylinder': Apparatus.MeasuringCylinder,
    'Dropper': Apparatus.Dropper,
    'StirringRod': Apparatus.StirringRod,
    'GlassRod': Apparatus.StirringRod,
    'WaterTrough': Apparatus.WaterTrough,
    'WaterTrough_GasJar': (props) => <Apparatus.WaterTrough {...props} invertedSetup="GasJar" />,
    'WaterTrough_TestTube': (props) => <Apparatus.WaterTrough {...props} invertedSetup="TestTube" />,
    'GasJar': Apparatus.GasJar,
    'DeliveryTube': Apparatus.DeliveryTube,
    'RubberCork': RubberCork,
    'Cork': RubberCork,
    'Burette': Apparatus.Burette,
    'RetortStand': Apparatus.RetortStand,
    'Clamp': Clamp,
    'RingClamp': Apparatus.RingClamp,
    'ElectrolysisSetup': Apparatus.ElectrolysisSetup,
    'PowerSupply': PowerSupply,
    'MagnesiumRibbon': Apparatus.MagnesiumRibbon,
    'ZincGranules': Apparatus.ZincGranules,
    'Forceps': Apparatus.Forceps,
    'SafetyShield': Apparatus.SafetyShield,
    'DropperBottle': Apparatus.DropperBottle,
    'IronNail': Apparatus.IronNail,
    'GasTap': Apparatus.GasTap,
    'RedLitmusPaper': Apparatus.RedLitmusPaper,
    'BlueLitmusPaper': Apparatus.BlueLitmusPaper,
    'LitmusPaper': Apparatus.LitmusPaper, // Keep backwards compatibility if existing saves use this
    'Wire': Wire,
    'WorkTable': WorkTable,
    'GasSource': GasSource,
    'WaterSource': WaterSource,
};

const LabTable = ({ width = 14, depth = 10 }) => (
    <group position={[0, -0.05, 0]}>
        {/* Table Top (Dark Epoxy Resin) */}
        <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[width, 0.1, depth]} />
            <meshStandardMaterial color="#1f2022" roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Anti-Spill Lip / Rim */}
        <mesh receiveShadow position={[0, 0.08, -depth/2 + 0.05]}>
            <boxGeometry args={[width + 0.2, 0.05, 0.1]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[0, 0.08, depth/2 - 0.05]}>
            <boxGeometry args={[width + 0.2, 0.05, 0.1]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[-width/2 - 0.05, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.05, depth]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[width/2 + 0.05, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.05, depth]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>

        {/* === WASH BASIN (raised stainless lab sink) === */}
        {width >= 10 && depth >= 8 && (() => {
            // Raised basin — walls go UP so interior is always visible
            const bW  = 2.0;   // outer width
            const bD  = 1.4;   // outer depth
            const bH  = 0.44;  // basin height above table
            const wT  = 0.08;  // wall thickness
            const bInW = bW - wT * 2;   // 1.84  inner width
            const bInD = bD - wT * 2;   // 1.24  inner depth

            // Brushed-stainless material params (matches reference image)
            const sc = "#8a9696";   // steel color
            const sr = 0.40;        // roughness
            const sm = 0.92;        // metalness
            const se = "#0c1010";   // emissive (prevents pitch-black in shadow)

            // Faucet — gooseneck: vertical stem → semicircular arc → downward spout
            const fZ = -(bD / 2 - wT / 2);    // Z centre of back wall (stem base)
            const stemBaseY = bH + 0.07;
            const stemTopY  = bH + 1.28;
            // Arc constants (semicircle in ZY plane, going from stem top forward + over)
            const arcR  = 0.34;                             // gooseneck bend radius
            const arcN  = 12;                              // segments for smoothness
            const arcCZ = fZ + arcR;                       // arc centre Z
            const spoutZ = fZ + 2 * arcR;                  // spout hangs here
            const spoutL = 0.60;                           // downward spout length
            const spoutCY = stemTopY - spoutL / 2;
            const spoutBY = stemTopY - spoutL;

            return (
                // Y=0.05 → the group sits at table-top surface level
                <group position={[width/2 - 2.2, 0.05, -depth/2 + 2.2]}>

                    {/* ── BACK WALL ── */}
                    <mesh position={[0, bH/2, -(bD/2 - wT/2)]}>
                        <boxGeometry args={[bW, bH, wT]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── FRONT WALL ── */}
                    <mesh position={[0, bH/2, bD/2 - wT/2]}>
                        <boxGeometry args={[bW, bH, wT]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── LEFT WALL ── */}
                    <mesh position={[-(bW/2 - wT/2), bH/2, 0]}>
                        <boxGeometry args={[wT, bH, bInD]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── RIGHT WALL ── */}
                    <mesh position={[bW/2 - wT/2, bH/2, 0]}>
                        <boxGeometry args={[wT, bH, bInD]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>

                    {/* ── BASIN FLOOR (darker — depth cue) ── */}
                    <mesh position={[0, wT/2, 0]}>
                        <boxGeometry args={[bInW, wT, bInD]} />
                        <meshStandardMaterial color="#788484" roughness={0.38} metalness={0.94} emissive="#0a0d0d" />
                    </mesh>

                    {/* ── TOP RIM CAPS (polished lip) ── */}
                    <mesh position={[0, bH + 0.012, -(bD/2 - wT/2)]}>
                        <boxGeometry args={[bW + 0.05, 0.024, wT + 0.04]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[0, bH + 0.012, bD/2 - wT/2]}>
                        <boxGeometry args={[bW + 0.05, 0.024, wT + 0.04]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[-(bW/2 - wT/2), bH + 0.012, 0]}>
                        <boxGeometry args={[wT + 0.04, 0.024, bInD + 0.02]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[bW/2 - wT/2, bH + 0.012, 0]}>
                        <boxGeometry args={[wT + 0.04, 0.024, bInD + 0.02]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>

                    {/* ── DRAIN — concentric ring design ── */}
                    {/* Outer flat disc */}
                    <mesh position={[0, wT + 0.008, 0]}>
                        <cylinderGeometry args={[0.13, 0.13, 0.014, 40]} />
                        <meshStandardMaterial color="#9ab0b0" roughness={0.20} metalness={0.97} emissive="#080c0c" />
                    </mesh>
                    {/* Middle raised bezel */}
                    <mesh position={[0, wT + 0.020, 0]}>
                        <cylinderGeometry args={[0.083, 0.103, 0.018, 40]} />
                        <meshStandardMaterial color="#afc0c0" roughness={0.14} metalness={0.98} />
                    </mesh>
                    {/* Inner collar */}
                    <mesh position={[0, wT + 0.028, 0]}>
                        <cylinderGeometry args={[0.040, 0.058, 0.014, 32]} />
                        <meshStandardMaterial color="#c2d2d2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    {/* Drain hole */}
                    <mesh position={[0, wT + 0.004, 0]}>
                        <cylinderGeometry args={[0.034, 0.034, 0.018, 30]} />
                        <meshStandardMaterial color="#1a2020" roughness={0.6} metalness={0.5} />
                    </mesh>
                    {/* Centre nub */}
                    <mesh position={[0, wT + 0.030, 0]}>
                        <cylinderGeometry args={[0.010, 0.014, 0.010, 16]} />
                        <meshStandardMaterial color="#5a6666" roughness={0.3} metalness={0.9} />
                    </mesh>

                    {/* ── GOOSENECK FAUCET ── */}
                    {/* Base disc on back rim */}
                    <mesh position={[0, stemBaseY, fZ]}>
                        <cylinderGeometry args={[0.09, 0.10, 0.14, 18]} />
                        <meshStandardMaterial color="#b0b0b0" roughness={0.05} metalness={1.0} />
                    </mesh>
                    {/* Vertical stem */}
                    <mesh position={[0, (stemBaseY + 0.07 + stemTopY) / 2, fZ]}>
                        <cylinderGeometry args={[0.048, 0.054, stemTopY - stemBaseY - 0.07, 16]} />
                        <meshStandardMaterial color="#c2c2c2" roughness={0.05} metalness={1.0} />
                    </mesh>
                    {/* Collar cap */}
                    <mesh position={[0, stemTopY, fZ]}>
                        <cylinderGeometry args={[0.055, 0.048, 0.04, 16]} />
                        <meshStandardMaterial color="#a8a8a8" roughness={0.06} metalness={1.0} />
                    </mesh>
                    {/* ── SMOOTH GOOSENECK ARC (10-segment semicircle) ── */}
                    {/*
                      Arc: in ZY plane, centre = (0, stemTopY, arcCZ)
                      θ sweeps from π (pointing back → stem top) to 0 (pointing forward → spout top)
                      pos  = (0, stemTopY + arcR·sin(θ_mid), arcCZ + arcR·cos(θ_mid))
                      rot  = [-θ_mid, 0, 0]   (tangent direction = [0, cos(θ), -sin(θ)])
                      len  = 2·arcR·sin(π/(2·arcN))  (chord length)
                    */}
                    {Array.from({ length: arcN }, (_, i) => {
                        const tS   = Math.PI - (Math.PI / arcN) * i;
                        const tE   = Math.PI - (Math.PI / arcN) * (i + 1);
                        const tM   = (tS + tE) / 2;
                        const segLen = 2 * arcR * Math.sin(Math.PI / (2 * arcN));
                        const py   = stemTopY + arcR * Math.sin(tM);
                        const pz   = arcCZ    + arcR * Math.cos(tM);
                        return (
                            <mesh key={i} position={[0, py, pz]} rotation={[-tM, 0, 0]}>
                                <cylinderGeometry args={[0.044, 0.044, segLen + 0.01, 16]} />
                                <meshStandardMaterial color="#c8c8c8" roughness={0.04} metalness={1.0} />
                            </mesh>
                        );
                    })}
                    {/* ── NOZZLE TIP (small cap at arc opening end) ── */}
                    <mesh position={[0, stemTopY, spoutZ]}>
                        <cylinderGeometry args={[0.040, 0.044, 0.06, 20]} />
                        <meshStandardMaterial color="#909090" roughness={0.12} metalness={0.9} />
                    </mesh>

                    {/* ── HOT HANDLE (Red, Left) ── */}
                    <group position={[0, bH + 0.28, fZ]}>
                        <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.024, 0.024, 0.23, 10]} />
                            <meshStandardMaterial color="#bcbcbc" roughness={0.08} metalness={0.9} />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
                            <meshStandardMaterial color="#cc2222" roughness={0.28} metalness={0.5} />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.016, 0.12]} />
                            <meshStandardMaterial color="#991111" />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.12, 0.016]} />
                            <meshStandardMaterial color="#991111" />
                        </mesh>
                    </group>

                    {/* ── COLD HANDLE (Blue, Right) ── */}
                    <group position={[0, bH + 0.28, fZ]}>
                        <mesh position={[0.17, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.024, 0.024, 0.23, 10]} />
                            <meshStandardMaterial color="#bcbcbc" roughness={0.08} metalness={0.9} />
                        </mesh>
                        <mesh position={[0.295, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
                            <meshStandardMaterial color="#2244cc" roughness={0.28} metalness={0.5} />
                        </mesh>
                        <mesh position={[0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.016, 0.12]} />
                            <meshStandardMaterial color="#112299" />
                        </mesh>
                        <mesh position={[0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.12, 0.016]} />
                            <meshStandardMaterial color="#112299" />
                        </mesh>
                    </group>

                </group>
            );
        })()}



        {/* Legs / Framing */}

        {[-width/2 + 0.35, width/2 - 0.35].map(x =>
            [-depth/2 + 0.35, depth/2 - 0.35].map(z => (
                <group key={`${x}-${z}`} position={[x, -2.05, z]}>
                    {/* Main Leg */}
                    <mesh receiveShadow castShadow>
                        <boxGeometry args={[0.3, 4, 0.3]} />
                        <meshStandardMaterial color="#333333" roughness={0.6} />
                    </mesh>
                    {/* Metal Foot Pad */}
                    <mesh receiveShadow position={[0, -2.02, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
                        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.8} />
                    </mesh>
                </group>
            ))
        )}

        {/* Support Crossbars */}
        <mesh position={[0, -1.05, 0]}>
            <boxGeometry args={[width - 0.8, 0.15, 0.15]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        <mesh position={[-width/2 + 0.35, -1.05, 0]}>
            <boxGeometry args={[0.15, 0.15, depth - 0.8]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        <mesh position={[width/2 - 0.35, -1.05, 0]}>
            <boxGeometry args={[0.15, 0.15, depth - 0.8]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
    </group>
);

// --- COMPONENTS ---

// Keyboard Navigation Component
// ─── CameraController ────────────────────────────────────────────────────────
// Uses refs instead of useState so keydown/keyup NEVER trigger React re-renders.
// All movement is consumed imperatively inside useFrame.
const CameraController = () => {
    const { camera } = useThree();
    // Ref-based movement flags — mutations here are invisible to React
    const movementRef = useRef({
        forward: false, backward: false,
        left: false, right: false,
        up: false, down: false
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            const m = movementRef.current;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    m.forward  = true; break;
                case 'KeyS': case 'ArrowDown':  m.backward = true; break;
                case 'KeyA': case 'ArrowLeft':  m.left     = true; break;
                case 'KeyD': case 'ArrowRight': m.right    = true; break;
                case 'KeyQ': m.up   = true; break;
                case 'KeyE': m.down = true; break;
            }
        };
        const handleKeyUp = (e) => {
            const m = movementRef.current;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    m.forward  = false; break;
                case 'KeyS': case 'ArrowDown':  m.backward = false; break;
                case 'KeyA': case 'ArrowLeft':  m.left     = false; break;
                case 'KeyD': case 'ArrowRight': m.right    = false; break;
                case 'KeyQ': m.up   = false; break;
                case 'KeyE': m.down = false; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        const m = movementRef.current;
        // Early-exit if nothing is held — avoids work on every idle frame
        if (!m.forward && !m.backward && !m.left && !m.right && !m.up && !m.down) return;

        const speed = 10 * delta;
        const moveVec = new THREE.Vector3();

        if (m.forward || m.backward) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            if (m.forward)  moveVec.add(forward);
            if (m.backward) moveVec.sub(forward);
        }
        if (m.left || m.right) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const right = new THREE.Vector3();
            right.crossVectors(forward, camera.up).normalize();
            if (m.right) moveVec.add(right);
            if (m.left)  moveVec.sub(right);
        }
        if (m.up)   moveVec.y += 1;
        if (m.down) moveVec.y -= 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(speed);
            camera.position.add(moveVec);
            if (state.controls) {
                state.controls.target.add(moveVec);
                state.controls.update();
            }
        }
    });

    return null;
};


const TubePointEditor = ({ points, position, rotation, scale, onUpdatePoints, selectedIndices = [], onSelectIndex }) => {
    // Generate stable IDs keyed only to the index, not random — avoids re-mounting on every render
    const pointIds = useMemo(() => {
        return points.map((_, i) => `tube-point-${i}`);
    }, [points.length]);

    const [isDragging, setIsDragging] = useState(false);
    const dummyRefs = useRef([]);
    const tubeRef = useRef();
    const lastGeometryUpdate = useRef(0);

    // Ensure dummyRefs is correct size
    dummyRefs.current = points.map((_, i) => dummyRefs.current[i] || React.createRef());

    // Imperative update of the tube geometry (Throttled to prevent VRAM memory leaks)
    useFrame((state) => {
        if (isDragging && tubeRef.current && dummyRefs.current.every(r => r.current)) {
            const now = state.clock.elapsedTime;
            // Throttle geometry reconstruction to 20 frames per second (0.05s) to avoid Context Loss
            if (now - lastGeometryUpdate.current > 0.05) {
                lastGeometryUpdate.current = now;
                const currentPositions = dummyRefs.current.map(r => r.current.position);
                const path = new THREE.CatmullRomCurve3(currentPositions.map(p => p.clone()));
                // Update geometry
                const newGeo = new THREE.TubeGeometry(path, 64, 0.03, 8, false);
                tubeRef.current.geometry.dispose();
                tubeRef.current.geometry = newGeo;
            }
        }
    });

    const handleDragStart = () => setIsDragging(true);

    const handleDragChange = () => { };

    const handleDragEnd = (index) => {
        setIsDragging(false);
        const dummy = dummyRefs.current[index].current;
        if (dummy) {
            const newPos = [dummy.position.x, dummy.position.y, dummy.position.z];
            const newPoints = [...points];
            newPoints[index] = newPos;
            onUpdatePoints(newPoints);
        }
    };

    const initialCurve = useMemo(() => {
        if (points.length < 2) return null;
        return new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    }, [points]);

    return (
        <group>
            {/* Live Tube Preview - Managed via Ref and useFrame */}
            <mesh ref={tubeRef}>
                {initialCurve && <tubeGeometry args={[initialCurve, 64, 0.03, 8, false]} />}
                <meshBasicMaterial color={isDragging ? "red" : "yellow"} opacity={0.6} transparent depthTest={false} />
            </mesh>

            {points.map((p, i) => {
                const isSelected = selectedIndices.includes(i);
                return (
                    <group key={pointIds[i] || i}>
                        {isSelected ? (
                            <TransformControls
                                mode="translate"
                                size={0.3}
                                onMouseDown={handleDragStart}
                                onChange={handleDragChange}
                                onMouseUp={() => handleDragEnd(i)}
                                showX={selectedIndices.length === 1} // Only show controls if single point selected? Or all? User wants to move "the selected point". 
                                showY={selectedIndices.length === 1}
                                showZ={selectedIndices.length === 1}
                                enabled={selectedIndices.length === 1} // Disable drag if multiple selected to avoid confusion?
                            >
                                <mesh
                                    ref={dummyRefs.current[i]}
                                    position={p}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectIndex(i);
                                    }}
                                >
                                    <sphereGeometry args={[0.12, 16, 16]} />
                                    <meshBasicMaterial color="yellow" depthTest={false} transparent opacity={0.9} />
                                </mesh>
                            </TransformControls>
                        ) : (
                            <mesh
                                ref={dummyRefs.current[i]}
                                position={p}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectIndex(i);
                                }}
                            >
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshBasicMaterial color="red" depthTest={false} transparent opacity={0.6} />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

// ─── SceneSync ──────────────────────────────────────────────────────────────
// Bridges React re-renders and Three.js draw calls when `frameloop="demand"`.
// After every React render, calls `invalidate()` once to flush scene changes.
// When animated items (BunsenBurner flame) are present it keeps looping.
const SceneSync = ({ hasAnims }) => {
    const { invalidate } = useThree();
    // Flush after every React re-render so prop changes show immediately.
    useEffect(() => { invalidate(); });
    // Keep the render loop alive while animated items exist.
    useFrame(state => { if (hasAnims) state.invalidate(); });
    return null;
};

const AnchorEditor = ({ item, onUpdateItem }) => {
    const defaultAnchors = useMemo(() => getApparatusAnchors(item), [item]);

    // Merge overrides
    const anchors = defaultAnchors.map(a => {
        const override = item.anchorOverrides?.[a.id];
        if (override) return { ...a, position: override };
        return a;
    });

    const customAnchors = item.customAnchors || [];
    const allAnchors = [...anchors, ...customAnchors];

    // We need to store refs to the *objects* being moved by TransformControls
    // TransformControls usually attaches to a target object.
    // If we map TransformControls around each mesh, moving the control moves the mesh.
    // We need to read the mesh's new position on DragEnd.

    const dummyRefs = useRef([]);
    // Ensure refs array is synced
    dummyRefs.current = allAnchors.map((_, i) => dummyRefs.current[i] || React.createRef());

    const handleDragEnd = (index) => {
        const dummy = dummyRefs.current[index]?.current;
        if (dummy) {
            const newPos = [dummy.position.x, dummy.position.y, dummy.position.z];
            if (index < anchors.length) {
                // Default anchor override
                // We need to know which anchor ID this index corresponds to
                // Since we map [...anchors, ...custom], indices 0 to anchors.length-1 align.
                const anchor = anchors[index];
                const newOverrides = { ...(item.anchorOverrides || {}), [anchor.id]: newPos };
                onUpdateItem(item.id, { anchorOverrides: newOverrides });
            } else {
                // Custom anchor update
                const customIndex = index - anchors.length;
                const newCustoms = [...customAnchors];
                if (newCustoms[customIndex]) {
                    newCustoms[customIndex] = { ...newCustoms[customIndex], position: newPos };
                    onUpdateItem(item.id, { customAnchors: newCustoms });
                }
            }
        }
    };

    return (
        <group>
            {allAnchors.map((anchor, i) => (
                <TransformControls
                    key={anchor.id || `custom-${i}`}
                    mode="translate"
                    size={0.4} // Larger controls
                    onMouseUp={() => handleDragEnd(i)}
                >
                    <group ref={dummyRefs.current[i]} position={anchor.position}>
                        {/* Visual Sphere */}
                        <mesh>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshBasicMaterial color={i < anchors.length ? "cyan" : "orange"} transparent opacity={0.8} depthTest={false} />
                        </mesh>
                        {/* Invisible Hitbox Sphere */}
                        <mesh
                            onClick={(e) => e.stopPropagation()}
                            visible={false}
                        >
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshBasicMaterial />
                        </mesh>
                    </group>
                </TransformControls>
            ))}
        </group>
    );
};

const ApparatusEditorItem = React.memo(({ item, selectedId, onSelect, updateItem, onUpdateItems, transformMode, allItems, isBuilding, gridSnap, isGhost, basinBounds }) => {
    const Component = APPARATUS_MAP[item.model];
    const [group, setGroup] = useState(null);

    // ── allItemsRef ───────────────────────────────────────────────────────────
    // Keeps snap logic in handleTransform (called on mouseUp) always fresh
    // without including allItems in the React.memo comparison.
    const allItemsRef = useRef(allItems);
    useEffect(() => { allItemsRef.current = allItems; }, [allItems]);

    // Ghost preview removed - was causing WebGL shader errors by imperatively
    // replacing materials mid-render. Ghost previews are no longer used.

    if (!Component) return null;

    const isSelected = item.id === selectedId;

    const handleTransform = () => {
        // Always use freshest allItems from the ref so snap logic isn't stale
        const allItems = allItemsRef.current;
        if (item.isEditingPoints || item.isEditingAnchors) return;

        if (group) {
            const { position, rotation, scale } = group;
            // Native dragged position is Local if nested, World if not nested
            let dragLocalPos = [
                Number(position.x.toFixed(3)), 
                Number(position.y.toFixed(3)), 
                Number(position.z.toFixed(3))
            ];
            let newScale = [Number(scale.x.toFixed(3)), Number(scale.y.toFixed(3)), Number(scale.z.toFixed(3))];
            let newRot = [Number(rotation.x.toFixed(3)), Number(rotation.y.toFixed(3)), Number(rotation.z.toFixed(3))];

            if (!item.parentId) {
                let floorY = -4.0; // The physical room ground

                // If the item ITSELF is a WorkTable, it sits on the room floor natively
                if (item.model === 'WorkTable') {
                    floorY = -4.0;
                } else {
                    // Check if dragged item's World X,Z is within any WorkTable's bounds
                    const tables = allItems.filter(i => i.model === 'WorkTable' && i.id !== item.id);
                    for (const table of tables) {
                        const width = table.width || 6;
                        const depth = table.depth || 4;
                        const tableX = table.position[0];
                        const tableZ = table.position[2];
                        
                        // Simple AABB bound check assuming no extreme table rotations for now
                        if (Math.abs(dragLocalPos[0] - tableX) <= width / 2 &&
                            Math.abs(dragLocalPos[2] - tableZ) <= depth / 2) {
                            
                            // The WorkTable's local surface is at Y=0 relative to its group origin
                            // So the world surface Y = table.position[1]
                            floorY = table.position[1];
                            break;
                        }
                    }
                }

                if (dragLocalPos[1] < floorY) {
                    dragLocalPos[1] = floorY;
                }
            }

            const getWorldTransform = (itemId) => {
                const i = allItems.find(x => x.id === itemId);
                if (!i) return new THREE.Object3D();
                const obj = new THREE.Object3D();
                obj.position.set(...(i.position || [0, 0, 0]));
                obj.rotation.set(...(i.rotation || [0, 0, 0]));
                obj.scale.set(...(i.scale || [1, 1, 1]));
                if (i.parentId) {
                    const parentObj = getWorldTransform(i.parentId);
                    parentObj.add(obj);
                    parentObj.updateMatrixWorld(true);
                    return obj;
                }
                obj.updateMatrixWorld(true);
                return obj;
            };

            const tempMyObj = new THREE.Object3D();
            tempMyObj.position.set(...dragLocalPos);
            tempMyObj.rotation.set(...newRot);
            tempMyObj.scale.set(...newScale);
            if (item.parentId) {
                const parentObj = getWorldTransform(item.parentId);
                parentObj.add(tempMyObj);
                parentObj.updateMatrixWorld(true);
            } else {
                tempMyObj.updateMatrixWorld(true);
            }
            const myWorldPos = new THREE.Vector3();
            tempMyObj.getWorldPosition(myWorldPos);

            let finalParentId = item.parentId; // default keep parent
            let finalStatePos = dragLocalPos;  // default keep drag pos
            let didSnap = false;

            // --- AUTO-SNAP LOGIC FOR RUBBER CORK ---
            if (item.model === 'RubberCork') {
                const SNAP_THRESHOLD = 0.8;
                const SNAP_TARGETS = {
                    'ConicalFlask': { offset: [0, 2.5, 0], radius: 0.35 },
                    'TestTube': { offset: [0, 1.7, 0], radius: 0.2 },
                    'BoilingTube': { offset: [0, 0.9, 0], radius: 0.3 },
                    'GasJar': { offset: [0, 2.5, 0], radius: 0.5 },
                };
                let closestDist = Infinity;
                let snapParentId = null;
                let snapWorldPos = null;
                
                allItems.forEach(other => {
                    if (other.id === item.id) return;
                    const targetInfo = SNAP_TARGETS[other.model];
                    if (targetInfo) {
                        const containerObj = getWorldTransform(other.id);
                        const mouthLocal = new THREE.Vector3(...targetInfo.offset);
                        const mouthWorldPos = containerObj.localToWorld(mouthLocal);
                        
                        const dist = myWorldPos.distanceTo(mouthWorldPos);
                        if (dist < SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapParentId = other.id;
                            snapWorldPos = mouthWorldPos;
                            const scaleFactor = targetInfo.radius / 0.2;
                            newScale = [scaleFactor, scaleFactor, scaleFactor];
                        }
                    }
                });
                if (snapWorldPos) {
                    didSnap = true;
                    finalParentId = snapParentId;
                    const parentObj = getWorldTransform(snapParentId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);
                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                }
            }

            // --- AUTO-SNAP LOGIC FOR DELIVERY TUBE (3D ALIGNMENT) ---
            if (item.model === 'DeliveryTube') {
                const TUBE_SNAP_THRESHOLD = 1.0; 
                let snapOffset = new THREE.Vector3();
                let snapped = false;

                const myPoints = item.points || [[0, 0, 0], [0, 1, 0]];
                const myStart = new THREE.Vector3(...myPoints[0]).applyMatrix4(tempMyObj.matrixWorld);
                const myEnd = new THREE.Vector3(...myPoints[myPoints.length - 1]).applyMatrix4(tempMyObj.matrixWorld);

                for (const other of allItems) {
                    if (other.id === item.id) continue;
                    if (other.model !== 'DeliveryTube') continue;

                    const otherObj = getWorldTransform(other.id);
                    const otherPoints = other.points || [[0, 0, 0], [0, 1, 0]];
                    const otherStart = new THREE.Vector3(...otherPoints[0]).applyMatrix4(otherObj.matrixWorld);
                    const otherEnd = new THREE.Vector3(...otherPoints[otherPoints.length - 1]).applyMatrix4(otherObj.matrixWorld);

                    if (myStart.distanceTo(otherStart) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherStart, myStart); snapped = true; break; }
                    if (myStart.distanceTo(otherEnd) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherEnd, myStart); snapped = true; break; }
                    if (myEnd.distanceTo(otherStart) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherStart, myEnd); snapped = true; break; }
                    if (myEnd.distanceTo(otherEnd) < TUBE_SNAP_THRESHOLD) { snapOffset.subVectors(otherEnd, myEnd); snapped = true; break; }
                }

                if (snapped) {
                    myWorldPos.add(snapOffset);
                    finalStatePos = [Number(myWorldPos.x.toFixed(3)), Number(myWorldPos.y.toFixed(3)), Number(myWorldPos.z.toFixed(3))];
                    didSnap = true;
                }
            }

            // --- AUTO-SNAP LOGIC FOR CLAMP (TO RETORT STAND) ---
            if (item.model === 'Clamp' || item.model === 'RingClamp') {
                const CLAMP_SNAP_THRESHOLD = 3.0;
                const ROD_OFFSET_Z = -0.4;
                
                let closestDist = Infinity;
                let targetStandId = null;
                let snapWorldPos = null;

                const rotY = newRot[1];
                const loopOffsetLocal = item.model === 'RingClamp' ? new THREE.Vector3(0, 0, -3.0) : new THREE.Vector3(-1.65, 0, 0);
                loopOffsetLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

                allItems.forEach(other => {
                    if (other.model === 'RetortStand') {
                        const standObj = getWorldTransform(other.id);
                        
                        const rodOffsetLocal = new THREE.Vector3(0, 0, ROD_OFFSET_Z);
                        const rodWorldPos = standObj.localToWorld(rodOffsetLocal.clone());
                        
                        const targetWorldX = rodWorldPos.x - loopOffsetLocal.x;
                        const targetWorldZ = rodWorldPos.z - loopOffsetLocal.z;

                        const currentDist = Math.sqrt(Math.pow(myWorldPos.x - targetWorldX, 2) + Math.pow(myWorldPos.z - targetWorldZ, 2));

                        if (currentDist < CLAMP_SNAP_THRESHOLD && currentDist < closestDist) {
                            closestDist = currentDist;
                            
                            const baseWorldPos = standObj.localToWorld(new THREE.Vector3(0, 0, 0));
                            const minY = baseWorldPos.y + 0.5;
                            const maxY = baseWorldPos.y + 4.5;
                            
                            let targetY = myWorldPos.y;
                            if (targetY < minY) targetY = minY;
                            if (targetY > maxY) targetY = maxY;

                            targetStandId = other.id;
                            snapWorldPos = new THREE.Vector3(targetWorldX, targetY, targetWorldZ);
                        }
                    }
                });

                if (snapWorldPos) {
                    didSnap = true;
                    finalParentId = targetStandId;
                    const parentObj = getWorldTransform(targetStandId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);
                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                }
            }

            // --- AUTO-SNAP LOGIC FOR FUNNELS & FLASKS (TO RING CLAMP) ---
            if (['SeparatoryFunnel', 'TwoNeckFlask', 'ThreeNeckFlask', 'RoundBottomFlask', 'VolumetricFlask', 'DistillationFlask', 'VacuumFlask'].includes(item.model)) {
                const RING_SNAP_THRESHOLD = 2.5; // Generous 2D threshold
                let closestDist = Infinity;
                let targetRingId = null;
                let snapWorldPos = null;

                allItems.forEach(other => {
                    if (other.model === 'RingClamp') {
                        const ringObj = getWorldTransform(other.id);
                        const ringCenterWorld = ringObj.localToWorld(new THREE.Vector3(0, 0, 0));
                        
                        // Planar distance check so users can drop it from high vertically
                        const planarDist = Math.sqrt(
                            Math.pow(myWorldPos.x - ringCenterWorld.x, 2) + 
                            Math.pow(myWorldPos.z - ringCenterWorld.z, 2)
                        );

                        if (planarDist < RING_SNAP_THRESHOLD && planarDist < closestDist) {
                            closestDist = planarDist;
                            targetRingId = other.id;
                            // Pre-compute the locked X/Z position, keep our dragged Y
                            snapWorldPos = new THREE.Vector3(ringCenterWorld.x, myWorldPos.y, ringCenterWorld.z);
                        }
                    }
                });

                if (snapWorldPos && !didSnap) {
                    didSnap = true;
                    finalParentId = targetRingId;
                    const parentObj = getWorldTransform(targetRingId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);
                    
                    // We lock X and Z cleanly inside the ring.
                    localSnap.x = 0;
                    localSnap.z = 0;
                    
                    // Enforce the resting height — ring at local Y=0 of RingClamp
                    if (item.model === 'SeparatoryFunnel') {
                         // Cone body: Cylinder args=[1, 0.08, 2.5] center at Y=1.95
                         // At Y=2.7, cone radius ≈ 0.82 — this is where the ring hugs it
                         // So funnel origin must be -2.7 below ring
                         localSnap.y = -2.7;
                         // Ring exactly wraps the upper shoulder of the cone
                         setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetRingId, { ringRadius: 0.85 }); }, 0);
                    } else if (item.model === 'VolumetricFlask') {
                         localSnap.y = -0.55; 
                         setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetRingId, { ringRadius: 0.55 }); }, 0);
                    } else if (item.model === 'VacuumFlask') {
                         localSnap.y = -0.65; // Conical vacuum flask rests nicely
                         setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetRingId, { ringRadius: 0.8 }); }, 0);
                    } else {
                         localSnap.y = -0.6; // Sits with bulb in ring
                         setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetRingId, { ringRadius: 0.7 }); }, 0);
                    }
                    
                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                }
            }

            // --- AUTO-SNAP LOGIC FOR GLASSWARE (TO CLAMP) ---
            const GLASSWARE_TYPES = ['TestTube', 'BoilingTube', 'ConicalFlask', 'VacuumFlask', 'RoundBottomFlask', 'TwoNeckFlask', 'ThreeNeckFlask', 'VolumetricFlask', 'SeparatoryFunnel', 'DistillationFlask', 'Beaker', 'Burette'];
            if (GLASSWARE_TYPES.includes(item.model)) {
                const GLASS_SNAP_THRESHOLD = 1.5;
                const GRIP_OFFSETS = { 'TestTube': 1.4, 'BoilingTube': 1.4, 'ConicalFlask': 2.2, 'RoundBottomFlask': 2.0, 'Beaker': 1.5, 'Burette': 2.8 };
                const CLAMP_SETTINGS = {
                    'TestTube': { size: 1.0, angle: 0.3 },
                    'BoilingTube': { size: 1.0, angle: 0.4 },
                    'ConicalFlask': { size: 1.2, angle: 0.5 },
                    'RoundBottomFlask': { size: 1.2, angle: 0.5 },
                    'Beaker': { size: 1.5, angle: 0.7 },
                    'Burette': { size: 0.6, angle: 0.1 }
                };

                const gripOffset = GRIP_OFFSETS[item.model] || 1.0;
                let snapWorldPos = null;
                let targetClampId = null;
                let closestDist = Infinity;
                allItems.forEach(other => {
                    if (other.model === 'Clamp') {
                        const clampObj = getWorldTransform(other.id);
                        const settings = CLAMP_SETTINGS[item.model] || { size: 1.0, angle: 0 };
                        const intendedSize = settings.size;
                        const intendedHeadAngle = other.headAngle || 0;

                        // Calculate grip position using the size the clamp WILL BE after snapping
                        const gripLocal = new THREE.Vector3(0.62 * intendedSize, 0, 0); 
                        gripLocal.applyAxisAngle(new THREE.Vector3(1, 0, 0), intendedHeadAngle);
                        
                        const gripWorld = clampObj.localToWorld(gripLocal.clone());
                        const glassTargetWorldPos = gripWorld.clone().sub(new THREE.Vector3(0, gripOffset, 0));
                        
                        const dist = myWorldPos.distanceTo(glassTargetWorldPos);
                        if (dist < GLASS_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapWorldPos = glassTargetWorldPos;
                            targetClampId = other.id;
                        }
                    }
                });

                if (snapWorldPos) {
                    didSnap = true;
                    finalParentId = targetClampId;
                    const parentObj = getWorldTransform(targetClampId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);
                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];

                    const settings = CLAMP_SETTINGS[item.model];
                    const targetClamp = allItems.find(c => c.id === targetClampId);
                    if (targetClamp && settings) {
                        if (targetClamp.size !== settings.size || Math.abs((targetClamp.angle || 0) - settings.angle) > 0.01) {
                            setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetClampId, { size: settings.size, angle: settings.angle }); }, 0);
                        }
                    }
                }
            }

            // --- AUTO-SNAP LOGIC FOR RUBBER CORK ---
            if (item.model === 'RubberCork') {
                const CORK_SNAP_THRESHOLD = 1.0;
                let closestDist = Infinity;
                let snapWorldPos = null;
                let targetFlaskId = null;
                let targetLocalPos = null;
                let targetScale = 1.0;
                let targetRotation = null; // [x, y, z] euler — null means keep current

                // Side neck geometry constants from RoundBottomFlask
                // angle = ±PI/6 (±30°), rOff=0.9, length=1.2
                // rimX = sin(angle)*(0.9+1.2), rimY = 1 + cos(angle)*(0.9+1.2)
                const SN_RIM_X = Math.sin(Math.PI / 6) * 2.1;   // ≈ 1.05
                const SN_RIM_Y = 1 + Math.cos(Math.PI / 6) * 2.1; // ≈ 2.818

                // Each entry is an array of snap targets per flask.
                // localPos: where the cork bottom sits (relative to flask origin)
                // scale: cork size factor (cork natural radius = 0.2)
                // rotation: [rx, ry, rz] cork must be tilted to, or null for upright
                const FLASK_SNAP_TARGETS = {
                    'RoundBottomFlask': [
                        { localPos: [0, 3.1, 0], scale: 1.6, rotation: null },
                    ],
                    'ConicalFlask': [
                        { localPos: [0, 2.35, 0], scale: 1.35, rotation: null },
                    ],
                    'TestTube': [
                        { localPos: [0, 2.85, 0], scale: 0.9, rotation: null },
                    ],
                    'BoilingTube': [
                        { localPos: [0, 3.65, 0], scale: 1.25, rotation: null },
                    ],
                    'TwoNeckFlask': [
                        { localPos: [0, 3.1, 0], scale: 1.6, rotation: null },              // center neck
                        { localPos: [SN_RIM_X, SN_RIM_Y, 0], scale: 1.15, rotation: [0, 0, -Math.PI / 6] }, // right side neck (+30°)
                    ],
                    'ThreeNeckFlask': [
                        { localPos: [0, 3.1, 0], scale: 1.6, rotation: null },              // center neck
                        { localPos: [SN_RIM_X, SN_RIM_Y, 0], scale: 1.15, rotation: [0, 0, -Math.PI / 6] }, // right side neck
                        { localPos: [-SN_RIM_X, SN_RIM_Y, 0], scale: 1.15, rotation: [0, 0, Math.PI / 6] }, // left side neck
                    ],
                    'VolumetricFlask': [
                        { localPos: [0, 4.5, 0], scale: 0.7, rotation: null },
                    ],
                    'DistillationFlask': [
                        { localPos: [0, 4.35, 0], scale: 1.6, rotation: null },
                    ],
                    'VacuumFlask': [
                        { localPos: [0, 2.5, 0], scale: 1.6, rotation: null },
                    ],
                };

                allItems.forEach(other => {
                    const snapTargets = FLASK_SNAP_TARGETS[other.model];
                    if (!snapTargets) return;

                    const otherObj = getWorldTransform(other.id);

                    snapTargets.forEach(target => {
                        const targetWorldPos = otherObj.localToWorld(new THREE.Vector3(...target.localPos));
                        const dist = myWorldPos.distanceTo(targetWorldPos);

                        if (dist < CORK_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapWorldPos = targetWorldPos.clone();
                            targetFlaskId = other.id;
                            targetLocalPos = target.localPos;
                            targetScale = target.scale;
                            targetRotation = target.rotation;
                        }
                    });
                });

                if (snapWorldPos && !didSnap) {
                    didSnap = true;
                    finalParentId = targetFlaskId;
                    const parentObj = getWorldTransform(targetFlaskId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);

                    // Override to the exact local position to avoid floating-point drift
                    localSnap.x = targetLocalPos[0];
                    localSnap.y = targetLocalPos[1];
                    localSnap.z = targetLocalPos[2];

                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                    newScale = [targetScale, targetScale, targetScale];
                    if (targetRotation) {
                        newRot = [
                            Number(targetRotation[0].toFixed(4)),
                            Number(targetRotation[1].toFixed(4)),
                            Number(targetRotation[2].toFixed(4))
                        ];
                    }
                }
            }

            // --- AUTO-SNAP LOGIC FOR REFLUX & FUNNEL (TO FLASKS) ---
            if (['RefluxCondenser', 'DroppingFunnel'].includes(item.model)) {
                const GLASS_SNAP_THRESHOLD = 1.2;
                let closestDist = Infinity;
                let snapWorldPos = null;
                let targetFlaskId = null;
                let targetNeck = null; // { localPos, rotation, rimY }

                // Exact flask neck rim positions from RoundBottomFlask.jsx geometry:
                // Center neck: cylinder center y=2.5, height=1.5 → top = 3.25; rim torus at y=3.25
                // Side neck: rOff=0.9, length=1.2, angle=±π/6
                //   rimX = sin(angle)*(rOff+length) = sin(π/6)*2.1 ≈ 1.05
                //   rimY = 1 + cos(π/6)*2.1 ≈ 2.818
                const CENTER_RIM_Y = 3.25;
                const SN_ANGLE = Math.PI / 6;
                const SN_RIM_X = Math.sin(SN_ANGLE) * (0.9 + 1.2);   // ≈ 1.05
                const SN_RIM_Y = 1 + Math.cos(SN_ANGLE) * (0.9 + 1.2); // ≈ 2.818

                // Joint top local Y for each apparatus (top of the male glass plug):
                //   RefluxCondenser: joint centre y=0.225, half-h=0.225 → top = +0.45
                //   DroppingFunnel:  joint centre y=-0.625, half-h=0.225 → top = −0.40
                const JOINT_TOP_Y = item.model === 'RefluxCondenser' ? 0.45 : -0.40;

                // Apparatus origin Y relative to flask-local neck rim:
                //   origin = rimY − jointTopY (so the joint top meets the rim)
                const ORIGIN_OFFSET_Y = -JOINT_TOP_Y; // e.g. RC: -0.45, DF: +0.40

                const FLASK_SNAP_TARGETS = {
                    'RoundBottomFlask': [
                        { neckRimLocal: [0, CENTER_RIM_Y, 0], rotation: null },
                    ],
                    'TwoNeckFlask': [
                        { neckRimLocal: [0, CENTER_RIM_Y, 0], rotation: null },
                        { neckRimLocal: [ SN_RIM_X, SN_RIM_Y, 0], rotation: [0, 0, -SN_ANGLE] },
                    ],
                    'ThreeNeckFlask': [
                        { neckRimLocal: [0, CENTER_RIM_Y, 0], rotation: null },
                        { neckRimLocal: [ SN_RIM_X, SN_RIM_Y, 0], rotation: [0, 0, -SN_ANGLE] },
                        { neckRimLocal: [-SN_RIM_X, SN_RIM_Y, 0], rotation: [0, 0,  SN_ANGLE] },
                    ]
                };

                allItems.forEach(other => {
                    const snapTargets = FLASK_SNAP_TARGETS[other.model];
                    if (!snapTargets) return;

                    const otherObj = getWorldTransform(other.id);

                    snapTargets.forEach(target => {
                        // World position of this neck's rim
                        const rimWorldPos = otherObj.localToWorld(new THREE.Vector3(...target.neckRimLocal));
                        // Compare against the dragged item's current world position
                        const dist = myWorldPos.distanceTo(rimWorldPos);

                        if (dist < GLASS_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapWorldPos = rimWorldPos.clone();
                            targetFlaskId = other.id;
                            targetNeck = target;
                        }
                    });
                });

                if (snapWorldPos && !didSnap) {
                    didSnap = true;
                    finalParentId = targetFlaskId;
                    const parentObj = getWorldTransform(targetFlaskId);

                    // Apparatus origin in flask-local space: rim position + offset along neck axis
                    const neck = targetNeck;
                    const [nx, ny, nz] = neck.neckRimLocal;

                    // For tilted side necks, the offset is along the neck direction, not pure Y.
                    // Neck direction (local) = [sin(rot.z), cos(rot.z), 0]
                    let offsetX = 0, offsetY = ORIGIN_OFFSET_Y;
                    if (neck.rotation) {
                        const rz = neck.rotation[2]; // e.g. ±π/6
                        // Neck points in direction (sin(-rz), cos(-rz), 0) in flask local space
                        offsetX = Math.sin(-rz) * Math.abs(ORIGIN_OFFSET_Y);
                        offsetY = Math.cos(-rz) * Math.abs(ORIGIN_OFFSET_Y) * Math.sign(ORIGIN_OFFSET_Y);
                    }

                    finalStatePos = [
                        Number((nx + offsetX).toFixed(3)),
                        Number((ny + offsetY).toFixed(3)),
                        Number(nz.toFixed(3))
                    ];

                    // Apply the neck's tilt rotation, preserving current Y spin
                    const currentY = newRot[1] || 0;
                    if (neck.rotation) {
                        newRot = [
                            Number(neck.rotation[0].toFixed(4)),
                            Number(currentY.toFixed(4)),
                            Number(neck.rotation[2].toFixed(4))
                        ];
                    } else {
                        newRot = [0, Number(currentY.toFixed(4)), 0];
                    }
                }
            }

            // --- AUTO-SNAP LOGIC FOR TRIPOD & WIRE GAUZE ---
            // VolumetricFlask has a flat base - sits ON the ring, not inside it
            // RoundBottom/Multi-neck/Distillation flasks sink into the ring
            if (['RoundBottomFlask', 'TwoNeckFlask', 'ThreeNeckFlask', 'VolumetricFlask', 'DistillationFlask', 'WireGauze'].includes(item.model)) {
                const TRIPOD_SNAP_THRESHOLD = 2.0;
                let closestDist = Infinity;
                let snapWorldPos = null;
                let targetTripodId = null;

                allItems.forEach(other => {
                    if (other.model === 'TripodStand') {
                        const tripodObj = getWorldTransform(other.id);
                        const tripodHeight = other.height || 3.0; // matching default props
                        const topCenterLocal = new THREE.Vector3(0, tripodHeight, 0);
                        const ringWorldPos = tripodObj.localToWorld(topCenterLocal);
                        
                        let targetWorldY = ringWorldPos.y;
                        if (['RoundBottomFlask', 'TwoNeckFlask', 'ThreeNeckFlask', 'DistillationFlask'].includes(item.model)) {
                            targetWorldY -= 0.3; // spherical base sinks into the ring
                        } else if (item.model === 'VolumetricFlask') {
                            targetWorldY += 0.13; // flat base rests ON TOP of the ring torus
                        }
                        const targetWorldPos = new THREE.Vector3(ringWorldPos.x, targetWorldY, ringWorldPos.z);
                        
                        const dist = myWorldPos.distanceTo(targetWorldPos);
                        if (dist < TRIPOD_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapWorldPos = targetWorldPos;
                            targetTripodId = other.id;
                        }
                    }
                });

                if (snapWorldPos && !didSnap) {
                    didSnap = true;
                    finalParentId = targetTripodId;
                    const parentObj = getWorldTransform(targetTripodId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);

                    // Mathematical Override: Guarantee the local positional heights
                    const tripod = allItems.find(x => x.id === targetTripodId);
                    const tHeight = tripod?.height || 3.0;
                    
                    if (['RoundBottomFlask', 'TwoNeckFlask', 'ThreeNeckFlask', 'DistillationFlask'].includes(item.model)) {
                        localSnap.y = tHeight - 0.3; // Spherical base sits inside the ring
                        localSnap.x = 0;
                        localSnap.z = 0;
                        setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetTripodId, { ringRadius: 0.7 }); }, 0);
                    } else if (item.model === 'VolumetricFlask') {
                        localSnap.y = tHeight + 0.13; // Flat base rests ON ring torus top surface
                        localSnap.x = 0;
                        localSnap.z = 0;
                        // Ring expands to be visible as a support platform under the flat base
                        setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetTripodId, { ringRadius: 0.55 }); }, 0);
                    } else if (item.model === 'WireGauze') {
                        localSnap.y = tHeight + 0.05; // Sit directly on top of the torus tube
                        localSnap.x = 0;
                        localSnap.z = 0;
                        setTimeout(() => { if (typeof updateItem === 'function') updateItem(targetTripodId, { ringRadius: 0.8 }); }, 0);
                    }

                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                }
            }

            // --- AUTO-SNAP LOGIC FOR STANDING ON WIRE GAUZE ---
            if (['ConicalFlask', 'VacuumFlask', 'VolumetricFlask', 'Beaker', 'BoilingTube'].includes(item.model)) {
                const GAUZE_SNAP_THRESHOLD = 1.5;
                let closestDist = Infinity;
                let snapWorldPos = null;
                let targetGauzeId = null;

                allItems.forEach(other => {
                    if (other.model === 'WireGauze') {
                        const gauzeObj = getWorldTransform(other.id);
                        const topSurfaceLocal = new THREE.Vector3(0, 0.05, 0);
                        const surfaceWorldPos = gauzeObj.localToWorld(topSurfaceLocal);
                        
                        const dist = myWorldPos.distanceTo(surfaceWorldPos);
                        if (dist < GAUZE_SNAP_THRESHOLD && dist < closestDist) {
                            closestDist = dist;
                            snapWorldPos = surfaceWorldPos;
                            targetGauzeId = other.id;
                        }
                    }
                });

                if (snapWorldPos && !didSnap) { // Don't snap if already snapped to Clamp
                    didSnap = true;
                    finalParentId = targetGauzeId;
                    const parentObj = getWorldTransform(targetGauzeId);
                    const localSnap = parentObj.worldToLocal(snapWorldPos);
                    finalStatePos = [Number(localSnap.x.toFixed(3)), Number(localSnap.y.toFixed(3)), Number(localSnap.z.toFixed(3))];
                }
            }

            // --- DETACH LOGIC ---
            if (!didSnap && item.parentId) {
                // Dragged away from parent — detach
                finalParentId = null;
                finalStatePos = [
                    Number(myWorldPos.x.toFixed(3)),
                    Math.max(0, Number(myWorldPos.y.toFixed(3))),
                    Number(myWorldPos.z.toFixed(3))
                ];
            }

            // --- RESET TILT FOR FREE-STANDING APPARATUS ---
            // Whenever these items are dropped WITHOUT snapping into a flask neck,
            // clear any X/Z tilt (from side-neck connections) and return to upright.
            // This fires both on fresh detach AND on any subsequent free-drag.
            if (!didSnap && ['RefluxCondenser', 'DroppingFunnel', 'RubberCork'].includes(item.model)) {
                if (item.model === 'RubberCork') {
                    // Rubber Corks snap upright when placed on the table
                    newRot = [0, Number(newRot[1].toFixed(4)), 0];
                } else {
                    newRot = [0, Number(newRot[1].toFixed(4)), 0]; // keep Y spin, clear X/Z tilt
                }
                if (group) {
                    group.rotation.set(newRot[0], newRot[1], newRot[2]);
                }
            }

            // Immediately apply transform to the THREE.js group to bypass TransformControls' cached state.
            // Without this, the visual update lags one full React render cycle and causes flickering or missing meshes if unmounted rapidly
            if (group) {
                if (newRot) group.rotation.set(newRot[0], newRot[1], newRot[2]);
                if (finalStatePos) {
                    group.position.set(finalStatePos[0], finalStatePos[1], finalStatePos[2]);
                    group.updateMatrixWorld(true);
                }
            }

            if (didSnap) {
                document.body.style.cursor = 'crosshair';
                setTimeout(() => document.body.style.cursor = 'default', 500);
            }

            updateItem(item.id, {
                position: finalStatePos,
                rotation: newRot,
                scale: newScale,
                parentId: finalParentId
            });
        }
    };

    // ── Memoized BunsenBurner detection ──────────────────────────────────────
    // detectApparatusTypeAbove is O(n) — only run it when the burner or nearby
    // items actually change, not on every render of every item.
    const burnerDetection = useMemo(() => {
        if (item.model !== 'BunsenBurner') return null;
        return detectApparatusTypeAbove(item, allItems, item.gasFlow ?? 0.6);
    }, [item.model, item.id, item.position, item.isOn, item.gasFlow, allItems]);

    // ── Memoized component props ──────────────────────────────────────────────
    // Prevents recreating the props object on every render.
    const componentProps = useMemo(() => {
        const props = {};
        if (item.model === 'Tongs' || item.model === 'Clamp') props.angle = item.angle || 0;
        if (item.model === 'VacuumFlask') props.sideArmType = item.sideArmType || 'plastic';
        if (item.model === 'Thermometer') props.temperature = item.temperature || 20;
        if (item.model === 'TripodStand' || item.model === 'RingClamp') props.ringRadius = item.ringRadius || 1.2;
        if (item.model === 'Clamp') {
            props.headAngle = item.headAngle || 0;
            props.size = item.size || 1;
            props.extendLength = item.extendLength || 0;
        }
        if (item.model === 'RingClamp') props.extendLength = item.extendLength || 0;
        if (item.model === 'BunsenBurner') {
            props.isOn      = item.isOn || false;
            props.airFlow   = item.airFlow  ?? 0.8;
            props.gasFlow   = item.gasFlow  ?? 0.6;
            props.isHeating     = burnerDetection?.isHeating;
            props.apparatusType = burnerDetection?.type;
            props.flameTargetY  = burnerDetection?.distY;
            props.baseRadius    = burnerDetection?.baseRadius;
            props.proximity     = burnerDetection?.proximity ?? 0;
        }
        if (item.model.startsWith('WaterTrough')) {
            props.customHeight     = item.customHeight     !== undefined ? item.customHeight     : 1;
            props.baseRadiusScale  = item.baseRadiusScale  !== undefined ? item.baseRadiusScale  : 1;
            props.wallTaper        = item.wallTaper         !== undefined ? item.wallTaper         : 0.25;
        }
        if (item.model === 'GasJar') { props.hasLid = item.hasLid !== false; props.holeCount = item.holeCount || 0; }
        if (item.model === 'RubberCork') props.holes = item.holes || 1;
        if (item.model === 'DeliveryTube' && item.points?.length > 0) props.points = item.points;
        if (item.model === 'Wire' && item.points?.length > 0) props.points = item.points;
        if (item.model === 'Wire') props.color = item.color || 'red';
        if (item.model === 'WorkTable') { props.width = item.width || 6; props.depth = item.depth || 4; }
        return props;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item, burnerDetection]);

    // ── Memoized children list ────────────────────────────────────────────────
    // Avoids O(n) filter on every render of every item.
    const childItems = useMemo(
        () => (isGhost || !allItems) ? [] : allItems.filter(i => i.parentId === item.id),
        [allItems, item.id, isGhost]
    );


    return (
        <group>
            {!isGhost && isSelected && group && !item.isEditingPoints && !item.isEditingAnchors && transformMode !== 'none' && (
                <TransformControls 
                    object={group} 
                    mode={transformMode} 
                    onChange={() => {
                        if (!group || item.parentId) return;
                        // Floor clamp
                        if (group.position.y < 0) group.position.y = 0;
                        // Real-time basin collision — prevents passing through walls during drag
                        if (basinBounds) {
                            const { xMin, xMax, zMin, zMax, yMax } = basinBounds;
                            const { x, y, z } = group.position;
                            if (y <= yMax && x >= xMin && x <= xMax && z >= zMin && z <= zMax) {
                                const dXMin = x - xMin;
                                const dXMax = xMax - x;
                                const dZMin = z - zMin;
                                const dZMax = zMax - z;
                                const minD = Math.min(dXMin, dXMax, dZMin, dZMax);
                                if      (minD === dXMin) group.position.x = xMin;
                                else if (minD === dXMax) group.position.x = xMax;
                                else if (minD === dZMin) group.position.z = zMin;
                                else                     group.position.z = zMax;
                            }
                        }
                    }}
                    onMouseUp={handleTransform} 
                    size={0.6}
                    translationSnap={gridSnap ? 0.5 : null}
                    rotationSnap={gridSnap ? Math.PI / 12 : null}
                />
            )}
            <group
                ref={setGroup}
                position={item.position || [0, 0, 0]}
                rotation={item.rotation || [0, 0, 0]}
                scale={item.scale || [1, 1, 1]}
                onClick={(e) => {
                    // When building, we want to Click Through constraints (apparatus).
                    // So we do NOT stop propagation if building.
                    // And we do NOT select.
                    if (isBuilding) return;

                    e.stopPropagation();
                    onSelect(item.id);
                }}
            >
                {!isGhost && isSelected && <axesHelper args={[2]} />}
                <Component
                    {...componentProps}
                    height={item.height}
                    legAngle={item.legAngle}
                    customHeight={item.customHeight || 1}
                />

                {isSelected && (item.model === 'DeliveryTube' || item.model === 'Wire') && item.isEditingPoints && (
                    <TubePointEditor
                        points={item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]]}
                        position={item.position}
                        onUpdatePoints={(newPoints) => updateItem(item.id, { points: newPoints })}
                        selectedIndices={item.selectedPointIndices || []}
                        onSelectIndex={(idx) => {
                            const current = item.selectedPointIndices || [];
                            const isSelected = current.includes(idx);
                            let newIndices;
                            if (isSelected) {
                                newIndices = current.filter(i => i !== idx);
                            } else {
                                newIndices = [...current, idx].sort((a, b) => a - b);
                            }
                            updateItem(item.id, { selectedPointIndices: newIndices });
                        }}
                    />
                )}

                {isSelected && item.isEditingAnchors && (
                    <AnchorEditor item={item} onUpdateItem={updateItem} />
                )}

            
            {childItems.map(childItem => (
                <ApparatusEditorItem
                    key={childItem.id}
                    item={childItem}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    updateItem={updateItem}
                    onUpdateItems={onUpdateItems}
                    transformMode={selectedId === childItem.id && !isBuilding ? transformMode : 'none'}
                    allItems={allItems}
                    isBuilding={isBuilding}
                    gridSnap={gridSnap}
                    isGhost={childItem.isGhostPreviewObj}
                    basinBounds={basinBounds}
                />
            ))}
        </group>
        </group>
    );
},
// ─── React.memo comparison ───────────────────────────────────────────────────
// Skip re-rendering an item when nothing that VISUALLY affects it changed.
// Key insight: in handleUpdateItems, unchanged items return the same object
// reference, so `item === item` is stable for non-dragged apparatus.
(prevProps, nextProps) => {
    // My own data changed (position/rotation/properties)
    if (prevProps.item !== nextProps.item) return false;
    // Selection glow appears/disappears for me specifically
    const prevMine = prevProps.selectedId === prevProps.item.id;
    const nextMine = nextProps.selectedId === nextProps.item.id;
    if (prevMine !== nextMine) return false;
    // Transform handle mode (translate/rotate) only matters when I'm selected
    if (prevMine && prevProps.transformMode !== nextProps.transformMode) return false;
    // Building mode changes whether clicks register
    if (prevProps.isBuilding !== nextProps.isBuilding) return false;
    // Grid snap matters for the visual snap-to-grid behaviour when selected
    if (prevMine && prevProps.gridSnap !== nextProps.gridSnap) return false;
    // Basin bounds is already memoized upstream — reference equality is safe
    if (prevProps.basinBounds !== nextProps.basinBounds) return false;
    // allItems: only re-render if a DESCENDANT of mine changed,
    // or if I'm a BunsenBurner (needs flame-above detection on allItems).
    if (prevProps.allItems !== nextProps.allItems) {
        if (prevProps.item.model === 'BunsenBurner') return false;
        const myId = prevProps.item.id;
        const prev = prevProps.allItems || [];
        const next = nextProps.allItems || [];
        if (prev.length !== next.length) return false;
        
        // Also ensure re-render if we previously had children or currently have children
        // and allItems has changed (reference equality failed above), just to safely catch side-effects.
        const prevHasChildren = prev.some(x => x.parentId === myId);
        const nextHasChildren = next.some(x => x.parentId === myId);
        if (prevHasChildren || nextHasChildren) return false;

        // Helper to check if itemId is a descendant of targetId in a given items array
        const checkIsDescendant = (itemId, items, targetId) => {
            let curr = items.find(x => x.id === itemId);
            while (curr && curr.parentId) {
                if (curr.parentId === targetId) return true;
                curr = items.find(x => x.id === curr.parentId);
            }
            return false;
        };

        for (let i = 0; i < prev.length; i++) {
            if (prev[i] !== next[i]) {
                const changedId = prev[i].id;
                // Re-render if the changed item was our descendant or will be our descendant
                if (checkIsDescendant(changedId, prev, myId) || checkIsDescendant(changedId, next, myId)) {
                    return false;
                }
            }
        }
    }
    return true; // Nothing relevant changed — skip re-render
});

// ... (skipping TubeBuilderTool definition as it is fine) ...
// ... (skipping rest of file until render loop) ...

const TubeBuilderTool = ({ allItems, builderState, setBuilderState, onCreateTube, planarMode }) => {
    const { camera, scene } = useThree();
    const [hoveredAnchor, setHoveredAnchor] = useState(null);
    const [phantomPos, setPhantomPos] = useState(null);

    // 1. Calculate all available anchors
    // We need a scoped helper to compute full world transforms (incl. parent chain)
    // because getApparatusAnchors only knows item.position (local space for parented items).
    const getWorldMatrixForItem = (targetId) => {
        const targetItem = allItems.find(x => x.id === targetId);
        if (!targetItem) return new THREE.Matrix4();

        const obj = new THREE.Object3D();
        obj.position.set(...(targetItem.position || [0, 0, 0]));
        obj.rotation.set(...(targetItem.rotation || [0, 0, 0]));
        obj.scale.set(...(targetItem.scale || [1, 1, 1]));
        obj.updateMatrix();

        if (targetItem.parentId) {
            const parentMatrix = getWorldMatrixForItem(targetItem.parentId);
            const worldMatrix = new THREE.Matrix4().multiplyMatrices(parentMatrix, obj.matrix);
            return worldMatrix;
        }
        return obj.matrix.clone();
    };

    const anchors = useMemo(() => {
        const allAnchors = allItems.flatMap(item => {
            // Build the full world-space matrix for this item (handles parented items)
            const worldMatrix = getWorldMatrixForItem(item.id);

            // Get LOCAL anchor definitions (positions relative to item origin)
            // We pass a clone of item with position=[0,0,0] rotation=[0,0,0] scale=[1,1,1]
            // so getApparatusAnchors returns pure LOCAL positions, then we apply worldMatrix.
            const localItem = { ...item, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
            const localAnchors = getApparatusAnchors(localItem);

            return localAnchors.map(a => {
                // Transform local anchor position to world space
                const localPos = new THREE.Vector3(...a.position);
                localPos.applyMatrix4(worldMatrix);

                // Transform local normal to world space (no translation)
                const localNormal = new THREE.Vector3(...(a.normal || [0, 1, 0]));
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);
                localNormal.applyMatrix3(normalMatrix).normalize();

                return {
                    ...a,
                    parentId: item.id,
                    position: localPos.toArray(),
                    normal: localNormal.toArray(),
                };
            });
        });
        return allAnchors;
    }, [allItems]);

    // 2. Handle Mouse Move for Phantom Tube & ROBUST Anchor Detection
    useFrame(({ mouse, raycaster }) => {
        // A. Robust Anchor Detection (Bypass Occlusion)
        // Check distance from ray to each anchor point
        let bestAnchor = null;
        let minDist = Infinity;
        const SELECTION_THRESHOLD = 0.15; // World units distance

        for (const anchor of anchors) {
            const anchorPos = new THREE.Vector3(...anchor.position);
            // Distance from point to line (ray)
            // Ray: origin + t * direction
            // We want perpendicular distance.
            // THREE.Ray.distanceSqToPoint(point)
            const distSq = raycaster.ray.distanceSqToPoint(anchorPos);

            if (distSq < SELECTION_THRESHOLD * SELECTION_THRESHOLD) {
                // Also check distance *along* the ray to ensure it's in front? 
                // Actually, we want to select *through* glass, so depth matters less unless multiple anchors align.
                // Prioritize closer to camera? 
                const distToCam = raycaster.ray.origin.distanceTo(anchorPos);
                if (distToCam < minDist) {
                    minDist = distToCam;
                    bestAnchor = anchor;
                }
            }
        }

        // Update Hover State (Priority to robust check)
        if (bestAnchor) {
            if (hoveredAnchor?.id !== bestAnchor.id) {
                setHoveredAnchor(bestAnchor);
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredAnchor) {
                setHoveredAnchor(null);
                document.body.style.cursor = 'default';
            }
        }

        // B. Phantom Logic
        if (builderState.startAnchor) {
            let target = new THREE.Vector3();
            // Reuse bestAnchor position if hovering?
            if (bestAnchor) {
                target.set(...bestAnchor.position);
                // We don't set phantomPos to target if hovering, 
                // because phantom logic uses `hoveredAnchor` or `phantomPos`.
                // If `hoveredAnchor` is set, `phantomCurve` uses it.
                // So we just update phantomPos for the case where we are NOT hovering.
            } else {
                if (planarMode) {
                    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -builderState.startAnchor.position[2]);
                    raycaster.ray.intersectPlane(planeZ, target);
                } else {
                    const lastPoint = builderState.points?.length > 0
                        ? new THREE.Vector3(...builderState.points[builderState.points.length - 1])
                        : new THREE.Vector3(...builderState.startAnchor.position);

                    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -lastPoint.z);
                    raycaster.ray.intersectPlane(planeZ, target);

                    if (target.lengthSq() === 0) {
                        const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                        raycaster.ray.intersectPlane(planeY, target);
                    }
                }
                setPhantomPos(target);
            }
        }
    });

    const handleSceneClick = (e) => {
        if (!builderState.active) return;

        // If we simply clicked "the scene" (background plane), but our robust raycast says we are hovering an anchor,
        // then treat this as an anchor click!
        if (hoveredAnchor) {
            handleAnchorClick(e, hoveredAnchor);
            return;
        }

        if (!builderState.startAnchor) return; // Need start anchor first (which must be clicked via anchor click usually, but now robust check handles it too)

        // Add intermediate point
        // e.point is the intersection point on the plane/object? 
        // We need the phantom position which is already calculated on the correct plane.
        if (phantomPos) {
            const newPoint = [phantomPos.x, phantomPos.y, phantomPos.z];
            setBuilderState(prev => ({
                ...prev,
                points: [...(prev.points || []), newPoint]
            }));
        }
    };

    const handleAnchorClick = (e, anchor) => {
        e.stopPropagation();
        if (!builderState.startAnchor) {
            // Start
            setBuilderState(prev => ({ ...prev, startAnchor: anchor, points: [] }));
        } else {
            if (anchor.id === builderState.startAnchor.id) return; // Ignore self
            // Finish Tube
            // Combine: StartAnchor -> Intermediate Points -> EndAnchor
            const startPos = builderState.startAnchor.position;
            const endPos = anchor.position;
            const intermediate = builderState.points || [];

            // If "Straight" mode and NO intermediate points, just 2 points.
            // If "Curved" mode, we might want to generate curves?
            // The user wants "Polyline" essentially.

            // We construct the final points array:
            // [Start, ...Intermediate, End]
            const finalPoints = [startPos, ...intermediate, endPos];

            onCreateTube(builderState.startAnchor, anchor, builderState.mode, finalPoints);
            setBuilderState(prev => ({ ...prev, startAnchor: null, points: [] }));
        }
    };

    // Chaikin corner-cutting smoothing (same algo used in DeliveryTube renderer)
    const chaikinSmooth3D = (pts, iterations = 2) => {
        let result = pts;
        for (let iter = 0; iter < iterations; iter++) {
            const next = [result[0]];
            for (let i = 0; i < result.length - 1; i++) {
                const a = result[i], b = result[i + 1];
                next.push(new THREE.Vector3(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25, a.z * 0.75 + b.z * 0.25));
                next.push(new THREE.Vector3(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75, a.z * 0.25 + b.z * 0.75));
            }
            next.push(result[result.length - 1]);
            result = next;
        }
        return result;
    };

    // Phantom Curve Logic (smooth preview)
    const phantomCurve = useMemo(() => {
        if (!builderState.startAnchor) return null;

        const start = new THREE.Vector3(...builderState.startAnchor.position);
        const currentPoints = (builderState.points || []).map(p => new THREE.Vector3(...p));
        const end = hoveredAnchor ? new THREE.Vector3(...hoveredAnchor.position) : (phantomPos || start.clone());

        const allPath = [start, ...currentPoints, end];
        if (allPath.length < 2) return null;

        if (allPath.length === 2) {
            return new THREE.LineCurve3(allPath[0], allPath[1]);
        }

        // Apply Chaikin smoothing so preview matches the final delivered tube
        const smoothed = chaikinSmooth3D(allPath, 2);
        return new THREE.CatmullRomCurve3(smoothed, false, 'catmullrom', 0.5);
    }, [builderState.startAnchor, builderState.points, hoveredAnchor, phantomPos, builderState.mode]);



    return (
        <group>
            {/* Anchors */}
            {anchors.map((anchor, i) => (
                <mesh
                    key={i}
                    position={anchor.position}
                    onClick={(e) => handleAnchorClick(e, anchor)}
                    onPointerOver={(e) => { e.stopPropagation(); setHoveredAnchor(anchor); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={(e) => { setHoveredAnchor(null); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial
                        color={
                            (builderState.startAnchor && builderState.startAnchor.id === anchor.id) ? "green" :
                                (hoveredAnchor && hoveredAnchor.id === anchor.id) ? "yellow" : "cyan"
                        }
                        transparent opacity={0.6} depthTest={false}
                    />
                </mesh>
            ))}

            {/* Visual Guide for Phantom Path */}
            {phantomCurve && (
                <mesh>
                    <tubeGeometry args={[phantomCurve, 64, 0.02, 8, false]} />
                    <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Click Capture Plane - Only active when building */}
            {builderState.active && builderState.startAnchor && (
                <mesh
                    visible={false}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent clicking things behind
                        handleSceneClick(e);
                    }}
                // Scale to cover reasonable area or use PlaneGeometry
                // Ideally use a Plane that always faces camera or covers the view?
                // Or just a massive plane at Z=0 (or transformed)? 
                // Raycaster in handleSceneClick uses `phantomPos` which is computed via `useFrame` raycasting against a mathematical plane.
                // So this mesh is just to capture the event.
                // But `e.point` in onClick will be on this mesh.
                // `handleSceneClick` uses `phantomPos` state, so it doesn't matter where exactly we click as long as we capture it?
                // Yes, `handleSceneClick` uses `phantomPos`.
                // So we just need a big plane.
                >
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial />
                </mesh>
            )}

            {/* Visualize Current Points */}
            {(builderState.points || []).map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color="purple" />
                </mesh>
            ))}
        </group>
    );
};

const APPARATUS_CATEGORIES = [
    {
        name: "Glassware",
        items: [
            { id: "Beaker", name: "Beaker", icon: "⚗️" },
            { id: "ConicalFlask", name: "Conical Flask", icon: "🧪" },
            { id: "RoundBottomFlask", name: "Round Bottom Flask", icon: "⚗️" },
            { id: "TwoNeckFlask", name: "2-Neck Flask", icon: "⚗️" },
            { id: "ThreeNeckFlask", name: "3-Neck Flask", icon: "⚗️" },
            { id: "SeparatoryFunnel", name: "Separatory Funnel", icon: "🌪️" },
            { id: "DroppingFunnel", name: "Dropping Funnel", icon: "💧" },
            { id: "VolumetricFlask", name: "Volumetric Flask", icon: "🎈" },
            { id: "DistillationFlask", name: "Distillation Flask", icon: "⚗️" },
            { id: "RefluxCondenser", name: "Reflux Condenser", icon: "🧬" },
            { id: "VacuumFlask", name: "Vacuum Flask", icon: "🧪" },
            { id: "TestTube", name: "Test Tube", icon: "🧪" },
            { id: "BoilingTube", name: "Boiling Tube", icon: "🧪" },
            { id: "MeasuringCylinder", name: "Cylinder", icon: "📏" },
            { id: "GasJar", name: "Gas Jar", icon: "🔋" },
            { id: "WaterTrough", name: "Water Trough", icon: "🚰" },
            { id: "WaterTrough_GasJar", name: "Trough (Jar)", icon: "🚰" },
            { id: "WaterTrough_TestTube", name: "Trough (Tube)", icon: "🚰" },
            { id: "Burette", name: "Burette", icon: "💉" }
        ]
    },
    {
        name: "Stands & Clamps",
        items: [
            { id: "RetortStand", name: "Retort Stand", icon: "🏗️" },
            { id: "TripodStand", name: "Tripod Stand", icon: "🗼" },
            { id: "Clamp", name: "Clamp", icon: "🗜️" },
            { id: "RingClamp", name: "Ring Clamp", icon: "⭕" },
            { id: "TestTubeStand", name: "Test Tube Rack", icon: "🍱" }
        ]
    },
    {
        name: "Heating",
        items: [
            { id: "BunsenBurner", name: "Bunsen Burner", icon: "🔥" },
            { id: "HeatproofMat", name: "Heatproof Mat", icon: "⬛" },
            { id: "WireGauze", name: "Wire Gauze", icon: "🕸️" },
            { id: "Crucible", name: "Crucible", icon: "🥣" }
        ]
    },
    {
        name: "Tools & Misc",
        items: [
            { id: "Thermometer", name: "Thermometer", icon: "🌡️" },
            { id: "Dropper", name: "Dropper", icon: "💧" },
            { id: "DropperBottle", name: "Dropper Bottle", icon: "🧴" },
            { id: "StirringRod", name: "Glass Rod", icon: "🪄" },
            { id: "Tongs", name: "Tongs", icon: "✂️" },
            { id: "Forceps", name: "Forceps", icon: "🥢" },
            { id: "RubberCork", name: "Rubber Cork", icon: "🟫" },
            { id: "DeliveryTube", name: "Delivery Tube", icon: "🔀" },
            { id: "RedLitmusPaper", name: "Red Litmus", icon: "🟥" },
            { id: "BlueLitmusPaper", name: "Blue Litmus", icon: "🟦" },
            { id: "SafetyShield", name: "Safety Shield", icon: "🛡️" }
        ]
    },
    {
        name: "Environment & Utilities",
        items: [
            { id: "WorkTable", name: "Work Table", icon: "🪑" },
            { id: "GasSource", name: "Gas Fixture", icon: "🔥" },
            { id: "WaterSource", name: "Water Tap", icon: "🚰" }
        ]
    },
    {
        name: "Chemicals & Electrical",
        items: [
            { id: "PowerSupply", name: "Power Supply", icon: "🔌" },
            { id: "ElectrolysisSetup", name: "Electrolysis", icon: "⚡" },
            { id: "Wire", name: "Wire", icon: "〰️" },
            { id: "ZincGranules", name: "Zinc Granules", icon: "🪨" },
            { id: "MagnesiumRibbon", name: "Mg Ribbon", icon: "🎗️" },
            { id: "IronNail", name: "Iron Nail", icon: "🔩" },
            { id: "GasTap", name: "Gas Tap", icon: "🚰" }
        ]
    }
];

export default function ApparatusEditorPage() {
    const [reactions, setReactions] = useState([]);
    const [activeTab, setActiveTab] = useState('library');
    const [selectedReactionId, setSelectedReactionId] = useState('');
    const [selectedStageIndex, setSelectedStageIndex] = useState(0);
    const [selectedApparatusId, setSelectedApparatusId] = useState(null);

    // Fetch data on mount
    useEffect(() => {
        fetch('/api/reactions')
            .then(res => res.json())
            .then(data => {
                // Recover autosaved state from local storage first to prevent losing work on reload
                const autosaved = localStorage.getItem('molecool_reactions_autosave');
                if (autosaved) {
                    try {
                        const parsed = JSON.parse(autosaved);
                        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                            setReactions(parsed);
                            let sel = localStorage.getItem('molecool_selected_reaction') || parsed[0].id;
                            setSelectedReactionId(sel);
                            return;
                        }
                    } catch(e) { console.error('Corrupted autosave'); }
                }

                // Ensure all reactions have a 'stages' array for backward compatibility
                const migratedData = data.map(r => {
                    if (!r.stages || r.stages.length === 0) {
                        return {
                            ...r,
                            stages: [
                                {
                                    id: `stage-${Date.now()}`,
                                    name: "Stage 1",
                                    apparatus: r.apparatus || [],
                                    macroView: r.macroView || {}
                                }
                            ]
                        };
                    }
                    return r;
                });
                setReactions(migratedData);
                if (migratedData.length > 0) setSelectedReactionId(migratedData[0].id);
            })
            .catch(err => console.error("Failed to load reactions", err));
    }, []);

    // Debounced autosave — wait 1.5 s after the last change before writing to localStorage.
    // This prevents hammering localStorage at 60 fps during drag operations.
    const autosaveTimerRef = useRef(null);
    useEffect(() => {
        if (reactions.length === 0) return;
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            localStorage.setItem('molecool_reactions_autosave', JSON.stringify(reactions));
        }, 1500);
        return () => clearTimeout(autosaveTimerRef.current);
    }, [reactions]);
    useEffect(() => {
        if (selectedReactionId) {
            localStorage.setItem('molecool_selected_reaction', selectedReactionId);
        }
    }, [selectedReactionId]);
    const [status, setStatus] = useState('');
    const [showNewStageModal, setShowNewStageModal] = useState(false);

    // Tube Builder State
    const [builderState, setTubeBuilderState] = useState({ active: false, mode: 'straight', startAnchor: null });
    // Planar Mode State (New)
    const [planarMode, setPlanarMode] = useState(false); // Default to false to match current behavior, but easy to toggle.
    const [transformMode, setTransformMode] = useState('translate');
    const [selectedModelToAdd, setSelectedModelToAdd] = useState(Object.keys(APPARATUS_MAP)[0]);
    const [gridSnap, setGridSnap] = useState(false);

    // Global Environment State
    const [showTable, setShowTable] = useState(true);
    const [globalTableWidth, setGlobalTableWidth] = useState(14);
    const [globalTableDepth, setGlobalTableDepth] = useState(10);

    // When selected reaction changes, load its stored table dimensions
    useEffect(() => {
        const reaction = reactions.find(r => r.id === selectedReactionId);
        if (reaction) {
            setGlobalTableWidth(reaction.tableWidth || 14);
            setGlobalTableDepth(reaction.tableDepth || 10);
        }
    }, [selectedReactionId, reactions.length]);

    // Helper: save table dimensions into the current reaction object
    const handleTableWidthChange = (newWidth) => {
        setGlobalTableWidth(newWidth);
        setReactions(prev => prev.map(r =>
            r.id === selectedReactionId ? { ...r, tableWidth: newWidth } : r
        ));
    };
    const handleTableDepthChange = (newDepth) => {
        setGlobalTableDepth(newDepth);
        setReactions(prev => prev.map(r =>
            r.id === selectedReactionId ? { ...r, tableDepth: newDepth } : r
        ));
    };


    const currentReaction = reactions.find(r => r.id === selectedReactionId);
    let currentStage = currentReaction?.stages?.[selectedStageIndex];
    
    // Safety fallback
    if (currentReaction && !currentStage && currentReaction.stages?.length > 0) {
        currentStage = currentReaction.stages[0];
        if (selectedStageIndex !== 0) setTimeout(() => setSelectedStageIndex(0), 0);
    }

    // Memoize basin bounds so the prop reference stays stable between renders.
    // Without this, a new object literal is created every render, defeating React.memo on children.
    const basinBounds = useMemo(() => {
        if (!showTable) return null;
        return {
            xMin: globalTableWidth  / 2 - 2.2 - 2.5,
            xMax: globalTableWidth  / 2 - 2.2 + 2.5,
            zMin: -globalTableDepth / 2 + 2.2 - 2.2,
            zMax: -globalTableDepth / 2 + 2.2 + 2.2,
            yMax: 0.64
        };
    }, [showTable, globalTableWidth, globalTableDepth]);

    const handleUpdateItems = useCallback((updates) => {
        // ── Basin collision clamping ──────────────────────────────────────────
        // Basin outer half-extents (must match LabTable geometry: bW=2.0, bD=1.4, bH=0.44)
        const _basinCX  = globalTableWidth  / 2 - 2.2;   // basin centre X in world
        const _basinCZ  = -globalTableDepth / 2 + 2.2;   // basin centre Z in world
        const _margin   = 1.5;                            // clearance buffer — must be >= half-width of largest apparatus
        const _bxMin = _basinCX - (1.0 + _margin);       // world Xmin of exclusion zone
        const _bxMax = _basinCX + (1.0 + _margin);       // world Xmax
        const _bzMin = _basinCZ - (0.7 + _margin);       // world Zmin
        const _bzMax = _basinCZ + (0.7 + _margin);       // world Zmax
        const _byMax = 0.44 + _margin;                    // max Y (top of basin walls)

        /** Returns pos clamped so it stays outside the basin AABB */
        const clampAwayFromBasin = (pos, parentId) => {
            if (!pos || parentId) return pos; // parented items may be inside by design
            const [x, y, z] = pos;
            // Only enforce within the vertical range of the basin
            if (y > _byMax || y < -2.0) return pos;
            // Check if XZ overlaps the exclusion zone
            if (x >= _bxMin && x <= _bxMax && z >= _bzMin && z <= _bzMax) {
                // Push toward the nearest wall of the exclusion zone
                const dXMin = x - _bxMin;
                const dXMax = _bxMax - x;
                const dZMin = z - _bzMin;
                const dZMax = _bzMax - z;
                const minD  = Math.min(dXMin, dXMax, dZMin, dZMax);
                if (minD === dXMin) return [_bxMin, y, z];
                if (minD === dXMax) return [_bxMax, y, z];
                if (minD === dZMin) return [x, y, _bzMin];
                return                     [x, y, _bzMax];
            }
            return pos;
        };
        // ─────────────────────────────────────────────────────────────────────

        setReactions(prevReactions => {
            const currentReactionLocal = prevReactions.find(r => r.id === selectedReactionId);
            if (!currentReactionLocal) return prevReactions;
            
            const currentStageLocal = currentReactionLocal.stages?.[selectedStageIndex];
            if (!currentStageLocal) return prevReactions;

            const updatedApparatus = currentStageLocal.apparatus.map(item => {
                const update = updates.find(u => u.id === item.id);
                if (!update) return item;
                // Resolve effective parentId (update may change it, e.g. detach)
                const effectiveParentId = 'parentId' in update ? update.parentId : item.parentId;
                const mergedUpdate = { ...update };
                if (update.position) {
                    mergedUpdate.position = clampAwayFromBasin(update.position, effectiveParentId);
                }
                return { ...item, ...mergedUpdate };
            });

            const updatedStages = currentReactionLocal.stages.map((stage, idx) => 
                idx === selectedStageIndex ? { ...stage, apparatus: updatedApparatus } : stage
            );

            return prevReactions.map(r =>
                r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
            );
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReactionId, selectedStageIndex, globalTableWidth, globalTableDepth]);

    const handleUpdateItem = useCallback((id, newProps) => {
        handleUpdateItems([{ id, ...newProps }]);
    }, [handleUpdateItems]);

    const handleAddItem = useCallback((model) => {
        const id = `${model.toLowerCase()}-${Date.now().toString().slice(-4)}`;
        const newItem = {
            id,
            model,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        };

        setReactions(prevReactions => {
            const currentReactionLocal = prevReactions.find(r => r.id === selectedReactionId);
            if (!currentReactionLocal) return prevReactions;
            
            const currentStageLocal = currentReactionLocal.stages?.[selectedStageIndex];
            if (!currentStageLocal) return prevReactions;

            const updatedApparatus = [...(currentStageLocal.apparatus || []), newItem];
            const updatedStages = currentReactionLocal.stages.map((stage, idx) => 
                idx === selectedStageIndex ? { ...stage, apparatus: updatedApparatus } : stage
            );
            return prevReactions.map(r =>
                r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
            );
        });

        setSelectedApparatusId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReactionId, selectedStageIndex]);

    const handleDeleteItem = useCallback((id) => {
        setReactions(prevReactions => {
            const currentReactionLocal = prevReactions.find(r => r.id === selectedReactionId);
            if (!currentReactionLocal) return prevReactions;
            
            const currentStageLocal = currentReactionLocal.stages?.[selectedStageIndex];
            if (!currentStageLocal) return prevReactions;

            const updatedApparatus = currentStageLocal.apparatus.filter(item => item.id !== id);
            const updatedStages = currentReactionLocal.stages.map((stage, idx) => 
                idx === selectedStageIndex ? { ...stage, apparatus: updatedApparatus } : stage
            );
            return prevReactions.map(r =>
                r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
            );
        });
        setSelectedApparatusId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReactionId, selectedStageIndex]);

    const handleAddStage = (copyPrevious) => {
        if (!currentReaction) return;
        const previousApparatus = copyPrevious && currentStage ? JSON.parse(JSON.stringify(currentStage.apparatus)) : [];
        const newStage = {
            id: `stage-${Date.now()}`,
            name: `Stage ${currentReaction.stages.length + 1}`,
            apparatus: previousApparatus,
            macroView: {}
        };
        const updatedReactions = reactions.map(r => 
            r.id === selectedReactionId ? { ...r, stages: [...r.stages, newStage] } : r
        );
        setReactions(updatedReactions);
        setSelectedStageIndex(currentReaction.stages.length);
        setSelectedApparatusId(null);
        setShowNewStageModal(false);
    };

    const handleRenameStage = (index, newName) => {
        if (!currentReaction) return;
        const updatedStages = currentReaction.stages.map((stage, idx) => 
            idx === index ? { ...stage, name: newName } : stage
        );
        const updatedReactions = reactions.map(r => 
            r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
        );
        setReactions(updatedReactions);
    };

    const handleDeleteStage = (index) => {
        if (!currentReaction || currentReaction.stages.length <= 1) return; 
        const updatedStages = currentReaction.stages.filter((_, idx) => idx !== index);
        const updatedReactions = reactions.map(r => 
            r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
        );
        setReactions(updatedReactions);
        if (selectedStageIndex >= updatedStages.length) {
            setSelectedStageIndex(updatedStages.length - 1);
        } else if (selectedStageIndex === index) {
            setSelectedApparatusId(null);
        }
    };

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/reactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reactions)
            });
            if (res.ok) {
                setStatus('Saved successfully!');
                setTimeout(() => setStatus(''), 2000);
            } else {
                setStatus('Error saving.');
            }
        } catch (e) {
            console.error(e);
            setStatus('Error saving.');
        }
    };

    const handleCreateSmartTube = (startAnchor, endAnchor, mode, customPoints) => {
        let points = [];

        if (customPoints && customPoints.length > 0) {
            // Use points from Builder (Polyline/Smart)
            points = customPoints;

            // AUTOMATIC ARCH FOR WIRES
            // If it's a wire and we only have Start/End (no manual intermediate points),
            // generate an extensive curve to avoid clipping.
            if (mode === 'wire' && points.length === 2) {
                const pStart = new THREE.Vector3(...points[0]);
                const pEnd = new THREE.Vector3(...points[1]);

                // Calculate "Arch" - midpoint raised up
                const dist = pStart.distanceTo(pEnd);
                const mid = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.5);

                // Configurable Arch Height usually depends on distance
                // But for lab wires, they usually go UP significantly.
                // Let's bias it UP.
                mid.y += Math.max(0.5, dist * 0.5);

                // Maybe 2 control points?
                // Control 1: 1/3 way, raised bit less
                // Control 2: 2/3 way, raised bit less
                // A quadratic or cubic bezier feel.

                // Let's use a simple 3-point arch for now: Start -> Mid(High) -> End
                // But CatmullRom might smooth it too much or make it weird.
                // Let's add 3 intermediate points for broad arch.
                const p1 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.25);
                p1.y += Math.max(0.3, dist * 0.3);

                const p2 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.5);
                p2.y += Math.max(0.5, dist * 0.5);

                const p3 = new THREE.Vector3().lerpVectors(pStart, pEnd, 0.75);
                p3.y += Math.max(0.3, dist * 0.3);

                points = [pStart.toArray(), p1.toArray(), p2.toArray(), p3.toArray(), pEnd.toArray()];
            }

        } else {
            // Fallback (shouldn't happen with new builder, but keep for safety)
            const start = new THREE.Vector3(...startAnchor.position);
            const end = new THREE.Vector3(...endAnchor.position);

            if (mode === 'straight') {
                points = [start.toArray(), end.toArray()];
            } else {
                const startNormal = new THREE.Vector3(...startAnchor.normal);
                const endNormal = new THREE.Vector3(...endAnchor.normal);

                const dist = start.distanceTo(end);
                const p1 = start.clone().add(startNormal.clone().multiplyScalar(dist * 0.5));
                const p2 = end.clone().add(endNormal.clone().multiplyScalar(dist * 0.5));

                // Cubic Bezier to Points
                const curve = new THREE.CubicBezierCurve3(start, p1, p2, end);
                const calculatedPoints = curve.getPoints(20); // 20 segments
                points = calculatedPoints.map(v => v.toArray());
            }
        }

        // Create Item
        const isWire = mode === 'wire';
        const modelType = isWire ? 'Wire' : 'DeliveryTube';
        const id = `${modelType.toLowerCase()}-${Date.now().toString().slice(-4)}`;

        // Determine Wire Color if it is a wire
        let color = 'red';
        if (isWire && startAnchor && startAnchor.id) {
            if (startAnchor.id.includes('neg') || startAnchor.id.includes('cathode') || startAnchor.id.includes('black')) {
                color = 'black';
            }
        }

        const newItem = {
            id,
            model: modelType,
            position: [0, 0, 0], // The points are world space, so group pos is 0,0,0
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            points: points,
            tubeMode: mode,
            isEditingPoints: false,
            color: isWire ? color : undefined
        };

        const updatedApparatus = [...(currentStage.apparatus || []), newItem];
        const updatedStages = currentReaction.stages.map((stage, idx) => 
            idx === selectedStageIndex ? { ...stage, apparatus: updatedApparatus } : stage
        );
        const updatedReactions = reactions.map(r =>
            r.id === selectedReactionId ? { ...r, stages: updatedStages } : r
        );
        setReactions(updatedReactions);
        setSelectedApparatusId(id);
    };


    const detachItem = (itemId) => {
        // Simple detach places it slightly forward in world space
        handleUpdateItem(itemId, { parentId: null, position: [0, 2, 2] });
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full bg-transparent text-white selection:bg-blue-500/30 overflow-hidden font-sans relative">
            {/* Animated blue mesh background */}
            <div className="bg-mesh-container" style={{position:'absolute',zIndex:0}}>
                <div className="bg-mesh-blob blob-1" />
                <div className="bg-mesh-blob blob-2" />
                <div className="bg-mesh-blob blob-3" />
            </div>
            {/* Sidebar */}
            <div className="w-[380px] flex flex-col border-r border-white/10 bg-[#020617]/80 backdrop-blur-xl shadow-2xl z-10 shrink-0 relative">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-transparent">
                    <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
                        <span>Apparatus</span>
                        <span className="text-white/30 font-light text-xl">Editor</span>
                    </h1>
                    <p className="text-white/50 font-black tracking-[0.15em] uppercase text-[10px] mt-1.5 ml-6">3D Lab Equipment Builder</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/[0.03] p-2 border-b border-white/10 shrink-0 gap-2">
                    <button 
                        onClick={() => setActiveTab('library')} 
                        className={`flex-1 text-[12px] py-2.5 rounded-xl font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'library' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/10'}`}
                    >
                        Library
                    </button>
                    <button 
                        onClick={() => setActiveTab('properties')} 
                        className={`flex-1 text-[12px] py-2.5 rounded-xl font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'properties' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-white/30 hover:text-white/60 border border-transparent hover:border-white/10'}`}
                    >
                        Properties
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">

                    {activeTab === 'library' && (
                        <div className="flex flex-col gap-7 animate-in fade-in duration-300">
                            {APPARATUS_CATEGORIES.map((category) => (
                                <div key={category.name} className="flex flex-col gap-3">
                                    <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] border-b border-white/10 pb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                                        {category.name}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {category.items.map(item => {
                                            if (!APPARATUS_MAP[item.id]) return null;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleAddItem(item.id)}
                                                    className="flex flex-col items-center justify-start gap-1.5 p-3 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-blue-600/15 hover:border-blue-500/40 hover:scale-[1.03] transition-all aspect-square group shadow-lg"
                                                >
                                                    <span className="text-2xl mt-1 mb-0.5 group-hover:scale-110 transition-transform">{item.icon}</span>
                                                    <span className="text-[10px] text-white/50 font-bold text-center leading-tight w-full break-words group-hover:text-white/80 transition-colors">{item.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div className="pb-4"></div>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                            
                            {/* Reaction Selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em]">Reaction Context</label>
                        <select
                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                            value={selectedReactionId || ''}
                            onChange={(e) => setSelectedReactionId(e.target.value)}
                        >
                            {reactions.map(r => (
                                <option key={r.id} value={r.id} className="bg-black">{r.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── Global Table Environment (always visible) ── */}
                    <div className="flex flex-col gap-3 p-5 bg-white/[0.04] border border-white/10 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[12px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
                                Table Environment
                            </h3>
                            <button
                                onClick={() => setShowTable(v => !v)}
                                className={`text-[10px] font-black px-3 py-1 rounded-lg border transition-colors uppercase tracking-wider ${
                                    showTable ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white/30 border-white/10'
                                }`}
                            >
                                {showTable ? '✓ Visible' : 'Hidden'}
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="flex justify-between items-center text-[13px] font-black text-white uppercase tracking-tight mb-2">
                                    <label>Table Width (m)</label>
                                    <span className="font-mono bg-blue-600/15 px-3 py-1 rounded-lg border border-blue-500/30 text-blue-400 text-[12px]">{globalTableWidth.toFixed(1)}</span>
                                </div>
                                <input type="range" className="w-full h-2 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-inner"
                                    min="8" max="25" step="0.5"
                                    value={globalTableWidth}
                                    onChange={(e) => handleTableWidthChange(parseFloat(e.target.value))}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-[13px] font-black text-white uppercase tracking-tight mb-2">
                                    <label>Table Depth (m)</label>
                                    <span className="font-mono bg-blue-600/15 px-3 py-1 rounded-lg border border-blue-500/30 text-blue-400 text-[12px]">{globalTableDepth.toFixed(1)}</span>
                                </div>
                                <input type="range" className="w-full h-2 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-inner"
                                    min="6" max="18" step="0.5"
                                    value={globalTableDepth}
                                    onChange={(e) => handleTableDepthChange(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stage Manager */}
                    <div className="flex flex-col gap-2 bg-gradient-to-br from-blue-900/20 to-transparent p-5 border border-blue-500/20 rounded-2xl shadow-xl">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[13px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                                Reaction Stages
                            </label>
                            <button 
                                onClick={() => setShowNewStageModal(true)}
                                className="text-[11px] bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-4 py-2 rounded-xl border border-blue-500/30 font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            >+ Add Stage</button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {currentReaction?.stages?.map((stage, idx) => (
                                <div 
                                    key={stage.id} 
                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${selectedStageIndex === idx ? 'bg-blue-600/20 border-blue-500/50' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}
                                    onClick={() => { setSelectedStageIndex(idx); setSelectedApparatusId(null); }}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black ${selectedStageIndex === idx ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}>{idx + 1}</span>
                                        <input 
                                            value={stage.name || `Stage ${idx + 1}`}
                                            onChange={(e) => handleRenameStage(idx, e.target.value)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedStageIndex(idx); }}
                                            className="bg-transparent text-[12px] font-black text-white/80 uppercase tracking-wider outline-none hover:bg-white/5 focus:bg-black/40 focus:px-1 rounded flex-1 transition-all"
                                        />
                                    </div>
                                    {currentReaction.stages.length > 1 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteStage(idx); }}
                                            className="text-red-400/50 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tools Section */}
                    <div className="flex flex-col gap-4 p-5 bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl">
                        <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
                            Transform Tools
                        </h3>

                        {/* Transform Modes */}
                        <div className="flex gap-1 p-1 bg-black/40 rounded-lg">
                            <button
                                className={`flex-1 text-[12px] font-black uppercase tracking-widest py-2 rounded-lg transition-all duration-200 ${!builderState.active && transformMode === 'translate' ? 'bg-blue-600/30 text-white border border-blue-500/40 shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                onClick={() => { setTubeBuilderState({ ...builderState, active: false }); setTransformMode('translate'); }}
                            >
                                Move
                            </button>
                            <button
                                className={`flex-1 text-[12px] font-black uppercase tracking-widest py-2 rounded-lg transition-all duration-200 ${!builderState.active && transformMode === 'rotate' ? 'bg-blue-600/30 text-white border border-blue-500/40 shadow-md' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                onClick={() => { setTubeBuilderState({ ...builderState, active: false }); setTransformMode('rotate'); }}
                            >
                                Rotate
                            </button>
                        </div>

                        {/* Snapping & Environment Toggles */}
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl mt-1 border border-white/10">
                            <label className="text-[12px] font-black text-white/70 uppercase tracking-widest">Snap to Grid</label>
                            <input
                                type="checkbox"
                                checked={gridSnap}
                                onChange={(e) => setGridSnap(e.target.checked)}
                                className="accent-blue-400 w-4 h-4 cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl mt-1 border border-white/10">
                            <label className="text-[12px] font-black text-white/70 uppercase tracking-widest">Show Lab Table</label>
                            <input
                                type="checkbox"
                                checked={showTable}
                                onChange={(e) => setShowTable(e.target.checked)}
                                className="accent-white w-4 h-4 cursor-pointer"
                            />
                        </div>

                        {/* Tube Builder Toggle */}
                        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-black text-purple-400 uppercase tracking-wider">Smart Tube Builder</label>
                                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                    <label className="text-[9px] text-neutral-400 uppercase tracking-widest cursor-pointer">2D Planar</label>
                                    <input
                                        type="checkbox"
                                        checked={planarMode}
                                        onChange={(e) => setPlanarMode(e.target.checked)}
                                        className="accent-purple-500 w-3 h-3 cursor-pointer"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-1 p-1 bg-black/40 rounded-lg">
                                <button
                                    className={`flex-1 text-[12px] font-black uppercase tracking-widest py-2 rounded-lg transition-all duration-200 ${builderState.active && builderState.mode === 'straight' ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-md' : 'text-white/30 hover:text-purple-200 hover:bg-purple-900/20'}`}
                                    onClick={() => setTubeBuilderState({ active: true, mode: 'straight', startAnchor: null, points: [] })}
                                >
                                    Polyline
                                </button>
                                <button
                                    className={`flex-1 text-[12px] font-black uppercase tracking-widest py-2 rounded-lg transition-all duration-200 ${builderState.active && builderState.mode === 'curved' ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-md' : 'text-white/30 hover:text-purple-200 hover:bg-purple-900/20'}`}
                                    onClick={() => setTubeBuilderState({ active: true, mode: 'curved', startAnchor: null, points: [] })}
                                >
                                    Curved
                                </button>
                            </div>
                            {builderState.active && (
                                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-3 mt-1">
                                    <p className="text-[11px] font-black text-purple-300/80 text-center leading-relaxed uppercase tracking-wider">
                                        {builderState.startAnchor
                                            ? "Click empty space to add points, or anchor to finish."
                                            : "Click 1st anchor to start."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Apparatus List (Flat) */}
                    <div className="flex flex-col border border-white/10 bg-white/[0.04] rounded-2xl overflow-hidden flex-1 min-h-[220px] shadow-2xl">
                        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-900/15 to-transparent flex justify-between items-center">
                            <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                                Scene Objects
                            </span>
                            <span className="text-[12px] font-black bg-blue-600/25 text-blue-400 px-3 py-1 rounded-xl shadow-lg border border-blue-500/30">{currentStage?.apparatus?.length || 0}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                            {currentStage?.apparatus?.map(item => (
                                <div
                                    key={item.id}
                                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                                        selectedApparatusId === item.id 
                                        ? 'bg-blue-600/20 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                                        : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                                    }`}
                                    onClick={() => setSelectedApparatusId(item.id)}
                                >
                                    <span className={`text-[11px] font-mono font-bold truncate w-1/2 ${selectedApparatusId === item.id ? 'text-blue-300' : 'text-white/70'}`}>{item.id}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-white/40 truncate max-w-[45%] border border-white/10">{item.model}</span>
                                </div>
                            ))}
                            {(!currentStage?.apparatus || currentStage.apparatus.length === 0) && (
                                <div className="text-center py-10 flex flex-col items-center gap-2">
                                    <span className="text-3xl opacity-20">🔬</span>
                                    <p className="text-[11px] font-black text-white/25 uppercase tracking-widest">No objects in scene</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Item Properties Component Injection point */}
                    {selectedApparatusId ? (() => {
                        const item = currentStage?.apparatus?.find(i => i.id === selectedApparatusId);
                        if (!item) return null;
                        return (
                            <div className="flex flex-col gap-4 mt-6 border-t border-white/15 pt-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse"></div>
                                        <h3 className="text-[14px] font-black text-white uppercase tracking-[0.15em] truncate max-w-[180px]">{item.id}</h3>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-red-400 hover:text-red-300 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 bg-red-900/30 rounded-xl border border-red-900/50 transition-all hover:bg-red-900/50"
                                    >
                                        Delete
                                    </button>
                                </div>

                                {/* ATTACHMENT INFO */}
                                {item.parentId && (
                                    <div className="flex flex-col gap-2 mt-2 bg-white/[0.03] p-3 rounded-xl border border-white/10">
                                        <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <span>🔗</span> Attachment
                                        </h4>
                                        <div className="flex justify-between items-center text-[11px] mt-1">
                                            <span className="text-green-400 font-mono font-bold truncate max-w-[150px]" title={item.parentId}>
                                                Connected: {item.parentId.slice(0, 15)}...
                                            </span>
                                            <button 
                                                onClick={() => detachItem(item.id)}
                                                className="px-3 py-1.5 bg-red-900/30 text-red-300 hover:bg-red-900/50 rounded-xl border border-red-500/30 transition-all font-black text-[10px] uppercase tracking-wider"
                                            >
                                                Detach
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* SPECIAL CONTROLS */}
                                {item.model === 'TripodStand' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Ring Radius (m)</label>
                                            <input 
                                                type="number" step="0.05"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-16 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.ringRadius || 1.2).toFixed(2)}
                                                onChange={(e) => handleUpdateItem(item.id, { ringRadius: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0.4" max="2.0" step="0.05"
                                            value={item.ringRadius || 1.2}
                                            onChange={(e) => handleUpdateItem(item.id, { ringRadius: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                )}

                                {item.model === 'Tongs' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Tongs Opening</label>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0" max="1" step="0.05"
                                            value={item.angle || 0}
                                            onChange={(e) => handleUpdateItem(item.id, { angle: parseFloat(e.target.value) })}
                                            
                                        />
                                    </div>
                                )}

                                {item.model === 'Clamp' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Clamp Opening</label>
                                            <input 
                                                type="number" step="0.05"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-16 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.angle || 0).toFixed(2)}
                                                onChange={(e) => handleUpdateItem(item.id, { angle: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0" max="1" step="0.05"
                                            value={item.angle || 0}
                                            onChange={(e) => handleUpdateItem(item.id, { angle: parseFloat(e.target.value) })}
                                            
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Head Rotation (°)</label>
                                            <input 
                                                type="number" step="1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={((item.headAngle || 0) * 180 / Math.PI).toFixed(1)}
                                                onChange={(e) => handleUpdateItem(item.id, { headAngle: parseFloat(e.target.value) * Math.PI / 180 })}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min={-Math.PI} max={Math.PI} step="0.1"
                                            value={item.headAngle || 0}
                                            onChange={(e) => handleUpdateItem(item.id, { headAngle: parseFloat(e.target.value) })}
                                            
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Pipe Length (m)</label>
                                            <input 
                                                type="number" step="0.1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.extendLength || 0).toFixed(2)}
                                                onChange={(e) => {
                                                    const newLen = parseFloat(e.target.value);
                                                    const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                    const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
                                                    
                                                    const oldPivotLocal = new THREE.Vector3(-1.65 - (item.extendLength || 0), 0, 0);
                                                    const newPivotLocal = new THREE.Vector3(-1.65 - newLen, 0, 0);
                                                    
                                                    const pivotWorld = currentPos.clone().add(oldPivotLocal.clone().applyEuler(currentRot));
                                                    const newOffsetWorld = newPivotLocal.clone().applyEuler(currentRot);
                                                    const newPos = pivotWorld.clone().sub(newOffsetWorld);
                                                    
                                                    handleUpdateItem(item.id, { 
                                                        extendLength: newLen,
                                                        position: [newPos.x, newPos.y, newPos.z]
                                                    });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0" max="3" step="0.1"
                                            value={item.extendLength || 0}
                                            onChange={(e) => {
                                                const newLen = parseFloat(e.target.value);
                                                const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
                                                
                                                const oldPivotLocal = new THREE.Vector3(-1.65 - (item.extendLength || 0), 0, 0);
                                                const newPivotLocal = new THREE.Vector3(-1.65 - newLen, 0, 0);
                                                
                                                const pivotWorld = currentPos.clone().add(oldPivotLocal.clone().applyEuler(currentRot));
                                                const newOffsetWorld = newPivotLocal.clone().applyEuler(currentRot);
                                                const newPos = pivotWorld.clone().sub(newOffsetWorld);
                                                
                                                handleUpdateItem(item.id, { 
                                                    extendLength: newLen,
                                                    position: [newPos.x, newPos.y, newPos.z]
                                                });
                                            }}
                                            
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Stand Rotation (°)</label>
                                            <input 
                                                type="number" step="1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={((item.rotation ? item.rotation[1] : 0) * 180 / Math.PI).toFixed(1)}
                                                onChange={(e) => {
                                                    const newY = parseFloat(e.target.value) * Math.PI / 180;
                                                    const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                    const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));

                                                    const pivotOffsetLocal = new THREE.Vector3(-1.65 - (item.extendLength || 0), 0, 0);
                                                    const currentOffsetWorld = pivotOffsetLocal.clone().applyEuler(currentRot);
                                                    const pivotWorld = currentPos.clone().add(currentOffsetWorld);

                                                    const newRotEuler = new THREE.Euler(currentRot.x, newY, currentRot.z);
                                                    const newOffsetWorld = pivotOffsetLocal.clone().applyEuler(newRotEuler);
                                                    const newPos = pivotWorld.clone().sub(newOffsetWorld);

                                                    handleUpdateItem(item.id, {
                                                        rotation: [currentRot.x, newY, currentRot.z],
                                                        position: [newPos.x, newPos.y, newPos.z]
                                                    });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min={-Math.PI} max={Math.PI} step="0.05"
                                            value={item.rotation ? item.rotation[1] : 0}
                                            onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));

                                                // Pivot Offset (Local)
                                                // The clamp loop is at x = -1.65
                                                const pivotOffsetLocal = new THREE.Vector3(-1.65 - (item.extendLength || 0), 0, 0);

                                                // 1. Calculate World Pivot Position from Current State
                                                const currentOffsetWorld = pivotOffsetLocal.clone().applyEuler(currentRot);
                                                const pivotWorld = currentPos.clone().add(currentOffsetWorld);

                                                // 2. Calculate New Position based on New Rotation
                                                const newRotEuler = new THREE.Euler(currentRot.x, newY, currentRot.z);
                                                const newOffsetWorld = pivotOffsetLocal.clone().applyEuler(newRotEuler);

                                                // NewPos = PivotWorld - NewOffsetWorld
                                                const newPos = pivotWorld.clone().sub(newOffsetWorld);

                                                handleUpdateItem(item.id, {
                                                    rotation: [currentRot.x, newY, currentRot.z],
                                                    position: [newPos.x, newPos.y, newPos.z]
                                                });
                                            }}
                                            
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <label className="text-[12px] font-black text-white/60 uppercase tracking-widest">Vertical Position (m)</label>
                                            <input 
                                                type="number" step="0.1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.position ? item.position[1] : 1).toFixed(2)}
                                                onChange={(e) => {
                                                    const newY = parseFloat(e.target.value);
                                                    const currentPos = item.position || [0, 0, 0];
                                                    handleUpdateItem(item.id, { position: [currentPos[0], newY, currentPos[2]] });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0.5" max="10" step="0.1"
                                            value={item.position ? item.position[1] : 1}
                                            onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                const currentPos = item.position || [0, 0, 0];
                                                handleUpdateItem(item.id, { position: [currentPos[0], newY, currentPos[2]] });
                                            }}
                                            
                                        />
                                        <div className="flex justify-between items-center text-xs text-blue-300 mt-1">
                                            <label>Clamp Size (x)</label>
                                            <input 
                                                type="number" step="0.1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-16 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.size || 1).toFixed(2)}
                                                onChange={(e) => handleUpdateItem(item.id, { size: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0.5" max="2" step="0.1"
                                            value={item.size || 1}
                                            onChange={(e) => handleUpdateItem(item.id, { size: parseFloat(e.target.value) })}
                                            
                                        />
                                    </div>
                                )}

                                {item.model === 'RingClamp' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        {!currentStage.apparatus?.some(child => child.parentId === item.id && child.model === 'SeparatoryFunnel') && (
                                            <>
                                                <div className="flex justify-between items-center text-xs text-blue-300">
                                                    <label>Ring Radius (m)</label>
                                                    <input 
                                                        type="number" step="0.05"
                                                        className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-16 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={(item.ringRadius || 1.2).toFixed(2)}
                                                        onChange={(e) => handleUpdateItem(item.id, { ringRadius: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                                    min="0.4" max="2.0" step="0.05"
                                                    value={item.ringRadius || 1.2}
                                                    onChange={(e) => handleUpdateItem(item.id, { ringRadius: parseFloat(e.target.value) })}
                                                />
                                            </>
                                        )}

                                        <div className="flex justify-between items-center text-[12px] font-black text-white uppercase tracking-tight mt-3 mb-2">
                                            <label>Vertical Position (m)</label>
                                            <input 
                                                type="number" step="0.1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.position ? item.position[1] : 1).toFixed(2)}
                                                onChange={(e) => {
                                                    const newY = parseFloat(e.target.value);
                                                    const currentPos = item.position || [0, 0, 0];
                                                    handleUpdateItem(item.id, { position: [currentPos[0], newY, currentPos[2]] });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0.5" max="10" step="0.1"
                                            value={item.position ? item.position[1] : 1}
                                            onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                const currentPos = item.position || [0, 0, 0];
                                                handleUpdateItem(item.id, { position: [currentPos[0], newY, currentPos[2]] });
                                            }}
                                        />

                                        <div className="flex justify-between items-center text-[12px] font-black text-white uppercase tracking-tight mt-3 mb-2">
                                            <label>Pipe Length (m)</label>
                                            <input 
                                                type="number" step="0.1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={(item.extendLength || 0).toFixed(2)}
                                                onChange={(e) => {
                                                    const newLen = parseFloat(e.target.value);
                                                    const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                    const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
                                                    
                                                    const oldPivotLocal = new THREE.Vector3(0, 0, -(3.0 + (item.extendLength || 0)));
                                                    const newPivotLocal = new THREE.Vector3(0, 0, -(3.0 + newLen));
                                                    
                                                    const pivotWorld = currentPos.clone().add(oldPivotLocal.clone().applyEuler(currentRot));
                                                    const newOffsetWorld = newPivotLocal.clone().applyEuler(currentRot);
                                                    const newPos = pivotWorld.clone().sub(newOffsetWorld);
                                                    
                                                    handleUpdateItem(item.id, { 
                                                        extendLength: newLen,
                                                        position: [newPos.x, newPos.y, newPos.z]
                                                    });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="0" max="3" step="0.1"
                                            value={item.extendLength || 0}
                                            onChange={(e) => {
                                                const newLen = parseFloat(e.target.value);
                                                const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));
                                                
                                                const oldPivotLocal = new THREE.Vector3(0, 0, -(3.0 + (item.extendLength || 0)));
                                                const newPivotLocal = new THREE.Vector3(0, 0, -(3.0 + newLen));
                                                
                                                const pivotWorld = currentPos.clone().add(oldPivotLocal.clone().applyEuler(currentRot));
                                                const newOffsetWorld = newPivotLocal.clone().applyEuler(currentRot);
                                                const newPos = pivotWorld.clone().sub(newOffsetWorld);
                                                
                                                handleUpdateItem(item.id, { 
                                                    extendLength: newLen,
                                                    position: [newPos.x, newPos.y, newPos.z]
                                                });
                                            }}
                                        />

                                        <div className="flex justify-between items-center text-[12px] font-black text-white uppercase tracking-tight mt-3 mb-2">
                                            <label>Stand Rotation (°)</label>
                                            <input 
                                                type="number" step="1"
                                                className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={((item.rotation ? item.rotation[1] : 0) * 180 / Math.PI).toFixed(1)}
                                                onChange={(e) => {
                                                    const newY = parseFloat(e.target.value) * Math.PI / 180;
                                                    const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                    const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));

                                                    const pivotOffsetLocal = new THREE.Vector3(0, 0, -(3.0 + (item.extendLength || 0)));
                                                    const currentOffsetWorld = pivotOffsetLocal.clone().applyEuler(currentRot);
                                                    const pivotWorld = currentPos.clone().add(currentOffsetWorld);

                                                    const newRotEuler = new THREE.Euler(currentRot.x, newY, currentRot.z);
                                                    const newOffsetWorld = pivotOffsetLocal.clone().applyEuler(newRotEuler);
                                                    const newPos = pivotWorld.clone().sub(newOffsetWorld);

                                                    handleUpdateItem(item.id, {
                                                        rotation: [currentRot.x, newY, currentRot.z],
                                                        position: [newPos.x, newPos.y, newPos.z]
                                                    });
                                                }}
                                            />
                                        </div>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min={-Math.PI} max={Math.PI} step="0.05"
                                            value={item.rotation ? item.rotation[1] : 0}
                                            onChange={(e) => {
                                                const newY = parseFloat(e.target.value);
                                                const currentPos = new THREE.Vector3(...(item.position || [0, 0, 0]));
                                                const currentRot = new THREE.Euler(...(item.rotation || [0, 0, 0]));

                                                const pivotOffsetLocal = new THREE.Vector3(0, 0, -(3.0 + (item.extendLength || 0)));
                                                const currentOffsetWorld = pivotOffsetLocal.clone().applyEuler(currentRot);
                                                const pivotWorld = currentPos.clone().add(currentOffsetWorld);

                                                const newRotEuler = new THREE.Euler(currentRot.x, newY, currentRot.z);
                                                const newOffsetWorld = pivotOffsetLocal.clone().applyEuler(newRotEuler);
                                                const newPos = pivotWorld.clone().sub(newOffsetWorld);

                                                handleUpdateItem(item.id, {
                                                    rotation: [currentRot.x, newY, currentRot.z],
                                                    position: [newPos.x, newPos.y, newPos.z]
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                {item.model === 'BunsenBurner' && (
                                    <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">
                                        <label className="text-xs text-orange-300 font-semibold">Flame Control</label>

                                        {/* Ignite / Extinguish */}
                                        <button
                                            onClick={() => handleUpdateItem(item.id, { isOn: !item.isOn })}
                                            className={`w-full py-1.5 text-xs rounded font-bold transition-colors ${item.isOn ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'}`}
                                        >
                                            {item.isOn ? '🔥 EXTINGUISH FLAME' : '🔥 IGNITE FLAME'}
                                        </button>

                                        {item.isOn && (<>
                                            {/* Gas Supply (size) */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between text-[12px] font-black text-white uppercase tracking-tight">
                                                    <span>Gas Supply</span>
                                                    <span className="font-mono text-orange-400">{Math.round((item.gasFlow ?? 0.6) * 100)}%</span>
                                                </div>
                                                <input type="range" min="0.1" max="1.0" step="0.05"
                                                    className="w-full h-1.5 appearance-none cursor-pointer accent-orange-500"
                                                    value={item.gasFlow ?? 0.6}
                                                    onChange={e => handleUpdateItem(item.id, { gasFlow: parseFloat(e.target.value) })}
                                                />
                                                <div className="flex justify-between text-[10px] text-neutral-600">
                                                    <span>Low</span><span>High</span>
                                                </div>
                                            </div>

                                            {/* Air Supply (luminous vs non-luminous) */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between text-[12px] font-black text-white uppercase tracking-tight">
                                                    <span>Air Supply</span>
                                                    <span className="font-mono" style={{color: (item.airFlow ?? 0.8) > 0.5 ? '#88aaff' : '#ffb088'}}>
                                                        {(item.airFlow ?? 0.8) > 0.65 ? 'Non-luminous 🔵' : (item.airFlow ?? 0.8) < 0.35 ? 'Luminous 🟡' : 'Mixed 🔴'}
                                                    </span>
                                                </div>
                                                <input type="range" min="0.0" max="1.0" step="0.05"
                                                    className="w-full h-1.5 appearance-none cursor-pointer accent-blue-400"
                                                    value={item.airFlow ?? 0.8}
                                                    onChange={e => handleUpdateItem(item.id, { airFlow: parseFloat(e.target.value) })}
                                                />
                                                <div className="flex justify-between text-[10px] text-neutral-600">
                                                    <span>🟡 Luminous</span><span>🔵 Clean</span>
                                                </div>
                                            </div>
                                        </>)}
                                    </div>
                                )}

                                {item.model === 'GasJar' && (
                                    <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">
                                        <div className="flex items-center justify-between py-2">
                                            <label className="text-[12px] font-black text-white uppercase tracking-tight">Lid Attached</label>
                                            <input type="checkbox" className="w-4 h-4 accent-orange-500 bg-black/40 border-white/10 rounded cursor-pointer" 
                                                checked={item.hasLid !== false}
                                                onChange={(e) => handleUpdateItem(item.id, { hasLid: e.target.checked })}
                                                
                                            />
                                        </div>
                                        {(item.hasLid !== false) && (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-blue-300">Holes in Lid: {item.holeCount || 0}</label>
                                                <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                                    min="0" max="4" step="1"
                                                    value={item.holeCount || 0}
                                                    onChange={(e) => handleUpdateItem(item.id, { holeCount: parseInt(e.target.value) })}
                                                    
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {item.model === 'RubberCork' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        <label className="text-xs text-orange-300">Holes: {item.holes || 1}</label>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="1" max="3" step="1"
                                            value={item.holes || 1}
                                            onChange={(e) => handleUpdateItem(item.id, { holes: parseInt(e.target.value) })}
                                            
                                        />
                                    </div>
                                )}

                                {item.model === 'RetortStand' && (
                                    <div className="flex flex-col gap-1 mt-2">
                                        <label className="text-xs text-blue-300">Rod Height: {item.height || 5}</label>
                                        <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                            min="2" max="10" step="0.5"
                                            value={item.height || 5}
                                            onChange={(e) => handleUpdateItem(item.id, { height: parseFloat(e.target.value) })}
                                            
                                        />
                                    </div>
                                )}

                                {item.model.startsWith('WaterTrough') && (
                                    <div className="mt-4 p-4 bg-[#161616] rounded-xl border border-gray-800 flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2">
                                                Trough Base Radius: {(item.baseRadiusScale || 1).toFixed(1)}x
                                            </label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500 shadow-inner"  
                                                min="0.5" max="2.0" step="0.1"
                                                value={item.baseRadiusScale || 1}
                                                onChange={(e) => handleUpdateItem(item.id, { baseRadiusScale: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2">
                                                Trough Height: {(item.customHeight || 1).toFixed(1)}x
                                            </label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500 shadow-inner"  
                                                min="0.5" max="2.0" step="0.1"
                                                value={item.customHeight || 1}
                                                onChange={(e) => handleUpdateItem(item.id, { customHeight: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2">
                                                Wall Angle (Taper): {((item.wallTaper !== undefined ? item.wallTaper : 0.25) * 100).toFixed(0)}%
                                            </label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500 shadow-inner"  
                                                min="0.0" max="0.8" step="0.05"
                                                value={item.wallTaper !== undefined ? item.wallTaper : 0.25}
                                                onChange={(e) => handleUpdateItem(item.id, { wallTaper: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {item.model === 'WorkTable' && (
                                    <div className="mt-4 p-4 bg-[#161616] rounded-xl border border-gray-800">
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                                    Table Width: {(item.width || 6).toFixed(1)}m
                                                </label>
                                                <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner"  
                                                    min="2" max="15" step="0.5"
                                                    value={item.width || 6}
                                                    onChange={(e) => handleUpdateItem(item.id, { width: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                                    Table Depth: {(item.depth || 4).toFixed(1)}m
                                                </label>
                                                <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner"  
                                                    min="2" max="10" step="0.5"
                                                    value={item.depth || 4}
                                                    onChange={(e) => handleUpdateItem(item.id, { depth: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(item.model === 'GasSource' || item.model === 'WaterSource') && (
                                    <div className="mt-4 p-4 bg-[#161616] rounded-xl border border-gray-800">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                                                Outlets/Nozzles: {item.outlets || (item.model === 'GasSource' ? 2 : 1)}
                                            </label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner"  
                                                min="1" max="6" step="1"
                                                value={item.outlets || (item.model === 'GasSource' ? 2 : 1)}
                                                onChange={(e) => handleUpdateItem(item.id, { outlets: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {item.model === 'TripodStand' && (
                                    <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-blue-300">Height: {item.height || 3.0}</label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                                min="2.0" max="5.0" step="0.1"
                                                value={item.height || 3.0}
                                                onChange={(e) => {
                                                    const newHeight = parseFloat(e.target.value);
                                                    const updates = [{ id: item.id, height: newHeight }];
                                                    
                                                    // Sync attached items like Flasks and Gauze
                                                    currentStage.apparatus.forEach(child => {
                                                        if (child.parentId === item.id) {
                                                            if (child.model === 'RoundBottomFlask') {
                                                                updates.push({ id: child.id, position: [0, newHeight - 0.3, 0] });
                                                            } else if (child.model === 'WireGauze') {
                                                                updates.push({ id: child.id, position: [0, newHeight + 0.05, 0] });
                                                            }
                                                        }
                                                    });
                                                    handleUpdateItems(updates);
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-blue-300">Leg Angle: {((item.legAngle || 0.15) * 180 / Math.PI).toFixed(0)}°</label>
                                            <input type="range" className="w-full h-1.5 bg-black/40 border border-white/5 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                                                min="0" max="0.5" step="0.01"
                                                value={item.legAngle || 0.15}
                                                onChange={(e) => handleUpdateItem(item.id, { legAngle: parseFloat(e.target.value) })}
                                                
                                            />
                                        </div>
                                    </div>
                                )}

                                {item.model === 'DeliveryTube' && (
                                    <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-2">

                                        {/* LOCK STRAIGHT / LENGTH CONTROLS */}
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-blue-300">Lock Straight</label>
                                            <input type="checkbox" className="w-4 h-4 accent-orange-500 bg-black/40 border-white/10 rounded cursor-pointer" 
                                                checked={item.isLockedStraight || false}
                                                onChange={(e) => {
                                                    const isLocked = e.target.checked;
                                                    let newPoints = item.points || [[0, 0, 0], [0, 1, 0]];

                                                    if (isLocked) {
                                                        // Force 2 points (Start and End)
                                                        if (newPoints.length > 2) {
                                                            newPoints = [newPoints[0], newPoints[newPoints.length - 1]];
                                                        }
                                                        // Turn off point editing mode if locking
                                                        handleUpdateItem(item.id, {
                                                            isLockedStraight: isLocked,
                                                            points: newPoints,
                                                            isEditingPoints: false,
                                                            selectedPointIndices: []
                                                        });
                                                    } else {
                                                        handleUpdateItem(item.id, { isLockedStraight: isLocked });
                                                    }
                                                }}
                                                
                                            />
                                        </div>

                                        {item.isLockedStraight && (
                                            <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl border border-white/10 mt-2">
                                                <p className="text-[11px] font-black text-white/50 text-center mb-2 uppercase tracking-widest">Length Adjustments</p>

                                                {/* Helper Function for Extension */}
                                                {(() => {
                                                    const applyExtension = (side, amount) => {
                                                        const points = item.points || [[0, 0, 0], [0, 1, 0]];
                                                        if (points.length < 2) return;

                                                        const p0 = new THREE.Vector3(...points[0]);
                                                        const p1 = new THREE.Vector3(...points[points.length - 1]);
                                                        const dir = new THREE.Vector3().subVectors(p1, p0).normalize();

                                                        if (side === 'start') {
                                                            // Extend start means moving P0 away from P1 (negative dir)
                                                            // amount > 0 means extend (longer), so move -dir
                                                            p0.addScaledVector(dir, -amount);
                                                        } else {
                                                            // Extend end means moving P1 away from P0 (positive dir)
                                                            p1.addScaledVector(dir, amount);
                                                        }

                                                        const newPoints = [p0.toArray(), p1.toArray()];
                                                        handleUpdateItem(item.id, { points: newPoints });
                                                    };

                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                                                                <span className="text-[10px] text-cyan-300">Start</span>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => applyExtension('start', -0.05)} className="px-2 bg-white/10 hover:bg-white/20 rounded text-[10px]">Shorten</button>
                                                                    <button onClick={() => applyExtension('start', 0.05)} className="px-2 bg-cyan-900/50 hover:bg-cyan-900/80 rounded text-[10px]">Extend</button>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                                                                <span className="text-[10px] text-cyan-300">End</span>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => applyExtension('end', -0.05)} className="px-2 bg-white/10 hover:bg-white/20 rounded text-[10px]">Shorten</button>
                                                                    <button onClick={() => applyExtension('end', 0.05)} className="px-2 bg-cyan-900/50 hover:bg-cyan-900/80 rounded text-[10px]">Extend</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {!item.isLockedStraight && (
                                            <div className="flex items-center justify-between mt-1">
                                                <label className="text-xs text-green-300">Edit Shape</label>
                                                <button
                                                    onClick={() => handleUpdateItem(item.id, { isEditingPoints: !item.isEditingPoints })}
                                                    className={`px-2 py-1 text-[10px] rounded ${item.isEditingPoints ? 'bg-green-600 text-white' : 'bg-neutral-700'}`}
                                                >
                                                    {item.isEditingPoints ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                        )}

                                        {item.isEditingPoints && (
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[10px] text-neutral-400">
                                                    {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null
                                                        ? `Selected Point: ${item.selectedPointIndex}`
                                                        : "Select a point to edit/insert"}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const currentPoints = item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]];
                                                            const idx = item.selectedPointIndex;

                                                            // INSERT LOGIC
                                                            if (idx !== undefined && idx !== null && idx < currentPoints.length - 1) {
                                                                const p1 = currentPoints[idx];
                                                                const p2 = currentPoints[idx + 1];
                                                                // Midpoint
                                                                const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
                                                                const newPoints = [...currentPoints];
                                                                newPoints.splice(idx + 1, 0, mid);
                                                                handleUpdateItem(item.id, { points: newPoints, selectedPointIndex: idx + 1 });
                                                            } else {
                                                                // APPEND LOGIC
                                                                const last = currentPoints[currentPoints.length - 1];
                                                                const secondLast = currentPoints[currentPoints.length - 2] || [0, 0, 0];
                                                                const dir = [last[0] - secondLast[0], last[1] - secondLast[1], last[2] - secondLast[2]];
                                                                const newPoint = [last[0] + (dir[0] || 0.1), last[1] + (dir[1] || 0.1), last[2] + (dir[2] || 0)];
                                                                handleUpdateItem(item.id, { points: [...currentPoints, newPoint], selectedPointIndex: currentPoints.length });
                                                            }
                                                        }}
                                                        className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1 rounded"
                                                    >
                                                        {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null && item.selectedPointIndex < (item.points?.length - 1)
                                                            ? "+ Insert Point"
                                                            : "+ Add Point"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const currentPoints = item.points || [[0, 0, 0], [0, 1, 0], [0.5, 1.5, 0], [1.5, 1.5, 0], [1.5, 0.5, 0]];
                                                            if (currentPoints.length <= 2) return;

                                                            const idx = item.selectedPointIndex;
                                                            if (idx !== undefined && idx !== null) {
                                                                // Remove selected
                                                                const newPoints = currentPoints.filter((_, i) => i !== idx);
                                                                handleUpdateItem(item.id, { points: newPoints, selectedPointIndex: null });
                                                            } else {
                                                                // Remove last
                                                                const newPoints = currentPoints.slice(0, -1);
                                                                handleUpdateItem(item.id, { points: newPoints });
                                                            }
                                                        }}
                                                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-[10px] py-1 rounded border border-red-900/50"
                                                    >
                                                        {item.selectedPointIndex !== undefined && item.selectedPointIndex !== null ? "- Remove Selected" : "- Remove Last"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* No Parent Control anymore */}

                                <div className="flex flex-col gap-3 mt-3 p-2 bg-black/20 rounded border border-white/5">
                                    {/* Position */}
                                    <div>
                                        <label className="text-[12px] font-black text-white/60 mb-2 block uppercase tracking-[0.15em]">Position (m)</label>
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            <span className="text-[10px] font-bold text-white/30">X</span>
                                            <span className="text-[10px] font-bold text-white/30">Y</span>
                                            <span className="text-[10px] font-bold text-white/30">Z</span>
                                            {['x', 'y', 'z'].map((axis, i) => (
                                                <input
                                                    key={`pos-${axis}`}
                                                    type="number"
                                                    step="0.1"
                                                    className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-xs w-full text-center outline-none focus:border-blue-500"
                                                    value={item.position?.[i] ?? 0}
                                                    onChange={(e) => {
                                                        const newPos = [...(item.position || [0, 0, 0])];
                                                        let val = parseFloat(e.target.value) || 0;
                                                        if (i === 1 && val < 0) val = 0; // Prevent Y from going below 0
                                                        newPos[i] = val;
                                                        handleUpdateItem(item.id, { position: newPos });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Rotation */}
                                    <div>
                                        <label className="text-[12px] font-black text-white/60 mb-2 block uppercase tracking-[0.15em]">Rotation (°)</label>
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            <span className="text-[10px] font-bold text-white/30">X</span>
                                            <span className="text-[10px] font-bold text-white/30">Y</span>
                                            <span className="text-[10px] font-bold text-white/30">Z</span>
                                            {['x', 'y', 'z'].map((axis, i) => (
                                                <input
                                                    key={`rot-${axis}`}
                                                    type="number"
                                                    step="15"
                                                    className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-xs w-full text-center outline-none focus:border-blue-500"
                                                    value={Math.round((item.rotation?.[i] || 0) * (180 / Math.PI))}
                                                    onChange={(e) => {
                                                        const newRot = [...(item.rotation || [0, 0, 0])];
                                                        newRot[i] = (parseFloat(e.target.value) || 0) * (Math.PI / 180);
                                                        handleUpdateItem(item.id, { rotation: newRot });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                        <button 
                                            onClick={() => handleUpdateItem(item.id, { position: [item.position?.[0] || 0, 0, item.position?.[2] || 0] })}
                                            className="bg-white/5 hover:bg-white/10 text-[10px] py-1 rounded transition-colors"
                                        >⬇️ Drop to Table</button>
                                        <button 
                                            onClick={() => handleUpdateItem(item.id, { rotation: [0, 0, 0] })}
                                            className="bg-white/5 hover:bg-white/10 text-[10px] py-1 rounded transition-colors"
                                        >🔄 Reset Rotation</button>
                                    </div>
                                    <div className="mt-1">
                                        <button 
                                            onClick={() => handleAddItem(item.model)}
                                            className="w-full bg-white/5 hover:bg-white/10 text-[10px] py-1 rounded transition-colors text-blue-300"
                                        >📋 Duplicate Component</button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-4 border-t border-white/10 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-purple-300">Anchors</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // Add Custom Anchor
                                                    const newId = `custom-${Date.now()}`;
                                                    // Default position slightly offset
                                                    const newAnchor = { id: newId, position: [0, 0.5, 0] };
                                                    const currentCustoms = item.customAnchors || [];
                                                    handleUpdateItem(item.id, { customAnchors: [...currentCustoms, newAnchor], isEditingAnchors: true });
                                                }}
                                                className="px-2 py-1 text-[10px] bg-purple-900/30 hover:bg-purple-900/50 rounded border border-purple-500/30"
                                            >
                                                + Add
                                            </button>
                                            <button
                                                onClick={() => handleUpdateItem(item.id, { isEditingAnchors: !item.isEditingAnchors })}
                                                className={`px-2 py-1 text-[10px] rounded ${item.isEditingAnchors ? 'bg-purple-600 text-white' : 'bg-neutral-700'}`}
                                            >
                                                {item.isEditingAnchors ? 'Done' : 'Edit'}
                                            </button>
                                        </div>
                                    </div>
                                    {item.isEditingAnchors && (
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] text-neutral-400">Drag yellow spheres to move anchors.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateItem(item.id, { anchorOverrides: {}, customAnchors: [] })}
                                                    className="text-[10px] text-red-400 hover:text-red-300"
                                                >
                                                    Reset All Anchors
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                            <span className="text-4xl opacity-20">🎯</span>
                            <p className="text-[11px] font-black text-white/25 uppercase tracking-widest leading-relaxed">Click an apparatus in the 3D view<br/>to edit its properties</p>
                        </div>
                    )}
                        </div>
                    )}
                </div> {/* End Scrollable Content */}

                {/* Bottom Actions - Fixed to Bottom */}
                <div className="p-5 bg-[#020617]/90 backdrop-blur-xl border-t border-blue-500/10 z-20 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setTubeBuilderState(prev => ({ ...prev, active: !prev.active, mode: 'straight' }))}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${builderState.active && builderState.mode !== 'wire' ? 'bg-blue-600/25 text-blue-300 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]' : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                        >
                            {builderState.active && builderState.mode !== 'wire' ? 'Cancel Tube' : 'Add Tube'}
                        </button>
                        <button
                            onClick={() => setTubeBuilderState(prev => ({ ...prev, active: !prev.active, mode: 'wire' }))}
                            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${builderState.active && builderState.mode === 'wire' ? 'bg-red-600/25 text-red-300 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : 'bg-white/[0.03] text-white/50 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                        >
                            {builderState.active && builderState.mode === 'wire' ? 'Cancel Wire' : 'Add Wire'}
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 border border-blue-500/30 text-blue-300 rounded-xl py-3.5 font-black tracking-[0.15em] uppercase text-[12px] transition-all shadow-[0_4px_25px_rgba(59,130,246,0.2)] hover:shadow-[0_4px_30px_rgba(59,130,246,0.4)] flex justify-center items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <span className="text-base">💾</span> Save All Changes
                    </button>
                    <div className="h-4 mt-3">
                        {status && <p className="text-center text-[11px] text-green-400 font-black uppercase tracking-widest animate-pulse">{status}</p>}
                    </div>
                </div>
            </div>

            {/* 3D Viewport */}
            <div className="flex-1 relative bg-[#010b1a]/60 z-10">
                <CanvasErrorBoundary>
                <Canvas 
                    camera={{ position: [5, 5, 5], fov: 50 }} 
                    dpr={[1, 1.5]} 
                    frameloop="demand"
                    gl={{ powerPreference: "high-performance", antialias: true, alpha: true, stencil: false, depth: true, preserveDrawingBuffer: false }}
                    onCreated={({ gl }) => {
                        gl.domElement.addEventListener('webglcontextlost', (e) => {
                            e.preventDefault();
                            console.warn('WebGL Context Lost — waiting for browser to restore it automatically.');
                        });
                    }}
                >
                    <color attach="background" args={['#010a18']} />

                    {/* Controls */}
                    <OrbitControls makeDefault />
                    <CameraController />
                    
                    {/* SceneSync bridges React renders and Three.js draw calls in frameloop="demand" mode */}
                    <SceneSync hasAnims={currentStage?.apparatus?.some(i => i.model === 'BunsenBurner' && i.isOn)} />

                    <Grid infiniteGrid sectionColor="white" cellColor="#333" fadeDistance={30} position={[0, -4.05, 0]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <Environment preset="city" />

                    {/* Simple Floor */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.06, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshBasicMaterial color="#222" transparent opacity={0.5} />
                    </mesh>

                    {currentStage?.apparatus?.filter(i => !i.parentId)?.map(item => (
                        <ApparatusEditorItem
                            key={item.id}
                            item={item}
                            selectedId={selectedApparatusId}
                            onSelect={setSelectedApparatusId}
                            updateItem={handleUpdateItem}
                            onUpdateItems={handleUpdateItems}
                            transformMode={selectedApparatusId === item.id && !builderState.active ? transformMode : 'none'}
                            allItems={currentStage.apparatus}
                            isBuilding={builderState.active}
                            gridSnap={gridSnap}
                            isGhost={false}
                            basinBounds={basinBounds}
                        />
                    ))}

                    {/* Environment Default Table */}
                    {showTable && <LabTable width={globalTableWidth} depth={globalTableDepth} />}

                    {/* Smart Tube Builder Overlay */}
                    {builderState.active && currentStage && (
                        <TubeBuilderTool
                            allItems={currentStage.apparatus}
                            builderState={builderState}
                            setBuilderState={setTubeBuilderState}
                            onCreateTube={handleCreateSmartTube}
                        />
                    )}
                </Canvas>
                </CanvasErrorBoundary>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl text-[11px] text-white/40 pointer-events-none border border-white/10 space-y-0.5 font-bold">
                    <p>Left Click: Orbit</p>
                    <p>Right Click: Pan</p>
                    <p>Scroll: Zoom</p>
                    <p>W/A/S/D: Move Camera</p>
                    <p>Q/E: Up/Down</p>
                    <p>Click Object: Select</p>
                    <p>Drag Arrows/Rings: Transform</p>
                    {builderState.active && (
                        <p className="text-purple-400 mt-2 font-black uppercase tracking-widest">MODE: TUBE BUILDER ({builderState.mode})</p>
                    )}
                </div>
            </div>

            {/* New Stage Modal */}
            {showNewStageModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-black/90 backdrop-blur-2xl border border-white/15 p-8 rounded-3xl w-[420px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Create New Stage</h2>
                        <p className="text-[12px] font-bold text-white/40 mb-6 uppercase tracking-wider">How would you like to build the apparatus setup?</p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => handleAddStage(true)}
                                className="w-full text-left p-5 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 transition-all group hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                            >
                                <span className="block text-[13px] font-black text-blue-400 group-hover:text-blue-300 uppercase tracking-wider">Copy Previous Setup</span>
                                <span className="block text-[11px] text-white/30 mt-1.5 font-bold">Start with all the equipment currently on the table.</span>
                            </button>
                            
                            <button 
                                onClick={() => handleAddStage(false)}
                                className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                            >
                                <span className="block text-[13px] font-black text-white/70 group-hover:text-white uppercase tracking-wider">Start Blank</span>
                                <span className="block text-[11px] text-white/30 mt-1.5 font-bold">Start with an empty lab table.</span>
                            </button>
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
                            <button 
                                onClick={() => setShowNewStageModal(false)}
                                className="text-[12px] font-black text-white/40 hover:text-white px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
