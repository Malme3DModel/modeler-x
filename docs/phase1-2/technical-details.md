# 技術的詳細とトラブルシューティング

## 🔧 主要な技術的解決策

### 1. OpenCascade.js ES6モジュール問題の解決

#### 問題
- `opencascade.js`がES6モジュール形式（`export default opencascade;`）
- Web WorkerではES6モジュールを直接`importScripts()`できない

#### 解決方法
```bash
# 修正版opencascade.jsの作成
Get-Content "node_modules/opencascade.js/dist/opencascade.wasm.js" | 
ForEach-Object { $_ -replace "export default opencascade;", "// export removed for Web Worker compatibility" } | 
Set-Content -Path "public/js/CADWorker/libs/opencascade.wasm.js"

# WASMファイルのコピー
Copy-Item "node_modules/opencascade.js/dist/opencascade.wasm.wasm" -Destination "public/js/CADWorker/libs/"
```

### 2. Web Worker内でのライブラリ読み込み

#### CascadeStudioMainWorker.js の構造
```javascript
// 必要なライブラリの読み込み
importScripts(
  '/node_modules/three.min.js',
  './CascadeStudioStandardLibrary.js',
  './CascadeStudioShapeToMesh.js',
  '/node_modules/opentype.js/dist/opentype.min.js',
  './libs/opencascade.wasm.js'  // 修正版を使用
);

// OpenCascadeの初期化
new self.opencascade({
  locateFile(path) {
    if (path.endsWith('.wasm')) {
      return "./libs/opencascade.wasm.wasm";
    }
    return path;
  }
})
```

### 3. React コンポーネント間の連携

#### CADWorkerManager → ThreeViewport → MonacoEditor
```typescript
// CADWorkerManager: ワーカーの管理とメッセージ処理
// ThreeViewport: 3D表示とメッシュレンダリング
// MonacoEditor: コード編集とワーカーへの評価要求
```

## 📁 ファイル配置の重要性

### publicフォルダ内の必須ファイル
```
public/
├── js/CADWorker/
│   ├── libs/
│   │   ├── opencascade.wasm.js      # 修正版（ES6 export削除）
│   │   └── opencascade.wasm.wasm    # WASMバイナリ
│   ├── CascadeStudioMainWorker.js   # メインワーカー
│   ├── CascadeStudioStandardLibrary.js
│   ├── CascadeStudioShapeToMesh.js
│   └── CascadeStudioFileUtils.js
├── fonts/
│   ├── Roboto.ttf
│   ├── Papyrus.ttf
│   └── Consolas.ttf
└── node_modules/
    ├── three.min.js
    └── opentype.js/dist/opentype.min.js
```

## 🔍 デバッグ方法

### 1. ブラウザ開発者ツール
```javascript
// コンソールでCADワーカーの状態確認
console.log(window.cadWorker);
console.log(window.workerWorking);
```

### 2. ワーカーのログ確認
```javascript
// CADWorkerManager.tsx内でログを確認
onLog: (message) => {
  console.log('Worker Log:', message);
}
```

### 3. Three.jsシーンの確認
```javascript
// ThreeViewport.tsx内でシーンの内容確認
console.log('Scene children:', scene.children);
```

## ⚠️ 既知の問題と対処法

### 1. potpack ES6モジュール問題
- **問題**: potpackもES6モジュール形式
- **対処**: CascadeStudioShapeToMesh.js内に簡易実装が含まれているため、importを削除

### 2. ファイルパス問題
- **問題**: Web Workerから相対パスでnode_modulesにアクセスできない
- **対処**: 必要ファイルをpublicフォルダにコピー

### 3. CORS問題
- **問題**: ローカルファイルアクセス時のCORS制限
- **対処**: Next.js開発サーバー使用により解決

## 🚀 パフォーマンス最適化

### 1. ワーカーの初期化
- OpenCascade.jsの読み込みは非同期で実行
- 初期化完了まで「Loading CAD Kernel...」表示

### 2. メッシュ生成の最適化
- `maxDeviation`パラメータで品質調整可能
- デフォルト値: 0.1

### 3. Three.jsレンダリング
- OrbitControlsによる効率的なカメラ制御
- ResizeObserverによる自動リサイズ対応

## 🔄 v0との主な違い

### アーキテクチャ
- **v0**: HTML + jQuery + Golden Layout
- **Next.js**: React + TypeScript + dockview

### ワーカー管理
- **v0**: グローバル変数での管理
- **Next.js**: React ContextとuseRefでの管理

### UI構造
- **v0**: Golden Layoutによる分割
- **Next.js**: dockviewによるモダンなレイアウト

## 📝 開発時の注意点

1. **ワーカーファイルの変更**: publicフォルダ内のファイル変更時は開発サーバーの再起動が必要
2. **TypeScript型定義**: Monaco Editorの型定義は動的に追加
3. **メモリ管理**: OpenCascade.jsオブジェクトの適切な削除が重要 