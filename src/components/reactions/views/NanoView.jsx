// // src/components/reactions/views/NanoView.jsx
// import MicroView from './MicroView';
// import { Sphere } from '@react-three/drei';

// const NanoView = ({ reaction, progress }) => {
//     return (
//         <group>
//             {/* Render the base atoms from MicroView */}
//             <MicroView reaction={reaction} progress={progress} />

//             {/* Add Electron Clouds / Glowing Fields */}
//             {reaction.atoms.map((atom) => (
//                // This would be a shader or a translucent mesh representing electron density
//                <ElectronCloud 
//                  key={`cloud-${atom.id}`} 
//                  atom={atom} 
//                  progress={progress} 
//                />
//             ))}
//         </group>
//     );
// };

// const ElectronCloud = ({ atom, progress }) => {
//     // Simplified: Just a glowing translucent shell for now
//     // In a real implementation, you'd calculate this position similarly to the atom
//     return (
//         <Sphere args={[0.6, 16, 16]} position={atom.startPos}> 
//            <meshBasicMaterial color="#00ffff" transparent opacity={0.15} wireframe />
//         </Sphere>
//     );
// };

// export default NanoView;






// src/components/reactions/views/NanoView.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

// An Atom with electron shells
const NanoAtom = ({ element, position, electrons, showTransfer, transferTarget, progress }) => {
    return (
        <group position={position}>
            {/* Nucleus */}
            <Sphere args={[0.4, 32, 32]}>
                <meshStandardMaterial color={element === 'Na' ? '#ffaa00' : '#00aaff'} emissiveIntensity={0.5} />
            </Sphere>
            <Html position={[0, 0.6, 0]} center><span className="text-xs font-bold text-white">{element}</span></Html>

            {/* Electron Shell (Ring) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 0.95, 32]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} opacity={0.3} transparent />
            </mesh>

            {/* Valence Electrons */}
            {Array.from({ length: electrons }).map((_, i) => {
                // If this is the transferring electron
                if (showTransfer && i === electrons - 1) {
                    return (
                        <TransferElectron 
                            key={i} 
                            start={[1, 0, 0]} // Relative to atom
                            target={transferTarget} // Global target position
                            parentPos={position}
                            progress={progress}
                        />
                    )
                }
                const angle = (i / electrons) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(angle), 0, Math.sin(angle)]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
                    </mesh>
                )
            })}
        </group>
    );
};

const TransferElectron = ({ start, target, parentPos, progress }) => {
    const ref = useRef();
    useFrame(() => {
        if(ref.current) {
             // Calculate global start pos
             const globalStart = new THREE.Vector3(...start).add(new THREE.Vector3(...parentPos));
             const globalTarget = new THREE.Vector3(...target);
             
             // Move electron based on progress
             ref.current.position.lerpVectors(globalStart, globalTarget, progress);
        }
    })
    return (
        <mesh ref={ref} scale={1.5}> {/* Slightly larger transferring electron */}
             <sphereGeometry args={[0.08, 16, 16]} />
             <meshStandardMaterial color="#ffff00" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
    )
}

const NanoView = ({ reaction, progress }) => {
    // Example: Showing Electron Transfer (Ionic) or Sharing (Covalent)
    // This simplifies the view to just 2 interacting atoms for clarity
    
    return (
        <group>
             <Html position={[0, 3, 0]} center>
                <div className="text-white text-sm bg-black/50 p-2 rounded">
                    Observing Valence Electron Transfer
                </div>
            </Html>

            {/* Example: Na giving electron to Cl */}
            <NanoAtom 
                element="Na" 
                position={[-2, 0, 0]} 
                electrons={1} 
                showTransfer={true} 
                transferTarget={[2, 0, 0]} // Target is the other atom position
                progress={progress}
            />
            
            <NanoAtom 
                element="Cl" 
                position={[2, 0, 0]} 
                electrons={7} 
            />
            
            {/* Visual Arrow showing direction */}
            {progress < 0.1 && (
                <Line 
                    points={[[-1, 0, 0], [1, 0, 0]]} 
                    color="white" 
                    lineWidth={2} 
                    dashed 
                />
            )}
        </group>
    );
};

export default NanoView;