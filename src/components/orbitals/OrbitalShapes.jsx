'use client';
import React from 'react';
import { Sphere, Torus, Cone } from '@react-three/drei';
import * as THREE from 'three';

// Perfect Teardrop using LatheGeometry (revolves a Bezier/Mathematical curve starting at origin)
const CustomTeardrop = React.forwardRef(({ scale, ...props }, ref) => {
    const geo = React.useMemo(() => {
        const points = [];
        const segments = 48; // Higher res for perfect round outer tip
        for (let i = 0; i <= segments; i++) {
            const t = i / segments; // 0 to 1
            const y = t * 2.0; // extends to +2 Y
            
            // Mathematical orbital bounding shell: 
            // t = 0 is the atomic origin.
            // t = 1 is the distal outer edge.
            // We use (1 - t)^0.5 inside the sine. 
            // This gives a finite slope (pointy cone) at the origin (t=0)
            // and an infinite slope (perfectly round bulbous cap) at the distal edge (t=1).
            const x = 0.9 * Math.sin(Math.PI * Math.pow(1 - t, 0.65)); 
            
            points.push(new THREE.Vector2(x, y));
        }
        const geometry = new THREE.LatheGeometry(points, 48);
        geometry.computeVertexNormals();
        return geometry;
    }, []);
    return (
        <mesh ref={ref} scale={scale} {...props} geometry={geo} />
    );
});

// Since the new CustomTeardrop natively starts at (0,0,0) and points +Y,
// we just place every lobe squarely at the origin and simply rotate it!
const Lobe = ({ rotation, phasePath, materialProps, scale = [1, 1.25, 1] }) => (
    <CustomTeardrop position={[0, 0, 0]} rotation={rotation || [0,0,0]} scale={scale}>
        <meshPhysicalMaterial 
            color={phasePath === 1 ? "#ef4444" : phasePath === -1 ? "#3b82f6" : "#a855f7"} // Red (+), Blue (-), Purple (Hybrid)
            transparent={true} 
            opacity={0.9} 
            roughness={0.15}
            transmission={0.3}
            thickness={1.5}
            clearcoat={1}
            {...materialProps} 
        />
    </CustomTeardrop>
);

const StandardTorus = ({ position, rotation, phasePath, materialProps, scale }) => (
    <Torus args={[1.2, 0.35, 32, 64]} position={position} rotation={rotation} scale={scale}>
        <meshPhysicalMaterial 
            color={phasePath === 1 ? "#ef4444" : "#3b82f6"} 
            transparent={true} 
            opacity={0.85} 
            roughness={0.1}
            transmission={0.4}
            thickness={1}
            clearcoat={1}
            {...materialProps} 
        />
    </Torus>
);

// --- S Orbitals ---
export const SOrbital = () => (
    <Sphere args={[1.8, 64, 64]}>
        <meshPhysicalMaterial color="#ef4444" transparent opacity={0.6} roughness={0.1} transmission={0.6} clearcoat={1}/>
    </Sphere>
);

// --- P Orbitals ---
export const POrbital = ({ axis }) => {
    if (axis === 'z') return (
        <group>
            <Lobe rotation={[Math.PI/2, 0, 0]} phasePath={1} />
            <Lobe rotation={[-Math.PI/2, 0, 0]} phasePath={-1} />
        </group>
    );
    if (axis === 'x') return (
        <group>
            <Lobe rotation={[0, 0, -Math.PI/2]} phasePath={1} />
            <Lobe rotation={[0, 0, Math.PI/2]} phasePath={-1} />
        </group>
    );
    // y axis
    return (
        <group>
            <Lobe rotation={[0, 0, 0]} phasePath={1} />
            <Lobe rotation={[Math.PI, 0, 0]} phasePath={-1} />
        </group>
    );
};

// --- D Orbitals ---
export const DOrbital = ({ type }) => {
    if (type === 'z2') {
        return (
            <group>
                <Lobe rotation={[Math.PI/2, 0, 0]} phasePath={1} />
                <Lobe rotation={[-Math.PI/2, 0, 0]} phasePath={1} />
                <StandardTorus rotation={[0, 0, 0]} phasePath={-1} />
            </group>
        );
    }
    
    // Group template for 4 lobes between axes (base is XY)
    const DxyBase = () => (
        <group>
            <Lobe rotation={[0, 0, -Math.PI/4]} phasePath={1} />
            <Lobe rotation={[0, 0, 3*Math.PI/4]} phasePath={1} />
            <Lobe rotation={[0, 0, Math.PI/4]} phasePath={-1} />
            <Lobe rotation={[0, 0, -3*Math.PI/4]} phasePath={-1} />
        </group>
    );

    if (type === 'xy') return <DxyBase />;
    if (type === 'xz') return <group rotation={[Math.PI/2, 0, 0]}><DxyBase /></group>;
    if (type === 'yz') return <group rotation={[0, Math.PI/2, 0]}><DxyBase /></group>;
    
    if (type === 'x2-y2') { // XY plane ON axes
        return (
            <group>
                <Lobe rotation={[0, 0, -Math.PI/2]} phasePath={1} /> 
                <Lobe rotation={[0, 0, Math.PI/2]} phasePath={1} /> 
                <Lobe rotation={[0, 0, 0]} phasePath={-1} /> 
                <Lobe rotation={[Math.PI, 0, 0]} phasePath={-1} /> 
            </group>
        );
    }
    return null;
};

// F-Orbital Base Components
const renderToriAxial = (axisRot) => (
    <group rotation={axisRot}>
        <Lobe rotation={[Math.PI/2, 0, 0]} phasePath={1} />
        <Lobe rotation={[-Math.PI/2, 0, 0]} phasePath={-1} />
        {/* Tori sit on XY planes (normal Z) at Z=0.6 and Z=-0.6 */}
        <StandardTorus position={[0, 0, 0.6]} rotation={[0, 0, 0]} phasePath={1} scale={[0.65, 0.65, 0.65]} />
        <StandardTorus position={[0, 0, -0.6]} rotation={[0, 0, 0]} phasePath={-1} scale={[0.65, 0.65, 0.65]} />
    </group>
);

// Helper for mapping standard geometric spherical coordinates to our +Y default Teardrop lobe
const SphericalLobe = ({ theta, phi, phase }) => (
    // 1. phi rotates +Y down towards +Z by phi radians.
    // 2. theta sweeps it around the Y axis.
    <group rotation={[0, theta, 0]}>
        <Lobe rotation={[phi, 0, 0]} phasePath={phase} />
    </group>
);

// Generates the f_y(z2-x2) shape inherently via spherical coordinates (no Z-fighting)
const PlanarEight = ({ phaseMultiplier = 1 }) => {
    const p = Math.PI / 4; // Top lobes
    const pBot = 3 * p; // Bottom lobes
    
    // In f_y(z2-x2), the 4 lobes are on YZ plane and XY plane.
    return (
        <group>
            {/* YZ Plane: antinodes at (+y, +z), (+y, -z) etc */}
            <SphericalLobe theta={0} phi={p} phase={1 * phaseMultiplier} /> 
            <SphericalLobe theta={Math.PI} phi={p} phase={1 * phaseMultiplier} /> 
            <SphericalLobe theta={0} phi={pBot} phase={-1 * phaseMultiplier} /> 
            <SphericalLobe theta={Math.PI} phi={pBot} phase={-1 * phaseMultiplier} /> 
            
            {/* XY Plane: antinodes at (+y, +x), (+y, -x) etc (Phases reversed) */}
            <SphericalLobe theta={Math.PI/2} phi={p} phase={-1 * phaseMultiplier} /> 
            <SphericalLobe theta={-Math.PI/2} phi={p} phase={-1 * phaseMultiplier} /> 
            <SphericalLobe theta={Math.PI/2} phi={pBot} phase={1 * phaseMultiplier} /> 
            <SphericalLobe theta={-Math.PI/2} phi={pBot} phase={1 * phaseMultiplier} />
        </group>
    );
};

// Generates the f_xyz shape (corners of a cube)
const CubicEight = () => {
    // Magic angle where a cube diagonal intersects the vertical axis
    const p = Math.atan(Math.SQRT2); 
    const pBot = Math.PI - p;
    
    return (
        <group>
            {/* Top Octants (y > 0) */}
            <SphericalLobe theta={Math.PI/4} phi={p} phase={1} />     {/* (+x, +z) */}
            <SphericalLobe theta={3*Math.PI/4} phi={p} phase={-1} />  {/* (+x, -z) */}
            <SphericalLobe theta={5*Math.PI/4} phi={p} phase={1} />   {/* (-x, -z) */}
            <SphericalLobe theta={7*Math.PI/4} phi={p} phase={-1} />  {/* (-x, +z) */}
            
            {/* Bottom Octants (y < 0) */}
            <SphericalLobe theta={Math.PI/4} phi={pBot} phase={-1} />     
            <SphericalLobe theta={3*Math.PI/4} phi={pBot} phase={1} />  
            <SphericalLobe theta={5*Math.PI/4} phi={pBot} phase={-1} />   
            <SphericalLobe theta={7*Math.PI/4} phi={pBot} phase={1} />  
        </group>
    );
};

// --- F Orbitals ---
export const FOrbital = ({ type }) => {
    if (type === 'z3') return renderToriAxial([0, 0, 0]); 
    if (type === 'x3') return renderToriAxial([0, Math.PI/2, 0]); 
    if (type === 'y3') return renderToriAxial([-Math.PI/2, 0, 0]);

    if (type === 'xyz') return <CubicEight />;
    
    // Planar 8-sets are symmetrically derived from PlanarEight structure
    if (type === 'y(z2-x2)') return <PlanarEight phaseMultiplier={1} />;
    
    // x(z2-y2) is just y(z2-x2) rotated to the X axis.
    if (type === 'x(z2-y2)') return <group rotation={[0, 0, -Math.PI/2]}><PlanarEight phaseMultiplier={1} /></group>;
    
    // z(x2-y2) is just y(z2-x2) rotated to the Z axis, but mathematically requires a phase flip. 
    if (type === 'z(x2-y2)') return <group rotation={[Math.PI/2, 0, 0]}><PlanarEight phaseMultiplier={-1} /></group>;

    return null;
};

// --- Hybrid Orbitals (VSEPR geometries) ---
export const HybridOrbital = ({ type }) => {
    // We use phasePath={2} for the clean, single-colored purple hybrid representation.
    const hybScale = [1.1, 1.4, 1.1]; // Hybrids are slightly fatter constructively

    if (type === 'sp') { // Linear
        return (
            <group>
                <Lobe rotation={[0, 0, 0]} phasePath={2} scale={hybScale} />
                <Lobe rotation={[Math.PI, 0, 0]} phasePath={2} scale={hybScale} />
            </group>
        );
    }
    
    if (type === 'sp2') { // Trigonal Planar (on XY plane)
        return (
            <group>
                <Lobe rotation={[0, 0, 0]} phasePath={2} scale={hybScale} />
                <Lobe rotation={[0, 0, 2*Math.PI/3]} phasePath={2} scale={hybScale} />
                <Lobe rotation={[0, 0, 4*Math.PI/3]} phasePath={2} scale={hybScale} />
            </group>
        );
    }

    if (type === 'sp3') { // Tetrahedral
        const tetrahedralAngle = Math.acos(-1/3); // ~109.47 degrees
        return (
            <group>
                {/* 1 Lobe pointing straight up */}
                <Lobe rotation={[0, 0, 0]} phasePath={2} scale={hybScale} />
                {/* 3 Lobes pointing down forming the tripod base */}
                <SphericalLobe theta={0} phi={tetrahedralAngle} phase={2} />
                <SphericalLobe theta={2*Math.PI/3} phi={tetrahedralAngle} phase={2} />
                <SphericalLobe theta={4*Math.PI/3} phi={tetrahedralAngle} phase={2} />
            </group>
        );
    }

    if (type === 'sp3d') { // Trigonal Bipyramidal
        return (
            <group>
                {/* Axial */}
                <Lobe rotation={[0, 0, 0]} phasePath={2} scale={hybScale} />
                <Lobe rotation={[Math.PI, 0, 0]} phasePath={2} scale={hybScale} />
                {/* Equatorial (on XZ plane) */}
                <SphericalLobe theta={0} phi={Math.PI/2} phase={2} />
                <SphericalLobe theta={2*Math.PI/3} phi={Math.PI/2} phase={2} />
                <SphericalLobe theta={4*Math.PI/3} phi={Math.PI/2} phase={2} />
            </group>
        );
    }

    if (type === 'sp3d2') { // Octahedral
        return (
            <group>
                <Lobe rotation={[0, 0, 0]} phasePath={2} scale={hybScale} /> {/* +Y */}
                <Lobe rotation={[Math.PI, 0, 0]} phasePath={2} scale={hybScale} /> {/* -Y */}
                <Lobe rotation={[0, 0, -Math.PI/2]} phasePath={2} scale={hybScale} /> {/* +X */}
                <Lobe rotation={[0, 0, Math.PI/2]} phasePath={2} scale={hybScale} /> {/* -X */}
                <Lobe rotation={[Math.PI/2, 0, 0]} phasePath={2} scale={hybScale} /> {/* +Z */}
                <Lobe rotation={[-Math.PI/2, 0, 0]} phasePath={2} scale={hybScale} /> {/* -Z */}
            </group>
        );
    }

    return null;
}

export const OrbitalViewer = ({ orbitalData }) => {
    if (!orbitalData) return null;
    
    // Check if it's a hybrid orbital
    if (orbitalData.id.startsWith('h_')) {
        return <HybridOrbital type={orbitalData.id.split('_')[1]} />;
    }
    
    // Parse pure orbital type from the raw ID (e.g. "1s", "2px", "3dz2", "4fz3", "4fz(x2-y2)")
    // We use ID instead of label because label contains unicode superscripts (³, ²) which breaks matching.
    const subshell = orbitalData.id.match(/[spdf]/)[0];
    
    switch(subshell) {
        case 's': return <SOrbital />;
        case 'p': return <POrbital axis={orbitalData.id.slice(-1)} />;
        case 'd': return <DOrbital type={orbitalData.id.split('d')[1]} />;
        case 'f': return <FOrbital type={orbitalData.id.split('f')[1]} />;
        default: return null;
    }
}
