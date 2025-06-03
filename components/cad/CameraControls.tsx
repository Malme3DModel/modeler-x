'use client';

import { useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControlsProps {
  onSetView?: (viewName: string) => void;
}

type CameraPreset = {
  position: THREE.Vector3;
  target?: THREE.Vector3;
  up?: THREE.Vector3;
  name: string;
  label: string;
  icon: string;
};

// OrbitControlsの型を拡張
type OrbitControlsType = {
  target: THREE.Vector3;
  update: () => void;
  fitToSphere?: (sphere: THREE.Sphere, enableTransition?: boolean) => void;
};

/**
 * プリセットカメラビュー設定と3Dビューの制御を提供するコンポーネント
 */
export default function CameraControls({ onSetView }: CameraControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const { camera, controls } = useThree();
  
  // カメラプリセットの定義
  const cameraPresets: CameraPreset[] = [
    { 
      name: 'front',
      label: '正面',
      position: new THREE.Vector3(0, 0, 100),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      icon: '⬆️'
    },
    { 
      name: 'back',
      label: '背面',
      position: new THREE.Vector3(0, 0, -100),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      icon: '⬇️'
    },
    { 
      name: 'left',
      label: '左側面',
      position: new THREE.Vector3(-100, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      icon: '⬅️'
    },
    { 
      name: 'right',
      label: '右側面',
      position: new THREE.Vector3(100, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      icon: '➡️'
    },
    { 
      name: 'top',
      label: '上面',
      position: new THREE.Vector3(0, 100, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 0, -1),
      icon: '⬆️'
    },
    { 
      name: 'bottom',
      label: '底面',
      position: new THREE.Vector3(0, -100, 0),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 0, 1),
      icon: '⬇️'
    },
    { 
      name: 'iso',
      label: '等角投影',
      position: new THREE.Vector3(70, 70, 70),
      target: new THREE.Vector3(0, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      icon: '🔄'
    },
  ];
  
  // 指定されたビューにカメラを設定
  const setView = (preset: CameraPreset) => {
    if (!controls || !camera) return;
    
    // OrbitControlsを使用している場合
    const orbitControls = controls as unknown as OrbitControlsType;
    if ('target' in orbitControls) {
      // アニメーションなしでカメラ位置を直接設定
      camera.position.copy(preset.position);
      
      if (preset.target) {
        orbitControls.target.copy(preset.target);
      }
      
      if (preset.up) {
        camera.up.copy(preset.up);
      }
      
      camera.lookAt(orbitControls.target);
      orbitControls.update();
      
      // カスタムコールバックがあれば呼び出し
      if (onSetView) {
        onSetView(preset.name);
      }
    }
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="bg-gray-800 bg-opacity-80 rounded shadow-lg">
        {/* メインコントロールボタン - 折りたたみ/展開 */}
        <button
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'ビューコントロールを折りたたむ' : 'ビューコントロールを展開'}
        >
          {expanded ? '×' : '👁️'}
        </button>
        
        {/* 展開されたコントロールパネル */}
        {expanded && (
          <div className="p-1 grid grid-cols-2 gap-1">
            {cameraPresets.map((preset) => (
              <button
                key={preset.name}
                className="px-2 py-1 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                onClick={() => setView(preset)}
                title={preset.label}
              >
                <span className="mr-1">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
            
            {/* フィットビューボタン */}
            <button
              className="px-2 py-1 text-sm text-white hover:bg-gray-700 rounded col-span-2 flex items-center justify-center"
              onClick={() => {
                // オブジェクトにフィットするビュー
                const orbitControls = controls as unknown as OrbitControlsType;
                if ('fitToSphere' in orbitControls && orbitControls.fitToSphere) {
                  orbitControls.fitToSphere(new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100), true);
                }
              }}
              title="モデルにフィット"
            >
              <span className="mr-1">🔍</span>
              <span>フィット</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SceneへのHOCとしてCameraControlsを提供
 */
export function withCameraControls(WrappedComponent: React.ComponentType<any>) {
  return function WithCameraControls(props: any) {
    return (
      <>
        <WrappedComponent {...props} />
        <CameraControls />
      </>
    );
  };
} 