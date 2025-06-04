'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  Eye, 
  RotateCcw, 
  Box, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Maximize2 
} from 'lucide-react';
import * as THREE from 'three';
import { useCameraAnimation } from '@/hooks/useCameraAnimation';

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

interface CameraControlsProps {
  boundingBox?: THREE.Box3 | null;
  onFitToObject?: () => void;
}

export function CameraControls({ boundingBox, onFitToObject }: CameraControlsProps) {
  const { fitToObject, animateToPosition } = useCameraAnimation();
  const animationRef = useRef<number>();

  // カメラビューアニメーション関数
  const animateToView = useCallback((viewName: keyof typeof CAMERA_POSITIONS, bbox?: THREE.Box3 | null) => {
    // グローバル関数として公開されている場合はそれを使用
    if ((window as any).cascadeCameraControls?.animateToView) {
      console.log(`CameraControls: グローバル関数経由でカメラビュー切替: ${viewName}`);
      (window as any).cascadeCameraControls.animateToView(viewName, bbox || boundingBox);
      return;
    }

    console.log(`直接アニメーションに失敗: グローバル関数が見つかりません`);
  }, [boundingBox]);

  // オブジェクトにフィットさせる関数
  const handleFitToObject = useCallback(() => {
    // カスタムハンドラがあればそれを使用
    if (onFitToObject) {
      onFitToObject();
      return;
    }
    
    // グローバル関数経由で実行
    if ((window as any).cascadeCameraControls?.fitToObject) {
      console.log('CameraControls: グローバル関数経由でFit to Object実行');
      (window as any).cascadeCameraControls.fitToObject();
      return;
    }
    
    // 直接実行
    if (boundingBox) {
      console.log('CameraControls: 直接Fit to Object実行', boundingBox);
      fitToObject(boundingBox);
    } else {
      console.warn('CameraControls: フィット対象のバウンディングボックスがありません');
    }
  }, [boundingBox, fitToObject, onFitToObject]);

  return (
    <div 
      className="bg-gray-800 bg-opacity-80 p-2 rounded-md shadow-lg text-white"
      data-testid="camera-controls-panel"
    >
      <div className="text-sm font-medium mb-2">Camera Views</div>
      <div className="grid grid-cols-3 gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('front')}
          data-testid="camera-front"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('top')}
          data-testid="camera-top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('right')}
          data-testid="camera-right"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('back')}
          data-testid="camera-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('bottom')}
          data-testid="camera-bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('left')}
          data-testid="camera-left"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={() => animateToView('iso')}
          data-testid="camera-iso"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8" 
          onClick={handleFitToObject}
          data-testid="camera-fit"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 