import React, { useMemo } from 'react';
import * as THREE from 'three';

const RubberCork = ({ holes = 1, ...props }) => {
    // Defines a hollow, tapered cork profile for 1 hole
    const singleHolePoints = useMemo(() => {
        const p = [];
        const height = 0.4;
        const bottomRadius = 0.2;
        const topRadius = 0.25;
        const holeRadius = 0.05;

        // Inner wall (The Hole)
        p.push(new THREE.Vector2(holeRadius, height));
        p.push(new THREE.Vector2(holeRadius, 0));
        // Bottom Face
        p.push(new THREE.Vector2(bottomRadius, 0));
        // Outer Wall
        p.push(new THREE.Vector2(topRadius, height));
        // Top Face
        p.push(new THREE.Vector2(holeRadius, height));
        return p;
    }, []);

    // Solid cork profile for >1 holes
    const solidPoints = useMemo(() => {
        const p = [];
        const height = 0.4;
        const bottomRadius = 0.2;
        const topRadius = 0.25;

        // Center Axis (Solid)
        p.push(new THREE.Vector2(0, height)); // Top center
        p.push(new THREE.Vector2(0, 0));      // Bottom center
        p.push(new THREE.Vector2(bottomRadius, 0));
        p.push(new THREE.Vector2(topRadius, height));
        p.push(new THREE.Vector2(0, height));
        return p;
    }, []);

    // Hole visual indicators
    const holeVisuals = useMemo(() => {
        if (holes <= 1) return null;
        const visuals = [];
        const offset = 0.1; // Distance from center

        // Arrange holes symmetrically
        if (holes === 2) {
            visuals.push(<mesh position={[-offset, 0.401, 0]} rotation={[Math.PI / 2, 0, 0]} key="h1">
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color="#111" />
            </mesh>);
            visuals.push(<mesh position={[offset, 0.401, 0]} rotation={[Math.PI / 2, 0, 0]} key="h2">
                <circleGeometry args={[0.05, 16]} />
                <meshBasicMaterial color="#111" />
            </mesh>);
        }
        else if (holes === 3) {
            // Triangle
            for (let i = 0; i < 3; i++) {
                const angle = (i * 2 * Math.PI) / 3;
                const x = Math.cos(angle) * offset;
                const z = Math.sin(angle) * offset;
                visuals.push(<mesh position={[x, 0.401, z]} rotation={[Math.PI / 2, 0, 0]} key={`h${i}`}>
                    <circleGeometry args={[0.05, 16]} />
                    <meshBasicMaterial color="#111" />
                </mesh>);
            }
        }

        return visuals;
    }, [holes]);

    return (
        <group {...props}>
            {/* Body */}
            <mesh>
                <latheGeometry args={[holes === 1 ? singleHolePoints : solidPoints, 32]} />
                <meshStandardMaterial color="#d2691e" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>

            {/* Visual Holes for > 1 */}
            {holes > 1 && holeVisuals}
        </group>
    );
};

export default RubberCork;
