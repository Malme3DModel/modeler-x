# Cascade Studio - Next.js Edition

Cascade StudioをNext.js 14、TypeScript、React 18に移植したバージョンです。ブラウザ上で動作するフル機能のCADカーネルを提供します。

## 特徴

- **Next.js 14**: 最新のReactフレームワーク
- **TypeScript**: 型安全性とインテリセンス
- **React 18**: 最新のReact機能
- **Monaco Editor**: VS Codeと同じエディター体験
- **Three.js**: 3Dビジュアライゼーション
- **OpenCASCADE.js**: 強力なCADカーネル
- **Tailwind CSS**: モダンなスタイリング

## 開始方法

### 前提条件

- Node.js 18以上
- npm または yarn

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
```

## 使用方法

### 基本的なCAD操作

左側のエディターでTypeScriptコードを記述し、`Ctrl+Enter`で実行します。

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

## プロジェクト構造

```
./
├── src/
│   ├── app/                     # Next.jsアプリディレクトリ
│   │   ├── globals.css          # グローバルスタイル
│   │   ├── layout.tsx           # レイアウト
│   │   ├── page.tsx             # メインページ
│   │   └── favicon.ico          # ファビコン
│   ├── components/              # Reactコンポーネント
│   │   ├── CADWorkerManager.tsx
│   │   ├── DockviewLayout.tsx
│   │   ├── MonacoEditor.tsx
│   │   └── ThreeViewport.tsx
│   ├── lib/                     # ライブラリとユーティリティ
│   │   └── CascadeStudioCore.ts
│   └── types/                   # 型定義
├── public/                      # 静的ファイル
│   ├── js/                      # 元のJavaScriptファイル
│   ├── fonts/                   # フォントファイル
│   ├── icon/                    # アイコン
│   └── textures/                # テクスチャ
├── package.json
└── v0                           # 旧版
```

## 技術スタック

- **フレームワーク**: Next.js 14
- **言語**: TypeScript
- **UIライブラリ**: React 18
- **スタイリング**: Tailwind CSS
- **エディター**: Monaco Editor
- **3D**: Three.js
- **CAD**: OpenCASCADE.js
- **レイアウト**: Golden Layout
- **GUI**: TweakPane

## 元のプロジェクトとの違い

1. **モダンなフレームワーク**: Next.jsによるSSR/SSG対応
2. **型安全性**: TypeScriptによる型チェック
3. **コンポーネント化**: Reactコンポーネントによる再利用可能な設計
4. **モダンなスタイリング**: Tailwind CSSによる効率的なスタイリング
5. **開発体験**: Hot Reloadとモダンな開発ツール

## ライセンス

MIT License - 元のCascade Studioプロジェクトと同じライセンスです。

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 元のプロジェクト

このプロジェクトは [Cascade Studio](https://github.com/zalo/CascadeStudio) by Johnathon Selstadをベースにしています。
