'use client'; 

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sphere, Cylinder, Plane, TransformControls } from '@react-three/drei';
import * as THREE from 'three'; 
import { useRef, useState, useLayoutEffect, useEffect, Suspense } from 'react';
import { getElementData } from '@/utils/elementColors';
import AnimatedDashedLine from '@/components/reactions/engine/AnimatedDashedLine';
import BondLine from '@/components/reactions/engine/BondLine';

// Physics Constants
const IDEAL_BOND_LENGTH = 1.5;
const LP_DISTANCE = 0.8;
const REPULSION_STRENGTH = 3.0; // Atom-Atom
const LP_REPULSION_STRENGTH = 5.0; // LP repels more strongly!
const SPRING_STIFFNESS = 4.0;
const DAMPING = 0.85;

// Utility to get expected Lone Pairs (simplified VSEPR heuristic based strictly on Group)
const getExpectedLonePairs = (element, bondCount) => {
    if (['F', 'Cl', 'Br', 'I'].includes(element)) return Math.max(0, 4 - bondCount);
    if (['O', 'S', 'Se'].includes(element)) return Math.max(0, 4 - bondCount);
    if (['N', 'P'].includes(element)) return Math.max(0, 4 - bondCount);
    return 0; // C, H, etc...
};

// Physics Simulation Component
const LocalVSEPRPhysics = ({ nodes, links, positions, lpPositions, atomRefs, bondRefs, lpRefs, active }) => {
    useFrame((state, delta) => {
        if (!active || !nodes.length) return;

        const dt = Math.min(delta, 0.05); 
        const forces = Array(nodes.length).fill().map(() => new THREE.Vector3());
        
        // Count bonds for each atom to determine Lone Pairs dynamically
        const bondCounts = Array(nodes.length).fill(0);
        links.forEach(l => { bondCounts[l.source]++; bondCounts[l.target]++ });

        // Maintain Lone Pair array state
        let lpIndex = 0;

        // 0. Thermal Noise (Crucial to break 2D planar local minimums so square-planar becomes tetrahedral immediately)
        for (let i = 0; i < nodes.length; i++) {
            forces[i].add(new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                // Bias Z explicitly OUT of the plane to guarantee instant escape from 2D without wiggling
                (i % 2 === 0 ? Math.random() : -Math.random()) 
            ).multiplyScalar(30.0));
        }

        // 1. Hooke's Law (Sprint Attraction along bonds)
        links.forEach(link => {
            const p1 = positions.current[link.source];
            const p2 = positions.current[link.target];
            if (!p1 || !p2) return;

            const dir = new THREE.Vector3().subVectors(p2, p1);
            let dist = dir.length();
            if (dist === 0) { dir.set(1, 0, 0); dist = 1; }
            
            const forceMag = (dist - IDEAL_BOND_LENGTH) * SPRING_STIFFNESS;
            dir.normalize().multiplyScalar(forceMag);
            forces[link.source].add(dir);
            forces[link.target].sub(dir);
        });

        // 2. Coulomb's Law (Repulsion between all ATOMS)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const p1 = positions.current[i];
                const p2 = positions.current[j];
                if (!p1 || !p2) continue;

                // Don't strongly repel directly bonded atoms, springs handle that
                const isBonded = links.some(l => (l.source === i && l.target === j) || (l.source === j && l.target === i));
                if (isBonded) continue;

                const dir = new THREE.Vector3().subVectors(p1, p2);
                let dist = dir.length();
                if (dist < 0.1) {
                    dir.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
                    dist = 0.1;
                }
                const forceMag = REPULSION_STRENGTH / (dist * dist);
                dir.normalize().multiplyScalar(forceMag);
                forces[i].add(dir);
                forces[j].sub(dir);
            }
        }
        
        // 2.5 Angular Bond Repulsion (VSEPR Engine Core)
        // Aggressively pushes connected bonds apart to perfectly form the 3D geometry
        nodes.forEach((node, i) => {
            const pCenter = positions.current[i];
            const bondedAtoms = links.reduce((acc, l) => {
                if (l.source === i) acc.push(l.target);
                else if (l.target === i) acc.push(l.source);
                return acc;
            }, []);
            
            for(let m = 0; m < bondedAtoms.length; m++) {
                for(let n = m + 1; n < bondedAtoms.length; n++) {
                    const p1 = positions.current[bondedAtoms[m]];
                    const p2 = positions.current[bondedAtoms[n]];
                    
                    const dir1 = p1.clone().sub(pCenter).normalize();
                    const dir2 = p2.clone().sub(pCenter).normalize();
                    
                    const diff = dir1.clone().sub(dir2); // points from dir2 to dir1
                    let distSq = diff.lengthSq();
                    if(distSq < 0.01) { diff.set(Math.random(), Math.random(), Math.random()).normalize(); distSq = 0.5; }
                    
                    // Huge repulsion force scaled by inverse distance to aggressively snap shapes
                    const forceMag = 40.0 / (distSq); 
                    const force = diff.normalize().multiplyScalar(forceMag);
                    
                    forces[bondedAtoms[m]].add(force);
                    forces[bondedAtoms[n]].sub(force);
                }
            }
        });

        // 3. LONE PAIRS PHYSICS (VSEPR Integration)
        nodes.forEach((node, i) => {
            const pCenter = positions.current[i];
            const numLP = getExpectedLonePairs(node.element, bondCounts[i]);
            
            for (let l = 0; l < numLP; l++) {
                if (!lpPositions.current[lpIndex]) {
                    lpPositions.current[lpIndex] = pCenter.clone().add(new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize().multiplyScalar(LP_DISTANCE));
                }
                const pLp = lpPositions.current[lpIndex];
                
                // Spring attracting LP to its central Atom
                const dirToCenter = new THREE.Vector3().subVectors(pCenter, pLp);
                const distToCenter = dirToCenter.length();
                dirToCenter.normalize().multiplyScalar((distToCenter - LP_DISTANCE) * SPRING_STIFFNESS * 2.0);
                pLp.addScaledVector(dirToCenter, dt); 
                // Central atom experiences opposite force
                forces[i].sub(dirToCenter);

                // Repulsion: LP vs Other LP on SAME ATOM
                for (let otherLp = lpIndex + 1; otherLp < lpIndex + numLP - l; otherLp++) {
                    const oLpPos = lpPositions.current[otherLp];
                    if (oLpPos) {
                        const dirLpLp = new THREE.Vector3().subVectors(pLp, oLpPos);
                        let ldist = dirLpLp.length();
                        if (ldist < 0.01) { dirLpLp.set(1,0,0); ldist = 0.1; }
                        dirLpLp.normalize().multiplyScalar(LP_REPULSION_STRENGTH / Math.pow(ldist, 2));
                        pLp.addScaledVector(dirLpLp, dt);
                        oLpPos.sub(dirLpLp.clone().multiplyScalar(dt));
                    }
                }

                // Repulsion: LP vs Real Bonds (Pushing bonded atoms away)
                links.forEach(link => {
                    if (link.source === i) {
                        const pBonded = positions.current[link.target];
                        const dirLpAtom = new THREE.Vector3().subVectors(pLp, pBonded);
                        let dist = dirLpAtom.length();
                        dirLpAtom.normalize().multiplyScalar(LP_REPULSION_STRENGTH / Math.pow(Math.max(0.1, dist), 2));
                        forces[link.target].sub(dirLpAtom); // Push atom away
                        pLp.addScaledVector(dirLpAtom, dt); // Push LP away
                    } else if (link.target === i) {
                        const pBonded = positions.current[link.source];
                        const dirLpAtom = new THREE.Vector3().subVectors(pLp, pBonded);
                        let dist = dirLpAtom.length();
                        dirLpAtom.normalize().multiplyScalar(LP_REPULSION_STRENGTH / Math.pow(Math.max(0.1, dist), 2));
                        forces[link.source].sub(dirLpAtom); // Push atom away
                        pLp.addScaledVector(dirLpAtom, dt); // Push LP away
                    }
                });

                // Update LP Mesh
                if (lpRefs.current[lpIndex]) {
                    lpRefs.current[lpIndex].position.copy(pLp);
                    lpRefs.current[lpIndex].visible = true; // ensure it shows
                }
                
                lpIndex++;
            }
        });

        // Hide unused LPs
        for(let l = lpIndex; l < lpRefs.current.length; l++) {
            if (lpRefs.current[l]) lpRefs.current[l].visible = false;
        }


        // Apply Forces to Atoms
        for (let i = 0; i < nodes.length; i++) {
            if (forces[i].lengthSq() > 0.0001) {
                // Aggressive fast-forward scaling to instantly arrange bonds
                forces[i].multiplyScalar(12.0); 
                forces[i].multiplyScalar(DAMPING);
                
                if (forces[i].length() > 25) forces[i].normalize().multiplyScalar(25); // cap velocity
                
                positions.current[i].addScaledVector(forces[i], dt);

                if (atomRefs.current[i]) {
                    atomRefs.current[i].position.copy(positions.current[i]);
                }
            }
        }

        // Apply visual updates to Bonds
        links.forEach((link, idx) => {
            if (bondRefs.current[idx]) {
                const p1 = positions.current[link.source];
                const p2 = positions.current[link.target];
                if (!p1 || !p2) return;

                const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                const length = p1.distanceTo(p2);
                const orientation = new THREE.Vector3().subVectors(p2, p1).normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), orientation);

                bondRefs.current[idx].position.copy(midPoint);
                bondRefs.current[idx].scale.set(1, length, 1);
                bondRefs.current[idx].setRotationFromQuaternion(quaternion);
            }
        });

    });

    return null;
};

// --- Clickable Plane ---
const ClickablePlane = ({ onPlaceAtom }) => (
    <Plane
        args={[100, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={(e) => {
            e.stopPropagation();
            onPlaceAtom(e.point);
        }}
    />
);

export default function MoleculeBuilder3D({ 
    nodes, links, mode, autoLayout, 
    selectedAtomId, selectedBondId, pointerPos3D, setPointerPos3D,
    onAtomClick, onBondClick, onPlaneClick, onUpdateAtomPosition
}) {
    const atomRefs = useRef([]);
    const bondRefs = useRef([]);
    const lpRefs = useRef([]);
    const positions = useRef([]);
    const lpPositions = useRef([]);

    const [orbitEnabled, setOrbitEnabled] = useState(true);

    // Sync state positions to local ref
    useEffect(() => {
        positions.current = nodes.map(n => new THREE.Vector3(...(n.startPos || [0,0,0])));
    }, [nodes.length]); // Only reset fully on node count change

    // Ensure ref arrays are large enough
    useLayoutEffect(() => {
        atomRefs.current = atomRefs.current.slice(0, nodes.length);
        bondRefs.current = bondRefs.current.slice(0, links.length);
        // We might have up to 4 LPs per atom max
        lpRefs.current = lpRefs.current.slice(0, nodes.length * 4);
        lpPositions.current = lpPositions.current.slice(0, nodes.length * 4);
    }, [nodes.length, links.length]);

    return (
        <Canvas camera={{ position: [0, 5, 12], fov: 60 }} onContextMenu={(e) => e.preventDefault()}>
            <Suspense fallback={null}>
                <Environment preset="night" />
            </Suspense>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 10]} intensity={1.5} />
            
            <LocalVSEPRPhysics 
                nodes={nodes} 
                links={links} 
                positions={positions} 
                lpPositions={lpPositions}
                atomRefs={atomRefs} 
                bondRefs={bondRefs}
                lpRefs={lpRefs}
                active={autoLayout} 
            />

            {mode === 'add' && <ClickablePlane onPlaceAtom={onPlaneClick} />}

            {/* Render Invisible Plane for bounding drawing mode securely */}
            {mode === 'bond' && selectedAtomId !== null && (() => {
                const s = positions.current[selectedAtomId];
                if(!s) return null;
                return (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, s.y, 0]} onPointerMove={(e) => { e.stopPropagation(); setPointerPos3D && setPointerPos3D([e.point.x, e.point.y, e.point.z]);}}>
                        <planeGeometry args={[100, 100]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} color="white" />
                    </mesh>
                );
            })()}

            {/* Dotted Bond Preview */}
            {mode === 'bond' && selectedAtomId !== null && pointerPos3D && (() => {
                const sp = positions.current[selectedAtomId];
                if (!sp) return null;
                return <AnimatedDashedLine points={[sp.toArray(), pointerPos3D]} color="#00ffff" lineWidth={2} dashed dashSize={0.4} gapSize={0.2} />;
            })()}

            {/* Render Nodes */}
            {nodes.map((node, i) => {
                const isSelected = selectedAtomId === i && (mode === 'select' || mode === 'bond');
                const baseColor = getElementData(node.element).color || '#FF1493';

                const AtomContent = (
                    <group 
                        onClick={(e) => { e.stopPropagation(); onAtomClick(e, i); }}
                        onPointerOver={(e) => { 
                            e.stopPropagation(); 
                            if(mode !== 'none') document.body.style.cursor = 'pointer'; 
                            if(mode === 'bond' && selectedAtomId !== null && selectedAtomId !== i) setPointerPos3D && setPointerPos3D(positions.current[i].toArray());
                        }}
                        onPointerOut={() => { document.body.style.cursor = 'crosshair'; }}
                    >
                        {isSelected && (
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[1.0, 1.2, 32]} />
                                <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.6} />
                            </mesh>
                        )}
                        <Sphere ref={el => atomRefs.current[i] = el} position={node.startPos || [0,0,0]} args={[0.4, 32, 32]}>
                            <meshStandardMaterial color={baseColor} emissive={isSelected ? '#00ffff' : '#000000'} emissiveIntensity={isSelected ? 0.5 : 0} />
                        </Sphere>
                    </group>
                );

                return (
                    <group key={`atom-${i}`}>
                        {isSelected ? (
                            <TransformControls mode="translate" size={0.6} position={positions.current[i] || node.startPos} onMouseDown={() => setOrbitEnabled(false)} onMouseUp={(e) => {
                                setOrbitEnabled(true);
                                const { x, y, z } = e.target.object.position;
                                if (onUpdateAtomPosition) onUpdateAtomPosition(i, [x, y, z]);
                                // Sync local ref
                                positions.current[i].set(x, y, z);
                            }}>
                                {AtomContent}
                            </TransformControls>
                        ) : AtomContent}
                    </group>
                );
            })}

            {/* Render Links */}
            {links.map((link, i) => {
                const isSelected = selectedBondId === i && (mode === 'select' || mode === 'delete');
                const c1 = getElementData(nodes[link.source]?.element).color;
                const c2 = getElementData(nodes[link.target]?.element).color;
                
                return (
                    <group 
                        key={`bond-${i}`}
                        onClick={(e) => { e.stopPropagation(); onBondClick(e, i); }}
                        onPointerOver={(e) => { e.stopPropagation(); if (mode === 'delete' || mode === 'select') document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { document.body.style.cursor = 'crosshair'; }}
                    >
                        <BondLine
                            ref={el => bondRefs.current[i] = el}
                            startPos={positions.current[link.source] || [0,0,0]}
                            endPos={positions.current[link.target] || [0,0,0]}
                            order={link.order || 1}
                            colorStart={isSelected ? "#00ffff" : c1}
                            colorEnd={isSelected ? "#00ffff" : c2}
                            state="normal"
                        />
                    </group>
                );
            })}

            {/* Render Lone Pairs pools */}
            {Array(nodes.length * 4).fill().map((_, i) => (
                <Sphere key={`lp-${i}`} ref={el => lpRefs.current[i] = el} args={[0.2, 16, 16]} visible={false}>
                    <meshStandardMaterial color="#00ffcc" transparent opacity={0.3} emissive="#00ffcc" emissiveIntensity={0.8} />
                </Sphere>
            ))}

            <OrbitControls 
                enablePan={true} 
                enableZoom={true} 
                enabled={orbitEnabled} 
                mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
            />
        </Canvas>
    );
}
