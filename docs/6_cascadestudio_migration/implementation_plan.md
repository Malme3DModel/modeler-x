# CascadeStudio完全コピー実装計画詳細

## 🎊 **フェーズ6実装完了**（2025年6月8日更新）

### ✅ **実装完了項目**
- ✅ **Golden Layout 2.6.0基盤**: V2 API完全対応済み
- ✅ **CascadeStudio風レイアウト**: 3パネル構成完了
- ✅ **フローティングGUI配置**: Tweakpane領域確保
- ✅ **STARTER_CODE表示**: CascadeStudio互換
- ✅ **コンソールパネル**: CascadeStudio風デザイン
- ✅ **Monaco Editor統合**: F5キー、Ctrl+Sキーバインド実装
- ✅ **Monaco Editorワーカー設定**: WebWorkerエラー解決
- ✅ **URL状態管理システム**: Base64エンコードによるURL共有
- ✅ **CascadeGUIHandlers**: Tweakpane 4.0.1に対応完了
- ✅ **Playwright自動テスト**: 機能テストと比較テスト実装

### 🔄 **実装中の項目**
- 🔄 **トップナビゲーション**: メニュー構成の設計中
- 🔄 **3Dビューポート機能拡張**: カメラコントロール改善中

### 🚨 **新発見ナレッジ**

#### **1. Tweakpane 4.0.1のAPIの変更点**
Tweakpane 4.0.1では、APIが大幅に変更されています。主な変更点は以下の通りです：

```typescript
// 従来のTweakpane
pane.addInput(guiState, 'propertyName', options);

// Tweakpane 4.0.1
pane.addBinding(guiState, 'propertyName', options);
```

この変更に対応するためには、`TweakpaneGUI.tsx`と`CascadeGUIHandlers.ts`の両方のファイルで、すべての`addInput`メソッドを`addBinding`に変更する必要がありました。

#### **2. Monaco EditorのWebWorker設定**
Monaco Editorを正しく動作させるには、専用のWebWorkerを設定する必要があります。以下のエラーが発生した場合：

```
Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes.
You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker
```

解決方法は以下の通りです：

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
CDNからワーカーファイルを読み込むことで、簡単に問題を解決できます。

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

## 1. CascadeStudioLayout最新実装

### 1.1 Monaco Editor統合とワーカー設定

```typescript
// components/layout/CascadeStudioLayout.tsx の重要部分
function createCodeEditorComponent(container: any) {
  // エディターコンテナ作成
  const editorContainer = document.createElement('div');
  editorContainer.style.height = '100%';
  editorContainer.style.width = '100%';
  editorContainer.style.backgroundColor = '#1e1e1e';
  container.element.appendChild(editorContainer);
  
  // Monaco Editorのワーカー設定 - 重要！
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
  
  // モナコエディターを動的にインポートして初期化
  import('monaco-editor').then(monaco => {
    // URLから読み込んだコードまたはデフォルトを使用
    const initialCode = lastSavedCodeRef.current || STARTER_CODE;
    
    // モナコエディター初期化
    const editor = monaco.editor.create(editorContainer, {
      value: initialCode,
      language: 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: true },
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      scrollBeyondLastLine: false,
    });
    
    // エディター参照を保存
    editorRef.current = editor;
    
    // F5キーとCtrl+Sのキーバインド設定
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // コード評価を実行
      const code = editor.getValue();
      evaluateCode(code);
    });
    
    editor.addCommand(monaco.KeyCode.F5, () => {
      // コード評価を実行
      const code = editor.getValue();
      evaluateCode(code);
    });
    
    // ワーカーが準備できたら、初期コードを評価
    if (isWorkerReady) {
      setTimeout(() => {
        appendConsoleMessage('🚀 初期コードを評価します...', 'info');
        evaluateCode(initialCode);
      }, 1000);
    }
  });
}
```

### 1.2 CADワーカー連携機能

```typescript
// コードを評価する関数を更新
const evaluateCode = (code: string) => {
  appendConsoleMessage('🔄 コード評価を開始します...', 'info');
  
  // CADワーカーにコードを送信
  if (isWorkerReady) {
    executeCADCode(code, guiState)
      .then(() => {
        appendConsoleMessage('✅ コード評価を送信しました', 'success');
        
        // URLに状態を保存
        saveStateToURL(code, guiState);
      })
      .catch(err => {
        appendConsoleMessage(`❌ コード評価に失敗: ${err.message}`, 'error');
      });
  } else {
    appendConsoleMessage('❌ CADワーカーが初期化されていません', 'error');
  }
};
```

## 2. Tweakpane 4.0.1対応の詳細実装

### 2.1 TweakpaneGUI.tsx

```typescript
// components/gui/TweakpaneGUI.tsx 内のGUI要素追加部分
const addBasicGUIElements = useCallback((pane: any) => {
  try {
    // Evaluate ボタン
    pane.addButton({
      title: 'Evaluate',
      label: '🔄 Evaluate'
    }).on('click', () => {
      console.log('🎯 [TweakpaneGUI] Evaluate button clicked');
      handleGUIUpdate(guiState);
    });

    // Mesh Settings フォルダ
    const meshResFolder = pane.addFolder({
      title: 'Mesh Settings'
    });

    // Mesh Resolution スライダー
    meshResFolder.addBinding(guiState, 'MeshRes', {
      min: 0.01,
      max: 1.0,
      step: 0.01,
      label: 'Resolution'
    }).on('change', (ev: any) => {
      updateGUIState('MeshRes', ev.value);
    });

    // Cache チェックボックス
    meshResFolder.addBinding(guiState, 'Cache?', {
      label: 'Cache'
    }).on('change', (ev: any) => {
      updateGUIState('Cache?', ev.value);
    });
    
    // ... 他のGUI要素
  } catch (error) {
    console.error('❌ [TweakpaneGUI] Failed to add GUI elements:', error);
  }
}, [guiState, handleGUIUpdate, updateGUIState]);
```

### 2.2 CascadeGUIHandlers.ts

```typescript
// lib/gui/cascadeGUIHandlers.ts 内のSlider追加メソッド
addSlider(name: string, defaultValue: number, min: number, max: number, step: number = 0.1): number {
  if (!this.pane || !this.dynamicFolder) {
    console.warn(`🚨 [CascadeGUIHandlers] Cannot add slider '${name}': Pane not initialized`);
    return defaultValue;
  }
  
  // 既存のGUI状態を更新
  this.guiState[name] = defaultValue;
  
  try {
    // Tweakpane入力コントロール追加（v4.0.1ではaddBindingを使用）
    this.dynamicFolder.addBinding(this.guiState, name, {
      min,
      max,
      step
    }).on('change', (ev: any) => {
      this.updateGUIState(name, ev.value);
    });
    
    console.log(`✅ [CascadeGUIHandlers] Added slider: ${name} (${defaultValue}, ${min}-${max})`);
  } catch (error) {
    console.error(`❌ [CascadeGUIHandlers] Failed to add slider '${name}':`, error);
  }
  
  return defaultValue;
}
```

## 3. 3Dビューポート実装

### 3.1 CascadeViewport.tsx

```typescript
// components/threejs/CascadeViewport.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { CADShape } from '@/types/worker';
import * as THREE from 'three';

interface CascadeViewportProps {
  shapes: CADShape[];
  viewSettings?: {
    groundPlane?: boolean;
    grid?: boolean;
    axes?: boolean;
    ambientLight?: boolean;
    ambientLightIntensity?: number;
    backgroundColor?: string;
  };
}

// ... ShapeMesh, SceneSetup コンポーネント

export default function CascadeViewport({ 
  shapes = [], 
  viewSettings = {
    groundPlane: true,
    grid: true,
    axes: true,
    ambientLight: true,
    ambientLightIntensity: 0.5,
    backgroundColor: '#2d3748'
  }
}: CascadeViewportProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas shadows gl={{ antialias: true }}
        style={{ background: viewSettings.backgroundColor || '#2d3748' }}
      >
        <SceneSetup viewSettings={viewSettings} />
        
        {/* CADシェイプを表示 */}
        {shapes.map((shape, i) => (
          <ShapeMesh key={i} shape={shape} />
        ))}
      </Canvas>
    </div>
  );
}
```

## 4. 次の実装ステップ

### 4.1 トップナビゲーション実装計画（2025年6月9日〜10日）

トップナビゲーションの実装には以下のコンポーネントを作成します：

```typescript
// components/layout/CascadeStudioNavbar.tsx (計画)
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CascadeStudioNavbarProps {
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onExportSTL: () => void;
  onExportSTEP: () => void;
}

export default function CascadeStudioNavbar({
  onNewProject,
  onSaveProject,
  onLoadProject,
  onExportSTL,
  onExportSTEP
}: CascadeStudioNavbarProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  return (
    <nav className="bg-gray-900 text-white h-10 flex items-center px-4">
      <div className="text-blue-400 font-bold mr-8">CascadeStudio</div>
      
      {/* ファイルメニュー */}
      <div className="relative">
        <button 
          className="px-3 py-1 hover:bg-gray-700 rounded"
          onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
        >
          ファイル
        </button>
        
        {isFileMenuOpen && (
          <div className="absolute top-8 left-0 bg-gray-800 rounded shadow-lg w-48 z-50">
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                onNewProject();
                setIsFileMenuOpen(false);
              }}
            >
              新規プロジェクト
            </button>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                onSaveProject();
                setIsFileMenuOpen(false);
              }}
            >
              保存
            </button>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                onLoadProject();
                setIsFileMenuOpen(false);
              }}
            >
              読み込み
            </button>
          </div>
        )}
      </div>
      
      {/* エクスポートメニュー */}
      <div className="relative ml-4">
        <button 
          className="px-3 py-1 hover:bg-gray-700 rounded"
          onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
        >
          エクスポート
        </button>
        
        {isExportMenuOpen && (
          <div className="absolute top-8 left-0 bg-gray-800 rounded shadow-lg w-48 z-50">
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                onExportSTL();
                setIsExportMenuOpen(false);
              }}
            >
              STLファイル
            </button>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700"
              onClick={() => {
                onExportSTEP();
                setIsExportMenuOpen(false);
              }}
            >
              STEPファイル
            </button>
          </div>
        )}
      </div>
      
      {/* ヘルプリンク */}
      <div className="ml-auto">
        <Link href="/docs" className="px-3 py-1 hover:bg-gray-700 rounded">
          ヘルプ
        </Link>
      </div>
    </nav>
  );
}
```

### 4.2 3Dビューポート機能拡張計画（2025年6月11日〜13日）

3Dビューポートの機能拡張には以下の機能を追加します：

1. **カメラコントロールの拡張**
   - フロント、トップ、サイド、アイソメトリック視点の切り替え
   - カメラリセット機能
   - フィット機能（モデルにカメラをフィット）

2. **表示モード切り替え**
   - ソリッド表示
   - ワイヤーフレーム表示
   - 半透明表示

3. **パフォーマンス最適化**
   - インスタンス化による大量モデル表示の最適化
   - 視錐台カリング
   - LOD（Level of Detail）実装

### 4.3 最終機能統合計画（2025年6月14日〜15日）

1. **エラーハンドリングの強化**
   - CADワーカーでのエラー検出と詳細なエラーメッセージ
   - UI側でのエラー表示改善
   - リカバリーメカニズム

2. **パフォーマンス最適化**
   - レンダリングパイプラインの最適化
   - キャッシュシステムの改善
   - 非同期処理の最適化

3. **テスト強化**
   - エンドツーエンドテストの追加
   - 性能テストの追加
   - クロスブラウザテスト

## 5. 完了予定

**完全コピー完成予定日**: 2025年6月15日

完成後はNext.js版CascadeStudioとして公開し、元のCascadeStudioからのスムーズな移行パスを提供します。 