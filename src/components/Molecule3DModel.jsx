'use client'; 

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sphere, Cylinder, Html } from '@react-three/drei';
import { Vector3, Color, Quaternion, TorusGeometry, Euler, CylinderGeometry, BufferAttribute } from 'three'; 
import { useRef, useLayoutEffect, useState, useMemo, Suspense, useEffect } from 'react';
import { calculateLonePairs } from '@/lib/cheminformatics';
import { getElementData } from '@/utils/elementColors';

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
  const baseColor = getElementData(element).color || CPK_COLORS.DEFAULT;
  const radius = (getElementData(element).radius || ATOM_RADIUS) * 0.65;
  const color = new Color(baseColor);
  // Always apply a subtle emissive so atoms look vivid and bright (like the builder)
  const emissiveColor = isHighlighted ? new Color('#00ffff') : color.clone().multiplyScalar(0.25);
  const emissiveIntensity = isHighlighted ? 1.5 : 0.6;
  const opacity = isDimmed ? 0.25 : 1;

  return (
    <Sphere 
        ref={sphereRef} 
        position={position} 
        args={[radius, 32, 32]}
        onClick={(e) => { e.stopPropagation(); onSelectAtom && onSelectAtom(id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'auto'; }}
    >
      <meshStandardMaterial 
        color={color} 
        emissive={emissiveColor} 
        emissiveIntensity={emissiveIntensity} 
        roughness={0.3}
        metalness={0.1}
        transparent={true} 
        opacity={opacity} 
      />
    </Sphere>
  );
};

/**
 * Teardrop-shaped lone pair orbital — same visual style as the Builder page.
 * `atomCenter` is the world position of the central atom.
 * `lpPos`      is the target world position of the lone pair electron cloud.
 * The lobe points from atomCenter → lpPos.
 */
const LonePairOrbital = ({ atomCenter, lpPos }) => {
    const electronsRef = useRef(null);

    // Compute orientation: align local +Y axis to the direction (atomCenter -> lpPos)
    const quaternion = useMemo(() => {
        const dir = new Vector3().subVectors(lpPos, atomCenter).normalize();
        return new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
    }, [atomCenter, lpPos]);

    // Spin the two electrons slowly
    useFrame(() => {
        if (electronsRef.current) {
            electronsRef.current.rotation.y += 0.03;
        }
    });

    return (
        // Placed at atom center; lobe extends outward via local +Y
        <group position={atomCenter.toArray()} quaternion={quaternion}>
            {/* The lobe — tapered cylinder */}
            <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.22, 0.04, 0.7, 16]} />
                <meshStandardMaterial color="#88ddff" transparent opacity={0.28} roughness={0.1} />
            </mesh>
            {/* Tip sphere cap */}
            <mesh position={[0, 0.72, 0]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color="#88ddff" transparent opacity={0.28} roughness={0.1} />
            </mesh>
            {/* Rotating electrons at the tip */}
            <group ref={electronsRef} position={[0, 0.72, 0]}>
                <mesh position={[-0.12, 0, 0]}>
                    <sphereGeometry args={[0.065, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={0.9} />
                </mesh>
                <mesh position={[0.12, 0, 0]}>
                    <sphereGeometry args={[0.065, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={0.9} />
                </mesh>
            </group>
        </group>
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

const Bond = ({ start, end, length, showLength, atomRefs, isHighlighted, isDimmed, colorStart, colorEnd, order = 1 }) => {
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

  // Geometry is memoized per length
  const geometry = useMemo(() => {
    // Single bonds use full BOND_RADIUS; multi-bonds use thinner tubes
    const r = order === 1 ? BOND_RADIUS : BOND_RADIUS * 0.65;
    const geo = new CylinderGeometry(r, r, calculatedLength, 8, 12);
    const colors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new BufferAttribute(colors, 3));
    return geo;
  }, [calculatedLength, order]);

  // Vertex color gradient (start → end)
  useEffect(() => {
    const cStart = new Color(colorStart || '#ffffff');
    const cEnd = new Color(colorEnd || '#ffffff');
    const pos = geometry.attributes.position;
    const colorAttr = geometry.attributes.color;
    let minY = Infinity; let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    const yRange = maxY - minY || 1;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        let t = (y - minY) / yRange;
        if (t < 0.4) t = 0;
        else if (t > 0.6) t = 1.0;
        else t = (t - 0.4) / 0.2;
        const vertexColor = cEnd.clone().lerp(cStart, t);
        colorAttr.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
    }
    colorAttr.needsUpdate = true;
  }, [colorStart, colorEnd, geometry]);

  // For double/triple bonds: compute a perpendicular offset vector
  // so the parallel tubes sit visually side-by-side without overlapping the atoms
  const offsetVec = useMemo(() => {
    if (order === 1) return null;
    // Pick a world-space vector not parallel to bond direction
    const dir = orientation.clone();
    const worldUp = Math.abs(dir.y) < 0.95 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    return new Vector3().crossVectors(dir, worldUp).normalize().multiplyScalar(BOND_RADIUS * 1.6);
  }, [orientation, order]);

  const material = (
    <meshStandardMaterial 
        color={0xffffff} 
        vertexColors={true}
        emissive={emissiveColor} 
        emissiveIntensity={emissiveIntensity} 
        transparent={true} 
        opacity={opacity} 
    />
  );

  // Single bond — original renderer
  if (order === 1) {
    return (
      <>
        <mesh ref={meshRef} geometry={geometry}>
          {material}
        </mesh>
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
  }

  // Double bond — two parallel offset tubes
  if (order === 2) {
    return (
      <>
        <group position={midPoint.toArray()} quaternion={quaternion}>
          <mesh position={offsetVec ? [offsetVec.x, 0, offsetVec.z] : [0,0,0]} geometry={geometry}>{material}</mesh>
          <mesh position={offsetVec ? [-offsetVec.x, 0, -offsetVec.z] : [0,0,0]} geometry={geometry}>{material}</mesh>
        </group>
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
  }

  // Triple bond — three parallel tubes: centre + two offset
  return (
    <>
      <group position={midPoint.toArray()} quaternion={quaternion}>
        <mesh position={[0, 0, 0]} geometry={geometry}>{material}</mesh>
        <mesh position={offsetVec ? [offsetVec.x * 1.2, 0, offsetVec.z * 1.2] : [0,0,0]} geometry={geometry}>{material}</mesh>
        <mesh position={offsetVec ? [-offsetVec.x * 1.2, 0, -offsetVec.z * 1.2] : [0,0,0]} geometry={geometry}>{material}</mesh>
      </group>
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

const BondAngleArc = ({ centerPos, posA, posB, arcRadius, angleRad, override, isSelected }) => {
    const meshRef = useRef();

    const actualPosA = override?.swapVectors ? posB : posA;
    const actualPosB = override?.swapVectors ? posA : posB;
    const actualRadius = override?.arcRadius ? parseFloat(override.arcRadius) : arcRadius;
    const angleDeg = ((override?.majorAngle ? (2 * Math.PI - angleRad) : angleRad) * 180 / Math.PI).toFixed(1);
    const actualAngleRad = override?.majorAngle ? (2 * Math.PI - angleRad) : angleRad;

    const bondVectorA = new Vector3().subVectors(actualPosA, centerPos).normalize();
    const bondVectorB = new Vector3().subVectors(actualPosB, centerPos).normalize();
    let normalVector = new Vector3().crossVectors(bondVectorA, bondVectorB);
    
    // Protect against collinear vectors (180 or 0 degree angles) yielding zero cross product length
    if (normalVector.lengthSq() < 1e-6) {
        // Fallback: pick an arbitrary perpendicular vector.
        const up = new Vector3(0, 1, 0);
        if (Math.abs(bondVectorA.y) > 0.99) up.set(1, 0, 0); // avoid collinearity with up
        normalVector.crossVectors(bondVectorA, up);
    }
    normalVector.normalize();
    
    if (override?.invertNormal) {
        normalVector.negate();
    }
    
    const quaternion = new Quaternion();
    const zAxis = new Vector3(0, 0, 1); 
    quaternion.setFromUnitVectors(zAxis, normalVector); 

    useLayoutEffect(() => {
        if (meshRef.current) {
            // Apply base position
            let finalPos = centerPos.clone();
            if (override?.posX) finalPos.x += parseFloat(override.posX);
            if (override?.posY) finalPos.y += parseFloat(override.posY);
            if (override?.posZ) finalPos.z += parseFloat(override.posZ);
            
            meshRef.current.position.copy(finalPos); 

            // Base rotation to align with the bond plane
            meshRef.current.setRotationFromQuaternion(quaternion); 
            const localVectorA = bondVectorA.clone().applyQuaternion(quaternion.clone().invert());
            const angleOffset = Math.atan2(localVectorA.y, localVectorA.x);
            meshRef.current.rotation.z = angleOffset; 

            // Apply manual visual overrides
            if (override?.rotX) meshRef.current.rotation.x += parseFloat(override.rotX) * Math.PI / 180;
            if (override?.rotY) meshRef.current.rotation.y += parseFloat(override.rotY) * Math.PI / 180;
            if (override?.rotZ) meshRef.current.rotation.z += parseFloat(override.rotZ) * Math.PI / 180;

            meshRef.current.updateMatrixWorld();
        }
    }, [centerPos, actualPosA, actualPosB, actualAngleRad, quaternion, override]);

    // Local position of the label (midpoint of the torus arc)
    const midAngle = actualAngleRad / 2;
    const labelX = (actualRadius + 0.3) * Math.cos(midAngle);
    const labelY = (actualRadius + 0.3) * Math.sin(midAngle);

    // Arc is cyan (bright) only while actively selected for editing; all others stay yellow
    const arcColor = isSelected ? '#00ffff' : '#FFFF00';
    const labelClass = `text-sm font-bold pointer-events-none ${isSelected ? 'text-cyan-300' : 'text-yellow-300'}`;

    return (
        <> 
            <mesh ref={meshRef}>
                <torusGeometry args={[actualRadius, ARC_THICKNESS, 16, 100, actualAngleRad]} />
                <meshStandardMaterial color={arcColor} side={2} /> 
                <Html position={[labelX, labelY, 0]} center>
                    <div className={labelClass}>
                        {angleDeg}°
                    </div>
                </Html>
            </mesh>
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

const Molecule3DModel = ({ structure, onElementsUsedChange, highlightedGroup, onAtomSelect, angleOverrides, forceShowAngles, enableAutoRotate = true, selectedAngleKey = null }) => { 
    const [showBondLength, setShowBondLength] = useState(false);
    const [showBondAngle, setShowBondAngle] = useState(false);
    const [showLonePairs, setShowLonePairs] = useState(false);
    
    // Force show angles if overriden
    const effectiveShowBondAngle = forceShowAngles || showBondAngle;
    
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
        if (!effectiveShowBondAngle) return []; 
        
        const arcs = [];
        const atomsCount = structure.atoms.length;

        for (let c = 0; c < atomsCount; c++) {
            const centerPos = atomPositions[c];
            const connectedBonds = structure.bonds.filter(b => b.a === c || b.b === c);
            
            const neighbors = connectedBonds
                .map(bond => {
                    const neighborId = bond.a === c ? bond.b : bond.a;
                    return { id: neighborId, pos: atomPositions[neighborId] };
                })
                .filter(n => n.pos !== undefined); // guard against out-of-range bond refs
            
            for (let i = 0; i < neighbors.length; i++) {
                for (let j = i + 1; j < neighbors.length; j++) {
                    const neighborA = neighbors[i];
                    const neighborB = neighbors[j];
                    if (!neighborA.pos || !neighborB.pos) continue; // extra safety

                    const angleKey = `${c}-${Math.min(neighborA.id, neighborB.id)}-${Math.max(neighborA.id, neighborB.id)}`;
                    const override = angleOverrides?.[angleKey] || null;

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
                            override={override}
                            isSelected={selectedAngleKey === angleKey}
                        />
                    );
                }
            }
        }
        return arcs;
    }, [effectiveShowBondAngle, structure, atomPositions, angleOverrides]);

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
                <Suspense fallback={null}>
                    <Environment preset="city" />
                </Suspense>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 10]} intensity={1.4} />
                <directionalLight position={[-8, 6, -8]} intensity={0.5} />
                <pointLight position={[0, 8, 4]} intensity={0.8} />
                
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
                            colorStart={isHighlighted ? '#00ffff' : '#ffffff'}
                            colorEnd={isHighlighted ? '#00ffff' : '#ffffff'}
                            order={bond.order || 1}
                        />
                    );
                })}

                {lonePairs.map((lp, index) => {
                    const atom = structure.atoms[lp.atomIndex];
                    if (!atom) return null;
                    const atomCenter = new Vector3(atom.x, atom.y, atom.z);
                    return (
                        <LonePairOrbital
                            key={`lp-${index}`}
                            atomCenter={atomCenter}
                            lpPos={lp.pos}
                        />
                    );
                })}

                {bondAngleArcs} 

                <OrbitControls 
                    enableZoom={true} 
                    enablePan={true}
                    mouseButtons={{ LEFT: 0, MIDDLE: 1, RIGHT: 2 }}
                    autoRotate={enableAutoRotate && !hasHighlight} 
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

    const getFullName = (symbol) => {
        return getElementData(symbol).name || symbol;
    };

    return (
        <div className="absolute bottom-4 left-4 bg-gray-700 bg-opacity-80 p-3 rounded-lg text-xs shadow-xl text-white pointer-events-auto z-10 border border-cyan-800">
            <h4 className="font-bold border-b border-gray-600 mb-2 pb-1 text-cyan-300">Atom Legend</h4>
            <ul className="space-y-1">
                {elementsUsed.map((symbol) => (
                    <li key={symbol} className="flex items-center space-x-2">
                        <span 
                            style={{ 
                                backgroundColor: getElementData(symbol).color, 
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