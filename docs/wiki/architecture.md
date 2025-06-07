# Modeler X アーキテクチャ設計書

## 📋 概要

Modeler XはNext.js 14・TypeScript・React 18を基盤とした、モダンで型安全なCADアプリケーションです。Clean Architectureの原則に基づいて設計され、高い保守性・拡張性・パフォーマンスを実現しています。

## 🏗️ アーキテクチャ概要

### 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    Modeler X Architecture                   │
├─────────────────────────────────────────────────────────────┤
│ UI Layer (Components)                                       │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   MonacoEditor  │ ThreeViewport   │  DockviewLayout │   │
│  │                 │                 │                 │   │
│  │  - エディター   │ - 3Dビューポート │ - レイアウト管理 │   │
│  │  - 型安全       │ - Three.js      │ - パネル管理    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Custom Hooks Layer                                          │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │  useCADWorker   │useKeyboardShortcuts│useProjectState│   │
│  │                 │                 │                 │   │
│  │ - ワーカー管理  │ - ショートカット │ - 状態管理      │   │
│  │ - エラー処理    │ - イベント処理  │ - Context IF    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Context Layer (State Management)                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ProjectContext                             │ │
│  │                                                         │ │
│  │ - React Context + useReducer                            │ │
│  │ - 統一状態管理                                          │ │
│  │ - 型安全なアクション                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Service Layer (Business Logic)                              │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │cadWorkerService │ editorService   │typeDefinitionService│ │
│  │                 │                 │                 │   │
│  │ - CAD操作       │ - エディター評価 │ - 型定義管理    │   │
│  │ - ワーカー通信  │ - コード解析    │ - Monaco設定    │   │
│  └─────────────────┴─────────────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Config/Constants Layer                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐   │
│  │   cadConfig     │  defaultCode    │     types       │   │
│  │                 │                 │                 │   │
│  │ - CAD設定       │ - デフォルト値  │ - 型定義        │   │
│  │ - Monaco設定    │ - 定数管理      │ - インターフェース│ │
│  └─────────────────┴─────────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 ディレクトリ構造詳細

### `/src/app` - Next.js App Router
- **`layout.tsx`**: ルートレイアウト・メタデータ設定
- **`page.tsx`**: メインページ・アプリケーションエントリーポイント
- **`globals.css`**: グローバルスタイル・Tailwind設定

### `/src/components` - UIコンポーネント
```typescript
components/
├── Header.tsx              # 🎨 VSCodeライクなモダンヘッダー（Save/Load/Export）
├── MonacoEditor.tsx        # コードエディター（Monaco Editor・TypeScript）
├── ThreeViewport.tsx       # 3Dビューポート（Three.js・WebGL）
├── DockviewLayout.tsx      # レイアウト管理（パネル・ドッキング）
└── CADWorkerManager.tsx    # CADワーカー管理（Web Worker Interface）
```

### `/src/hooks` - カスタムフック
```typescript
hooks/
├── useProjectState.ts      # プロジェクト状態管理インターフェース
├── useProjectActions.ts    # 🆕 プロジェクト操作（保存・読み込み・エクスポート）
├── useCADWorker.ts         # CADワーカー管理・状態監視
└── useKeyboardShortcuts.ts # キーボードショートカット管理
```

### `/src/context` - React Context
```typescript
context/
└── ProjectContext.tsx      # プロジェクト状態・React Context + useReducer
```

### `/src/services` - ビジネスロジック
```typescript
services/
├── projectService.ts         # 🆕 プロジェクト保存・読み込み・ファイル操作
├── exportService.ts          # 🆕 モデルエクスポート（STEP/STL/OBJ）
├── cadWorkerService.ts       # CADワーカー操作・ビジネスロジック
├── editorService.ts          # エディター評価・コード解析
└── typeDefinitionService.ts  # TypeScript型定義管理
```

### `/src/config` - 設定管理
```typescript
config/
└── cadConfig.ts            # CAD設定・Monaco設定・TypeScript設定
```

### `/src/constants` - 定数定義
```typescript
constants/
└── defaultCode.ts          # デフォルトコード・プロジェクト設定
```

### `/src/types` - 型定義
```typescript
types/
└── index.ts               # 共通型定義・インターフェース
```

## 🔄 データフロー

### 1. アプリケーション初期化フロー

```mermaid
sequenceDiagram
    participant App as page.tsx
    participant PM as ProjectManager
    participant CAD as CADWorkerManager
    participant Editor as MonacoEditor
    participant Viewport as ThreeViewport

    App->>PM: ProjectProvider初期化
    App->>CAD: CADWorker起動
    CAD->>CAD: Web Worker作成
    CAD->>PM: ワーカー準備完了
    App->>Editor: Monaco Editor初期化
    Editor->>Editor: 型定義読み込み
    App->>Viewport: Three.js初期化
    Viewport->>Viewport: シーン作成
```

### 2. コード評価フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Editor as MonacoEditor
    participant Service as editorService
    participant CAD as CADWorkerService
    participant Worker as CAD Worker
    participant Viewport as ThreeViewport

    User->>Editor: Ctrl+Enter
    Editor->>Service: evaluateCode()
    Service->>CAD: evaluateAndRender()
    CAD->>Worker: postMessage(code)
    Worker->>Worker: コード実行
    Worker->>CAD: 形状データ返却
    CAD->>Viewport: updateShape()
    Viewport->>Viewport: Three.js更新
    Viewport->>User: 3D表示更新
```

### 3. 状態管理フロー

```mermaid
graph TB
    A[User Action] --> B[Component]
    B --> C[Custom Hook]
    C --> D[ProjectContext]
    D --> E[useReducer]
    E --> F[State Update]
    F --> G[Re-render]
    G --> H[UI Update]
```

### 4. プロジェクト操作フロー（新規追加）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Header as Header Component
    participant Hook as useProjectActions
    participant Service as ProjectService/ExportService
    participant Context as ProjectContext

    User->>Header: Save/Load/Export クリック
    Header->>Hook: 操作関数呼び出し
    Hook->>Service: ビジネスロジック実行
    Service->>Service: ファイル操作・データ処理
    Service-->>Hook: 操作結果
    Hook->>Context: 状態更新（必要に応じて）
    Context-->>Header: 状態変更通知
    Header-->>User: UI更新・フィードバック
```

### 5. Clean Architecture レイヤー分離

```mermaid
graph TD
    A[UI Layer<br/>Components] --> B[Hook Layer<br/>Custom Hooks]
    B --> C[Service Layer<br/>Business Logic]
    B --> D[Context Layer<br/>State Management]
    
    A1[Header.tsx<br/>MonacoEditor.tsx] --> B1[useProjectActions<br/>useProjectState]
    B1 --> C1[ProjectService<br/>ExportService]
    B1 --> D1[ProjectContext]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

## 🎯 設計原則

### 1. 型安全性（Type Safety）
- **100% TypeScript**: any型0個達成
- **厳密な型チェック**: TypeScriptエラー0件維持
- **型駆動開発**: インターフェースファースト設計

### 2. 責任分離（Separation of Concerns）
- **単一責任原則**: 各モジュールが明確な責任を持つ
- **レイヤー分離**: UI・ロジック・データの分離
- **依存関係の逆転**: サービス層への依存注入

### 3. パフォーマンス最適化
- **React.memo**: 不要な再レンダリング防止
- **useCallback/useMemo**: 適切なメモ化
- **効率的ポーリング**: 100ms → 500ms間隔

### 4. 保守性（Maintainability）
- **設定一元管理**: config/constants層
- **重複削除**: DRY原則の徹底
- **コード分割**: 適切なモジュール分割

## 🔧 技術選定理由

### Next.js 14 App Router
- **SSR/SSG対応**: SEO・パフォーマンス向上
- **モダンルーティング**: App Routerによる直感的な構造
- **ビルトイン最適化**: 自動バンドル最適化・画像最適化

### TypeScript
- **型安全性**: コンパイル時エラー検出
- **IntelliSense**: 開発体験向上
- **リファクタリング支援**: 安全なコード変更

### React 18
- **Concurrent Features**: パフォーマンス向上
- **useTransition**: UI応答性改善
- **Suspense**: 非同期処理の改善

### Tailwind CSS
- **Utility-First**: 高速スタイリング
- **カスタムテーマ**: CADアプリに最適化
- **レスポンシブ対応**: モバイルフレンドリー

### Monaco Editor
- **VS Code体験**: プロフェッショナルエディター
- **TypeScript統合**: IntelliSense・型チェック
- **カスタマイズ性**: テーマ・設定の柔軟性

### Three.js
- **高性能3D**: WebGL最適化
- **豊富なエコシステム**: プラグイン・拡張
- **CAD向け機能**: メッシュ・マテリアル処理

## 🚀 パフォーマンス戦略

### 1. バンドル最適化
```typescript
// Next.js設定
const nextConfig = {
  experimental: {
    optimizePackageImports: ['three', '@monaco-editor/react']
  },
  webpack: (config) => {
    // Tree shakingの最適化
    config.optimization.usedExports = true;
    return config;
  }
};
```

### 2. React最適化
```typescript
// コンポーネントメモ化
const MonacoEditor = memo(({ value, onChange, ...props }) => {
  // 不要な再レンダリング防止
});

// useCallback最適化
const evaluateCode = useCallback(async (code: string) => {
  // 安定した関数参照
}, []); // 空の依存配列でメモ化
```

### 3. ポーリング最適化
```typescript
// 効率的な状態監視
useEffect(() => {
  const interval = setInterval(() => {
    // 状態変更時のみ更新
    if (currentState !== previousState) {
      setState(currentState);
    }
  }, 500); // 100ms → 500ms（5倍効率化）
  
  return () => clearInterval(interval);
}, [currentState]);
```

## 🛡️ エラーハンドリング戦略

### 1. 型レベルエラー防止
```typescript
// 厳密な型定義
interface CADWorkerMessage {
  type: CADWorkerMessageType; // string → 厳密な型
  payload: CADWorkerPayload;  // any → 詳細な型
}
```

### 2. ランタイムエラー処理
```typescript
// 統一されたエラーハンドリング
const executeWithErrorHandling = useCallback(async (operation) => {
  try {
    await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setError(errorMessage);
    console.error('Operation failed:', errorMessage);
  }
}, []);
```

### 3. ユーザーフレンドリーエラー表示
```typescript
// エラー表示コンポーネント
const ErrorDisplay = ({ error, onClear }) => (
  <div className="bg-red-100 border border-red-400 text-red-700">
    <strong>Error:</strong> {error}
    <button onClick={onClear}>×</button>
  </div>
);
```

## 🔮 拡張性・将来性

### 1. プラグインアーキテクチャ
```typescript
// プラグインインターフェース
interface CADPlugin {
  name: string;
  version: string;
  init: (context: CADContext) => void;
  destroy: () => void;
}
```

### 2. マイクロフロントエンド対応
```typescript
// モジュールフェデレーション準備
const ModularComponent = lazy(() => import('./PluginComponent'));
```

### 3. Web Assembly統合
```typescript
// WASM最適化CADカーネル統合準備
interface CADKernel {
  wasmModule?: WebAssembly.Module;
  jsModule?: CADWorkerInterface;
}
```

## 📊 メトリクス・監視

### 1. パフォーマンスメトリクス
- **バンドルサイズ**: 289kB (最適化済み)
- **ポーリング効率**: 100ms → 500ms (5倍効率化)
- **TypeScriptエラー**: 0件維持
- **any型使用**: 0個達成

### 2. 品質メトリクス
- **コード重複率**: 20% → 5%以下
- **責任分離度**: UI・ロジック・データ完全分離
- **テスト可能性**: 依存注入・Mock対応

### 3. 開発体験メトリクス
- **型安全性**: IntelliSense 100%対応
- **ホットリロード**: 高速開発サイクル
- **エラー検出**: コンパイル時検出

---

*最終更新: 2024年12月29日*  
*バージョン: 1.0.0*  
*ステータス: リファクタリング完了* 