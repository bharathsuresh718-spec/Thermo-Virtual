import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';

// --- PARTICLE ENGINE ---
function FlowParticles({ speed, color, position, radius, length, count = 12, isSpiral = false, spiralRadius = 3 }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (isSpiral) {
          const t = (state.clock.elapsedTime * speed * 2) + (i * (Math.PI * 2 / count));
          child.position.x = Math.cos(t) * spiralRadius;
          child.position.z = Math.sin(t) * spiralRadius;
          child.position.y = 0;
        } else {
          child.position.y += speed;
          if (child.position.y > length / 2) child.position.y = -length / 2;
        }
      });
    }
  });
  return (
    <group ref={groupRef} position={position}>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} position={[0, isSpiral ? 0 : (i / count) * length - length / 2, 0]}>
          <sphereGeometry args={[radius * 0.4, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

// --- MODELS ---
const Models = {
  DoublePipe: ({ matColor, radius, length, speed, areaScale }) => (
    <group rotation={[0, 0, Math.PI / 2]} scale={[1, areaScale, 1]}>
      <mesh><cylinderGeometry args={[radius * 2, radius * 2, length, 32]} /><meshStandardMaterial color="white" transparent opacity={0.1} wireframe /></mesh>
      <mesh><cylinderGeometry args={[radius, radius, length + 0.1, 24]} /><meshStandardMaterial color={matColor} metalness={0.8} /></mesh>
      <FlowParticles speed={speed} color="#f87171" position={[0, 0, 0]} radius={radius} length={length} />
    </group>
  ),
  ShellTube: ({ matColor, radius, length, speed, areaScale }) => (
    <group rotation={[0, 0, Math.PI / 2]} scale={[areaScale, areaScale, areaScale]}>
      <mesh><cylinderGeometry args={[radius * 4, radius * 4, length, 32]} /><meshStandardMaterial color="white" transparent opacity={0.1} wireframe /></mesh>
      {[...Array(7)].map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * (radius * 2), 0, Math.sin(angle) * (radius * 2)]}>
            <mesh><cylinderGeometry args={[radius * 0.5, radius * 0.5, length + 0.1, 16]} /><meshStandardMaterial color={matColor} metalness={0.8} /></mesh>
            <FlowParticles speed={speed} color="#f87171" position={[0, 0, 0]} radius={radius * 0.5} length={length} />
          </group>
        );
      })}
    </group>
  ),
  Plate: ({ matColor, radius, length, speed, areaScale }) => (
    <group scale={[areaScale, areaScale, areaScale]}>
      {[...Array(8)].map((_, i) => (
        <group key={i} position={[0, 0, i * 0.5 - 1.5]}>
          <mesh><boxGeometry args={[radius * 6, length, 0.05]} /><meshStandardMaterial color={matColor} metalness={0.7} /></mesh>
          <FlowParticles speed={speed} color={i % 2 === 0 ? "#f87171" : "#60a5fa"} position={[0, 0, 0.1]} radius={0.1} length={length} />
        </group>
      ))}
    </group>
  ),
  Finned: ({ matColor, radius, length, speed, areaScale }) => (
    <group rotation={[0, 0, Math.PI / 2]} scale={[1, areaScale, 1]}>
      <mesh><cylinderGeometry args={[radius, radius, length, 24]} /><meshStandardMaterial color={matColor} /></mesh>
      {[...Array(15)].map((_, i) => (
        <mesh key={i} position={[0, (i * (length / 15)) - length / 2, 0]}><cylinderGeometry args={[radius * 2.5, radius * 2.5, 0.05, 32]} /><meshStandardMaterial color={matColor} metalness={0.6} /></mesh>
      ))}
      <FlowParticles speed={speed} color="#f87171" position={[0, 0, 0]} radius={radius} length={length} />
    </group>
  ),
  Spiral: ({ matColor, radius, speed, areaScale }) => (
    <group rotation={[Math.PI / 2, 0, 0]} scale={[areaScale, areaScale, areaScale]}>
      <mesh><torusGeometry args={[radius * 4, 0.15, 16, 100]} /><meshStandardMaterial color={matColor} /></mesh>
      <FlowParticles speed={speed} color="#f87171" isSpiral={true} spiralRadius={radius * 4} radius={0.2} />
      <mesh><torusGeometry args={[radius * 3, 0.1, 16, 100]} /><meshStandardMaterial color="#60a5fa" transparent opacity={0.5} /></mesh>
      <FlowParticles speed={speed * 0.8} color="#60a5fa" isSpiral={true} spiralRadius={radius * 3} radius={0.15} />
    </group>
  )
};
const BrandHeader = () => (
  <div style={{ 
    marginBottom: '40px', 
    borderBottom: '1px solid rgba(0, 242, 255, 0.2)', 
    paddingBottom: '15px' 
  }}>
    <h1 style={{ 
      fontSize: '26px', 
      fontWeight: '900', 
      letterSpacing: '2px', 
      color: '#00f2ff', 
      textShadow: '0 0 15px rgba(0, 242, 255, 0.6)',
      margin: 0,
      fontFamily: 'monospace'
    }}>
      THERMOSCALE
    </h1>
    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '5px', letterSpacing: '1px' }}>
      PRECISION THERMAL ANALYTICS
    </div>
  </div>
);
export default function App() {
  const [config, setConfig] = useState({
    model: 'ShellTube',
    tempIn: 90,
    flow: 25,
    length: 8,
    radius: 0.3,
    areaOverride: 15,
    fouling: 0.0005
  });

  const materials = [
    { name: 'Copper', k: 401, color: '#b87333' },
    { name: 'Silver', k: 429, color: '#e5e7eb' },
    { name: 'Steel', k: 50, color: '#94a3b8' },
    { name: 'Graphite', k: 140, color: '#334155' },
    { name: 'Glass', k: 1.1, color: '#a5f3fc' },
    { name: 'PVC', k: 0.19, color: '#f1f5f9' }
  ];
  const [mat, setMat] = useState(materials[0]);

  const physics = useMemo(() => {
    const cleanU = (mat.k / 0.05) * (config.flow / 50);
    const U = 1 / ((1 / cleanU) + config.fouling); 
    const Efficiency = (U / cleanU) * 100; // New metric
    const LMTD = (config.tempIn - 40) / Math.log((config.tempIn - 25) / 15 || 1.1);
    const Q = (U * config.areaOverride * LMTD) / 1000;
    const data = Array.from({ length: 11 }, (_, i) => ({ 
      dist: i, 
      Hot: (config.tempIn - (i * (Q/15))).toFixed(1), 
      Cold: (25 + (i * (Q/25))).toFixed(1) 
    }));
    return { Q, LMTD, U, data, Efficiency };
  }, [config, mat]);
<div style={{ 
  display: 'flex', 
  flexDirection: window.innerWidth < 768 ? 'column' : 'row', // This is the "Responsive" magic
  width: '100vw', 
  height: '100vh' 
}}></div>
  return (
    
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#020617', color: '#f1f5f9', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* COLUMN 1: CONFIGURATOR */}
      <div style={{ width: '320px', padding: '24px', background: '#0f172a', borderRight: '1px solid #1e293b' }}>
        <BrandHeader />
        <h2 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>CONFIGURATOR</h2>
        
        {[
          { label: 'UNIT MODEL', value: config.model, type: 'select', key: 'model' },
          { label: 'INLET TEMPERATURE', value: config.tempIn, unit: '°C', key: 'tempIn', min: 40, max: 150 },
          { label: 'MASS FLOW RATE', value: config.flow, unit: 'kg/s', key: 'flow', min: 5, max: 100 },
          { label: 'TOTAL EXCHANGER AREA', value: config.areaOverride, unit: 'm²', key: 'areaOverride', min: 1, max: 50 },
          { label: 'FOULING FACTOR', value: config.fouling.toFixed(4), key: 'fouling', min: 0, max: 0.01, step: 0.0001 },
          { label: 'COMPONENT LENGTH', value: config.length, unit: 'm', key: 'length', min: 2, max: 12 },
          { label: 'COMPONENT RADIUS', value: config.radius, unit: 'm', key: 'radius', min: 0.1, max: 0.6, step: 0.05 },
        ].map((item) => (
          <div key={item.key} style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>{item.label}: {item.value}{item.unit || ''}</label>
            {item.type === 'select' ? (
              <select value={config.model} onChange={e => setConfig({ ...config, model: e.target.value })} style={{ width: '100%', padding: '10px', background: '#020617', color: 'white', border: '1px solid #334155', borderRadius: '4px' }}>
                <option value="ShellTube">Shell and Tube</option>
                <option value="DoublePipe">Double Pipe</option>
                <option value="Plate">Plate Heat Exchanger</option>
                <option value="Finned">Finned Tube</option>
                <option value="Spiral">Spiral Exchanger</option>
              </select>
            ) : (
              <input type="range" min={item.min} max={item.max} step={item.step || 1} value={config[item.key]} onChange={e => setConfig({ ...config, [item.key]: Number(e.target.value) })} style={{ width: '100%', height: '6px', background: '#334155', borderRadius: '5px', appearance: 'none' }} />
            )}
          </div>
        ))}
      </div>

      {/* COLUMN 2: 3D VIEWPORT */}
      <div style={{ flex: 1 }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[8, 5, 8]} />
          <OrbitControls />
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          {React.createElement(Models[config.model], { 
            matColor: mat.color, radius: config.radius, length: config.length, speed: config.flow / 500 + 0.02,
            areaScale: config.areaOverride / 15 
          })}
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* COLUMN 3: ANALYTICS */}
      <div style={{ width: '400px', padding: '24px', background: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4ade80', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>LIVE CALCULATIONS</h2>
        
        <div style={{ background: '#020617', padding: '20px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>HEAT DUTY (Q)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>{physics.Q.toFixed(2)} kW</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>EFFICIENCY</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: physics.Efficiency < 80 ? '#f87171' : '#4ade80' }}>{physics.Efficiency.toFixed(1)}%</div>
            </div>
          </div>
          <div style={{ height: '1px', background: '#1e293b', margin: '15px 0' }} />
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>LMTD: <span style={{ color: '#3b82f6' }}>{physics.LMTD.toFixed(2)} K</span></div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>U-Value: <span style={{ color: '#3b82f6' }}>{physics.U.toFixed(1)} W/m²K</span></div>
          <button onClick={() => setConfig({...config, fouling: 0})} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CLEAN SYSTEM</button>
        </div>

        {/* FULLY VISIBLE GRAPH CONTAINER */}
        <div style={{ flex: 1, position: 'relative', background: '#020617', borderRadius: '8px', border: '1px solid #1e293b', padding: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={physics.data} margin={{ top: 30, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dist" stroke="#94a3b8" tick={{fontSize: 10}}>
                <Label value="DISTANCE ALONG EXCHANGER (m)" offset={-25} position="insideBottom" fill="#94a3b8" fontSize={10} />
              </XAxis>
              <YAxis stroke="#94a3b8" tick={{fontSize: 10}}>
                <Label value="TEMPERATURE (°C)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#94a3b8" fontSize={10} />
              </YAxis>
              <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b' }} />
              <Legend verticalAlign="top" height={40}/>
              <Line name="Cold Fluid" type="monotone" dataKey="Cold" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              <Line name="Hot Fluid" type="monotone" dataKey="Hot" stroke="#f87171" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}