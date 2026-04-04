import React from 'react';
import * as THREE from 'three';
import { Cylinder, Sphere } from '@react-three/drei';

const Thermometer = (props) => {
    // A thermometer is a very thin glass rod with a red bulb and column.
    
    // Total height of thermometer glass tube is 4.0
    const glassRadius = 0.06;
    const bulbRadius = 0.08;
    const height = 4.0;
    
    // Represents the temperature visually by raising the red column
    const { temperature = 20, ...rest } = props; 
    
    // Scale liquid height based on generic temperature scale (e.g. 0 to 100)
    const liquidScale = Math.max(0, Math.min(100, temperature)) / 100;
    const maxLiquidHeight = height - 0.4;
    const liquidHeight = 0.2 + (maxLiquidHeight * liquidScale);

    return (
        <group {...rest}>
            {/* Outer Glass Tube */}
            <Cylinder args={[glassRadius, glassRadius, height, 16]} position={[0, height / 2, 0]}>
                <meshPhysicalMaterial 
                    color="#ffffff" 
                    transmission={0.9} 
                    opacity={0.3} 
                    transparent 
                    roughness={0.1}
                    depthWrite={false}
                />
            </Cylinder>

            {/* Glass Bulb at bottom */}
            <Sphere args={[bulbRadius, 16, 16]} position={[0, bulbRadius, 0]}>
                <meshPhysicalMaterial 
                    color="#ffffff" 
                    transmission={0.9} 
                    opacity={0.3} 
                    transparent 
                    roughness={0.1}
                    depthWrite={false}
                />
            </Sphere>

            {/* Inner Red Liquid Liquid Bulb */}
            <Sphere args={[bulbRadius * 0.8, 16, 16]} position={[0, bulbRadius, 0]}>
                <meshStandardMaterial color="#dd0000" />
            </Sphere>

            {/* Inner Red Liquid Column */}
            <Cylinder args={[glassRadius * 0.3, glassRadius * 0.3, liquidHeight, 8]} position={[0, bulbRadius + liquidHeight / 2, 0]}>
                <meshStandardMaterial color="#dd0000" />
            </Cylinder>
            
            {/* Top sealing bulb */}
            <Sphere args={[glassRadius, 16, 16]} position={[0, height, 0]}>
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={0.3} transparent roughness={0.1} />
            </Sphere>
        </group>
    );
};

export default Thermometer;
