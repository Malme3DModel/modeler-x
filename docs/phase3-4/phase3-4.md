# Phase 3-4 引継ぎドキュメント

## 🎯 プロジェクト概要

### 📋 プロジェクトの目的
**フォルダ`v0`にある既存のCADアプリケーションを、最新技術スタック（Next.js 15、TypeScript、React 19、dockview）に移植する**

### 🏆 最終目標
**Monaco EditorでCADコードを書いてF5キーを押すと、OpenCascade.jsで3D形状が生成され、Three.jsビューポートにリアルタイムで表示される機能を完全に動作させる**

## ✅ Phase 3で達成したこと

### 1. 🔧 OpenCascade.js v0.1.15のセットアップ完了
- **WebAssemblyメモリーエラー解決**: `LinkError: WebAssembly.instantiate(): Import #832 "a" "a": memory import must be a WebAssembly.Memory object`
- **正しいバージョンの使用**: v1.1.1から v0.1.15にダウングレード
- **wasmファイルの整合性確保**: JavaScriptファイルとwasmファイルのバージョン一致

### 2. 📦 ES6モジュール問題の解決
- **修正版ファイル作成**: `public/js/CADWorker/libs/opencascade.wasm.v015.js`
- **Web Worker互換性**: ES6エクスポートを従来形式に変換
  ```javascript
  // 変更前: export default opencascade;
  // 変更後: self.opencascade = opencascade;
  ```

### 3. 🚀 CADカーネルの初期化成功
- **「CAD Kernel loaded successfully!」** メッセージ確認
- **UI表示**: 「• CAD Kernel Ready」ステータス表示
- **基本構造完成**: Monaco Editor、Three.js Viewport、Console、dockview

### 4. 🔄 ワーカー通信の確立
- **CADWorkerManager**: メインスレッドとワーカー間の通信確立
- **基本的なメッセージハンドリング**: エラーログとコンソール出力

## 🚨 現在の課題

### 1. 優先度1: API互換性問題
**エラー**: `transformation.SetRotation is not a function`
- **場所**: `CascadeStudioStandardLibrary.js:384:22`
- **原因**: v0.1.15とv1.1.1間でのAPI変更
- **影響**: Rotate関数が使用できない

### 2. 優先度2: ShapeToMesh互換性問題
**エラー**: `null function or function signature mismatch`
- **場所**: `CascadeStudioShapeToMesh.js:227:9`
- **原因**: `BRepMesh_IncrementalMesh`のシグネチャ変更
- **影響**: 3D形状のメッシュ生成ができない

### 3. 優先度3: Null Shape問題
**エラー**: `Null Shape detected in sceneShapes`
- **原因**: 上記API問題により形状生成が失敗
- **影響**: 3Dビューポートに何も表示されない

## 📋 重要なファイル構成

### 修正済みファイル
```
public/js/CADWorker/
├── libs/
│   ├── opencascade.wasm.v015.js     ← 修正版（ES6→従来形式）
│   └── opencascade.wasm.wasm        ← v0.1.15対応版
├── CascadeStudioMainWorker.js       ← ワーカーメイン
├── CascadeStudioStandardLibrary.js  ← API関数群（要修正）
└── CascadeStudioShapeToMesh.js      ← メッシュ化（要修正）
```

### 参考ファイル（動作版）
```
v0/js/CADWorker/
├── CascadeStudioMainWorker.js       ← 動作する参考版
├── CascadeStudioStandardLibrary.js  ← 動作するAPI関数群
└── CascadeStudioShapeToMesh.js      ← 動作するメッシュ化
```

## 🛠️ 次の作業者への具体的な指示

### 🎯 ステップ1: API互換性の修正

#### 1.1 Rotate関数の修正
**ファイル**: `public/js/CADWorker/CascadeStudioStandardLibrary.js`
**行数**: 384付近

**現在のエラー箇所**:
```javascript
transformation.SetRotation(
  new oc.gp_Ax1(new oc.gp_Pnt(0, 0, 0), new oc.gp_Dir(
    new oc.gp_Vec(axis[0], axis[1], axis[2]))), degrees * 0.0174533);
```

**調査方法**:
1. v0.1.15のドキュメントで`gp_Trsf.SetRotation`のAPIを確認
2. 可能性のある代替API: `SetRotation2`、`SetRotate`、など
3. v0ファイルとの詳細比較

#### 1.2 オンラインリソース
- **OpenCascade.js v0.1.15 GitHub**: https://github.com/donalffons/opencascade.js/tree/0.1.15
- **API Documentation**: EmscriptenのAPIバインディング確認

### 🎯 ステップ2: ShapeToMesh関数の修正

**ファイル**: `public/js/CADWorker/CascadeStudioShapeToMesh.js`
**行数**: 22-30付近

**現在のエラー箇所**:
```javascript
let mesh = new oc.BRepMesh_IncrementalMesh(shape, ...);
```

**調査方法**:
1. v0.1.15での`BRepMesh_IncrementalMesh`コンストラクタ引数確認
2. v0ファイルとの引数比較
3. tolerance、angular deflection等のパラメータ確認

### 🎯 ステップ3: 段階的テスト

#### 3.1 最小テストケース
```javascript
// 最初にこれをテスト
let sphere = Sphere(50);
// Rotate使わずにTranslateのみ
Translate([0, 0, 50], sphere);
```

#### 3.2 API確認方法
```javascript
// ワーカー内でAPI確認
console.log("oc methods:", Object.getOwnPropertyNames(oc.gp_Trsf.prototype));
```

## 🔍 デバッグ手順

### 1. ワーカーコンソールアクセス
```javascript
// ブラウザ開発者ツール > Application > Service Workers
// または Console直接確認
```

### 2. v0.1.15 API探索
```javascript
// ワーカー内で利用可能なメソッド確認
for (let prop in oc.gp_Trsf.prototype) {
  if (prop.includes('Rotat')) {
    console.log('Rotation method:', prop);
  }
}
```

### 3. 段階的修正
1. **Rotate関数無効化** → 基本形状の動作確認
2. **Rotate API修正** → 回転機能復活
3. **ShapeToMesh修正** → 完全動作

## 📊 現在の技術状況

### ✅ 動作確認済み
- Next.js 15アプリケーション起動
- OpenCascade.js v0.1.15初期化
- CADワーカー通信
- Monaco Editor
- Three.js Viewport
- dockview UI

### ⚠️ 部分的動作
- F5キーでのコード評価（エラーで停止）
- 基本形状生成（APIエラー）

### ❌ 未動作
- Rotate関数
- 3D形状の表示
- メッシュ生成

## 🚀 期待される完了状態

### 完了の判定基準
1. ✅ **エラーなしでF5評価**: コンソールにエラーが出ない
2. ✅ **3D形状表示**: Three.jsビューポートに形状が表示される
3. ✅ **Rotate関数動作**: `Rotate([1,0,0], 90, shape)`が正常動作
4. ✅ **複雑な形状生成**: Union、Difference等の応用操作

### 最終テストコード
```javascript
// これが完全動作すれば成功
let sphere = Sphere(50);
let box = Box(30, 30, 30);
let rotatedBox = Rotate([0,0,1], 45, box);

let result = Union([sphere, rotatedBox]);
Translate([0, 0, 50], result);
```

## 💡 追加のヒント

### v0.1.15の特性
- **古いEmscripten**: モダンなPromise APIが制限されている
- **メソッド名の違い**: `SetRotation` → `SetRotation2`等の可能性
- **パラメータ順序**: 引数の順序が異なる可能性

### トラブルシューティング
- **API探索**: `console.log(Object.getOwnPropertyNames(obj))`
- **型確認**: `console.log(typeof method)`
- **v0比較**: 同じ操作のv0での実装を詳細確認

## 📚 関連ドキュメント
- `docs/phase2-3/phase2-3.md` - 前フェーズの詳細
- `docs/migration-status.md` - 全体的な移植状況
- `README.md` - プロジェクト概要

## 🎯 成功への道筋
**Phase 3でOpenCascadeの初期化は完全に成功しました。残るはv0.1.15のAPI仕様に合わせた関数修正のみです。基本構造は完成しており、API修正により必ず動作します！**

頑張ってください！🚀 