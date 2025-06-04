'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { CADShape } from '@/types/worker';
import * as THREE from 'three';
import { CameraControls } from '../cad/CameraControls';
import { useCameraAnimation } from '../../hooks/useCameraAnimation';
import { ViewSettings, defaultViewSettings, useViewSettings } from '@/hooks/useViewSettings';

interface CascadeViewportProps {
  shapes: CADShape[];
  viewSettings?: Partial<ViewSettings>;
}

interface ShapeMeshProps {
  shape: CADShape;
  wireframe?: boolean;
}

// OrbitControlsの型を拡張
type OrbitControlsType = {
  target: THREE.Vector3;
  update: () => void;
  fitToSphere?: (sphere: THREE.Sphere, enableTransition?: boolean) => void;
};

// React Three Fiberのキャンバス要素拡張型
interface ExtendedHTMLCanvasElement extends HTMLCanvasElement {
  __r3f?: {
    controls: OrbitControlsType;
    camera: THREE.PerspectiveCamera;
  };
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

// レイキャスティング機能コンポーネント
function RaycastingHandler({ 
  shapes, 
  isRaycastingEnabled, 
  onHoverObject, 
  onHoverFace 
}: {
  shapes: CADShape[];
  isRaycastingEnabled: boolean;
  onHoverObject: (object: THREE.Object3D | null) => void;
  onHoverFace: (face: number | null) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useFrame(() => {
    if (shapes.length === 0 || !isRaycastingEnabled) return;

    // カメラとマウス座標からレイを発射
    raycaster.current.setFromCamera(mouse.current, camera);

    // 3Dオブジェクトとの交差判定
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      // ハイライト処理（次のタスクで詳細実装）
      onHoverObject(intersection.object);

      // フェイスインデックスの取得
      if (intersection.face) {
        onHoverFace(intersection.faceIndex || 0);
      }

      // テスト用のデータ属性を追加
      intersection.object.userData.isHovered = true;
      intersection.object.userData.hoveredFace = intersection.faceIndex;
    } else {
      // ハイライト解除
      onHoverObject(null);
      onHoverFace(null);
    }
  });

  // マウス座標を更新する関数をグローバルに公開
  useEffect(() => {
    const updateMousePosition = (clientX: number, clientY: number, rect: DOMRect) => {
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    // グローバルオブジェクトに関数を登録
    (window as any).cascadeRaycastingUtils = {
      updateMousePosition,
      getCurrentMousePosition: () => ({ x: mouse.current.x, y: mouse.current.y }),
    };

    return () => {
      delete (window as any).cascadeRaycastingUtils;
    };
  }, []);

  return null;
}

// 3Dシーン設定コンポーネント
function SceneSetup({ viewSettings, onCameraSetup }: { 
  viewSettings: ViewSettings;
  onCameraSetup?: (setViewFn: (viewName: string) => void) => void;
}) {
  const { camera, controls } = useThree();
  
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
  const handleSetView = useCallback((viewName: string) => {
    if (!controls || !camera) return;
    
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
        case 'fit':
          // オブジェクトにフィットするビュー
          // OrbitControlsのfitToSphereメソッドを安全に呼び出す
          try {
            // @ts-ignore - Three.js/R3Fの型定義の問題を回避
            if (controls.fitToSphere) {
              // @ts-ignore
              controls.fitToSphere(new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100), true);
            }
          } catch (e) {
            console.error('fitToSphereメソッドの呼び出しに失敗しました', e);
          }
          break;
      }
      
      if (viewName !== 'fit') {
        camera.lookAt(0, 0, 0);
      }
      
      // OrbitControlsのupdateメソッドを安全に呼び出す
      try {
        // @ts-ignore - Three.js/R3Fの型定義の問題を回避
        if (controls.update) {
          // @ts-ignore
          controls.update();
        }
      } catch (e) {
        console.error('updateメソッドの呼び出しに失敗しました', e);
      }
    }
  }, [camera, controls]);

  // 外部からカメラ制御関数を利用できるようにする
  useEffect(() => {
    if (onCameraSetup) {
      onCameraSetup(handleSetView);
    }
  }, [handleSetView, onCameraSetup]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={45} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      
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

  // レイキャスティング状態の管理
  const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);
  const [isRaycastingEnabled, setIsRaycastingEnabled] = useState(true);
  
  // カメラ制御関数の参照を保持
  const [setViewFn, setSetViewFn] = useState<((viewName: string) => void) | null>(null);
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  
  // Three.jsシーンからカメラ制御関数を受け取るコールバック
  const handleCameraSetup = useCallback((fn: (viewName: string) => void) => {
    setSetViewFn(() => fn);
  }, []);

  // UI側でのカメラビュー変更ハンドラー
  const handleViewChange = useCallback((viewName: string) => {
    if (setViewFn) {
      setViewFn(viewName);
    }
  }, [setViewFn]);

  // マウスイベントハンドラーの実装
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isRaycastingEnabled) return;

    // マウス座標の正規化（-1 to 1の範囲）
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // グローバル関数経由でマウス座標を更新
    if ((window as any).cascadeRaycastingUtils) {
      (window as any).cascadeRaycastingUtils.updateMousePosition(event.clientX, event.clientY, rect);
    }
  }, [isRaycastingEnabled]);

  // ハイライト処理の実装
  const handleHoverObject = useCallback((object: THREE.Object3D | null) => {
    // 前のオブジェクトのハイライトを解除
    if (hoveredObject && hoveredObject !== object) {
      hoveredObject.userData.isHovered = false;
      hoveredObject.userData.hoveredFace = null;
    }
    setHoveredObject(object);
  }, [hoveredObject]);

  const handleHoverFace = useCallback((face: number | null) => {
    setHoveredFace(face);
  }, []);

  // テスト用のアクセス機能追加
  useEffect(() => {
    // グローバルオブジェクトにテスト用関数を登録
    (window as any).cascadeTestUtils = {
      getRaycastingState: () => ({
        isEnabled: isRaycastingEnabled,
        hoveredObject: hoveredObject?.uuid || null,
        hoveredFace: hoveredFace,
      }),
      enableRaycasting: () => setIsRaycastingEnabled(true),
      disableRaycasting: () => setIsRaycastingEnabled(false),
    };

    return () => {
      delete (window as any).cascadeTestUtils;
    };
  }, [isRaycastingEnabled, hoveredObject, hoveredFace]);

  // デバッグ用の状態表示
  useEffect(() => {
    if (hoveredObject) {
      console.log('🎯 ホバー中オブジェクト:', hoveredObject.name || 'Unnamed', hoveredObject.uuid);
    }
    if (hoveredFace !== null) {
      console.log('📐 ホバー中フェイス番号:', hoveredFace);
    }
  }, [hoveredObject, hoveredFace]);
  
  // バウンディングボックスの計算
  useEffect(() => {
    if (shapes.length > 0) {
      const box = new THREE.Box3();
      shapes.forEach(shape => {
        if (shape.mesh?.vertices) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(shape.mesh.vertices, 3));
          const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
          const tempBox = new THREE.Box3().setFromBufferAttribute(positionAttribute);
          box.union(tempBox);
        }
      });
      setBoundingBox(box);
    } else {
      setBoundingBox(null);
    }
  }, [shapes]);

  // パフォーマンス最適化のためにCanvasをメモ化
  const canvasContent = useMemo(() => (
    <Canvas 
      shadows={currentSettings.shadows} 
      gl={{ antialias: true }}
      style={{ background: currentSettings.backgroundColor }}
      dpr={[1, 2]} // デバイスピクセル比の制限（パフォーマンス向上）
      performance={{ min: 0.5 }} // 低パフォーマンス時の最小更新レート
      data-testid="cascade-3d-viewport"
      onMouseMove={handleMouseMove}
    >
      <SceneSetup 
        viewSettings={currentSettings} 
        onCameraSetup={handleCameraSetup}
      />
      <ShapesList shapes={shapes} wireframe={currentSettings.wireframe} />
      <RaycastingHandler 
        shapes={shapes}
        isRaycastingEnabled={isRaycastingEnabled}
        onHoverObject={handleHoverObject}
        onHoverFace={handleHoverFace}
      />
    </Canvas>
  ), [
    shapes, 
    currentSettings, 
    isRaycastingEnabled, 
    handleMouseMove, 
    handleHoverObject, 
    handleHoverFace,
    handleCameraSetup
  ]);
  
  // ワイヤーフレーム表示切替のハンドラー
  const toggleWireframe = () => toggleSetting('wireframe');
  
  // シャドウ表示切替のハンドラー
  const toggleShadows = () => toggleSetting('shadows');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* HTMLのカメラコントロールUI - Canvasの外側にレンダリング */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-gray-800 bg-opacity-80 rounded shadow-lg">
          {/* カメラコントロールコンポーネント */}
          <CameraControlsWithFitComponent boundingBox={boundingBox} />
        </div>
      </div>
      
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
        <label className="flex items-center mb-1">
          <input 
            type="checkbox" 
            checked={currentSettings.shadows} 
            onChange={toggleShadows}
            className="mr-2"
          />
          シャドウ
        </label>
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={isRaycastingEnabled} 
            onChange={() => setIsRaycastingEnabled(!isRaycastingEnabled)}
            className="mr-2"
          />
          レイキャスティング
        </label>
      </div>

      {/* キャンバス本体 */}
      {canvasContent}
    </div>
  );
}

// CameraControlsWithFitコンポーネントを別途定義
function CameraControlsWithFitComponent({ boundingBox }: { boundingBox: THREE.Box3 | null }) {
  const { fitToObject } = useCameraAnimation();

  const handleFitToObject = useCallback(() => {
    if (boundingBox) {
      fitToObject(boundingBox);
    }
  }, [boundingBox, fitToObject]);

  return (
    <CameraControls 
      onFitToObject={handleFitToObject}
      boundingBox={boundingBox}
    />
  );
}