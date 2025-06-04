# CascadeStudio 完全移行 - 実装タスクリスト v2.0

## 📋 プロジェクト現状（2024年12月時点）

### ✅ 完了済みフェーズ

#### フェーズ1: 基本3D機能 - 100%完了 ✅

**完了期間**: 既に完了
**達成成果**: 元のCascadeStudioと同等の基本3D機能を完全実装

##### 1.1 ホバーハイライト機能 ✅
- **レイキャスティング基盤**: React Three Fiberでの完全実装
- **フェイスハイライト**: マテリアル変更による視覚的フィードバック
- **エッジハイライト**: LineSegmentsベースでの正確な実装
- **ツールチップ表示**: マウス追従型の情報表示機能

##### 1.2 MatCapマテリアル・ライティング ✅
- **MatCapマテリアル**: `dullFrontLitMetal.png`使用で元と同等の見た目実現
- **ライティング設定**: 環境光・半球光・平行光源の適切な設定
- **フォグ機能**: バウンディングボックスベースの動的フォグ実装
- **シャドウ表示**: 地面への適切なシャドウ実装

##### 1.3 エディター機能 ✅
- **Monaco Editor**: `@monaco-editor/react`でのモダン実装
- **TypeScript対応**: IntelliSenseとシンタックスハイライト
- **CADワーカー連携**: コード評価とメッセージング機能

##### 1.4 技術基盤 ✅
- **Next.js 14**: App Routerベースでの実装
- **Golden Layout**: ドッキング可能ウィンドウシステム
- **状態管理**: URLハッシュベースの永続化機能

---

## 🚀 実装が必要なフェーズ

### フェーズ2: 3D操作機能実装（最優先・3週間）

**状態**: 🔄 進行中
**優先度**: 🔴 最高
**目標**: 元のCascadeStudioと同等の3D操作機能実現

#### 📦 マイルストーン 2.1: TransformControls実装（1.5週間）
**状態**: ✅ 完了（2024年6月）

##### タスク2.1.1: TransformGizmo基盤作成 
- **ファイル**: `components/threejs/TransformGizmo.tsx`
- **期間**: 3日
- **優先度**: 🔴 最高
- **状態**: ✅ 完了

**実装内容**:
```typescript
// 完全実装済み 2024年6月
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
  // OrbitControlsとの競合解決などの機能を含む完全実装
  // ...
}
```

**達成目標**:
- ✅ @react-three/dreiのTransformControls統合 - 完了
- ✅ 移動・回転・スケールモード切り替え - 完了
- ✅ ローカル/ワールド空間切り替え - 完了
- ✅ OrbitControlsとの競合解決 - 完了

##### タスク2.1.2: オブジェクト選択システム作成
- **ファイル**: `components/threejs/ObjectSelector.tsx`
- **期間**: 2日
- **優先度**: 🔴 高
- **状態**: ✅ 完了

**実装内容**:
```typescript
// 完全実装済み 2024年6月
import { useCallback, useRef, useEffect } from 'react';
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
  // レイキャスティングとオブジェクト選択の完全実装
  // ...
}
```

**達成目標**:
- ✅ クリック検出とレイキャスティング - 完了
- ✅ 選択状態の可視化 - 完了
- ✅ マルチセレクション対応（基本実装）- 完了
- ✅ 選択状態の管理 - 完了

##### タスク2.1.3: UI統合実装
- **ファイル**: `components/threejs/TransformControlsUI.tsx`
- **期間**: 2日
- **優先度**: 🟡 中
- **状態**: ✅ 完了

**実装内容**:
```typescript
// 完全実装済み 2024年6月
import { useState } from 'react';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { 
  MoveHorizontal, 
  RotateCw, 
  Maximize, 
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
  // ...
}) {
  // モード切り替え、空間切り替え、表示制御機能を含む完全実装
  // ...
}
```

**達成目標**:
- ✅ モード切り替えボタン（移動・回転・スケール） - 完了
- ✅ 空間切り替えボタン（ローカル・ワールド） - 完了
- ✅ ギズモ表示/非表示制御 - 完了
- ✅ キーボードショートカット対応（G/R/S） - 完了

##### タスク2.1.4: ThreeJSViewportへの統合
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 1日
- **優先度**: 🔴 高
- **状態**: ✅ 完了

**実装内容**:
- ✅ 既存のホバーハイライト機能との統合 - 完了
- ✅ イベントハンドリングの調整 - 完了
- ✅ 状態管理の統一 - 完了

##### タスク2.1.5: テスト実装
- **ファイル**: `tests/transform-controls.spec.ts`
- **期間**: 2日
- **優先度**: 🔴 高
- **状態**: ✅ 完了

**実装内容**:
- ✅ オブジェクト選択のテスト実装
- ✅ 移動・回転・スケール操作のテスト
- ✅ キーボードショートカットのテスト
- ✅ E2Eテストの整備

#### 📦 マイルストーン 2.2: カメラコントロール高度機能（1週間）

##### タスク2.2.1: 視点プリセット機能改良
- **ファイル**: `components/cad/CameraControls.tsx` (改良)
- **期間**: 3日
- **優先度**: 🔴 高
- **状態**: ✅ 完了

**実装内容**:
```typescript
// 6方向 + ISO視点の実装
const cameraPositions = {
  front: { position: [0, 0, 10], target: [0, 0, 0] },
  back: { position: [0, 0, -10], target: [0, 0, 0] },
  top: { position: [0, 10, 0], target: [0, 0, 0] },
  bottom: { position: [0, -10, 0], target: [0, 0, 0] },
  left: { position: [-10, 0, 0], target: [0, 0, 0] },
  right: { position: [10, 0, 0], target: [0, 0, 0] },
  iso: { position: [7, 7, 7], target: [0, 0, 0] }
};

export function CameraControls() {
  const animateToView = (viewName: string) => {
    const view = cameraPositions[viewName];
    // アニメーション実装
  };
}
```

**達成目標**:
- ✅ 6方向視点（Front/Back/Top/Bottom/Left/Right）
- ✅ ISO視点
- ✅ スムーズなアニメーション遷移
- ✅ UI改善（ボタン配置・アイコン）

##### タスク2.2.2: Fit to Object機能実装
- **ファイル**: `hooks/useCameraAnimation.ts` (新規作成)
- **期間**: 2日
- **優先度**: 🟡 中
- **状態**: ✅ 基本実装完了

**実装内容**:
- ✅ バウンディングボックス計算
- ✅ 自動カメラ距離調整
- ✅ フレームイン機能
- 🔄 アニメーション制御の改良が必要

##### タスク2.2.3: カメラ設定最適化
- **ファイル**: `components/threejs/ThreeJSViewport.tsx` (改良)
- **期間**: 2日
- **優先度**: 🟡 中
- **状態**: 🔄 進行中

**実装内容**:
- ✅ カメラパラメータの元との統一
- 🔄 操作感の調整（改良中）
- 🔄 パフォーマンス最適化（改良中）

#### 📦 マイルストーン 2.3: 統合テスト・品質確保（0.5週間）

##### タスク2.3.1: E2Eテスト作成
- **ファイル**: `tests/camera-controls.spec.ts` (新規作成)
- **期間**: 2日
- **優先度**: 🔴 高
- **状態**: ✅ 基本実装完了

**テスト内容**:
```typescript
// E2Eテストの実装例
test('Camera Controls basic operations', async ({ page }) => {
  await page.goto('/');
  
  // カメラコントロールが表示されていることを確認
  await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible();
  
  // 視点切り替えをテスト
  await page.click('[data-testid="camera-front"]');
  await page.waitForTimeout(1500); // アニメーション完了待ち
  
  // Fit to Objectボタンをテスト
  await page.click('[data-testid="camera-fit"]');
  await page.waitForTimeout(1500); // アニメーション完了待ち
});
```

**テスト項目**:
- ✅ カメラコントロールパネルの表示
- ✅ 視点プリセットボタンの動作
- ✅ Fit to Object機能の動作
- ✅ アニメーション中のエラーチェック

---

### フェーズ3: UI/UX機能実装（2週間）

**状態**: ❌ 未開始
**優先度**: 🟡 中
**目標**: ユーザビリティを元と同等以上に向上

#### 📦 マイルストーン 3.1: キーボードショートカット（1週間）

##### タスク3.1.1: グローバルショートカット実装
- **ファイル**: `hooks/useKeyboardShortcuts.ts` (新規作成)
- **期間**: 3日
- **優先度**: 🟡 中

**実装内容**:
```typescript
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5: コード実行（グローバル）
      if (e.key === 'F5' && !e.target.closest('.monaco-editor')) {
        e.preventDefault();
        evaluateCode();
      }
      
      // Ctrl+S: プロジェクト保存
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProject();
      }
      
      // Esc: 選択解除
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

##### タスク3.1.2: ヘルプシステム実装
- **ファイル**: `components/ui/HelpModal.tsx` (新規作成)
- **期間**: 2日
- **優先度**: 🟢 低

#### 📦 マイルストーン 3.2: プログレス・エラー表示（1週間）

##### タスク3.2.1: プログレスバー実装
- **ファイル**: `components/ui/ProgressIndicator.tsx` (新規作成)
- **期間**: 3日
- **優先度**: 🟡 中

**実装内容**:
- CAD演算進行状況の視覚的表示
- 操作キャンセル機能
- 詳細進行状況メッセージ

##### タスク3.2.2: エラーハンドリング強化
- **ファイル**: `components/layout/ErrorBoundary.tsx` (改良)
- **期間**: 2日
- **優先度**: 🟡 中

---

### フェーズ4: ファイルI/O完全実装（2週間）

**状態**: ❌ 未開始  
**優先度**: 🟡 中
**目標**: CADファイル処理を完全に元と同等にする

#### 📦 マイルストーン 4.1: STEP/IGESファイル処理改善（1週間）

##### タスク4.1.1: ファイル読み込み強化
- **ファイル**: `public/workers/cadWorker.js` (改良)
- **期間**: 4日
- **優先度**: 🟡 中

**実装内容**:
- エラーハンドリング改善
- ファイル検証機能追加
- プロパティ情報取得機能

##### タスク4.1.2: ファイルI/O UI改善
- **ファイル**: `components/cad/FileIOControls.tsx` (新規作成)
- **期間**: 3日
- **優先度**: 🟡 中

#### 📦 マイルストーン 4.2: エクスポート機能強化（1週間）

##### タスク4.2.1: 品質設定実装
- **ファイル**: `components/cad/ExportSettings.tsx` (新規作成)
- **期間**: 4日
- **優先度**: 🟡 中

##### タスク4.2.2: バッチエクスポート機能
- **ファイル**: `hooks/useBatchExport.ts` (新規作成)
- **期間**: 3日
- **優先度**: 🟢 低

---

### フェーズ5: PWA機能実装（1週間）

**状態**: ❌ 未開始
**優先度**: 🟢 低
**目標**: オフライン対応とインストール機能

#### 📦 マイルストーン 5.1: Service Worker（0.5週間）

##### タスク5.1.1: Next.js用Service Worker作成
- **ファイル**: `public/sw.js` (新規作成)
- **期間**: 2日
- **優先度**: 🟢 低

#### 📦 マイルストーン 5.2: PWAマニフェスト（0.5週間）

##### タスク5.2.1: マニフェスト設定
- **ファイル**: `public/manifest.json` (新規作成)
- **期間**: 1日
- **優先度**: 🟢 低

##### タスク5.2.2: インストールUI
- **ファイル**: `components/ui/InstallPrompt.tsx` (新規作成)
- **期間**: 2日
- **優先度**: 🟢 低

---

## 🎯 実装開始ガイド

### 最優先実装手順

#### Step 1: 開発環境準備
```bash
# 依存関係確認
npm install @react-three/drei three @types/three

# 開発サーバー起動
npm run dev

# 既存テスト実行確認
npm run test
```

#### Step 2: フェーズ2開始
**まずこのファイルから作成**:
1. `components/threejs/TransformGizmo.tsx` ⭐ **最重要**
2. `components/threejs/ObjectSelector.tsx`
3. `components/threejs/TransformControlsUI.tsx`

#### Step 3: 進捗管理
- 各タスク完了時にこのファイルを更新
- Git branchごとにマイルストーン管理
- テスト実行で品質確保

### 完了判定基準

#### フェーズ2完了条件
- ✅ TransformControlsでオブジェクトの移動・回転・スケールが可能
- ✅ クリックによるオブジェクト選択が正常動作
- ✅ 6方向視点 + ISO視点の切り替えが動作
- ✅ Fit to Object機能が動作
- ✅ 全E2Eテストがパス
- ✅ 元のCascadeStudioと同等の操作感を実現

### 技術的注意事項

#### OrbitControlsとTransformControlsの競合回避
```typescript
// 実装パターン例
const orbitControlsRef = useRef();
const transformControlsRef = useRef();

useEffect(() => {
  // TransformControlsがアクティブ時はOrbitControlsを無効化
  const handleTransformStart = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
  };
  
  const handleTransformEnd = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true;
    }
  };
  
  // イベントリスナー設定
}, []);
```

#### パフォーマンス最適化
- レイキャスティング最適化（オブジェクト絞り込み）
- メモリ管理（オブジェクト解放）
- レンダリング最適化（useMemo、useCallback）

### 品質管理

#### コード品質
- TypeScript strict mode準拠
- ESLint/Prettier適用
- 適切なエラーハンドリング

#### テスト要件
- 各マイルストーンでE2Eテスト追加
- 回帰テスト実行
- パフォーマンステスト

---

## 📊 進捗トラッキング

### 全体進捗
- **フェーズ1**: ✅ 100%完了
- **フェーズ2**: 🔄 進行中
- **フェーズ3**: ❌ 0%未開始
- **フェーズ4**: ❌ 0%未開始
- **フェーズ5**: ❌ 0%未開始

### 総予定期間
**残り期間**: 8週間（フェーズ2から開始）
- フェーズ2: 3週間（最優先）
- フェーズ3: 2週間
- フェーズ4: 2週間
- フェーズ5: 1週間

この実装タスクリストv2.0に従って、最優先でフェーズ2のTransformControls実装から開始し、元のCascadeStudioを完全に超える高品質なCADアプリケーションを完成させます。