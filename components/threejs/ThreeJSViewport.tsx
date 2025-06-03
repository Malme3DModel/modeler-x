'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useRef, useState, useCallback, useEffect, Dispatch, SetStateAction, useMemo } from 'react';
import ThreeJSModel from './ThreeJSModel';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useOpenCascade } from '../../hooks/useOpenCascade';
import * as THREE from 'three';
import { useIsClient } from '../../hooks/useIsClient';
import HoverTooltip from './HoverTooltip';

interface ThreeJSViewportProps {
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
}

interface RaycastingHandlerProps {
  isRaycastingEnabled: boolean;
  setIsRaycastingEnabled: Dispatch<SetStateAction<boolean>>;
}

// レイキャスティング機能コンポーネント
function RaycastingHandler({ isRaycastingEnabled = true, setIsRaycastingEnabled }: RaycastingHandlerProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const [hoveredObject, setHoveredObject] = useState<THREE.Mesh | null>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);
  const hoveredEdgeRef = useRef<THREE.LineSegments | null>(null);
  
  // ハイライト用マテリアル
  const highlightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x3399ff, 
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  }), []);
  
  // エッジハイライト用マテリアル
  const edgeHighlightMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: 0xff9900,
    linewidth: 2
  }), []);

  // 元のマテリアルを保存する参照
  const originalMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const originalEdgeMaterials = useRef<Map<string, THREE.Material>>(new Map());

  // マテリアル変更処理をメモ化
  const updateMaterial = useCallback((
    object: THREE.Mesh | null,
    newObject: THREE.Mesh | null,
    materials: React.MutableRefObject<Map<string, THREE.Material | THREE.Material[]>>,
    highlightMat: THREE.Material
  ) => {
    // 前回のハイライトがあれば元のマテリアルに戻す
    if (object && materials.current.has(object.uuid)) {
      object.material = materials.current.get(object.uuid)!;
      materials.current.delete(object.uuid);
    }
    
    // 新しいオブジェクトをハイライト
    if (newObject && newObject.material) {
      // 元のマテリアルを保存
      materials.current.set(newObject.uuid, newObject.material);
      // ハイライト用マテリアルに変更
      newObject.material = highlightMat;
    }
  }, []);
  
  // エッジ検出用の特殊レイキャスト処理
  const detectEdge = useCallback((raycaster: THREE.Raycaster, scene: THREE.Scene) => {
    // シーン内のLineSegmentsオブジェクトを探す
    const lineObjects = scene.children.filter(
      obj => obj instanceof THREE.LineSegments
    ) as THREE.LineSegments[];
    
    if (lineObjects.length === 0) return null;
    
    // LineSegmentsとの交差判定
    const intersects = raycaster.intersectObjects(lineObjects, true);
    
    if (intersects.length > 0) {
      return intersects[0].object as THREE.LineSegments;
    }
    
    return null;
  }, []);

  // レイキャスト処理の最適化
  const performRaycast = useCallback((
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    scene: THREE.Scene,
    mousePos: THREE.Vector2
  ) => {
    raycaster.setFromCamera(mousePos, camera);
    return raycaster.intersectObjects(scene.children, true);
  }, []);

  useFrame(() => {
    if (!isRaycastingEnabled) return;

    // カメラとマウス座標からレイを発射
    const intersects = performRaycast(raycaster.current, camera, scene, mouse.current);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const object = intersection.object as THREE.Mesh;
      
      // 前回のハイライトと異なるオブジェクトの場合
      if (hoveredObject !== object) {
        // マテリアル更新
        updateMaterial(hoveredObject, object, originalMaterials, highlightMaterial);
        setHoveredObject(object);
      }
      
      // フェイスインデックスの更新
      if (intersection.face) {
        setHoveredFace(intersection.faceIndex || 0);
      }

      // テスト用のデータ属性を追加
      intersection.object.userData.isHovered = true;
      intersection.object.userData.hoveredFace = intersection.faceIndex;
    } else {
      // ホバー解除
      if (hoveredObject) {
        // マテリアル更新
        updateMaterial(hoveredObject, null, originalMaterials, highlightMaterial);
        hoveredObject.userData.isHovered = false;
        hoveredObject.userData.hoveredFace = null;
        setHoveredObject(null);
        setHoveredFace(null);
      }
    }
    
    // エッジ検出とハイライト
    const hoveredEdge = detectEdge(raycaster.current, scene);

    if (hoveredEdge) {
      // 前回のエッジハイライトと異なる場合
      if (hoveredEdgeRef.current !== hoveredEdge) {
        // 前回のハイライトがあれば元に戻す
        if (hoveredEdgeRef.current && originalEdgeMaterials.current.has(hoveredEdgeRef.current.uuid)) {
          hoveredEdgeRef.current.material = originalEdgeMaterials.current.get(hoveredEdgeRef.current.uuid)!;
          originalEdgeMaterials.current.delete(hoveredEdgeRef.current.uuid);
        }
        
        // 新しいエッジをハイライト
        originalEdgeMaterials.current.set(hoveredEdge.uuid, hoveredEdge.material as THREE.Material);
        hoveredEdge.material = edgeHighlightMaterial;
        
        hoveredEdgeRef.current = hoveredEdge;
      }
    } else if (hoveredEdgeRef.current) {
      // エッジからマウスが離れた場合
      if (originalEdgeMaterials.current.has(hoveredEdgeRef.current.uuid)) {
        hoveredEdgeRef.current.material = originalEdgeMaterials.current.get(hoveredEdgeRef.current.uuid)!;
        originalEdgeMaterials.current.delete(hoveredEdgeRef.current.uuid);
      }
      hoveredEdgeRef.current = null;
    }
  });

  // コンポーネントのアンマウント時に元のマテリアルに戻す
  useEffect(() => {
    return () => {
      // フェイスのマテリアルを元に戻す
      if (hoveredObject && originalMaterials.current.has(hoveredObject.uuid)) {
        hoveredObject.material = originalMaterials.current.get(hoveredObject.uuid)!;
        originalMaterials.current.delete(hoveredObject.uuid);
      }
      
      // エッジのマテリアルを元に戻す
      if (hoveredEdgeRef.current && originalEdgeMaterials.current.has(hoveredEdgeRef.current.uuid)) {
        hoveredEdgeRef.current.material = originalEdgeMaterials.current.get(hoveredEdgeRef.current.uuid)!;
        originalEdgeMaterials.current.delete(hoveredEdgeRef.current.uuid);
      }
    };
  }, []);

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

    // テスト用のアクセス機能追加
    (window as any).cascadeTestUtils = {
      getRaycastingState: () => ({
        isEnabled: isRaycastingEnabled,
        hoveredObject: hoveredObject?.uuid || null,
        hoveredFace: hoveredFace,
      }),
      enableRaycasting: () => setIsRaycastingEnabled(true),
      disableRaycasting: () => setIsRaycastingEnabled(false),
    };

    // デバッグログ
    console.log('🎯 レイキャスティングハンドラー初期化完了');
    console.log('✅ cascadeTestUtils, cascadeRaycastingUtils 登録完了');

    return () => {
      delete (window as any).cascadeRaycastingUtils;
      delete (window as any).cascadeTestUtils;
    };
  }, [isRaycastingEnabled, hoveredObject, hoveredFace, setIsRaycastingEnabled]);

  // デバッグ用の状態表示
  useEffect(() => {
    if (hoveredObject) {
      console.log('🎯 ホバー中オブジェクト:', hoveredObject.name || 'Unnamed', hoveredObject.uuid);
    }
    if (hoveredFace !== null) {
      console.log('📐 ホバー中フェイス番号:', hoveredFace);
    }
  }, [hoveredObject, hoveredFace]);

  return null;
}

export default function ThreeJSViewport({ 
  cameraPosition = [5, 5, 5],
  enableControls = true 
}: ThreeJSViewportProps) {
  const { modelUrl, isLoading, error } = useOpenCascade();
  const [isRaycastingEnabled, setIsRaycastingEnabled] = useState(true);
  const isClient = useIsClient();
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredObject, setHoveredObject] = useState<THREE.Mesh | null>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);

  // マウスイベントハンドラー
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isRaycastingEnabled) return;

    // マウス位置を更新
    setMousePosition({ x: event.clientX, y: event.clientY });

    // マウス座標の正規化（-1 to 1の範囲）
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    // グローバル関数経由でマウス座標を更新
    if ((window as any).cascadeRaycastingUtils) {
      (window as any).cascadeRaycastingUtils.updateMousePosition(event.clientX, event.clientY, rect);
    }
  }, [isRaycastingEnabled]);

  // コンポーネントがマウントされたことをコンソールに記録
  useEffect(() => {
    console.log('🚀 ThreeJSViewport マウント完了');
    console.log('📐 Canvas data-testid="cascade-3d-viewport" 設定済み');
    
    return () => {
      console.log('👋 ThreeJSViewport アンマウント');
    };
  }, []);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (isLoading || !isClient) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{ 
          position: cameraPosition, 
          fov: 75 
        }}
        shadows
        data-testid="cascade-3d-viewport"
        onMouseMove={handleMouseMove}
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

        {/* レイキャスティングハンドラー */}
        <RaycastingHandler 
          isRaycastingEnabled={isRaycastingEnabled} 
          setIsRaycastingEnabled={setIsRaycastingEnabled} 
        />
      </Canvas>

      {/* ツールチップを追加 */}
      <HoverTooltip 
        hoveredObject={hoveredObject}
        hoveredFace={hoveredFace}
        mousePosition={mousePosition}
      />

      {/* レイキャスティング制御UI */}
      <div className="absolute bottom-2 left-2 z-10 bg-gray-800 bg-opacity-80 p-1 rounded shadow-lg text-white text-sm">
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
    </div>
  );
} 