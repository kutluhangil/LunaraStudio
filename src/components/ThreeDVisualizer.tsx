import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface VisualizerProps {
  intensity?: number;
  color?: string;
  speed?: number;
  animationStyle?: 'pulsing' | 'spinning' | 'flowing';
}

const AudioSphere = ({ intensity = 0, color = '#ff2d55', speed = 1, animationStyle = 'flowing' }: VisualizerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (animationStyle === 'spinning') {
        meshRef.current.rotation.x = state.clock.elapsedTime * 2 * speed;
        meshRef.current.rotation.y = state.clock.elapsedTime * 3 * speed;
      } else {
        meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
      }
      
      let scale = 1 + intensity * 1.5;
      if (animationStyle === 'pulsing') {
        scale += Math.sin(state.clock.elapsedTime * 5 * speed) * 0.2;
      }
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={animationStyle === 'flowing' ? 0.8 + intensity * 0.6 : 0.4 + intensity * 0.6}
        speed={(animationStyle === 'flowing' ? 4 : 2) * speed}
        roughness={0.2}
      />
    </mesh>
  );
};

const Particles = ({ intensity = 0, color = '#ff2d55', speed = 1, animationStyle = 'flowing' }: VisualizerProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      if (animationStyle === 'spinning') {
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
        pointsRef.current.rotation.z = state.clock.elapsedTime * 0.5 * speed;
      } else if (animationStyle === 'flowing') {
        pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 * speed) * 2;
      } else {
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05 * speed;
        pointsRef.current.rotation.z = state.clock.elapsedTime * 0.05 * speed;
      }
      
      let scale = 1 + intensity * 0.5;
      if (animationStyle === 'pulsing') {
        scale += Math.sin(state.clock.elapsedTime * 4 * speed) * 0.1;
      }
      pointsRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Points ref={pointsRef} positions={particlesPosition} stride={3}>
      <PointMaterial transparent color={color} size={0.05} sizeAttenuation depthWrite={false} />
    </Points>
  );
};

export const ThreeDVisualizer: React.FC<VisualizerProps> = ({ intensity = 0, color = '#ff2d55', speed = 1, animationStyle = 'flowing' }) => {
  return (
    <div className="absolute inset-0 w-full h-full bg-black rounded-lg overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AudioSphere intensity={intensity} color={color} speed={speed} animationStyle={animationStyle} />
        <Particles intensity={intensity} color={color} speed={speed} animationStyle={animationStyle} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
