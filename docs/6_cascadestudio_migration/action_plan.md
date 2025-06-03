# CascadeStudio完全コピー実行計画 - Playwright MCP活用版

## 🎊 **重要更新**: フェーズ6実装完了！（2025年6月8日）

### ✅ **達成済み項目**
- ✅ **Golden Layout 2.6.0基盤統合**: 100%完了
- ✅ **CascadeStudio風レイアウト構成**: 100%完了  
- ✅ **3パネル構成**: 左（Monaco Editor）+ 右上（CAD View）+ 右下（Console）
- ✅ **フローティングGUI配置**: 完了
- ✅ **Embedding via Events実装**: V2 API対応完了
- ✅ **STARTER_CODE表示**: CascadeStudio互換
- ✅ **Monaco Editor統合**: F5キー、Ctrl+Sキーバインド実装
- ✅ **Monaco Editorワーカー設定**: WebWorkerエラー解決
- ✅ **URL状態管理システム**: コードとGUI状態をURLハッシュに保存・復元
- ✅ **Tweakpane GUI完全統合**: Tweakpane 4.0.1対応完了
- ✅ **Playwright自動テスト**: 機能テストと比較テスト実装

### 🏗️ **進行中の項目**
- 🔄 **3Dビューポート機能拡張**: カメラコントロール、視点プリセット
- 🔄 **トップナビゲーション実装**: ファイル操作、エクスポート機能

**🌐 アクセス先**: `http://localhost:3000/cascade-studio`

### 🚨 **新発見ナレッジ**

#### **Tweakpane 4.0.1の対応方法**

Tweakpane 4.0.1では、APIの一部が変更されています。特に重要な点は以下の通りです：

- `addInput`メソッドが`addBinding`に変更されました
- GUIコントロールの追加方法が以下のように変更されています：

```typescript
// 従来のTweakpane
pane.addInput(guiState, 'propertyName', options);

// Tweakpane 4.0.1
pane.addBinding(guiState, 'propertyName', options);
```

この変更に対応するために、`TweakpaneGUI.tsx`と`CascadeGUIHandlers.ts`を更新しました。

#### **Monaco EditorのWebWorkerの設定方法**

Monaco Editorを正しく動作させるには、専用のWebWorkerを設定する必要があります。これは特に次のエラーを解決するために重要です：

```
Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes.
You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker
```

#### 解決方法：

1. **MonacoEnvironmentの設定**:
```typescript
// Monaco Editorのワーカー設定
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function(_moduleId: string, label: string) {
      if (label === 'typescript' || label === 'javascript') {
        return '/monaco-editor-workers/ts.worker.js';
      }
      return '/monaco-editor-workers/editor.worker.js';
    }
  };
}
```

2. **ワーカーファイルの作成**:
```javascript
// editor.worker.js
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
};

importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/vs/base/worker/workerMain.js');
```

```javascript
// ts.worker.js
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
};

importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/vs/language/typescript/tsWorker.js');
```

#### **URL状態管理とBase64エンコーディング**
URLハッシュを使用してコードとGUI状態を保存・復元する機能が実装されました。この実装では、JSON形式のデータをUTF-8対応のBase64エンコーディングで変換し、URLハッシュとして保存しています。

```typescript
// URLStateManager - 状態管理の核心部分
static saveStateToURL(state: URLState): void {
  // JSON文字列化してBase64エンコード
  const json = JSON.stringify(state);
  const encoded = this.encodeToBase64(json);
  
  // URLハッシュを更新
  window.location.hash = encoded;
}
```

---

## 🎯 今後の優先タスク

### 1. トップナビゲーション実装（2日）
- CascadeStudio風のトップナビゲーションバーを実装
- ファイル操作メニュー（新規作成、保存、ロード）の追加
- エクスポート機能（STEP, STL）の統合

### 2. 3Dビューポート機能拡張（3日）
- カメラコントロールの改善（ズーム、パン、回転）
- 視点プリセット（フロント、トップ、サイド、アイソメトリック）
- 表示設定（ワイヤーフレーム、シェーディングモード）

### 3. 最終機能統合とテスト（2日）
- エラーハンドリングの強化
- パフォーマンス最適化
- Playwrightテストの拡充

### 4. ドキュメント整備（1日）
- API仕様書作成
- 使い方ガイド作成
- デモ例の追加

## 🚀 Playwright MCPによる次の検証ステップ

### 1. ユーザーインタラクションテスト
```typescript
test('エディターでコードを編集してモデルが更新される', async ({ page }) => {
  // ページへ遷移
  await page.goto('http://localhost:3000/cascade-studio');
  
  // レイアウトが読み込まれるまで待機
  await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
  
  // エディターのテキストを編集
  const editorElement = await page.locator('.monaco-editor');
  await editorElement.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  
  // テストコードを入力
  const testCode = `
    let box = Box(10, 20, 30);
    Translate([0, 0, 0], box);
  `;
  await page.keyboard.type(testCode);
  
  // F5キーを押して評価
  await page.keyboard.press('F5');
  
  // 3Dビューポートが更新されるのを待機
  await page.waitForTimeout(2000);
  
  // スクリーンショットを撮影
  await page.screenshot({ path: 'test-results/box-model.png' });
});
```

### 2. GUI操作テスト
```typescript
test('Tweakpane GUIでモデルのパラメータを変更できる', async ({ page }) => {
  // ページへ遷移
  await page.goto('http://localhost:3000/cascade-studio');
  
  // レイアウトが読み込まれるまで待機
  await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
  
  // エディターにSliderを使うコードを入力
  const sliderCode = `
    let radius = Slider("Radius", 30, 10, 50);
    let sphere = Sphere(radius);
  `;
  
  // コードを入力して評価
  const editorElement = await page.locator('.monaco-editor');
  await editorElement.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type(sliderCode);
  await page.keyboard.press('F5');
  
  // Tweakpaneに動的スライダーが表示されるのを待機
  await page.waitForSelector('div:has-text("Radius")', { timeout: 5000 });
  
  // スライダーの値を変更
  const slider = await page.locator('.tp-sldv_i');
  await slider.click();
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  
  // 3Dビューポートが更新されるのを待機
  await page.waitForTimeout(2000);
  
  // スクリーンショットを撮影
  await page.screenshot({ path: 'test-results/slider-modified.png' });
});
```

---

## 🎉 完成予定

**完全コピー完成予定日**: 2025年6月15日

実装完了後、Playwrightによる自動テストを実行し、CascadeStudioとの互換性と機能を検証します。完成後はNext.js版CascadeStudioとして公開し、元のCascadeStudioからのスムーズな移行パスを提供します。

## 🎯 **フェーズ7計画: 3Dビューポートとワーカー統合**

### Day 1-2: React Three Fiber連携
**目標**: 3DビューポートをReact Three Fiberで実装

#### 🎯 3Dビューポートコンポーネント作成（3-4時間）
```typescript
// components/threejs/CascadeViewport.tsx
'use client';

import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';

export default function CascadeViewport({ 
  shapes, 
  viewSettings
}: CascadeViewportProps) {
  return (
    <Canvas shadows camera={{ position: [100, 100, 100], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      
      {/* CADシェイプを表示 */}
      {shapes.map((shape, i) => (
        <CascadeShape key={i} shape={shape} />
      ))}
      
      {/* 環境設定 */}
      {viewSettings.grid && <Grid infiniteGrid />}
      {viewSettings.groundPlane && <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[1000, 1000]} />
        <shadowMaterial opacity={0.4} />
      </mesh>}
      
      <OrbitControls />
      <Environment preset="sunset" />
    </Canvas>
  );
}
```

### Day 3-4: ワーカーメッセージング完全実装
**目標**: WebWorkerのメッセージングシステム完成

#### 🎯 CADワーカーハンドラー（3-4時間）
```typescript
// lib/cad/cadWorkerManager.ts
export class CADWorkerManager {
  private worker: Worker | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  constructor() {
    // ワーカー初期化
    this.worker = new Worker('/workers/cadWorker.js');
    
    // メッセージ受信ハンドラー
    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(data);
      }
    };
  }
  
  // メッセージ送信
  sendMessage(type: string, payload: any) {
    if (!this.worker) return;
    
    this.worker.postMessage({
      type,
      data: payload
    });
  }
  
  // ハンドラー登録
  registerHandler(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }
}
```

---

## 📊 **完了予想時期**

| フェーズ | 作業内容 | 進捗状況 | 完了予想 |
|---------|---------|---------|---------|
| **フェーズ5** | Golden Layout統合 | ✅ 100% | 完了済み |
| **フェーズ6** | GUI要素完全移行 | 🔄 80% | 2025年6月10日 |
| **フェーズ7** | 3Dビューポート統合 | 🚧 0% | 2025年6月15日 |
| **フェーズ8** | プロジェクト管理 | 🚧 0% | 2025年6月20日 |

## ✅ **次の作業者へのタスク**

1. **CADワーカー連携の完成**
   - Monaco Editorからのコード評価処理の完成
   - GUI要素とCADワーカーの連携強化

2. **テスト結果の分析と改善**
   - Playwrightテスト結果を分析し、UIの改善点を特定
   - 比較テストで発見された差異を修正

3. **3Dビューポート実装準備**
   - React Three Fiber統合の計画詳細化
   - CADジオメトリ表示のための基盤実装

## 🎯 **成功指標**

### 📊 定量的指標
- ✅ **Golden Layout**: 3パネル構成実現（100%完了）
- 🎯 **GUI要素**: Tweakpane完全互換（次ターゲット）
- 🎯 **URL共有**: encode/decode互換（計画中）
- 🎯 **キーバインド**: F5/Ctrl+S対応（計画中）

### 🎨 定性的指標
- ✅ **ビジュアル**: CascadeStudio風レイアウト（完了）
- 🎯 **操作感**: 完全同一操作（90%達成目標）
- 🎯 **パフォーマンス**: 同等速度（最適化必要）

---

## 🚀 **次作業者への引き継ぎ事項**

### ✅ **完了済み基盤**
1. **Golden Layout 2.6.0基盤**: 完全動作確認済み
2. **3パネル構成**: Monaco Editor + CAD View + Console
3. **フローティングGUI**: Tweakpane配置済み
4. **STARTER_CODE**: CascadeStudio互換表示

### 🎯 **次の優先実装**
1. **CSSパス修正**: `themes/goldenlayout-dark-theme.css`
2. **TweakpaneGUI**: 動的GUI要素システム  
3. **Monaco統合**: Golden Layout内での完全機能
4. **CADWorker連携**: GUI変更 → 形状更新

### 🔧 **技術ナレッジ**
- **Golden Layout V2**: `bindComponentEvent` + `Embedding via Events`
- **依存関係**: `fflate` (rawflate代替), `tweakpane@4.0.1`
- **CSS**: `themes/` フォルダパス必須

**🎊 現状: フェーズ6実装進行中！次は3Dビューポート統合です！**

## 🛠️ Playwright MCP活用実装チェックリスト

### フェーズ5: レイアウトシステム (Week 1-2)
- [ ] **環境準備 + MCP基盤**
  - [ ] 依存関係追加 (golden-layout, tweakpane, rawflate)
  - [ ] CascadeStudio並行表示環境構築
  - [ ] 基準スクリーンショット・スナップショット取得
- [ ] **Golden Layout基盤 + リアルタイム検証**
  - [ ] cascadeLayoutConfig.ts 実装 → 即座にMCP検証
  - [ ] GoldenLayoutWrapper.tsx 実装 → レイアウト表示確認
  - [ ] コンポーネント登録システム → パネル操作テスト
- [ ] **Monaco Editor統合 + 機能テスト**
  - [ ] cascadeMonacoEditor.ts 実装 → エディター機能確認
  - [ ] TypeScript Intellisense設定 → 補完表示確認
  - [ ] キーバインド実装 → F5/Ctrl+S動作確認
- [ ] **基本動作確認 + 品質検証**
  - [ ] レイアウト表示確認 → snapshot比較
  - [ ] パネル操作確認 → click/hover操作テスト
  - [ ] エディター動作確認 → type/pressKey テスト
  - [ ] 品質監査実行 → runAccessibilityAudit等

### フェーズ6: GUI要素 (Week 3-4)
- [ ] **Tweakpane統合 + GUI検証**
  - [ ] TweakpaneGUI.tsx 実装 → GUI表示確認
  - [ ] デフォルトGUI要素実装 → 各要素操作テスト
  - [ ] GUI要素ハンドラー実装 → 動的追加確認
- [ ] **フローティングGUI + 配置検証**
  - [ ] FloatingGUIOverlay.tsx 実装 → 配置位置精密確認
  - [ ] 3Dビューポート統合 → フローティング表示確認
  - [ ] リアルタイム更新システム → 値変更連携確認
- [ ] **動作確認 + 互換性検証**
  - [ ] 全GUI要素動作確認 → 系統的操作テスト
  - [ ] CascadeStudio互換性確認 → 並行比較
  - [ ] パフォーマンス確認 → runPerformanceAudit

### フェーズ7: UI完全一致 (Week 5-6)
- [ ] **ナビゲーション + ピクセル比較**
  - [ ] CascadeTopNav.tsx 実装 → ナビゲーション表示確認
  - [ ] 全機能ボタン実装 → 各ボタン操作テスト
  - [ ] CascadeStudio風スタイリング → ピクセル単位比較
- [ ] **コンソール + ログ確認**
  - [ ] CascadeConsole.tsx 実装 → コンソール表示確認
  - [ ] ログ表示機能 → 色分け・フォーマット確認
  - [ ] 進捗表示機能 → ドット表示確認
- [ ] **レイアウト調整 + 詳細確認**
  - [ ] 完全な視覚的一致 → takeScreenshot比較
  - [ ] フォント・色設定 → 詳細スタイル確認
  - [ ] レスポンシブ対応 → 画面サイズ変更テスト

### フェーズ8: 高度機能 (Week 7-8)
- [ ] **URL状態管理 + 共有テスト**
  - [ ] URLStateManager.ts 実装 → URL生成・復元テスト
  - [ ] encode/decode機能 → 互換性確認
  - [ ] URL保存/復元機能 → 自動ナビゲーションテスト
- [ ] **プロジェクト管理 + ファイル連携**
  - [ ] GoldenLayoutProjectManager.ts 実装 → ファイル保存・読み込みテスト
  - [ ] プロジェクトファイル互換性 → chooseFile テスト
  - [ ] 外部ファイル管理 → インポート・エクスポートテスト
- [ ] **統合ページ + 全機能テスト**
  - [ ] cascade-studio/page.tsx 実装 → エンドツーエンドテスト
  - [ ] 全機能統合 → フルワークフローテスト
  - [ ] 最終動作確認 → 包括的品質監査

## 🔍 Playwright MCP品質チェックポイント

### 各フェーズ終了時の自動確認項目

#### フェーズ5終了時
- [ ] `await snapshot()` でレイアウト構造確認
- [ ] `await click("panel-header")` でパネル操作確認
- [ ] `await type("code")` + `await pressKey("F5")` でエディター確認
- [ ] `await runAccessibilityAudit()` で品質確認

#### フェーズ6終了時
- [ ] `await click("slider")` でGUI操作確認
- [ ] `await takeScreenshot()` でフローティングGUI配置確認
- [ ] `await type("Slider code")` + `await pressKey("F5")` で動的GUI確認
- [ ] `await runPerformanceAudit()` でパフォーマンス確認

#### フェーズ7終了時
- [ ] 並行比較 `await navigate()` で2画面比較
- [ ] `await takeScreenshot()` でピクセル単位比較
- [ ] 全機能ボタン操作テスト
- [ ] `await runBestPracticesAudit()` で品質確認

#### フェーズ8終了時
- [ ] URL共有 `await navigate(generatedURL)` でテスト
- [ ] ファイル操作 `await chooseFile()` でテスト
- [ ] `await runAuditMode()` で包括的監査
- [ ] エンドツーエンドワークフローテスト

## 🚀 Playwright MCP効率化ポイント

### 1. リアルタイム並行比較
```javascript
// CascadeStudioとNext.jsアプリを同時比較
await Promise.all([
  navigate("http://localhost:3001/docs/template/index.html"),
  navigate("http://localhost:3000/cascade-studio", { newTab: true })
]);
```

### 2. 自動品質チェック
```javascript
// 実装後即座に品質確認
await runAllAudits();
await getConsoleErrors();
await getNetworkErrors();
```

### 3. 継続的UI検証
```javascript
// 各変更後にUI確認
await takeScreenshot(); // 視覚的変更確認
await snapshot(); // 構造的変更確認
```

### 4. 自動操作テスト
```javascript
// 手動テストを自動化
await performUserWorkflow([
  "edit-code", "run-code", "adjust-gui", 
  "save-project", "share-url"
]);
```

## 📈 成功メトリクス（Playwright MCP測定）

### 定量的指標（自動測定）
- [ ] **初期化時間**: `performance.timing` で3秒以内確認
- [ ] **メモリ使用量**: `runDebuggerMode()` でCascadeStudio+30%以内確認
- [ ] **レンダリング性能**: `runPerformanceAudit()` で60fps確認
- [ ] **アクセシビリティ**: `runAccessibilityAudit()` で95点以上確認

### 定性的指標（自動比較）
- [ ] **視覚的一致度**: `takeScreenshot()` 比較で95%以上一致
- [ ] **機能的一致度**: 全サンプルコード100%動作確認
- [ ] **使いやすさ**: ユーザーワークフロー100%成功
- [ ] **互換性**: プロジェクトファイル・URL 100%互換確認

## 🎯 最終検証項目（Playwright MCP自動化）

### CascadeStudio互換性確認
- [ ] `await chooseFile("cascade-project.json")` → プロジェクト読み込み確認
- [ ] `await navigate("cascade-url")` → URL共有確認  
- [ ] `await performSampleCodeTest()` → 全サンプルコード確認
- [ ] `await runCompatibilityTest()` → 全機能互換性確認

### ユーザー受け入れテスト
- [ ] `await performUserJourney()` → 実際の使用フロー確認
- [ ] `await runAccessibilityTest()` → アクセシビリティ確認
- [ ] `await measurePerformance()` → パフォーマンス測定
- [ ] `await validateQuality()` → 品質総合確認

この **Playwright MCP活用版実行計画** により、**効率的に8週間でCascadeStudioの完全コピーを実現**できます。 

## 📚 実装時ソースコード参照ガイド

### 🔍 重要ファイルの参照ポイント

#### `docs/template/js/MainPage/CascadeMain.js`
```javascript
// 主要参照ポイント
L47-85:   layoutConfig - Golden Layout設定
L87-134:  Golden Layout初期化処理
L136-201: registerComponent - コンポーネント登録
L203-230: エラーハンドリング
L270-320: コンソール実装
L350-425: ファイル操作・プロジェクト管理
L430-475: URL状態管理
```

#### `docs/template/js/MainPage/CascadeView.js`
```javascript
// 主要参照ポイント  
L15-45:   Tweakpane初期化
L85-185:  messageHandlers実装（addSlider, addButton等）
L200-245: Progress, Log messageHandlers
L250-280: フローティングGUI配置
```

#### `docs/template/css/main.css`
```css
/* 主要参照ポイント */
L12-58:   topnav スタイル
L60-95:   console スタイル  
L97-125:  GUI panel スタイル
L127-150: レスポンシブ設定
```

#### `docs/template/index.html`
```html
<!-- 主要参照ポイント -->
L25-45:   topnav HTML構造
L50-75:   レイアウト初期化
L95-125:  URL読み込み処理
L130-160: WebWorker連携
```

### 💡 実装時の効率的参照方法

1. **並行表示**: エディターで `docs/template` ファイルを開きながら実装
2. **コード比較**: CascadeStudioの実装パターンを理解してNext.js版に移植
3. **動作確認**: Playwright MCPで両バージョンを並行実行・比較
4. **段階的移植**: 小さな機能単位で実装→確認→次の機能へ 