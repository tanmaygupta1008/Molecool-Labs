import React from 'react';

const GlobalLabTable = ({ width = 14, depth = 10 }) => (
    <group position={[0, -0.05, 0]}>
        {/* Table Top (Dark Epoxy Resin) */}
        <mesh receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[width, 0.1, depth]} />
            <meshStandardMaterial color="#1f2022" roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Anti-Spill Lip / Rim */}
        <mesh receiveShadow position={[0, 0.08, -depth/2 + 0.05]}>
            <boxGeometry args={[width + 0.2, 0.05, 0.1]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[0, 0.08, depth/2 - 0.05]}>
            <boxGeometry args={[width + 0.2, 0.05, 0.1]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[-width/2 - 0.05, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.05, depth]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>
        <mesh receiveShadow position={[width/2 + 0.05, 0.08, 0]}>
            <boxGeometry args={[0.1, 0.05, depth]} />
            <meshStandardMaterial color="#141517" roughness={0.8} />
        </mesh>

        {/* === WASH BASIN (raised stainless lab sink) === */}
        {width >= 10 && depth >= 8 && (() => {
            // Raised basin — walls go UP so interior is always visible
            const bW  = 2.0;   // outer width
            const bD  = 1.4;   // outer depth
            const bH  = 0.44;  // basin height above table
            const wT  = 0.08;  // wall thickness
            const bInW = bW - wT * 2;   // 1.84  inner width
            const bInD = bD - wT * 2;   // 1.24  inner depth

            // Brushed-stainless material params (matches reference image)
            const sc = "#8a9696";   // steel color
            const sr = 0.40;        // roughness
            const sm = 0.92;        // metalness
            const se = "#0c1010";   // emissive (prevents pitch-black in shadow)

            // Faucet — gooseneck: vertical stem → semicircular arc → downward spout
            const fZ = -(bD / 2 - wT / 2);    // Z centre of back wall (stem base)
            const stemBaseY = bH + 0.07;
            const stemTopY  = bH + 1.28;
            // Arc constants (semicircle in ZY plane, going from stem top forward + over)
            const arcR  = 0.34;                             // gooseneck bend radius
            const arcN  = 12;                              // segments for smoothness
            const arcCZ = fZ + arcR;                       // arc centre Z
            const spoutZ = fZ + 2 * arcR;                  // spout hangs here
            const spoutL = 0.60;                           // downward spout length
            const spoutCY = stemTopY - spoutL / 2;
            const spoutBY = stemTopY - spoutL;

            return (
                // Y=0.05 → the group sits at table-top surface level
                <group position={[width/2 - 2.2, 0.05, -depth/2 + 2.2]}>

                    {/* ── BACK WALL ── */}
                    <mesh position={[0, bH/2, -(bD/2 - wT/2)]}>
                        <boxGeometry args={[bW, bH, wT]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── FRONT WALL ── */}
                    <mesh position={[0, bH/2, bD/2 - wT/2]}>
                        <boxGeometry args={[bW, bH, wT]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── LEFT WALL ── */}
                    <mesh position={[-(bW/2 - wT/2), bH/2, 0]}>
                        <boxGeometry args={[wT, bH, bInD]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>
                    {/* ── RIGHT WALL ── */}
                    <mesh position={[bW/2 - wT/2, bH/2, 0]}>
                        <boxGeometry args={[wT, bH, bInD]} />
                        <meshStandardMaterial color={sc} roughness={sr} metalness={sm} emissive={se} />
                    </mesh>

                    {/* ── BASIN FLOOR (darker — depth cue) ── */}
                    <mesh position={[0, wT/2, 0]}>
                        <boxGeometry args={[bInW, wT, bInD]} />
                        <meshStandardMaterial color="#788484" roughness={0.38} metalness={0.94} emissive="#0a0d0d" />
                    </mesh>

                    {/* ── TOP RIM CAPS (polished lip) ── */}
                    <mesh position={[0, bH + 0.012, -(bD/2 - wT/2)]}>
                        <boxGeometry args={[bW + 0.05, 0.024, wT + 0.04]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[0, bH + 0.012, bD/2 - wT/2]}>
                        <boxGeometry args={[bW + 0.05, 0.024, wT + 0.04]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[-(bW/2 - wT/2), bH + 0.012, 0]}>
                        <boxGeometry args={[wT + 0.04, 0.024, bInD + 0.02]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[bW/2 - wT/2, bH + 0.012, 0]}>
                        <boxGeometry args={[wT + 0.04, 0.024, bInD + 0.02]} />
                        <meshStandardMaterial color="#b4c2c2" roughness={0.13} metalness={0.98} />
                    </mesh>

                    {/* ── DRAIN — concentric ring design ── */}
                    <mesh position={[0, wT + 0.008, 0]}>
                        <cylinderGeometry args={[0.13, 0.13, 0.014, 40]} />
                        <meshStandardMaterial color="#9ab0b0" roughness={0.20} metalness={0.97} emissive="#080c0c" />
                    </mesh>
                    <mesh position={[0, wT + 0.020, 0]}>
                        <cylinderGeometry args={[0.083, 0.103, 0.018, 40]} />
                        <meshStandardMaterial color="#afc0c0" roughness={0.14} metalness={0.98} />
                    </mesh>
                    <mesh position={[0, wT + 0.028, 0]}>
                        <cylinderGeometry args={[0.040, 0.058, 0.014, 32]} />
                        <meshStandardMaterial color="#c2d2d2" roughness={0.13} metalness={0.98} />
                    </mesh>
                    <mesh position={[0, wT + 0.004, 0]}>
                        <cylinderGeometry args={[0.034, 0.034, 0.018, 30]} />
                        <meshStandardMaterial color="#1a2020" roughness={0.6} metalness={0.5} />
                    </mesh>
                    <mesh position={[0, wT + 0.030, 0]}>
                        <cylinderGeometry args={[0.010, 0.014, 0.010, 16]} />
                        <meshStandardMaterial color="#5a6666" roughness={0.3} metalness={0.9} />
                    </mesh>

                    {/* ── GOOSENECK FAUCET ── */}
                    <mesh position={[0, stemBaseY, fZ]}>
                        <cylinderGeometry args={[0.09, 0.10, 0.14, 18]} />
                        <meshStandardMaterial color="#b0b0b0" roughness={0.05} metalness={1.0} />
                    </mesh>
                    <mesh position={[0, (stemBaseY + 0.07 + stemTopY) / 2, fZ]}>
                        <cylinderGeometry args={[0.048, 0.054, stemTopY - stemBaseY - 0.07, 16]} />
                        <meshStandardMaterial color="#c2c2c2" roughness={0.05} metalness={1.0} />
                    </mesh>
                    <mesh position={[0, stemTopY, fZ]}>
                        <cylinderGeometry args={[0.055, 0.048, 0.04, 16]} />
                        <meshStandardMaterial color="#a8a8a8" roughness={0.06} metalness={1.0} />
                    </mesh>
                    
                    {Array.from({ length: arcN }, (_, i) => {
                        const tS   = Math.PI - (Math.PI / arcN) * i;
                        const tE   = Math.PI - (Math.PI / arcN) * (i + 1);
                        const tM   = (tS + tE) / 2;
                        const segLen = 2 * arcR * Math.sin(Math.PI / (2 * arcN));
                        const py   = stemTopY + arcR * Math.sin(tM);
                        const pz   = arcCZ    + arcR * Math.cos(tM);
                        return (
                            <mesh key={i} position={[0, py, pz]} rotation={[-tM, 0, 0]}>
                                <cylinderGeometry args={[0.044, 0.044, segLen + 0.01, 16]} />
                                <meshStandardMaterial color="#c8c8c8" roughness={0.04} metalness={1.0} />
                            </mesh>
                        );
                    })}
                    {/* ── NOZZLE TIP ── */}
                    <mesh position={[0, stemTopY, spoutZ]}>
                        <cylinderGeometry args={[0.040, 0.044, 0.06, 20]} />
                        <meshStandardMaterial color="#909090" roughness={0.12} metalness={0.9} />
                    </mesh>

                    {/* ── HOT HANDLE (Red, Left) ── */}
                    <group position={[0, bH + 0.28, fZ]}>
                        <mesh position={[-0.17, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.024, 0.024, 0.23, 10]} />
                            <meshStandardMaterial color="#bcbcbc" roughness={0.08} metalness={0.9} />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
                            <meshStandardMaterial color="#cc2222" roughness={0.28} metalness={0.5} />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.016, 0.12]} />
                            <meshStandardMaterial color="#991111" />
                        </mesh>
                        <mesh position={[-0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.12, 0.016]} />
                            <meshStandardMaterial color="#991111" />
                        </mesh>
                    </group>

                    {/* ── COLD HANDLE (Blue, Right) ── */}
                    <group position={[0, bH + 0.28, fZ]}>
                        <mesh position={[0.17, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.024, 0.024, 0.23, 10]} />
                            <meshStandardMaterial color="#bcbcbc" roughness={0.08} metalness={0.9} />
                        </mesh>
                        <mesh position={[0.295, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                            <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
                            <meshStandardMaterial color="#2244cc" roughness={0.28} metalness={0.5} />
                        </mesh>
                        <mesh position={[0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.016, 0.12]} />
                            <meshStandardMaterial color="#112299" />
                        </mesh>
                        <mesh position={[0.295, 0, 0]}>
                            <boxGeometry args={[0.04, 0.12, 0.016]} />
                            <meshStandardMaterial color="#112299" />
                        </mesh>
                    </group>

                </group>
            );
        })()}



        {/* Legs / Framing */}

        {[-width/2 + 0.35, width/2 - 0.35].map(x =>
            [-depth/2 + 0.35, depth/2 - 0.35].map(z => (
                <group key={`${x}-${z}`} position={[x, -2.05, z]}>
                    <mesh receiveShadow castShadow>
                        <boxGeometry args={[0.3, 4, 0.3]} />
                        <meshStandardMaterial color="#333333" roughness={0.6} />
                    </mesh>
                    <mesh receiveShadow position={[0, -2.02, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
                        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.8} />
                    </mesh>
                </group>
            ))
        )}

        {/* Support Crossbars */}
        <mesh position={[0, -1.05, 0]}>
            <boxGeometry args={[width - 0.8, 0.15, 0.15]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        <mesh position={[-width/2 + 0.35, -1.05, 0]}>
            <boxGeometry args={[0.15, 0.15, depth - 0.8]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        <mesh position={[width/2 - 0.35, -1.05, 0]}>
            <boxGeometry args={[0.15, 0.15, depth - 0.8]} />
            <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
    </group>
);

export default GlobalLabTable;
