# 🎯 CascadeStudio移行作業 - フェーズ2.1実装指示書

## 📋 作業概要

**作業名**: フェーズ2.1 - トランスフォームハンドル（ギズモ）の実装  
**優先度**: 🔴 高  
**期間**: 10日  
**担当者**: 次期AI作業者  

## 🎯 作業目的

フェーズ1の基本3D機能が完了したため、次のステップとして「トランスフォームハンドル（ギズモ）の実装」を行います。これにより、ユーザーが3Dオブジェクトを直接操作（移動、回転、拡大縮小）できるようになります。元のCascadeStudioのCascadeViewHandles.jsの機能を、React Three Fiberを使用して再実装します。この機能は3Dモデリングの基本操作として重要であり、ユーザー体験を大幅に向上させます。

**重要**: 実装完了後、必ずテストを作成・実行し、全テストがパスしてから完了とします。

## 📚 必須参考資料

### 1. 移行計画書
- **`docs/7_cascadestudio_migration/README.md`** - 全体概要（フェーズ2の優先項目を確認）
- **`docs/7_cascadestudio_migration/feature_comparison.md`** - 機能比較表（トランスフォーム機能セクションを確認）
- **`docs/7_cascadestudio_migration/implementation_tasks.md`** - タスク2.1.1〜2.1.4の詳細

### 2. 元のCascadeStudio実装
- **`docs/template/js/MainPage/CascadeViewHandles.js`** - 元のトランスフォームハンドル実装
- ギズモの表示/非表示、移動/回転/スケールモードの切り替え、ローカル/ワールド空間の切り替えなどの機能を確認

### 3. 現在の実装
- **`components/threejs/ThreeJSViewport.tsx`** - 3Dビューポートのメイン実装
- **`components/threejs/ThreeJSModel.tsx`** - 3Dモデル表示コンポーネント
- **`components/threejs/RaycastingHandler.tsx`** - レイキャスティング機能（オブジェクト選択の基盤）

## 🔧 具体的な作業内容

### タスク1: TransformControlsの統合

**対象ファイル**: `components/threejs/TransformGizmo.tsx` (新規作成)

#### 1.1 基本的なTransformControlsコンポーネントの作成
```typescript
import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';

interface TransformGizmoProps {
  selectedObject: THREE.Object3D | null;
  mode?: 'translate' | 'rotate' | 'scale';
  space?: 'world' | 'local';
  size?: number;
  visible?: boolean;
  onObjectChange?: (object: THREE.Object3D) => void;
}

export function TransformGizmo({
  selectedObject,
  mode = 'translate',
  space = 'world',
  size = 1,
  visible = true,
  onObjectChange
}: TransformGizmoProps) {
  const transformRef = useRef<any>(null);
  const { camera, gl } = useThree();
  
  // OrbitControlsとの競合を防ぐ
  useEffect(() => {
    if (!transformRef.current) return;
    
    const controls = transformRef.current;
    const callback = (event) => {
      const { camera } = event.target;
      // カメラの位置を更新するロジック
    };
    
    controls.addEventListener('dragging-changed', callback);
    return () => controls.removeEventListener('dragging-changed', callback);
  }, [transformRef]);
  
  // 変更イベントの処理
  useEffect(() => {
    if (!transformRef.current || !onObjectChange) return;
    
    const controls = transformRef.current;
    const callback = () => {
      if (selectedObject) {
        onObjectChange(selectedObject);
      }
    };
    
    controls.addEventListener('objectChange', callback);
    return () => controls.removeEventListener('objectChange', callback);
  }, [transformRef, selectedObject, onObjectChange]);
  
  if (!selectedObject || !visible) return null;
  
  return (
    <TransformControls
      ref={transformRef}
      object={selectedObject}
      mode={mode}
      space={space}
      size={size}
    />
  );
}
```

### タスク2: オブジェクト選択機能の実装

**対象ファイル**: `components/threejs/ObjectSelector.tsx` (新規作成)

#### 2.1 オブジェクト選択コンポーネントの作成
```typescript
import { useState, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ObjectSelectorProps {
  children: React.ReactNode;
  onSelect?: (object: THREE.Object3D | null) => void;
}

export function ObjectSelector({ children, onSelect }: ObjectSelectorProps) {
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const { scene, camera } = useThree();
  const raycaster = new THREE.Raycaster();
  
  // クリックイベントでオブジェクトを選択
  const handleClick = useCallback((event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // メッシュオブジェクトのみを対象に
    const meshes = [];
    scene.traverse((object) => {
      if (object.type === 'Mesh' && object.visible) {
        meshes.push(object);
      }
    });
    
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const newSelectedObject = intersects[0].object;
      setSelectedObject(newSelectedObject);
      if (onSelect) onSelect(newSelectedObject);
    } else {
      setSelectedObject(null);
      if (onSelect) onSelect(null);
    }
  }, [camera, scene, raycaster, onSelect]);
  
  // イベントリスナーの設定
  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);
  
  return (
    <>
      {children}
      {selectedObject && (
        <mesh>
          {/* 選択状態の視覚的表示（オプション） */}
        </mesh>
      )}
    </>
  );
}
```

### タスク3: ThreeJSViewportへの統合

**対象ファイル**: `components/threejs/ThreeJSViewport.tsx`

#### 3.1 トランスフォームコントロールの統合
```typescript
// 既存のインポートに追加
import { TransformGizmo } from './TransformGizmo';
import { ObjectSelector } from './ObjectSelector';
import { useState } from 'react';

// コンポーネント内で
const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
const [transformSpace, setTransformSpace] = useState<'world' | 'local'>('world');
const [isTransformVisible, setIsTransformVisible] = useState<boolean>(true);

// オブジェクト変更時のハンドラー
const handleObjectChange = useCallback((object: THREE.Object3D) => {
  // 変更を処理（例：位置や回転の更新をUIに反映）
  console.log('Object transformed:', object.position, object.rotation, object.scale);
}, []);

// Canvasコンポーネント内に追加
<Canvas>
  {/* 既存のコンポーネント */}
  
  <ObjectSelector onSelect={setSelectedObject}>
    {/* 既存の3Dオブジェクト */}
  </ObjectSelector>
  
  <TransformGizmo
    selectedObject={selectedObject}
    mode={transformMode}
    space={transformSpace}
    visible={isTransformVisible}
    onObjectChange={handleObjectChange}
  />
</Canvas>
```

### タスク4: トランスフォームコントロールUI

**対象ファイル**: `components/threejs/TransformControlsUI.tsx` (新規作成)

#### 4.1 コントロールUIの作成
```typescript
import { useState } from 'react';

interface TransformControlsUIProps {
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
  onSpaceChange: (space: 'world' | 'local') => void;
  onVisibilityChange: (visible: boolean) => void;
}

export function TransformControlsUI({
  onModeChange,
  onSpaceChange,
  onVisibilityChange
}: TransformControlsUIProps) {
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [space, setSpace] = useState<'world' | 'local'>('world');
  const [visible, setVisible] = useState<boolean>(true);
  
  const handleModeChange = (newMode: 'translate' | 'rotate' | 'scale') => {
    setMode(newMode);
    onModeChange(newMode);
  };
  
  const handleSpaceChange = (newSpace: 'world' | 'local') => {
    setSpace(newSpace);
    onSpaceChange(newSpace);
  };
  
  const handleVisibilityChange = (newVisible: boolean) => {
    setVisible(newVisible);
    onVisibilityChange(newVisible);
  };
  
  return (
    <div className="transform-controls-ui">
      <div className="transform-mode-buttons">
        <button
          className={mode === 'translate' ? 'active' : ''}
          onClick={() => handleModeChange('translate')}
        >
          移動
        </button>
        <button
          className={mode === 'rotate' ? 'active' : ''}
          onClick={() => handleModeChange('rotate')}
        >
          回転
        </button>
        <button
          className={mode === 'scale' ? 'active' : ''}
          onClick={() => handleModeChange('scale')}
        >
          拡大縮小
        </button>
      </div>
      
      <div className="transform-space-buttons">
        <button
          className={space === 'world' ? 'active' : ''}
          onClick={() => handleSpaceChange('world')}
        >
          ワールド
        </button>
        <button
          className={space === 'local' ? 'active' : ''}
          onClick={() => handleSpaceChange('local')}
        >
          ローカル
        </button>
      </div>
      
      <div className="transform-visibility">
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => handleVisibilityChange(e.target.checked)}
          />
          ギズモ表示
        </label>
      </div>
    </div>
  );
}
```

### タスク5: CascadeViewHandles.jsの機能移植

**対象ファイル**: `components/threejs/TransformHandles.tsx` (新規作成)

#### 5.1 元の実装の高度な機能の移植
```typescript
// 元のCascadeViewHandles.jsから必要な機能を移植
// 例：特殊なハンドル操作、カスタムギズモなど

// 詳細は元の実装を分析して必要な機能を特定し、
// React Three Fiber向けに書き換える
```

### タスク6: テスト実装

**新規作成ファイル**: `tests/transform-controls.spec.ts`

#### 6.1 トランスフォームコントロールのテスト
```typescript
import { test, expect } from '@playwright/test';

test.describe('トランスフォームコントロール機能', () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:3000/cad-editor');
    
    // ローディングが完了するまで待機
    await page.waitForSelector('canvas', { timeout: 60000 });
    
    // サンプルオブジェクトを作成（例：ボックス）
    // ...
  });

  test('オブジェクトを選択するとトランスフォームギズモが表示される', async ({ page }) => {
    // オブジェクトをクリック
    await page.mouse.click(400, 300);
    
    // ギズモが表示されることを確認
    const hasGizmo = await page.evaluate(() => {
      return window.cascadeTestUtils?.hasTransformControls() || false;
    });
    
    expect(hasGizmo).toBeTruthy();
  });

  test('移動モードでオブジェクトを移動できる', async ({ page }) => {
    // オブジェクトを選択
    await page.mouse.click(400, 300);
    
    // 移動モードに設定
    await page.click('button:has-text("移動")');
    
    // 移動操作（ドラッグ）
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(450, 300);
    await page.mouse.up();
    
    // オブジェクトの位置が変わったことを確認
    const positionChanged = await page.evaluate(() => {
      return window.cascadeTestUtils?.checkObjectPositionChanged() || false;
    });
    
    expect(positionChanged).toBeTruthy();
  });

  // 回転モードとスケールモードのテストも追加
});
```

## 📋 完了条件

1. TransformControlsが正しく実装され、オブジェクトの選択・操作が可能
2. 移動・回転・スケールの3つのモードが正常に動作
3. ローカル/ワールド空間の切り替えが機能
4. ギズモの表示/非表示の切り替えが可能
5. UIコントロールが適切に配置され、操作可能
6. 全てのテストがパス

## 🚀 次のステップ

この実装が完了したら、次は**フェーズ2.2: カメラコントロールの改善**に進みます。特に「視点プリセット機能」と「カメラアニメーション」が重要な実装項目となります。

## 💡 実装のヒント

1. `@react-three/drei`の`TransformControls`コンポーネントを基盤として使用することで、基本的な機能は簡単に実装できます。
2. OrbitControlsとTransformControlsが競合する場合があるため、ドラッグ中はカメラコントロールを一時的に無効化する処理が必要です。
3. オブジェクト選択は既存のレイキャスティング機能を拡張して実装できます。
4. 元のCascadeViewHandles.jsの実装を参考に、必要な機能を特定し、React Three Fiber向けに書き換えてください。
5. テスト用のユーティリティ関数（`window.cascadeTestUtils`）に、トランスフォームコントロールのテスト用メソッドを追加してください。

## 📞 サポート

実装中に疑問や問題が発生した場合：

1. **機能比較表**で元の実装を確認
2. **タスクリスト**の実装例を参照
3. **元のソースコード**(`docs/template/js/MainPage/CascadeViewHandles.js`)を詳細確認 