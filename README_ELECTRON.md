# Modeler X - Electronデスクトップアプリ

このプロジェクトは、Next.jsベースのWebアプリケーションをElectronでデスクトップアプリとして配布できるように設定されています。

## 開発環境での実行

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発モードでElectronアプリを起動
```bash
npm run electron:dev
```

このコマンドは以下を実行します：
- Next.jsの開発サーバーを起動（http://localhost:3000）
- サーバーの起動を待機
- Electronアプリを起動してNext.jsアプリを表示

### 3. Electronのみを起動（Next.jsサーバーが既に起動している場合）
```bash
npm run electron
```

## プロダクションビルド

### 1. 全プラットフォーム用にビルド
```bash
npm run build:electron
```

### 2. Windows用にビルド
```bash
npm run build:win
```

### 3. macOS用にビルド
```bash
npm run build:mac
```

### 4. Linux用にビルド
```bash
npm run build:linux
```

ビルドされたアプリケーションは `dist` フォルダに出力されます。

## ファイル構成

```
modeler-x/
├── electron/
│   ├── main.js          # Electronのメインプロセス
│   └── preload.js       # プリロードスクリプト（セキュリティ用）
├── public/
│   └── icon/            # アプリケーションアイコン
├── src/                 # Next.jsアプリケーションのソース
└── package.json         # Electron設定を含む
```

## 設定のカスタマイズ

### アプリケーション情報の変更
`package.json` の `build` セクションで以下を変更できます：
- `appId`: アプリケーションID
- `productName`: アプリケーション名
- アイコンファイルのパス

### ウィンドウ設定の変更
`electron/main.js` の `createWindow()` 関数で以下を変更できます：
- ウィンドウサイズ（width, height）
- 最小サイズ（minWidth, minHeight）
- その他のウィンドウオプション

## トラブルシューティング

### 開発時のCORSエラー
`electron/main.js` で `webSecurity: false` を設定しているため、開発時のCORSエラーは回避されます。

### ビルドエラー
- Node.jsのバージョンが最新であることを確認してください
- `node_modules` を削除して `npm install` を再実行してください

### アイコンが表示されない
- アイコンファイルが正しいパスに存在することを確認してください
- Windows: .ico形式、macOS: .icns形式、Linux: .png形式が推奨されます

## セキュリティ

このElectron設定では以下のセキュリティ対策を実装しています：
- `nodeIntegration: false`
- `contextIsolation: true`
- プリロードスクリプトによる安全なAPI公開
- 外部リンクのデフォルトブラウザでの開放 