# 🎯 CascadeStudio移行作業 - フェーズ2.2実装指示書

## 📋 作業概要

**作業名**: フェーズ2.2 - カメラコントロール高度機能の実装  
**優先度**: 🔴 高  
**担当者**: あなた  

## 🎯 作業目的

TransformControls（ギズモ操作）とオブジェクト選択機能の実装が完了したため、次のステップとして「カメラコントロール高度機能」を実装してください。現在は基本的なOrbitControlsのみが動作していますが、元のCascadeStudioと同等の操作感を実現するために、6方向視点切り替え、ISO視点、Fit to Object機能、スムーズなカメラアニメーションを実装します。これにより、3D CADアプリケーションとしての操作性が大幅に向上します。

**重要**: 実装完了後、必ずテストを作成・実行し、全テストがパスしてから完了とします。

## 📚 必須参考資料

### 1. 移行計画書
- **`docs/7_cascadestudio_migration/README.md`** - 全体概要とフェーズ2.2の詳細
- **`docs/7_cascadestudio_migration/feature_comparison.md`** - カメラ機能の実装状況確認
- **`docs/7_cascadestudio_migration/migration_plan.md`** - タスク2.2.1〜2.2.3の詳細実装計画
- **`docs/7_cascadestudio_migration/implementation_tasks.md`** - 具体的なコード例とタスク詳細

### 2. 元のCascadeStudio実装
- **`docs/template/js/MainPage/CascadeView.js`** - 元のカメラコントロール実装（視点切り替え機能）
- **`docs/template/js/MainPage/CascadeMain.js`** - カメラ操作のキーボードショートカット
- 視点プリセット、フィット機能の詳細を確認してください

### 3. 現在の実装
- **`components/threejs/ThreeJSViewport.tsx`** - 現在のOrbitControls実装
- **`components/cad/CameraControls.tsx`** - 既存のカメラコントロールUI（改良対象）
- **`components/threejs/TransformGizmo.tsx`** - 実装済みTransformControls（参考）
- **`tests/transform-controls.spec.ts`** - 既存のE2Eテスト（参考）

## 🔧 具体的な作業内容

### タスク2.2.1: 視点プリセット機能の改良

**対象ファイル**: `components/cad/CameraControls.tsx` (改良)

#### 1.1 カメラ位置定義の実装
```typescript
import { useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
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
  const { camera, controls } = useThree();
  const animationRef = useRef<number>();

  // スムーズなカメラアニメーション
  const animateToView = useCallback((viewName: keyof typeof CAMERA_POSITIONS) => {
    if (!controls || !camera) return;

    const view = CAMERA_POSITIONS[viewName];
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPosition = new THREE.Vector3(...view.position);
    const endTarget = new THREE.Vector3(...view.target);

    // バウンディングボックスがある場合は距離を調整
    if (boundingBox) {
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2.5; // 適切な距離に調整
      
      endPosition.normalize().multiplyScalar(distance);
      
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      endTarget.copy(center);
      endPosition.add(center);
    }

    let progress = 0;
    const duration = 1000; // 1秒のアニメーション
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // イージング関数（ease-out）
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // 位置の補間
      camera.position.lerpVectors(startPosition, endPosition, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      
      controls.update();
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animate();
  }, [camera, controls, boundingBox]);

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
        >
          <ArrowUp className="w-3 h-3" />
          Top
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('front')}
          className="flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Front
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('right')}
          className="flex items-center gap-1"
        >
          <ArrowRight className="w-3 h-3" />
          Right
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('left')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Left
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('back')}
          className="flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => animateToView('bottom')}
          className="flex items-center gap-1"
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
        >
          <Maximize2 className="w-3 h-3" />
          Fit
        </Button>
      </div>
    </div>
  );
}
```

### タスク2.2.2: Fit to Object機能の実装

**対象ファイル**: `hooks/useCameraAnimation.ts` (新規作成)

#### 2.1 カメラアニメーションフックの作成
```typescript
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
    const fov = camera.fov * (Math.PI / 180); // ラジアンに変換
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5; // 1.5倍のマージン
    
    // 現在のカメラ方向を維持して距離を調整
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.negate(); // カメラから見た方向の逆
    
    const targetPosition = center.clone().add(direction.multiplyScalar(distance));
    
    // アニメーション開始
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
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
      controls.target.lerpVectors(startTarget, center, eased);
      
      controls.update();
      
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
    const startTarget = controls.target.clone();
    
    let progress = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // イージング関数（ease-out）
      const eased = 1 - Math.pow(1 - progress, 3);
      
      camera.position.lerpVectors(startPosition, position, eased);
      controls.target.lerpVectors(startTarget, target, eased);
      
      controls.update();
      
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
```

### タスク2.2.3: ThreeJSViewportへの統合

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx` (改良)

#### 3.1 カメラコントロールの統合
```typescript
import { CameraControls } from '../cad/CameraControls';
import { useCameraAnimation } from '../../hooks/useCameraAnimation';

// 既存のコンポーネント内で
export default function ThreeJSViewport() {
  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const { fitToObject } = useCameraAnimation();

  // バウンディングボックスの計算（既存のロジックを活用）
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
    if (meshObjects.length > 0) {
      const box = calculateBoundingBox(meshObjects);
      setBoundingBox(box);
    }
  }, [meshObjects, calculateBoundingBox]);

  const handleFitToObject = useCallback(() => {
    if (boundingBox) {
      fitToObject(boundingBox);
    }
  }, [boundingBox, fitToObject]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        // 既存のprops
      >
        {/* 既存のコンポーネント */}
      </Canvas>
      
      {/* カメラコントロールUIを追加 */}
      <div className="absolute top-4 right-4 z-10">
        <CameraControls 
          onFitToObject={handleFitToObject}
          boundingBox={boundingBox}
        />
      </div>
      
      {/* 既存のTransformControlsUI */}
      <div className="absolute bottom-4 left-4 z-10">
        <TransformControlsUI 
          // 既存のprops
        />
      </div>
    </div>
  );
}
```

### タスク2.2.4: カメラ設定の最適化

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx` (改良)

#### 4.1 OrbitControlsの設定調整
```typescript
// OrbitControlsの設定を元のCascadeStudioに合わせて調整
<OrbitControls
  ref={controlsRef}
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  dampingFactor={0.05}
  enableDamping={true}
  minDistance={1}
  maxDistance={1000}
  minPolarAngle={0}
  maxPolarAngle={Math.PI}
  minAzimuthAngle={-Infinity}
  maxAzimuthAngle={Infinity}
  panSpeed={1.0}
  rotateSpeed={1.0}
  zoomSpeed={1.0}
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
```

### タスク2.2.5: E2Eテストの作成

**対象ファイル**: `tests/camera-controls.spec.ts` (新規作成)

#### 5.1 カメラコントロールのテスト実装
```typescript
import { test, expect } from '@playwright/test';

test.describe('Camera Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="3d-viewport"]');
    
    // 基本的なCADオブジェクトを生成
    await page.click('[data-testid="monaco-editor"]');
    await page.keyboard.type(`
      let box = new oc.BRepPrimAPI_MakeBox(10, 10, 10).Shape();
      cacheShape(box);
    `);
    await page.keyboard.press('F5');
    await page.waitForTimeout(2000); // CAD演算完了待ち
  });

  test('視点プリセット切り替えが動作する', async ({ page }) => {
    // Front視点
    await page.click('[data-testid="camera-front"]');
    await page.waitForTimeout(1500); // アニメーション完了待ち
    
    // Top視点
    await page.click('[data-testid="camera-top"]');
    await page.waitForTimeout(1500);
    
    // ISO視点
    await page.click('[data-testid="camera-iso"]');
    await page.waitForTimeout(1500);
    
    // エラーが発生していないことを確認
    const errors = await page.evaluate(() => {
      return window.console.error.calls || [];
    });
    expect(errors.length).toBe(0);
  });

  test('Fit to Object機能が動作する', async ({ page }) => {
    // Fit to Objectボタンをクリック
    await page.click('[data-testid="camera-fit"]');
    await page.waitForTimeout(1500); // アニメーション完了待ち
    
    // カメラがオブジェクトにフィットしていることを確認
    // （具体的な位置確認は実装に応じて調整）
    const cameraPosition = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? 'positioned' : 'not found';
    });
    expect(cameraPosition).toBe('positioned');
  });

  test('カメラアニメーションがスムーズに動作する', async ({ page }) => {
    // 複数の視点を連続で切り替え
    await page.click('[data-testid="camera-front"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="camera-right"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="camera-top"]');
    await page.waitForTimeout(1500);
    
    // アニメーション中にエラーが発生していないことを確認
    const consoleErrors = await page.evaluate(() => {
      return window.console.error.calls || [];
    });
    expect(consoleErrors.length).toBe(0);
  });

  test('既存のTransformControlsとの競合がない', async ({ page }) => {
    // オブジェクトを選択
    await page.click('[data-testid="3d-viewport"]');
    await page.waitForTimeout(500);
    
    // TransformControlsが表示されることを確認
    await expect(page.locator('[data-testid="transform-gizmo"]')).toBeVisible();
    
    // カメラ視点を変更
    await page.click('[data-testid="camera-iso"]');
    await page.waitForTimeout(1500);
    
    // TransformControlsが引き続き動作することを確認
    await expect(page.locator('[data-testid="transform-gizmo"]')).toBeVisible();
  });
});
```

## ✅ 完了条件

### 必須要件
1. **6方向視点切り替え**: Front/Back/Top/Bottom/Left/Right視点が正常に動作
2. **ISO視点**: アイソメトリック視点が正常に動作
3. **スムーズアニメーション**: 視点切り替え時に1-1.5秒のスムーズなアニメーション
4. **Fit to Object機能**: オブジェクトのバウンディングボックスに基づく自動フィット
5. **UI統合**: 既存のTransformControlsUIと競合しない配置
6. **E2Eテスト**: 全ての機能が自動テストでカバーされている

### 品質要件
1. **TypeScript型安全性**: 全ての新規コードがstrict modeに準拠
2. **パフォーマンス**: アニメーション中のフレームレート維持
3. **エラーハンドリング**: 適切なエラー処理とフォールバック
4. **既存機能との互換性**: ホバーハイライト、TransformControlsとの競合なし

## 🧪 テスト実行手順

```bash
# 開発サーバー起動
npm run dev

# E2Eテスト実行
npm run test

# 新規テストのみ実行
npx playwright test tests/camera-controls.spec.ts

# ヘッド付きテスト（デバッグ用）
npx playwright test tests/camera-controls.spec.ts --headed
```

## 📝 実装完了後の確認事項

1. **機能確認**:
   - [ ] 6方向視点切り替えが正常動作
   - [ ] ISO視点が正常動作
   - [ ] Fit to Object機能が正常動作
   - [ ] カメラアニメーションがスムーズ
   - [ ] 既存のTransformControlsとの競合なし

2. **テスト確認**:
   - [ ] 新規E2Eテストが全てパス
   - [ ] 既存テストが引き続きパス
   - [ ] TypeScript型チェックエラーなし

3. **ドキュメント更新**:
   - [ ] `docs/7_cascadestudio_migration/feature_comparison.md`の更新
   - [ ] `docs/7_cascadestudio_migration/implementation_tasks.md`の進捗更新

## 🚨 注意事項

1. **OrbitControlsとの競合**: TransformControlsと同様に、カメラアニメーション中はOrbitControlsを適切に制御してください
2. **パフォーマンス**: アニメーション中のrequestAnimationFrameの適切な管理
3. **バウンディングボックス**: 空のシーンや無効なオブジェクトに対する適切な処理
4. **既存機能の保持**: ホバーハイライト、TransformControlsなどの既存機能を破壊しないよう注意

## 📞 サポート

実装中に問題が発生した場合は、以下を参考にしてください：
- 元のCascadeStudio実装: `docs/template/js/MainPage/CascadeView.js`
- React Three Fiber公式ドキュメント: https://docs.pmnd.rs/react-three-fiber
- Three.js OrbitControls: https://threejs.org/docs/#examples/en/controls/OrbitControls

この実装により、フェーズ2.2が完了し、元のCascadeStudioと同等のカメラ操作機能が実現されます。 