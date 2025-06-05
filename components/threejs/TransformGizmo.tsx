import { TransformControls } from '@react-three/drei';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TransformGizmoProps {
  selectedObject: THREE.Object3D | null;
  mode: 'translate' | 'rotate' | 'scale';
  space: 'local' | 'world';
  visible: boolean;
  enabled?: boolean;
  size?: number;
  onObjectChange?: (object: THREE.Object3D) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function TransformGizmo({ 
  selectedObject, 
  mode, 
  space,
  visible,
  enabled = true,
  size = 1,
  onObjectChange,
  onDragStart,
  onDragEnd
}: TransformGizmoProps) {
  const transformRef = useRef<any>(null);
  const { camera, gl, scene } = useThree();
  
  // 🔧 OrbitControlsとの競合解決
  const handleDragStart = useCallback(() => {
    // OrbitControlsを無効化
    const orbitControls = scene.userData.orbitControls;
    if (orbitControls) {
      orbitControls.enabled = false;
    }
    onDragStart?.();
  }, [scene, onDragStart]);
  
  const handleDragEnd = useCallback(() => {
    // OrbitControlsを再有効化
    const orbitControls = scene.userData.orbitControls;
    if (orbitControls) {
      orbitControls.enabled = true;
    }
    onDragEnd?.();
  }, [scene, onDragEnd]);
  
  // 🎯 オブジェクト変更イベント
  const handleObjectChange = useCallback(() => {
    if (selectedObject && onObjectChange) {
      onObjectChange(selectedObject);
    }
  }, [selectedObject, onObjectChange]);
  
  // 📍 イベントリスナー設定
  useEffect(() => {
    if (!transformRef.current) return;
    
    const controls = transformRef.current;
    
    controls.addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        handleDragStart();
      } else {
        handleDragEnd();
      }
    });
    
    controls.addEventListener('objectChange', handleObjectChange);
    
    return () => {
      controls.removeEventListener('dragging-changed', (event: any) => {
        if (event.value) {
          handleDragStart();
        } else {
          handleDragEnd();
        }
      });
      controls.removeEventListener('objectChange', handleObjectChange);
    };
  }, [handleDragStart, handleDragEnd, handleObjectChange]);
  
  // ✨ レンダリング条件
  if (!selectedObject || !visible || !enabled) return null;
  
  return (
    <TransformControls
      ref={transformRef}
      object={selectedObject}
      mode={mode}
      space={space}
      size={size}
      showX={true}
      showY={true}
      showZ={true}
    />
  );
}  