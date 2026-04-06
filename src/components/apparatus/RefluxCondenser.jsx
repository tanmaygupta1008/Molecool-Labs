import React from 'react';
import * as THREE from 'three';
import { Cylinder, Torus, Tube, Sphere } from '@react-three/drei';

const RefluxCondenser = (props) => {

    // ── Inner spiral coil: sits inside the outer jacket
    class CoilCurve extends THREE.Curve {
        getPoint(t, optionalTarget = new THREE.Vector3()) {
            const numTurns = 7;
            const radius = 0.16;   // slightly tighter to allow room
            const height = 2.05;   // coil spans from y=1.9 to y=3.95 (relative to center 2.925, it's +/- 1.025)
            const y = (t * height) - (height / 2);
            
            // Taper to x=0 at bottom, and flare out to x=0.32 at top
            let r = radius;
            const taperLen = 0.05;
            if (t < taperLen) {
                r = radius * (Math.sin((t / taperLen) * Math.PI / 2));
            } else if (t > 1 - taperLen) {
                const prog = (t - (1 - taperLen)) / taperLen;
                r = radius + (0.32 - radius) * Math.sin(prog * Math.PI / 2);
            }
            
            const x = Math.cos(t * Math.PI * 2 * numTurns) * r;
            const z = Math.sin(t * Math.PI * 2 * numTurns) * r;
            return optionalTarget.set(x, y, z);
        }
    }
    const coilCurve = new CoilCurve();

    const GLASS_MAT = (
        <meshPhysicalMaterial
            color="#e8f4ff"
            transmission={0.96}
            opacity={0.25}
            transparent
            roughness={0.02}
            thickness={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
        />
    );

    const FROSTED_MAT = (
        <meshPhysicalMaterial
            color="#d8e8f0"
            transmission={0.5}
            opacity={0.85}
            transparent
            roughness={0.25}
        />
    );

    // Hose connector group — points in +X direction from the outer jacket
    const HoseConnector = ({ position }) => (
        <group position={position}>
            {/* Base tube stub going sideways, starting from x=0.32 */}
            <Cylinder args={[0.08, 0.08, 0.35, 12]} rotation={[0, 0, Math.PI / 2]} position={[0.495, 0, 0]}>
                <meshPhysicalMaterial color="#e8f4ff" transmission={0.9} opacity={0.4} transparent roughness={0.05} side={THREE.DoubleSide} />
            </Cylinder>
            {/* Hose barb ridges (3 ridges, getting wider toward tip) */}
            {[0.45, 0.52, 0.58].map((x, i) => (
                <Cylinder key={i} args={[0.095 + i * 0.005, 0.08, 0.065, 12]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
                    <meshPhysicalMaterial color="#e8f4ff" transmission={0.9} opacity={0.5} transparent roughness={0.05} />
                </Cylinder>
            ))}
        </group>
    );

    return (
        <group {...props}>

            {/* ── TOP GROUND GLASS JOINT (female socket) ── */}
            {/* Flare rim at very top */}
            <Cylinder args={[0.25, 0.23, 0.1, 24]} position={[0, 4.65, 0]}>
                {FROSTED_MAT}
            </Cylinder>
            {/* Main frosted socket */}
            <Cylinder args={[0.23, 0.20, 0.4, 24, 1, true]} position={[0, 4.4, 0]}>
                {FROSTED_MAT}
            </Cylinder>

            {/* ── TOP SHOULDER / TAPER (curve inwards to joint) ── */}
            <Cylinder args={[0.20, 0.32, 0.15, 28, 1, true]} position={[0, 4.125, 0]}>
                {GLASS_MAT}
            </Cylinder>

            {/* ── OUTER JACKET: Main cylindrical cooling column ── */}
            <Cylinder args={[0.32, 0.32, 2.58, 28, 1, true]} position={[0, 2.76, 0]}>
                {GLASS_MAT}
            </Cylinder>

            {/* ── INNER SPIRAL COIL (the condensing element inside) ── */}
            {/* Centered at 2.725. Spans 1.7 to 3.75 */}
            <Tube args={[coilCurve, 120, 0.035, 10, false]} position={[0, 2.725, 0]}>
                <meshPhysicalMaterial
                    color="#a8e8ff"
                    transmission={0.85}
                    opacity={0.65}
                    transparent
                    roughness={0}
                    thickness={0.08}
                    side={THREE.DoubleSide}
                />
            </Tube>

            {/* ── INNER STRAIGHT TUBE ── */}
            {/* Goes upward from bottom of spiral (y=1.7) to lower connector (y=3.2) */}
            <Cylinder args={[0.035, 0.035, 1.5, 10]} position={[0, 2.45, 0]}>
                <meshPhysicalMaterial color="#a8e8ff" transmission={0.85} opacity={0.6} transparent roughness={0} />
            </Cylinder>

            {/* Horizontal bridge connecting central pipe to lower connector at x=0.32 */}
            <Cylinder args={[0.035, 0.035, 0.32, 10]} rotation={[0, 0, Math.PI / 2]} position={[0.16, 3.2, 0]}>
                <meshPhysicalMaterial color="#a8e8ff" transmission={0.85} opacity={0.6} transparent roughness={0} />
            </Cylinder>

            {/* Smooth joint Spheres for crisp corners */}
            <Sphere args={[0.035, 16, 16]} position={[0, 1.7, 0]}>
                <meshPhysicalMaterial color="#a8e8ff" transmission={0.85} opacity={0.6} transparent roughness={0} />
            </Sphere>
            <Sphere args={[0.035, 16, 16]} position={[0, 3.2, 0]}>
                <meshPhysicalMaterial color="#a8e8ff" transmission={0.85} opacity={0.6} transparent roughness={0} />
            </Sphere>

            {/* ── HOSE CONNECTORS (both on the same side, right side = +X) ── */}
            <HoseConnector position={[0, 3.2, 0]} />
            <HoseConnector position={[0, 3.75, 0]} />

            {/* ── BOTTOM BULB EXPANSION ── */}
            {/* Upper half: expanding from jacket to bulb equator */}
            <Cylinder args={[0.32, 0.42, 0.27, 28, 1, true]} position={[0, 1.335, 0]}>
                {GLASS_MAT}
            </Cylinder>
            
            {/* Lower half: tapering from bulb to stem */}
            <Cylinder args={[0.42, 0.16, 0.45, 28, 1, true]} position={[0, 0.975, 0]}>
                {GLASS_MAT}
            </Cylinder>

            {/* ── BOTTOM STEM ── */}
            <Cylinder args={[0.16, 0.16, 0.3, 24, 1, true]} position={[0, 0.6, 0]}>
                {GLASS_MAT}
            </Cylinder>

            {/* ── BOTTOM GROUND GLASS JOINT (male plug) ── */}
            <Cylinder args={[0.17, 0.13, 0.45, 24]} position={[0, 0.225, 0]}>
                {FROSTED_MAT}
            </Cylinder>
            {/* Drip tip */}
            <Cylinder args={[0.13, 0.10, 0.15, 20]} position={[0, -0.075, 0]}>
                {FROSTED_MAT}
            </Cylinder>

        </group>
    );
};

export default RefluxCondenser;
