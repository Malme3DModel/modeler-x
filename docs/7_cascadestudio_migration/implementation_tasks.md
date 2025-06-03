# CascadeStudio 完全移行 - 実装タスクリスト

## フェーズ1: 基本3D機能の完成 (2週間)

### 🎯 1.1 ホバーハイライト機能の実装 - ✅ 完了

#### タスク1.1.1: レイキャスティング基盤の実装 - ✅ 完了
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 2日
- **内容**:
  - React Three FiberでのRaycasterの実装 ✅
  - マウス座標の3D座標変換 ✅
  - オブジェクト交差判定の基盤構築 ✅
- **実装状況**:
  - レイキャスティング基盤は正常に動作
  - RaycastingHandlerコンポーネントが実装済み
  - グローバルユーティリティとしてテスト機能も実装済み

#### タスク1.1.2: フェイスハイライト機能 - ✅ 完了
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 3日
- **内容**:
  - フェイス選択時のマテリアル変更 ✅
  - ハイライト状態の管理 ✅
  - パフォーマンス最適化 ✅
- **実装状況**:
  - フェイス選択とハイライト表示が完全に動作
  - マテリアル変更による視覚的フィードバック実装済み
  - 元のマテリアルの保存と復元機能実装済み

#### タスク1.1.3: エッジハイライト機能 - ✅ 完了
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 3日
- **内容**:
  - LineSegmentsのエッジ選択 ✅
  - エッジ色変更機能 ✅
  - 元のCascadeView.jsからのロジック移植 ✅
- **実装状況**:
  - エッジ検出とハイライト表示が完全に動作
  - 専用のハイライトマテリアルを使用
  - パフォーマンス最適化済み

#### タスク1.1.4: ツールチップ表示 - ✅ 完了
- **ファイル**: `components/threejs/HoverTooltip.tsx`
- **期間**: 2日
- **内容**:
  - フェイス/エッジインデックス表示 ✅
  - マウス追従ツールチップ ✅
  - 適切な位置調整 ✅
- **実装状況**:
  - マウス位置に追従するツールチップ実装済み
  - オブジェクト名、フェイス番号、IDの表示
  - ポジショニングとスタイリング完了

### 🎨 1.2 マテリアル・ライティングの改善 - ✅ 完了

#### タスク1.2.1: MatCapマテリアルの実装 - ✅ 完了
- **ファイル**: `components/threejs/materials/MatCapMaterial.tsx`
- **期間**: 2日
- **内容**:
  - MatCapテクスチャの追加 ✅
  - MeshMatcapMaterialの実装 ✅
  - 元の`dullFrontLitMetal.png`の移植 ✅
- **実装状況**:
  - MatCapマテリアルが正常に実装されている
  - テクスチャが`public/textures/dullFrontLitMetal.png`に配置済み
  - ThreeJSModelコンポーネントで適切に使用されている

```typescript
// 実装例
import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

export function useMatCapMaterial({ 
  color = '#f5f5f5', 
  opacity = 1.0, 
  transparent = false 
}) {
  const matcapTexture = useLoader(
    THREE.TextureLoader, 
    '/textures/dullFrontLitMetal.png'
  );
  
  return useMemo(() => {
    const material = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
      color: color,
      transparent: transparent,
      opacity: opacity,
    });
    
    return material;
  }, [matcapTexture, color, opacity, transparent]);
}
```

#### タスク1.2.2: ライティング設定の調整 - ✅ 完了
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 1日
- **内容**:
  - HemisphereLight + DirectionalLightの設定 ✅
  - 元のCascadeView.jsと同等のライティング ✅
  - シャドウマップの最適化 ✅
- **実装状況**:
  - 環境光、半球光、平行光源が適切に設定されている
  - 地面へのシャドウ表示が正しく設定されている
  - 元のCascadeStudioと同等の見た目を実現

#### タスク1.2.3: フォグ機能の実装 - ✅ 完了
- **ファイル**: `components/threejs/ThreeJSViewport.tsx`
- **期間**: 1日
- **内容**:
  - 動的フォグ距離の計算 ✅
  - バウンディングボックスベースの調整 ✅
  - 元の実装の移植 ✅
- **実装状況**:
  - バウンディングボックスに基づく動的フォグ距離計算が実装済み
  - フォグ色が正しく設定されている
  - テストによって正常動作を確認済み

### 📏 1.3 エッジ表示の改善

#### タスク1.3.1: エッジ描画の最適化
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 2日
- **内容**:
  - LineSegmentsの効率的な描画
  - エッジインデックス管理の実装
  - メモリ使用量の最適化

## フェーズ2: 高度な3D機能 (2週間)

### 🔧 2.1 トランスフォームハンドルの実装

#### タスク2.1.1: TransformControlsの統合
- **ファイル**: `components/threejs/TransformGizmo.tsx` (新規作成)
- **期間**: 3日
- **内容**:
  - `@react-three/drei`のTransformControlsの統合
  - 移動、回転、スケールモードの実装
  - ギズモの表示/非表示制御

```typescript
// 実装例
import { TransformControls } from '@react-three/drei';

function TransformGizmo({ selectedObject, mode }) {
  return (
    <TransformControls 
      object={selectedObject}
      mode={mode} // "translate" | "rotate" | "scale"
      space="local" // "local" | "world"
    />
  );
}
```

#### タスク2.1.2: オブジェクト選択機能
- **ファイル**: `components/threejs/ObjectSelector.tsx` (新規作成)
- **期間**: 2日
- **内容**:
  - クリックによるオブジェクト選択
  - 選択状態の可視化
  - 複数選択の対応

#### タスク2.1.3: ギズモ操作のイベント処理
- **ファイル**: `components/threejs/TransformGizmo.tsx`
- **期間**: 2日
- **内容**:
  - ドラッグ操作の検出
  - 変更値の記録
  - アンドゥ/リドゥ機能の基盤

#### タスク2.1.4: CascadeViewHandles.jsの移植
- **ファイル**: `docs/template/js/MainPage/CascadeViewHandles.js` → React移植
- **期間**: 3日
- **内容**:
  - 元のハンドル機能の完全移植
  - React Three Fiberへの適応
  - 状態管理の統合

### 📷 2.2 カメラコントロールの改善

#### タスク2.2.1: 視点プリセット機能
- **ファイル**: `components/cad/CameraControls.tsx`
- **期間**: 2日
- **内容**:
  - Front, Back, Top, Bottom, Left, Right, Isoビュー
  - アニメーション付きの視点変更
  - UI コントロールの追加

#### タスク2.2.2: カメラ設定の改善
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 1日
- **内容**:
  - 元と同等のカメラ設定値
  - パン/ズーム速度の調整
  - 適切なターゲット位置

#### タスク2.2.3: カメラアニメーション
- **ファイル**: `hooks/useCameraAnimation.ts` (新規作成)
- **期間**: 1日
- **内容**:
  - スムーズな視点変更
  - 補間アニメーション
  - パフォーマンス最適化

## フェーズ3: CAD機能の完成 (3週間)

### 📁 3.1 ファイルI/O機能の完全実装

#### タスク3.1.1: STEPファイル処理の改善
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 3日
- **内容**:
  - STEPインポートの動作確認とバグ修正
  - STEPエクスポート機能の改善
  - エラーハンドリングの強化

#### タスク3.1.2: Monaco Editorのモダン実装 - ✅ 完了
- **ファイル**: `components/cad/MonacoCodeEditor.tsx`, `package.json`
- **期間**: 1日
- **内容**:
  - `@monaco-editor/react`パッケージの導入
  - FileAccessImplエラーの根本的解決
  - 複雑なモンキーパッチコードの削除
  - Next.js対応のSSR無効化実装
- **実装状況**:
  - 従来の`monaco-editor`パッケージを`@monaco-editor/react`に置き換え ✅
  - `monaco.config.js`ファイルの削除 ✅
  - 300行以上のモンキーパッチコードを削除し、シンプルな実装に変更 ✅
  - 動的インポート（`{ ssr: false }`）でNext.js互換性を確保 ✅
  - TypeScript syntax highlightingが正常に動作 ✅

```typescript
// 実装例 - シンプルでクリーンな@monaco-editor/react実装
import Editor from '@monaco-editor/react';

export const MonacoCodeEditor = forwardRef<MonacoCodeEditorRef, MonacoCodeEditorProps>(
  ({ initialCode = '', onEvaluate }, ref) => {
    // 複雑なmonkeypatchingやFileAccessImplの対応は一切不要
    return (
      <Editor
        height="100%"
        defaultLanguage="typescript"
        defaultValue={initialCode}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on'
        }}
        onMount={handleEditorDidMount}
      />
    );
  }
);
```

#### タスク3.1.3: IGESファイル対応
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 3日
- **内容**:
  - IGESインポート機能の実装確認
  - ファイル形式の検証
  - 互換性の向上

#### タスク3.1.4: STL/OBJエクスポートの改善
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 2日
- **内容**:
  - ASCII/バイナリSTLの対応
  - OBJエクスポートの品質向上
  - ファイルサイズの最適化

#### タスク3.1.5: 外部ファイル管理システム
- **ファイル**: `lib/fileManager.ts` (新規作成)
- **期間**: 3日
- **内容**:
  - インポートファイルのキャッシュ
  - `clearExternalFiles`機能の実装
  - ファイル状態の管理

### 🔨 3.2 標準ライブラリの確認と補完

#### タスク3.2.1: CAD関数の動作確認
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 4日
- **内容**:
  - 全CAD関数のテスト実行
  - 不具合の修正
  - パフォーマンステスト

#### タスク3.2.2: Text3D機能の確認
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 2日
- **内容**:
  - フォント読み込みの確認
  - Text3D関数の動作テスト
  - フォントファイルの管理

#### タスク3.2.3: 型定義の改善
- **ファイル**: `types/worker.ts`, `public/workers/cadWorker.d.ts`
- **期間**: 2日
- **内容**:
  - 全CAD関数の型定義
  - TypeScript intellisenseの改善
  - ドキュメントの整備

#### タスク3.2.4: テストケースの追加
- **ファイル**: `tests/cad-functions.spec.ts` (新規作成)
- **期間**: 3日
- **内容**:
  - 各CAD関数の自動テスト
  - 回帰テストの実装
  - パフォーマンステスト

### 🔧 3.1 標準ライブラリの完全移植

#### タスク3.1.1: OpenCascade.js v1.1.1互換性対応 - ✅ 完了
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 1日
- **内容**:
  - gp_Pnt_1コンストラクタのパラメータ問題修正 ✅
  - createPoint()、createDirection()ヘルパー関数の実装 ✅
  - 他の問題のあるコンストラクタの検証と対応 ✅
- **実装状況**:
  - Rotate関数内のgp_Pnt_1使用を修正済み
  - 安全な点・方向ベクトル作成関数を実装済み
  - エラーハンドリングを強化

```javascript
// 実装例
// 🔥 OpenCascade.js v1.1.1 用の安全なポイント作成ヘルパー関数
function createPoint(x = 0, y = 0, z = 0) {
  try {
    // まずパラメータなしでインスタンス化
    const point = new oc.gp_Pnt_1();
    // 次に座標を設定
    point.SetX(x);
    point.SetY(y);
    point.SetZ(z);
    return point;
  } catch (error) {
    console.error("❌ Point creation failed:", error);
    throw error;
  }
}
```

#### タスク3.1.2: Monaco Editorのモダン実装 - ✅ 完了
- **ファイル**: `components/cad/MonacoCodeEditor.tsx`, `package.json`
- **期間**: 1日
- **内容**:
  - `@monaco-editor/react`パッケージの導入
  - FileAccessImplエラーの根本的解決
  - 複雑なモンキーパッチコードの削除
  - Next.js対応のSSR無効化実装
- **実装状況**:
  - 従来の`monaco-editor`パッケージを`@monaco-editor/react`に置き換え ✅
  - `monaco.config.js`ファイルの削除 ✅
  - 300行以上のモンキーパッチコードを削除し、シンプルな実装に変更 ✅
  - 動的インポート（`{ ssr: false }`）でNext.js互換性を確保 ✅
  - TypeScript syntax highlightingが正常に動作 ✅

```typescript
// 実装例 - シンプルでクリーンな@monaco-editor/react実装
import Editor from '@monaco-editor/react';

export const MonacoCodeEditor = forwardRef<MonacoCodeEditorRef, MonacoCodeEditorProps>(
  ({ initialCode = '', onEvaluate }, ref) => {
    // 複雑なmonkeypatchingやFileAccessImplの対応は一切不要
    return (
      <Editor
        height="100%"
        defaultLanguage="typescript"
        defaultValue={initialCode}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on'
        }}
        onMount={handleEditorDidMount}
      />
    );
  }
);
```

#### タスク3.1.3: 残りのCAD標準ライブラリ機能の確認

## フェーズ4: UI/UX機能 (1週間)

### ⌨️ 4.1 キーボードショートカットの実装

#### タスク4.1.1: グローバルショートカット
- **ファイル**: `hooks/useKeyboardShortcuts.ts` (新規作成)
- **期間**: 2日
- **内容**:
  - F5キーでのリフレッシュ機能
  - Ctrl+Sでの保存機能
  - ショートカットの競合回避

```typescript
// 実装例
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F5') {
      e.preventDefault();
      evaluateCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveProject();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### タスク4.1.2: エディターショートカット
- **ファイル**: `components/cad/MonacoCodeEditor.tsx`
- **期間**: 1日
- **内容**:
  - Monaco Editorカスタムショートカット
  - コード評価のキーバインド
  - エディター固有の機能

#### タスク4.1.3: ヘルプ表示機能
- **ファイル**: `components/ui/HelpDialog.tsx` (新規作成)
- **期間**: 1日
- **内容**:
  - ショートカット一覧の表示
  - ヘルプダイアログの実装
  - 使い方ガイドの追加

### 📊 4.2 プログレス表示の改善

#### タスク4.2.1: プログレスバーコンポーネント
- **ファイル**: `components/ui/ProgressBar.tsx` (新規作成)
- **期間**: 1日
- **内容**:
  - 視覚的プログレスバー
  - アニメーション効果
  - 操作詳細の表示

#### タスク4.2.2: 操作キャンセル機能
- **ファイル**: `hooks/useCADWorker.ts`
- **期間**: 1日
- **内容**:
  - 長時間操作のキャンセル
  - ワーカー強制終了機能
  - エラー処理の改善

#### タスク4.2.3: 詳細ステータス表示
- **ファイル**: `components/layout/StatusBar.tsx` (新規作成)
- **期間**: 1日
- **内容**:
  - 現在の操作状況表示
  - 処理時間の表示
  - メモリ使用量の監視

## フェーズ5: PWA機能 (1週間)

### 📱 5.1 Service Workerの実装

#### タスク5.1.1: Service Worker基盤
- **ファイル**: `