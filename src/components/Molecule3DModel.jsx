// src/components/Molecule3DModel.jsx
'use client'; 

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sphere, Cylinder, Html } from '@react-three/drei';
import { Vector3, Color, Quaternion, TorusGeometry, MeshBasicMaterial, Euler } from 'three'; 
import { useRef, useLayoutEffect, useState, useMemo } from 'react';

// Radius constants for rendering and calculation
const ATOM_RADIUS = 0.3; 
const ARC_THICKNESS = 0.02;

// Standard CPK colors (Exported for use in the Legend)
export const CPK_COLORS = { 
  C: '#909090', // Carbon: Dark Gray
  H: '#FFFFFF', // Hydrogen: White
  O: '#FF0D0D', // Oxygen: Red
  N: '#3050F8', // Nitrogen: Blue
  P: '#FFA500', // Phosphorus: Orange 
  S: '#FFFF30', // Sulfur: Yellow
};

// ----------------------------------------------------
// --- Helper Functions ---
// ----------------------------------------------------

const getBondAngle = (centerPos, posA, posB) => {
    const vA = new Vector3().subVectors(posA, centerPos).normalize();
    const vB = new Vector3().subVectors(posB, centerPos).normalize();
    const angleRad = vA.angleTo(vB);
    return { 
        angleRad, 
        angleDeg: (angleRad * 180 / Math.PI).toFixed(1),
    };
};

// ----------------------------------------------------
// --- Atom Component (Ball) ---
// ----------------------------------------------------
const Atom = ({ position, element, onHover, id, moleculeStructure }) => {
  const color = new Color(CPK_COLORS[element] || '#FF1493');
  
  const handleHover = (isHovered) => {
    if (isHovered) {
      const metrics = {
        centerAtom: { id, element, position },
        bonds: [],
      };

      const connectedBonds = moleculeStructure.bonds.filter(b => b.a === id || b.b === id);
      
      connectedBonds.forEach(bond => {
        const neighborId = bond.a === id ? bond.b : bond.a;
        const neighborAtom = moleculeStructure.atoms[neighborId];
        const neighborPos = new Vector3(neighborAtom.x, neighborAtom.y, neighborAtom.z);
        const length = position.distanceTo(neighborPos).toFixed(3);
        
        metrics.bonds.push({ 
          neighbor: neighborAtom.element, 
          neighborId: neighborId,
          length, 
          neighborPos,
        });
      });
      
      onHover(metrics);
    } else {
      onHover(null);
    }
  };

  return (
    <Sphere 
        position={position} 
        args={[ATOM_RADIUS, 32, 32]}
        onPointerOver={(e) => { e.stopPropagation(); handleHover(true); }}
        onPointerOut={() => handleHover(false)}
    >
      <meshStandardMaterial color={color} />
    </Sphere>
  );
};

// ----------------------------------------------------
// --- Bond Component (Stick) ---
// ----------------------------------------------------
const Bond = ({ start, end }) => {
  const meshRef = useRef();
  
  const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  const length = start.distanceTo(end);

  const orientation = new Vector3().subVectors(end, start).normalize();
  const quaternion = new Quaternion();
  const upVector = new Vector3(0, 1, 0); 

  quaternion.setFromUnitVectors(upVector, orientation);

  useLayoutEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(midPoint);
      meshRef.current.setRotationFromQuaternion(quaternion);
    }
  }, [midPoint, length]);

  return (
    <Cylinder ref={meshRef} args={[0.1, 0.1, length, 8]}>
      <meshStandardMaterial color="#A0A0A0" />
    </Cylinder>
  );
};


// ----------------------------------------------------
// --- Bond Angle Arc Component ---
// ----------------------------------------------------
// --- Bond Angle Arc Component (FINAL CORRECTED ALIGNMENT) ---
const BondAngleArc = ({ centerPos, posA, posB, arcRadius, angleRad }) => {
    const meshRef = useRef();
    const angleDeg = (angleRad * 180 / Math.PI).toFixed(1);

    // 1. Calculate Vectors and Normal
    const bondVectorA = new Vector3().subVectors(posA, centerPos).normalize();
    const bondVectorB = new Vector3().subVectors(posB, centerPos).normalize();
    const normalVector = new Vector3().crossVectors(bondVectorA, bondVectorB).normalize();
    
    // 2. Create Quaternion to orient the arc's plane (Z-normal -> normalVector)
    const quaternion = new Quaternion();
    const zAxis = new Vector3(0, 0, 1); 
    quaternion.setFromUnitVectors(zAxis, normalVector); 
    
    // 3. Create Torus Geometry (Memoized)
    const geometry = useMemo(() => {
        return new TorusGeometry(arcRadius, ARC_THICKNESS, 16, 100, angleRad); 
    }, [arcRadius, angleRad]);


    // 4. Calculate Angle Label Position (along the average vector, slightly offset)
    const averageVector = new Vector3().addVectors(bondVectorA, bondVectorB).normalize();
    const labelPosition = new Vector3().addVectors(centerPos, averageVector.multiplyScalar(arcRadius + 0.3));


    useLayoutEffect(() => {
        if (meshRef.current) {
            // Apply position and plane rotation
            meshRef.current.position.copy(centerPos); 
            meshRef.current.setRotationFromQuaternion(quaternion); 

            // --- CRITICAL ALIGNMENT FIX ---
            // 1. Project bondVectorA onto the arc's plane (which has Z as its normal in its local space)
            // 2. Rotate the arc mesh so its start (X-axis) aligns with this projected vector.
            
            // To get the local vector A, we must apply the *inverse* rotation to the global vector A
            const localVectorA = bondVectorA.clone().applyQuaternion(quaternion.clone().invert());
            
            // Calculate the angle of localVectorA in the local XY plane (rotation around Z-axis)
            // The arc starts along the local X-axis. We must rotate it to align with localVectorA.
            const angleOffset = Math.atan2(localVectorA.y, localVectorA.x);
            
            // Apply this rotation to the local Z-axis (mesh.rotation.z)
            meshRef.current.rotation.z = angleOffset; 
            
            meshRef.current.updateMatrixWorld();
        }
    }, [centerPos, posA, posB, angleRad, quaternion]); // posB added for completeness


    return (
        <> 
            <mesh ref={meshRef}>
                <primitive object={geometry} />
                <meshBasicMaterial color={'#FFFF00'} side={2} /> 
            </mesh>

            <Html position={labelPosition.toArray()} center>
                <div className="text-sm font-bold text-yellow-300 pointer-events-none">
                    {angleDeg}°
                </div>
            </Html>
        </> 
    );
};


// ----------------------------------------------------
// --- Hover Metrics Label Component (Text Label for Bond Lengths) ---
// ----------------------------------------------------
const MetricsLabel = ({ metrics }) => {
    const { centerAtom, bonds } = metrics;
    
    return (
        <Html position={centerAtom.position.toArray()}> 
            <div className="bg-cyan-800 bg-opacity-90 p-2 rounded-md text-xs text-white shadow-lg pointer-events-none whitespace-nowrap -translate-y-full">
                <p className="font-bold text-lg mb-1">{centerAtom.element}</p>
                {/* Only list bond lengths here */}
                {bonds.map((bond, index) => (
                    <p key={index}>Bond to {bond.neighbor}: {bond.length}Å</p>
                ))}
            </div>
        </Html>
    );
};


// ----------------------------------------------------
// --- Main 3D Molecule Viewer Component ---
// ----------------------------------------------------
const Molecule3DModel = ({ structure, onElementsUsedChange }) => { 
    const [hoverMetrics, setHoverMetrics] = useState(null);

    if (!structure || !structure.atoms || structure.atoms.length === 0) {
        return (
            <div className="h-full w-full bg-gray-900 flex items-center justify-center rounded-lg">
                <p className="text-red-400">Structure data is missing or invalid for this compound.</p>
            </div>
        );
    }

    // Identify unique elements for the legend
    const uniqueElements = Array.from(new Set(structure.atoms.map(a => a.element)));

    useLayoutEffect(() => {
        if (onElementsUsedChange) {
            onElementsUsedChange(uniqueElements);
        }
    }, [structure.atoms.length, onElementsUsedChange]); 


    // Calculate coordinates and center
    const atomPositions = structure.atoms.map(a => new Vector3(a.x, a.y, a.z));
    const centroid = new Vector3();
    atomPositions.forEach(p => centroid.add(p));
    centroid.divideScalar(atomPositions.length);
    const maxDistance = atomPositions.reduce((max, p) => 
        Math.max(max, p.distanceTo(centroid)), 0);
    const boundingSphereRadius = maxDistance;
    const cameraDistance = Math.max(boundingSphereRadius * 4, 8); 

    // --- Dynamic Bond Angle Arc Generation (Unique Angle Type & Dynamic Radius) ---
    const bondAngleArcs = useMemo(() => {
        const arcs = [];
        const addedAngleTypes = new Set(); // Tracks angle types (e.g., O-P-O vs O-P-H)

        if (hoverMetrics && hoverMetrics.bonds.length >= 2) {
            const { centerAtom, bonds } = hoverMetrics;
            
            for (let i = 0; i < bonds.length; i++) {
                for (let j = i + 1; j < bonds.length; j++) {
                    
                    // 1. Create a stable identifier based ONLY on element types (Element-Center-Element)
                    // This ensures only one representative angle for each type is shown.
                    const angleElementTypes = [bonds[i].neighbor, centerAtom.element, bonds[j].neighbor].sort().join('-');
                    const angleTypeId = angleElementTypes;

                    if (!addedAngleTypes.has(angleTypeId)) {
                        addedAngleTypes.add(angleTypeId);
                        
                        // 2. Calculate properties
                        const bondLengthA = centerAtom.position.distanceTo(bonds[i].neighborPos);
                        const bondLengthB = centerAtom.position.distanceTo(bonds[j].neighborPos);
                        const { angleRad } = getBondAngle(centerAtom.position, bonds[i].neighborPos, bonds[j].neighborPos);
                        
                        // 3. Define Arc Radius based on constraints:
                        const shortestBondLength = Math.min(bondLengthA, bondLengthB);
                        
                        // Arc must start outside the central atom's sphere (ATOM_RADIUS)
                        const minSafeRadius = ATOM_RADIUS + 0.1; 
                        
                        // Arc must end before the shortest neighbor atom (ATOM_RADIUS)
                        const maxSafeRadius = shortestBondLength - ATOM_RADIUS - 0.1;

                        let arcRadius = Math.max(minSafeRadius, 0.6); // Default size 0.6
                        arcRadius = Math.min(arcRadius, maxSafeRadius);
                        
                        // Safety check: If the resulting radius is too small (e.g., in a very short bond), skip the arc.
                        if (arcRadius < minSafeRadius) {
                            continue; 
                        }

                        arcs.push(
                            <BondAngleArc
                                key={angleTypeId}
                                centerPos={centerAtom.position}
                                posA={bonds[i].neighborPos}
                                posB={bonds[j].neighborPos}
                                arcRadius={arcRadius} // Dynamic radius
                                angleRad={angleRad}   // Angle in radians
                            />
                        );
                    }
                }
            }
        }
        return arcs;
    }, [hoverMetrics]); 


    return (
        <div className="relative h-full w-full"> 
            <Canvas camera={{ position: [0, 0, cameraDistance], fov: 60 }}>
                <Environment preset="night" />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {/* Render Atoms */}
                {structure.atoms.map((atom, index) => (
                    <Atom 
                        key={index}
                        id={index} 
                        position={atomPositions[index]}
                        element={atom.element}
                        onHover={setHoverMetrics} 
                        moleculeStructure={structure}
                    />
                ))}
                
                {/* Render Bonds */}
                {structure.bonds.map((bond, index) => (
                    <Bond key={index} start={atomPositions[bond.a]} end={atomPositions[bond.b]} />
                ))}

                {/* RENDER BOND ANGLE ARCS */}
                {bondAngleArcs} 

                {/* RENDER HOVER LABEL (Bond Lengths) */}
                {/* {hoverMetrics && <MetricsLabel metrics={hoverMetrics} />} */}

                <OrbitControls 
                    enableZoom={true} 
                    enablePan={false} 
                    autoRotate 
                    autoRotateSpeed={2}
                    target={centroid.toArray()} 
                />
            </Canvas>
        </div>
    );
};

export default Molecule3DModel;


// ----------------------------------------------------
// --- OUTSIDE-OF-CANVAS LEGEND COMPONENT ---
// ----------------------------------------------------
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
        <div className="absolute bottom-4 right-4 bg-gray-700 bg-opacity-80 p-3 rounded-lg text-xs shadow-xl text-white pointer-events-auto z-10">
            <h4 className="font-bold border-b border-gray-600 mb-2 pb-1">Atom Legend</h4>
            <ul className="space-y-1">
                {Object.entries(presentElements).map(([symbol, color]) => (
                    <li key={symbol} className="flex items-center space-x-2">
                        <span 
                            style={{ 
                                backgroundColor: color, 
                                width: '10px', 
                                height: '10px', 
                                borderRadius: '50%',
                                border: symbol === 'H' ? '1px solid #999' : 'none', 
                            }}
                        ></span>
                        <span>{symbol} ({getFullName(symbol)})</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};