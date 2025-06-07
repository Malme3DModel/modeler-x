# Three.js r177 + OpenCascade.js v1.1.1 アップグレード指示書

## ⚠️ 重要: 段階的アプローチが必要

**実際の検証結果により、同時アップグレードは困難であることが判明しました。**
以下の段階的アプローチを強く推奨します。

## 発見された重大な問題

### 1. **Sphere関数の名前空間衝突**
- Three.js r177 と CascadeStudioStandardLibrary.js の両方で `Sphere` が定義
- WebWorkerで "Identifier 'Sphere' has already been declared" エラー

### 2. **OpenCascade.js WASM互換性問題**
- 現在のv0-modifiedファイルで "LinkError: WebAssembly.instantiate(): Import #832 "a" "a": memory import must be a WebAssembly.Memory object" エラー
- Three.js r177との互換性問題

### 3. **ESM vs importScripts問題**
- OpenCascade.js v1.1.1はESM exportを使用
- 現在のWebWorkerのimportScriptsと非互換

## 推奨される段階的アップグレード戦略

### 🎯 Phase 1: Three.js単独アップグレード（優先実施）

#### 1.1 WebWorkerからThree.jsを完全除去
```javascript
// public/js/CascadeStudioMainWorker.js
// Three.jsのimportScriptsを削除
// importScripts('./three/build/three.min.js'); // ← この行を削除

// Three.jsを使用している箇所を代替実装に変更
// 例: Vector3の代わりに独自の実装を使用
function createVector3(x, y, z) {
  return { x: x || 0, y: y || 0, z: z || 0 };
}
```

#### 1.2 メインアプリでのThree.js r177使用
```typescript
// src/components/ThreeViewport.tsx
import * as THREE from 'three'; // r177を使用

// WebWorkerとの通信では、Three.jsオブジェクトではなく
// プレーンなJavaScriptオブジェクトを使用
```

#### 1.3 名前空間衝突の解決
```javascript
// CascadeStudioStandardLibrary.js内で
// Sphereなどの関数名を明確に区別
function CAD_Sphere(radius) {
  // 既存のSphere実装
}

// または、名前空間オブジェクトを使用
const CADPrimitives = {
  Sphere: function(radius) { /* 実装 */ },
  Box: function(x, y, z) { /* 実装 */ },
  // ...
};
```

### 🎯 Phase 2: OpenCascade.js v1.1.1への移行（Phase 1完了後）

#### 2.1 WebWorkerのESM対応
```javascript
// public/js/CascadeStudioMainWorker.mjs（新規作成）
import { initOpenCascade } from 'opencascade.js';

let oc = null;

async function initializeOpenCascade() {
  try {
    oc = await initOpenCascade({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return '/js/libs/opencascade.wasm';
        }
        return path;
      }
    });
    
    console.log('OpenCascade.js v1.1.1 initialized successfully');
    postMessage({ type: "startupCallback" });
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js:', error);
    postMessage({ type: "error", payload: error.message });
  }
}

// 既存の関数をそのまま移植
// ... 既存のコード ...

// 初期化
initializeOpenCascade();
```

#### 2.2 Worker作成方法の更新
```typescript
// src/lib/CascadeStudioCore.ts
initWorker: () => {
  try {
    if ((window as any).cascadeStudioWorker) {
      (window as any).cascadeStudioWorker.terminate();
    }

    // ESM対応のWorkerを作成
    const workerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.mjs`;
    const worker = new Worker(workerUrl, { type: 'module' });

    // 既存のメッセージハンドラーをそのまま使用
    worker.onmessage = (e) => {
      if (core.messageHandlers[e.data.type]) {
        core.messageHandlers[e.data.type](e.data.payload);
      }
    };

    worker.onerror = (e) => {
      console.error("CAD Worker error:", e);
    };

    (window as any).cascadeStudioWorker = worker;
    (window as any).workerWorking = false;

    return worker;
  } catch (error) {
    console.error("Failed to initialize CAD Worker:", error);
    // フォールバック: 古いWorkerを使用
    return this.initLegacyWorker();
  }
}
```

## 即座に実施すべき修正

### 1. package.jsonの段階的更新
```json
{
  "dependencies": {
    "three": "^0.177.0",
    "opencascade.js": "^0.1.15",  // まずは現在のバージョンを維持
    "@types/three": "^0.177.0"
  }
}
```

### 2. WebWorkerの名前空間修正
```javascript
// public/js/CascadeStudioMainWorker.js
// Three.jsのimportを削除
// importScripts('./three/build/three.min.js'); // ← 削除

// Vector3の代替実装
function Vector3(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector3.prototype.set = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vector3.prototype.normalize = function() {
  const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  if (length > 0) {
    this.x /= length;
    this.y /= length;
    this.z /= length;
  }
  return this;
};

// 既存のコードでTHREE.Vector3を使用している箇所を
// 新しいVector3に置き換え
```

### 3. CascadeStudioStandardLibrary.jsの修正
```javascript
// 名前空間の明確化
function CAD_Sphere(radius) {
  // 既存のSphere実装をそのまま使用
  // ただし関数名をCAD_Sphereに変更
}

// エクスポート時に元の名前でエイリアス
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Sphere: CAD_Sphere,
    Box: CAD_Box,
    // ... 他の関数
  };
} else {
  // グローバル環境では元の名前で公開
  self.Sphere = CAD_Sphere;
  self.Box = CAD_Box;
  // ... 他の関数
}
```

## 動作確認手順（Phase 1）

### 1. Three.js r177のみでの確認
```bash
# 依存関係の更新
npm install three@^0.177.0 @types/three@^0.177.0

# 開発サーバーの起動
npm run dev
```

### 2. 基本機能テスト
```javascript
// エディタで以下のコードを実行
let testBox = Box(10, 10, 10);
let testSphere = Sphere(20);  // 名前空間衝突が解決されているか確認
let testCylinder = Cylinder(15, 30);

// 結合テスト
let combined = Union([testBox, testSphere, testCylinder]);
```

### 3. WebWorkerエラーの確認
- ブラウザの開発者ツールでConsoleエラーを確認
- "Identifier 'Sphere' has already been declared" エラーが解消されているか
- WebWorkerの初期化が正常に完了するか

## トラブルシューティング

### 問題1: 名前空間衝突が継続する場合
```javascript
// より積極的な名前空間分離
const CascadeCAD = {
  Sphere: function(radius) { /* 実装 */ },
  Box: function(x, y, z) { /* 実装 */ },
  // ...
};

// グローバルに公開
Object.assign(self, CascadeCAD);
```

### 問題2: WebWorkerでVector3エラーが発生する場合
```javascript
// より完全なVector3実装
function Vector3(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector3.prototype = {
  set: function(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    return this;
  },
  normalize: function() {
    const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (length > 0) {
      this.x /= length; this.y /= length; this.z /= length;
    }
    return this;
  },
  clone: function() {
    return new Vector3(this.x, this.y, this.z);
  },
  // 必要に応じて他のメソッドを追加
};

// THREE名前空間の代替
const THREE = {
  Vector3: Vector3,
  // 必要に応じて他のクラスを追加
};
```

### 問題3: OpenCascade.js初期化エラーが継続する場合
```javascript
// より堅牢な初期化
async function initializeOpenCascadeWithFallback() {
  try {
    // まず現在のv0.1.15で初期化を試行
    oc = await new opencascade({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return '/js/libs/opencascade.wasm.wasm';
        }
        return path;
      }
    });
    console.log('OpenCascade.js v0.1.15 initialized successfully');
    postMessage({ type: "startupCallback" });
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js:', error);
    postMessage({ type: "error", payload: error.message });
  }
}
```

## Phase 1完了後の確認項目

- [ ] Three.js r177が正常に動作
- [ ] WebWorkerの名前空間衝突が解決
- [ ] 基本的なCAD操作が正常に動作
- [ ] メッシュ生成とレンダリングが正常
- [ ] デフォルトコードが正常に実行される
- [ ] パフォーマンスの劣化がない

## Phase 2への移行判断基準

Phase 1が完全に安定してから、以下の条件が揃った場合のみPhase 2に進む：

1. **ブラウザ互換性**: ESM Worker対応ブラウザでの動作確認
2. **フォールバック実装**: 古いブラウザ向けの代替手段の準備
3. **十分なテスト**: Phase 1での十分な動作確認期間
4. **リスク評価**: OpenCascade.js v1.1.1移行のリスクとメリットの再評価

## 緊急時のロールバック手順

### Three.js r177で問題が発生した場合
```bash
# 元のバージョンに戻す
npm install three@^0.129.0 @types/three@^0.129.0

# WebWorkerのThree.js importを復元
# importScripts('./three/build/three.min.js'); // ← 復元
```

### 完全なロールバック
```bash
# package.jsonを元の状態に戻す
git checkout HEAD -- package.json
npm install

# 変更したファイルを元に戻す
git checkout HEAD -- public/js/CascadeStudioMainWorker.js
git checkout HEAD -- src/lib/CascadeStudioCore.ts
```

## 結論

**現在の推奨アクション**:
1. **即座にPhase 1を実施**: Three.js r177のみのアップグレード
2. **OpenCascade.js v1.1.1は保留**: Phase 1の安定化後に検討
3. **段階的検証**: 各段階での十分な動作確認
4. **フォールバック準備**: 問題発生時の迅速な復旧手順の確立

この段階的アプローチにより、リスクを最小化しながら確実なアップグレードが可能になります。

## 参考資料

- [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [OpenCascade.js Documentation](https://ocjs.org/)
- [WebWorker ESM Support](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)
- [WebAssembly Best Practices](https://developer.mozilla.org/en-US/docs/WebAssembly) 
- [Playwright Testing Documentation](https://playwright.dev/) 