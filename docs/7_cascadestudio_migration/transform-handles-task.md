# 🎯 TransformControls実装専用ガイド v2.0

## 📋 実装概要

**タスク名**: フェーズ2.1 - TransformControls（ギズモ）実装  
**状態**: ❌ 未開始  
**優先度**: 🔴 最高  
**期間**: 1.5週間（10日）  
**目標**: 元のCascadeStudioと同等の3Dオブジェクト操作機能を実現

## 🎯 実装目的

フェーズ1の基本3D機能（ホバーハイライト、MatCapマテリアル、Monaco Editor等）が **100%完了** したため、次の最重要ステップとして「**TransformControls（ギズモ）の実装**」を行います。

この機能により：
- ✅ 3Dオブジェクトの直接操作（移動・回転・スケール）が可能
- ✅ クリック選択でオブジェクトを選択・操作
- ✅ 元のCascadeStudioと同等の操作感を実現
- ✅ 現代的なReact Three Fiber実装でパフォーマンス向上

## 📚 必須参考資料

### 🔍 プロジェクト現状確認
- **[migration_plan.md](./migration_plan.md)** - フェーズ2詳細計画（最新v2.0）
- **[feature_comparison.md](./feature_comparison.md)** - 機能比較表（TransformControls未実装確認）
- **[implementation_tasks.md](./implementation_tasks.md)** - タスク2.1.1〜2.1.4の詳細手順

### 🎨 元のCascadeStudio実装
- **`docs/template/js/MainPage/CascadeViewHandles.js`** ⭐ **重要**
  - 元のトランスフォームハンドル実装の完全版
  - ギズモ表示制御、モード切り替え、空間変換ロジック
  - イベントハンドリングとカメラ制御の統合方法

### 🔧 現在の実装基盤（活用可能）
- **`components/threejs/ThreeJSViewport.tsx`** - 3Dビューポート基盤（完成済み）
- **`components/threejs/RaycastingHandler.tsx`** - レイキャスティング基盤（完成済み）
- **`components/threejs/HoverTooltip.tsx`** - ツールチップ機能（完成済み）
- **`components/threejs/materials/MatCapMaterial.tsx`** - マテリアル機能（完成済み）

---

## 🚀 実装タスク詳細

### 📦 タスク2.1.1: TransformGizmo基盤作成 ⭐ **最重要**

**ファイル**: `components/threejs/TransformGizmo.tsx` (新規作成)  
**期間**: 3日  
**優先度**: 🔴 最高

#### 実装仕様
```typescript
// 完全実装すべき基本構造
import { TransformControls } from '@react-three/drei';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TransformGizmoProps {
  selectedObject: THREE.Object3D | null;
  mode: 'translate' | 'rotate' | 'scale';
  space: 'local' | 'world';
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
      controls.removeEventListener('dragging-changed', handleDragStart);
      controls.removeEventListener('objectChange', handleObjectChange);
    };
  }, [handleDragStart, handleDragEnd, handleObjectChange]);
  
  // ✨ レンダリング条件
  if (!selectedObject || !enabled) return null;
  
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
```

#### 実装チェックリスト
- ✅ @react-three/dreiのTransformControls統合
- ✅ モード切り替え（translate/rotate/scale）対応
- ✅ 空間切り替え（local/world）対応
- ✅ OrbitControlsとの競合解決
- ✅ オブジェクト変更イベントハンドリング
- ✅ ドラッグ開始/終了イベント
- ✅ TypeScript型安全性確保

---

### 📦 タスク2.1.2: ObjectSelector実装

**ファイル**: `components/threejs/ObjectSelector.tsx` (新規作成)  
**期間**: 2日  
**優先度**: 🔴 高

#### 実装仕様
```typescript
import { useCallback, useRef } from 'react';
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
    const rect = event.target.getBoundingClientRect();
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
      if (multiSelect && event.ctrlKey) {
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
```

#### 実装チェックリスト
- ✅ クリック検出とレイキャスティング
- ✅ 選択可能オブジェクトのフィルタリング
- ✅ マルチセレクション対応（Ctrl+クリック）
- ✅ Escapeキーでの選択解除
- ✅ 空白クリックでの選択解除

---

### 📦 タスク2.1.3: TransformControlsUI実装

**ファイル**: `components/threejs/TransformControlsUI.tsx` (新規作成)  
**期間**: 2日  
**優先度**: 🟡 中

#### 実装仕様
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { 
  Move3D, 
  RotateCw, 
  Scale3D, 
  Globe,
  Box,
  Eye,
  EyeOff 
} from 'lucide-react';

interface TransformControlsUIProps {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'local' | 'world';
  visible: boolean;
  enabled: boolean;
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
  onSpaceChange: (space: 'local' | 'world') => void;
  onVisibilityChange: (visible: boolean) => void;
  selectedObjectName?: string;
}

export function TransformControlsUI({
  mode,
  space,
  visible,
  enabled,
  onModeChange,
  onSpaceChange,
  onVisibilityChange,
  selectedObjectName
}: TransformControlsUIProps) {
  return (
    <div className="transform-controls-ui bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      {/* 選択オブジェクト情報 */}
      <div className="mb-2 text-sm text-gray-600">
        {selectedObjectName ? (
          <span>選択中: {selectedObjectName}</span>
        ) : (
          <span>オブジェクトが選択されていません</span>
        )}
      </div>
      
      {/* モード切り替えボタン */}
      <div className="flex gap-1 mb-2">
        <Button
          variant={mode === 'translate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('translate')}
          disabled={!enabled}
          title="移動モード (G)"
        >
          <Move3D className="w-4 h-4" />
        </Button>
        
        <Button
          variant={mode === 'rotate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('rotate')}
          disabled={!enabled}
          title="回転モード (R)"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        
        <Button
          variant={mode === 'scale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('scale')}
          disabled={!enabled}
          title="スケールモード (S)"
        >
          <Scale3D className="w-4 h-4" />
        </Button>
      </div>
      
      {/* 空間切り替えボタン */}
      <div className="flex gap-1 mb-2">
        <Button
          variant={space === 'world' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('world')}
          disabled={!enabled}
          title="ワールド空間"
        >
          <Globe className="w-4 h-4" />
          <span className="ml-1">ワールド</span>
        </Button>
        
        <Button
          variant={space === 'local' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('local')}
          disabled={!enabled}
          title="ローカル空間"
        >
          <Box className="w-4 h-4" />
          <span className="ml-1">ローカル</span>
        </Button>
      </div>
      
      {/* 表示切り替え */}
      <div className="flex items-center gap-2">
        <Toggle
          pressed={visible}
          onPressedChange={onVisibilityChange}
          disabled={!enabled}
          size="sm"
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="ml-1">ギズモ表示</span>
        </Toggle>
      </div>
      
      {/* キーボードショートカットヒント */}
      <div className="mt-2 text-xs text-gray-500">
        <div>G: 移動 | R: 回転 | S: スケール</div>
        <div>Esc: 選択解除</div>
      </div>
    </div>
  );
}
```

#### 実装チェックリスト
- ✅ モード切り替えUI（移動・回転・スケール）
- ✅ 空間切り替えUI（ローカル・ワールド）
- ✅ ギズモ表示/非表示切り替え
- ✅ 選択オブジェクト情報表示
- ✅ キーボードショートカット表示
- ✅ アクセシビリティ対応（ツールチップ）

---

### 📦 タスク2.1.4: ThreeJSViewportへの統合

**ファイル**: `components/threejs/ThreeJSViewport.tsx` (改良)  
**期間**: 1日  
**優先度**: 🔴 高

#### 統合実装
```typescript
// 既存のimportに追加
import { TransformGizmo } from './TransformGizmo';
import { ObjectSelector } from './ObjectSelector';
import { TransformControlsUI } from './TransformControlsUI';
import { useState, useCallback } from 'react';

// ThreeJSViewportコンポーネント内で
export function ThreeJSViewport(props: ThreeJSViewportProps) {
  // 🎯 TransformControls状態管理
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [transformSpace, setTransformSpace] = useState<'local' | 'world'>('world');
  const [isTransformVisible, setIsTransformVisible] = useState<boolean>(true);
  
  // 🔧 オブジェクト変更ハンドラー
  const handleObjectChange = useCallback((object: THREE.Object3D) => {
    console.log('Object transformed:', {
      position: object.position.toArray(),
      rotation: object.rotation.toArray(),
      scale: object.scale.toArray()
    });
    
    // TODO: 変更をプロジェクト状態に保存
  }, []);
  
  // 🎯 オブジェクト選択ハンドラー
  const handleSelectObject = useCallback((object: THREE.Object3D | null) => {
    setSelectedObject(object);
    console.log('Object selected:', object?.name || 'None');
  }, []);
  
  // ⌨️ キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedObject) return;
      
      switch (event.key.toLowerCase()) {
        case 'g':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          setTransformMode('scale');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);
  
  return (
    <div className="relative w-full h-full">
      {/* Transform Controls UI */}
      {selectedObject && (
        <div className="absolute top-4 left-4 z-10">
          <TransformControlsUI
            mode={transformMode}
            space={transformSpace}
            visible={isTransformVisible}
            enabled={!!selectedObject}
            onModeChange={setTransformMode}
            onSpaceChange={setTransformSpace}
            onVisibilityChange={setIsTransformVisible}
            selectedObjectName={selectedObject?.name || selectedObject?.type}
          />
        </div>
      )}
      
      <Canvas>
        {/* 既存のライティング・カメラ設定 */}
        {/* ... */}
        
        <ObjectSelector onSelectObject={handleSelectObject}>
          {/* 既存の3Dコンテンツ */}
          {models.map((model, index) => (
            <ThreeJSModel
              key={index}
              geometry={model.geometry}
              material={model.material}
              position={model.position}
              rotation={model.rotation}
              scale={model.scale}
            />
          ))}
        </ObjectSelector>
        
        {/* TransformGizmo */}
        <TransformGizmo
          selectedObject={selectedObject}
          mode={transformMode}
          space={transformSpace}
          enabled={isTransformVisible}
          onObjectChange={handleObjectChange}
        />
        
        {/* 既存のコンポーネント */}
        <RaycastingHandler />
        <HoverTooltip />
      </Canvas>
    </div>
  );
}
```

#### 統合チェックリスト
- ✅ 既存のホバーハイライト機能との統合
- ✅ TransformControls状態管理の追加
- ✅ UI配置とz-index管理
- ✅ キーボードショートカット統合
- ✅ イベントハンドリングの統一

---

## 🧪 テスト実装

### 📦 E2Eテスト作成

**ファイル**: `tests/transform-controls.spec.ts` (新規作成)  
**期間**: 2日  
**優先度**: 🔴 高

#### テスト実装
```typescript
import { test, expect } from '@playwright/test';

test.describe('TransformControls機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // OpenCascade.js読み込み完了を待機
    await page.waitForFunction(() => window.cascadeTestUtils?.isReady(), {
      timeout: 60000
    });
    
    // テスト用サンプルオブジェクト作成
    await page.evaluate(() => {
      window.cascadeTestUtils?.createTestBox();
    });
    
    await page.waitForTimeout(1000);
  });

  test('オブジェクト選択でTransformGizmoが表示される', async ({ page }) => {
    // キャンバス内のオブジェクトをクリック
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // TransformControlsが表示されることを確認
    const hasTransformControls = await page.evaluate(() => {
      return window.cascadeTestUtils?.hasTransformControls();
    });
    
    expect(hasTransformControls).toBeTruthy();
    
    // UIコンポーネントが表示されることを確認
    await expect(page.locator('.transform-controls-ui')).toBeVisible();
  });

  test('移動モードでオブジェクトが移動できる', async ({ page }) => {
    // オブジェクト選択
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // 移動モードボタンをクリック
    await page.click('button[title="移動モード (G)"]');
    
    // オブジェクトの初期位置を記録
    const initialPosition = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectPosition();
    });
    
    // ドラッグ操作でオブジェクトを移動
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(450, 300);
    await page.mouse.up();
    
    // 位置が変わったことを確認
    const newPosition = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectPosition();
    });
    
    expect(newPosition).not.toEqual(initialPosition);
  });

  test('回転モードでオブジェクトが回転できる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.click('button[title="回転モード (R)"]');
    
    const initialRotation = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectRotation();
    });
    
    // 回転操作
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(420, 280);
    await page.mouse.up();
    
    const newRotation = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectRotation();
    });
    
    expect(newRotation).not.toEqual(initialRotation);
  });

  test('キーボードショートカットでモード切り替えができる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // Gキーで移動モード
    await page.keyboard.press('g');
    await expect(page.locator('button[title="移動モード (G)"][variant="default"]')).toBeVisible();
    
    // Rキーで回転モード
    await page.keyboard.press('r');
    await expect(page.locator('button[title="回転モード (R)"][variant="default"]')).toBeVisible();
    
    // Sキーでスケールモード
    await page.keyboard.press('s');
    await expect(page.locator('button[title="スケールモード (S)"][variant="default"]')).toBeVisible();
  });

  test('Escapeキーで選択解除ができる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // 選択されていることを確認
    await expect(page.locator('.transform-controls-ui')).toBeVisible();
    
    // Escapeキーで選択解除
    await page.keyboard.press('Escape');
    
    // UIが消えることを確認
    await expect(page.locator('.transform-controls-ui')).not.toBeVisible();
  });
});
```

### テストユーティリティ追加

**ファイル**: `lib/test-utils/cascadeTestUtils.ts` (改良)
```typescript
// 既存のテストユーティリティに追加
export class CascadeTestUtils {
  // ... 既存のメソッド

  hasTransformControls(): boolean {
    // TransformControlsが存在するかチェック
    return this.scene?.children.some(child => 
      child.userData?.isTransformControls === true
    ) || false;
  }

  getSelectedObjectPosition(): [number, number, number] | null {
    const selected = this.getSelectedObject();
    return selected ? selected.position.toArray() : null;
  }

  getSelectedObjectRotation(): [number, number, number] | null {
    const selected = this.getSelectedObject();
    return selected ? selected.rotation.toArray() : null;
  }

  createTestBox(): void {
    // テスト用のボックスオブジェクトを作成
    // CADワーカーを使用してBox()を実行
  }
}
```

---

## ✅ 完了判定基準

### 必須要件
1. ✅ TransformControlsが正しく実装され、オブジェクトの選択・操作が可能
2. ✅ 移動・回転・スケールの3つのモードが正常に動作
3. ✅ ローカル/ワールド空間の切り替えが機能
4. ✅ ギズモの表示/非表示の切り替えが可能
5. ✅ UIコントロールが適切に配置され、操作可能
6. ✅ 全てのE2Eテストがパス
7. ✅ キーボードショートカット（G/R/S/Escape）が動作
8. ✅ OrbitControlsとの競合が解決されている

### 品質基準
- TypeScript strict mode準拠
- ESLint/Prettier適用
- パフォーマンス最適化（60fps維持）
- アクセシビリティ対応
- エラーハンドリング実装

---

## 🚀 次のステップ

この実装が完了したら、次は **タスク2.2: カメラコントロール高度機能** に進みます：

1. **視点プリセット機能改良** - 6方向 + ISO視点
2. **Fit to Object機能実装** - 自動フレームイン
3. **カメラアニメーション** - スムーズな視点変更

---

## 💡 実装のヒント

### 技術的ポイント
1. **@react-three/drei活用**: TransformControlsコンポーネントを基盤として使用
2. **競合解決**: OrbitControlsとTransformControlsのイベント制御が重要
3. **レイキャスティング**: 既存のRaycastingHandlerを拡張して選択機能を実装
4. **状態管理**: React stateとThree.jsオブジェクトの同期に注意
5. **パフォーマンス**: useCallback、useMemoで最適化

### 参考実装
- 元の `CascadeViewHandles.js` - 基本ロジックの参考
- 既存の `RaycastingHandler.tsx` - レイキャスティング実装例
- 既存の `ThreeJSViewport.tsx` - イベントハンドリング統合例

### デバッグ方法
- ブラウザ開発者ツールでThree.jsオブジェクトを確認
- `console.log`でイベント発火を確認
- テストユーティリティでオブジェクト状態を監視

この専用ガイドv2.0に従って実装することで、元のCascadeStudioを超える高品質なTransformControls機能を実現できます！ 