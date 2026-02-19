import React from 'react';
import { Box, Cylinder, Sphere, Torus } from '@react-three/drei';

const Clamp = ({ angle = 0, headAngle = 0, size = 1, ...props }) => {
    // === MATERIALS ===
    const chrome = <meshStandardMaterial color="#eeeeee" metalness={0.9} roughness={0.1} />;
    const blackPlastic = <meshStandardMaterial color="#222222" metalness={0.2} roughness={0.5} />;
    const steel = <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.4} />;

    // === ANIMATION LOGIC ===
    // angle: 0 (closed) to 1 (fully open)
    const effectiveAngle = Math.max(0, Math.min(angle, 1));
    const rotationOffset = effectiveAngle * 0.4;

    return (
        <group {...props}>
            {/* === 1. EXTENSION ROD === */}
            <group position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <Cylinder args={[0.04, 0.04, 1.6, 32]}>
                    {chrome}
                </Cylinder>
            </group>

            {/* === 1.5 ATTACHMENT LOOP (The "Loop like structure") === */}
            {/* Positioned at the back end of the rod (x ~ -1.6) */}
            <group position={[-1.65, 0, 0]}>

                {/* Vertical Sleeve/Ring for Retort Stand - Vertical Alignment (Y-axis) */}
                <group>
                    {/* The main vertical cylinder sleeve */}
                    <Cylinder args={[0.08, 0.08, 0.3, 16]}>
                        {chrome}
                    </Cylinder>
                </group>

                {/* The Loop/Ring itself - Flat on XZ plane (Hole points up) */}
                <group rotation={[Math.PI / 2, 0, 0]}>
                    <Torus args={[0.1, 0.04, 16, 32]} rotation={[0, 0, 0]}>
                        {chrome}
                    </Torus>
                </group>

                {/* Tightening Screw for the Stand */}
                {/* Horizontal screw to lock onto the vertical rod */}
                <group position={[0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <Cylinder args={[0.03, 0.03, 0.3, 16]}>
                        {steel}
                    </Cylinder>
                    {/* Knob */}
                    <group position={[0, 0.15, 0]}>
                        <Cylinder args={[0.08, 0.08, 0.04, 16]}>
                            {blackPlastic}
                        </Cylinder>
                    </group>
                </group>
            </group>


            {/* === ROTATABLE HEAD === */}
            <group rotation={[headAngle, 0, 0]} scale={[size, size, size]}>
                {/* === 2. TRIANGULAR BODY === */}
                <group position={[0, 0, 0]} rotation={[Math.PI / 2, Math.PI, 0]}>
                    <Cylinder args={[0.4, 0.4, 0.2, 3]} rotation={[0, Math.PI / 6, 0]}>
                        {chrome}
                    </Cylinder>
                </group>

                {/* === 3. SCREWS === */}
                {/* Top Screw */}
                <group position={[-0.1, 0.35, 0]} rotation={[0, 0, -0.9]}>
                    <Cylinder args={[0.03, 0.03, 0.5, 16]}>
                        {steel}
                    </Cylinder>
                    <group position={[0, 0.25, 0]}>
                        <Cylinder args={[0.1, 0.1, 0.04, 16]}>
                            {blackPlastic}
                        </Cylinder>
                    </group>
                </group>

                {/* Bottom Screw */}
                <group position={[-0.1, -0.35, 0]} rotation={[0, 0, 0.9]}>
                    <Cylinder args={[0.03, 0.03, 0.5, 16]}>
                        {steel}
                    </Cylinder>
                    <group position={[0, -0.25, 0]}>
                        <Cylinder args={[0.1, 0.1, 0.04, 16]}>
                            {blackPlastic}
                        </Cylinder>
                    </group>
                </group>


                {/* === 4. JAWS === */}
                <group position={[0.2, 0, 0]}>

                    {/* Upper Jaw Prong */}
                    <group rotation={[0, 0, 0.5 + rotationOffset]}>
                        <Cylinder args={[0.035, 0.035, 0.5, 16]} position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                            {chrome}
                        </Cylinder>
                        <group position={[0.5, 0, 0]} rotation={[0, 0, -1.0]}>
                            <Cylinder args={[0.035, 0.035, 0.3, 16]} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                                {chrome}
                            </Cylinder>
                            <Sphere args={[0.036, 16, 16]} position={[0.3, 0, 0]}>
                                {blackPlastic}
                            </Sphere>
                        </group>
                    </group>

                    {/* Lower Jaw Prong */}
                    <group rotation={[0, 0, -(0.5 + rotationOffset)]}>
                        <Cylinder args={[0.035, 0.035, 0.5, 16]} position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                            {chrome}
                        </Cylinder>
                        <group position={[0.5, 0, 0]} rotation={[0, 0, 1.0]}>
                            <Cylinder args={[0.035, 0.035, 0.3, 16]} position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                                {chrome}
                            </Cylinder>
                            <Sphere args={[0.036, 16, 16]} position={[0.3, 0, 0]}>
                                {blackPlastic}
                            </Sphere>
                        </group>
                    </group>

                </group>
            </group>
        </group>
    );
};

export default Clamp;
