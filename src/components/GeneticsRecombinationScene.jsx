import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Tube } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';

// Helper to get base color
const baseColors = {
  A: '#2ECC71',
  T: '#E74C3C',
  C: '#3498DB',
  G: '#F39C12',
};

const getPairsFromBase = (base) => {
  switch(base.toUpperCase()) {
    case 'A': return [baseColors.A, baseColors.T];
    case 'T': return [baseColors.T, baseColors.A];
    case 'G': return [baseColors.G, baseColors.C];
    case 'C': return [baseColors.C, baseColors.G];
    default: return [baseColors.A, baseColors.T];
  }
};

const baseMaterialTemplate = {
  roughness: 0.2,
  metalness: 0.3,
  transmission: 0.2,
  thickness: 0.5,
  clearcoat: 0.8,
  transparent: true,
};

const backboneMaterial = new THREE.MeshPhysicalMaterial({
  color: '#ffffff',
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.8,
  thickness: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  transparent: true
});

const AnimatedCylinder = a(Cylinder);

const SingleStrand = ({ sequence, side, numPairs, heightMultiplier, twist, radius, splitOffset, zOffset, opacitySpan, isFinalChild, parentOrigins, glowProgress }) => {
    const totalHeight = numPairs * heightMultiplier;
    const tubeRef = useRef();

    useFrame(() => {
        if (tubeRef.current && numPairs > 1) {
            const currentTwist = twist.get();
            const curvePoints = [];
            for (let i = 0; i < numPairs; i++) {
                const t = i / (numPairs - 1);
                // Map Y to X to avoid TubeGeometry degenerate tangents along vertical Y axis when untwisted
                const xPos = totalHeight / 2 - t * totalHeight;
                const angle = t * currentTwist + (side === 'left' ? Math.PI : 0);
                const yPos = Math.cos(angle) * radius;
                const zPos = Math.sin(angle) * radius;
                curvePoints.push(new THREE.Vector3(xPos, yPos, zPos));
            }
            if (curvePoints.length >= 2) {
                const curve = new THREE.CatmullRomCurve3(curvePoints);
                const newGeo = new THREE.TubeGeometry(curve, numPairs * 4, 0.4, 8, false);
                if (tubeRef.current.geometry) tubeRef.current.geometry.dispose();
                tubeRef.current.geometry = newGeo;
            }
        }
    });

    return (
      <a.group position-x={splitOffset} position-z={zOffset}>
        {numPairs > 1 && (
            <a.mesh ref={tubeRef} rotation={[0, 0, -Math.PI / 2]}>
                <a.meshPhysicalMaterial 
                    color="#ffffff"
                    roughness={0.1}
                    metalness={0.1}
                    transmission={0.8}
                    thickness={1.5}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                    transparent={true}
                    opacity={opacitySpan} 
                />
            </a.mesh>
        )}
        {Array.from({ length: numPairs }).map((_, i) => {
          const t = numPairs > 1 ? i / (numPairs - 1) : 0;
          const y = -totalHeight / 2 + t * totalHeight;
          const base = sequence && i < sequence.length ? sequence[i] : 'A';
          const [color1, color2] = getPairsFromBase(base);
          const baseColor = side === 'right' ? color1 : color2;
          
          let targetEmissive = baseColor;
          let targetColor = baseColor;
          
          if (isFinalChild && parentOrigins && parentOrigins.length > i) {
              const origin = parentOrigins[i];
              targetEmissive = origin === 'A' ? '#00ffff' : '#ff00ff';
              targetColor = targetEmissive;
          }

          return (
            <a.group key={i} position={[0, y, 0]} rotation-y={twist.to(v => -(t * v) + (side === 'left' ? Math.PI : 0))}>
              <AnimatedCylinder 
                args={[0.2, 0.2, radius - 0.2, 16]} 
                position={[radius / 2, 0, 0]} 
                rotation={[0, 0, Math.PI / 2]}
              >
                <a.meshPhysicalMaterial 
                  {...baseMaterialTemplate}
                  color={glowProgress ? glowProgress.to([0, 1], [baseColor, targetColor]) : baseColor} 
                  emissive={glowProgress ? glowProgress.to([0, 1], [baseColor, targetEmissive]) : baseColor}
                  emissiveIntensity={glowProgress ? glowProgress.to([0, 1], [0.2, 2.5]) : 0.2}
                  opacity={opacitySpan}
                />
              </AnimatedCylinder>
            </a.group>
          );
        })}
      </a.group>
    );
};

export default function GeneticsRecombinationScene({ parentA, parentB, childSequence, parentOrigins, animationTrigger, onAnimationComplete }) {
    const numPairs = childSequence.length || 20;
    const radius = 2.5;
    const heightMultiplier = 1.2;
    const NORMAL_TWIST = Math.PI * 8;

    const [step, setStep] = useState(0);

    useEffect(() => {
        if (animationTrigger > 0) {
            setStep(0);
            let time = 0;
            // Unwind
            setTimeout(() => setStep(1), time += 500);
            // Split
            setTimeout(() => setStep(2), time += 1500);
            // Recombine
            setTimeout(() => setStep(3), time += 2000);
            // Rewind
            setTimeout(() => setStep(4), time += 2000);
            // Glow child colors
            setTimeout(() => setStep(5), time += 2500);
            setTimeout(() => { if (onAnimationComplete) onAnimationComplete(); }, time += 1500);
        }
    }, [animationTrigger]);

    const { twist } = useSpring({
        twist: (step === 0 || step >= 4) ? NORMAL_TWIST : 0,
        config: { mass: 2, tension: 50, friction: 20 }
    });

    const { offsetInnerA, offsetOuterA, offsetInnerB, offsetOuterB, outerOpacity, outerZOffset, glowProgress } = useSpring({
        offsetInnerA: step >= 3 ? 10 : (step >= 2 ? 3 : 0),
        offsetOuterA: step >= 3 ? -10 : (step >= 2 ? -3 : 0),
        offsetInnerB: step >= 3 ? -10 : (step >= 2 ? -3 : 0),
        offsetOuterB: step >= 3 ? 10 : (step >= 2 ? 3 : 0),
        outerOpacity: step >= 3 ? 0 : 0.8,
        outerZOffset: step >= 3 ? -20 : 0,
        glowProgress: step >= 5 ? 1 : 0,
        config: { mass: 2, tension: 40, friction: 14 }
    });

    const groupRef = useRef();
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.2 * delta;
            const time = state.clock.getElapsedTime();
            groupRef.current.position.y = Math.sin(time * 0.5) * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* PARENT A GROUP (Fixed base position -10) */}
            <a.group position={[-10, 0, 0]}>
                <SingleStrand 
                    sequence={parentA} side="left" numPairs={numPairs} 
                    heightMultiplier={heightMultiplier} twist={twist} radius={radius} 
                    splitOffset={offsetOuterA} 
                    zOffset={outerZOffset} opacitySpan={outerOpacity} 
                    isFinalChild={false}
                />
                
                <SingleStrand 
                    // Parent sequence until Recombine phase, then Child sequence
                    sequence={step < 3 ? parentA : childSequence} 
                    side="right" numPairs={numPairs} 
                    heightMultiplier={heightMultiplier} twist={twist} radius={radius} 
                    splitOffset={offsetInnerA} zOffset={0} opacitySpan={1} 
                    isFinalChild={true} parentOrigins={parentOrigins}
                    glowProgress={glowProgress}
                />
            </a.group>

            {/* PARENT B GROUP (Fixed base position +10) */}
            <a.group position={[10, 0, 0]}>
                 <SingleStrand 
                    sequence={step < 3 ? parentB : childSequence} 
                    side="left" numPairs={numPairs} 
                    heightMultiplier={heightMultiplier} twist={twist} radius={radius} 
                    splitOffset={offsetInnerB} zOffset={0} opacitySpan={1} 
                    isFinalChild={true} parentOrigins={parentOrigins}
                    glowProgress={glowProgress}
                />
                <SingleStrand 
                    sequence={parentB} side="right" numPairs={numPairs} 
                    heightMultiplier={heightMultiplier} twist={twist} radius={radius} 
                    splitOffset={offsetOuterB} 
                    zOffset={outerZOffset} opacitySpan={outerOpacity} 
                    isFinalChild={false}
                />
            </a.group>
        </group>
    );
}
