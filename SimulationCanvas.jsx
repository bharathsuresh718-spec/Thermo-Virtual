import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export default function SimulationCanvas() {
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Canvas>
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <mesh>
          <cylinderGeometry args={[1, 1, 4, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}