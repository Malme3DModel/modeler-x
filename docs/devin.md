# 🎯 CascadeStudio移行作業 - フェーズ1開始指示書

## 📋 作業概要

**作業名**: フェーズ1 - 基本3D機能の完成（レイキャスティング基盤実装 + テスト）  
**優先度**: 🔴 最高  
**期間**: 2日  
**担当者**: 次期AI作業者  

## 🎯 作業目的

元のCascadeStudioの**最重要機能**である「マウスホバーによるフェイス・エッジハイライト」機能を実現するため、React Three Fiberでのレイキャスティング基盤を実装してください。この機能により、ユーザーが3Dオブジェクトにマウスをホバーした際に、該当するフェイスやエッジが視覚的にハイライトされます。

**重要**: 実装完了後、必ずテストを作成・実行し、全テストがパスしてから完了とします。

## 📚 必須参考資料

### 1. 移行計画書
- **`docs/7_cascadestudio_migration/README.md`** - 全体概要
- **`docs/7_cascadestudio_migration/feature_comparison.md`** - 機能比較表（3Dインタラクション部分を確認）
- **`docs/7_cascadestudio_migration/implementation_tasks.md`** - タスク1.1.1の詳細

### 2. 元のCascadeStudio実装
- **`docs/template/js/MainPage/CascadeView.js`** - 元のレイキャスティング実装（310-350行目付近）
- 特に`this.raycaster`と`intersectObjects`の使用方法を参考にしてください

### 3. 現在の実装
- **`components/threejs/CascadeViewport.tsx`** - 修正対象メインファイル
- **`hooks/useCADWorker.ts`** - CADワーカーとの連携部分
- **`tests/`** - 既存のテストフォルダ

## 🔧 具体的な作業内容

### タスク1: React Three FiberでのRaycaster実装

**対象ファイル**: `components/threejs/CascadeViewport.tsx`

#### 1.1 必要なインポートの追加
```typescript
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState, useCallback } from 'react';
```

#### 1.2 レイキャスター状態の追加
```typescript
// 実装する状態管理
const raycaster = useRef(new THREE.Raycaster());
const mouse = useRef(new THREE.Vector2());
const [hoveredObject, setHoveredObject] = useState<THREE.Object3D | null>(null);
const [hoveredFace, setHoveredFace] = useState<number | null>(null);
const [isRaycastingEnabled, setIsRaycastingEnabled] = useState(true);
```

#### 1.3 マウスイベントハンドラーの実装
```typescript
const handleMouseMove = useCallback((event: MouseEvent) => {
  if (!isRaycastingEnabled) return;
  
  // マウス座標の正規化（-1 to 1の範囲）
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}, [isRaycastingEnabled]);
```

#### 1.4 レイキャスティング処理の実装
```typescript
useFrame(() => {
  if (shapes.length === 0 || !isRaycastingEnabled) return;
  
  // カメラとマウス座標からレイを発射
  raycaster.current.setFromCamera(mouse.current, camera);
  
  // 3Dオブジェクトとの交差判定
  const intersects = raycaster.current.intersectObjects(scene.children, true);
  
  if (intersects.length > 0) {
    const intersection = intersects[0];
    // ハイライト処理（次のタスクで詳細実装）
    setHoveredObject(intersection.object);
    
    // フェイスインデックスの取得
    if (intersection.face) {
      setHoveredFace(intersection.faceIndex || 0);
    }
    
    // テスト用のデータ属性を追加
    intersection.object.userData.isHovered = true;
    intersection.object.userData.hoveredFace = intersection.faceIndex;
  } else {
    // ハイライト解除
    if (hoveredObject) {
      hoveredObject.userData.isHovered = false;
      hoveredObject.userData.hoveredFace = null;
    }
    setHoveredObject(null);
    setHoveredFace(null);
  }
});
```

#### 1.5 テスト用のアクセス機能追加
```typescript
// テスト用のコンポーネント外部アクセス機能
useEffect(() => {
  // グローバルオブジェクトにテスト用関数を登録
  (window as any).cascadeTestUtils = {
    getRaycastingState: () => ({
      isEnabled: isRaycastingEnabled,
      hoveredObject: hoveredObject?.uuid || null,
      hoveredFace: hoveredFace,
    }),
    enableRaycasting: () => setIsRaycastingEnabled(true),
    disableRaycasting: () => setIsRaycastingEnabled(false),
  };
  
  return () => {
    delete (window as any).cascadeTestUtils;
  };
}, [isRaycastingEnabled, hoveredObject, hoveredFace]);
```

### タスク2: イベントリスナーの統合

**Canvas要素**にマウスイベントを追加：
```typescript
<Canvas
  onMouseMove={handleMouseMove}
  style={{ width: '100%', height: '100%' }}
  data-testid="cascade-3d-viewport"
  // その他の既存props
>
```

### タスク3: デバッグ機能の追加

コンソールでの確認機能を追加：
```typescript
// デバッグ用の状態表示
useEffect(() => {
  if (hoveredObject) {
    console.log('🎯 ホバー中オブジェクト:', hoveredObject.name || 'Unnamed', hoveredObject.uuid);
  }
  if (hoveredFace !== null) {
    console.log('📐 ホバー中フェイス番号:', hoveredFace);
  }
}, [hoveredObject, hoveredFace]);
```

## 🧪 テスト実装（必須）

### タスク4: E2Eテストの作成

**新規作成ファイル**: `tests/raycasting.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('3Dビューポート レイキャスティング機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cascade-studio');
    
    // CADワーカーの初期化を待機
    await page.waitForSelector('[data-testid="cascade-3d-viewport"]', { 
      timeout: 10000 
    });
    
    // 簡単な3Dオブジェクトを生成
    const evaluateButton = page.locator('button:has-text("Evaluate")');
    if (await evaluateButton.isVisible()) {
      await evaluateButton.click();
      await page.waitForTimeout(2000); // 3Dオブジェクト生成待機
    }
  });

  test('レイキャスティング機能が初期化されている', async ({ page }) => {
    // テスト用ユーティリティが存在することを確認
    const raycastingState = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getRaycastingState();
    });

    expect(raycastingState).toBeDefined();
    expect(raycastingState.isEnabled).toBe(true);
    expect(raycastingState.hoveredObject).toBeNull();
    expect(raycastingState.hoveredFace).toBeNull();
  });

  test('3Dビューポート上でマウス移動が検出される', async ({ page }) => {
    const viewport = page.locator('[data-testid="cascade-3d-viewport"]');
    
    // ビューポートの中央にマウスを移動
    await viewport.hover();
    
    // 少し待機してレイキャスティング処理が実行されるのを待つ
    await page.waitForTimeout(100);
    
    // マウス移動イベントが処理されたことを確認
    const raycastingState = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getRaycastingState();
    });
    
    expect(raycastingState.isEnabled).toBe(true);
  });

  test('レイキャスティングの有効/無効切り替えが動作する', async ({ page }) => {
    // レイキャスティングを無効にする
    await page.evaluate(() => {
      (window as any).cascadeTestUtils?.disableRaycasting();
    });

    let raycastingState = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getRaycastingState();
    });
    expect(raycastingState.isEnabled).toBe(false);

    // レイキャスティングを有効にする
    await page.evaluate(() => {
      (window as any).cascadeTestUtils?.enableRaycasting();
    });

    raycastingState = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getRaycastingState();
    });
    expect(raycastingState.isEnabled).toBe(true);
  });

  test('3Dオブジェクトとの交差判定が動作する', async ({ page }) => {
    const viewport = page.locator('[data-testid="cascade-3d-viewport"]');
    
    // ビューポートの異なる位置でマウス移動をテスト
    const positions = [
      { x: 100, y: 100 },
      { x: 200, y: 150 },
      { x: 300, y: 200 }
    ];

    for (const pos of positions) {
      await viewport.hover({ position: pos });
      await page.waitForTimeout(50);
      
      const raycastingState = await page.evaluate(() => {
        return (window as any).cascadeTestUtils?.getRaycastingState();
      });
      
      // レイキャスティングが実行されていることを確認
      expect(raycastingState).toBeDefined();
    }
  });
});
```

### タスク5: ユニットテストの作成（可能であれば）

**新規作成ファイル**: `tests/unit/raycasting.test.ts`

```typescript
/**
 * レイキャスティング機能のユニットテスト
 * 注意: React Three Fiberコンポーネントのため、統合テストが主体
 */

import { describe, it, expect } from 'vitest';

describe('レイキャスティング ユーティリティ', () => {
  it('マウス座標の正規化が正しく計算される', () => {
    // マウス座標正規化のロジックをテスト
    const normalizeMouseCoords = (
      clientX: number, 
      clientY: number, 
      rectLeft: number, 
      rectTop: number, 
      rectWidth: number, 
      rectHeight: number
    ) => {
      const x = ((clientX - rectLeft) / rectWidth) * 2 - 1;
      const y = -((clientY - rectTop) / rectHeight) * 2 + 1;
      return { x, y };
    };

    const result = normalizeMouseCoords(100, 100, 0, 0, 200, 200);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);

    const cornerResult = normalizeMouseCoords(200, 200, 0, 0, 200, 200);
    expect(cornerResult.x).toBe(1);
    expect(cornerResult.y).toBe(-1);
  });
});
```

## 🧪 テスト実行

### タスク6: テスト実行とパス確認

#### 6.1 E2Eテストの実行
```bash
# Playwrightテストの実行
npm run test:e2e

# または特定のテストファイルのみ
npx playwright test tests/raycasting.spec.ts
```

#### 6.2 ユニットテスト実行（Vitestが設定されている場合）
```bash
# ユニットテストの実行
npm run test:unit

# または
npx vitest run tests/unit/raycasting.test.ts
```

#### 6.3 全テストの実行
```bash
# 全テストスイートの実行
npm test
```

## ✅ 完了条件（テスト含む）

### 必須条件
1. **機能実装完了**:
   - マウス移動検出が正常に動作
   - レイキャスティングが正常に動作
   - 3Dオブジェクトとの交差判定が動作
   - TypeScript型エラーやランタイムエラーが発生しない

2. **テスト実装完了**:
   - E2Eテスト（`tests/raycasting.spec.ts`）が作成されている
   - ユニットテスト（可能であれば）が作成されている
   - テスト用のアクセス機能が実装されている

3. **全テストパス**:
   - 既存のテストが引き続きパスしている
   - 新しく作成したレイキャスティングテストがパスしている
   - テストカバレッジが適切に設定されている

### 確認方法
1. **機能確認**:
   - アプリケーションを起動
   - CADコードを実行して3Dオブジェクトを表示
   - マウスをオブジェクト上で動かす
   - ブラウザのコンソールで交差情報が表示されることを確認

2. **テスト確認**:
   - `npm run test:e2e` でE2Eテストが全てパス
   - `npm test` で全テストスイートがパス
   - テストレポートで新機能のテストが含まれていることを確認

## 🚨 注意事項

### パフォーマンス
- `useFrame`内での重い処理は避ける
- 不要な再レンダリングを防ぐため適切にメモ化する
- テスト実行時のタイムアウトに注意

### Three.jsのバージョン対応
- React Three Fiberのバージョンに対応したThree.js APIを使用
- 型定義の互換性に注意

### 既存機能への影響
- 既存のOrbitControlsやカメラ操作に干渉しないよう注意
- 既存の3D表示機能を壊さないよう慎重に実装
- **既存テストを壊さないよう注意**

### テスト環境
- Playwrightの設定を確認
- ヘッドレスモードでのテスト実行を確認
- CI/CD環境でのテスト実行を想定

## 📁 作業完了時の提出物

1. **修正されたファイル**: `components/threejs/CascadeViewport.tsx`
2. **新規テストファイル**: 
   - `tests/raycasting.spec.ts`
   - `tests/unit/raycasting.test.ts`（可能であれば）
3. **テスト実行結果**: 全テストパス済みのレポート
4. **動作確認レポート**: 実装した機能の動作確認結果
5. **次のタスクへの引き継ぎ**: 発見した課題や改善点

## 🔄 次のステップ

この基盤実装とテストが完了したら、次は**タスク1.1.2: フェイスハイライト機能**の実装に進みます。レイキャスティングで取得した交差情報を使用して、実際にオブジェクトの色を変更する機能を実装し、同様にテストも作成します。

## 💬 質問・相談

実装中に不明点があれば：
1. 元のCascadeView.jsの該当部分を詳細確認
2. 機能比較表で元の仕様を確認
3. 既存のテストファイルの構造を参考にする
4. 現在の実装状況を把握してから実装開始

**重要**: 
- この作業は全フェーズの中で最も重要な基盤となります
- **テストパスは完了の必須条件**です
- 既存機能を壊さないよう慎重に実装してください

---
**作業開始**: 即座に開始可能  
**完了予定**: 2日以内（テスト含む）  
**完了条件**: 機能実装 + 全テストパス  
**レビュー**: 完了時に動作確認とテスト結果を確認

---

**🚀 CascadeStudio完全移行プロジェクトの完全完了を目指してください！**
