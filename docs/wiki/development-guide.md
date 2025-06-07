# Modeler X 開発ガイド

## 📋 概要

Modeler Xプロジェクトに新たに参加する開発者、または既存機能を拡張・カスタマイズしたい開発者向けの包括的な開発ガイドです。プロジェクトのセットアップから本格的な開発まで、段階的に説明します。

## 🚀 開発環境セットアップ

### 前提条件

```powershell
# Node.js 18以上（推奨: LTS版）
node --version  # v18.x.x以上

# npm（Node.jsに付属）
npm --version   # 9.x.x以上

# Git
git --version
```

### プロジェクトクローン・セットアップ

```powershell
# リポジトリクローン
git clone <repository-url> modeler-x
cd modeler-x

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### IDE推奨設定（VS Code）

#### 必須拡張機能

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-react-refactor"
  ]
}
```

#### VS Code設定（`.vscode/settings.json`）

```json
{
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 開発コマンド

```powershell
# 開発サーバー（ホットリロード付き）
npm run dev

# TypeScript型チェック
npm run type-check

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# 依存関係更新確認
npm outdated

# 依存関係更新
npm update
```

## 🏗️ プロジェクト構造理解

### 主要ディレクトリ

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # ルートレイアウト
│   ├── page.tsx         # メインページ
│   └── globals.css      # グローバルスタイル
├── components/          # Reactコンポーネント（UI層）
├── lib/                 # ライブラリ・インフラストラクチャ層
│   ├── cadWorkerManager.ts  # CADワーカー管理
│   ├── CascadeStudioCore.ts # CADカーネルコア
│   └── utils.ts             # ユーティリティ関数
├── hooks/              # カスタムフック
├── context/            # React Context
├── services/           # ビジネスロジック
├── config/             # 設定ファイル
├── constants/          # 定数定義
└── types/              # 型定義
```

### 依存関係マップ

```
┌─────────────────┐
│   Components    │ ← UI層（最上位）
└─────────────────┘
          ↓
┌─────────────────┐
│ Custom Hooks    │ ← ロジック統合層
└─────────────────┘
          ↓
┌─────────────────┐
│   Services      │ ← ビジネスロジック層
└─────────────────┘
          ↓
┌─────────────────┐
│      Lib        │ ← インフラストラクチャ層
└─────────────────┘
          ↓
┌─────────────────┐
│ Config/Types    │ ← 設定・型定義層（最下位）
└─────────────────┘
```

## 🛠️ 開発ワークフロー

### 1. 新機能開発フロー

#### ステップ1: 型定義作成

```typescript
// src/types/index.ts に追加
export interface NewFeature {
  id: string;
  name: string;
  settings: NewFeatureSettings;
}

export interface NewFeatureSettings {
  enabled: boolean;
  options: Record<string, any>;
}
```

#### ステップ2: サービス層実装

```typescript
// src/services/newFeatureService.ts
export interface NewFeatureServiceInterface {
  initialize: () => Promise<void>;
  execute: (params: NewFeature) => Promise<void>;
  getStatus: () => NewFeatureStatus;
}

class NewFeatureService implements NewFeatureServiceInterface {
  async initialize(): Promise<void> {
    // 初期化処理
  }

  async execute(params: NewFeature): Promise<void> {
    // 機能実行
  }

  getStatus(): NewFeatureStatus {
    // 状態取得
  }
}

export const newFeatureService = new NewFeatureService();
```

#### ステップ3: カスタムフック作成

```typescript
// src/hooks/useNewFeature.ts
export const useNewFeature = () => {
  const [status, setStatus] = useState<NewFeatureStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: NewFeature) => {
    try {
      setStatus('loading');
      await newFeatureService.execute(params);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  return { status, error, execute };
};
```

#### ステップ4: コンポーネント実装

```typescript
// src/components/NewFeatureComponent.tsx
export const NewFeatureComponent: React.FC = () => {
  const { status, error, execute } = useNewFeature();

  const handleExecute = useCallback(() => {
    execute({
      id: 'feature-1',
      name: 'New Feature',
      settings: { enabled: true, options: {} }
    });
  }, [execute]);

  return (
    <div>
      <button 
        onClick={handleExecute} 
        disabled={status === 'loading'}
      >
        {status === 'loading' ? '実行中...' : '実行'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

#### 実装例: Footerコンポーネント（ステータス表示統合）

最近追加されたFooterコンポーネントを例に、実際の開発プロセスを説明します：

```typescript
// src/components/Footer.tsx - 実装例
interface FooterProps {
  isCADWorkerReady: boolean;
  isWorking: boolean;
  isWorkerReady: boolean;
  hasUnsavedChanges: boolean;
  error?: string;
}

const Footer: React.FC<FooterProps> = memo(({
  isCADWorkerReady,
  isWorking,
  isWorkerReady,
  hasUnsavedChanges,
  error
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-6 px-3 bg-modeler-background-secondary border-t border-modeler-control-border">
      
      {/* 左側: ステータス情報 */}
      <div className="flex items-center space-x-4">
        {/* CADカーネル状態 */}
        <div className="flex items-center space-x-1">
          <span className="text-modeler-control-text-secondary">CAD Kernel:</span>
          <span className={isCADWorkerReady ? 'text-modeler-accent-success' : 'text-modeler-accent-warning'}>
            {isCADWorkerReady ? '✅ Ready' : '⏳ Initializing...'}
          </span>
        </div>

        {/* 他のステータス... */}
      </div>

      {/* 右側: ショートカットヘルプ */}
      <div className="text-xs text-modeler-control-text-secondary">
        Ctrl+Enter: evaluate • F5: update • Ctrl+S: save
      </div>
    </div>
  );
});

Footer.displayName = 'Footer';
export default Footer;
```

**このコンポーネントのポイント:**
1. **React.memo**: 状態変更時のみ再レンダリング
2. **型安全性**: 厳密なPropsインターフェース
3. **デザイン統一**: VSCodeライクなスタイリング
4. **状態分離**: 各種ステータスを統合表示

### 2. バグ修正フロー

#### ステップ1: 問題の特定

```typescript
// デバッグ用ヘルパー
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// 使用例
debug('CADワーカー状態', { isReady, isWorking });
```

#### ステップ2: 型安全な修正

```typescript
// 型安全性を保ちながら修正
const fixedFunction = (params: StrictlyTypedParams): SafeReturnType => {
  // TypeScriptエラーが出ないことを確認
  return processParams(params);
};
```

#### ステップ3: テスト・検証

```powershell
# 型チェック
npm run type-check

# ビルドテスト
npm run build

# 開発環境で動作確認
npm run dev
```

## 🎨 テーマ・スタイリング

### 統一テーマシステム

Modeler XではVisual Studio Darkテーマを全コンポーネントに統一適用しています。

#### TailwindCSS v4テーマ設定

```css
/* src/app/globals.css */
@theme {
  /* VS Code Dark テーマカラー */
  --color-modeler-background-primary: #1e1e1e;
  --color-modeler-background-secondary: #252526;
  --color-modeler-background-tertiary: #2d2d30;
  
  --color-modeler-control-border: #3e3e42;
  --color-modeler-control-text-primary: #cccccc;
  --color-modeler-control-text-secondary: #969696;
  
  --color-modeler-accent-primary: #007acc;
  --color-modeler-accent-success: #4ec9b0;
  --color-modeler-accent-warning: #ffcc02;
  --color-modeler-accent-error: #f44747;
}
```

#### コンポーネントでの使用

```typescript
// TailwindCSSクラスを使用
const Header: React.FC = () => {
  return (
    <header className="bg-modeler-background-secondary border-b border-modeler-control-border">
      <h1 className="text-modeler-control-text-primary">Modeler X</h1>
    </header>
  );
};
```

#### Monaco Editor テーマ

```typescript
// vs-darkテーマを適用
<MonacoEditor
  value={code}
  onChange={setCode}
  theme="vs-dark" // Visual Studio Darkテーマ
  language="typescript"
/>
```

#### DockView テーマ

```typescript
// themeDarkを適用
import { themeDark } from 'dockview';

<DockviewReact
  theme={themeDark} // Visual Studio Darkテーマ
  components={{ /* ... */ }}
/>
```

### テーマカスタマイズ

新しいコンポーネントを作成する際は、以下のカラーパレットを使用してください：

| 用途 | TailwindCSSクラス | 色値 |
|------|------------------|------|
| 主背景 | `bg-modeler-background-primary` | `#1e1e1e` |
| 副背景 | `bg-modeler-background-secondary` | `#252526` |
| 第三背景 | `bg-modeler-background-tertiary` | `#2d2d30` |
| ボーダー | `border-modeler-control-border` | `#3e3e42` |
| 主テキスト | `text-modeler-control-text-primary` | `#cccccc` |
| 副テキスト | `text-modeler-control-text-secondary` | `#969696` |
| アクセント | `text-modeler-accent-primary` | `#007acc` |
| 成功 | `text-modeler-accent-success` | `#4ec9b0` |
| 警告 | `text-modeler-accent-warning` | `#ffcc02` |
| エラー | `text-modeler-accent-error` | `#f44747` |

## 📝 コーディング規約

### TypeScript規約

#### 型定義

```typescript
// ✅ 良い例：明示的な型定義
interface UserConfig {
  name: string;
  age: number;
  preferences: UserPreferences;
}

// ❌ 悪い例：any型の使用
interface BadConfig {
  name: string;
  data: any; // 避ける！
}
```

#### 関数定義

```typescript
// ✅ 良い例：明示的な戻り値の型
const calculateArea = (width: number, height: number): number => {
  return width * height;
};

// ✅ 良い例：非同期関数
const fetchData = async (id: string): Promise<ApiResponse> => {
  const response = await fetch(`/api/data/${id}`);
  return response.json();
};
```

#### Error Handling

```typescript
// ✅ 良い例：適切なエラーハンドリング
const executeWithErrorHandling = async <T>(
  operation: () => Promise<T>
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Operation failed:', errorMessage);
    return null;
  }
};
```

### React規約

#### コンポーネント定義

```typescript
// ✅ 良い例：Propsインターフェース + memo
interface ComponentProps {
  title: string;
  onAction: (value: string) => void;
  optional?: boolean;
}

export const MyComponent = memo<ComponentProps>(({ 
  title, 
  onAction, 
  optional = false 
}) => {
  return <div>{title}</div>;
});

MyComponent.displayName = 'MyComponent';
```

#### useCallback/useMemo使用

```typescript
// ✅ 良い例：適切な依存関係
const expensiveCalculation = useMemo(() => {
  return complexCalculation(data);
}, [data]); // dataが変わった時のみ再計算

const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]); // onItemClickが変わった時のみ再生成
```

### CSS/Tailwind規約

```typescript
// ✅ 良い例：Tailwindクラスの整理
const buttonClasses = cn(
  // ベーススタイル
  'px-4 py-2 rounded-md font-medium transition-colors',
  // 状態別スタイル
  'hover:bg-opacity-80 focus:outline-none focus:ring-2',
  // 条件付きスタイル
  {
    'bg-blue-600 text-white': variant === 'primary',
    'bg-gray-200 text-gray-900': variant === 'secondary',
    'opacity-50 cursor-not-allowed': disabled,
  }
);
```

## 🔧 デバッグ・トラブルシューティング

### 一般的な問題と解決法

#### 1. TypeScriptエラー

```powershell
# 型チェック実行
npm run type-check

# 具体的なエラー例と解決法
error TS2339: Property 'xxx' does not exist on type 'yyy'
```

**解決法:**
```typescript
// 型定義を追加・修正
interface ExtendedType extends BaseType {
  xxx: string;
}
```

#### 2. Monaco Editorが動作しない

**症状**: エディターが表示されない、IntelliSenseが効かない

**解決法:**
```typescript
// useEffect内でエディター初期化を確認
useEffect(() => {
  if (editor) {
    console.log('Editor initialized:', editor);
    // 型定義読み込み状態確認
    typeDefinitionService.loadTypeDefinitions(editor);
  }
}, [editor]);
```

#### 3. CADワーカーエラー

**症状**: 3D形状が表示されない、ワーカーが応答しない

**解決法:**
```typescript
// ワーカー状態確認
const { isWorkerReady, isWorkerWorking, error } = useCADWorker();

console.log('Worker Status:', {
  ready: isWorkerReady,
  working: isWorkerWorking,
  error
});

// ワーカー再初期化
if (error) {
  await cadWorkerService.initializeWorker();
}
```

#### 4. パフォーマンス問題

**症状**: 画面が重い、レンダリングが遅い

**診断ツール:**
```typescript
// React Developer Tools Profiler使用
// Chrome DevTools Performance tab使用

// コンポーネントレンダリング回数確認
const renderCount = useRef(0);
renderCount.current++;
console.log(`Component rendered ${renderCount.current} times`);
```

### デバッグツール

#### 1. React Developer Tools

```typescript
// コンポーネント名表示用
MyComponent.displayName = 'MyComponent';

// 開発時のみのデバッグ情報
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

#### 2. TypeScript言語サーバー

```json
// tsconfig.json設定
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true
  }
}
```

#### 3. Chrome DevTools

```typescript
// パフォーマンス測定
console.time('expensive-operation');
await expensiveOperation();
console.timeEnd('expensive-operation');

// メモリ使用量確認
if (performance.memory) {
  console.log('Memory usage:', performance.memory);
}
```

## 🚀 デプロイ・最適化

### プロダクションビルド

```powershell
# プロダクションビルド
npm run build

# ビルド結果確認
npm start
```

### パフォーマンス最適化

#### 1. バンドルサイズ分析

```powershell
# webpack-bundle-analyzer（別途インストール必要）
npm install --save-dev @next/bundle-analyzer

# next.config.mjsで有効化
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

# 分析実行
ANALYZE=true npm run build
```

#### 2. 動的インポート

```typescript
// 大きなライブラリの動的読み込み
const HeavyLibrary = lazy(() => import('./HeavyLibrary'));

// 使用時
<Suspense fallback={<div>Loading...</div>}>
  <HeavyLibrary />
</Suspense>
```

#### 3. メモ化最適化

```typescript
// 高コストな計算のメモ化
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// コンポーネントメモ化
const OptimizedComponent = memo(({ data }) => {
  return <div>{processData(data)}</div>;
});
```

## 📚 学習リソース

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### プロジェクト固有知識

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [Three.js Documentation](https://threejs.org/docs/)
- [OpenCASCADE.js](https://github.com/donalffons/opencascade.js)

### 推奨学習パス

1. **TypeScript基礎** → 型安全性の理解
2. **React Hooks** → 状態管理・副作用処理
3. **Next.js App Router** → モダンReactフレームワーク
4. **Clean Architecture** → 責任分離・依存関係管理

## 🤝 コントリビューション

### プルリクエスト作成手順

1. **ブランチ作成**
```powershell
git checkout -b feature/awesome-feature
```

2. **変更実装**
```powershell
# コード変更
# 型チェック
npm run type-check

# ビルドテスト
npm run build
```

3. **コミット**
```powershell
git add .
git commit -m "feat: add awesome feature"
```

4. **プッシュ・プルリクエスト**
```powershell
git push origin feature/awesome-feature
# GitHubでプルリクエスト作成
```

### コミットメッセージ規約

```
type(scope): description

feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正（機能変更なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド設定等の変更
```

## 🔮 今後の展望

### 開発ロードマップ

1. **テスト導入** - Jest + React Testing Library
2. **Storybook導入** - コンポーネントドキュメント
3. **CI/CD構築** - GitHub Actions
4. **プラグインシステム** - 拡張可能アーキテクチャ
5. **Web Assembly統合** - パフォーマンス向上

### 技術的課題

- **マルチユーザー対応** - リアルタイムコラボレーション
- **クラウド統合** - ファイル保存・共有
- **モバイル対応** - レスポンシブ・タッチ操作
- **アクセシビリティ** - WAI-ARIA準拠

---

*最終更新: 2024年12月29日*  
*バージョン: 1.0.0*  
*対象読者: 初級〜上級開発者* 