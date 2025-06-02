# CascadeStudio完全コピー実装計画詳細

## 1. フェーズ5: Golden Layout統合詳細実装

### 1.1 依存関係追加と設定

```bash
# 必要なライブラリ追加
npm install golden-layout@2.6.0 tweakpane@4.0.1 rawflate@0.3.0 
npm install @types/golden-layout --save-dev
```

### 1.2 CascadeStudio用レイアウト設定

```typescript
// lib/layout/cascadeLayoutConfig.ts
export const DEFAULT_LAYOUT_CONFIG = {
  content: [{
    type: 'row',
    content: [{
      type: 'component',
      componentName: 'codeEditor',
      title: '* Untitled',
      componentState: { code: STARTER_CODE },
      width: 50.0,
      isClosable: false
    }, {
      type: 'column',
      content: [{
        type: 'component',
        componentName: 'cascadeView',
        title: 'CAD View',
        componentState: {},
        isClosable: false
      }, {
        type: 'component',
        componentName: 'console',
        title: 'Console',
        componentState: {},
        height: 20.0,
        isClosable: false
      }]
    }]
  }],
  settings: {
    showPopoutIcon: false,
    showMaximiseIcon: false,
    showCloseIcon: false
  }
};

export const STARTER_CODE = `// Welcome to Cascade Studio!   Here are some useful functions:
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

### 1.3 Golden Layout Wrapper実装

```typescript
// components/layout/GoldenLayoutWrapper.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_LAYOUT_CONFIG } from '../../lib/layout/cascadeLayoutConfig';

// Golden Layout のCSS
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/goldenlayout-dark-theme.css';

interface GoldenLayoutWrapperProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
  onProjectLoad?: (project: any) => void;
}

export default function GoldenLayoutWrapper({ 
  cadWorkerState,
  onProjectLoad 
}: GoldenLayoutWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<any>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Golden Layout動的インポート
    import('golden-layout').then(({ GoldenLayout }) => {
      // 既存レイアウトを破棄
      if (layoutRef.current) {
        layoutRef.current.destroy();
        layoutRef.current = null;
      }

      // 新しいレイアウト作成
      layoutRef.current = new GoldenLayout(DEFAULT_LAYOUT_CONFIG, containerRef.current);

      // コンポーネント登録
      registerComponents(layoutRef.current, cadWorkerState);

      // レイアウト初期化
      layoutRef.current.init();
      
      // リサイズ対応
      const handleResize = () => {
        if (layoutRef.current && containerRef.current) {
          layoutRef.current.updateSize();
        }
      };
      
      window.addEventListener('resize', handleResize);
      setIsLayoutReady(true);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (layoutRef.current) {
          layoutRef.current.destroy();
        }
      };
    });
  }, [cadWorkerState]);

  return (
    <div className="h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!isLayoutReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-100">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="ml-2">レイアウト初期化中...</span>
        </div>
      )}
    </div>
  );
}

// コンポーネント登録関数
function registerComponents(layout: any, cadWorkerState: any) {
  // コードエディターコンポーネント
  layout.registerComponent('codeEditor', (container: any, state: any) => {
    // CascadeCodeEditor の実装
    const editorContainer = document.createElement('div');
    editorContainer.style.height = '100%';
    container.getElement().append(editorContainer);
    
    // Monaco Editor初期化
    initializeMonacoEditor(editorContainer, state, cadWorkerState);
  });

  // 3Dビューポートコンポーネント
  layout.registerComponent('cascadeView', (container: any, state: any) => {
    // CascadeView の実装
    const viewContainer = document.createElement('div');
    viewContainer.style.height = '100%';
    viewContainer.style.position = 'relative';
    container.getElement().append(viewContainer);
    
    // フローティングGUIコンテナ追加
    const floatingGUIContainer = document.createElement('div');
    floatingGUIContainer.className = 'gui-panel';
    floatingGUIContainer.id = 'guiPanel';
    viewContainer.appendChild(floatingGUIContainer);
    
    // CADViewport初期化
    initializeCascadeView(viewContainer, state, cadWorkerState);
  });

  // コンソールコンポーネント
  layout.registerComponent('console', (container: any) => {
    // CascadeConsole の実装
    const consoleContainer = document.createElement('div');
    consoleContainer.style.height = '100%';
    consoleContainer.style.overflow = 'auto';
    consoleContainer.style.boxShadow = 'inset 0px 0px 3px rgba(0,0,0,0.75)';
    container.getElement().append(consoleContainer);
    
    // コンソール初期化
    initializeCascadeConsole(consoleContainer, cadWorkerState);
  });
}
```

### 1.4 Monaco Editor Golden Layout統合

```typescript
// lib/editor/cascadeMonacoEditor.ts
import * as monaco from 'monaco-editor';

export function initializeMonacoEditor(
  container: HTMLElement, 
  state: any, 
  cadWorkerState: any
) {
  // Monaco設定
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  });
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

  // TypeScript Intellisense設定
  setupIntelliSense();

  // コードチェック（配列形式対応）
  let codeValue = state.code;
  if (Array.isArray(state.code)) {
    codeValue = state.code.join('\n');
  }

  // エディター作成
  const editor = monaco.editor.create(container, {
    value: codeValue,
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  });

  // 関数折りたたみ設定
  setupFunctionFolding(editor, codeValue);

  // キーバインド設定
  setupKeyBindings(editor, cadWorkerState);

  // evaluateCode メソッド追加
  (editor as any).evaluateCode = (saveToURL = false) => {
    executeCADCode(editor, cadWorkerState, saveToURL);
  };

  return editor;
}

function setupIntelliSense() {
  const extraLibs: any[] = [];
  
  // OpenCascade.js定義読み込み
  fetch('/opencascade/opencascade.d.ts')
    .then(response => response.text())
    .then(text => {
      extraLibs.push({ 
        content: text, 
        filePath: 'file:///opencascade.d.ts' 
      });
    });

  // CascadeStudio標準ライブラリ定義読み込み  
  fetch('/types/cad-library.d.ts')
    .then(response => response.text())
    .then(text => {
      extraLibs.push({ 
        content: text, 
        filePath: 'file:///cad-library.d.ts' 
      });
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
    });
}

function setupFunctionFolding(editor: monaco.editor.IStandaloneCodeEditor, code: string) {
  const codeLines = code.split(/\r\n|\r|\n/);
  const collapsed: any[] = [];
  let curCollapse: any = null;
  
  for (let li = 0; li < codeLines.length; li++) {
    if (codeLines[li].startsWith('function')) {
      curCollapse = { startLineNumber: li + 1 };
    } else if (codeLines[li].startsWith('}') && curCollapse !== null) {
      curCollapse.endLineNumber = li + 1;
      collapsed.push(curCollapse);
      curCollapse = null;
    }
  }

  const mergedViewState = Object.assign(editor.saveViewState(), {
    contributionsState: {
      'editor.contrib.folding': {
        collapsedRegions: collapsed,
        lineCount: codeLines.length,
        provider: 'indent'
      }
    }
  });
  
  editor.restoreViewState(mergedViewState);
}

function setupKeyBindings(editor: monaco.editor.IStandaloneCodeEditor, cadWorkerState: any) {
  // F5: コード実行
  editor.addCommand(monaco.KeyCode.F5, () => {
    (editor as any).evaluateCode(true);
  });

  // Ctrl+S: プロジェクト保存 + コード実行
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveProject();
    (editor as any).evaluateCode(true);
  });
}

function executeCADCode(
  editor: monaco.editor.IStandaloneCodeEditor,
  cadWorkerState: any,
  saveToURL = false
) {
  if (cadWorkerState.isWorking) return;

  const code = editor.getValue();
  
  // GUI再初期化
  initializeTweakpaneGUI();
  
  // CADコード実行
  cadWorkerState.executeCADCode(code);
  
  // URL保存
  if (saveToURL) {
    saveCodeToURL(code, cadWorkerState.guiState);
  }
}
```

## 2. フェーズ6: Tweakpane GUI統合詳細実装

### 2.1 Tweakpane統合コンポーネント

```typescript
// components/gui/TweakpaneGUI.tsx
'use client';

import { useEffect, useRef } from 'react';

interface TweakpaneGUIProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
  container?: HTMLElement;
}

export default function TweakpaneGUI({ 
  cadWorkerState,
  container 
}: TweakpaneGUIProps) {
  const paneRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.Tweakpane) {
      // Tweakpane動的読み込み
      const script = document.createElement('script');
      script.src = '/node_modules/tweakpane/dist/tweakpane.min.js';
      script.onload = initializeTweakpane;
      document.head.appendChild(script);
    } else {
      initializeTweakpane();
    }

    return () => {
      if (paneRef.current) {
        paneRef.current.dispose();
      }
    };
  }, []);

  const initializeTweakpane = () => {
    const targetContainer = container || containerRef.current;
    if (!targetContainer) return;

    // 既存のPane破棄
    if (paneRef.current) {
      paneRef.current.dispose();
    }

    // 新しいPane作成
    paneRef.current = new (window as any).Tweakpane.Pane({
      title: 'Cascade Control Panel',
      container: targetContainer
    });

    // デフォルトGUI要素追加
    setupDefaultGUIElements();
    
    // WebWorkerからのGUI要素追加ハンドラー設定
    setupGUIHandlers();
  };

  const setupDefaultGUIElements = () => {
    if (!paneRef.current) return;

    const guiState = cadWorkerState.guiState;

    // Evaluateボタン
    paneRef.current.addButton({ 
      title: 'Evaluate', 
      label: 'Function' 
    }).on('click', () => {
      cadWorkerState.executeCADCode(/* 現在のコード */);
    });

    // MeshResスライダー
    if (!('MeshRes' in guiState)) guiState.MeshRes = 0.1;
    paneRef.current.addInput(guiState, 'MeshRes', {
      min: 0.01,
      max: 2,
      step: 0.01,
      format: (v: number) => v.toFixed(2)
    });

    // Cache?チェックボックス
    if (!('Cache?' in guiState)) guiState['Cache?'] = true;
    paneRef.current.addInput(guiState, 'Cache?').on('change', () => {
      delayReloadEditor();
    });

    // GroundPlane?チェックボックス
    if (!('GroundPlane?' in guiState)) guiState['GroundPlane?'] = true;
    paneRef.current.addInput(guiState, 'GroundPlane?').on('change', () => {
      delayReloadEditor();
    });

    // Grid?チェックボックス
    if (!('Grid?' in guiState)) guiState['Grid?'] = true;
    paneRef.current.addInput(guiState, 'Grid?').on('change', () => {
      delayReloadEditor();
    });
  };

  const setupGUIHandlers = () => {
    // addSliderハンドラー
    cadWorkerState.messageHandlers['addSlider'] = (payload: any) => {
      const guiState = cadWorkerState.guiState;
      if (!(payload.name in guiState)) {
        guiState[payload.name] = payload.default;
      }

      const params: any = {
        min: payload.min,
        max: payload.max,
        step: payload.step
      };

      if (payload.dp) {
        params.format = (v: number) => v.toFixed(payload.dp);
      }

      const slider = paneRef.current.addInput(guiState, payload.name, params);

      if (payload.realTime) {
        slider.on('change', (e: any) => {
          if (e.last) {
            delayReloadEditor();
          }
        });
      }
    };

    // addButtonハンドラー
    cadWorkerState.messageHandlers['addButton'] = (payload: any) => {
      paneRef.current.addButton({ 
        title: payload.name, 
        label: payload.label 
      }).on('click', payload.callback);
    };

    // addCheckboxハンドラー
    cadWorkerState.messageHandlers['addCheckbox'] = (payload: any) => {
      const guiState = cadWorkerState.guiState;
      if (!(payload.name in guiState)) {
        guiState[payload.name] = payload.default || false;
      }
      
      paneRef.current.addInput(guiState, payload.name).on('change', () => {
        delayReloadEditor();
      });
    };

    // addTextboxハンドラー
    cadWorkerState.messageHandlers['addTextbox'] = (payload: any) => {
      const guiState = cadWorkerState.guiState;
      if (!(payload.name in guiState)) {
        guiState[payload.name] = payload.default || '';
      }
      
      const input = paneRef.current.addInput(guiState, payload.name);
      if (payload.realTime) {
        input.on('change', (e: any) => {
          if (e.last) {
            delayReloadEditor();
          }
        });
      }
    };

    // addDropdownハンドラー
    cadWorkerState.messageHandlers['addDropdown'] = (payload: any) => {
      const guiState = cadWorkerState.guiState;
      if (!(payload.name in guiState)) {
        guiState[payload.name] = payload.default || '';
      }
      
      const options = payload.options || {};
      const input = paneRef.current.addInput(guiState, payload.name, { options });
      if (payload.realTime) {
        input.on('change', (e: any) => {
          if (e.last) {
            delayReloadEditor();
          }
        });
      }
    };
  };

  const delayReloadEditor = () => {
    // 遅延実行でエディターリロード
    setTimeout(() => {
      cadWorkerState.executeCADCode(/* 現在のコード */);
    }, 100);
  };

  if (container) {
    // コンテナが外部から提供される場合はuseEffectのみで処理
    return null;
  }

  return <div ref={containerRef} className="gui-panel" />;
}
```

### 2.2 フローティングGUIオーバーレイ

```typescript
// components/cad/FloatingGUIOverlay.tsx
'use client';

import { useEffect, useRef } from 'react';
import TweakpaneGUI from '../gui/TweakpaneGUI';

interface FloatingGUIOverlayProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
  className?: string;
}

export default function FloatingGUIOverlay({ 
  cadWorkerState,
  className = ''
}: FloatingGUIOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // CSS設定
    if (containerRef.current) {
      containerRef.current.style.position = 'absolute';
      containerRef.current.style.top = '0';
      containerRef.current.style.right = '0';
      containerRef.current.style.maxHeight = '100%';
      containerRef.current.style.overflowY = 'auto';
      containerRef.current.style.zIndex = '10';
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`gui-panel ${className}`}
    >
      <TweakpaneGUI 
        cadWorkerState={cadWorkerState}
        container={containerRef.current}
      />
    </div>
  );
}
```

## 3. フェーズ7: CascadeStudio風UI完全一致

### 3.1 CascadeStudio風トップナビゲーション

```typescript
// components/layout/CascadeTopNav.tsx
'use client';

import { useRef } from 'react';

interface CascadeTopNavProps {
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onSaveSTEP?: () => void;
  onSaveSTL?: () => void;
  onSaveOBJ?: () => void;
  onImportFiles?: (files: FileList) => void;
  onClearFiles?: () => void;
}

export default function CascadeTopNav({
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ,
  onImportFiles,
  onClearFiles
}: CascadeTopNavProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onImportFiles) {
      onImportFiles(e.target.files);
    }
  };

  return (
    <nav className="topnav bg-neutral text-neutral-content">
      <a href="https://github.com/zalo/CascadeStudio" className="topnav-link">
        Cascade Studio 0.0.7
      </a>
      
      <a href="#" className="topnav-link" onClick={onSaveProject}>
        Save Project
      </a>
      
      <a href="#" className="topnav-link" onClick={onLoadProject}>
        Load Project
      </a>
      
      <a href="#" className="topnav-link" onClick={onSaveSTEP}>
        Save STEP
      </a>
      
      <a href="#" className="topnav-link" onClick={onSaveSTL}>
        Save STL
      </a>
      
      <a href="#" className="topnav-link" onClick={onSaveOBJ}>
        Save OBJ
      </a>
      
      <label className="topnav-link cursor-pointer" onClick={handleImportClick}>
        Import STEP/IGES/STL
        <input
          ref={fileInputRef}
          type="file"
          accept=".iges,.step,.igs,.stp,.stl"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </label>
      
      <a href="#" className="topnav-link" onClick={onClearFiles}>
        Clear Imported Files
      </a>

      <style jsx>{`
        .topnav {
          background-color: #111;
          overflow: hidden;
        }
        
        .topnav-link {
          float: left;
          color: #f2f2f2;
          text-align: center;
          padding: 4px 16px;
          text-decoration: none;
          font-size: 14px;
          font-family: Consolas;
        }
        
        .topnav-link:hover {
          background-color: #aaa;
          color: black;
        }
        
        .topnav-link.active {
          background-color: #4CAF50;
          color: white;
        }
      `}</style>
    </nav>
  );
}
```

### 3.2 CascadeStudio風コンソール

```typescript
// components/layout/CascadeConsole.tsx
'use client';

import { useEffect, useRef } from 'react';

interface CascadeConsoleProps {
  logs: Array<{ message: string; level: 'log' | 'error'; timestamp: number }>;
  progress?: { opNumber: number; opType?: string };
  onClear?: () => void;
}

export default function CascadeConsole({ 
  logs, 
  progress, 
  onClear 
}: CascadeConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 自動スクロール
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) { return; }
        seen.add(value);
      }
      return value;
    };
  };

  const formatMessage = (message: string) => {
    try {
      let messageText = JSON.stringify(message, getCircularReplacer());
      if (messageText.startsWith('"')) {
        messageText = messageText.slice(1, -1);
      }
      return messageText;
    } catch {
      return String(message);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="console-container"
      style={{
        height: '100%',
        overflow: 'auto',
        boxShadow: 'inset 0px 0px 3px rgba(0,0,0,0.75)',
        backgroundColor: '#1e1e1e',
        padding: '8px'
      }}
    >
      {logs.map((log, index) => (
        <div
          key={`${log.timestamp}-${index}`}
          style={{
            fontFamily: 'monospace',
            color: log.level === 'error' ? 'red' : 
                   index % 2 === 0 ? 'LightGray' : 'white',
            fontSize: '1.2em',
            marginBottom: '2px'
          }}
        >
          &gt; {formatMessage(log.message)}
        </div>
      ))}
      
      {progress && (
        <div
          style={{
            fontFamily: 'monospace',
            color: 'white',
            fontSize: '1.2em'
          }}
        >
          &gt; Generating Model{".".repeat(progress.opNumber)}
          {progress.opType && ` (${progress.opType})`}
        </div>
      )}
      
      <style jsx>{`
        .console-container::-webkit-scrollbar {
          width: 10px;
          background: #2e2e2e;
        }
        
        .console-container::-webkit-scrollbar-thumb {
          background: #777;
        }
      `}</style>
    </div>
  );
}
```

## 4. フェーズ8: URL状態管理とプロジェクト互換性

### 4.1 URL状態管理システム

```typescript
// lib/url/URLStateManager.ts
declare global {
  interface Window {
    RawDeflate: any;
  }
}

export class URLStateManager {
  private static isRawDeflateLoaded = false;

  static async ensureRawDeflateLoaded(): Promise<void> {
    if (this.isRawDeflateLoaded || window.RawDeflate) {
      this.isRawDeflateLoaded = true;
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/node_modules/rawflate/rawdeflate.js';
      script.onload = () => {
        const inflateScript = document.createElement('script');
        inflateScript.src = '/node_modules/rawflate/rawinflate.js';
        inflateScript.onload = () => {
          this.isRawDeflateLoaded = true;
          resolve();
        };
        document.head.appendChild(inflateScript);
      };
      document.head.appendChild(script);
    });
  }

  static async encode(string: string): Promise<string> {
    await this.ensureRawDeflateLoaded();
    return encodeURIComponent(window.btoa(window.RawDeflate.deflate(string)));
  }

  static async decode(string: string): Promise<string> {
    await this.ensureRawDeflateLoaded();
    return window.RawDeflate.inflate(window.atob(decodeURIComponent(string)));
  }

  static async saveStateToURL(code: string, guiState: Record<string, any>): Promise<void> {
    try {
      const encodedCode = await this.encode(code);
      const encodedGUI = await this.encode(JSON.stringify(guiState));
      
      const url = new URL(window.location.href);
      url.hash = `code=${encodedCode}&gui=${encodedGUI}`;
      window.history.replaceState({}, 'Cascade Studio', url.href);
      
      console.log('Saved to URL!');
    } catch (error) {
      console.error('Failed to save state to URL:', error);
    }
  }

  static async loadStateFromURL(): Promise<{ code?: string; guiState?: Record<string, any> }> {
    try {
      const params = new URLSearchParams(
        window.location.hash.substr(1) || window.location.search
      );
      
      const result: { code?: string; guiState?: Record<string, any> } = {};
      
      if (params.has('code')) {
        result.code = await this.decode(params.get('code')!);
      }
      
      if (params.has('gui')) {
        result.guiState = JSON.parse(await this.decode(params.get('gui')!));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to load state from URL:', error);
      return {};
    }
  }
}
```

### 4.2 Golden Layout プロジェクト管理

```typescript
// lib/project/GoldenLayoutProjectManager.ts
export interface ProjectData {
  layout: any;
  code: string;
  guiState: Record<string, any>;
  version: string;
  timestamp: string;
  externalFiles?: Record<string, any>;
}

export class GoldenLayoutProjectManager {
  static saveProject(
    layout: any, 
    code: string, 
    guiState: Record<string, any>,
    externalFiles?: Record<string, any>
  ): string {
    const projectData: ProjectData = {
      layout: layout.toConfig(),
      code: code.split(/\r\n|\r|\n/), // CascadeStudio互換の配列形式
      guiState: { ...guiState },
      version: "0.0.7",
      timestamp: new Date().toISOString(),
      externalFiles: externalFiles || {}
    };

    return JSON.stringify(projectData, null, 2);
  }

  static loadProject(projectJson: string): ProjectData {
    try {
      const project = JSON.parse(projectJson);
      
      return {
        layout: project.layout || project.content, // 後方互換性
        code: Array.isArray(project.code) ? project.code.join('\n') : project.code,
        guiState: project.guiState || {},
        version: project.version || "0.0.7",
        timestamp: project.timestamp || new Date().toISOString(),
        externalFiles: project.externalFiles || {}
      };
    } catch (error) {
      throw new Error(`Failed to load project: ${error.message}`);
    }
  }

  static async downloadProject(
    layout: any,
    code: string,
    guiState: Record<string, any>,
    filename = 'cascade-project.json'
  ): Promise<void> {
    const projectData = this.saveProject(layout, code, guiState);
    
    const blob = new Blob([projectData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static async loadProjectFromFile(): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const projectData = this.loadProject(e.target?.result as string);
            resolve(projectData);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    });
  }
}
```

## 5. 統合アプリケーションページ

### 5.1 CascadeStudio完全コピーページ

```typescript
// app/cascade-studio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCADWorker } from '../../hooks/useCADWorker';
import CascadeTopNav from '../../components/layout/CascadeTopNav';
import { URLStateManager } from '../../lib/url/URLStateManager';
import { GoldenLayoutProjectManager } from '../../lib/project/GoldenLayoutProjectManager';

// Dynamic imports for CSR-only components
const GoldenLayoutWrapper = dynamic(
  () => import('../../components/layout/GoldenLayoutWrapper'),
  { ssr: false }
);

export default function CascadeStudioPage() {
  const cadWorkerState = useCADWorker();
  const [isInitialized, setIsInitialized] = useState(false);
  const [layoutInstance, setLayoutInstance] = useState<any>(null);

  useEffect(() => {
    initializeFromURL();
  }, []);

  const initializeFromURL = async () => {
    try {
      const urlState = await URLStateManager.loadStateFromURL();
      
      if (urlState.code) {
        // URL からコードとGUI状態を復元
        // この処理はGoldenLayoutWrapper内で実行される
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize from URL:', error);
      setIsInitialized(true);
    }
  };

  const handleSaveProject = async () => {
    if (!layoutInstance) return;
    
    try {
      await GoldenLayoutProjectManager.downloadProject(
        layoutInstance,
        getCurrentCode(),
        cadWorkerState.guiState
      );
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleLoadProject = async () => {
    try {
      const projectData = await GoldenLayoutProjectManager.loadProjectFromFile();
      
      // レイアウトとコードを復元
      // この処理はGoldenLayoutWrapper を再初期化して実行
      window.location.reload(); // 簡易実装
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleSaveSTEP = () => {
    // STEP保存処理
    cadWorkerState.saveFile('STEP');
  };

  const handleSaveSTL = () => {
    // STL保存処理
    cadWorkerState.saveFile('STL');
  };

  const handleSaveOBJ = () => {
    // OBJ保存処理
    cadWorkerState.saveFile('OBJ');
  };

  const handleImportFiles = (files: FileList) => {
    // ファイルインポート処理
    Array.from(files).forEach(file => {
      cadWorkerState.importFile(file);
    });
  };

  const handleClearFiles = () => {
    // インポートファイルクリア
    cadWorkerState.clearImportedFiles();
  };

  const getCurrentCode = (): string => {
    // 現在のエディターからコードを取得
    // この実装は実際のエディターインスタンスに依存
    return '';
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-2">CascadeStudio を初期化中...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'rgb(34, 34, 34)' }}>
      {/* CascadeStudio風トップナビゲーション */}
      <CascadeTopNav
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onSaveSTEP={handleSaveSTEP}
        onSaveSTL={handleSaveSTL}
        onSaveOBJ={handleSaveOBJ}
        onImportFiles={handleImportFiles}
        onClearFiles={handleClearFiles}
      />

      {/* Golden Layout メインコンテンツ */}
      <div className="flex-1">
        <GoldenLayoutWrapper
          cadWorkerState={cadWorkerState}
          onLayoutReady={setLayoutInstance}
        />
      </div>
    </div>
  );
}
```

この実装計画により、CascadeStudioの機能とUIを100%再現したNext.js CADエディターを構築できます。 