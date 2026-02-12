// src/components/reactions/views/components/LabStand.jsx
import { Cylinder, Box } from '@react-three/drei';

const LabStand = () => {
    const metalMaterial = (
        <meshStandardMaterial
            color="#444"
            metalness={0.8}
            roughness={0.2}
        />
    );

    return (
        <group position={[0.5, -1, -0.5]} scale={[0.3, 0.3, 0.3]}>
            {/* Base */}
            <Box args={[4, 0.2, 3]} position={[0, 0.1, 0]}>
                <meshStandardMaterial color="#222" roughness={0.8} />
            </Box>

            {/* Main Rod */}
            <Cylinder args={[0.1, 0.1, 10, 16]} position={[0, 5, -1]}>
                {metalMaterial}
            </Cylinder>

            {/* Clamp Horizontal Rod */}
            <Cylinder args={[0.1, 0.1, 3, 16]} position={[-1.5, 6, -1]} rotation={[0, 0, Math.PI / 2]}>
                {metalMaterial}
            </Cylinder>

            {/* Clamp Holder around Rod */}
            <Box args={[0.4, 0.4, 0.4]} position={[0, 6, -1]}>
                {metalMaterial}
            </Box>

            {/* The Clamp itself (holding the test tube) */}
            <group position={[-3, 6, -1]} rotation={[0, 0, 0]}>
                {/* Visual representation of a clamp */}
                <Cylinder args={[1.3, 1.3, 0.2, 16, 1, true]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#555" side={2} />
                </Cylinder>
            </group>
        </group>
    );
};

export default LabStand;
