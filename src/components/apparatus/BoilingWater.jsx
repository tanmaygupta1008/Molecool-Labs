import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

const Bubbles = ({ count = 30, height = 1, radius = 0.5, isBoiling = false, shape = 'cylinder' }) => {
    const bubblesRef = useRef();

    // Initial random positions
    // We'll store data in a plain array of objects to update in useFrame
    // { x, y, z, speed, scale, offset }
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            if (shape === 'sphere') {
                // Spherical distribution
                const r = Math.random() * radius;
                const theta = Math.random() * Math.PI * 2;
                // Height in sphere is -radius to +radius usually, but here 'height' is passed.
                // For RBF water, height is roughly 2*radiusBottom * fillPercentage.
                // Let's just spawn properly within the volume.
                return {
                    x: r * Math.cos(theta),
                    y: Math.random() * height * 0.8, // Reduced height for sphere to keep inside
                    z: r * Math.sin(theta),
                    speed: 0.5 + Math.random() * 1.5,
                    scale: 0.2 + Math.random() * 0.5,
                    offset: Math.random() * 100
                };
            } else {
                // Cylinder distribution
                return {
                    x: (Math.random() - 0.5) * radius * 1.5,
                    y: Math.random() * height,
                    z: (Math.random() - 0.5) * radius * 1.5,
                    speed: 0.5 + Math.random() * 1.5,
                    scale: 0.2 + Math.random() * 0.5,
                    offset: Math.random() * 100
                };
            }
        });
    }, [count, radius, height, shape]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!bubblesRef.current) return;

        // If not boiling, hide all bubbles or stop animating?
        // Let's iterate and update
        particles.forEach((particle, i) => {
            if (isBoiling) {
                // Convection Logic: Bubbles rise faster in the center (hotter)
                const r = Math.sqrt(particle.x * particle.x + particle.z * particle.z);
                const maxR = radius;
                const centerBias = 1.0 + (1.0 - Math.min(r / maxR, 1.0)) * 2.0; // Up to 3x speed at center

                // Move up
                particle.y += particle.speed * centerBias * delta;

                // Wiggle
                const t = state.clock.elapsedTime + particle.offset;
                particle.x += Math.sin(t * 5) * 0.002;
                particle.z += Math.cos(t * 3) * 0.002;

                // Reset if reached top
                if (particle.y > height) {
                    particle.y = 0;
                    if (shape === 'sphere') {
                        const r = Math.random() * radius;
                        const theta = Math.random() * Math.PI * 2;
                        particle.x = r * Math.cos(theta);
                        particle.z = r * Math.sin(theta);
                    } else {
                        particle.x = (Math.random() - 0.5) * radius * 1.5;
                        particle.z = (Math.random() - 0.5) * radius * 1.5;
                    }
                }
            } else {
                // If stopped, maybe shrink bubbles to 0 or reset to bottom?
                // For now, let's just let them rise to top and disappear
                if (particle.y <= height) {
                    particle.y += particle.speed * delta * 0.5; // Slow rise residual
                }
                if (particle.y > height) {
                    particle.scale = 0; // Hide
                }
            }

            // Update Instance Matrix
            dummy.position.set(particle.x, particle.y, particle.z);

            // Scale bubble based on height (grow as they rise)
            // And if not boiling, shrink.
            const currentScale = isBoiling ?
                (particle.scale * (0.5 + 0.5 * (particle.y / height))) : // Grow up to 1x
                (particle.y > height ? 0 : particle.scale * (1 - particle.y / height)); // Shrink if stopping

            dummy.scale.setScalar(currentScale * 0.05); // Base size factor
            dummy.updateMatrix();
            bubblesRef.current.setMatrixAt(i, dummy.matrix);
        });
        bubblesRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={bubblesRef} args={[null, null, count]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
                color="#ffffff"
            />
        </instancedMesh>
    );
};

const SurfaceBubbles = ({ count = 20, radius = 0.5, isBoiling = false, bubbleScale = 1.0, shape = 'cylinder' }) => {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // { x, z, scale, growthSpeed }
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => {
            const r = Math.sqrt(Math.random()) * radius * 0.9;
            const theta = Math.random() * Math.PI * 2;
            return {
                x: r * Math.cos(theta),
                z: r * Math.sin(theta),
                scale: Math.random() * bubbleScale, // Apply bubbleScale here
                maxScale: (0.5 + Math.random() * 0.5) * bubbleScale, // And here properly
                growthSpeed: (1.0 + Math.random() * 2.0) * bubbleScale // Maybe slower growth if smaller? Or same speed.
            };
        });
    }, [count, radius, bubbleScale]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        particles.forEach((p, i) => {
            if (isBoiling) {
                p.scale += p.growthSpeed * delta;
                if (p.scale > p.maxScale) {
                    // Burst! Reset.
                    p.scale = 0;
                    const r = Math.sqrt(Math.random()) * radius * 0.9;
                    const theta = Math.random() * Math.PI * 2;
                    p.x = r * Math.cos(theta);
                    p.z = r * Math.sin(theta);
                    // Reset growth logic
                    p.growthSpeed = (1.0 + Math.random() * 2.0) * bubbleScale;
                    p.maxScale = (0.5 + Math.random() * 0.5) * bubbleScale;
                }
            } else {
                p.scale = Math.max(0, p.scale - delta * 2);
            }
            // ...

            dummy.position.set(p.x, 0, p.z);
            dummy.scale.setScalar(p.scale * 0.15); // Adjust base size
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]} renderOrder={shape === 'cylinder' ? 5 : 1}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
                color="white"
                roughness={0.0}
                metalness={0.1}
                transparent
                opacity={0.6}
                depthWrite={false} // Prevent self-occlusion artifacts and sorting issues
            />
        </instancedMesh>
    );
};

const BoilingWater = ({
    radiusTop = 0.75,
    radiusBottom = 0.75,
    height = 1,
    isBoiling = false,
    color = "#00aaff",
    shape = 'cylinder', // 'cylinder' | 'sphere'
    fillPercentage = 1.0, // Used for sphere clip: 0 to 1
    bubbleScale = 1.0, // Default 1.0
    ...props
}) => {
    const sphereSurfaceRadius = shape === 'sphere'
        ? radiusBottom * Math.sin((fillPercentage * 0.7 + 0.3) * Math.PI)
        : radiusTop;

    return (
        <group {...props}>
            {/* Liquid Bulk */}
            {/* Height is full height. Position y needs to be height/2 if originating from bottom 0? */}
            {/* Usually primitive geometries are centered. Caller passes position to center it. */}
            {/* We assume local coordinate system: y=0 is bottom? No, cylinder is centered at 0. */}
            {/* Let's align Bottom to y=0 inside this component for easier bubble logic */}

            {shape === 'cylinder' ? (
                <group position={[0, height / 2, 0]}>
                    <mesh>
                        <cylinderGeometry args={[radiusTop, radiusBottom, height, 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            transmission={0.95}
                            thickness={1.5}
                            roughness={0.1}
                            ior={1.33}
                            transparent={true}
                            opacity={0.8}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            ) : (
                // SPHERE shape (for RBF)
                <group position={[0, radiusBottom, 0]}>
                    <mesh rotation={[Math.PI, 0, 0]}>
                        {/* Radius roughly height if full, or use radius prop */}
                        <sphereGeometry args={[radiusBottom, 32, 16, 0, Math.PI * 2, 0, (fillPercentage * 0.7 + 0.3) * Math.PI]} />
                        <meshPhysicalMaterial
                            color={color}
                            transmission={0.95}
                            thickness={1.5}
                            roughness={0.1}
                            ior={1.33}
                            transparent={true}
                            opacity={0.8}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {/* Surface Cap */}
                    <mesh position={[0, -radiusBottom * Math.cos((fillPercentage * 0.7 + 0.3) * Math.PI), 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[radiusBottom * Math.sin((fillPercentage * 0.7 + 0.3) * Math.PI), 32]} />
                        <meshPhysicalMaterial
                            color={color}
                            transmission={0.95}
                            roughness={0.1}
                            transparent
                            opacity={0.8}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            )}

            {/* Bubbles - Positioned at bottom relative to this group */}
            <group position={[0, 0, 0]}>
                <Bubbles
                    count={isBoiling ? 150 : 20}
                    height={height}
                    radius={(radiusTop + radiusBottom) / 2 * 0.8}
                    isBoiling={isBoiling}
                    shape={shape}
                />
            </group>

            {/* Surface Agitation / Foam */}
            {isBoiling && (
                <group position={[0, height, 0]}>
                    {shape === 'cylinder' ? (
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0, radiusTop, 32]} />
                            <meshStandardMaterial
                                color="white"
                                transparent
                                opacity={0.3}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    ) : (
                        // Sphere foam
                        // Sphere center is at y=radiusBottom.
                        // Surface is at y = radiusBottom - radiusBottom * cos(angle)
                        // This group is at y=height.
                        // So mesh pos = (radiusBottom - radiusBottom * Math.cos(...)) - height
                        <mesh position={[0, radiusBottom - radiusBottom * Math.cos((fillPercentage * 0.7 + 0.3) * Math.PI) - height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0, radiusBottom * Math.sin((fillPercentage * 0.7 + 0.3) * Math.PI), 32]} />
                            <meshStandardMaterial
                                color="white"
                                transparent
                                opacity={0.3}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}
                </group>
            )}

            {/* Surface Bubbles - Dynamic bursting effect */}
            {/* Positioned at top surface */}
            {/* Added 0.02 offset to ensure they are above the foam ring */}
            <group position={[0, (shape === 'cylinder' ? height : (radiusBottom - radiusBottom * Math.cos((fillPercentage * 0.7 + 0.3) * Math.PI))) + 0.02, 0]}>
                <SurfaceBubbles
                    count={isBoiling ? 40 : 0}
                    radius={sphereSurfaceRadius}
                    isBoiling={isBoiling}
                    bubbleScale={bubbleScale}
                    shape={shape}
                />
            </group>
        </group>
    );
};

export default BoilingWater;
