import React, { useMemo } from 'react';
import * as THREE from 'three';
import Ripples from '../effects/Ripples';
import { CHEMICALS } from '../../data/chemicals';
import Precipitate from '../effects/Precipitate';
import ConicalContents from './ConicalContents';

const ConicalFlask = ({ reactants = [], ...props }) => {
    const points = useMemo(() => {
        const p = [];
        const baseRadius = 1.0;
        const neckRadius = 0.35;
        const height = 2.5;
        const neckStart = 1.8;

        p.push(new THREE.Vector2(0, 0));
        p.push(new THREE.Vector2(baseRadius, 0));
        p.push(new THREE.Vector2(baseRadius, 0.1));
        p.push(new THREE.Vector2(neckRadius, neckStart));
        p.push(new THREE.Vector2(neckRadius, height));
        p.push(new THREE.Vector2(neckRadius + 0.1, height + 0.1));
        p.push(new THREE.Vector2(neckRadius, height + 0.1));

        return p;
    }, []);

    // Extracted logic to ConicalContents

    return (
        <group {...props}>
            <mesh position={[0, 0, 0]}>
                <latheGeometry args={[points, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    thickness={0.1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Liquid, Gas, and Solid Contents */}
            <ConicalContents 
                reactants={reactants}
                maxVolume={250}
                baseRadius={1.0}
                neckRadius={0.35}
                coneHeight={1.8}
                maxVisibleHeight={2.2}
                position={[0, 0, 0]}
                isReceivingDrips={props.isReceivingDrips}
                rippleColor={props.rippleColor}
                {...props}
            />

            {/* Render Precipitate */}
            {props.precipitateActive && (
                <Precipitate
                    type="cylinder"
                    radius={1.0}
                    amount={props.precipitateAmount}
                    color={props.precipitateColor}
                    position={[0, 0.05, 0]}
                />
            )}

            {/* Thermal Glow Overlay */}
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
        </group>
    );
};

export default ConicalFlask;
