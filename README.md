# Modeler X - モダンCADアプリケーション

Cascade StudioをNext.js 14、TypeScript、React 18でフルリファクタリングしたモダンCADアプリケーションです。ブラウザ上で動作するフル機能のCADカーネルを提供し、優れた開発体験と型安全性を実現しています。

## ✨ 特徴

- **Next.js 14**: App Router・SSR/SSG対応の最新Reactフレームワーク
- **TypeScript**: 完全な型安全性（any型0個達成）
- **React 18**: 最新のReact機能・パフォーマンス最適化
- **Monaco Editor**: VS Codeと同じエディター体験・IntelliSense対応
- **Three.js**: 高品質3Dビジュアライゼーション
- **OpenCASCADE.js**: 強力なCADカーネル
- **Clean Architecture**: サービス層・責任分離・型安全性

## 🚀 クイックスタート

### 前提条件

- Node.js 18以上
- npm または yarn
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### インストール・起動

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

# プロダクションサーバー
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

### ヘッダーメニュー機能

VSCodeライクなモダンなヘッダーメニューで以下の操作が可能です：

- **Save**: プロジェクトをJSONファイルで保存
- **Load**: JSONファイルからプロジェクトを読み込み
- **Export**: 3Dモデルを各種フォーマットでエクスポート
  - **STEP**: 高精度CADフォーマット（産業標準）
  - **STL**: 3Dプリンタ向けメッシュフォーマット
  - **OBJ**: 汎用3Dモデルフォーマット

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

## 🏗️ プロジェクト構造

```
modeler-x/
├── docs/wiki/               # 📚 技術資料・設計書
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # UIコンポーネント
│   │   ├── Header.tsx       # 🎨 VSCodeライクなモダンヘッダー
│   │   ├── MonacoEditor.tsx # Monaco エディター
│   │   ├── ThreeViewport.tsx # 3D ビューポート
│   │   └── DockviewLayout.tsx # レイアウト管理
│   ├── hooks/               # カスタムフック
│   │   ├── useProjectState.ts   # プロジェクト状態管理
│   │   ├── useProjectActions.ts # 🆕 プロジェクト操作
│   │   ├── useCADWorker.ts      # CAD ワーカー管理
│   │   └── useKeyboardShortcuts.ts # キーボードショートカット
│   ├── services/            # 🆕 ビジネスロジック層
│   │   ├── projectService.ts    # プロジェクト保存・読み込み
│   │   ├── exportService.ts     # モデルエクスポート（STEP/STL/OBJ）
│   │   ├── cadWorkerService.ts  # CAD ワーカー操作
│   │   └── editorService.ts     # エディター操作
│   ├── context/             # React Context
│   ├── config/              # 設定ファイル
│   ├── constants/           # 定数定義
│   └── types/               # 型定義
├── public/                  # 静的ファイル
└── v0/                      # 旧版（参考用）
```

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript 5.x (厳密な型チェック)
- **UIライブラリ**: React 18
- **状態管理**: React Context + useReducer
- **スタイリング**: Tailwind CSS + カスタムテーマ
- **エディター**: Monaco Editor (VS Code ベース)
- **3Dレンダリング**: Three.js
- **CADカーネル**: OpenCASCADE.js
- **レイアウト**: Dockview (プロフェッショナルレイアウト)

## 📚 ドキュメント

詳細な技術資料は `docs/wiki/` ディレクトリをご覧ください：

- **[アーキテクチャ設計書](docs/wiki/architecture.md)** - システム全体の設計思想・構成図・データフロー
- **[UI設計ガイド](docs/wiki/ui-design-guide.md)** - 🎨 VSCodeライクなモダンUI・デザインシステム
- **[APIリファレンス](docs/wiki/api-reference.md)** - コンポーネント・フック・サービスの詳細仕様
- **[開発ガイド](docs/wiki/development-guide.md)** - 環境構築・開発ワークフロー・コーディング規約
- **[リファクタリング計画書](docs/refactoring-plan.md)** - プロジェクト改善履歴・実施内容

## 🚀 パフォーマンス

- **バンドルサイズ**: 289kB (最適化済み)
- **TypeScriptエラー**: 0件維持
- **any型使用**: 0個達成
- **React最適化**: memo・useCallback適用
- **効率的ポーリング**: 100ms → 500ms間隔

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

開発に参加される場合は、[開発ガイド](docs/wiki/development-guide.md)をご一読ください。

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
