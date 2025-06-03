# CascadeStudio完全コピー移行計画書

## 1. プロジェクト概要

### 1.1 現在の達成状況
**�� フェーズ6実装進行中（2025年6月8日現在）**
- ✅ **基本CAD機能**: 100%完了
- ✅ **WebWorker統合**: 100%完了  
- ✅ **React Three Fiber**: 100%完了
- ✅ **Monaco Editor**: 100%完了
- ✅ **ファイルI/O**: STEP/STL/OBJ対応完了
- ✅ **Golden Layout基盤**: 100%完了
- ✅ **CascadeStudio風レイアウト**: 100%完了
- ✅ **フローティングGUI配置**: 100%完了
- ✅ **Monaco編集機能**: 100%完了（F5/Ctrl+Sキーバインド実装）
- ✅ **URL状態管理**: 100%完了（Base64エンコード実装）
- ✅ **Playwright自動テスト**: 100%完了
- ✅ **Tweakpane GUI統合**: 100%完了（Tweakpane 4.0.1対応）
- 🔄 **CADワーカー連携**: 90%完了（通信基盤実装済、評価機能強化済）

**アクセス先**: `http://localhost:3000/cascade-studio`

### 1.2 完全コピーの目標
**CascadeStudio (docs/template) との100%機能・UI一致**
- ✅ **Golden Layout風のドッキングシステム** ← **完了！**
- ✅ **Monaco Editorの機能とキーバインド** ← **完了！**
- ✅ **URL状態管理とプロジェクト共有** ← **完了！**
- ✅ **Tweakpane風のGUIコントロール** ← **完了！**
- 🔄 **CascadeStudio風のトップナビゲーション** ← **次ターゲット**
- 🔄 **CascadeStudio風の3Dビューポート設定** ← **次ターゲット**

## 🚨 **新発見ナレッジ**

### 1. Tweakpane 4.0.1の対応方法

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

### 2. Monaco EditorのWebWorkerの設定方法

Monaco Editorを正しく動作させるには、専用のWebWorkerを設定する必要があります。これは特に次のエラーを解決するために重要です：

```
Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes.
You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker
```

#### 解決方法：

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

そして、`public/monaco-editor-workers/`ディレクトリに以下のワーカーファイルを作成します：

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

### 3. URL状態管理とBase64エンコーディング

#### 実装の基本概念
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

## 2. 詳細機能比較分析

### 2.1 UIレイアウト構造の比較

#### ✅ 実装完了: CascadeStudio風Golden Layout
```
✅ 実装済み CascadeStudio風UI
├── ✅ 左パネル: Monaco Editor（コードエディター）
│   ├── ✅ タイトル: "* Untitled"
│   ├── ✅ VS Code風ダークテーマ
│   ├── ✅ STARTER_CODE表示
│   ├── ✅ F5キー実行機能
│   └── ✅ Ctrl+Sキー保存＆実行機能
├── ✅ 右上パネル: CAD View（3Dビューポート）
│   ├── ✅ フローティングGUI配置（右上）
│   ├── ✅ Tweakpane GUIエリア
│   └── ✅ React Three Fiber統合（基本実装完了）
└── ✅ 右下パネル: Console（20%高さ）
    ├── ✅ CascadeStudio風デザイン
    ├── ✅ Consolas フォント
    └── ✅ システムログ表示
```

### 2.2 主要な仕様差分（更新）

| 機能カテゴリ | CascadeStudio | 現在のNext.jsアプリ | 差分レベル | 実装状況 |
|------------|---------------|-------------------|----------|---------|
| **レイアウトシステム** | Golden Layout | Golden Layout V2 | ✅ 完了 | ✅ **完了** |
| **GUI要素** | Tweakpane | Tweakpane 4.0.1 | ✅ 完了 | ✅ **完了** |
| **エディター** | Monaco Editor | Monaco Editor | ✅ 完了 | ✅ **完了** |
| **コンソール** | ドッキング式 | ドッキング式 | ✅ 完了 | ✅ **完了** |
| **URL管理** | encode/decode | Base64 Encode/Decode | ✅ 完了 | ✅ **完了** |
| **トップナビ** | 専用デザイン | 未実装 | 🔴 大幅 | 📋 **計画中** |
| **3Dビューポート** | フローティングGUI | 分離レイアウト | 🔄 中程度 | 🔄 **実装中** |
| **プロジェクト管理** | JSON Layout | ローカルストレージ | 🟡 中程度 | 📋 **計画中** |

## 🔧 技術実装詳細（最新情報）

### 1. Monaco Editor統合実装と課題解決

```typescript
// CascadeStudioLayout.tsx 内のMonacoエディター初期化関数
function createCodeEditorComponent(container: any) {
  // エディターコンテナ作成
  const editorContainer = document.createElement('div');
  editorContainer.style.height = '100%';
  editorContainer.style.width = '100%';
  editorContainer.style.backgroundColor = '#1e1e1e';
  container.element.appendChild(editorContainer);
  
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
  });
}
```

### 2. Tweakpane 4.0.1対応実装

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

### 3. CascadeGUIHandlers実装改善

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

## 3. 今後の優先タスク

### 3.1 トップナビゲーション実装
- CascadeStudio風のトップナビゲーションバーを実装
- ファイル操作メニュー（新規作成、保存、ロード）の追加
- エクスポート機能（STEP, STL）の統合

### 3.2 3Dビューポート機能拡張
- カメラコントロールの改善（ズーム、パン、回転）
- 視点プリセット（フロント、トップ、サイド、アイソメトリック）
- 表示設定（ワイヤーフレーム、シェーディングモード）

### 3.3 最終機能統合
- エラーハンドリングの強化
- パフォーマンス最適化
- ドキュメント整備

## 4. 実装スケジュール
1. トップナビゲーション実装 (2日)
2. 3Dビューポート機能拡張 (3日)
3. 最終機能統合とテスト (2日)
4. ドキュメント整備 (1日) 