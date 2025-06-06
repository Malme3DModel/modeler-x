# 次の作業者向け - 具体的な作業手順

## 🎯 優先度の高い作業

### 1. コード評価機能の完全動作確認 (最優先)

#### 現在の状況
- CADカーネルは正常に読み込まれている（「CAD Kernel Ready」表示）
- Monaco Editorにデフォルトコードが表示されている
- Three.jsビューポートにワイヤーフレームが表示されている

#### 確認すべき点
```javascript
// ブラウザのコンソールで以下を実行して確認
console.log('CAD Worker:', window.cadWorker);
console.log('Worker Working:', window.workerWorking);

// F5またはCtrl+Enterを押した後のログを確認
// 期待される動作: コード評価 → メッシュ生成 → 3D表示更新
```

#### デバッグ手順
1. **ブラウザ開発者ツールを開く**
2. **F5キーを押してコード評価を実行**
3. **コンソールログとエラーを確認**
4. **Network タブでワーカーファイルの読み込み状況を確認**

### 2. メッシュ表示の実装確認

#### 期待される結果
v0と同じ複雑な3D形状（球体から3つの円柱を差し引いた形状 + テキスト）が表示されるべき

#### 確認ポイント
```typescript
// ThreeViewport.tsx の updateScene メソッドが呼ばれているか
// CADWorkerManager.tsx の onShapeUpdate が正しく動作しているか
```

## 🔧 具体的なデバッグ手順

### Step 1: ワーカーの動作確認
```javascript
// ブラウザコンソールで実行
if (window.cadWorker) {
  console.log('CAD Worker is available');
  // 手動でコード評価を実行
  window.cadWorker.evaluateCode(`
    let sphere = Sphere(50);
    console.log('Sphere created:', sphere);
  `, {});
} else {
  console.log('CAD Worker is not available');
}
```

### Step 2: メッセージフローの確認
1. **CADWorkerManager.tsx** の `onmessage` ハンドラーにログを追加
2. **ThreeViewport.tsx** の `updateScene` メソッドにログを追加
3. **MonacoEditor.tsx** の `evaluateCode` 関数にログを追加

### Step 3: エラーハンドリングの強化
```typescript
// CADWorkerManager.tsx に追加
workerRef.current.onerror = (error) => {
  console.error('Worker Error Details:', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno,
    colno: error.colno
  });
};
```

## 📝 修正が必要な可能性がある箇所

### 1. MonacoEditor.tsx の evaluateCode 関数
```typescript
// 現在の実装を確認し、以下の点をチェック
// - window.cadWorker が正しく参照されているか
// - GUIState が正しく渡されているか
// - エラーハンドリングが適切か
```

### 2. ThreeViewport.tsx の updateScene メソッド
```typescript
// メッシュデータの受信と表示処理を確認
// - facesAndEdges データの構造が正しいか
// - Three.js オブジェクトの作成が正しいか
// - シーンへの追加が正しく行われているか
```

### 3. CADWorkerManager.tsx のメッセージハンドリング
```typescript
// ワーカーからのメッセージ処理を確認
// - combineAndRenderShapes メッセージの処理
// - onShapeUpdate コールバックの実行
// - エラーメッセージの適切な処理
```

## 🚀 実装すべき機能

### 1. プログレス表示の改善
```typescript
// 現在「Loading CAD Kernel...」が残っている
// CADカーネル読み込み完了後は非表示にする
// コード評価中は「Evaluating...」などの表示
```

### 2. エラー表示の改善
```typescript
// Monaco Editor でのエラーハイライト
// コンソールでの詳細なエラー情報表示
```

### 3. デフォルトコードの自動評価
```typescript
// アプリ起動時にデフォルトコードを自動評価
// v0と同じ初期表示を実現
```

## 🔍 テスト手順

### 1. 基本機能テスト
1. アプリケーション起動
2. CADカーネル読み込み完了確認
3. F5キーでコード評価実行
4. 3D形状の表示確認

### 2. 個別機能テスト
```javascript
// 各CAD関数の動作確認
let sphere = Sphere(50);           // 球体
let box = Box(100, 100, 100);      // 直方体
let cylinder = Cylinder(30, 100);   // 円柱
let difference = Difference(sphere, cylinder); // ブール演算
```

### 3. UI機能テスト
- Monaco Editor のシンタックスハイライト
- Three.js ビューポートのマウス操作
- コンソールのログ表示
- メニューボタンの動作

## 📞 サポート情報

### 重要なファイル
- `src/app/components/CADWorkerManager.tsx` - ワーカー管理
- `src/app/components/ThreeViewport.tsx` - 3D表示
- `src/app/components/MonacoEditor.tsx` - コードエディター
- `public/js/CADWorker/CascadeStudioMainWorker.js` - メインワーカー

### 参考になるv0ファイル
- `v0/js/MainPage/CascadeMain.js` - 元の実装
- `v0/js/CADWorker/CascadeStudioMainWorker.js` - 元のワーカー

### 開発サーバー
```bash
npm run dev
# http://localhost:3000 でアクセス
```

## ✅ 完了の判定基準

1. **F5またはCtrl+Enterでコード評価が実行される**
2. **v0と同じ複雑な3D形状が表示される**
3. **コンソールにエラーが表示されない**
4. **「Loading CAD Kernel...」が適切に非表示になる**
5. **Three.jsビューポートでマウス操作が正常に動作する**

これらが全て達成されれば、基本的な移植作業は完了です。 