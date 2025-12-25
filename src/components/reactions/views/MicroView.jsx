// // src/components/reactions/views/MicroView.jsx
// import { useRef, useMemo } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Vector3 } from 'three';
// import { Sphere } from '@react-three/drei';

// const ATOM_COLORS = { C: '#333333', H: '#FFFFFF', O: '#FF0000', N: '#0000FF' };
// const ATOM_SIZES = { C: 0.4, H: 0.25, O: 0.35, N: 0.35 };

// const Atom = ({ element, startPos, endPos, progress }) => {
//     const meshRef = useRef();
    
//     // Convert arrays to Vector3
//     const start = useMemo(() => new Vector3(...startPos), [startPos]);
//     const end = useMemo(() => new Vector3(...endPos), [endPos]);
    
//     useFrame(() => {
//         if (meshRef.current) {
//             // LERP: Linear Interpolation based on progress (0 to 1)
//             // This creates the smooth movement from reactant state to product state
//             meshRef.current.position.lerpVectors(start, end, progress);
            
//             // Add a little "shake" (thermal energy) if in the middle of reaction
//             if (progress > 0.2 && progress < 0.8) {
//                 meshRef.current.position.x += (Math.random() - 0.5) * 0.02;
//                 meshRef.current.position.y += (Math.random() - 0.5) * 0.02;
//             }
//         }
//     });

//     return (
//         <Sphere ref={meshRef} args={[ATOM_SIZES[element], 32, 32]}>
//             <meshStandardMaterial color={ATOM_COLORS[element]} roughness={0.3} />
//         </Sphere>
//     );
// };

// const MicroView = ({ reaction, progress }) => {
//     return (
//         <group>
//             {reaction.atoms.map((atom) => (
//                 <Atom 
//                     key={atom.id}
//                     element={atom.element}
//                     startPos={atom.startPos}
//                     endPos={atom.endPos}
//                     progress={progress}
//                 />
//             ))}
//             {/* TODO: Add Bond Logic here. 
//                Bonds should be drawn between atoms if distance < threshold.
//             */}
//         </group>
//     );
// };

// export default MicroView;




// src/components/reactions/views/MicroView.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import { useReactionPhysics } from '@/hooks/useReactionPhysics';

const ATOM_COLORS = { C: '#333333', H: '#FFFFFF', O: '#FF0000', N: '#0000FF', S: '#FFD700', Na: '#AB5CF2', Cl: '#00FF00' };
const ATOM_SIZES = { C: 0.4, H: 0.25, O: 0.35, N: 0.35, S: 0.45, Na: 0.5, Cl: 0.45 };

const PhysicsAtom = ({ id, physicsObj, element }) => {
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current) {
            // Sync mesh position with the physics simulation
            meshRef.current.position.copy(physicsObj.position);
        }
    });

    return (
        // Trail adds a nice visual cue for fast movement (high energy)
        <Trail width={0.2} length={4} color={ATOM_COLORS[element]} attenuation={(t) => t * t}>
            <Sphere ref={meshRef} args={[ATOM_SIZES[element], 32, 32]}>
                <meshStandardMaterial 
                    color={ATOM_COLORS[element]} 
                    roughness={0.2} 
                    metalness={0.3} 
                />
            </Sphere>
        </Trail>
    );
};

const MicroView = ({ reaction, progress }) => {
    // Determine Temperature based on reaction phase
    // Example: Exothermic reactions release heat (temp spikes at progress = 1)
    let temperature = 0.5; // Base room temp
    if (progress > 0.5) {
        // Heat spike simulation
        temperature += Math.sin((progress - 0.5) * Math.PI) * 2.0; 
    }

    const physicsState = useReactionPhysics(reaction.atoms, progress, temperature);

    return (
        <group>
            {reaction.atoms.map((atom, i) => (
                <PhysicsAtom 
                    key={atom.id}
                    id={atom.id}
                    element={atom.element}
                    physicsObj={physicsState[i]}
                />
            ))}
        </group>
    );
};

export default MicroView;