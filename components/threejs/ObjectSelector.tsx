import { useCallback, useRef, useEffect } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface ObjectSelectorProps {
  children: React.ReactNode;
  onSelectObject: (object: THREE.Object3D | null) => void;
  selectableObjects?: THREE.Object3D[];
  multiSelect?: boolean;
}

export function ObjectSelector({ 
  children, 
  onSelectObject,
  selectableObjects = [],
  multiSelect = false
}: ObjectSelectorProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  
  // 🎯 クリック選択ハンドラー
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    
    // マウス座標正規化
    const mouse = new THREE.Vector2();
    // HTMLCanvasElementとして型アサーション
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // レイキャスティング実行
    raycaster.current.setFromCamera(mouse, camera);
    
    // 選択可能オブジェクトのフィルタリング
    const targets = selectableObjects.length > 0 
      ? selectableObjects 
      : scene.children.filter(obj => 
          obj.type === 'Mesh' && 
          obj.visible && 
          obj.userData.selectable !== false
        );
    
    const intersects = raycaster.current.intersectObjects(targets, true);
    
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      
      // 📍 マルチセレクション対応
      if (multiSelect && event.nativeEvent.ctrlKey) {
        // Ctrl+クリックでマルチセレクション
        // TODO: マルチセレクション状態管理
        console.log('Multi-select mode:', selectedObject);
      }
      
      onSelectObject(selectedObject);
    } else {
      // 空白クリックで選択解除
      onSelectObject(null);
    }
  }, [camera, scene, selectableObjects, multiSelect, onSelectObject]);
  
  // 🔧 キーボードイベント（Escape で選択解除）
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onSelectObject(null);
    }
  }, [onSelectObject]);
  
  // 📍 イベントリスナー設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <group onClick={handleClick}>
      {children}
    </group>
  );
} 