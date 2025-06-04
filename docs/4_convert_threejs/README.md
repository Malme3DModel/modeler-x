# OpenCascade.js から Three.js への変換計画書

## 📋 概要

このドキュメントは、現在 `@google/model-viewer` を使用して OpenCascade.js で生成したモデルを表示しているアプリケーションを、Three.js ベースの実装に変換する計画書です。

## 🎯 変換の目的

1. **パフォーマンスの向上**: Three.js の直接制御によるレンダリング最適化
2. **カスタマイゼーションの向上**: より細かい表示制御と操作性
3. **インタラクション機能の拡張**: カスタムコントロールやアニメーション機能
4. **依存関係の削減**: `@google/model-viewer` への依存を排除

## 🔍 現在のアーキテクチャ分析

### 技術スタック
- **フレームワーク**: Next.js 14.2.5 (App Router)
- **言語**: TypeScript
- **3D表示**: @google/model-viewer 1.11.1
- **3Dライブラリ**: opencascade.js 2.0.0-beta
- **スタイリング**: Tailwind CSS + DaisyUI

### 主要コンポーネント構成
```
app/
├── page.tsx                 # メインページ (動的インポート)
├── layout.tsx              # レイアウト
└── globals.css             # グローバルスタイル

components/
└── OCJSViewport.tsx        # 現在のビューポート (model-viewer使用)

lib/
└── shapeToUrl.ts           # OpenCascade → GLB変換
```

### 現在のワークフロー
1. `OCJSViewport.tsx` で OpenCascade.js を初期化
2. BRepPrimAPI を使用して 3D ジオメトリを生成
3. `shapeToUrl.ts` で GLB形式に変換
4. `@google/model-viewer` で表示

## 🚀 Three.js 変換計画

### フェーズ 1: 環境構築
- [ ] Three.js 関連パッケージのインストール
- [ ] TypeScript 型定義の追加
- [ ] 新しいコンポーネント構造の設計

#### 必要な依存関係
```json
{
  "three": "^0.160.0",
  "@types/three": "^0.160.0",
  "@react-three/fiber": "^8.15.12",
  "@react-three/drei": "^9.92.7"
}
```

### フェーズ 2: コンポーネント変換

#### 2.1 新しいビューポートコンポーネント (`ThreeJSViewport.tsx`)
```typescript
// 予定される構造
interface ThreeJSViewportProps {
  // カメラ設定
  cameraPosition?: [number, number, number];
  // ライティング設定
  lightIntensity?: number;
  // インタラクション設定
  enableOrbitControls?: boolean;
}
```

#### 2.2 3Dモデル表示コンポーネント (`ThreeJSModel.tsx`)
- GLB/GLTF ローダーの実装
- マテリアルとテクスチャの管理
- アニメーション機能

#### 2.3 コントロールコンポーネント (`ModelControls.tsx`)
- カメラ操作 (OrbitControls)
- ズーム、パン、回転
- リセット機能

### フェーズ 3: OpenCascade.js 統合

#### 3.1 GLBローダーの最適化
```typescript
// lib/loadGLBModel.ts
export async function loadGLBModel(url: string): Promise<Group> {
  // GLTFLoader を使用してモデルを読み込み
  // Three.js オブジェクトとして返却
}
```

#### 3.2 形状生成パイプラインの更新
- 既存の `shapeToUrl.ts` を活用
- Three.js Scene への直接統合オプションの検討

### フェーズ 4: UI/UX 向上

#### 4.1 レスポンシブデザイン
- モバイル対応
- 画面サイズに応じたビューポート調整

#### 4.2 インタラクション機能
- モデルの選択とハイライト
- 情報表示パネル
- エクスポート機能

#### 4.3 パフォーマンス最適化
- レベルオブディテール (LOD)
- フラストラムカリング
- インスタンシング

### フェーズ 5: テストと検証

#### 5.1 機能テスト
- モデル表示の正確性
- インタラクション操作
- パフォーマンステスト

#### 5.2 ブラウザ互換性
- Chrome, Firefox, Safari, Edge
- モバイルブラウザ対応

## 📁 新しいファイル構造

```
components/
├── threejs/
│   ├── ThreeJSViewport.tsx     # メインビューポート
│   ├── ThreeJSModel.tsx        # 3Dモデル表示
│   ├── ModelControls.tsx       # カメラコントロール
│   ├── Lighting.tsx            # ライティング設定
│   └── Scene.tsx               # シーン管理
├── ui/
│   ├── LoadingSpinner.tsx      # ローディング表示
│   └── ErrorBoundary.tsx       # エラーハンドリング
└── OCJSViewport.tsx           # (既存、段階的移行用)

lib/
├── threejs/
│   ├── loadGLBModel.ts         # GLBローダー
│   ├── sceneUtils.ts           # シーンユーティリティ
│   └── materialUtils.ts        # マテリアル管理
└── shapeToUrl.ts              # (既存)

hooks/
├── useThreeJS.ts              # Three.js フック
├── useGLBLoader.ts            # GLBローダーフック
└── useOpenCascade.ts          # OpenCascade.js フック
```

## 🔄 移行戦略

### 段階的移行アプローチ
1. **並行開発**: 既存のコンポーネントを残しながら新しい Three.js コンポーネントを開発
2. **フィーチャーフラグ**: 環境変数による表示切り替え機能
3. **AB テスト**: 両方の実装を比較検証
4. **段階的置換**: 確認後に既存コンポーネントを置換

### 環境変数による切り替え
```typescript
// .env.local
NEXT_PUBLIC_USE_THREEJS=true

// app/page.tsx
const ViewportComponent = process.env.NEXT_PUBLIC_USE_THREEJS === 'true' 
  ? ThreeJSViewport 
  : OCJSViewport;
```

## ⚠️ リスクと対策

### 技術的リスク
1. **パフォーマンス低下**: Three.js の学習コストとパフォーマンス調整
   - **対策**: プロファイリングツールの活用、段階的最適化
2. **ブラウザ互換性**: WebGL サポートの問題
   - **対策**: フォールバック機能、機能検出
3. **開発工数**: 新しいライブラリの学習コスト
   - **対策**: プロトタイプでの検証、段階的実装

### プロジェクトリスク
1. **既存機能の破損**: 移行中の機能低下
   - **対策**: 段階的移行、継続的テスト
2. **スケジュール遅延**: 想定以上の開発時間
   - **対策**: マイルストーン管理、優先度設定

## 📊 成功指標

### パフォーマンス指標
- [ ] 初期読み込み時間: 現在比 20% 短縮
- [ ] フレームレート: 60fps 安定維持
- [ ] メモリ使用量: 現在比 15% 削減

### 機能指標
- [ ] カメラ操作のスムーズさ向上
- [ ] レスポンシブ対応完了
- [ ] エラー発生率 0.1% 以下

### ユーザビリティ指標
- [ ] ユーザーインタラクション操作性向上
- [ ] モバイル表示対応
- [ ] アクセシビリティ向上

## 📅 スケジュール (概算)

| フェーズ | 期間 | 主要タスク |
|---------|------|------------|
| フェーズ 1 | 1週間 | 環境構築、依存関係インストール |
| フェーズ 2 | 2-3週間 | コンポーネント開発、基本機能実装 |
| フェーズ 3 | 1-2週間 | OpenCascade.js 統合 |
| フェーズ 4 | 2週間 | UI/UX向上、最適化 |
| フェーズ 5 | 1週間 | テスト、検証、ドキュメント |

**合計予想期間**: 7-9週間

## 📚 参考資料

- [Three.js 公式ドキュメント](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Fundamentals](https://threejs.org/manual/)
- [WebGL 最適化ガイド](https://developer.mozilla.org/ja/docs/Web/API/WebGL_API/WebGL_best_practices)

## 🔄 更新履歴

| 日付 | 更新者 | 変更内容 |
|------|-------|----------|
| 2024-XX-XX | - | 初版作成 |

---

このドキュメントは変換作業の進行に伴い、定期的に更新されます。 