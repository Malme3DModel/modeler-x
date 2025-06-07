# Three.js r177 + OpenCascade.js v1.1.1 アップグレード指示書

## 概要

現在のプロジェクトを以下のバージョンにアップグレードする必要があります：
- **Three.js**: v0.129.0 → r177
- **OpenCascade.js**: v0.1.15 → v1.1.1

主な課題は以下の3点です：
1. **WASMの呼び出し方法の変更**
2. **ESMへの対応**
3. **WebWorker内での新しいモジュール読み込み**

## 現在の構成分析

### WebWorkerの現在の構成
- メインファイル: `public/js/CascadeStudioMainWorker.js`
- 読み込み方法: `importScripts()`を使用
- WASM初期化: 古いv0.1.15の方法を使用

### Three.jsの現在の使用状況
- メインアプリ: ESMインポート (`import * as THREE from 'three'`)
- WebWorker: グローバル変数として使用 (`importScripts('./three/build/three.min.js')`)

### OpenCascade.jsの現在の使用状況
- WebWorker内で`new opencascade()`で初期化
- WASMファイル: `public/js/libs/opencascade.wasm.wasm` (33MB)

## アップグレード手順

### Phase 1: 依存関係の更新

#### 1.1 package.jsonの更新
```json
{
  "dependencies": {
    "three": "^0.177.0",
    "opencascade.js": "^1.1.1",
    "@types/three": "^0.177.0"
  }
}
```

#### 1.2 新しいファイル構成の準備
```
public/js/
├── CascadeStudioMainWorker.mjs  # ESM対応の新しいWorker（現在の場所に配置）
├── libs/
│   ├── opencascade.wasm            # 新しいWASMファイル
│   └── opencascade.mjs             # 新しいESMモジュール
└── three/
    └── (削除予定 - npmから直接使用)
```

### Phase 2: WebWorkerのESM対応

#### 2.1 新しいWorkerファイルの作成
`public/js/CascadeStudioMainWorker.mjs`を作成：

```javascript
// ESMインポートに変更
import * as THREE from 'three';
import { initOpenCascade } from 'opencascade.js';

// グローバル変数の定義
let oc = null;
let externalShapes = {};
let sceneShapes = [];
let GUIState, fullShapeEdgeHashes = {}, fullShapeFaceHashes = {};
let currentShape;

// OpenCascade.js v1.1.1の新しい初期化方法
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

// フォント読み込み（既存のコードを維持）
async function loadFonts() {
  // 既存のフォント読み込みロジックをそのまま使用
}

// メッセージハンドラー
const messageHandlers = {
  Evaluate: function(payload) {
    // 既存のEvaluate関数をそのまま使用
  },
  
  combineAndRenderShapes: function(payload) {
    // 既存のcombineAndRenderShapes関数をそのまま使用
  }
};

// 初期化
initializeOpenCascade().then(() => {
  loadFonts();
  
  // メッセージリスナーの設定
  onmessage = function(e) {
    const response = messageHandlers[e.data.type]?.(e.data.payload);
    if (response) {
      postMessage({ type: e.data.type, payload: response });
    }
  };
});
```

#### 2.2 Workerの作成方法を変更
`src/lib/CascadeStudioCore.ts`を更新：

```typescript
initWorker: () => {
  try {
    // 既存のWorkerを削除
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
    return null;
  }
}
```

### Phase 3: Three.js r177への対応

#### 3.1 Three.jsの変更点への対応
Three.js r177での主な変更点：
- `ColorManagement.fromWorkingColorSpace()` → `workingToColorSpace()`
- `ColorManagement.toWorkingColorSpace()` → `colorSpaceToWorking()`
- JSONシーンフォーマットのバージョンが4.6から4.7に増加
- `PeppersGhostEffect`が削除

#### 3.2 ThreeViewport.tsxの更新
必要に応じて新しいAPIに対応：

```typescript
// 色空間管理の更新（必要な場合）
import { ColorManagement } from 'three';

// 既存のコードで非推奨APIを使用している場合は更新
// 例: ColorManagement.fromWorkingColorSpace() → workingToColorSpace()
```

### Phase 4: OpenCascade.js v1.1.1への対応

#### 4.1 新しいWASMファイルの配置
1. `node_modules/opencascade.js/dist/`から新しいファイルをコピー
2. `public/js/libs/`に配置

#### 4.2 API互換性の確認
既存のOpenCascade APIの使用箇所を確認：
- `oc.BRepPrimAPI_MakeBox`
- `oc.BRepMesh_IncrementalMesh`
- `oc.TopoDS_Shape`
- その他のOCCT API

**重要**: v1.1.1では初期化方法が変更されていますが、初期化後のAPI使用方法は基本的に互換性が保たれています。

#### 4.3 型定義の更新
TypeScript定義ファイルが更新されている場合は対応

### Phase 5: デフォルトコードの更新

#### 5.1 src/constants/defaultCode.tsの修正
`DEFAULT_CAD_CODE`を新しいAPIに対応させる：

```typescript
export const DEFAULT_CAD_CODE = `// Welcome to Modeler X! Here are some useful functions:
//  Translate(), Rotate(), Scale(), Mirror(), Union(), Difference(), Intersection()
//  Box(), Sphere(), Cylinder(), Cone(), Text3D(), Polygon()
//  Offset(), Extrude(), RotatedExtrude(), Revolve(), Pipe(), Loft(), 
//  FilletEdges(), ChamferEdges(),
//  Slider(), Checkbox(), TextInput(), Dropdown()

let holeRadius = Slider("Radius", 30 , 20 , 40);

let sphere     = Sphere(50);
let cylinderZ  =                     Cylinder(holeRadius, 200, true);
let cylinderY  = Rotate([0,1,0], 90, Cylinder(holeRadius, 200, true));
let cylinderX  = Rotate([1,0,0], 90, Cylinder(holeRadius, 200, true));

Translate([0, 0, 50], Difference(sphere, [cylinderX, cylinderY, cylinderZ]));

Translate([-25, 0, 40], Text3D("Hi!", 36, 0.15, 'Consolas'));

// Don't forget to push imported or oc-defined shapes into sceneShapes to add them to the workspace!`;
```

**注意**: 現在のデフォルトコードは基本的にそのまま使用できますが、新しいバージョンでの動作確認が必要です。

### Phase 6: 既存機能の互換性確保

#### 6.1 CascadeStudioShapeToMesh.jsの更新
WebWorker内でTHREEオブジェクトを使用している箇所を確認：

```javascript
// 既存のコード
let point1 = new THREE.Vector3();

// ESM環境では適切にインポートされたTHREEを使用
```

#### 6.2 CascadeStudioStandardLibrary.jsの更新
必要に応じてESM対応

#### 6.3 CascadeStudioFileUtils.jsの更新
ファイル読み込み機能の互換性確認

### Phase 7: 動作確認とテスト

#### 7.1 基本機能のテスト手順

**開発環境での確認**:
```bash
# 開発サーバーの起動
npm run dev

# または Turbopack使用
npm run dev:turbo
```

**テスト項目**:
- [ ] WebWorkerの初期化
- [ ] OpenCascade.jsの読み込み
- [ ] Three.jsの読み込み
- [ ] 基本的な形状生成（Box, Sphere等）
- [ ] メッシュ生成とレンダリング
- [ ] デフォルトコードの実行

**基本形状テストコード**:
```javascript
// エディタで以下のコードを実行して動作確認
let testBox = Box(10, 10, 10);
let testSphere = Sphere(20);
let testCylinder = Cylinder(15, 30);

// 結合テスト
let combined = Union([testBox, testSphere, testCylinder]);
```

#### 7.2 高度な機能のテスト
- [ ] ファイルインポート/エクスポート
- [ ] 複雑な形状操作
- [ ] アニメーション
- [ ] マテリアル設定
- [ ] GUI コントロール（Slider, Checkbox等）

#### 7.3 自動テストの実行
既存のPlaywrightテストを使用：

```bash
# v0ディレクトリでのテスト実行
cd v0/test
python server.py  # バックグラウンドで実行
npx folio
```

#### 7.4 パフォーマンステスト
- [ ] 読み込み時間の比較
- [ ] メモリ使用量の確認
- [ ] レンダリング性能の確認
- [ ] WebWorker通信の遅延測定

#### 7.5 ブラウザ互換性テスト
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)

**WebWorker ESMサポート確認**:
```javascript
// ブラウザコンソールで実行
if (typeof Worker !== 'undefined') {
  try {
    const testWorker = new Worker('data:text/javascript,console.log("ESM test")', { type: 'module' });
    console.log('ESM Worker support: YES');
    testWorker.terminate();
  } catch (e) {
    console.log('ESM Worker support: NO');
  }
}
```

## 注意事項とトラブルシューティング

### 1. WebWorkerでのESMサポート
- モダンブラウザでのみサポート
- `type: 'module'`オプションが必要
- 古いブラウザでは代替手段が必要

### 2. WASMファイルサイズ
- OpenCascade.js v1.1.1のWASMファイルサイズを確認
- 必要に応じてカスタムビルドを検討

### 3. 型定義の問題
- TypeScriptエラーが発生した場合は型定義を確認
- 必要に応じて`@types/three`を更新

### 4. パフォーマンスの問題
- 新しいバージョンでパフォーマンスが低下した場合は設定を見直し
- WebAssemblyの最適化オプションを確認

### 5. 既存コードの互換性
- DEFAULT_CAD_CODEで使用されている関数の動作確認
- 特にBox(), Sphere(), Cylinder(), Text3D()等の基本関数

## 段階的移行戦略

### 推奨アプローチ
1. **開発環境での検証**: まず開発環境で新しいバージョンをテスト
2. **Three.js単独アップグレード**: まずThree.jsのみをr177に更新
3. **OpenCascade.js単独アップグレード**: 次にOpenCascade.jsをv1.1.1に更新
4. **統合テスト**: 両方のアップグレード後の統合テスト
5. **段階的デプロイ**: 問題がないことを確認してから本番環境に適用

### フォールバック計画
- 問題が発生した場合は既存のバージョンに戻せるよう準備
- 重要な機能が動作しない場合は部分的なアップグレードを検討

## 完了チェックリスト

### Phase 1: 準備
- [ ] package.jsonの更新
- [ ] 新しいWASMファイルの配置
- [ ] 依存関係のインストール確認

### Phase 2: WebWorker更新
- [ ] 新しいWorkerファイルの作成
- [ ] Worker初期化コードの更新
- [ ] ESM対応の確認

### Phase 3: Three.js対応
- [ ] Three.js r177対応
- [ ] 非推奨APIの更新
- [ ] 型定義の確認

### Phase 4: OpenCascade.js対応
- [ ] OpenCascade.js v1.1.1対応
- [ ] 初期化方法の更新
- [ ] API互換性の確認

### Phase 5: コード更新
- [ ] DEFAULT_CAD_CODEの動作確認
- [ ] 既存ライブラリファイルの更新

### Phase 6: テスト
- [ ] 基本機能の動作確認
- [ ] 高度な機能のテスト
- [ ] パフォーマンステスト
- [ ] ブラウザ互換性テスト
- [ ] 自動テストの実行

### Phase 7: 最終確認
- [ ] ドキュメントの更新
- [ ] 本番環境での動作確認
- [ ] ユーザー受け入れテスト

## 参考資料

- [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- [OpenCascade.js Documentation](https://ocjs.org/)
- [WebWorker ESM Support](https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker)
- [WebAssembly Best Practices](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [Playwright Testing Documentation](https://playwright.dev/) 