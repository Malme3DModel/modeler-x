# Three.js 実装ガイド

## 🔧 技術的実装詳細

### 1. 依存関係のインストール

```bash
# Three.js と React Three Fiber のインストール
npm install three @react-three/fiber @react-three/drei

# TypeScript 型定義
npm install -D @types/three
```

### 2. コンポーネント実装

#### 2.1 ThreeJSViewport.tsx
```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import ThreeJSModel from './ThreeJSModel';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ThreeJSViewportProps {
  modelUrl?: string;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
}

export default function ThreeJSViewport({ 
  modelUrl, 
  cameraPosition = [5, 5, 5],
  enableControls = true 
}: ThreeJSViewportProps) {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ 
          position: cameraPosition, 
          fov: 75 
        }}
        shadows
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
      </Canvas>
      
      {/* ローディング表示 */}
      {!modelUrl && <LoadingSpinner />}
    </div>
  );
}
```

#### 2.2 ThreeJSModel.tsx
```typescript
import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh } from 'three';

interface ThreeJSModelProps {
  url: string;
  scale?: [number, number, number];
  position?: [number, number, number];
}

export default function ThreeJSModel({ 
  url, 
  scale = [1, 1, 1], 
  position = [0, 0, 0] 
}: ThreeJSModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      // モデルのマテリアル設定
      groupRef.current.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // マテリアルの調整
          if (child.material) {
            child.material.roughness = 0.7;
            child.material.metalness = 0.3;
          }
        }
      });
    }
  }, []);

  return (
    <group ref={groupRef} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  );
}
```

#### 2.3 LoadingSpinner.tsx
```typescript
export default function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-gray-600">OpenCascade.js を読み込み中...</p>
      </div>
    </div>
  );
}
```

### 3. カスタムフック実装

#### 3.1 useOpenCascade.ts
```typescript
import { useState, useEffect } from 'react';
import initOpenCascade from 'opencascade.js';
import shapeToUrl from '../lib/shapeToUrl';

interface UseOpenCascadeReturn {
  modelUrl: string | undefined;
  isLoading: boolean;
  error: string | null;
  oc: any;
}

export function useOpenCascade(): UseOpenCascadeReturn {
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oc, setOc] = useState<any>(null);

  useEffect(() => {
    initOpenCascade()
      .then((ocInstance: any) => {
        setOc(ocInstance);
        
        try {
          // 既存の形状生成ロジック
          const sphere = new ocInstance.BRepPrimAPI_MakeSphere_1(1);
          
          const makeCut = (shape: any, translation: number[], scale: number) => {
            const tf = new ocInstance.gp_Trsf_1();
            tf.SetTranslation_1(new ocInstance.gp_Vec_4(translation[0], translation[1], translation[2]));
            tf.SetScaleFactor(scale);
            const loc = new ocInstance.TopLoc_Location_2(tf);

            const cut = new ocInstance.BRepAlgoAPI_Cut_3(
              shape, 
              sphere.Shape().Moved(loc, false), 
              new ocInstance.Message_ProgressRange_1()
            );
            cut.Build(new ocInstance.Message_ProgressRange_1());

            return cut.Shape();
          };

          const makeRotation = (rotation: number) => {
            const tf = new ocInstance.gp_Trsf_1();
            tf.SetRotation_1(
              new ocInstance.gp_Ax1_2(
                new ocInstance.gp_Pnt_1(), 
                new ocInstance.gp_Dir_4(0, 0, 1)
              ), 
              rotation
            );
            const loc = new ocInstance.TopLoc_Location_2(tf);
            return loc;
          };

          // 形状操作
          const cut1 = makeCut(sphere.Shape(), [0, 0, 0.7], 1);
          const cut2 = makeCut(cut1, [0, 1, -0.7], 1);
          const cut3 = makeCut(cut2, [0, 0.25, 1.75], 1.825);
          const cut4 = makeCut(cut3, [4.8, 0, 0], 5);

          const fuse = new ocInstance.BRepAlgoAPI_Fuse_3(
            cut4, 
            cut4.Moved(makeRotation(Math.PI), false), 
            new ocInstance.Message_ProgressRange_1()
          );
          fuse.Build(new ocInstance.Message_ProgressRange_1());
          const result = fuse.Shape().Moved(makeRotation(-30 * Math.PI / 180), false);

          setModelUrl(shapeToUrl(ocInstance, result));
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to initialize OpenCascade');
        setIsLoading(false);
      });
  }, []);

  return { modelUrl, isLoading, error, oc };
}
```

#### 3.2 useGLBLoader.ts
```typescript
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useMemo } from 'react';

export function useGLBLoader(url: string | undefined) {
  const gltf = useLoader(GLTFLoader, url || '', (loader) => {
    // ローダーの設定
    loader.setDRACOLoader(null); // 必要に応じてDRACO設定
  });

  const processedScene = useMemo(() => {
    if (!gltf) return null;
    
    // シーンの前処理
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return gltf.scene;
  }, [gltf]);

  return processedScene;
}
```

### 4. 段階的移行の実装

#### 4.1 環境変数設定
```bash
# .env.local
NEXT_PUBLIC_USE_THREEJS=false
```

#### 4.2 app/page.tsx の更新
```typescript
import dynamic from "next/dynamic";

// 既存のコンポーネント
const OCJSViewport = dynamic(
  () => import("../components/OCJSViewport"),
  { ssr: false }
);

// 新しいThree.jsコンポーネント
const ThreeJSViewport = dynamic(
  () => import("../components/threejs/ThreeJSViewport"),
  { ssr: false }
);

export default function Home() {
  // 環境変数による切り替え
  const useThreeJS = process.env.NEXT_PUBLIC_USE_THREEJS === 'true';
  
  return (
    <main>
      {useThreeJS ? <ThreeJSViewport /> : <OCJSViewport />}
    </main>
  );
}
```

### 5. パフォーマンス最適化

#### 5.1 GLB ファイルの最適化
```typescript
// lib/threejs/optimizeGLB.ts
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function setupOptimizedLoader() {
  const loader = new GLTFLoader();
  
  // DRACO圧縮のサポート
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  loader.setDRACOLoader(dracoLoader);
  
  return loader;
}
```

#### 5.2 LOD (Level of Detail) の実装
```typescript
import { useLOD } from '@react-three/drei';

export function OptimizedModel({ url }: { url: string }) {
  const lod = useLOD();
  
  return (
    <lod ref={lod}>
      <ThreeJSModel url={url} scale={[1, 1, 1]} />
      <ThreeJSModel url={url} scale={[0.5, 0.5, 0.5]} />
      <ThreeJSModel url={url} scale={[0.25, 0.25, 0.25]} />
    </lod>
  );
}
```

### 6. エラーハンドリング

#### 6.1 ErrorBoundary.tsx
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ThreeJSErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Three.js Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>3D表示でエラーが発生しました</h2>
          <details>
            <summary>エラー詳細</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-primary"
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7. テストファイル

#### 7.1 ThreeJSViewport.test.tsx
```typescript
import { render, screen } from '@testing-library/react';
import ThreeJSViewport from '../components/threejs/ThreeJSViewport';

// Three.js のモック
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Environment: () => <div data-testid="environment" />
}));

describe('ThreeJSViewport', () => {
  it('renders canvas correctly', () => {
    render(<ThreeJSViewport />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('shows loading spinner when no model URL', () => {
    render(<ThreeJSViewport />);
    expect(screen.getByText('OpenCascade.js を読み込み中...')).toBeInTheDocument();
  });
});
```

### 8. 設定ファイル

#### 8.1 next.config.mjs の更新
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Three.js のために必要な設定
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader']
    });
    
    return config;
  },
  transpilePackages: ['three'],
};

export default nextConfig;
```

#### 8.2 tsconfig.json の調整
```json
{
  "compilerOptions": {
    // 既存設定...
    "types": ["three", "@types/three"]
  },
  "include": [
    // 既存設定...
    "types/**/*"
  ]
}
```

### 9. デプロイ設定

#### 9.1 Vercel 最適化
```json
{
  "functions": {
    "app/**": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

## 🚀 実装順序

1. **環境構築**: 依存関係インストール
2. **基本コンポーネント**: ThreeJSViewport の作成
3. **モデル表示**: ThreeJSModel の実装
4. **フック作成**: useOpenCascade の移植
5. **エラーハンドリング**: ErrorBoundary の追加
6. **最適化**: パフォーマンス調整
7. **テスト**: 単体テスト・結合テスト
8. **移行**: 段階的切り替え

この実装ガイドに従って、安全で効率的なThree.js移行を進めることができます。 