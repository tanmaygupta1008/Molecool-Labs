// src/components/reactions/views/MicroView.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Nucleus, AdaptiveElectron, FieldLines, OrbitalCloud } from './SubatomicElements';
import MethaneMicroSequence from './sequences/MethaneMicroSequence';
import HaberMicroSequence from './sequences/HaberMicroSequence';
import ContactMicroSequence from './sequences/ContactMicroSequence';
import SolvayMicroSequence from './sequences/SolvayMicroSequence';
import ActionExecutor from '../engine/ActionExecutor';

export const MicroHUD = ({ title, status, equation }) => (
    <Html position={[0, 4, 0]} center distanceFactor={10}>
        <div className="text-center w-80 pointer-events-none">
            <h3 className="text-cyan-400 font-bold text-lg uppercase tracking-widest mb-2 drop-shadow-lg">
                {title}
            </h3>
            <div className="text-white text-sm bg-gradient-to-br from-black/90 to-cyan-900/50 p-3 rounded-lg border-2 border-cyan-400/40 shadow-2xl backdrop-blur-md">
                {status}
            </div>
            {equation && (
                <div className="mt-2 text-xs text-cyan-200 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/30">
                    {equation}
                </div>
            )}
        </div>
    </Html>
);

const MicroView = ({ reaction, progress, environment }) => {
    return (
        <group>
            {/* Ambient particles for atmosphere */}
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.4} color="#4488ff" />

            {/* If the reaction has a JSON script, run it in the generic engine! */}
            {reaction.microView?.script ? (
                <>
                    <ActionExecutor script={reaction.microView.script} progress={progress} />
                </>
            ) : (
                <>
                    {/* Render existing manual choreographies as fallback */}
                    {reaction.id === 'methane_combustion' && <MethaneMicroSequence reaction={reaction} progress={progress} />}
                    {reaction.id === 'haber_process' && <HaberMicroSequence reaction={reaction} progress={progress} />}
                    {reaction.id === 'contact_process' && <ContactMicroSequence reaction={reaction} progress={progress} />}
                    {reaction.id === 'solvay_process' && <SolvayMicroSequence reaction={reaction} progress={progress} />}

                    {/* Fallback for unchoreographed reactions */}
                    {['methane_combustion', 'haber_process', 'contact_process', 'solvay_process'].indexOf(reaction.id) === -1 && (
                        <MicroHUD
                            title="Micro View Not Available"
                            status="Detailed subatomic choreography is not yet available for this reaction."
                        />
                    )}
                </>
            )}
        </group>
    );
};

export default MicroView;