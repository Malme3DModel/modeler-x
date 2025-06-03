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
  const [fogSettings, setFogSettings] = useState({ near: 50, far: 200 });
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);

  // バウンディングボックスに基づくフォグ距離の計算
  const calculateFogDistance = useCallback((boundingBox: THREE.Box3) => {
    if (!boundingBox) return { near: 50, far: 200 };
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    return {
      near: maxDim * 2,
      far: maxDim * 5
    };
  }, []);

  // バウンディングボックスの更新時にフォグ設定を更新
  useEffect(() => {
    if (boundingBox) {
      setFogSettings(calculateFogDistance(boundingBox));
    }
  }, [boundingBox, calculateFogDistance]);

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

  // モデルのバウンディングボックスを更新するハンドラー
  const handleModelLoaded = useCallback((scene: THREE.Group) => {
    const box = new THREE.Box3().setFromObject(scene);
    setBoundingBox(box);
  }, []);

  // コンポーネントがマウントされたことをコンソールに記録
  useEffect(() => {
    console.log('🚀 ThreeJSViewport マウント完了');
    console.log('📐 Canvas data-testid="cascade-3d-viewport" 設定済み');
    
    return () => {
      console.log('👋 ThreeJSViewport アンマウント');
    };
  }, []);

  // テスト用のアクセス機能を追加
  useEffect(() => {
    // 既存のcascadeTestUtilsに追加
    (window as any).cascadeTestUtils = {
      ...(window as any).cascadeTestUtils || {},
      
      // マテリアル情報を取得
      getMaterialInfo: () => {
        const scene = (window as any).cascadeScene;
        if (!scene) return null;
        
        const meshes = scene.children.filter((child: any) => 
          child.type === 'Mesh' || 
          (child.type === 'Group' && child.children.some((c: any) => c.type === 'Mesh'))
        );
        
        if (meshes.length === 0) return null;
        
        const mesh = meshes[0].type === 'Mesh' ? 
          meshes[0] : 
          meshes[0].children.find((c: any) => c.type === 'Mesh');
        
        if (!mesh || !mesh.material) return null;
        
        return {
          type: mesh.material.type,
          color: mesh.material.color?.getHexString(),
          hasMatcap: !!mesh.material.matcap
        };
      },
      
      // ライティング情報を取得
      getLightingInfo: () => {
        const scene = (window as any).cascadeScene;
        if (!scene) return null;
        
        const lights = scene.children.filter((child: any) => 
          child.type.includes('Light')
        );
        
        return {
          lightCount: lights.length,
          hasHemisphereLight: lights.some((light: any) => light.type === 'HemisphereLight'),
          hasDirectionalLight: lights.some((light: any) => light.type === 'DirectionalLight'),
          hasAmbientLight: lights.some((light: any) => light.type === 'AmbientLight')
        };
      },
      
      // フォグ情報を取得
      getFogInfo: () => {
        const scene = (window as any).cascadeScene;
        if (!scene) return null;
        
        return {
          hasFog: !!scene.fog,
          fogType: scene.fog?.type,
          fogColor: scene.fog ? `#${scene.fog.color.getHexString()}` : null,
          fogNear: scene.fog?.near,
          fogFar: scene.fog?.far
        };
      }
    };
  }, []);

  // バウンディングボックスの更新
  useEffect(() => {
    if ((window as any).cascadeTestUtils?.boundingBox && !boundingBox) {
      setBoundingBox((window as any).cascadeTestUtils.boundingBox);
    }
  }, [boundingBox]);

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
          fov: 50 
        }}
        shadows
        gl={{ 
          antialias: true
        }}
        data-testid="cascade-3d-viewport"
        onMouseMove={handleMouseMove}
        onCreated={({ scene }) => {
          // シーンをグローバルに保存（テスト用）
          (window as any).cascadeScene = scene;
        }}
      >
        {/* 背景色の設定 */}
        <color attach="background" args={['#222222']} />
        
        {/* フォグの設定 */}
        <fog attach="fog" args={['#f0f0f0', fogSettings.near, fogSettings.far]} />
        
        {/* ライティング設定 */}
        <ambientLight intensity={0.3} />
        
        {/* 半球光 - 元の実装に合わせる */}
        <hemisphereLight 
          position={[0, 1, 0]} 
          args={['#ffffff', '#444444', 1]} 
        />
        
        {/* 平行光源 */}
        <directionalLight 
          position={[3, 10, 10]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        
        {/* 地面 */}
        <mesh 
          receiveShadow 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.5, 0]}
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
        
        {/* 3Dモデル表示 */}
        <Suspense fallback={null}>
          {modelUrl && (
            <ThreeJSModel 
              url={modelUrl} 
            />
          )}
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