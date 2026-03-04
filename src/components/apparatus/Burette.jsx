import React, { useMemo, useRef } from 'react';
import { Cylinder, Box, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHEMICALS } from '../../data/chemicals';

const LiquidDrops = ({ color, rate = 0.5 }) => {
    const meshRef = useRef();
    const particleCount = 10;

    // Initial particle state: [yPos, speed, active]
    const particles = useMemo(() => {
        return new Array(particleCount).fill().map(() => ({
            y: 0,
            speed: 0,
            active: false,
            delay: Math.random() * 2 // spread out start times
        }));
    }, [particleCount]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Actual drips per second based on the UI rate scalar (0.5 default = 1 drip/sec maybe)
        // We simulate by activating particles based on a timer
        const emissionInterval = 1.0 / (rate * 3 + 0.1);

        // Update physics
        particles.forEach((p, i) => {
            if (!p.active) {
                p.delay -= delta;
                if (p.delay <= 0) {
                    p.active = true;
                    p.y = -0.55; // Start just below the tip
                    p.speed = 0;
                    p.delay = emissionInterval + (Math.random() * 0.2); // reset delay for next cycle
                }
            }

            if (p.active) {
                // Gravity
                p.speed += 9.8 * delta;
                p.y -= p.speed * delta;

                // Hit ground/beaker roughly at y = -3.5 or so (relative to Burette)
                if (p.y < -4) {
                    p.active = false;
                    p.y = 0; // hide it
                    window.dispatchEvent(new CustomEvent('liquid-drop-hit'));
                }
            }

            // Apply to dummy
            if (p.active) {
                dummy.position.set(0, p.y, 0);
                // Stretch stretch vertically as it falls
                const stretch = 1 + p.speed * 0.2;
                dummy.scale.set(1, stretch, 1);
            } else {
                dummy.position.set(0, 100, 0); // Hide far away
            }

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, particleCount]} frustumCulled={false}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshPhysicalMaterial
                color={color}
                transparent
                opacity={0.8}
                transmission={0.5}
                roughness={0.1}
            />
        </instancedMesh>
    );
};

const Burette = ({ reactants = [], ...props }) => {
    // Calculate liquid contents
    const { liquidHeight, liquidColor } = useMemo(() => {
        let vol = 0;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        reactants.forEach(r => {
            const chemical = CHEMICALS.find(c => c.id === r.chemicalId);
            const overrideColor = props.reactantColorOverrides?.[r.id];
            const color = overrideColor || chemical?.color || '#ffffff'; // Default to white

            if (r.state === 'l' || r.state === 'aq') {
                const overrideAmt = props.reactantOverrides?.[r.id];
                const amt = overrideAmt !== undefined ? overrideAmt : (parseFloat(r.amount) || 0);
                vol += amt;

                // Simple color mixing weighted by volume
                const c = new THREE.Color(color);
                rSum += c.r * amt;
                gSum += c.g * amt;
                bSum += c.b * amt;
                count += amt;
            }
        });

        // Factor in the dynamic dripping amount from the timeline
        let actualVol = vol;
        if (props.drainedVolume) {
            actualVol = Math.max(0, vol - props.drainedVolume);
        }

        // Burette is tall and thin. Max capacity ~50mL = height 3.8
        const height = Math.min((actualVol / 50) * 3.8, 3.8); // Leave 0.2 headroom

        let finalColor = '#ffffff';
        if (count > 0) {
            finalColor = '#' + new THREE.Color(rSum / count, gSum / count, bSum / count).getHexString();
        }

        return { liquidHeight: height, liquidColor: finalColor };
    }, [reactants, props.reactantOverrides, props.reactantColorOverrides]);

    return (
        <group {...props}>
            {/* Main Tube */}
            <Cylinder args={[0.08, 0.08, 4, 32, 1, true]} position={[0, 2, 0]}>
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.4}
                    transparent
                    roughness={0.1}
                    side={2}
                />
            </Cylinder>

            {/* Render Liquid inside Burette */}
            {liquidHeight > 0 && (
                <Cylinder args={[0.075, 0.075, liquidHeight, 32]} position={[0, liquidHeight / 2 + 0.1, 0]}>
                    <meshPhysicalMaterial
                        color={liquidColor}
                        transparent
                        opacity={0.8}
                        transmission={0.2}
                        roughness={0.1}
                        side={THREE.DoubleSide}
                    />
                </Cylinder>
            )}

            {/* Markings */}
            {[0, 1, 2, 3].map((y, i) => (
                <Cylinder key={i} args={[0.082, 0.082, 0.01, 32]} position={[0, y + 0.5, 0]}>
                    <meshBasicMaterial color="#000" opacity={0.5} transparent />
                </Cylinder>
            ))}

            {/* Valve/Stopcock */}
            <group position={[0, 0, 0]}>
                <Sphere args={[0.12, 16, 16]}>
                    <meshStandardMaterial color="#fff" roughness={0.5} />
                </Sphere>
                <Box args={[0.3, 0.05, 0.1]} rotation={[0, 0, Math.PI / 2]}>
                    <meshStandardMaterial color="#eeddcc" />
                </Box>
            </group>

            {/* Tip */}
            <Cylinder args={[0.08, 0.02, 0.5, 16]} position={[0, -0.3, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.95} opacity={0.4} transparent />
            </Cylinder>

            {/* Dripping Effect */}
            {props.isDripping && (
                <LiquidDrops color={liquidColor} rate={props.dripRate} />
            )}
        </group>
    );
};

export default Burette;
