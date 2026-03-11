'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

const AnimatedDashedLine = (props) => {
    const lineRef = useRef();

    useFrame((state, delta) => {
        if (lineRef.current?.material) {
            // Subtracting from dashOffset makes it look like it's moving from start to end
            lineRef.current.material.dashOffset -= delta * 2;
        }
    });

    return <Line ref={lineRef} {...props} />;
};

export default AnimatedDashedLine;
