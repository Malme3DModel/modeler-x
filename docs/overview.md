# プロジェクト概要

このプロジェクトは JavaScript 版の Next.js (バージョン 12.1.5) をベースに構築されたウェブアプリケーションです。

## 技術スタック

- Next.js 12.1.5 (JavaScript)
- React 18.0.0
- @google/model-viewer 1.11.1
- opencascade.js 2.0.0-beta.c301f5e

## ディレクトリ構成

- pages/: ページコンポーネント
- public/: 静的アセット
- styles/: グローバルおよびモジュール CSS
- src/: その他のソースコード
- docs/convert_plan/: ドキュメント作成プラン

## npm スクリプト

```bash
# 開発サーバ起動
dev: next dev

# 本番ビルド
build: next build

# 本番環境で起動
start: next start

# ESLint 実行
lint: next lint

# ビルドキャッシュ削除
clean: rm -r .next
``` 