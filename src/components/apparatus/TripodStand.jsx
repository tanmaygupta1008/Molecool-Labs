import React from 'react';
import { Cylinder, Torus } from '@react-three/drei';

const TripodStand = ({ height = 3.0, legAngle = 0.15, ...props }) => {
    // Ring radius
    const ringRadius = 1.2;
    // Leg cylinder radius
    const legRadius = 0.08;

    // Calculate leg length based on height and angle
    // cos(angle) = height / length => length = height / cos(angle)
    // However, the Cylinder is centered. So we need to position it correctly.
    // The top of the leg should be at (ringRadius, height, 0) relative to center?
    // Actually, legs attach to the ring. 
    // Let's assume legs attach at Y=height, X=ringRadius (local to leg rotation plane).
    // And they go down to Y=0.

    // Effective height is `height`.
    // Angle is `legAngle` (radians) from vertical? Or from horizontal?
    // Usually "splay" angle from vertical. 0 = straight down.

    // Length of leg hypotenuse
    const legLength = height / Math.cos(legAngle);

    // Position of the leg center
    // Y = height / 2
    // X = ringRadius + (height/2 * tan(angle)) ? 
    // No. Top point is (R, H). Bottom point is (R + H*tan(a), 0).
    // Center point is Average: (R + H*tan(a)/2, H/2).

    const xTop = ringRadius - 0.1; // Tuck slightly inside ring
    const xBottom = xTop + height * Math.tan(legAngle);
    const xCenter = (xTop + xBottom) / 2;
    const yCenter = height / 2;

    return (
        <group {...props}>
            {/* Ring at the top height */}
            <Torus args={[ringRadius, 0.08, 16, 32]} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.5} />
            </Torus>

            {/* Legs */}
            {[0, 120, 240].map((angle, index) => (
                <group key={index} rotation={[0, (angle * Math.PI) / 180, 0]}>
                    {/* Pivot Group at the top connection point */}
                    <group
                        position={[ringRadius - 0.05, height, 0]}
                        rotation={[0, 0, legAngle]}
                    >
                        {/* Cylinder hangs down from pivot (center at -length/2) */}
                        <Cylinder
                            args={[legRadius, legRadius, legLength, 16]}
                            position={[0, -legLength / 2, 0]}
                        >
                            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.5} />
                        </Cylinder>
                    </group>
                </group>
            ))}
        </group>
    );
};

export default TripodStand;
