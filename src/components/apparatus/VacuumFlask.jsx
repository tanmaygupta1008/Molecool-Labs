import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Cylinder } from '@react-three/drei';

const VacuumFlask = (props) => {
    // The sideArmType can be 'glass' (simple tube) or 'plastic' (red rugged nozzle)
    const { sideArmType = 'plastic', isHeating, ...rest } = props;

    // Conical shape identical to ConicalFlask
    const points = useMemo(() => {
        const p = [];
        const baseRadius = 1.0;
        const neckRadius = 0.35;
        const height = 2.5;
        const neckStart = 1.8;

        p.push(new THREE.Vector2(0, 0));
        p.push(new THREE.Vector2(baseRadius, 0));
        p.push(new THREE.Vector2(baseRadius, 0.15)); // robust heavy base
        p.push(new THREE.Vector2(neckRadius, neckStart));
        p.push(new THREE.Vector2(neckRadius, height));
        p.push(new THREE.Vector2(neckRadius + 0.15, height + 0.15)); // thick rim
        p.push(new THREE.Vector2(neckRadius, height + 0.15));

        return p;
    }, []);

    const renderSideArm = () => {
        const startX = 0.35;
        const startY = 2.15; // Upper part of the neck

        if (sideArmType === 'glass') {
            return (
                <group position={[startX + 0.3, startY, 0]}>
                    <Cylinder args={[0.08, 0.08, 0.6, 16, 1, true]} position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.3} transparent roughness={0} depthWrite={false} side={THREE.DoubleSide} />
                    </Cylinder>
                    {/* slight downward bend at tip */}
                    <Cylinder args={[0.08, 0.06, 0.3, 16, 1, true]} position={[0.35, -0.1, 0]} rotation={[0, 0, -Math.PI / 3]}>
                        <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.3} transparent roughness={0} depthWrite={false} side={THREE.DoubleSide} />
                    </Cylinder>
                </group>
            );
        }

        // 'plastic' rugged adapter from image
        const bendAngle = -Math.PI / 1.5; // -120 degrees (points right and down)
        const dirX = -Math.sin(bendAngle); // ~0.866
        const dirY = Math.cos(bendAngle);  // -0.5

        return (
            <group position={[startX, startY, 0]}>
                {/* Clear glass thick nozzle base */}
                <Cylinder args={[0.15, 0.15, 0.2, 16, 1, true]} position={[0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.3} transparent roughness={0} depthWrite={false} side={THREE.DoubleSide} />
                </Cylinder>
                
                {/* Red ribbed screw cap */}
                <Cylinder args={[0.25, 0.25, 0.3, 24]} position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <meshStandardMaterial color="#c00000" roughness={0.6} metalness={0.1} />
                </Cylinder>
                
                {/* Straight white plastic barb fitting (base) */}
                <Cylinder args={[0.08, 0.08, 0.4, 16]} position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.4} />
                </Cylinder>
                
                {/* Angled white plastic barb fitting (tip) */}
                {/* Attaches exactly at straight part's end (X=0.8, Y=0). Length=0.4. */}
                {/* Cylinder center is offset 0.2 along the angle direction from (0.8, 0) */}
                <Cylinder args={[0.08, 0.06, 0.4, 16]} position={[0.8 + 0.2 * dirX, 0.2 * dirY, 0]} rotation={[0, 0, bendAngle]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.4} />
                </Cylinder>

                {/* Ribs on barb, spaced along the angled tip */}
                <Cylinder args={[0.11, 0.08, 0.05, 16]} position={[0.8 + 0.25 * dirX, 0.25 * dirY, 0]} rotation={[0, 0, bendAngle]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.4} />
                </Cylinder>
                <Cylinder args={[0.11, 0.08, 0.05, 16]} position={[0.8 + 0.35 * dirX, 0.35 * dirY, 0]} rotation={[0, 0, bendAngle]}>
                    <meshStandardMaterial color="#eeeeee" roughness={0.4} />
                </Cylinder>
            </group>
        );
    };

    return (
        <group {...rest}>
            <mesh position={[0, 0, 0]}>
                <latheGeometry args={[points, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.2} // Thicker glass for vacuum application
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {isHeating && (
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[1.0, 1.0, 0.2, 32]} />
                    <meshBasicMaterial color="#ff4400" transparent opacity={0.3} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
            )}

            {renderSideArm()}
        </group>
    );
};

export default VacuumFlask;
