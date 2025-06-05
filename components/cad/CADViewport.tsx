'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Plane } from '@react-three/drei';
import { Suspense, useMemo, useEffect, useCallback } from 'react';
import { useCADWorker } from '@/hooks/useCADWorker';
import * as THREE from 'three';
import type { CADShape } from '@/types/worker';
import FileIOControls from './FileIOControls';
import { CameraControls } from './CameraControls';

// CAD形状を表示するコンポーネント
function CADShape({ shape }: { shape: CADShape }) {
  // デバッグログを追加
  console.log('🎨 [CADShape] Rendering shape:', shape);
  console.log('🎨 [CADShape] Mesh data:', shape.mesh);
  
  // メッシュデータからThree.jsジオメトリを作成
  const geometry = useMemo(() => {
    if (!shape.mesh) {
      console.log('⚠️ [CADShape] No mesh data available');
      return null;
    }
    
    console.log('🔧 [CADShape] Creating geometry from mesh data...');
    console.log('🔧 [CADShape] Vertices length:', shape.mesh.vertices?.length);
    console.log('🔧 [CADShape] Normals length:', shape.mesh.normals?.length);
    console.log('🔧 [CADShape] Indices length:', shape.mesh.indices?.length);
    
    const geo = new THREE.BufferGeometry();
    
    // 頂点データを設定
    if (shape.mesh.vertices && shape.mesh.vertices.length > 0) {
      geo.setAttribute('position', new THREE.BufferAttribute(shape.mesh.vertices, 3));
      console.log('✅ [CADShape] Position attribute set');
    } else {
      console.error('❌ [CADShape] No vertices data');
      return null;
    }
    
    // 法線データを設定
    if (shape.mesh.normals && shape.mesh.normals.length > 0) {
      geo.setAttribute('normal', new THREE.BufferAttribute(shape.mesh.normals, 3));
      console.log('✅ [CADShape] Normal attribute set');
    } else {
      console.log('⚠️ [CADShape] No normals data, computing normals...');
      geo.computeVertexNormals();
    }
    
    // インデックスデータを設定
    if (shape.mesh.indices && shape.mesh.indices.length > 0) {
      geo.setIndex(new THREE.BufferAttribute(shape.mesh.indices, 1));
      console.log('✅ [CADShape] Index attribute set');
    } else {
      console.log('⚠️ [CADShape] No indices data');
    }
    
    // バウンディングボックスを計算
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    console.log('✅ [CADShape] Geometry created successfully');
    console.log('📊 [CADShape] Geometry stats:', {
      vertices: geo.attributes.position?.count,
      triangles: geo.index ? geo.index.count / 3 : 'No indices',
      boundingBox: geo.boundingBox,
      boundingSphere: geo.boundingSphere
    });
    
    return geo;
  }, [shape.mesh]);

  // エッジジオメトリを作成
  const edgeGeometry = useMemo(() => {
    if (!shape.edges) {
      console.log('⚠️ [CADShape] No edges data');
      return null;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shape.edges.vertices, 3));
    
    console.log('✅ [CADShape] Edge geometry created');
    return geo;
  }, [shape.edges]);

  if (!geometry) {
    console.log('❌ [CADShape] No geometry to render');
    return null;
  }

  console.log('🎨 [CADShape] Rendering mesh with geometry');

  return (
    <group>
      {/* メイン形状（面） */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#4A90E2"
          metalness={0.1}
          roughness={0.3}
          transparent={true}
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* エッジライン */}
      {edgeGeometry && (
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#2C3E50" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}

// グリッドと地面を表示するコンポーネント
function GroundPlane() {
  return (
    <group>
      {/* グリッド */}
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#444444"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      
      {/* 地面 */}
      <Plane
        args={[200, 200]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#f0f0f0"
          transparent={true}
          opacity={0.1}
        />
      </Plane>
    </group>
  );
}

// ローディング表示コンポーネント
function LoadingIndicator() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">CAD形状を処理中...</span>
        </div>
      </div>
    </div>
  );
}

// メインのCADViewportコンポーネント
interface CADViewportProps {
  className?: string;
  showGrid?: boolean;
  showGroundPlane?: boolean;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

export default function CADViewport({
  className = "w-full h-96",
  showGrid = true,
  showGroundPlane = true,
  cameraPosition = [50, 100, 150],
  cameraTarget = [0, 45, 0],
  cadWorkerState
}: CADViewportProps) {
  const { shapes, isWorking, error } = cadWorkerState;

  // shapes配列の変更を監視するuseEffect
  useEffect(() => {
    console.log('🔄 [CADViewport] Shapes array updated:', shapes);
    console.log('🔄 [CADViewport] Shapes count:', shapes.length);
    if (shapes.length > 0) {
      console.log('🔄 [CADViewport] First shape:', shapes[0]);
      console.log('🔄 [CADViewport] First shape mesh:', shapes[0]?.mesh);
    }
  }, [shapes]);

  // デバッグログを追加
  console.log('🖼️ [CADViewport] Rendering viewport');
  console.log('🖼️ [CADViewport] Shapes count:', shapes.length);
  console.log('🖼️ [CADViewport] Shapes data:', shapes);
  console.log('🖼️ [CADViewport] Is working:', isWorking);
  console.log('🖼️ [CADViewport] Error:', error);

  return (
    <div className={`relative ${className} bg-gray-100 rounded-lg overflow-hidden border`}>
      {/* ローディング表示 */}
      {isWorking && <LoadingIndicator />}
      
      {/* エラー表示 */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="alert alert-error">
            <span>❌ {error}</span>
          </div>
        </div>
      )}
      
      {/* デバッグ情報表示 */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-30">
        <div>Shapes: {shapes.length}</div>
        <div>Working: {isWorking ? 'Yes' : 'No'}</div>
        {shapes.length > 0 && shapes[0]?.mesh && (
          <div>
            <div>Vertices: {Math.floor(shapes[0].mesh.vertices.length / 3)}</div>
            <div>Triangles: {shapes[0].mesh.indices ? Math.floor(shapes[0].mesh.indices.length / 3) : 'N/A'}</div>
          </div>
        )}
      </div>
      
      {/* サイドパネル */}
      <div className="absolute top-2 right-2 w-64 space-y-2 z-10">
        {/* ファイルI/Oコントロール */}
        <FileIOControls cadWorkerState={cadWorkerState} />
        
        {/* カメラコントロール */}
        {/* <CameraControls 
          boundingBox={null}
          onFitToObject={() => console.log('フィットオブジェクト')}
        /> */}
      </div>
      
      {/* 3Dビューポート */}
      <Canvas
        shadows
        camera={{
          position: cameraPosition,
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true
        }}
      >
        {/* ライティング設定（CascadeStudio風） */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[6, 50, -12]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* 追加のライティング */}
        <directionalLight
          position={[-6, 30, 12]}
          intensity={0.3}
        />
        
        {/* グリッドと地面 */}
        {(showGrid || showGroundPlane) && <GroundPlane />}
        
        {/* CAD形状表示 */}
        <Suspense fallback={null}>
          {shapes.length > 0 ? (
            shapes.map((shape, index) => {
              console.log(`🎨 [CADViewport] Rendering shape ${index}:`, shape);
              return (
                <CADShape key={`${shape.hash}-${index}`} shape={shape} />
              );
            })
          ) : (
            <group>
              {/* 形状がない場合のプレースホルダー */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#cccccc" transparent opacity={0.3} />
              </mesh>
            </group>
          )}
        </Suspense>
        
        {/* カメラコントロール */}
        <OrbitControls
          target={cameraTarget}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          enableDamping={true}
          minDistance={10}
          maxDistance={500}
          maxPolarAngle={Math.PI * 0.9}
        />
      </Canvas>
      
      {/* 形状情報表示 */}
      {shapes.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded p-2 text-sm">
          <div className="font-semibold">形状情報:</div>
          <div>{shapes.length} 個の形状</div>
          {shapes[0]?.mesh && (
            <div className="text-xs text-gray-600">
              頂点: {Math.floor(shapes[0].mesh.vertices.length / 3)} 個
              {shapes[0].mesh.indices && (
                <div>三角形: {Math.floor(shapes[0].mesh.indices.length / 3)} 個</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 