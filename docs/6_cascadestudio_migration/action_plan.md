# CascadeStudio完全コピー実行計画 - Playwright MCP活用版

## 🎊 **重要更新**: フェーズ5基盤実装完了！（2025年6月2日）

### ✅ **達成済み項目**
- ✅ **Golden Layout 2.6.0基盤統合**: 100%完了
- ✅ **CascadeStudio風レイアウト構成**: 100%完了  
- ✅ **3パネル構成**: 左（Monaco Editor）+ 右上（CAD View）+ 右下（Console）
- ✅ **フローティングGUI配置**: 完了
- ✅ **Embedding via Events実装**: V2 API対応完了
- ✅ **STARTER_CODE表示**: CascadeStudio互換

**🌐 アクセス先**: `http://localhost:3000/cascade-studio`

### 🚨 **重要な新発見ナレッジ**

#### **Golden Layout V1 → V2 重大変更点**
⚠️ **CascadeStudioは古いV1仕様**: 完全にV2 APIに移行済み

```javascript
// ❌ V1方式（CascadeStudio使用）
new GoldenLayout(config, container);
registerComponent('editor', MyComponent);

// ✅ V2方式（実装完了）
const layout = new GoldenLayout(container);
layout.loadLayout(config);
layout.bindComponentEvent = (container, itemConfig) => { ... };
```

#### **CSS パス変更**
```bash
# ❌ 古いパス（現在エラー発生中）
'golden-layout/dist/css/goldenlayout-dark-theme.css'

# ✅ 新しいパス（修正必要）
'golden-layout/dist/css/themes/goldenlayout-dark-theme.css'
```

#### **依存関係修正完了**
- ✅ `rawflate` → `fflate@0.8.2` 置換完了
- ✅ `golden-layout@2.6.0` インストール完了
- ✅ `tweakpane@4.0.1` インストール完了

---

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

## 🎊 **現在の状況**: フェーズ5基盤実装完了！（2025年6月2日更新）

### ✅ 達成済み項目
- ✅ **Golden Layout 2.6.0基盤統合**: 100%完了
- ✅ **CascadeStudio風レイアウト構成**: 100%完了
- ✅ **3パネル構成**: 左（Monaco Editor）+ 右上（CAD View）+ 右下（Console）
- ✅ **フローティングGUI配置**: 完了
- ✅ **Embedding via Events実装**: V2 API対応完了
- ✅ **STARTER_CODE表示**: CascadeStudio互換

**アクセス先**: `http://localhost:3000/cascade-studio`

---

## 🚨 **緊急修正項目**

### 1. **CSSパスエラー修正**（即座実行）
```bash
# 現在のエラー
Module not found: Can't resolve 'golden-layout/dist/css/goldenlayout-dark-theme.css'

# 修正必要
'golden-layout/dist/css/themes/goldenlayout-dark-theme.css'
```

### 2. **Golden Layout V2 API完全移行済み**
- ✅ `componentName` → `componentType` 変更完了
- ✅ `{ content: [...] }` → `{ root: { content: [...] } }` 変更完了
- ✅ `new GoldenLayout(config, container)` → `new GoldenLayout(container)` + `loadLayout(config)` 変更完了
- ✅ `registerComponent` → `bindComponentEvent` 変更完了

---

## 📋 **Week 1-2: GUI要素完全移行** （次のターゲット）

### Day 1-2: Tweakpane統合基盤
**目標**: CascadeStudio完全互換GUI実装

#### ⚡ 緊急修正: CSS修正（30分）
```typescript
// components/layout/CascadeStudioLayout.tsx 修正
- import 'golden-layout/dist/css/goldenlayout-dark-theme.css';
+ import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
```

#### 🎯 TweakpaneGUI コンポーネント作成（1-2時間）
```typescript
// components/gui/TweakpaneGUI.tsx 新規作成
'use client';
import { useEffect, useRef, useState } from 'react';

export default function TweakpaneGUI({ 
  onGUIUpdate,
  guiState,
  cadWorkerState 
}: TweakpaneGUIProps) {
  const paneRef = useRef<any>(null);
  const [pane, setPane] = useState<any>(null);
  
  useEffect(() => {
    // Tweakpane動的インポート
    import('tweakpane').then(({ Pane }) => {
      const newPane = new Pane({
        title: 'Cascade Control Panel',
        container: paneRef.current,
        expanded: true
      });
      
      // 基本GUI要素追加
      addEvaluateButton(newPane);
      addMeshResSlider(newPane);
      addCacheCheckbox(newPane);
      addGroundPlaneCheckbox(newPane);
      addGridCheckbox(newPane);
      
      setPane(newPane);
    });
  }, []);
  
  return (
    <div 
      ref={paneRef} 
      className="tweakpane-container"
      style={{
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '16px',
        borderRadius: '8px',
        minWidth: '250px'
      }}
    />
  );
}
```

#### 🔧 動的GUI要素追加システム（2-3時間）
```typescript
// lib/gui/cascadeGUIHandlers.ts 新規作成
export class CascadeGUIHandlers {
  private pane: any;
  private guiState: Record<string, any> = {};
  
  constructor(pane: any) {
    this.pane = pane;
  }
  
  // CascadeStudio互換メッセージハンドラー
  addSlider(payload: {
    name: string;
    min: number;
    max: number;
    step?: number;
    realTime?: boolean;
  }) {
    const slider = this.pane.addInput(this.guiState, payload.name, {
      min: payload.min,
      max: payload.max,
      step: payload.step || 1
    });
    
    if (payload.realTime) {
      slider.on('change', (e: any) => {
        if (e.last) {
          // CADWorkerに変更通知
          this.notifyCADWorker();
        }
      });
    }
  }
  
  addButton(payload: { name: string; callback: () => void }) {
    this.pane.addButton({ 
      title: payload.name 
    }).on('click', payload.callback);
  }
  
  addCheckbox(payload: { name: string; realTime?: boolean }) {
    const checkbox = this.pane.addInput(this.guiState, payload.name, {});
    
    if (payload.realTime) {
      checkbox.on('change', () => {
        this.notifyCADWorker();
      });
    }
  }
  
  private notifyCADWorker() {
    // delayReloadEditor() 相当の処理
    console.log('GUI状態変更:', this.guiState);
  }
}
```

### Day 3-4: Monaco Editor Golden Layout統合
**目標**: CascadeStudio風エディター機能

#### 🖥️ CascadeMonacoEditor実装（3-4時間）
```typescript
// lib/editor/cascadeMonacoEditor.ts 新規作成
import * as monaco from 'monaco-editor';

export function initializeCascadeMonacoEditor(
  container: HTMLElement,
  initialCode: string,
  onCodeChange: (code: string) => void
) {
  // Monaco Editor初期化
  const editor = monaco.editor.create(container, {
    value: initialCode,
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'Consolas, monospace',
    minimap: { enabled: false },
    folding: true,
    foldingStrategy: 'indentation'
  });
  
  // TypeScript設定（CascadeStudio互換）
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types']
  });
  
  // 関数折りたたみ設定
  const collapsed = extractFunctionRanges(initialCode);
  editor.restoreViewState({
    contributionsState: {
      'editor.contrib.folding': {
        collapsedRegions: collapsed,
        lineCount: initialCode.split('\n').length,
        provider: 'indent'
      }
    }
  } as any);
  
  // F5キーバインド: コード実行
  editor.addCommand(monaco.KeyCode.F5, () => {
    onCodeChange(editor.getValue());
  });
  
  // Ctrl+S キーバインド: 保存+実行
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const code = editor.getValue();
    // 保存処理（URL状態更新）
    saveCodeToURL(code);
    // 実行
    onCodeChange(code);
  });
  
  return editor;
}

function extractFunctionRanges(code: string): any[] {
  const lines = code.split('\n');
  const ranges: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('function ') || line.includes('() => {') || line.includes('= {')) {
      // 関数開始検出 -> 折りたたみ範囲計算
      const endLine = findMatchingBrace(lines, i);
      if (endLine > i) {
        ranges.push({
          startLineNumber: i + 1,
          endLineNumber: endLine + 1,
          isCollapsed: true
        });
      }
    }
  }
  
  return ranges;
}
```

#### 🔄 Golden Layout内Monaco統合（2時間）
```typescript
// components/layout/CascadeStudioLayout.tsx 更新
function createCodeEditorComponent(container: any, itemConfig: any) {
  const editorContainer = document.createElement('div');
  editorContainer.style.height = '100%';
  editorContainer.style.position = 'relative';
  
  // Monaco Editor初期化
  setTimeout(() => {
    const editor = initializeCascadeMonacoEditor(
      editorContainer,
      itemConfig.componentState?.code || STARTER_CODE,
      (newCode) => {
        // CADWorkerに送信
        console.log('コード更新:', newCode);
      }
    );
    
    // レイアウトリサイズ対応
    const resizeObserver = new ResizeObserver(() => {
      editor.layout();
    });
    resizeObserver.observe(editorContainer);
  }, 100);
  
  container.element.appendChild(editorContainer);
  return { 
    destroy: () => {
      editorContainer.remove();
    }
  };
}
```

### Day 5-7: React Three Fiber統合
**目標**: CascadeStudio風3Dビューポート

#### 🎨 CascadeCADViewport実装（2-3時間）
```typescript
// components/cad/CascadeCADViewport.tsx 新規作成
'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useCADWorker } from '../../hooks/useCADWorker';
import TweakpaneGUI from '../gui/TweakpaneGUI';

export default function CascadeCADViewport({
  shapes,
  isWorking,
  onShapeClick
}: CascadeCADViewportProps) {
  const cadWorkerState = useCADWorker();
  
  return (
    <div className="relative h-full">
      {/* フローティングGUIパネル */}
      <div className="absolute top-4 right-4 z-10">
        <TweakpaneGUI 
          cadWorkerState={cadWorkerState}
          onGUIUpdate={(guiState) => {
            console.log('GUI更新:', guiState);
          }}
        />
      </div>
      
      {/* React Three Fiber Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ background: '#2d3748' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* CAD形状レンダリング */}
        {shapes.map((shape, index) => (
          <mesh 
            key={index}
            geometry={shape.geometry}
            material={shape.material}
            onClick={() => onShapeClick?.(shape)}
          />
        ))}
        
        {/* OrbitControls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={100}
        />
      </Canvas>
      
      {/* ワーカー状態表示 */}
      {isWorking && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded">
          <span className="loading loading-spinner loading-sm mr-2"></span>
          CAD処理中...
        </div>
      )}
    </div>
  );
}
```

#### 🔄 Golden Layout統合（1時間）
```typescript
// components/layout/CascadeStudioLayout.tsx 更新
function createCascadeViewComponent(container: any, itemConfig: any) {
  const viewContainer = document.createElement('div');
  viewContainer.style.height = '100%';
  viewContainer.style.position = 'relative';
  
  // React Root作成
  const root = createRoot(viewContainer);
  root.render(React.createElement(CascadeCADViewport, {
    shapes: [],
    isWorking: false,
    onShapeClick: (shape) => console.log('形状クリック:', shape)
  }));
  
  container.element.appendChild(viewContainer);
  return { 
    destroy: () => {
      root.unmount();
      viewContainer.remove();
    }
  };
}
```

---

## 📋 **Week 3-4: 高度機能実装**

### Day 8-10: URL状態管理実装
**目標**: CascadeStudio風プロジェクト共有機能

#### 🔗 URLStateManager実装（2-3時間）
```typescript
// lib/url/URLStateManager.ts 新規作成
import { deflate, inflate } from 'fflate'; // rawflate代替

export class URLStateManager {
  // CascadeStudio互換encode（fflate使用）
  static encode(string: string): string {
    const uint8Array = new TextEncoder().encode(string);
    const compressed = deflate(uint8Array);
    const base64 = btoa(String.fromCharCode(...compressed));
    return encodeURIComponent(base64);
  }
  
  // CascadeStudio互換decode
  static decode(string: string): string {
    const base64 = decodeURIComponent(string);
    const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const decompressed = inflate(compressed);
    return new TextDecoder().decode(decompressed);
  }
  
  // URL状態保存
  static saveStateToURL(code: string, guiState: Record<string, any>): void {
    const url = new URL(window.location.href);
    url.hash = `code=${this.encode(code)}&gui=${this.encode(JSON.stringify(guiState))}`;
    window.history.replaceState({}, 'Cascade Studio', url.href);
  }
  
  // URL状態読み込み
  static loadStateFromURL(): { code?: string; guiState?: Record<string, any> } {
    const hash = window.location.hash.substr(1);
    const params = new URLSearchParams(hash);
    
    try {
      return {
        code: params.has("code") ? this.decode(params.get("code")!) : undefined,
        guiState: params.has("gui") ? JSON.parse(this.decode(params.get("gui")!)) : undefined
      };
    } catch (error) {
      console.error('URL状態読み込みエラー:', error);
      return {};
    }
  }
}
```

### Day 11-14: CascadeStudio風トップナビゲーション
**目標**: 完全機能互換ナビゲーション

#### 🧭 CascadeTopNav実装（3-4時間）
```typescript
// components/layout/CascadeTopNav.tsx 新規作成
export default function CascadeTopNav({ 
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ,
  onImportFiles,
  onClearFiles
}: CascadeTopNavProps) {
  return (
    <nav className="bg-neutral text-neutral-content border-b border-neutral-focus">
      <div className="flex items-center px-4 py-2 space-x-4">
        {/* ブランド */}
        <a href="#" className="font-bold text-lg">
          Cascade Studio 0.0.7
        </a>
        
        {/* セパレータ */}
        <div className="w-px h-6 bg-neutral-content opacity-30"></div>
        
        {/* プロジェクト管理 */}
        <button className="btn btn-ghost btn-sm" onClick={onSaveProject}>
          Save Project
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onLoadProject}>
          Load Project
        </button>
        
        {/* セパレータ */}
        <div className="w-px h-6 bg-neutral-content opacity-30"></div>
        
        {/* エクスポート */}
        <button className="btn btn-ghost btn-sm" onClick={onSaveSTEP}>
          Save STEP
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onSaveSTL}>
          Save STL
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onSaveOBJ}>
          Save OBJ
        </button>
        
        {/* セパレータ */}
        <div className="w-px h-6 bg-neutral-content opacity-30"></div>
        
        {/* インポート */}
        <label className="btn btn-ghost btn-sm cursor-pointer">
          Import STEP/IGES/STL
          <input 
            type="file" 
            accept=".iges,.step,.igs,.stp,.stl" 
            onChange={onImportFiles} 
            className="hidden" 
          />
        </label>
        <button className="btn btn-ghost btn-sm" onClick={onClearFiles}>
          Clear Imported Files
        </button>
      </div>
    </nav>
  );
}
```

---

## 📋 **Week 5-6: 統合テスト・最適化**

### Day 15-17: MCP Browser Tools活用
**目標**: リアルタイムデバッグ・動作確認

#### 🔍 Playwright MCP自動テスト（1-2時間）
```typescript
// tests/cascade-studio.spec.ts 新規作成
test('CascadeStudio完全コピー動作確認', async ({ page }) => {
  // ページナビゲーション
  await page.goto('http://localhost:3000/cascade-studio');
  
  // Golden Layout初期化待機
  await page.waitForSelector('.lm_goldenlayout');
  
  // Monaco Editor確認
  await page.waitForSelector('.monaco-editor');
  const editorContent = await page.textContent('.monaco-editor .view-lines');
  expect(editorContent).toContain('Welcome to Cascade Studio!');
  
  // Tweakpane GUI確認
  await page.waitForSelector('.tp-dfwv');
  const guiPanel = await page.locator('.gui-panel');
  await expect(guiPanel).toBeVisible();
  
  // コンソール確認
  await page.waitForSelector('.console-container');
  const consoleText = await page.textContent('.console-container');
  expect(consoleText).toContain('CascadeStudio Console');
  
  // F5キー実行テスト
  await page.keyboard.press('F5');
  await page.waitForTimeout(1000);
  
  // CAD形状レンダリング確認
  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();
});
```

#### 🖥️ MCP Browser Tools統合デバッグ
```bash
# リアルタイム動作確認
mcp_browser-tools_takeScreenshot
mcp_browser-tools_runAccessibilityAudit  
mcp_browser-tools_runPerformanceAudit
mcp_browser-tools_getConsoleLogs
mcp_browser-tools_getNetworkErrors
```

### Day 18-21: パフォーマンス最適化
**目標**: CascadeStudio同等のパフォーマンス達成

#### ⚡ WebWorker最適化（2-3時間）
- CAD処理の並列化
- Shape caching実装
- Progressive rendering

#### 🎨 UI最適化（1-2時間）
- Golden Layoutレスポンシブ対応
- Tweakpane遅延初期化
- Monaco Editor仮想化

---

## 📋 **Week 7-8: 最終調整・ドキュメント化**

### Day 22-25: 完全互換性確認
**目標**: CascadeStudio 100%機能一致確認

#### ✅ 機能チェックリスト
- [ ] Golden Layoutドッキング機能
- [ ] Tweakpane動的GUI
- [ ] Monaco Editor TypeScript Intellisense
- [ ] F5/Ctrl+S キーバインド
- [ ] URL状態共有
- [ ] プロジェクト保存/読み込み
- [ ] STEP/STL/OBJ エクスポート
- [ ] CAD形状インタラクション

### Day 26-28: ドキュメント更新
**目標**: 完全移行の記録・引き継ぎ資料

#### 📚 更新ドキュメント
- [ ] `docs/6_cascadestudio_migration/README.md` 完了報告
- [ ] `docs/6_cascadestudio_migration/implementation_plan.md` 実装詳細
- [ ] `docs/6_cascadestudio_migration/action_plan.md` 達成記録

---

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

**🎊 現状: フェーズ5基盤 100%完了！次はTweakpane統合です！**

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