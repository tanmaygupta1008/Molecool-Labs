// src/components/DNAModel.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Tube } from '@react-three/drei';
import * as THREE from 'three';

const DNAModel = ({ sequence = "ATGC", radius = 2.5, heightMultiplier = 1.2, twist = Math.PI * 8, speed = 0.3, searchMotif = "", parentOrigins = [], onMutate }) => {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speed * delta;
      
      // Subtle organic breathing effect
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.5;
    }
  });

  const baseColors = {
    A: '#2ECC71', // Adenine (Bright Green)
    T: '#E74C3C', // Thymine (Bright Red)
    C: '#3498DB', // Cytosine (Bright Blue)
    G: '#F39C12', // Guanine (Orange/Yellow)
  };

  const getPairsFromBase = (base) => {
    switch(base.toUpperCase()) {
      case 'A': return [baseColors.A, baseColors.T];
      case 'T': return [baseColors.T, baseColors.A];
      case 'G': return [baseColors.G, baseColors.C];
      case 'C': return [baseColors.C, baseColors.G];
      default: return [baseColors.A, baseColors.T]; // fallback
    }
  };

  const numPairs = sequence.length;
  const totalHeight = numPairs * heightMultiplier;

  // Find all indices that are part of the highlighted motif
  const getMotifIndices = () => {
    const indices = new Set();
    if (!searchMotif || searchMotif.length === 0) return indices;
    
    const upperSeq = sequence.toUpperCase();
    const upperMotif = searchMotif.toUpperCase();
    
    let index = upperSeq.indexOf(upperMotif);
    while (index !== -1) {
      for (let j = 0; j < upperMotif.length; j++) {
        indices.add(index + j);
      }
      index = upperSeq.indexOf(upperMotif, index + 1);
    }
    return indices;
  };

  const motifIndices = useMemo(() => getMotifIndices(), [sequence, searchMotif]);

  // Generate continuous backbone curves
  const curvePoints1 = [];
  const curvePoints2 = [];

  for (let i = 0; i < numPairs; i++) {
    const t = numPairs > 1 ? i / (numPairs - 1) : 0;
    const y = -totalHeight / 2 + t * totalHeight;
    const angle = t * twist;

    curvePoints1.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    curvePoints2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius));
  }

  // Create smooth splines from the points
  const backboneCurve1 = new THREE.CatmullRomCurve3(curvePoints1);
  const backboneCurve2 = new THREE.CatmullRomCurve3(curvePoints2);

  // Reusable materials for a high-end glass/plastic aesthetic
  const backboneMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.8, // glass-like
    thickness: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const baseMaterialTemplate = {
    roughness: 0.2,
    metalness: 0.3,
    transmission: 0.2,
    thickness: 0.5,
    clearcoat: 0.8,
  };

  const pairs = [];
  for (let i = 0; i < numPairs; i++) {
    const t = numPairs > 1 ? i / (numPairs - 1) : 0;
    const y = -totalHeight / 2 + t * totalHeight;
    const angle = t * twist;

    const [color1, color2] = getPairsFromBase(sequence[i]);
    const origin = parentOrigins[i];
    
    // Override colors for genetics mode (Cyan for Parent A, Magenta for Parent B)
    const isHighlighted = searchMotif.length > 0 ? motifIndices.has(i) : true;
    const opacity = isHighlighted ? 1.0 : 0.15;
    
    let emissiveColor1 = origin ? (origin === 'A' ? '#00ffff' : '#ff00ff') : color1;
    let emissiveColor2 = origin ? (origin === 'A' ? '#00ffff' : '#ff00ff') : color2;
    let finalColor1 = origin ? emissiveColor1 : color1;
    let finalColor2 = origin ? emissiveColor2 : color2;
    let emissiveInt1 = origin ? 1.5 : (isHighlighted && searchMotif ? 2.0 : 0.2);
    let emissiveInt2 = origin ? 1.5 : (isHighlighted && searchMotif ? 2.0 : 0.2);

    pairs.push(
      <group key={`pair-${i}`} position={[0, y, 0]} rotation={[0, -angle, 0]}>
        
        {/* Right Base */}
        <Cylinder 
          args={[0.2, 0.2, radius - 0.2, 16]} 
          position={[radius / 2, 0, 0]} 
          rotation={[0, 0, Math.PI / 2]}
          onClick={(e) => { e.stopPropagation(); if (onMutate) onMutate(i); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
        >
          <meshPhysicalMaterial 
            {...baseMaterialTemplate}
            color={finalColor1} 
            emissive={emissiveColor1}
            emissiveIntensity={emissiveInt1}
            transparent 
            opacity={Math.max(opacity, 0.2)} 
          />
        </Cylinder>
        
        {/* Left Base */}
        <Cylinder 
          args={[0.2, 0.2, radius - 0.2, 16]} 
          position={[-radius / 2, 0, 0]} 
          rotation={[0, 0, Math.PI / 2]}
          onClick={(e) => { e.stopPropagation(); if (onMutate) onMutate(i); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
        >
          <meshPhysicalMaterial 
             {...baseMaterialTemplate}
             color={finalColor2} 
             emissive={emissiveColor2}
             emissiveIntensity={emissiveInt2}
             transparent 
             opacity={Math.max(opacity, 0.2)} 
          />
        </Cylinder>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Continuous Spline Backbones */}
      {numPairs > 1 && (
        <>
          <Tube args={[backboneCurve1, numPairs * 4, 0.4, 8, false]}>
            <primitive object={backboneMaterial} attach="material" />
          </Tube>
          <Tube args={[backboneCurve2, numPairs * 4, 0.4, 8, false]}>
            <primitive object={backboneMaterial} attach="material" />
          </Tube>
        </>
      )}
      {/* Individual Base Pairs */}
      {pairs}
    </group>
  );
};

export default DNAModel;
