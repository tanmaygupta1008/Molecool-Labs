'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Tube } from '@react-three/drei';

/**
 * Animated straight arrow for Inductive Effect floating alongside a bond.
 * Uses camera vector cross-products to always stay visible on the side of the bond.
 */
export const AnimatedInductiveArrow = ({ startPos, endPos, isPositive, magnitude = 1 }) => {
    const groupRef = useRef();
    const arrowRefs = useRef([]);
    
    const direction = useMemo(() => new THREE.Vector3().subVectors(endPos, startPos).normalize(), [startPos, endPos]);
    const length = useMemo(() => startPos.distanceTo(endPos), [startPos, endPos]);
    const midPoint = useMemo(() => new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5), [startPos, endPos]);
    const alignQuaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction), [direction]);
    
    const color = '#ffffff';
    const thickness = 0.05; 
    const arrowHeadLength = 0.25;
    const numArrows = 3;

    // Pre-allocate scratch vectors OUTSIDE useFrame to avoid GC pressure (context loss fix)
    const _cameraDir = useMemo(() => new THREE.Vector3(), []);
    const _ortho = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        if (groupRef.current) {
            const clampedMag = Math.max(0.05, Math.min(magnitude * 1.5, 1.2));
            const baseSpeed = 0.4;
            const variableSpeed = magnitude * 1.2;
            const speed = baseSpeed + variableSpeed;
            const time = state.clock.elapsedTime * speed;
            
            arrowRefs.current.forEach((mesh, index) => {
                if (mesh) {
                    const t = (time + index / numArrows) % 1.0; 
                    const travelDistance = length * 0.85;
                    mesh.position.y = (t - 0.5) * travelDistance;
                    
                    const edgeFade = Math.sin(t * Math.PI); 
                    const curvedFade = Math.pow(edgeFade, 0.8);
                    
                    const opacity = curvedFade * clampedMag * 0.8; 
                    const intensity = (1.0 + curvedFade * 2.0) * (clampedMag * 1.8); 
                    
                    if(mesh.material) {
                        mesh.material.opacity = opacity;
                        mesh.material.emissiveIntensity = intensity;
                    }
                }
            });

            // Reuse pre-allocated vectors — no 'new' allowed inside useFrame
            state.camera.getWorldDirection(_cameraDir);
            _ortho.crossVectors(direction, _cameraDir).normalize().multiplyScalar(0.15);
            groupRef.current.position.copy(midPoint).add(_ortho);
        }
    });

    return (
        <group ref={groupRef} position={midPoint.toArray()} quaternion={alignQuaternion}>
            {Array.from({ length: numArrows }).map((_, i) => (
                <mesh 
                    key={`ind-ant-${i}`} 
                    ref={el => arrowRefs.current[i] = el}
                >
                    <coneGeometry args={[thickness * 2.0, arrowHeadLength, 12]} />
                    <meshStandardMaterial color={color} transparent opacity={0.0} emissive={color} emissiveIntensity={0.0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Capsule/Tube connecting a set of atoms to represent a delocalized pi-system
 */
export const ResonanceCloud = ({ atomPositions, bondPairs }) => {
    // Render a thick, semi-transparent tube for every bond in the delocalized system
    return (
        <group>
            {bondPairs.map((pair, idx) => {
                const p1 = atomPositions[pair[0]];
                const p2 = atomPositions[pair[1]];
                if(!p1 || !p2) return null;

                const path = new THREE.LineCurve3(p1, p2);
                return (
                    <mesh key={`cloud-${idx}`}>
                        <tubeGeometry args={[path, 8, 0.25, 8, false]} />
                        <meshPhysicalMaterial 
                            color="#aa22ff" 
                            transparent 
                            opacity={0.3} 
                            roughness={0.1}
                            transmission={0.9}
                            thickness={0.5}
                            emissive="#aa22ff"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

/**
 * Animated curved arrow showing electron pushing (Mesomeric effect)
 */
export const CurvedPushingArrow = ({ startPos, endPos, controlPointOffset = 0.8, color = "#a855f7" }) => {
    const groupRef = useRef();
    const materialRef = useRef();

    const curve = useMemo(() => {
        // Create an arc between start and end
        const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        // Orthogonal vector for the curve
        const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        // Just pick an arbitrary "up" that isn't parallel to dir
        let up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.y) > 0.9) up.set(1, 0, 0);
        const ortho = new THREE.Vector3().crossVectors(dir, up).normalize();
        
        const controlPoint = midPoint.clone().add(ortho.multiplyScalar(controlPointOffset));
        return new THREE.QuadraticBezierCurve3(startPos, controlPoint, endPos);
    }, [startPos, endPos, controlPointOffset]);

    const points = useMemo(() => curve.getPoints(20), [curve]);

    useFrame((state) => {
        if (groupRef.current) {
            const timeOffset = (state.clock.elapsedTime * 0.5) % 1.0; 
            
            // Position the arrowhead along the curve
            const currentPoint = curve.getPoint(timeOffset);
            // Look ahead for tangent
            const nextPoint = curve.getPoint(Math.min(1.0, timeOffset + 0.01));
            
            groupRef.current.position.copy(currentPoint);
            
            const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint);
            if (direction.lengthSq() > 0.0001) {
                direction.normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
                groupRef.current.quaternion.copy(quaternion);
            }
        }
    });

    return (
        <group>
            {/* The trail (curved line) */}
            <Line points={points} color={color} lineWidth={2} transparent opacity={0.4} />
            
            {/* The moving arrowhead */}
            <group ref={groupRef}>
                <mesh position={[0, 0, 0]}>
                    <coneGeometry args={[0.1, 0.25, 8]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </group>
        </group>
    );
};
