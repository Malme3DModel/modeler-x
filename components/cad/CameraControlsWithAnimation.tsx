'use client';

import React, { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { 
  Camera, 
  RotateCcw, 
  Move3D, 
  Eye, 
  Square, 
  Circle, 
  Triangle, 
  Maximize2 
} from 'lucide-react';
import * as THREE from 'three';
import { useCameraAnimation } from '../../hooks/useCameraAnimation';

const CAMERA_POSITIONS = {
  front: { position: [0, 0, 100], target: [0, 0, 0], label: 'Front' },
  back: { position: [0, 0, -100], target: [0, 0, 0], label: 'Back' },
  top: { position: [0, 100, 0], target: [0, 0, 0], label: 'Top' },
  bottom: { position: [0, -100, 0], target: [0, 0, 0], label: 'Bottom' },
  left: { position: [-100, 0, 0], target: [0, 0, 0], label: 'Left' },
  right: { position: [100, 0, 0], target: [0, 0, 0], label: 'Right' },
  iso: { position: [50, 50, 50], target: [0, 0, 0], label: 'ISO' }
} as const;

interface CameraControlsWithAnimationProps {
  boundingBox: THREE.Box3 | null;
  onFitToObject?: () => void;
}

export function CameraControlsWithAnimation({ boundingBox, onFitToObject }: CameraControlsWithAnimationProps) {
  const { camera, controls } = useThree();
  const { fitToObject, animateToPosition } = useCameraAnimation({ camera, controls });
  const animationRef = useRef<number>();

  const animateToView = useCallback((position: THREE.Vector3, target: THREE.Vector3) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    console.log('🎬 カメラビューアニメーション開始:', {
      targetPosition: position.toArray(),
      targetLookAt: target.toArray()
    });
    
    animateToPosition(position, target, 1000);
  }, [animateToPosition]);

  const handleFitToObject = useCallback(() => {
    if (boundingBox) {
      console.log('🎯 Fit to Object実行:', boundingBox);
      fitToObject(boundingBox);
      onFitToObject?.();
    } else {
      console.warn('⚠️ バウンディングボックスが存在しません');
    }
  }, [boundingBox, fitToObject, onFitToObject]);

  const handleViewChange = useCallback((viewKey: keyof typeof CAMERA_POSITIONS) => {
    const view = CAMERA_POSITIONS[viewKey];
    const position = new THREE.Vector3(...view.position);
    const target = new THREE.Vector3(...view.target);
    
    console.log(`📐 ${view.label}ビューに切り替え`);
    animateToView(position, target);
  }, [animateToView]);

  return (
    <div className="bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-700">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-gray-300 font-medium mb-1">Camera Controls</div>
        
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleViewChange('front')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Front View"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('back')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Back View"
          >
            <Circle className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('top')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Top View"
          >
            <Triangle className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('bottom')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Bottom View"
          >
            <Move3D className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleViewChange('left')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Left View"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('right')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Right View"
          >
            <Camera className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('iso')}
            className="btn btn-xs btn-ghost text-gray-300 hover:text-white hover:bg-gray-700"
            title="Isometric View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        
        <button
          onClick={handleFitToObject}
          disabled={!boundingBox}
          className="btn btn-xs btn-primary w-full"
          title="Fit to Object"
        >
          <Maximize2 className="w-3 h-3" />
          Fit
        </button>
      </div>
    </div>
  );
}
