// src/components/reactions/views/MacroView.jsx
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Html, Float, Center } from '@react-three/drei';
import * as THREE from 'three';

// Import all apparatus
import * as Apparatus from '../../apparatus';

import RealisticLiquid from './components/RealisticLiquid';
import ParticleSystem from './components/ParticleSystem';

// Map model names from JSON to components
const APPARATUS_MAP = {
    'BunsenBurner': Apparatus.BunsenBurner,
    'TripodStand': Apparatus.TripodStand,
    'WireGauze': Apparatus.WireGauze,
    'Crucible': Apparatus.Crucible,
    'Tongs': Apparatus.Tongs,
    'HeatproofMat': Apparatus.HeatproofMat,
    'Beaker': Apparatus.Beaker,
    'ConicalFlask': Apparatus.ConicalFlask,
    'TestTube': Apparatus.TestTube,
    'BoilingTube': Apparatus.BoilingTube || Apparatus.TestTube, // Fallback
    'MeasuringCylinder': Apparatus.MeasuringCylinder,
    'Dropper': Apparatus.Dropper,
    'StirringRod': Apparatus.StirringRod,
    'GlassRod': Apparatus.StirringRod, // Alias
    'WaterTrough': Apparatus.WaterTrough,
    'GasJar': Apparatus.GasJar,
    'DeliveryTube': Apparatus.DeliveryTube,
    'RubberCork': Apparatus.RubberCork,
    'Cork': Apparatus.RubberCork, // Alias
    'Burette': Apparatus.Burette,
    'RetortStand': Apparatus.RetortStand,
    'Clamp': Apparatus.Clamp,
    'ElectrolysisSetup': Apparatus.ElectrolysisSetup,
    'PowerSupply': Apparatus.PowerSupply,
    'MagnesiumRibbon': Apparatus.MagnesiumRibbon,
    'ZincGranules': Apparatus.ZincGranules,
    'Forceps': Apparatus.Forceps,
    'SafetyShield': Apparatus.SafetyShield,
    'DropperBottle': Apparatus.DropperBottle,
    'IronNail': Apparatus.IronNail,
    'GasTap': Apparatus.GasTap,
    'LitmusPaper': Apparatus.LitmusPaper,
};

const ReactionEffectManager = ({ reaction, apparatusList, progress, apparatusRefs }) => {
    // User requested to remove all visual effects for now to start fresh.
    return null;
};

const ApparatusItem = ({ item, apparatusRefs, progress }) => {
    const Component = APPARATUS_MAP[item.model];
    const groupRef = useRef();

    // Register ref updates
    useFrame(() => {
        if (groupRef.current && apparatusRefs && apparatusRefs.current) {
            apparatusRefs.current[item.id] = groupRef.current;
        }
    });

    // Also set immediately on mount if possible
    useEffect(() => {
        if (groupRef.current && apparatusRefs && apparatusRefs.current) {
            apparatusRefs.current[item.id] = groupRef.current;
        }
    }, [item.id, apparatusRefs]);


    if (!Component) {
        console.warn(`Apparatus model not found: ${item.model}`);
        return null;
    }

    // Similar to original: determine specialized props
    const extraProps = {};
    if (item.model === 'BunsenBurner') {
        extraProps.isOn = item.isOn || false;
    }
    if (item.model === 'Tongs') {
        extraProps.angle = item.angle || 0;
    }

    if (item.model === 'MagnesiumRibbon' && progress > 0.5) {
        extraProps.visible = false; // "Consumed" (Though standard burning usually leaves ash, we hide the ribbon)
    };

    // Extract transform props to avoid double-application if child also uses them,
    // though most components use them on a root group anyway.
    // We pass everything else to the component (points, holeCount, specific props).
    const { position, rotation, scale, id, ...restProps } = item;

    return (
        <group
            ref={groupRef}
            key={item.id}
            position={item.position || [0, 0, 0]}
            rotation={item.rotation || [0, 0, 0]}
            scale={item.scale || [1, 1, 1]}
            visible={item.visible !== false}
        >
            <Component {...restProps} {...extraProps} />
        </group>
    );
};

const DynamicSetup = ({ reaction, progress }) => {
    // 1. Get List of Apparatus from JSON
    const apparatusList = reaction.apparatus || [];

    // Stub to hold object refs for World Position lookups
    const apparatusRefs = useRef({});

    return (
        <group>
            <group name="Lights">
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#b0c4de" />
                <rectAreaLight width={5} height={20} color="white" intensity={2} position={[5, 5, 5]} lookAt={[0, 0, 0]} />
            </group>

            <Center top>
                <group>
                    {/* Render List Flat */}
                    {apparatusList.map(item => (
                        <ApparatusItem
                            key={item.id}
                            item={item}
                            apparatusRefs={apparatusRefs}
                            progress={progress}
                        />
                    ))}

                    {/* Visual Effects Overlay */}
                    <ReactionEffectManager
                        reaction={reaction}
                        apparatusList={apparatusList}
                        progress={progress}
                        apparatusRefs={apparatusRefs}
                    />

                </group>
            </Center>

            <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
            </mesh>
            <gridHelper args={[50, 50, '#333', '#111']} position={[0, -4.99, 0]} />
        </group>
    );
};

// --- MAIN MACRO VIEW MANAGER ---
const MacroView = ({ reaction, progress }) => {
    // Determine if we use the new dynamic system (check for 'apparatus' array)
    // or fallback to hardcoded legacy views (for backward compatibility if any)

    if (reaction.apparatus && reaction.apparatus.length > 0) {
        return <DynamicSetup reaction={reaction} progress={progress} />;
    }

    // FALLBACK for any legacy usage
    return null;
};

export default MacroView;
