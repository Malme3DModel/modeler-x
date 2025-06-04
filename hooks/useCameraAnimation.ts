import { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function useCameraAnimation() {
  const { camera, controls } = useThree();
  const animationRef = useRef<number>();

  const fitToObject = useCallback((boundingBox: THREE.Box3) => {
    if (!controls || !camera || !boundingBox) return;

    // バウンディングボックスの中心とサイズを計算
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // 最大寸法を取得
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // カメラの視野角に基づいて適切な距離を計算
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180); // ラジアンに変換
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5; // 1.5倍のマージン
    
    // 現在のカメラ方向を維持して距離を調整
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate(); // カメラから見た方向の逆
    
    const targetPosition = center.clone().add(direction.multiplyScalar(distance));
    
    // アニメーション開始
    const startPosition = camera.position.clone();
    const startTarget = (controls as any).target.clone();
    
    let progress = 0;
    const duration = 1500; // 1.5秒のアニメーション
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // イージング関数（ease-in-out）
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // 位置とターゲットの補間
      camera.position.lerpVectors(startPosition, targetPosition, eased);
      (controls as any).target.lerpVectors(startTarget, center, eased);
      
      (controls as any).update();
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animate();
  }, [camera, controls]);

  const animateToPosition = useCallback((
    position: THREE.Vector3, 
    target: THREE.Vector3, 
    duration: number = 1000
  ) => {
    if (!controls || !camera) return;

    const startPosition = camera.position.clone();
    const startTarget = (controls as any).target.clone();
    
    let progress = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // イージング関数（ease-out）
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPosition, position, eased);
      (controls as any).target.lerpVectors(startTarget, target, eased);
      
      (controls as any).update();
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animate();
  }, [camera, controls]);

  return {
    fitToObject,
    animateToPosition
  };
} 