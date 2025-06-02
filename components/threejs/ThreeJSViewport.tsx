'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import ThreeJSModel from './ThreeJSModel';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useOpenCascade } from '../../hooks/useOpenCascade';

interface ThreeJSViewportProps {
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
}

export default function ThreeJSViewport({ 
  cameraPosition = [5, 5, 5],
  enableControls = true 
}: ThreeJSViewportProps) {
  const { modelUrl, isLoading, error } = useOpenCascade();

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ 
          position: cameraPosition, 
          fov: 75 
        }}
        shadows
      >
        {/* ライティング設定 */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          castShadow 
          intensity={1}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* 環境設定 */}
        <Environment preset="studio" />
        
        {/* 3Dモデル表示 */}
        <Suspense fallback={null}>
          {modelUrl && <ThreeJSModel url={modelUrl} />}
        </Suspense>
        
        {/* カメラコントロール */}
        {enableControls && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            dampingFactor={0.05}
            enableDamping={true}
          />
        )}
      </Canvas>
    </div>
  );
} 