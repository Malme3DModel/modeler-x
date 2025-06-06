# 動作確認済み設定

## 📦 package.json の opencascade.js
```json
"opencascade.js": "^0.1.15"
```

## 🔧 CascadeStudioMainWorker.js の importScripts
```javascript
importScripts(
  '../../node_modules/three/build/three.min.js',
  './CascadeStudioStandardLibrary.js',
  './CascadeStudioShapeToMesh.js',
  './libs/opencascade.wasm.v015.js');
```

## 🎯 locateFile 設定
```javascript
new opencascade({
  locateFile(path) {
    if (path.endsWith('.wasm')) {
      return "./libs/opencascade.wasm.wasm";
    }
    return path;
  }
})
```

## 📁 ファイル配置
```
public/js/CADWorker/libs/
├── opencascade.wasm.v015.js  ← 修正版（self.opencascade = opencascade;）
└── opencascade.wasm.wasm     ← v0.1.15のwasmファイル
```

## ✅ 動作確認済みログ
```
CAD Kernel loaded successfully!
```

## ❌ 現在のエラー
```
transformation.SetRotation is not a function
BRepMesh_IncrementalMesh signature mismatch
``` 