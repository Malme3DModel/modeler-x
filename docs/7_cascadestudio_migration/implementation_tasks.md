# CascadeStudio 完全移行 - 実装タスクリスト

## フェーズ1: 基本3D機能の完成 (2週間)

### 🎯 1.1 ホバーハイライト機能の実装

#### タスク1.1.1: レイキャスティング基盤の実装
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 2日
- **内容**:
  - React Three FiberでのRaycasterの実装
  - マウス座標の3D座標変換
  - オブジェクト交差判定の基盤構築

```typescript
// 実装例
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const handleMouseMove = (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  // ハイライト処理
};
```

#### タスク1.1.2: フェイスハイライト機能
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 3日
- **内容**:
  - フェイス選択時のマテリアル変更
  - ハイライト状態の管理
  - パフォーマンス最適化

```typescript
// 実装例
const [highlightedFace, setHighlightedFace] = useState<THREE.Face3 | null>(null);

const highlightFace = (face: THREE.Face3) => {
  // 元のマテリアルを保存
  // ハイライトマテリアルに変更
  // 状態を更新
};
```

#### タスク1.1.3: エッジハイライト機能
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 3日
- **内容**:
  - LineSegmentsのエッジ選択
  - エッジ色変更機能
  - 元のCascadeView.jsからのロジック移植

#### タスク1.1.4: ツールチップ表示
- **ファイル**: `components/threejs/HoverTooltip.tsx` (新規作成)
- **期間**: 2日
- **内容**:
  - フェイス/エッジインデックス表示
  - マウス追従ツールチップ
  - 適切な位置調整

### 🎨 1.2 マテリアル・ライティングの改善

#### タスク1.2.1: MatCapマテリアルの実装
- **ファイル**: `components/threejs/materials/MatCapMaterial.tsx` (新規作成)
- **期間**: 2日
- **内容**:
  - MatCapテクスチャの追加
  - MeshMatcapMaterialの実装
  - 元の`dullFrontLitMetal.png`の移植

```typescript
// 実装例
const matcapTexture = useLoader(THREE.TextureLoader, '/textures/dullFrontLitMetal.png');
const matcapMaterial = new THREE.MeshMatcapMaterial({
  matcap: matcapTexture,
  color: '#f5f5f5'
});
```

#### タスク1.2.2: ライティング設定の調整
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 1日
- **内容**:
  - HemisphereLight + DirectionalLightの設定
  - 元のCascadeView.jsと同等のライティング
  - シャドウマップの最適化

#### タスク1.2.3: フォグ機能の実装
- **ファイル**: `components/threejs/CascadeViewport.tsx`
- **期間**: 1日
- **内容**:
  - 動的フォグ距離の計算
  - バウンディングボックスベースの調整
  - 元の実装の移植

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

#### タスク3.1.2: IGESファイル対応
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 3日
- **内容**:
  - IGESインポート機能の実装確認
  - ファイル形式の検証
  - 互換性の向上

#### タスク3.1.3: STL/OBJエクスポートの改善
- **ファイル**: `public/workers/cadWorker.js`
- **期間**: 2日
- **内容**:
  - ASCII/バイナリSTLの対応
  - OBJエクスポートの品質向上
  - ファイルサイズの最適化

#### タスク3.1.4: 外部ファイル管理システム
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
- **ファイル**: `public/sw.js` (新規作成)
- **期間**: 2日
- **内容**:
  - Service Worker登録
  - キャッシュ戦略の実装
  - オフライン対応

#### タスク5.1.2: アップデート機能
- **ファイル**: `components/ui/UpdateNotification.tsx` (新規作成)
- **期間**: 1日
- **内容**:
  - 新バージョン通知
  - 手動アップデート機能
  - リロード促進UI

### 📲 5.2 PWAマニフェスト

#### タスク5.2.1: Web App Manifest
- **ファイル**: `public/manifest.json` (新規作成)
- **期間**: 1日
- **内容**:
  - PWAマニフェストの作成
  - アプリメタデータの設定
  - インストール設定

#### タスク5.2.2: アイコンの作成
- **ファイル**: `public/icons/` (新規作成)
- **期間**: 1日
- **内容**:
  - 各サイズのアプリアイコン
  - ファビコンの作成
  - スプラッシュスクリーンの設計

#### タスク5.2.3: インストール促進
- **ファイル**: `components/ui/InstallPrompt.tsx` (新規作成)
- **期間**: 2日
- **内容**:
  - インストール促進バナー
  - ユーザーエクスペリエンスの向上
  - インストール統計

## テスト・品質管理

### 🧪 自動テスト
- **E2Eテスト**: 各フェーズでPlaywrightテストを追加
- **ユニットテスト**: 重要な関数のテスト実装
- **統合テスト**: CADワーカーとUIの統合テスト

### 📈 パフォーマンス監視
- **レンダリング最適化**: React Three Fiberのパフォーマンステスト
- **メモリ使用量**: WebWorkerメモリリークの監視
- **読み込み時間**: アプリケーション起動時間の測定

### 🔍 品質チェック
- **コードレビュー**: 各タスク完了時のレビュー
- **TypeScript型チェック**: 厳密な型安全性の確保
- **アクセシビリティ**: WCAG準拠の確認

## 完了条件

各フェーズの完了条件：

1. **フェーズ1**: ホバーハイライトが元のCascadeStudioと同等に動作
2. **フェーズ2**: トランスフォームギズモが正常に機能
3. **フェーズ3**: 全ファイルI/O機能が動作し、CAD関数がテストを通過
4. **フェーズ4**: 全キーボードショートカットが動作
5. **フェーズ5**: PWAとしてインストール可能

## 納期とリソース

- **総期間**: 9週間
- **開発者**: 1-2名
- **レビュー**: 各フェーズ終了時
- **デプロイ**: フェーズ1完了後、継続的デプロイ

この計画に従って実装を進めることで、元のCascadeStudioと完全に同等の機能を持つモダンなWebアプリケーションを完成させることができます。 