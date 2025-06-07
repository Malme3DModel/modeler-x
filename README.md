# Modeler X - モダンCADアプリケーション

Cascade StudioをNext.js 14、TypeScript、React 18でフルリファクタリングしたモダンCADアプリケーションです。ブラウザ上で動作するフル機能のCADカーネルを提供し、優れた開発体験と型安全性を実現しています。

## ✨ 特徴

### 🚀 モダン技術スタック
- **Next.js 14**: App Router・SSR/SSG対応の最新Reactフレームワーク
- **TypeScript**: 完全な型安全性（any型0個達成）
- **React 18**: 最新のReact機能・パフォーマンス最適化
- **Monaco Editor**: VS Codeと同じエディター体験・IntelliSense対応
- **Three.js**: 高品質3Dビジュアライゼーション
- **OpenCASCADE.js**: 強力なCADカーネル
- **Tailwind CSS**: モダンなスタイリングシステム
- **Dockview**: プロフェッショナルなレイアウト管理

### 🏗️ 設計品質
- **型安全性**: TypeScriptエラー0件・完全な型定義
- **アーキテクチャ**: サービス層・責任分離・Clean Architecture
- **パフォーマンス**: React.memo・useCallback最適化・効率的ポーリング
- **保守性**: 設定一元管理・重複削除・単一責任原則
- **開発体験**: カスタムフック・Context API・エラーハンドリング

## 🚀 開始方法

### 前提条件

- Node.js 18以上
- npm または yarn
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### インストール

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスします。

### ビルド

```bash
# プロダクション用ビルド
npm run build

# プロダクションサーバーを起動
npm start

# 型チェック
npm run type-check
```

## 💻 使用方法

### 基本的なCAD操作

左側のエディターでTypeScriptコードを記述し、以下のキーボードショートカットで実行します：

- **`Ctrl+Enter`**: コード実行
- **`F5`**: モデル更新
- **`Ctrl+S`**: プロジェクト保存

```typescript
// 基本的な形状
let sphere = Sphere(50);
let box = Box(100, 100, 100);

// 変換
let translatedBox = Translate([0, 0, 50], box);

// ブール演算
let result = Difference(sphere, translatedBox);

// シーンに追加
sceneShapes.push(result);
```

### 利用可能な関数

#### 基本形状
- `Box(width, height, depth)` - 直方体
- `Sphere(radius)` - 球
- `Cylinder(radius, height, centered?)` - 円柱
- `Cone(radius1, radius2, height)` - 円錐
- `Text3D(text, size, thickness, font?)` - 3Dテキスト

#### 変換
- `Translate(vector, shape)` - 移動
- `Rotate(axis, angle, shape)` - 回転
- `Scale(factor, shape)` - 拡大縮小
- `Mirror(plane, shape)` - 鏡像

#### ブール演算
- `Union(...shapes)` - 和集合
- `Difference(base, tools)` - 差集合
- `Intersection(...shapes)` - 積集合

#### GUI コントロール
- `Slider(name, default, min, max)` - スライダー
- `Checkbox(name, default)` - チェックボックス
- `TextInput(name, default)` - テキスト入力
- `Dropdown(name, options, defaultIndex)` - ドロップダウン

## 🏗️ アーキテクチャ

### プロジェクト構造

```
modeler-x/
├── docs/                        # ドキュメント
│   ├── wiki/                    # 設計書・技術資料
│   └── refactoring-plan.md      # リファクタリング計画書
├── src/                         # ソースコード
│   ├── app/                     # Next.js App Router
│   │   ├── globals.css          # グローバルスタイル
│   │   ├── layout.tsx           # レイアウト
│   │   └── page.tsx             # メインページ
│   ├── components/              # UIコンポーネント
│   │   ├── CADWorkerManager.tsx # CADワーカー管理
│   │   ├── DockviewLayout.tsx   # レイアウト管理
│   │   ├── MonacoEditor.tsx     # コードエディター
│   │   ├── ThreeViewport.tsx    # 3Dビューポート
│   │   └── Header.tsx           # ヘッダー
│   ├── hooks/                   # カスタムフック
│   │   ├── useCADWorker.ts      # CADワーカー管理
│   │   ├── useKeyboardShortcuts.ts # キーボードショートカット
│   │   └── useProjectState.ts   # プロジェクト状態管理
│   ├── context/                 # React Context
│   │   └── ProjectContext.tsx   # プロジェクト状態
│   ├── services/                # ビジネスロジック
│   │   ├── cadWorkerService.ts  # CADワーカーサービス
│   │   ├── editorService.ts     # エディターサービス
│   │   └── typeDefinitionService.ts # 型定義サービス
│   ├── config/                  # 設定ファイル
│   │   └── cadConfig.ts         # CAD関連設定
│   ├── constants/               # 定数定義
│   │   └── defaultCode.ts       # デフォルトコード
│   └── types/                   # 型定義
│       └── index.ts             # 共通型定義
├── public/                      # 静的ファイル
│   ├── js/                      # CADワーカー・ライブラリ
│   ├── fonts/                   # フォントファイル
│   ├── icon/                    # アイコン
│   └── textures/                # 3Dテクスチャ
└── v0/                          # 旧版（参考用）
```

### レイヤー構造

```
┌─────────────────────────────────────┐
│ UI Layer (Components)               │ ← React Components
├─────────────────────────────────────┤
│ Custom Hooks Layer                  │ ← useCADWorker, useProjectState
├─────────────────────────────────────┤
│ Context Layer                       │ ← ProjectContext (State Management)
├─────────────────────────────────────┤
│ Service Layer                       │ ← Business Logic
├─────────────────────────────────────┤
│ Config/Constants Layer              │ ← Configuration & Constants
└─────────────────────────────────────┘
```

## 🛠️ 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript 5.x (厳密な型チェック)
- **UIライブラリ**: React 18
- **状態管理**: React Context + useReducer
- **スタイリング**: Tailwind CSS + カスタムテーマ
- **レイアウト**: Dockview (プロフェッショナルレイアウト)

### エディター・3D
- **エディター**: Monaco Editor (VS Code ベース)
- **3Dレンダリング**: Three.js
- **CADカーネル**: OpenCASCADE.js
- **ワーカー**: Web Workers (非同期処理)

### 開発・ビルド
- **パッケージマネージャー**: npm
- **ビルドツール**: Next.js Built-in
- **型チェック**: TypeScript Compiler
- **スタイリング**: PostCSS + Tailwind CSS

## 📈 パフォーマンス

### 最適化されたバンドルサイズ
- **メインページ**: 289kB (First Load JS)
- **共有チャンク**: 101kB
- **静的生成**: プリレンダリング対応

### React最適化
- **React.memo**: 不要な再レンダリング防止
- **useCallback**: 安定した関数参照
- **カスタムフック**: ロジック分離・再利用性
- **効率的ポーリング**: 100ms → 500ms間隔

## 🔧 開発

### 設定ファイル
- `next.config.mjs` - Next.js設定
- `tailwind.config.ts` - Tailwind CSS設定
- `tsconfig.json` - TypeScript設定
- `eslint.config.mjs` - ESLint設定

### 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# プロダクションビルド
npm run build

# プロダクションサーバー
npm start
```

## 📚 ドキュメント

詳細な技術資料は `docs/wiki/` ディレクトリをご覧ください：

- [アーキテクチャ設計書](docs/wiki/architecture.md)
- [APIリファレンス](docs/wiki/api-reference.md)
- [開発ガイド](docs/wiki/development-guide.md)
- [リファクタリング計画書](docs/refactoring-plan.md)

## 🚀 元のプロジェクトとの違い

### アーキテクチャの刷新
1. **型安全性の完全実現**: TypeScriptエラー0件・any型0個
2. **モダンフレームワーク**: Next.js 14 App Router
3. **責任分離**: サービス層・カスタムフック・Clean Architecture
4. **状態管理**: React Context + useReducer パターン
5. **パフォーマンス最適化**: React.memo・効率的ポーリング

### 開発体験の向上
1. **IntelliSense**: 完全な型定義・自動補完
2. **エラーハンドリング**: 統一されたエラー処理
3. **ホットリロード**: 高速な開発サイクル
4. **デバッグ性**: 構造化されたログ・エラー表示
5. **保守性**: 設定一元管理・重複削除

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 元のCascade Studioプロジェクトと同じライセンスです。

## 🙏 謝辞

このプロジェクトは [Cascade Studio](https://github.com/zalo/CascadeStudio) by Johnathon Selstadをベースにしています。

---

**Modeler X** - モダンでタイプセーフなCADアプリケーション 🎯
