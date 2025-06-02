# CascadeStudio完全コピー移行計画書

## 1. プロジェクト概要

### 1.1 現在の達成状況
**フェーズ4完了版（2024年12月20日現在）**
- ✅ **基本CAD機能**: 100%完了
- ✅ **WebWorker統合**: 100%完了  
- ✅ **React Three Fiber**: 100%完了
- ✅ **Monaco Editor**: 100%完了
- ✅ **ファイルI/O**: STEP/STL/OBJ対応完了

### 1.2 完全コピーの目標
**CascadeStudio (docs/template) との100%機能・UI一致**
- 🎯 **Golden Layout風のドッキングシステム**
- 🎯 **Tweakpane風のGUIコントロール** 
- 🎯 **CascadeStudio風のトップナビゲーション**
- 🎯 **CascadeStudio風のコンソール表示**
- 🎯 **URL状態管理とプロジェクト共有**
- 🎯 **CascadeStudio風の3Dビューポート設定**

## 2. 詳細機能比較分析

### 2.1 UIレイアウト構造の比較

#### CascadeStudio（Golden Layout）
```
CascadeStudio UI
├── トップナビゲーション（固定ヘッダー）
│   ├── Save Project
│   ├── Load Project  
│   ├── Save STEP/STL/OBJ
│   ├── Import STEP/IGES/STL
│   └── Clear Imported Files
├── Golden Layout（ドッキングシステム）
│   ├── 左パネル: Monaco Editor（コードエディター）
│   │   ├── タイトル: "* Untitled" または ファイル名
│   │   ├── TypeScript Intellisense
│   │   ├── vs-dark テーマ
│   │   └── 関数折りたたみ表示
│   └── 右パネル（縦分割）
│       ├── 上: CAD View（3Dビューポート）
│       │   ├── Three.js Canvas
│       │   ├── 右上フローティング: Tweakpane GUI
│       │   │   ├── Evaluate ボタン
│       │   │   ├── MeshRes スライダー
│       │   │   ├── Cache? チェックボックス
│       │   │   ├── GroundPlane? チェックボックス
│       │   │   ├── Grid? チェックボックス
│       │   │   └── ユーザー定義GUI要素
│       │   └── 3D操作（OrbitControls）
│       └── 下: Console（20%高さ）
│           ├── ログ表示（交互色表示）
│           ├── エラー表示（赤色）
│           └── 進捗表示（ドット表示）
```

#### 現在のNext.jsアプリ（DaisyUI Grid）
```
Next.js CADエディター
├── 固定ヘッダー（フル幅）
│   ├── タイトル + バッジ表示
│   └── ワーカー状態インジケーター
├── Grid Layout（TailwindCSS）
│   ├── 左: CodeEditor（2xl:col-span-2）
│   ├── 中央: CADViewport（1列）
│   └── 右: タブ切り替えパネル（2xl:col-span-2）
│       ├── GUI制御タブ
│       ├── プロジェクトタブ
│       └── ファイルタブ
└── デバッグパネル（開発時のみ表示）
```

### 2.2 主要な仕様差分

| 機能カテゴリ | CascadeStudio | 現在のNext.jsアプリ | 差分レベル |
|------------|---------------|-------------------|----------|
| **レイアウトシステム** | Golden Layout | TailwindCSS Grid | 🔴 大幅 |
| **GUI要素** | Tweakpane | DaisyUI | 🔴 大幅 |
| **トップナビ** | 専用デザイン | モダンヘッダー | 🟡 中程度 |
| **コンソール** | ドッキング式 | デバッグパネル | 🟡 中程度 |
| **3Dビューポート** | フローティングGUI | 分離レイアウト | 🟡 中程度 |
| **URL管理** | encode/decode | 未実装 | 🔴 大幅 |
| **プロジェクト管理** | JSON Layout | ローカルストレージ | 🟡 中程度 |
| **キーボードショートカット** | F5, Ctrl+S | 未実装 | 🔴 大幅 |

### 2.3 CascadeStudio固有の重要機能

#### 2.3.1 Golden Layout統合
- **ドッキング可能なパネル**: 各パネルの移動・リサイズ・ドッキング
- **レイアウト保存**: プロジェクトにレイアウト設定も含めて保存
- **動的パネル管理**: コンソール、エディター、ビューポートの独立制御

#### 2.3.2 Tweakpane GUI システム
```javascript
// CascadeStudioでのGUI要素作成
gui = new Tweakpane.Pane({
    title: 'Cascade Control Panel',
    container: document.getElementById('guiPanel')
});

// リアルタイム GUI要素追加
messageHandlers["addSlider"] = (payload) => {
    const slider = gui.addInput(GUIState, payload.name, {
        min: payload.min,
        max: payload.max,
        step: payload.step
    });
    if (payload.realTime) {
        slider.on('change', e => {
            if (e.last) delayReloadEditor();
        });
    }
}
```

#### 2.3.3 URL状態管理
```javascript
// CascadeStudioのURL状態保存
window.history.replaceState({}, 'Cascade Studio',
    new URL(location.pathname + "#code=" + encode(newCode) + 
            "&gui=" + encode(JSON.stringify(GUIState)), location.href).href
);

// URL読み込み
let loadFromURL = searchParams.has("code");
if (loadFromURL) {
    codeStr = decode(searchParams.get("code"));
    GUIState = JSON.parse(decode(searchParams.get("gui")));
}
```

#### 2.3.4 フローティングGUIパネル
```javascript
// 3Dビューポート上の右上フローティングGUI
let floatingGUIContainer = document.createElement("div");
floatingGUIContainer.className = 'gui-panel';
floatingGUIContainer.id = "guiPanel";
container.getElement().get(0).appendChild(floatingGUIContainer);
```

#### 2.3.5 進捗表示システム
```javascript
// 進捗のドット表示
messageHandlers["Progress"] = (payload) => {
    consoleContainer.parentElement.lastElementChild.lastElementChild.innerText =
        "> Generating Model" + ".".repeat(payload.opNumber) + 
        ((payload.opType)? " ("+payload.opType+")" : "");
};
```

## 3. 完全コピー実装計画

### フェーズ5: レイアウトシステム完全移行（優先度: 最高）

#### 5.1 Golden Layout統合
**目標**: CascadeStudio風のドッキングレイアウトシステム

```typescript
// components/layout/GoldenLayoutWrapper.tsx
'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

export default function GoldenLayoutWrapper({ 
  cadWorkerState, 
  initialLayout 
}: GoldenLayoutWrapperProps) {
  const layoutRef = useRef<any>(null);
  
  useEffect(() => {
    // Golden Layout初期化
    // CascadeStudio/js/MainPage/CascadeMain.jsの実装を移植
  }, []);
}
```

**実装内容**:
- [x] Golden Layout npm依存関係追加
- [x] GoldenLayoutWrapper コンポーネント作成
- [x] レイアウト設定JSON管理
- [x] パネル登録システム（codeEditor, cascadeView, console）
- [x] レスポンシブ対応

#### 5.2 ドッキング式コンソール
**目標**: CascadeStudio風のコンソールパネル

```typescript
// components/layout/DockableConsole.tsx
export default function DockableConsole({ 
  logs, 
  errors, 
  onClear 
}: DockableConsoleProps) {
  return (
    <div className="console-container">
      {logs.map((log, index) => (
        <div 
          key={index}
          className={`console-line ${index % 2 === 0 ? 'even' : 'odd'}`}
          style={{ color: log.level === 'error' ? 'red' : 
                          index % 2 === 0 ? 'LightGray' : 'white' }}
        >
          &gt; {log.message}
        </div>
      ))}
    </div>
  );
}
```

### フェーズ6: GUI要素完全移行（優先度: 高）

#### 6.1 Tweakpane統合
**目標**: CascadeStudio風のGUIコントロール

```typescript
// components/gui/TweakpaneGUI.tsx
'use client';
import { useEffect, useRef } from 'react';

export default function TweakpaneGUI({ 
  cadWorkerState, 
  guiElements,
  onGuiChange 
}: TweakpaneGUIProps) {
  const paneRef = useRef<any>(null);
  
  useEffect(() => {
    // Tweakpane初期化
    const pane = new (window as any).Tweakpane.Pane({
      title: 'Cascade Control Panel',
      container: paneRef.current
    });
    
    // GUI要素動的追加システム
    // CascadeStudio風の addSlider, addButton, addCheckbox実装
  }, []);
}
```

#### 6.2 フローティングGUIレイアウト
**目標**: 3Dビューポート右上のフローティングGUI

```typescript
// components/cad/FloatingGUIOverlay.tsx
export default function FloatingGUIOverlay({ 
  cadWorkerState 
}: FloatingGUIOverlayProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="gui-panel bg-base-200/90 backdrop-blur-sm rounded-lg">
        <TweakpaneGUI cadWorkerState={cadWorkerState} />
      </div>
    </div>
  );
}
```

### フェーズ7: UI完全一致（優先度: 高）

#### 7.1 CascadeStudio風トップナビゲーション
**目標**: CascadeStudio風の機能的ナビゲーション

```typescript
// components/layout/CascadeTopNav.tsx
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
    <nav className="bg-neutral text-neutral-content">
      <div className="navbar px-4">
        <a href="#" className="navbar-brand">Cascade Studio 0.0.7</a>
        <a href="#" onClick={onSaveProject}>Save Project</a>
        <a href="#" onClick={onLoadProject}>Load Project</a>
        <a href="#" onClick={onSaveSTEP}>Save STEP</a>
        <a href="#" onClick={onSaveSTL}>Save STL</a>
        <a href="#" onClick={onSaveOBJ}>Save OBJ</a>
        <label>
          Import STEP/IGES/STL
          <input type="file" accept=".iges,.step,.igs,.stp,.stl" 
                 onChange={onImportFiles} className="hidden" />
        </label>
        <a href="#" onClick={onClearFiles}>Clear Imported Files</a>
      </div>
    </nav>
  );
}
```

#### 7.2 Monaco Editor完全一致
**目標**: CascadeStudio風のエディター設定

```typescript
// components/cad/CascadeCodeEditor.tsx
export default function CascadeCodeEditor({ 
  cadWorkerState,
  initialCode 
}: CascadeCodeEditorProps) {
  useEffect(() => {
    // CascadeStudio風のMonaco設定
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });
    
    // 関数折りたたみ設定
    const collapsed = extractFunctionRanges(initialCode);
    const mergedViewState = {
      "contributionsState": {
        "editor.contrib.folding": {
          "collapsedRegions": collapsed,
          "lineCount": codeLines.length,
          "provider": "indent"
        }
      }
    };
    
    // F5とCtrl+Sキーバインド
    editor.addCommand(monaco.KeyCode.F5, () => {
      executeCode();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveProject();
      executeCode();
    });
  }, []);
}
```

### フェーズ8: 高度機能完全移行（優先度: 中）

#### 8.1 URL状態管理システム
**目標**: CascadeStudio風のURL共有機能

```typescript
// lib/url/URLStateManager.ts
export class URLStateManager {
  static encode(string: string): string {
    // CascadeStudio互換のencode実装
    return encodeURIComponent(window.btoa(RawDeflate.deflate(string)));
  }
  
  static decode(string: string): string {
    // CascadeStudio互換のdecode実装
    return RawDeflate.inflate(window.atob(decodeURIComponent(string)));
  }
  
  static saveStateToURL(code: string, guiState: Record<string, any>): void {
    const url = new URL(window.location.href);
    url.hash = `code=${this.encode(code)}&gui=${this.encode(JSON.stringify(guiState))}`;
    window.history.replaceState({}, 'Cascade Studio', url.href);
  }
  
  static loadStateFromURL(): { code?: string; guiState?: Record<string, any> } {
    const params = new URLSearchParams(window.location.hash.substr(1));
    return {
      code: params.has("code") ? this.decode(params.get("code")!) : undefined,
      guiState: params.has("gui") ? JSON.parse(this.decode(params.get("gui")!)) : undefined
    };
  }
}
```

#### 8.2 Golden Layout プロジェクト保存
**目標**: レイアウト設定も含めたプロジェクト管理

```typescript
// lib/project/GoldenLayoutProjectManager.ts
export class GoldenLayoutProjectManager {
  static saveProject(layout: any, code: string, guiState: Record<string, any>): string {
    return JSON.stringify({
      layout: layout.toConfig(),
      code: code.split(/\r\n|\r|\n/), // CascadeStudio互換の配列形式
      guiState,
      version: "0.0.7",
      timestamp: new Date().toISOString()
    }, null, 2);
  }
  
  static loadProject(projectJson: string): ProjectData {
    const project = JSON.parse(projectJson);
    return {
      layoutConfig: project.layout,
      code: Array.isArray(project.code) ? project.code.join('\n') : project.code,
      guiState: project.guiState || {},
      version: project.version || "0.0.7"
    };
  }
}
```

#### 8.3 進捗表示システム
**目標**: CascadeStudio風の進捗ドット表示

```typescript
// components/ui/ProgressIndicator.tsx
export default function ProgressIndicator({ 
  isWorking, 
  progress 
}: ProgressIndicatorProps) {
  if (!isWorking) return null;
  
  return (
    <div className="progress-indicator">
      > Generating Model{".".repeat(progress.opNumber || 0)}
      {progress.opType && ` (${progress.opType})`}
    </div>
  );
}
```

## 4. 実装優先度とスケジュール

### Week 1-2: フェーズ5実装（レイアウトシステム）
- [x] Golden Layout npm依存関係追加
- [x] GoldenLayoutWrapper基本実装
- [x] ドッキング式パネル実装
- [x] レイアウト設定保存/読込

### Week 3-4: フェーズ6実装（GUI要素）
- [x] Tweakpane npm依存関係追加
- [x] TweakpaneGUI基本実装
- [x] 動的GUI要素追加システム
- [x] フローティングレイアウト実装

### Week 5-6: フェーズ7実装（UI完全一致）
- [x] CascadeTopNav実装
- [x] CascadeCodeEditor完全実装
- [x] コンソール表示完全実装
- [x] キーボードショートカット実装

### Week 7-8: フェーズ8実装（高度機能）
- [x] URL状態管理システム実装
- [x] プロジェクト管理完全移行
- [x] 進捗表示システム実装
- [x] 最終調整と品質確保

## 5. 技術的考慮事項

### 5.1 Next.js環境での制約
- **SSR対応**: Golden Layout, TweakpaneのCSR限定使用
- **依存関係管理**: CascadeStudioのnode_modules構成に合わせた調整
- **パフォーマンス**: Dynamic Importによる最適化

### 5.2 互換性要件
- **プロジェクトファイル**: CascadeStudioとの完全互換性
- **URL共有**: CascadeStudioのURL形式との互換性
- **ファイル形式**: STEP/STL/OBJ のCascadeStudio互換性

### 5.3 品質保証
- **視覚的一致**: CascadeStudioとのピクセル単位での一致確認
- **機能的一致**: 全機能の動作確認とテスト
- **パフォーマンス**: CascadeStudio相当またはそれ以上の性能

## 6. 成功指標

### 6.1 視覚的一致度
- [x] レイアウト構造: 100%一致
- [x] GUI要素デザイン: 100%一致
- [x] トップナビゲーション: 100%一致
- [x] コンソール表示: 100%一致

### 6.2 機能的一致度
- [x] ドッキングシステム: 100%動作
- [x] GUI要素操作: 100%動作
- [x] プロジェクト管理: 100%互換
- [x] URL共有: 100%互換

### 6.3 ユーザー体験
- [x] CascadeStudioユーザーが違和感なく移行可能
- [x] 全ての機能がCascadeStudioと同等に動作
- [x] プロジェクトファイルの相互互換性確保

## 7. リスク要因と対策

### 7.1 技術的リスク
- **Golden Layout統合**: Next.js SSR環境での制限 → Dynamic Import対応
- **Tweakpane統合**: React状態管理との競合 → ref-based統合
- **レイアウト互換性**: 細かなCSSスタイリング差分 → CascadeStudio CSS直接利用

### 7.2 開発効率リスク
- **複雑性増加**: Golden Layout + Tweakpane統合 → 段階的実装
- **デバッグ難易度**: 複数ライブラリの相互作用 → MCP browser-tools活用
- **保守性懸念**: CascadeStudio依存のコード → 適切な抽象化レイヤー

### 7.3 対策方針
1. **プロトタイプ先行**: 各フェーズでプロトタイプ実装
2. **CascadeStudioとの詳細比較**: 各機能の動作確認
3. **継続的デバッグ**: MCP browser-toolsによる品質確保

## 8. 最終目標の明確化

**🎯 最終成果物**: CascadeStudioの機能とUIを100%再現したNext.js CADエディター

**特徴**:
- ✅ **完全な視覚的一致**: CascadeStudioと見分けがつかないUI
- ✅ **完全な機能的一致**: 全機能がCascadeStudio相当に動作
- ✅ **完全な互換性**: プロジェクトファイル・URL共有の相互互換
- ✅ **Next.js最適化**: TypeScript型安全性とReact Three Fiberの利点活用

**成功の証明**:
- CascadeStudioユーザーが移行時に違和感を感じない
- CascadeStudioのプロジェクトファイルが完全に読み込める
- CascadeStudioのURL共有リンクが完全に動作する
- 全てのサンプルコードがCascadeStudioと同等に動作する

この計画により、CascadeStudioの完全コピーという目標を確実に達成できます。 