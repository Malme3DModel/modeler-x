# Next.js 14 移行ツール・スクリプト集

## 概要

Next.js 12から14への移行作業で使用するスクリプトとツールをまとめています。

## スクリプト一覧

### 1. dependency-update.sh
依存関係の更新を行うスクリプト

```bash
#!/bin/bash
# Next.js 14への依存関係更新

echo "📦 Next.js 14への依存関係を更新中..."

# メインパッケージの更新
npm install next@14.2.5 react@^18 react-dom@^18

# 開発依存関係の更新
npm install --save-dev @types/react@^18 @types/react-dom@^18 eslint-config-next@14.2.5 @types/node@^20 typescript@^5

# 追加パッケージ（テンプレートベース）
npm install zod@^3.23.8 jwt-decode@^4.0.0

echo "✅ 依存関係の更新が完了しました"
```

### 2. pages-to-app-migration.ps1
Pages RouterからApp Routerへの移行スクリプト（PowerShell）

```powershell
# Pages Router から App Router への移行スクリプト

Write-Host "🔄 Pages Router から App Router への移行を開始..." -ForegroundColor Green

# app ディレクトリが存在しない場合は作成
if (-not (Test-Path "app")) {
    New-Item -ItemType Directory -Path "app"
    Write-Host "📁 app ディレクトリを作成しました" -ForegroundColor Blue
}

# pages/index.tsx を app/page.tsx に移行
if (Test-Path "pages/index.tsx") {
    Write-Host "📝 pages/index.tsx を app/page.tsx に移行中..." -ForegroundColor Yellow
    Copy-Item "pages/index.tsx" "app/page.tsx"
    Write-Host "✅ app/page.tsx の移行が完了しました" -ForegroundColor Green
}

# pages/_app.tsx の内容を参考にapp/layout.tsx を作成
if (Test-Path "pages/_app.tsx") {
    Write-Host "📝 app/layout.tsx のテンプレートを作成中..." -ForegroundColor Yellow
    # layout.tsx のテンプレートは手動で作成する必要があります
    Write-Host "⚠️  pages/_app.tsx を参考に app/layout.tsx を手動で作成してください" -ForegroundColor Yellow
}

# API Routes の移行準備
if (Test-Path "pages/api") {
    Write-Host "📁 API Routes の移行準備..." -ForegroundColor Yellow
    if (-not (Test-Path "app/api")) {
        New-Item -ItemType Directory -Path "app/api"
    }
    Write-Host "⚠️  pages/api/* を app/api/*/route.ts 形式に手動で移行してください" -ForegroundColor Yellow
}

Write-Host "✅ 移行の準備が完了しました" -ForegroundColor Green
```

### 3. compatibility-check.js
互換性チェックスクリプト

```javascript
// opencascade.js と model-viewer の互換性チェック

const fs = require('fs');
const path = require('path');

console.log('🔍 Next.js 14 互換性チェックを開始...');

// package.json の読み込み
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 重要ライブラリのバージョン確認
const importantLibs = {
    'next': '14.2.5',
    'react': '^18',
    'opencascade.js': packageJson.dependencies['opencascade.js'],
    '@google/model-viewer': packageJson.dependencies['@google/model-viewer']
};

console.log('📦 重要ライブラリのバージョン:');
Object.entries(importantLibs).forEach(([lib, version]) => {
    console.log(`  ${lib}: ${version}`);
});

// WASM ファイルの存在確認
const wasmFiles = [];
function findWasmFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findWasmFiles(filePath);
        } else if (file.endsWith('.wasm')) {
            wasmFiles.push(filePath);
        }
    });
}

try {
    findWasmFiles('./public');
    if (wasmFiles.length > 0) {
        console.log('🔧 発見されたWASMファイル:');
        wasmFiles.forEach(file => console.log(`  ${file}`));
    } else {
        console.log('ℹ️  WASMファイルは見つかりませんでした');
    }
} catch (error) {
    console.log('⚠️  WASMファイルの検索中にエラーが発生しました');
}

console.log('✅ 互換性チェックが完了しました');
```

### 4. build-test.sh
ビルドテストスクリプト

```bash
#!/bin/bash
# Next.js 14 ビルドテスト

echo "🏗️  Next.js 14 ビルドテストを開始..."

# TypeScript チェック
echo "📝 TypeScript チェック中..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript チェックが失敗しました"
    exit 1
fi

# ESLint チェック
echo "🔍 ESLint チェック中..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint チェックが失敗しました"
    exit 1
fi

# プロダクションビルド
echo "🏗️  プロダクションビルド中..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ビルドが失敗しました"
    exit 1
fi

# 開発サーバーの起動テスト（5秒間）
echo "🚀 開発サーバーの起動テスト中..."
timeout 5s npm run dev &
if [ $? -eq 0 ]; then
    echo "✅ 開発サーバーが正常に起動しました"
else
    echo "⚠️  開発サーバーの起動を確認してください"
fi

echo "✅ すべてのビルドテストが完了しました"
```

## 使用手順

### 1. 事前準備
```bash
# プロジェクトルートで実行
cd /path/to/your/project
git checkout -b feat/next14-migration
```

### 2. 依存関係の更新
```bash
# Windows (PowerShell)
.\docs\4_convert_next14\tools\dependency-update.sh

# Linux/Mac
bash docs/4_convert_next14/tools/dependency-update.sh
```

### 3. 互換性チェック
```bash
node docs/4_convert_next14/tools/compatibility-check.js
```

### 4. Pages Router の移行
```powershell
# PowerShell で実行
.\docs\4_convert_next14\tools\pages-to-app-migration.ps1
```

### 5. ビルドテスト
```bash
bash docs/4_convert_next14/tools/build-test.sh
```

## 注意事項

- スクリプト実行前に必ずバックアップを取ってください
- opencascade.js の動作確認は手動で行ってください
- App Router への移行は段階的に実施することを推奨します
- 各ステップ後にGitコミットすることを推奨します

## トラブルシューティング

### よくある問題

1. **WASM ローディングエラー**
   - next.config.mjs の webpack 設定を確認
   - dynamic import の使用を検討

2. **型エラー**
   - @types パッケージのバージョン確認
   - tsconfig.json の paths 設定確認

3. **スタイリング崩れ**
   - globals.css の App Router 対応
   - Tailwind CSS の設定確認

4. **API Routes エラー**
   - Named exports (GET, POST) の形式に変更
   - Request/Response オブジェクトの型確認 