# プロジェクト概要

- フレームワーク: Next.js (JavaScript版) v12.1.5
- 言語: JavaScript
- 主要ディレクトリ:
  - pages/: ルーティングおよびページコンポーネント
  - src/: ユーティリティ、フック、コンポーネントなど
  - styles/: CSSファイル
  - public/: 静的ファイル
  - docs/: ドキュメント用ディレクトリ
- 設定ファイル:
  - next.config.js: Next.js設定
  - .eslintrc.json: ESLint設定
  - package.json: 依存管理とスクリプト定義
- 主なスクリプト:
  - npm run dev: 開発サーバ起動
  - npm run build: ビルド
  - npm start: プロダクションサーバ起動
  - npm run lint: コード品質チェック
  - npm run clean: ビルド成果物削除

## 説明

このプロジェクトはNext.jsを用いたWebアプリケーションです。
TypeScriptではなく純粋なJavaScriptで実装されています。
Next.jsのSSG/SSR機能やAPIルートを活用して高速かつSEOに強いサイトを構築しています。 