import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SingleRipple = ({ color, activeTime }) => {
    const materialRef = useRef();

    const shaderArgs = useMemo(() => {
        return {
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uIntensity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uIntensity;
                
                varying vec2 vUv;
                
                void main() {
                    // Center of the plane is at UV (0.5, 0.5)
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // The peak of the wave moves outwards over time
                    // Speed is roughly 1.0 UV units per second (reaches edge at 0.5s)
                    float waveDist = uTime * 1.0; 
                    
                    // Distance from this pixel to the wave peak
                    float distFromPeak = abs(dist - waveDist);
                    
                    // Create a sharp, localized pulse. Thickness is 0.05
                    float wave = smoothstep(0.06, 0.0, distFromPeak);
                    
                    // Add a tiny trailing echo wave for liquid displacement realism
                    float trailing = smoothstep(0.03, 0.0, abs(dist - waveDist + 0.08)) * 0.4;
                    wave = max(wave, trailing);
                    
                    // Radially decrease intensity so it dies at the edges smoothly
                    float radialFade = 1.0 - (dist * 2.0);
                    radialFade = radialFade * radialFade;
                    
                    // Age fade: fade out completely after 0.5 seconds
                    float ageFade = 1.0 - smoothstep(0.3, 0.6, uTime);
                    
                    // Soften the direct center so it doesn't pop aggressively
                    float centerFade = smoothstep(0.0, 0.04, dist);
                    
                    float alpha = wave * radialFade * ageFade * centerFade * uIntensity;
                    
                    gl_FragColor = vec4(uColor, alpha * 0.7); // 0.7 max opacity limit
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide
        };
    }, []); // Run once per instance avoiding jitter

    useFrame(() => {
        if (!materialRef.current) return;

        let age = -1;
        if (activeTime > 0) {
            age = (performance.now() - activeTime) / 1000;
        }

        // Only output shader visibility if active (age < 0.6s)
        if (age >= 0 && age <= 0.6) {
            materialRef.current.uniforms.uTime.value = age;
            materialRef.current.uniforms.uIntensity.value = 1.0;
        } else {
            materialRef.current.uniforms.uIntensity.value = 0.0;
        }

        materialRef.current.uniforms.uColor.value.set(color);
    });

    return (
        <mesh>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial ref={materialRef} args={[shaderArgs]} />
        </mesh>
    );
};

const Ripples = ({ position = [0, 0, 0], color = '#ffffff', active = false, baseScale = 1 }) => {
    const numRipples = 6;
    const [hitTimes, setHitTimes] = useState(new Array(numRipples).fill(0));
    const nextHitIndex = useRef(0);

    useEffect(() => {
        const handleHit = () => {
            if (!active) return;
            setHitTimes(prev => {
                const newTimes = [...prev];
                newTimes[nextHitIndex.current] = performance.now();
                return newTimes;
            });
            nextHitIndex.current = (nextHitIndex.current + 1) % numRipples;
        };

        window.addEventListener('liquid-drop-hit', handleHit);
        return () => window.removeEventListener('liquid-drop-hit', handleHit);
    }, [active]);

    return (
        // Multiply baseScale by 2 because a PlaneGeometry of size 1x1 has a radius of 0.5
        // This makes the circular shader perfectly fit a container of radius `baseScale`
        <group position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[baseScale * 2, baseScale * 2, 1]}>
            {hitTimes.map((time, i) => (
                <SingleRipple key={i} color={color} activeTime={time} />
            ))}
        </group>
    );
};

export default Ripples;
