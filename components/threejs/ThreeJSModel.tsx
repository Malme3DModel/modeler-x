import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';

interface ThreeJSModelProps {
  url: string;
  scale?: [number, number, number];
  position?: [number, number, number];
}

export default function ThreeJSModel({ 
  url, 
  scale = [1, 1, 1], 
  position = [0, 0, 0] 
}: ThreeJSModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      // モデルのマテリアル設定
      groupRef.current.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // マテリアルの調整（型安全に）
          if (child.material && child.material instanceof MeshStandardMaterial) {
            child.material.roughness = 0.7;
            child.material.metalness = 0.3;
          }
        }
      });
    }
  }, []);

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  );
} 