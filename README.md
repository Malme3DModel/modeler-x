# Modeler-X: Cascade Studio Next.js移植プロジェクト

このプロジェクトは、[Cascade Studio](docs/v0/)をNext.js 14、TypeScript、React 18に移植した現代的なWebベースCADアプリケーションです。

## 📋 プロジェクト概要

**Modeler-X**は、ブラウザ上で動作するフル機能のCADカーネルとIDEです。元の[Cascade Studio](https://zalo.github.io/CascadeStudio/)の機能を維持しながら、最新のWeb技術スタックに移植することで、より高いパフォーマンス、型安全性、開発体験を実現しています。

### 🔄 移植の背景

元のCascade Studioは静的なHTML/JavaScript/jQueryベースのアプリケーションでしたが、以下の理由により現代的なフレームワークへの移植を行いました：

- **保守性の向上**: TypeScriptによる型安全性とコード品質の向上
- **開発体験の改善**: React/Next.jsエコシステムの活用
- **パフォーマンス最適化**: モダンなバンドリングとコード分割
- **テスト可能性**: Playwrightによるエンドツーエンドテスト
- **スケーラビリティ**: コンポーネントベースアーキテクチャ

## ✨ 主要機能

### CAD機能
- **3Dモデリング**: プリミティブ形状からCSG、フィレット、スイープまで対応
- **コードエディタ**: Monaco Editorによるシンタックスハイライトと自動補完
- **3Dビューポート**: Three.jsベースの高性能WebGL描画
- **GUIパネル**: Tweakpaneによるパラメータ制御
- **ファイル入出力**: STEP、STL、OBJフォーマット対応
- **URL状態管理**: デザインをURLで共有可能

### 技術的特徴
- **WebWorker処理**: OpenCascade.jsをワーカースレッドで実行
- **レスポンシブデザイン**: モバイル対応のUI
- **PWA対応**: オフライン利用可能（予定）
- **型安全性**: 完全なTypeScript実装

## 🔄 元版との主な相違点

| 項目 | 元のCascade Studio | Modeler-X (移植版) |
|------|-------------------|-------------------|
| **フレームワーク** | 静的HTML + jQuery | Next.js 14 + React 18 |
| **言語** | JavaScript | TypeScript |
| **スタイリング** | カスタムCSS | Tailwind CSS + DaisyUI |
| **状態管理** | グローバル変数 | React Context + Hooks |
| **レイアウト** | Golden Layout v1.5.9 | Golden Layout v2.6.0 |
| **Three.js** | v0.129.0 (直接利用) | v0.160.0 + React Three Fiber |
| **Monaco Editor** | v0.20.0 | v4.7.0 (@monaco-editor/react) |
| **Tweakpane** | v3.0.5 | v4.0.3 |
| **OpenCascade.js** | v0.1.15 | v1.1.1 |
| **テスト** | 基本的なスクリーンショット比較 | Playwright E2Eテスト |
| **ビルドシステム** | なし（静的ファイル） | Next.js + Webpack |
| **開発サーバー** | Live Server等 | Next.js Dev Server |
| **デプロイ** | GitHub Pages | Vercel対応 |

## 🏗️ アーキテクチャ

### 移植版のアーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                      │
├─────────────────────────────────────────────────────────────┤
│  React Components (TypeScript)                             │
│  ├── CascadeStudioLayout (Golden Layout v2)                │
│  ├── MonacoCodeEditor (@monaco-editor/react)               │
│  ├── ThreeJSViewport (React Three Fiber)                   │
│  └── TweakpaneGUI (Tweakpane v4)                          │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks & Context                                    │
│  ├── useCADWorker (WebWorker管理)                          │
│  ├── AppContext (グローバル状態)                            │
│  └── URLStateManager (URL状態管理)                         │
├─────────────────────────────────────────────────────────────┤
│  WebWorker (OpenCascade.js v1.1.1)                        │
│  └── CAD処理・形状生成                                      │
└─────────────────────────────────────────────────────────────┘
```

### 元版のアーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                    静的HTML + jQuery                        │
├─────────────────────────────────────────────────────────────┤
│  JavaScript Modules                                        │
│  ├── CascadeMain.js (メイン制御)                            │
│  ├── CascadeView.js (3Dビュー)                             │
│  └── CascadeViewHandles.js (UI制御)                        │
├─────────────────────────────────────────────────────────────┤
│  External Libraries                                        │
│  ├── Golden Layout v1.5.9                                 │
│  ├── Monaco Editor v0.20.0                                │
│  ├── Three.js v0.129.0                                    │
│  └── Tweakpane v3.0.5                                     │
├─────────────────────────────────────────────────────────────┤
│  WebWorker (OpenCascade.js v0.1.15)                       │
│  └── CAD処理・形状生成                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 セットアップと実行

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 利用可能なスクリプト
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック
npm run test         # Playwrightテスト実行
npm run test:ui      # テストUIモード
npm run test:headed  # ヘッドありテスト
npm run test:debug   # デバッグモード
```

## 📁 プロジェクト構造

```
modeler-x/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ（CascadeStudio）
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
│   ├── cad/               # CAD関連コンポーネント
│   │   └── MonacoCodeEditor.tsx
│   ├── threejs/           # Three.js関連
│   │   └── ThreeJSViewport.tsx
│   ├── layout/            # レイアウトコンポーネント
│   │   ├── CascadeStudioLayout.tsx
│   │   └── CascadeNavigation.tsx
│   └── gui/               # GUI関連
│       └── TweakpaneGUI.tsx
├── hooks/                 # カスタムフック
│   └── useCADWorker.ts    # CADワーカー管理
├── lib/                   # ライブラリコード
│   ├── cad/               # CADユーティリティ
│   ├── layout/            # レイアウト設定
│   └── utils/             # 共通ユーティリティ
├── public/                # 静的ファイル
│   ├── workers/           # WebWorkerファイル
│   ├── opencascade/       # OpenCascade.jsライブラリ
│   └── monaco-editor-workers/ # Monaco Editorワーカー
├── types/                 # TypeScript型定義
├── docs/                  # ドキュメント
│   ├── v0/                # 元のCascade Studio
│   └── wiki/              # 移植関連ドキュメント
└── tests/                 # Playwrightテスト
```

## 🛠️ 使用技術

### フロントエンド
- **[Next.js 14.2.5](https://nextjs.org/)** - Reactフレームワーク
- **[TypeScript](https://www.typescriptlang.org/)** - 型安全性
- **[React 18.3.1](https://react.dev/)** - UIライブラリ
- **[Tailwind CSS](https://tailwindcss.com/)** - スタイリング
- **[DaisyUI](https://daisyui.com/)** - UIコンポーネント

### 3D・CAD
- **[Three.js 0.160.0](https://threejs.org/)** - 3D描画エンジン
- **[React Three Fiber 8.15.12](https://docs.pmnd.rs/react-three-fiber)** - React統合
- **[React Three Drei 9.92.7](https://github.com/pmndrs/drei)** - Three.jsユーティリティ
- **[OpenCascade.js 1.1.1](https://ocjs.org/)** - CADカーネル

### エディタ・UI
- **[Monaco Editor 4.7.0](https://microsoft.github.io/monaco-editor/)** - コードエディタ
- **[Tweakpane 4.0.3](https://tweakpane.github.io/docs/)** - GUIコントロール
- **[Golden Layout 2.6.0](http://golden-layout.com/)** - マルチパネルレイアウト

### 開発・テスト
- **[Playwright](https://playwright.dev/)** - E2Eテスト
- **[ESLint](https://eslint.org/)** - コード品質
- **[PostCSS](https://postcss.org/)** - CSS処理

## 📚 使い方

1. **コードエディタ**: 左パネルでJavaScript/TypeScriptコードを記述
2. **3Dビューポート**: 中央で3Dモデルをリアルタイム表示
3. **GUIパネル**: 右側でパラメータを調整
4. **エクスポート**: ナビゲーションバーからSTEP/STL/OBJ形式で出力
5. **URL共有**: ブラウザのURLでデザインを共有

### サンプルコード
```javascript
// 基本的なボックスの作成
let box = Box(10, 10, 10, true);

// フィレット付きシリンダー
let cylinder = Cylinder(5, 20, true);
let filletedCylinder = Fillet(cylinder, 1);

// ブール演算
let result = Difference(box, cylinder);
```

## 🔄 移植の進捗

### ✅ 完了済み
- [x] Next.js 14 + TypeScript基盤構築
- [x] Monaco Editorの統合
- [x] Three.js + React Three Fiberの統合
- [x] OpenCascade.js WebWorkerの移植
- [x] Golden Layout v2への更新
- [x] Tweakpane v4への更新
- [x] URL状態管理の実装
- [x] ファイル入出力機能
- [x] Playwrightテストの実装

### 🚧 進行中・予定
- [ ] PWA機能の実装
- [ ] パフォーマンス最適化
- [ ] モバイル対応の改善
- [ ] 追加のCAD機能
- [ ] ドキュメントの充実

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！以下の手順でご参加ください：

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🙏 謝辞

- **[Johnathon Selstad (@zalo)](https://github.com/zalo)** - 元のCascade Studioの作者
- **[OpenCascade.js](https://github.com/donalffons/opencascade.js)** - WebAssembly CADカーネル
- **[Three.js](https://threejs.org/)** - 3D描画ライブラリ
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - コードエディタ

## 📞 サポート

質問や問題がある場合は、[GitHub Issues](https://github.com/your-username/modeler-x/issues)でお気軽にお知らせください。

---

**元のCascade Studio**: https://zalo.github.io/CascadeStudio/  
**移植版デモ**: https://your-demo-url.vercel.app/
