'use client'; 

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sphere, Cylinder, Html } from '@react-three/drei';
import { Vector3, Color, Quaternion, TorusGeometry, Euler } from 'three'; 
import { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { calculateLonePairs } from '@/lib/cheminformatics';

const ATOM_RADIUS = 0.3; 
const BOND_RADIUS = 0.1; 
const ARC_THICKNESS = 0.02;

export const CPK_COLORS = { 
  C: '#909090', 
  H: '#FFFFFF', 
  O: '#FF0D0D', 
  N: '#3050F8', 
  P: '#FFA500', 
  S: '#FFFF30', 
  DEFAULT: '#FF1493', 
};

const getBondAngle = (centerPos, posA, posB) => {
    const vA = new Vector3().subVectors(posA, centerPos).normalize();
    const vB = new Vector3().subVectors(posB, centerPos).normalize();
    const angleRad = vA.angleTo(vB);
    return { angleRad, angleDeg: (angleRad * 180 / Math.PI).toFixed(1) };
};

const Atom = ({ position, element, sphereRef, isHighlighted, isDimmed, onSelectAtom, id }) => {
  const baseColor = CPK_COLORS[element] || CPK_COLORS.DEFAULT;
  const color = new Color(baseColor);
  const emissiveColor = isHighlighted ? new Color('#00ffff') : new Color('#000000');
  const emissiveIntensity = isHighlighted ? 1.5 : 0;
  const opacity = isDimmed ? 0.3 : 1;

  return (
    <Sphere 
        ref={sphereRef} 
        position={position} 
        args={[ATOM_RADIUS, 32, 32]}
        onClick={(e) => { e.stopPropagation(); onSelectAtom && onSelectAtom(id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'auto'; }}
    >
      <meshStandardMaterial 
        color={color} 
        emissive={emissiveColor} 
        emissiveIntensity={emissiveIntensity} 
        transparent={true} 
        opacity={opacity} 
      />
    </Sphere>
  );
};

const LonePairSphere = ({ position }) => {
    return (
        <Sphere position={position} args={[0.15, 16, 16]}>
            <meshStandardMaterial color="#00ffcc" transparent={true} opacity={0.6} emissive="#00ffcc" emissiveIntensity={0.5} />
        </Sphere>
    );
};

const BondLengthLabel = ({ midPoint, length, orientation, atomRefs }) => {
    const rotationEulers = useMemo(() => {
        const euler = new Euler(); 
        euler.setFromQuaternion(orientation, 'XYZ'); 
        return euler.toArray().slice(0, 3); 
    }, [orientation]);

    return (
        <Html 
            position={midPoint.toArray()} 
            center 
            distanceFactor={10} 
            rotation={rotationEulers} 
            zIndexRange={[100, 0]} 
        >
            <div className="bg-transparent px-1 py-0.5 rounded text-xs text-white pointer-events-none whitespace-nowrap">
                {length} Å
            </div>
        </Html>
    );
};

const Bond = ({ start, end, length, showLength, atomRefs, isHighlighted, isDimmed }) => {
  const meshRef = useRef();
  
  const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  const calculatedLength = start.distanceTo(end);

  const orientation = new Vector3().subVectors(end, start).normalize();
  const quaternion = new Quaternion();
  const upVector = new Vector3(0, 1, 0); 
  quaternion.setFromUnitVectors(upVector, orientation);

  const emissiveColor = isHighlighted ? new Color('#00ffff') : new Color('#000000');
  const emissiveIntensity = isHighlighted ? 1 : 0;
  const opacity = isDimmed ? 0.3 : 1;

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(midPoint);
      meshRef.current.setRotationFromQuaternion(quaternion);
    }
  }, [midPoint, calculatedLength, quaternion]);

  return (
    <>
      <Cylinder 
        ref={meshRef} 
        args={[BOND_RADIUS, BOND_RADIUS, calculatedLength, 8]}
      >
        <meshStandardMaterial 
            color={'#A0A0A0'} 
            emissive={emissiveColor} 
            emissiveIntensity={emissiveIntensity} 
            transparent={true} 
            opacity={opacity} 
        /> 
      </Cylinder>
      
      {showLength && (
        <BondLengthLabel 
          midPoint={midPoint} 
          length={(length || calculatedLength).toFixed(3)} 
          orientation={quaternion} 
          atomRefs={atomRefs}       
        />
      )}
    </>
  );
};

const BondAngleArc = ({ centerPos, posA, posB, arcRadius, angleRad }) => {
    const meshRef = useRef();
    const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);

    const bondVectorA = new Vector3().subVectors(posA, centerPos).normalize();
    const bondVectorB = new Vector3().subVectors(posB, centerPos).normalize();
    const normalVector = new Vector3().crossVectors(bondVectorA, bondVectorB).normalize();
    
    const quaternion = new Quaternion();
    const zAxis = new Vector3(0, 0, 1); 
    quaternion.setFromUnitVectors(zAxis, normalVector); 

    const averageVector = new Vector3().addVectors(bondVectorA, bondVectorB).normalize();
    const labelPosition = new Vector3().addVectors(centerPos, averageVector.multiplyScalar(arcRadius + 0.3));

    useLayoutEffect(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(centerPos); 
            meshRef.current.setRotationFromQuaternion(quaternion); 
            const localVectorA = bondVectorA.clone().applyQuaternion(quaternion.clone().invert());
            const angleOffset = Math.atan2(localVectorA.y, localVectorA.x);
            meshRef.current.rotation.z = angleOffset; 
            meshRef.current.updateMatrixWorld();
        }
    }, [centerPos, posA, posB, angleRad, quaternion]); 

    return (
        <> 
            <mesh ref={meshRef}>
                <torusGeometry args={[arcRadius, ARC_THICKNESS, 16, 100, angleRad]} />
                <meshStandardMaterial color={'#FFFF00'} side={2} /> 
            </mesh>
            <Html position={labelPosition.toArray()} center>
                <div className="text-sm font-bold text-yellow-300 pointer-events-none">
                    {angleDeg}°
                </div>
            </Html>
        </> 
    );
};

const ControlPanel = ({ showBondLength, setShowBondLength, showBondAngle, setShowBondAngle, showLonePairs, setShowLonePairs }) => (
    <div className="absolute top-4 right-4 bg-gray-700 bg-opacity-80 p-3 rounded-lg text-xs shadow-xl text-white pointer-events-auto z-10">
        <h4 className="font-bold border-b border-gray-600 mb-2 pb-1">View Options</h4>
        <div className="flex flex-col space-y-1">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-cyan-300">
                <input 
                    type="checkbox" 
                    checked={showBondLength} 
                    onChange={(e) => setShowBondLength(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-900 border-gray-600 rounded"
                />
                <span>Bond Lengths</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-cyan-300">
                <input 
                    type="checkbox" 
                    checked={showBondAngle} 
                    onChange={(e) => setShowBondAngle(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-900 border-gray-600 rounded"
                />
                <span>Bond Angles</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer hover:text-cyan-300">
                <input 
                    type="checkbox" 
                    checked={showLonePairs} 
                    onChange={(e) => setShowLonePairs(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-900 border-gray-600 rounded"
                />
                <span>Lone Pairs (VSEPR)</span>
            </label>
        </div>
    </div>
);

const Molecule3DModel = ({ structure, onElementsUsedChange, highlightedGroup, onAtomSelect }) => { 
    const [showBondLength, setShowBondLength] = useState(false);
    const [showBondAngle, setShowBondAngle] = useState(false);
    const [showLonePairs, setShowLonePairs] = useState(false);
    
    const atomMeshRefs = useRef([]); 

    useLayoutEffect(() => {
        if (structure && structure.atoms && atomMeshRefs.current.length !== structure.atoms.length) {
            atomMeshRefs.current = Array(structure.atoms.length).fill(null).map((_, i) => 
                atomMeshRefs.current[i] || { current: null } 
            );
        }
    }, [structure?.atoms?.length]);

    const actualAtomMeshes = useMemo(() => {
        return atomMeshRefs.current.map(ref => ref.current).filter(Boolean);
    }, [structure?.atoms?.length]);

    if (!structure || !structure.atoms || structure.atoms.length === 0) {
        return (
            <div className="h-full w-full bg-gray-900 flex items-center justify-center rounded-lg">
                <p className="text-red-400">Structure data is missing or invalid for this compound.</p>
            </div>
        );
    }
    const uniqueElements = useMemo(() => {
        return Array.from(new Set(structure.atoms.map(a => a.element)));
    }, [structure]);

    useLayoutEffect(() => {
        if (onElementsUsedChange) {
            onElementsUsedChange(uniqueElements);
        }
    }, [uniqueElements, onElementsUsedChange]); 

    const atomPositions = structure.atoms.map(a => new Vector3(a.x, a.y, a.z));
    const centroid = useMemo(() => {
        const c = new Vector3();
        atomPositions.forEach(p => c.add(p));
        c.divideScalar(atomPositions.length);
        return c;
    }, [structure]);

    const maxDistance = atomPositions.reduce((max, p) => 
        Math.max(max, p.distanceTo(centroid)), 0);
    const boundingSphereRadius = maxDistance;
    const cameraDistance = Math.max(boundingSphereRadius * 4, 8); 

    const lonePairs = useMemo(() => {
        if (!showLonePairs) return [];
        return calculateLonePairs(structure);
    }, [structure, showLonePairs]);

    const bondAngleArcs = useMemo(() => {
        if (!showBondAngle) return []; 
        
        const arcs = [];
        const atomsCount = structure.atoms.length;

        for (let c = 0; c < atomsCount; c++) {
            const centerPos = atomPositions[c];
            const connectedBonds = structure.bonds.filter(b => b.a === c || b.b === c);
            
            const neighbors = connectedBonds.map(bond => {
                const neighborId = bond.a === c ? bond.b : bond.a;
                return { id: neighborId, pos: atomPositions[neighborId] };
            });
            
            for (let i = 0; i < neighbors.length; i++) {
                for (let j = i + 1; j < neighbors.length; j++) {
                    const neighborA = neighbors[i];
                    const neighborB = neighbors[j];

                    const angleKey = [c, neighborA.id, neighborB.id].sort((a, b) => a - b).join('-');
                    const bondLengthA = centerPos.distanceTo(neighborA.pos);
                    const bondLengthB = centerPos.distanceTo(neighborB.pos);
                    const { angleRad } = getBondAngle(centerPos, neighborA.pos, neighborB.pos);
                    
                    const shortestBondLength = Math.min(bondLengthA, bondLengthB);
                    const minSafeRadius = ATOM_RADIUS + BOND_RADIUS + 0.15;
                    const maxSafeRadius = shortestBondLength - ATOM_RADIUS - 0.1;

                    let arcRadius = Math.max(minSafeRadius, 0.6); 
                    arcRadius = Math.min(arcRadius, maxSafeRadius);
                    
                    if (arcRadius < minSafeRadius) continue; 

                    arcs.push(
                        <BondAngleArc
                            key={angleKey}
                            centerPos={centerPos}
                            posA={neighborA.pos}
                            posB={neighborB.pos}
                            arcRadius={arcRadius} 
                            angleRad={angleRad} 
                        />
                    );
                }
            }
        }
        return arcs;
    }, [showBondAngle, structure, atomPositions]);

    const hasHighlight = highlightedGroup && highlightedGroup.atoms && highlightedGroup.atoms.size > 0;

    return (
        <div className="relative h-full w-full"> 
            <ControlPanel 
                showBondLength={showBondLength} 
                setShowBondLength={setShowBondLength}
                showBondAngle={showBondAngle}
                setShowBondAngle={setShowBondAngle}
                showLonePairs={showLonePairs}
                setShowLonePairs={setShowLonePairs}
            />

            <Canvas camera={{ position: [0, 0, cameraDistance], fov: 60 }}>
                <Environment preset="night" />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {structure.atoms.map((atom, index) => {
                    const isHighlighted = hasHighlight ? highlightedGroup.atoms.has(index) : false;
                    const isDimmed = hasHighlight ? !highlightedGroup.atoms.has(index) : false;

                    return (
                        <Atom 
                            key={`atom-${index}`}
                            id={index} 
                            position={atomPositions[index]}
                            element={atom.element}
                            sphereRef={atomMeshRefs.current[index]} 
                            isHighlighted={isHighlighted}
                            isDimmed={isDimmed}
                            onSelectAtom={onAtomSelect}
                        />
                    );
                })}
                
                {structure.bonds.map((bond, index) => {
                    const isHighlighted = hasHighlight ? highlightedGroup.bonds.has(index) : false;
                    const isDimmed = hasHighlight ? !highlightedGroup.bonds.has(index) : false;
                    
                    return (
                        <Bond 
                            key={`bond-${index}`} 
                            start={atomPositions[bond.a]} 
                            end={atomPositions[bond.b]} 
                            length={bond.length} 
                            showLength={showBondLength} 
                            atomRefs={actualAtomMeshes}
                            isHighlighted={isHighlighted}
                            isDimmed={isDimmed}
                        />
                    );
                })}

                {lonePairs.map((lp, index) => (
                    <LonePairSphere key={`lp-${index}`} position={lp.pos} />
                ))}

                {bondAngleArcs} 

                <OrbitControls 
                    enableZoom={true} 
                    enablePan={false} 
                    autoRotate={!hasHighlight} 
                    autoRotateSpeed={1}
                    target={centroid.toArray()} 
                />
            </Canvas>
        </div>
    );
};

export default Molecule3DModel;

export const MoleculeLegend = ({ elementsUsed }) => { 
    if (!elementsUsed || elementsUsed.length === 0) return null;

    const presentElements = elementsUsed
        .filter(el => CPK_COLORS[el])
        .reduce((obj, el) => {
            obj[el] = CPK_COLORS[el];
            return obj;
        }, {});
    
    const getFullName = (symbol) => {
        switch (symbol) {
            case 'C': return 'Carbon';
            case 'H': return 'Hydrogen';
            case 'O': return 'Oxygen';
            case 'N': return 'Nitrogen';
            case 'P': return 'Phosphorus';
            case 'S': return 'Sulfur';
            default: return 'Other';
        }
    };

    return (
        <div className="absolute bottom-4 left-4 bg-gray-700 bg-opacity-80 p-3 rounded-lg text-xs shadow-xl text-white pointer-events-auto z-10 border border-cyan-800">
            <h4 className="font-bold border-b border-gray-600 mb-2 pb-1 text-cyan-300">Atom Legend</h4>
            <ul className="space-y-1">
                {Object.entries(presentElements).map(([symbol, color]) => (
                    <li key={symbol} className="flex items-center space-x-2">
                        <span 
                            style={{ 
                                backgroundColor: color, 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%',
                                border: symbol === 'H' ? '1px solid #999' : '1px solid #222', 
                            }}
                        ></span>
                        <span className="font-medium text-gray-200">{symbol} ({getFullName(symbol)})</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};