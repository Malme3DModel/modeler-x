'use client';

import { useRef, useCallback } from 'react';
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
  onFitToObject?: () => void;
  boundingBox?: THREE.Box3 | null;
}

export function CameraControls({ onFitToObject, boundingBox }: CameraControlsProps) {
  // カメラアニメーション関数
  const animateToView = useCallback((viewName: keyof typeof CAMERA_POSITIONS) => {
    // グローバル関数経由でカメラ制御を実行
    if ((window as any).cascadeCameraControls?.animateToView) {
      (window as any).cascadeCameraControls.animateToView(viewName, boundingBox);
    } else {
      console.warn('Camera controls not available');
    }
  }, [boundingBox]);

  return (
    <div className="flex flex-col gap-2 p-2 bg-white border rounded-lg shadow-sm">
      <div className="text-sm font-medium text-gray-700 mb-2">Camera Views</div>
      
      {/* 6方向視点ボタン */}
      <div className="grid grid-cols-3 gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('top')}
          className="flex items-center gap-1"
          data-testid="camera-top"
        >
          <ArrowUp className="w-3 h-3" />
          Top
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('front')}
          className="flex items-center gap-1"
          data-testid="camera-front"
        >
          <Eye className="w-3 h-3" />
          Front
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('right')}
          className="flex items-center gap-1"
          data-testid="camera-right"
        >
          <ArrowRight className="w-3 h-3" />
          Right
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('left')}
          className="flex items-center gap-1"
          data-testid="camera-left"
        >
          <ArrowLeft className="w-3 h-3" />
          Left
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('back')}
          className="flex items-center gap-1"
          data-testid="camera-back"
        >
          <RotateCcw className="w-3 h-3" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('bottom')}
          className="flex items-center gap-1"
          data-testid="camera-bottom"
        >
          <ArrowDown className="w-3 h-3" />
          Bottom
        </Button>
      </div>
      
      {/* ISO視点とFit to Objectボタン */}
      <div className="flex gap-1 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('iso')}
          className="flex items-center gap-1 flex-1"
          data-testid="camera-iso"
        >
          <Box className="w-3 h-3" />
          ISO
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onFitToObject}
          className="flex items-center gap-1 flex-1"
          disabled={!boundingBox}
          data-testid="camera-fit"
        >
          <Maximize2 className="w-3 h-3" />
          Fit
        </Button>
      </div>
    </div>
  );
} 