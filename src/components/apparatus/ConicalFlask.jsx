import React, { useMemo } from 'react';
import * as THREE from 'three';

const ConicalFlask = (props) => {
    const points = useMemo(() => {
        const p = [];
        // Profile of a conical flask (Erlenmeyer)
        // Starting from bottom center (0,0) -> outward to radius -> up taper -> neck
        // Actually LatheGeometry spins around Y. So we define x,y points.

        // 1. Base (flat bottom)
        // p.push(new THREE.Vector2(0, 0)); // Center
        // For a hollow object, we usually use double side material or construct thickness. 
        // But standard Lathe is a surface.

        // Let's draw the OUTER profile.
        // Base radius ~1.0

        const baseRadius = 1.0;
        const neckRadius = 0.35;
        const height = 2.5;
        const neckStart = 1.8;

        // Bottom edge
        p.push(new THREE.Vector2(0, 0));
        p.push(new THREE.Vector2(baseRadius, 0));

        // Rounded corner at base (optional, keeping it simple for now or adding a small chamfer)
        p.push(new THREE.Vector2(baseRadius, 0.1));

        // Tapered body up to neck
        p.push(new THREE.Vector2(neckRadius, neckStart));

        // Neck
        p.push(new THREE.Vector2(neckRadius, height));

        // Flared Rim
        p.push(new THREE.Vector2(neckRadius + 0.1, height + 0.1));
        p.push(new THREE.Vector2(neckRadius, height + 0.1)); // Inner rim lip

        return p;
    }, []);

    return (
        <group {...props}>
            <mesh position={[0, 0, 0]}>
                {/* Lathe Geometry: points, segments */}
                <latheGeometry args={[points, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide} // Important to see inside and outside
                    depthWrite={false} // Ensure internal liquids/bubbles are visible
                />
            </mesh>

            {/* Thermal Glow Overlay (Base Heating) */}
            {props.isHeating && (
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
                    <meshBasicMaterial
                        color="#ff4400"
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Liquid inside (optional, simplified cone) for realism? 
          User didn't ask for liquid but it helps the look. Leaving empty for now as per "apparatus" focus.
      */}

        </group>
    );
};

export default ConicalFlask;
