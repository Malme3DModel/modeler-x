'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { CADShape } from '@/types/worker';
import * as THREE from 'three';
import CameraControls from '@/components/cad/CameraControls';
import { ViewSettings, defaultViewSettings, useViewSettings } from '@/hooks/useViewSettings';

interface CascadeViewportProps {
  shapes: CADShape[];
  viewSettings?: Partial<ViewSettings>;
}

interface ShapeMeshProps {
  shape: CADShape;
  wireframe?: boolean;
}

// CADシェイプを表示するコンポーネント
function ShapeMesh({ shape, wireframe = false }: ShapeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!shape) return;

    // メッシュの設定
    if (shape.mesh && meshRef.current) {
      const { vertices, normals, indices } = shape.mesh;
      
      if (vertices && indices) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        if (normals) {
          geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        } else {
          geometry.computeVertexNormals();
        }
        
        geometry.setIndex(Array.from(indices));
        
        meshRef.current.geometry.dispose();
        meshRef.current.geometry = geometry;
      }
    }

    // エッジの設定
    if (shape.edges && edgesRef.current) {
      const { vertices } = shape.edges;
      
      if (vertices) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        edgesRef.current.geometry.dispose();
        edgesRef.current.geometry = geometry;
      }
    }
  }, [shape]);

  return (
    <>
      {/* CADメッシュ */}
      {shape.mesh && (
        <mesh ref={meshRef} castShadow receiveShadow>
          <bufferGeometry />
          <meshStandardMaterial 
            color="#6b9bd7" 
            roughness={0.5} 
            metalness={0.5}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      )}

      {/* CADエッジ */}
      {shape.edges && (
        <lineSegments ref={edgesRef}>
          <bufferGeometry />
          <lineBasicMaterial color="#000000" linewidth={1} />
        </lineSegments>
      )}
    </>
  );
}

// 3Dシーン設定コンポーネント
function SceneSetup({ viewSettings }: { viewSettings: ViewSettings }) {
  const { camera } = useThree();
  
  useEffect(() => {
    // カメラ初期位置設定
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(100, 100, 100);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // 設定値をマージ
  const settings = { ...defaultViewSettings, ...viewSettings };

  // カメラビューを設定するコールバック
  const handleSetView = (viewName: string) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      switch (viewName) {
        case 'front':
          camera.position.set(0, 0, 100);
          camera.up.set(0, 1, 0);
          break;
        case 'back':
          camera.position.set(0, 0, -100);
          camera.up.set(0, 1, 0);
          break;
        case 'left':
          camera.position.set(-100, 0, 0);
          camera.up.set(0, 1, 0);
          break;
        case 'right':
          camera.position.set(100, 0, 0);
          camera.up.set(0, 1, 0);
          break;
        case 'top':
          camera.position.set(0, 100, 0);
          camera.up.set(0, 0, -1);
          break;
        case 'bottom':
          camera.position.set(0, -100, 0);
          camera.up.set(0, 0, 1);
          break;
        case 'iso':
          camera.position.set(70, 70, 70);
          camera.up.set(0, 1, 0);
          break;
      }
      camera.lookAt(0, 0, 0);
    }
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={45} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      
      {/* カメラコントロールを追加 */}
      <CameraControls onSetView={handleSetView} />
      
      {/* 環境光 */}
      {settings.ambientLight && (
        <ambientLight intensity={settings.ambientLightIntensity} />
      )}
      
      {/* 平行光源 */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow={settings.shadows}
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* グリッド */}
      {settings.grid && (
        <Grid 
          args={[200, 200, 20, 20]} 
          position={[0, 0.01, 0]}
          cellColor="#aaa"
          sectionColor="#888"
        />
      )}
      
      {/* 地面平面 */}
      {settings.groundPlane && (
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <shadowMaterial opacity={0.2} color="#000" />
        </mesh>
      )}
      
      {/* 軸表示 */}
      {settings.axes && (
        <axesHelper args={[50]} />
      )}
      
      {/* 環境マップ */}
      <Environment preset="sunset" />
    </>
  );
}

// メインビューポートコンポーネント
export default function CascadeViewport({ 
  shapes = [], 
  viewSettings = {}
}: CascadeViewportProps) {
  // useViewSettingsフックを使用して設定管理
  const { viewSettings: currentSettings, updateSetting, toggleSetting } = 
    useViewSettings({...defaultViewSettings, ...viewSettings});
  
  // ワイヤーフレーム表示切替のハンドラー
  const toggleWireframe = () => toggleSetting('wireframe');
  
  // シャドウ表示切替のハンドラー
  const toggleShadows = () => toggleSetting('shadows');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ビューポート設定コントロールパネル（オプション） */}
      <div className="absolute bottom-2 left-2 z-10 bg-gray-800 bg-opacity-80 p-1 rounded shadow-lg text-white text-sm">
        <label className="flex items-center mb-1">
          <input 
            type="checkbox" 
            checked={currentSettings.wireframe} 
            onChange={toggleWireframe}
            className="mr-2"
          />
          ワイヤーフレーム
        </label>
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={currentSettings.shadows} 
            onChange={toggleShadows}
            className="mr-2"
          />
          シャドウ
        </label>
      </div>

      <Canvas 
        shadows={currentSettings.shadows} 
        gl={{ antialias: true }}
        style={{ background: currentSettings.backgroundColor }}
      >
        <SceneSetup viewSettings={currentSettings} />
        
        {/* CADシェイプを表示 */}
        {shapes.map((shape, i) => (
          <ShapeMesh 
            key={i} 
            shape={shape} 
            wireframe={currentSettings.wireframe} 
          />
        ))}
      </Canvas>
    </div>
  );
} 