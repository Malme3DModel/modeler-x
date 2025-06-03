import { useRef, useEffect, useState } from 'react';
import { Group, Mesh, Box3, BufferGeometry, BufferAttribute, MeshStandardMaterial } from 'three';
import { useMatCapMaterial } from './materials/MatCapMaterial';
import { useFrame } from '@react-three/fiber';

interface ThreeJSModelProps {
  url: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  transparent?: boolean;
  opacity?: number;
}

export default function ThreeJSModel({ 
  url, 
  scale = [1, 1, 1], 
  position = [0, 0, 0],
  transparent = false,
  opacity = 1.0
}: ThreeJSModelProps) {
  const groupRef = useRef<Group>(null);
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  
  // MatCapマテリアルを使用
  const matcapMaterial = useMatCapMaterial({ 
    color: '#f5f5f5',
    transparent: transparent,
    opacity: opacity
  });

  // JSONデータを読み込む
  useEffect(() => {
    if (!url) return;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        try {
          // BufferGeometryを作成
          const bufferGeometry = new BufferGeometry();
          
          // 頂点情報を設定
          if (data.vertices && data.vertices.length > 0) {
            bufferGeometry.setAttribute(
              'position',
              new BufferAttribute(new Float32Array(data.vertices), 3)
            );
          }
          
          // インデックス情報を設定
          if (data.indices && data.indices.length > 0) {
            bufferGeometry.setIndex(data.indices);
          }
          
          // 法線情報を設定
          if (data.normals && data.normals.length > 0) {
            bufferGeometry.setAttribute(
              'normal',
              new BufferAttribute(new Float32Array(data.normals), 3)
            );
          } else {
            // 法線が無い場合は計算
            bufferGeometry.computeVertexNormals();
          }
          
          setGeometry(bufferGeometry);
        } catch (error) {
          console.error('ジオメトリ作成エラー:', error);
        }
      })
      .catch(error => {
        console.error('JSONデータ読み込みエラー:', error);
      });
  }, [url]);

  // バウンディングボックスの計算と保存
  useFrame(() => {
    if (groupRef.current) {
      const box = new Box3().setFromObject(groupRef.current);
      
      // グローバルオブジェクトにバウンディングボックスを保存
      if ((window as any).cascadeTestUtils) {
        (window as any).cascadeTestUtils.boundingBox = box;
      }
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={position}>
      {geometry && (
        <mesh geometry={geometry} material={matcapMaterial} castShadow receiveShadow />
      )}
    </group>
  );
} 