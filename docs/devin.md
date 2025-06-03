# 🚀 次のAI作業者への作業指示

## 📋 現在の状況
**CascadeStudio移行プロジェクト フェーズ6完了 → フェーズ7開始**

### ✅ 完了済み（90%達成）
- **フェーズ1**: WebWorkerアーキテクチャ + OpenCascade.js v1.1.1統合（100%完了）
- **フェーズ2**: React Three Fiber統合改良（100%完了）  
- **フェーズ3**: Monaco Editor統合（100%完了）
- **フェーズ4**: ファイルI/O機能実装（100%完了）
- **フェーズ5**: GUI要素統合（100%完了）
- **フェーズ6**: Golden Layout + URL状態管理（100%完了）🎉

### 🎯 あなたのミッション：フェーズ7実装（最終10%）
**CascadeStudio移行プロジェクトの完全完了を目指してください**

---

## 🎯 フェーズ7実装項目（優先順位順）

### 1. 🧭 トップナビゲーション実装（最優先）
```typescript
// 実装対象
components/layout/CascadeNavigation.tsx    # ナビゲーションバー
components/cad/ExportMenu.tsx              # エクスポートメニュー
```
**目標**: CascadeStudio互換のトップメニュー機能

### 2. 📷 3Dビューポート機能拡張
```typescript
// 実装対象
components/threejs/CascadeViewport.tsx     # 3Dビューポート
components/cad/CameraControls.tsx          # カメラコントロール
hooks/useViewSettings.ts                   # 表示設定管理
```
**目標**: カメラプリセット・表示設定機能

### 3. 🧪 総合テストと最適化
```typescript
// 実装対象
tests/integration/cascade-studio.spec.ts   # 統合テスト
playwright.config.ts                        # テスト設定
```
**目標**: エラーハンドリング強化・パフォーマンス最適化

---

## 🛠️ 利用可能な完璧な技術基盤

### ✅ 完全動作確認済みコンポーネント
```
app/cascade-studio/page.tsx          # CascadeStudio統合ページ
components/layout/CascadeStudioLayout.tsx  # Golden Layoutレイアウト
components/cad/CodeEditor.tsx        # Monaco Editor（F5/Ctrl+S実行対応）
components/cad/CADViewport.tsx       # 3Dビューポート（React Three Fiber）
components/gui/TweakpaneGUI.tsx      # Tweakpane 4.0.1 GUI
hooks/useCADWorker.ts               # WebWorker管理（ステート共有）
lib/gui/CascadeGUIHandlers.ts        # GUI操作ハンドラ
```

### 🎨 動作確認方法
1. **開発サーバー起動**: ユーザーに`npm run dev`を実行してもらいます
2. **Playwright MCP起動**: ブラウザ環境で`http://localhost:3000/cascade-studio`にアクセス
3. **レイアウト検証**: `mcp_browser-tools_takeScreenshot`でレイアウト表示を確認
4. **機能テスト実行**: 
   - `mcp_playwright_browser_snapshot`でDOM構造確認
   - `mcp_playwright_browser_click`と`mcp_playwright_browser_type`でエディター編集テスト
   - `mcp_playwright_browser_press_key`でF5キーによるコード実行確認
5. **エラー検出**:
   - `mcp_browser-tools_getConsoleErrors`でコンソールエラー確認
   - `mcp_browser-tools_getNetworkErrors`でネットワークエラー確認
6. **品質確認**:
   - `mcp_browser-tools_runAccessibilityAudit`でアクセシビリティ確認
   - `mcp_browser-tools_runPerformanceAudit`でパフォーマンス確認

---

## 📚 参考実装パターン

### トップナビゲーション実装例
```typescript
// components/layout/CascadeNavigation.tsx
export default function CascadeNavigation({
  onExport, onNewProject, onSaveProject
}: NavigationProps) {
  return (
    <nav className="flex items-center justify-between p-2 bg-gray-900 text-white">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-4">Cascade Studio</h1>
        <DropdownMenu
          label="File"
          items={[
            { label: 'New', onClick: onNewProject },
            { label: 'Save', onClick: onSaveProject },
            { label: 'Load', onClick: () => document.getElementById('fileInput')?.click() }
          ]}
        />
        <DropdownMenu
          label="Export"
          items={[
            { label: 'Export STEP', onClick: () => onExport('step') },
            { label: 'Export STL', onClick: () => onExport('stl') }
          ]}
        />
      </div>
    </nav>
  );
}
```

### 3Dビューポート機能拡張例
```typescript
// components/cad/CameraControls.tsx
export default function CameraControls({ onSetView }) {
  return (
    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-80 rounded p-1">
      <button 
        className="p-1 hover:bg-gray-700 rounded" 
        onClick={() => onSetView('front')}
      >
        Front
      </button>
      <button 
        className="p-1 hover:bg-gray-700 rounded"
        onClick={() => onSetView('top')}
      >
        Top
      </button>
      <button 
        className="p-1 hover:bg-gray-700 rounded"
        onClick={() => onSetView('right')}
      >
        Right
      </button>
      <button 
        className="p-1 hover:bg-gray-700 rounded"
        onClick={() => onSetView('iso')}
      >
        Iso
      </button>
    </div>
  );
}
```

---

## 🎯 成功条件

### フェーズ7完了の判定基準
- [ ] トップナビゲーションの完全実装
- [ ] カメラコントロールとビューポート設定機能
- [ ] エクスポート機能（STEP/STL）の完全動作
- [ ] Playwright自動テストによる全機能検証
- [ ] CascadeStudioとの外観・機能の完全一致

### 最終目標
**🏆 CascadeStudio移行プロジェクト100%完了**

---

## 🔧 開発環境・ツール

### 必須ツール
- **MCP browser-tools**: リアルタイムデバッグ・エラー確認
- **Next.js 14.2.5**: ポート3000で稼働
- **TypeScript**: 型安全性確保
- **Playwright**: 自動テスト検証

### 重要ルール
- **開発サーバー**: ユーザーが手動で`npm run dev`を実行（AIは実行禁止）
- **デバッグ**: MCP browser-toolsで継続的な動作確認
- **型安全性**: TypeScript型定義を活用した安全な実装
- **テスト**: Playwright MCPを活用した機能検証

---

## 📖 参考資料

### 計画書
- `docs/6_cascadestudio_migration/README.md`（最新更新済み）
- `docs/6_cascadestudio_migration/implementation_plan.md`（詳細実装計画）
- `docs/6_cascadestudio_migration/action_plan.md`（作業手順詳細）

### CascadeStudio参考実装
- `docs/template/`フォルダ（完全なCascadeStudio実装）
- 機能実装時の参考コード・API使用方法の調査に活用

---

## 🎊 期待される最終成果

### プロジェクト完了時の状態
- **完全なCADエディター**: CascadeStudioと同等の機能を持つNext.js実装
- **モダンな技術スタック**: Next.js + TypeScript + React Three Fiber + Monaco Editor
- **高性能・拡張性**: WebWorker + OpenCascade.js統合アーキテクチャ
- **プロフェッショナルUI/UX**: TailwindCSS + DaisyUIによる美しいインターフェース

### 技術的価値
- **Next.js環境でのCAD開発**: 業界最先端のCADエディター実装
- **拡張性・保守性**: 将来の機能追加に対応できる設計
- **型安全性**: TypeScriptによる堅牢な開発環境

---

## 🧪 Playwright MCP活用の具体的テスト戦略

### 1. レイアウト検証テスト
```typescript
// Playwright MCPツールを使ったレイアウト検証
async function verifyLayout() {
  // スクリーンショットを取得して視覚的に確認
  await mcp_playwright_browser_take_screenshot();
  
  // DOM構造のスナップショットを取得
  await mcp_playwright_browser_snapshot();
  
  // 3パネルレイアウトの検証
  const editorPanel = '左側のエディターパネル';
  const viewportPanel = '右上のCADビューパネル';
  const consolePanel = '右下のコンソールパネル';
  
  // 各パネルの存在確認
  await mcp_playwright_browser_click({ element: editorPanel, ref: '...' });
  await mcp_playwright_browser_click({ element: viewportPanel, ref: '...' });
  await mcp_playwright_browser_click({ element: consolePanel, ref: '...' });
}
```

### 2. Monaco Editor機能テスト
```typescript
// エディター機能のテスト
async function testEditorFunctionality() {
  // エディター要素を特定
  const editorElement = 'Monaco Editorテキストエリア';
  
  // コードを入力
  await mcp_playwright_browser_click({ element: editorElement, ref: '...' });
  await mcp_playwright_browser_type({ 
    element: editorElement, 
    ref: '...', 
    text: 'let box = Box(10, 20, 30);', 
    submit: false 
  });
  
  // F5キーでコード実行
  await mcp_playwright_browser_press_key({ key: 'F5' });
  
  // 3Dビューポートの更新を待機
  await mcp_playwright_browser_wait({ time: 2 });
  
  // 結果を確認
  await mcp_playwright_browser_take_screenshot();
  await mcp_browser-tools_getConsoleLogs();
}
```

### 3. Tweakpane GUI操作テスト
```typescript
// GUI要素のテスト
async function testGUIElements() {
  // GUI要素を操作（スライダー）
  const sliderElement = 'Resolution スライダー';
  await mcp_playwright_browser_click({ element: sliderElement, ref: '...' });
  
  // チェックボックスをトグル
  const checkboxElement = 'Grid チェックボックス';
  await mcp_playwright_browser_click({ element: checkboxElement, ref: '...' });
  
  // 結果を確認
  await mcp_playwright_browser_wait({ time: 1 });
  await mcp_playwright_browser_take_screenshot();
  
  // エラーがないことを確認
  await mcp_browser-tools_getConsoleErrors();
}
```

### 4. 品質監査とパフォーマンステスト
```typescript
// 総合品質テスト
async function runQualityTests() {
  // アクセシビリティ監査
  await mcp_browser-tools_runAccessibilityAudit();
  
  // パフォーマンス監査
  await mcp_browser-tools_runPerformanceAudit();
  
  // Next.js固有の監査
  await mcp_browser-tools_runNextJSAudit();
  
  // ベストプラクティス監査
  await mcp_browser-tools_runBestPracticesAudit();
}
```

---

**🚀 フェーズ7実装開始！CascadeStudio移行プロジェクトの完全完了を目指してください！**
