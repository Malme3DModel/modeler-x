# UI設計ガイド - Modeler X

## 📋 概要

Modeler XのUIデザインはVS Codeのようなモダンで洗練された開発環境の外観を目指しています。プロフェッショナルな開発者が期待する直感的で効率的なユーザーインターフェースを提供します。

## 🎨 デザイン原則

### 1. **モダンミニマリズム**
- クリーンで整理されたレイアウト
- 過度な装飾を避けたフラットデザイン
- 適切な余白とスペーシング

### 2. **プロフェッショナル感**
- VS Codeライクな配色とタイポグラフィ
- 一貫性のあるアイコンとボタンスタイル
- 開発者向けの洗練された外観

### 3. **機能的美学**
- 美しさと実用性の両立
- 直感的な操作性
- アクセシビリティの考慮

## 🎯 カラーパレット

### ダークテーマ（メイン）
```typescript
// 背景色
background: {
  primary: '#222222',     // メイン背景
  secondary: '#1e1e1e',   // セカンダリ背景
  modal: '#131313',       // モーダル背景
  surface: '#2e2e2e',     // サーフェス
}

// アクセント色
accent: {
  primary: '#4CAF50',     // プライマリ（緑）
  success: '#00C851',     // 成功
  warning: '#ffbb33',     // 警告
  error: '#ff4444',       // エラー
  info: '#33b5e5',        // 情報
}

// テキスト色
text: {
  primary: '#eeeeee',     // メインテキスト
  secondary: '#aeb5b8',   // セカンダリテキスト
  muted: '#888888',       // 補助テキスト
}
```

## 🧩 コンポーネント設計

### Header Component

#### **設計思想**
VS Codeのタイトルバー/メニューバーを参考にしたコンパクトで機能的なヘッダー。ステータス表示はフッターに移動し、より簡潔な設計に。

#### **構成要素**
```typescript
Header = {
  Logo: "緑のXアイコン + Modeler Xテキスト",
  MenuButtons: [
    { icon: SaveIcon, label: "Save", action: "プロジェクト保存" },
    { icon: LoadIcon, label: "Load", action: "プロジェクト読み込み" },
    { icon: ExportIcon, label: "Export", action: "エクスポートメニュー" }
  ]
  // ステータス表示はフッターに移動
}
```

#### **Visual Hierarchy**
```
┌─────────────────────────────────────────────────────────────┐
│ [X] Modeler X    [📁Save] [📂Load] [📤Export▼]              │
└─────────────────────────────────────────────────────────────┘
```

#### **インタラクション**
- **ホバーエフェクト**: 150ms トランジション
- **クリックフィードバック**: 適切なアニメーション
- **ドロップダウンメニュー**: スムーズな表示/非表示

#### **レスポンシブデザイン**
- 最小幅: 320px
- ボタンの適応的サイズ調整
- モバイルでのタッチ対応

### Export Dropdown Menu

#### **デザイン仕様**
```typescript
ExportMenu = {
  Background: "modeler-control-base",
  Border: "modeler-control-border",
  Shadow: "modeler-panel",
  Items: [
    { format: "STEP", color: "accent-success", icon: "●" },
    { format: "STL", color: "accent-success", icon: "●" },
    { format: "OBJ", color: "accent-success", icon: "●" }
  ]
}
```

#### **アニメーション**
- 出現: `fade-in + slide-down`
- 消失: `fade-out`
- ホバー: `background-color transition`

### Footer Component

#### **設計思想**
VS Codeのステータスバーを参考にしたリアルタイム状態監視フッター。HeaderとMonacoEditorからステータス表示を統合し、一元管理。

#### **構成要素**
```typescript
Footer = {
  StatusSection: {
    CADKernel: "⏳ Initializing... / ✅ Ready",
    Worker: "⏳ Loading... / ✅ Ready", 
    ExecutionStatus: "🔄 Working... / ✅ Idle",
    UnsavedChanges: "● Unsaved changes",
    ErrorIndicator: "⚠️ Error"
  },
  ShortcutHelp: "Ctrl+Enter: evaluate • F5: update • Ctrl+S: save"
}
```

#### **Visual Hierarchy**
```
┌─────────────────────────────────────────────────────────────┐
│ CAD Kernel: ✅ Ready  Worker: ✅ Ready  Status: ✅ Idle     │
│                           Ctrl+Enter: evaluate • F5: update │
└─────────────────────────────────────────────────────────────┘
```

#### **状態別カラーリング**
```typescript
StatusColors = {
  Success: "text-modeler-accent-success",    // ✅ Ready, Idle
  Warning: "text-modeler-accent-warning",    // ⏳ Loading, Unsaved
  Working: "text-modeler-accent-info",       // 🔄 Working
  Error: "text-modeler-accent-error"         // ⚠️ Error
}
```

#### **レスポンシブ対応**
- 狭い画面: ショートカットヘルプを省略
- 最小高さ: 24px (h-6)
- 横スクロール時も固定表示

## 🔤 タイポグラフィ

### フォント階層
```css
/* プライマリフォント（UI） */
font-family: 'Inter', Arial, sans-serif;

/* コードフォント */
font-family: 'Consolas', Monaco, 'Courier New', monospace;

/* サイズ階層 */
text-xs    /* 12px - ステータス、補助情報 */
text-sm    /* 14px - ボタンテキスト、ラベル */
text-base  /* 16px - メインテキスト */
text-lg    /* 18px - ヘッダー */
```

## 🎭 アニメーション・トランジション

### 原則
- **一貫性**: 全体を通じて統一されたタイミング
- **パフォーマンス**: GPU最適化されたプロパティ
- **意味のあるアニメーション**: 機能的な目的

### タイミング
```css
/* 標準トランジション */
transition-duration-150  /* 150ms - ホバー、フォーカス */
transition-duration-200  /* 200ms - 状態変更 */
transition-duration-250  /* 250ms - レイアウト変更 */

/* イージング */
transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
```

## 🎯 アイコンシステム

### 設計原則
- **ミニマル**: シンプルで認識しやすい
- **一貫性**: 統一されたスタイル
- **スケーラビリティ**: SVGベースで解像度非依存

### アイコンライブラリ
```typescript
Icons = {
  Save: "ダウンロード矢印付きドキュメント",
  Load: "アップロード矢印付きクラウド",
  Export: "外向き矢印付きドキュメント",
  Status: "シンプルな円（色で状態を表現）",
  ChevronDown: "下向きシェブロン"
}
```

## 🖼️ レイアウト原則

### スペーシング
```css
/* Tailwindスペーシングスケール */
space-1   /* 4px  - 最小スペース */
space-2   /* 8px  - アイコン間 */
space-3   /* 12px - ボタン内パディング */
space-4   /* 16px - セクション間 */
```

### グリッドシステム
- **Flexbox**: 主要レイアウト
- **Grid**: 複雑なレイアウト（Dockview）
- **レスポンシブ**: モバイルファースト

## 🔧 実装ガイドライン

### CSS-in-JS vs Tailwind
```typescript
// ✅ 推奨: Tailwind CSS
className="flex items-center space-x-2 px-3 py-1.5 bg-modeler-control-button-DEFAULT hover:bg-modeler-control-button-hover rounded transition-colors duration-150"

// ❌ 避ける: インラインスタイル
style={{ display: 'flex', padding: '6px 12px', ... }}
```

### コンポーネント構造
```typescript
// ✅ 推奨: 小さく再利用可能なコンポーネント
const Button = ({ icon: Icon, label, onClick, variant = 'default' }) => (
  <button className={getButtonClasses(variant)} onClick={onClick}>
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

// ❌ 避ける: 巨大なモノリシックコンポーネント
```

### 状態管理
```typescript
// ✅ 推奨: フック経由での状態管理
const { isLoading, error } = useProjectActions();

// ✅ 推奨: 適切な状態の可視化
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage error={error} />}
```

## 📱 アクセシビリティ

### キーボードナビゲーション
- **Tab順序**: 論理的な順序
- **フォーカス表示**: 明確な視覚的フィードバック
- **ショートカット**: 効率的な操作

### スクリーンリーダー対応
```typescript
// aria-label, title属性の適切な使用
<button
  title="Save Project (.json)"
  aria-label="Save current project as JSON file"
>
  Save
</button>
```

### 色彩アクセシビリティ
- **コントラスト比**: WCAG AA準拠
- **色だけに依存しない**: アイコンとテキストで情報伝達

## 🚀 パフォーマンス考慮

### CSS最適化
```css
/* GPU加速の活用 */
.smooth-transition {
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 効率的なセレクタ */
.btn-primary { /* シンプルなクラス名 */ }
```

### React最適化
```typescript
// メモ化による再レンダリング防止
const IconButton = memo(({ icon: Icon, label, onClick }) => {
  // コンポーネント実装
});
```

## 📋 チェックリスト

### デザイン実装時
- [ ] カラーパレットの一貫性
- [ ] タイポグラフィ階層の遵守
- [ ] 適切なスペーシング
- [ ] アニメーション品質
- [ ] レスポンシブ対応

### 品質保証
- [ ] 異なるブラウザでの表示確認
- [ ] モバイルデバイステスト
- [ ] アクセシビリティチェック
- [ ] パフォーマンス測定
- [ ] ユーザビリティテスト

---

このガイドに従って、Modeler Xの一貫性のある美しいUIを構築し、プロフェッショナルな開発体験を提供します。 