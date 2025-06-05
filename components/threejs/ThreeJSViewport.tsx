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
import { TransformGizmo } from './TransformGizmo';
import { ObjectSelector } from './ObjectSelector';
import { TransformControlsUI } from './TransformControlsUI';
import { CameraControls } from '../cad/CameraControls';
import { useCameraAnimation } from '../../hooks/useCameraAnimation';
import { useSelectionManager } from '../../hooks/useSelectionManager';
import { CameraViewControls } from './CameraViewControls';

import { MultiSelectionManager } from './MultiSelectionManager';
import { TransformModeIndicator } from '../ui/TransformModeIndicator';
import { SelectionIndicator } from '../ui/SelectionIndicator';
import { PWAInstallBanner } from '../ui/PWAInstallBanner';

import { FeatureParityStatus } from '../ui/FeatureParityStatus';
import { isTransformKey, isCameraViewKey, isFitToObjectKey, getCameraViewName } from '../../lib/utils/keyboardShortcuts';
import { logFeatureParityCompletion } from '../../lib/utils/featureParityLogger';

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
      ...(window as any).cascadeTestUtils || {},
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
    console.log('✅ cascadeRaycastingUtils 登録完了');

    return () => {
      delete (window as any).cascadeRaycastingUtils;
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

// テスト用のグローバルユーティリティ関数を初期化
if (typeof window !== 'undefined') {
  // グローバルオブジェクトにテスト用ユーティリティを登録
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
      
      if (!mesh) return null;
      
      return {
        type: mesh.material?.type || 'unknown',
        color: mesh.material?.color?.getHexString() || 'unknown',
        wireframe: !!mesh.material?.wireframe
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
  
  console.log('✅ テスト用グローバルユーティリティ関数を初期化: getMaterialInfo, getLightingInfo, getFogInfo');
}

// シーン設定用コンポーネント
function SceneSetup({ selectedObject }: { selectedObject: THREE.Object3D | null }) {
  const { scene } = useThree();
  
  // テスト用のグローバルユーティリティ関数の拡張
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).cascadeTestUtils) {
      // シーンを設定（関数が存在する場合のみ）
      if (typeof (window as any).cascadeTestUtils.setScene === 'function') {
        (window as any).cascadeTestUtils.setScene(scene);
      }
      
      // 選択オブジェクト設定（関数が存在する場合のみ）
      if (typeof (window as any).cascadeTestUtils.setSelectedObject === 'function') {
        (window as any).cascadeTestUtils.setSelectedObject(selectedObject);
      }
    }
  }, [scene, selectedObject]);
  
  return null;
}

export default function ThreeJSViewport({ 
  cameraPosition = [5, 5, 5],
  enableControls = true 
}: ThreeJSViewportProps) {
  const { modelUrl, isLoading, error } = useOpenCascade();
  const isClient = useIsClient();
  const [hoveredObject, setHoveredObject] = useState<THREE.Mesh | null>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);
  const [isRaycastingEnabled, setIsRaycastingEnabled] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { selectedObjects, selectObject, clearSelection, isSelected } = useSelectionManager();
  const selectedObject = selectedObjects[0] || null;
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [transformSpace, setTransformSpace] = useState<'local' | 'world'>('local');
  const [isTransformVisible, setIsTransformVisible] = useState(false);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogSettings, setFogSettings] = useState({ near: 50, far: 200 });
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  
  // 🎯 オブジェクト変更ハンドラー
  const handleObjectChange = useCallback((object: THREE.Object3D) => {
    console.log('Object transformed:', {
      position: object.position,
      rotation: object.rotation,
      scale: object.scale
    });
  }, []);
  
  // 🎯 オブジェクト選択ハンドラー
  const handleSelectObject = useCallback((object: THREE.Object3D | null, multiSelect = false) => {
    console.log('オブジェクト選択:', object?.name || 'none');
    
    if (object) {
      selectObject(object, multiSelect);
      setIsTransformVisible(true);
      
      const box = new THREE.Box3().setFromObject(object);
      setBoundingBox(box);
    } else if (!multiSelect) {
      clearSelection();
      setIsTransformVisible(false);
    }
  }, [selectObject, clearSelection]);

  // バウンディングボックスの計算
  const calculateBoundingBox = useCallback((objects: THREE.Object3D[]) => {
    if (objects.length === 0) return null;
    
    const box = new THREE.Box3();
    objects.forEach(obj => {
      const objBox = new THREE.Box3().setFromObject(obj);
      box.union(objBox);
    });
    
    return box;
  }, []);

  // オブジェクトが更新された時にバウンディングボックスを再計算
  useEffect(() => {
    if (selectedObject) {
      const box = calculateBoundingBox([selectedObject]);
      setBoundingBox(box);
    }
  }, [selectedObject, calculateBoundingBox]);

  // ⌨️ キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && (
        event.target.closest('.monaco-editor') ||
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA'
      )) {
        return;
      }

      const transformModeKey = isTransformKey(event.key);
      if (transformModeKey) {
        setTransformMode(transformModeKey);
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        const modes: ('translate' | 'rotate' | 'scale')[] = ['translate', 'rotate', 'scale'];
        const currentIndex = modes.indexOf(transformMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setTransformMode(nextMode);
        return;
      }

      if (event.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else {
          clearSelection();
          setIsTransformVisible(false);
        }
        return;
      }

      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        setShowShortcutsHelp(true);
        return;
      }

      const cameraViewNumber = isCameraViewKey(event.key);
      if (cameraViewNumber) {
        const viewName = getCameraViewName(cameraViewNumber);
        if (viewName && (window as any).cascadeCameraControls?.animateToView) {
          (window as any).cascadeCameraControls.animateToView(viewName);
        }
        return;
      }

      if (isFitToObjectKey(event.key)) {
        if ((window as any).cascadeCameraControls?.fitToObject) {
          (window as any).cascadeCameraControls.fitToObject();
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transformMode, clearSelection, setTransformMode]);
  
  // テスト用のグローバルユーティリティ関数を拡張
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).cascadeTestUtils = {
        ...(window as any).cascadeTestUtils || {},
        hasTransformControls: () => !!selectedObject,
        getSelectedObjectPosition: () => selectedObject?.position.toArray() || null,
        getSelectedObjectRotation: () => selectedObject?.rotation.toArray() || null,
      };
    }
  }, [selectedObject]);

  useEffect(() => {
    logFeatureParityCompletion();
  }, []);

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
    <div className="w-full h-full relative canvas-container" onMouseMove={handleMouseMove} data-testid="threejs-viewport">
      <TransformModeIndicator mode={transformMode} visible={isTransformVisible && !!selectedObject} />
      
      <div className="absolute top-2 right-2 z-50" data-testid="camera-controls-container">
        <CameraControls boundingBox={boundingBox} />
      </div>
      
      {/* TransformControls UI */}
      <TransformControlsUI 
        onModeChange={setTransformMode} 
        onSpaceChange={setTransformSpace}
        onVisibilityChange={setIsTransformVisible}
        visible={isTransformVisible && !!selectedObject}
        mode={transformMode}
        space={transformSpace}
        enabled={!!selectedObject}
        selectedObjectName={selectedObject?.name || selectedObject?.type}
      />

      {/* Canvas */}
      <Canvas
        gl={{ antialias: true }}
        camera={{ position: cameraPosition, fov: 45 }}
        style={{ background: 'linear-gradient(to bottom, #1e293b, #334155)' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        
        {enableControls && (
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            minDistance={0.1}
            maxDistance={1000}
            target={[0, 0, 0]}
            makeDefault
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
          />
        )}

        {/* レイキャスティングハンドラー */}
        <RaycastingHandler 
          isRaycastingEnabled={isRaycastingEnabled} 
          setIsRaycastingEnabled={setIsRaycastingEnabled} 
        />

        {/* TransformGizmo */}
        <TransformGizmo
          selectedObject={selectedObject}
          mode={transformMode}
          space={transformSpace}
          visible={isTransformVisible && !!selectedObject}
          enabled={!!selectedObject}
          onObjectChange={handleObjectChange}
        />

        {/* ObjectSelector */}
        <ObjectSelector onSelectObject={(object, multiSelect) => handleSelectObject(object, multiSelect)}>
          {/* テスト用のシンプルな3Dオブジェクト */}
          <mesh position={[0, 0, 0]} name="Cube">
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="royalblue" />
          </mesh>
          
          <mesh position={[2, 0, 0]} name="Sphere">
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="tomato" />
          </mesh>
        </ObjectSelector>

        <SceneSetup selectedObject={selectedObject} />

        {/* Canvas内でのカメラアニメーション制御 */}
        <CameraAnimationController boundingBox={boundingBox} />
      </Canvas>

      {/* カメラビューコントロール */}
      <CameraViewControls 
        onViewChange={(view) => {
          const viewNames = ['front', 'back', 'top', 'bottom', 'left', 'right', 'iso'];
          const viewName = viewNames[view - 1];
          if (viewName && (window as any).cascadeCameraControls?.animateToView) {
            (window as any).cascadeCameraControls.animateToView(viewName);
          }
        }}
        onFitToObject={() => {
          if ((window as any).cascadeCameraControls?.fitToObject) {
            (window as any).cascadeCameraControls.fitToObject();
          }
        }}
      />



      <MultiSelectionManager 
        onSelectionChange={(objects: THREE.Object3D[]) => {
          console.log('選択オブジェクト数:', objects.length);
        }}
      />

      <SelectionIndicator 
        selectedCount={selectedObjects.length}
        visible={selectedObjects.length > 0}
      />

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

      <PWAInstallBanner />
      

      
      <FeatureParityStatus visible={true} />
    </div>
  );
}

// Canvas内でのカメラアニメーション制御コンポーネント
function CameraAnimationController({ boundingBox }: { boundingBox: THREE.Box3 | null }) {
  const { camera, controls } = useThree();
  const { fitToObject, animateToPosition } = useCameraAnimation({ camera, controls });
  const animationRef = useRef<number>();

  // 6方向 + ISO視点の定義
  const CAMERA_POSITIONS = {
    front: { 
      position: [0, 0, 10] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Front'
    },
    back: { 
      position: [0, 0, -10] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Back'
    },
    top: { 
      position: [0, 10, 0] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Top'
    },
    bottom: { 
      position: [0, -10, 0] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Bottom'
    },
    left: { 
      position: [-10, 0, 0] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Left'
    },
    right: { 
      position: [10, 0, 0] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'Right'
    },
    iso: { 
      position: [7, 7, 7] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number],
      name: 'ISO'
    }
  };

  // カメラビューアニメーション関数
  const animateToView = useCallback((viewName: keyof typeof CAMERA_POSITIONS, bbox?: THREE.Box3 | null) => {
    if (!controls || !camera) {
      console.warn('カメラまたはコントロールが見つかりません');
      return;
    }

    console.log(`カメラビュー切替: ${viewName}`);
    const view = CAMERA_POSITIONS[viewName];
    const endPosition = new THREE.Vector3(...view.position);
    const endTarget = new THREE.Vector3(...view.target);

    // バウンディングボックスがある場合は距離を調整
    const currentBoundingBox = bbox || boundingBox;
    if (currentBoundingBox) {
      const size = new THREE.Vector3();
      currentBoundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2.5; // 適切な距離に調整
      
      // ビュー方向を維持しつつ距離を調整
      endPosition.normalize().multiplyScalar(distance);
      
      // バウンディングボックスの中心を対象とする
      const center = new THREE.Vector3();
      currentBoundingBox.getCenter(center);
      endTarget.copy(center);
      endPosition.add(center);
    }

    // useCameraAnimationのanimateToPositionを使用
    try {
      // アニメーション実行前にキャンセル
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // 1秒かけてアニメーション
      animateToPosition(endPosition, endTarget, 1000);
      console.log('カメラアニメーション開始:', {
        start: camera.position.toArray(),
        end: endPosition.toArray(),
        target: endTarget.toArray()
      });
    } catch (error) {
      console.error('カメラアニメーション実行エラー:', error);
    }
  }, [camera, controls, boundingBox, animateToPosition]);

  // オブジェクトにフィットさせる関数
  const handleFitToObject = useCallback(() => {
    if (!boundingBox) {
      console.warn('フィット対象のバウンディングボックスがありません');
      return;
    }
    
    try {
      console.log('Fit to Objectを実行:', boundingBox);
      
      // アニメーション実行前にキャンセル
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // バウンディングボックスにフィット
      fitToObject(boundingBox);
    } catch (error) {
      console.error('Fit to Object実行エラー:', error);
    }
  }, [boundingBox, fitToObject]);

  useEffect(() => {
    // グローバル関数として公開
    (window as any).cascadeCameraControls = {
      fitToObject: handleFitToObject,
      animateToView: animateToView
    };

    console.log('✅ カメラコントロールをグローバル関数として登録');

    return () => {
      delete (window as any).cascadeCameraControls;
    };
  }, [boundingBox, handleFitToObject, animateToView]);

  return null;
}                                                                                                                                                                                    