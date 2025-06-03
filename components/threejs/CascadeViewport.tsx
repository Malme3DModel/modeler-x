'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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

// CADシェイプを表示するコンポーネント（メモ化で最適化）
const ShapeMesh = React.memo(function ShapeMesh({ shape, wireframe = false }: ShapeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  
  // ジオメトリの生成をメモ化
  const [meshGeometry, edgesGeometry] = useMemo(() => {
    // メッシュジオメトリ
    let meshGeo: THREE.BufferGeometry | null = null;
    if (shape.mesh?.vertices && shape.mesh?.indices) {
      meshGeo = new THREE.BufferGeometry();
      meshGeo.setAttribute('position', new THREE.Float32BufferAttribute(shape.mesh.vertices, 3));
      
      if (shape.mesh.normals) {
        meshGeo.setAttribute('normal', new THREE.Float32BufferAttribute(shape.mesh.normals, 3));
      } else {
        meshGeo.computeVertexNormals();
      }
      
      meshGeo.setIndex(Array.from(shape.mesh.indices));
    }
    
    // エッジジオメトリ
    let edgesGeo: THREE.BufferGeometry | null = null;
    if (shape.edges?.vertices) {
      edgesGeo = new THREE.BufferGeometry();
      edgesGeo.setAttribute('position', new THREE.Float32BufferAttribute(shape.edges.vertices, 3));
    }
    
    return [meshGeo, edgesGeo];
  }, [shape]);

  // マテリアルのメモ化
  const meshMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: '#6b9bd7', 
      roughness: 0.5, 
      metalness: 0.5,
      side: THREE.DoubleSide,
      wireframe 
    }),
  [wireframe]);
  
  const edgesMaterial = useMemo(() => 
    new THREE.LineBasicMaterial({ 
      color: '#000000', 
      linewidth: 1 
    }),
  []);

  // ジオメトリが変更されたら3Dオブジェクトを更新
  useEffect(() => {
    if (meshGeometry && meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = meshGeometry;
    }
    
    if (edgesGeometry && edgesRef.current) {
      edgesRef.current.geometry.dispose();
      edgesRef.current.geometry = edgesGeometry;
    }
  }, [meshGeometry, edgesGeometry]);

  return (
    <>
      {/* CADメッシュ */}
      {meshGeometry && (
        <mesh ref={meshRef} castShadow receiveShadow>
          <primitive attach="geometry" object={meshGeometry} />
          <primitive attach="material" object={meshMaterial} />
        </mesh>
      )}

      {/* CADエッジ */}
      {edgesGeometry && (
        <lineSegments ref={edgesRef}>
          <primitive attach="geometry" object={edgesGeometry} />
          <primitive attach="material" object={edgesMaterial} />
        </lineSegments>
      )}
    </>
  );
});

// 3Dシーン設定コンポーネント
function SceneSetup({ viewSettings }: { viewSettings: ViewSettings }) {
  const { camera } = useThree();
  
  // カメラ位置の初期設定
  useEffect(() => {
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

// シェイプリストを表示するコンポーネント（メモ化）
const ShapesList = React.memo(function ShapesList({ 
  shapes, 
  wireframe 
}: { 
  shapes: CADShape[], 
  wireframe: boolean 
}) {
  return (
    <>
      {shapes.map((shape, i) => (
        <ShapeMesh 
          key={shape.hash || `shape-${i}`} 
          shape={shape} 
          wireframe={wireframe} 
        />
      ))}
    </>
  );
});

// メインビューポートコンポーネント
export default function CascadeViewport({ 
  shapes = [], 
  viewSettings = {}
}: CascadeViewportProps) {
  // useViewSettingsフックを使用して設定管理
  const { viewSettings: currentSettings, updateSetting, toggleSetting } = 
    useViewSettings({...defaultViewSettings, ...viewSettings});
  
  // パフォーマンス最適化のためにCanvasをメモ化
  const canvasContent = useMemo(() => (
    <Canvas 
      shadows={currentSettings.shadows} 
      gl={{ antialias: true }}
      style={{ background: currentSettings.backgroundColor }}
      dpr={[1, 2]} // デバイスピクセル比の制限（パフォーマンス向上）
      performance={{ min: 0.5 }} // 低パフォーマンス時の最小更新レート
    >
      <SceneSetup viewSettings={currentSettings} />
      <ShapesList shapes={shapes} wireframe={currentSettings.wireframe} />
    </Canvas>
  ), [shapes, currentSettings]);
  
  // ワイヤーフレーム表示切替のハンドラー
  const toggleWireframe = () => toggleSetting('wireframe');
  
  // シャドウ表示切替のハンドラー
  const toggleShadows = () => toggleSetting('shadows');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ビューポート設定コントロールパネル */}
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

      {/* キャンバス本体 */}
      {canvasContent}
    </div>
  );
} 