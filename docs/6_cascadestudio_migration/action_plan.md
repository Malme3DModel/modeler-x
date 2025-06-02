# CascadeStudio完全コピー実行計画 - Playwright MCP活用版

## 🎯 プロジェクト目標
**CascadeStudio (docs/template) の機能とUIを100%再現したNext.js CADエディターを構築**

### 📂 CascadeStudioソースコード参照先
**重要**: 実装時の参考ソースコードは `docs/template` に配置されています
```
docs/template/
├── index.html              # メインHTML - レイアウト構造参照
├── js/
│   ├── MainPage/
│   │   ├── CascadeMain.js   # Golden Layout設定、GUI管理の核心実装
│   │   └── CascadeView.js   # 3Dビューポート、フローティングGUI配置
│   └── CascadeStudioStandardLibrary.js  # CAD関数ライブラリ
├── css/
│   └── main.css            # CascadeStudio風スタイリング
└── opencascade/
    └── opencascade.wasm    # WebAssembly CADエンジン
```

**実装時の参照方法**:
- Golden Layout実装 → `CascadeMain.js` の layoutConfig, componentRegistration参照
- Tweakpane GUI → `CascadeView.js` の messageHandlers, GUI要素追加処理参照  
- スタイリング → `main.css` の topnav, console, GUI panel設定参照
- 機能実装 → `index.html` のWebWorker連携、初期化フロー参照

### 🚀 Playwright MCP活用戦略
- **リアルタイム並行比較**: CascadeStudioと開発中アプリを同時表示・比較
- **自動UI検証**: アクセシビリティスナップショットによるピクセル単位比較
- **継続的品質保証**: 各実装ステップでリアルタイム動作確認
- **効率的デバッグ**: ブラウザツールとの連携によるリアルタイムデバッグ

### 成功指標
- ✅ **視覚的一致**: CascadeStudioと見分けがつかないUI
- ✅ **機能的一致**: 全機能がCascadeStudio相当に動作
- ✅ **完全な互換性**: プロジェクトファイル・URL共有の相互互換

## 📅 実行タイムライン（8週間計画）

### Week 1-2: フェーズ5 - レイアウトシステム完全移行

#### Day 1-2: 環境準備とPlaywright MCP連携設定
- [ ] **Task 1.1**: 依存関係追加 + Playwright MCP基盤
  ```bash
  npm install golden-layout@2.6.0 tweakpane@4.0.1 rawflate@0.3.0
  npm install @types/golden-layout --save-dev
  ```
- [ ] **Task 1.2**: CascadeStudio参照環境構築
  - `docs/template/index.html` をローカルサーバーで起動
  - Playwright MCPで両アプリを並行表示
  - 基準スナップショット取得
- [ ] **MCP活用**: CascadeStudio並行比較環境確立
  ```javascript
  // CascadeStudio参照
  await navigate("http://localhost:3001/docs/template/index.html");
  await takeScreenshot(); // 基準スクリーンショット
  
  // 開発中アプリ
  await navigate("http://localhost:3000/cascade-studio");
  await snapshot(); // 詳細比較用スナップショット
  ```

#### Day 3-5: Golden Layout基盤実装 + リアルタイム検証
- [ ] **Task 2.1**: レイアウト設定作成
  - `lib/layout/cascadeLayoutConfig.ts` 実装
  - DEFAULT_LAYOUT_CONFIG 定義
  - STARTER_CODE 移植
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L47-85 layoutConfig
- [ ] **Task 2.2**: GoldenLayoutWrapper基本実装
  - `components/layout/GoldenLayoutWrapper.tsx` 作成
  - Dynamic import設定
  - レイアウト初期化ロジック
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L87-134 Golden Layout初期化
- [ ] **MCP活用**: 実装即時検証
  ```javascript
  // 各コンポーネント実装後に即座に確認
  await navigate("http://localhost:3000/cascade-studio");
  await snapshot(); // レイアウト構造確認
  await takeScreenshot(); // 視覚的比較
  
  // エラーチェック
  await getConsoleErrors();
  await getNetworkErrors();
  ```

#### Day 6-8: コンポーネント登録システム + 動作確認
- [ ] **Task 3.1**: コンポーネント登録関数実装
  - `codeEditor` コンポーネント登録
  - `cascadeView` コンポーネント登録  
  - `console` コンポーネント登録
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L136-201 registerComponent
- [ ] **Task 3.2**: エラーハンドリング
  - レイアウト初期化エラー対応
  - コンポーネント登録失敗時の処理
  - リサイズ処理の実装
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L203-230 エラーハンドリング
- [ ] **MCP活用**: パネル操作自動テスト
  ```javascript
  // パネル移動・リサイズ動作確認
  await click("panel-header", "ref=codeEditor");
  await hover("resize-handle", "ref=splitter");
  await takeScreenshot(); // リサイズ後の状態確認
  
  // 各パネルの動作確認
  await click("コンソールタブ", "ref=console-tab");
  await snapshot(); // コンソール表示確認
  ```

#### Day 9-10: Monaco Editor Golden Layout統合 + 機能確認
- [ ] **Task 4.1**: Monaco Editor統合
  - `lib/editor/cascadeMonacoEditor.ts` 実装
  - TypeScript Intellisense設定
  - 関数折りたたみ機能
- [ ] **Task 4.2**: キーバインド実装
  - F5: コード実行
  - Ctrl+S: プロジェクト保存 + 実行
  - evaluateCode メソッド追加
- [ ] **MCP活用**: エディター機能自動テスト
  ```javascript
  // コード入力テスト
  await click("Monaco Editor", "ref=monaco-editor");
  await type("let box = Box(10, 10, 10);", "ref=monaco-editor", false);
  
  // キーバインドテスト
  await pressKey("F5"); // コード実行
  await wait(2); // 実行待ち
  await snapshot(); // 実行結果確認
  
  // Intellisense確認
  await type("Sphere(", "ref=monaco-editor", false);
  await wait(1);
  await takeScreenshot(); // 補完表示確認
  ```

#### Day 11-14: 基本動作確認とデバッグ + 品質検証
- [ ] **Task 5.1**: 統合テスト
  - レイアウトシステム動作確認
  - パネル移動・リサイズ確認
  - Monaco Editor動作確認
- [ ] **Task 5.2**: バグフィックス
  - レイアウト崩れ修正
  - TypeScript エラー解決
  - パフォーマンス調整
- [ ] **MCP活用**: 包括的品質検証
  ```javascript
  // 自動品質チェック
  await runAccessibilityAudit(); // アクセシビリティ確認
  await runPerformanceAudit(); // パフォーマンス確認
  await runBestPracticesAudit(); // ベストプラクティス確認
  
  // CascadeStudioとの並行比較
  await navigate("http://localhost:3001/docs/template/index.html");
  const cascadeScreenshot = await takeScreenshot();
  await navigate("http://localhost:3000/cascade-studio");
  const nextjsScreenshot = await takeScreenshot();
  // スクリーンショット比較分析
  ```

### Week 3-4: フェーズ6 - GUI要素完全移行

#### Day 15-17: Tweakpane基盤実装 + リアルタイムGUI確認
- [ ] **Task 6.1**: TweakpaneGUI コンポーネント
  - `components/gui/TweakpaneGUI.tsx` 実装
  - Tweakpane動的読み込み
  - 基本GUI要素（Evaluate, MeshRes, Cache?, etc）
  - **参照**: `docs/template/js/MainPage/CascadeView.js` L15-45 Tweakpane初期化
- [ ] **Task 6.2**: GUI要素ハンドラー
  - addSlider メッセージハンドラー
  - addButton メッセージハンドラー
  - addCheckbox メッセージハンドラー
  - addTextbox メッセージハンドラー
  - addDropdown メッセージハンドラー
  - **参照**: `docs/template/js/MainPage/CascadeView.js` L85-185 messageHandlers実装
- [ ] **MCP活用**: GUI要素動作自動確認
  ```javascript
  // Tweakpane表示確認
  await navigate("http://localhost:3000/cascade-studio");
  await snapshot(); // GUI配置確認
  
  // スライダー操作テスト
  await click("MeshRes slider", "ref=meshres-slider");
  await wait(1);
  await takeScreenshot(); // 値変更確認
  
  // ボタン操作テスト
  await click("Evaluate", "ref=evaluate-button");
  await wait(3); // 処理待ち
  await snapshot(); // 実行結果確認
  ```

#### Day 18-20: フローティングGUI実装 + 配置確認
- [ ] **Task 7.1**: FloatingGUIOverlay コンポーネント
  - `components/cad/FloatingGUIOverlay.tsx` 実装
  - 3Dビューポート右上配置
  - CSS positioning とスタイリング
- [ ] **Task 7.2**: WebWorker統合
  - CADWorkerからのGUI要素追加連携
  - リアルタイム値更新システム
  - delayReloadEditor 実装
- [ ] **MCP活用**: フローティングGUI配置精密確認
  ```javascript
  // CascadeStudioとの配置比較
  await navigate("http://localhost:3001/docs/template/index.html");
  const cascadeGUI = await snapshot();
  
  await navigate("http://localhost:3000/cascade-studio");
  const nextjsGUI = await snapshot();
  
  // GUI要素位置の詳細比較
  // 右上配置の精密確認
  await takeScreenshot(); // ピクセル単位比較用
  ```

#### Day 21-24: GUI要素動作確認 + 互換性検証
- [ ] **Task 8.1**: GUI要素テスト
  - Slider動作確認
  - Button動作確認
  - Checkbox動作確認
  - Textbox動作確認
  - Dropdown動作確認
- [ ] **Task 8.2**: CascadeStudio互換性確認
  - GUI要素の見た目一致確認
  - 動作パフォーマンス確認
  - エラーハンドリング確認
- [ ] **MCP活用**: 全GUI要素自動操作テスト
  ```javascript
  // 全GUI要素の系統的テスト
  const guiElements = [
    "meshres-slider", "cache-checkbox", "groundplane-checkbox", 
    "grid-checkbox", "evaluate-button"
  ];
  
  for (const element of guiElements) {
    await click(`GUI element ${element}`, `ref=${element}`);
    await wait(0.5);
    await snapshot(); // 各操作後の状態確認
  }
  
  // 動的GUI要素追加テスト
  await type(`let radius = Slider("Radius", 30, 20, 40);`, "ref=monaco-editor", false);
  await pressKey("F5");
  await wait(2);
  await snapshot(); // 動的GUI追加確認
  ```

#### Day 25-28: 統合とデバッグ + パフォーマンス最適化
- [ ] **Task 9.1**: Golden Layout + Tweakpane統合
  - レイアウトシステムとGUI要素の連携
  - 状態管理の整合性確認
  - メモリリーク対策
- [ ] **Task 9.2**: パフォーマンス最適化
  - GUI要素追加/削除の最適化
  - レンダリング性能向上
  - メモリ使用量最適化
- [ ] **MCP活用**: パフォーマンス監視・最適化
  ```javascript
  // パフォーマンス測定
  await runPerformanceAudit();
  
  // メモリリーク確認
  for (let i = 0; i < 10; i++) {
    await click("Evaluate", "ref=evaluate-button");
    await wait(3);
  }
  await runDebuggerMode(); // メモリ使用量確認
  
  // レンダリング性能確認
  await click("3D viewport", "ref=three-canvas");
  // マウス操作シミュレーション
  await hover("3D viewport center", "ref=three-canvas");
  await takeScreenshot(); // フレームレート確認
  ```

### Week 5-6: フェーズ7 - UI完全一致

#### Day 29-31: CascadeStudio風ナビゲーション + ピクセル単位比較
- [ ] **Task 10.1**: CascadeTopNav実装
  - `components/layout/CascadeTopNav.tsx` 実装
  - CascadeStudio風スタイリング
  - 機能ボタン配置
  - **参照**: `docs/template/index.html` L25-45 topnav構造、`docs/template/css/main.css` L12-58 topnavスタイル
- [ ] **Task 10.2**: ナビゲーション機能実装
  - Save Project 機能
  - Load Project 機能
  - Save STEP/STL/OBJ 機能
  - Import STEP/IGES/STL 機能
  - Clear Imported Files 機能
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L350-425 ファイル操作ハンドラー
- [ ] **MCP活用**: ナビゲーション完全一致確認
  ```javascript
  // CascadeStudioナビゲーション測定
  await navigate("http://localhost:3001/docs/template/index.html");
  const cascadeNav = await snapshot();
  
  // Next.jsナビゲーション測定
  await navigate("http://localhost:3000/cascade-studio");
  const nextjsNav = await snapshot();
  
  // ボタン配置・スタイリング詳細比較
  const navButtons = [
    "Save Project", "Load Project", "Save STEP", 
    "Save STL", "Save OBJ", "Import STEP/IGES/STL"
  ];
  
  for (const buttonText of navButtons) {
    await click(buttonText, `ref=${buttonText.toLowerCase().replace(/[^a-z]/g, '-')}`);
    await wait(0.5);
    await takeScreenshot(); // 各ボタン操作確認
  }
  ```

#### Day 32-35: CascadeStudio風コンソール + ログ表示確認
- [ ] **Task 11.1**: CascadeConsole実装
  - `components/layout/CascadeConsole.tsx` 実装
  - ログ表示（交互色表示）
  - エラー表示（赤色）
  - 進捗表示（ドット表示）
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L270-320 コンソール実装
- [ ] **Task 11.2**: コンソール機能実装
  - サーキュラー参照対応
  - 自動スクロール
  - メッセージフォーマット
  - **参照**: `docs/template/js/MainPage/CascadeView.js` L200-245 Progress, Log messageHandlers
- [ ] **MCP活用**: コンソール表示詳細確認
  ```javascript
  // コンソールログ生成・確認
  await type(`console.log("Test message 1");`, "ref=monaco-editor", false);
  await pressKey("F5");
  await wait(1);
  
  await type(`console.error("Error message");`, "ref=monaco-editor", false);  
  await pressKey("F5");
  await wait(1);
  
  // コンソール表示確認
  await snapshot(); // ログ色分け確認
  
  // 進捗表示確認
  await type(`let sphere = Sphere(50);`, "ref=monaco-editor", false);
  await pressKey("F5");
  await wait(0.5);
  await snapshot(); // 進捗ドット表示確認
  ```

#### Day 36-38: レイアウト完全一致 + 詳細調整
- [ ] **Task 12.1**: ビューポート設定
  - 3Dビューポートの完全一致
  - フローティングGUIの正確な配置
  - パネル比率の調整
- [ ] **Task 12.2**: 細部調整
  - フォント設定（Consolas等）
  - 色設定の完全一致
  - スペーシング・パディング調整
- [ ] **MCP活用**: ピクセル単位詳細比較
  ```javascript
  // 画面全体のピクセル単位比較
  await navigate("http://localhost:3001/docs/template/index.html");
  const cascadeFullscreen = await takeScreenshot();
  
  await navigate("http://localhost:3000/cascade-studio");
  const nextjsFullscreen = await takeScreenshot();
  
  // 各エリアの詳細比較
  const areas = ["header", "left-panel", "right-upper", "right-lower"];
  for (const area of areas) {
    await click(`${area} area`, `ref=${area}`);
    await takeScreenshot(); // エリア別比較
  }
  
  // フォント・色確認
  await runAuditMode(); // 詳細監査モード
  ```

#### Day 39-42: 統合UI確認 + ユーザビリティテスト
- [ ] **Task 13.1**: 全体レイアウト確認
  - CascadeStudioとの並行比較
  - ピクセル単位での一致確認
  - レスポンシブ対応確認
- [ ] **Task 13.2**: ユーザビリティテスト
  - 実際の操作感確認
  - ショートカットキー動作確認
  - アクセシビリティ確認
- [ ] **MCP活用**: 包括的ユーザビリティテスト
  ```javascript
  // 実際のワークフロー再現
  const workflow = [
    "新規プロジェクト作成",
    "コード編集",
    "GUI操作",
    "3D表示確認", 
    "プロジェクト保存",
    "ファイルエクスポート"
  ];
  
  for (const step of workflow) {
    console.log(`Testing: ${step}`);
    // 各ステップの操作実行
    await performWorkflowStep(step);
    await snapshot(); // 各ステップの結果確認
  }
  
  // アクセシビリティ包括確認
  await runAccessibilityAudit();
  ```

### Week 7-8: フェーズ8 - 高度機能完全移行

#### Day 43-45: URL状態管理 + 共有機能確認
- [ ] **Task 14.1**: URLStateManager実装
  - `lib/url/URLStateManager.ts` 実装
  - rawflate統合
  - encode/decode機能
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L430-475 URL状態管理実装
- [ ] **Task 14.2**: URL状態管理機能
  - コードとGUI状態のURL保存
  - URLからの状態復元
  - CascadeStudio互換性確保
  - **参照**: `docs/template/index.html` L95-125 URL読み込み処理
- [ ] **MCP活用**: URL共有機能自動テスト
  ```javascript
  // URL生成・復元テスト
  await type(`let box = Box(10, 10, 10);`, "ref=monaco-editor", false);
  await pressKey("F5"); // URL生成
  await wait(2);
  
  const currentURL = await getCurrentURL();
  console.log("Generated URL:", currentURL);
  
  // 新しいタブでURL復元確認
  await navigate(currentURL);
  await wait(3);
  await snapshot(); // 復元状態確認
  
  // CascadeStudio URL互換性確認
  const cascadeURL = "http://localhost:3001/docs/template/index.html#code=...";
  await navigate(cascadeURL);
  await wait(3);
  await takeScreenshot(); // 互換性確認
  ```

#### Day 46-49: プロジェクト管理互換性 + ファイル連携
- [ ] **Task 15.1**: GoldenLayoutProjectManager実装
  - `lib/project/GoldenLayoutProjectManager.ts` 実装
  - プロジェクト保存（JSON形式）
  - プロジェクト読み込み
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L350-390 プロジェクト保存/読み込み
- [ ] **Task 15.2**: ファイル形式互換性
  - CascadeStudioプロジェクトファイル互換
  - レイアウト設定保存/復元
  - 外部ファイル管理
  - **参照**: `docs/template/js/MainPage/CascadeMain.js` L391-425 ファイル形式処理
- [ ] **MCP活用**: ファイル操作自動テスト
  ```javascript
  // プロジェクト保存テスト
  await click("Save Project", "ref=save-project");
  await wait(1);
  // ファイルダウンロード確認
  
  // プロジェクト読み込みテスト  
  await click("Load Project", "ref=load-project");
  await chooseFile(["/path/to/test-project.json"]);
  await wait(3);
  await snapshot(); // 読み込み結果確認
  
  // ファイル形式エクスポートテスト
  const formats = ["STEP", "STL", "OBJ"];
  for (const format of formats) {
    await click(`Save ${format}`, `ref=save-${format.toLowerCase()}`);
    await wait(2);
    // エクスポート確認
  }
  ```

#### Day 50-52: 統合ページ実装 + 全機能連携テスト
- [ ] **Task 16.1**: CascadeStudioページ実装
  - `app/cascade-studio/page.tsx` 実装
  - 全コンポーネント統合
  - 初期化フロー実装
- [ ] **Task 16.2**: 機能連携
  - ナビゲーション機能連携
  - プロジェクト管理機能連携
  - URL状態管理連携
- [ ] **MCP活用**: 全機能統合自動テスト
  ```javascript
  // エンドツーエンドワークフローテスト
  const fullWorkflow = [
    "アプリケーション起動",
    "デフォルトコード確認",
    "コード編集・実行",
    "GUI操作・確認",
    "3D表示・操作",
    "プロジェクト保存",
    "URL共有生成",
    "ファイルエクスポート",
    "新規タブでURL復元",
    "プロジェクトファイル読み込み"
  ];
  
  for (const step of fullWorkflow) {
    console.log(`Full workflow test: ${step}`);
    await performFullWorkflowStep(step);
    await wait(1);
    await snapshot(); // 各ステップ記録
  }
  ```

#### Day 53-56: 最終確認と品質保証 + 包括的検証
- [ ] **Task 17.1**: 全機能動作確認
  - CascadeStudioサンプルコード実行確認
  - プロジェクトファイル互換性確認
  - URL共有機能確認
- [ ] **Task 17.2**: パフォーマンステスト
  - 初期化時間測定
  - レンダリング性能測定
  - メモリ使用量測定
  - CascadeStudioとの性能比較
- [ ] **MCP活用**: 最終品質保証・性能測定
  ```javascript
  // 包括的品質監査
  await runAuditMode(); // 全監査実行
  
  // パフォーマンス詳細測定
  const performanceResults = await runPerformanceAudit();
  console.log("Performance metrics:", performanceResults);
  
  // 最終比較検証
  await navigate("http://localhost:3001/docs/template/index.html");
  const finalCascadeState = await snapshot();
  
  await navigate("http://localhost:3000/cascade-studio");  
  const finalNextjsState = await snapshot();
  
  // 最終比較レポート生成
  console.log("Final comparison completed");
  
  // サンプルコード全実行確認
  const sampleCodes = [
    "基本図形コード",
    "GUI要素コード", 
    "複雑形状コード",
    "ファイル操作コード"
  ];
  
  for (const code of sampleCodes) {
    await loadSampleCode(code);
    await pressKey("F5");
    await wait(5);
    await takeScreenshot(); // 各サンプル実行結果
  }
  ```

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