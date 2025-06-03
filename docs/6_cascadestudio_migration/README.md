# CascadeStudio完全コピー移行計画書

## 1. プロジェクト概要

### 1.1 現在の達成状況
**✅ フェーズ7実装完了（2025年6月15日現在）**
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
- ✅ **CADワーカー連携**: 100%完了
- ✅ **トップナビゲーション**: 100%完了（CascadeNavigation実装）
- ✅ **3Dビューポート機能**: 100%完了（CascadeViewport実装）
- ✅ **プロジェクト管理**: 100%完了（保存/読み込み機能）
- ✅ **ファイルエクスポート**: 100%完了（STEP/STL/OBJ対応）

**アクセス先**: `http://localhost:3000/cascade-studio`

### 1.2 完全コピーの目標
**CascadeStudio (docs/template) との100%機能・UI一致**
- ✅ **Golden Layout風のドッキングシステム** ← **完了！**
- ✅ **Monaco Editorの機能とキーバインド** ← **完了！**
- ✅ **URL状態管理とプロジェクト共有** ← **完了！**
- ✅ **Tweakpane風のGUIコントロール** ← **完了！**
- ✅ **CascadeStudio風のトップナビゲーション** ← **完了！**
- ✅ **CascadeStudio風の3Dビューポート設定** ← **完了！**
- ✅ **プロジェクト管理とファイルI/O** ← **完了！**

## 🚨 **新発見ナレッジ**

### 1. React Three Fiberとの統合方法

React Three Fiberを使用して3Dビューポートを実装することで、Three.jsのレンダリング能力とReactの宣言的なコンポーネントモデルを組み合わせることができました。主なポイントは以下の通りです：

```typescript
// components/threejs/CascadeViewport.tsx
export default function CascadeViewport({ 
  shapes = [], 
  viewSettings = {}
}: CascadeViewportProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas shadows gl={{ antialias: true }}
        style={{ background: viewSettings.backgroundColor || '#2d3748' }}
      >
        <SceneSetup viewSettings={viewSettings} />
        
        {/* CADシェイプを表示 */}
        {shapes.map((shape, i) => (
          <ShapeMesh key={i} shape={shape} wireframe={viewSettings.wireframe} />
        ))}
      </Canvas>
    </div>
  );
}
```

この実装により、CascadeStudioのCADワーカーから取得したジオメトリデータをThree.jsのジオメトリに変換し、効率的に表示することができます。

### 2. CascadeNavigationの実装方法

Golden Layoutの上部にナビゲーションバーを実装することで、CascadeStudioの操作感を再現しました：

```typescript
// components/layout/CascadeNavigation.tsx
export default function CascadeNavigation({
  onExport,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onImportFiles,
  onClearImported
}: NavigationProps) {
  // ...
  
  return (
    <nav className="flex items-center justify-between p-2 bg-gray-900 text-white shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-4">Cascade Studio</h1>
        
        {/* ファイルメニュー */}
        <DropdownMenu
          label="File"
          items={[
            { label: 'New Project', onClick: onNewProject || (() => console.log('New Project')) },
            { label: 'Save Project', onClick: onSaveProject || (() => console.log('Save Project')) },
            { label: 'Load Project', onClick: onLoadProject || (() => console.log('Load Project')) },
            { label: 'Import STEP/IGES/STL', onClick: handleFileImport }
          ]}
        />
        
        {/* エクスポートメニュー */}
        <DropdownMenu
          label="Export"
          items={[
            { label: 'Export STEP', onClick: () => onExport ? onExport('step') : console.log('Export STEP') },
            { label: 'Export STL', onClick: () => onExport ? onExport('stl') : console.log('Export STL') },
            { label: 'Export OBJ', onClick: () => onExport ? onExport('obj') : console.log('Export OBJ') }
          ]}
        />
        
        {/* その他のメニュー... */}
      </div>
    </nav>
  );
}
```

### 3. Tweakpane 4.0.1の対応方法

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

### 4. Monaco EditorのWebWorkerの設定方法

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
    },
    // ワーカーオプションを提供する関数（classicタイプで作成）
    getWorkerOptions: function() {
      return {
        type: 'classic' // モジュールスクリプトではimportScriptsが使えないためclassicを使用
      };
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

### 5. URL状態管理とBase64エンコーディング

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
│   ├── ✅ React Three Fiber統合
│   ├── ✅ カメラコントロール
│   └── ✅ 表示設定（ワイヤーフレーム、グリッド、軸表示）
├── ✅ 右下パネル: Console（20%高さ）
│   ├── ✅ CascadeStudio風デザイン
│   ├── ✅ Consolas フォント
│   └── ✅ システムログ表示
└── ✅ トップナビゲーション
    ├── ✅ ファイルメニュー（新規、保存、読み込み）
    ├── ✅ エクスポートメニュー（STEP、STL、OBJ）
    └── ✅ 編集メニュー（インポートファイルクリア）
```

### 2.2 主要な仕様差分（更新）

| 機能カテゴリ | CascadeStudio | 現在のNext.jsアプリ | 差分レベル | 実装状況 |
|------------|---------------|-------------------|----------|---------|
| **レイアウトシステム** | Golden Layout | Golden Layout V2 | ✅ 完了 | ✅ **完了** |
| **GUI要素** | Tweakpane | Tweakpane 4.0.1 | ✅ 完了 | ✅ **完了** |
| **エディター** | Monaco Editor | Monaco Editor | ✅ 完了 | ✅ **完了** |
| **コンソール** | ドッキング式 | ドッキング式 | ✅ 完了 | ✅ **完了** |
| **URL管理** | encode/decode | Base64 Encode/Decode | ✅ 完了 | ✅ **完了** |
| **トップナビ** | 専用デザイン | CascadeNavigation | ✅ 完了 | ✅ **完了** |
| **3Dビューポート** | フローティングGUI | React Three Fiber | ✅ 完了 | ✅ **完了** |
| **プロジェクト管理** | JSON Layout | JSON保存/読み込み | ✅ 完了 | ✅ **完了** |
| **ファイルI/O** | STEP/STL | STEP/STL/OBJ | ✅ 完了 | ✅ **完了** |

## 🔧 技術実装詳細（最新情報）

### 1. CascadeViewport実装

```typescript
// components/threejs/CascadeViewport.tsx の重要部分
function ShapeMesh({ shape, wireframe = false }: ShapeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!shape) return;

    // メッシュの設定
    if (shape.mesh && meshRef.current) {
      const { vertices, normals, indices } = shape.mesh;
      
      if (vertices && indices) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        if (normals) {
          geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        } else {
          geometry.computeVertexNormals();
        }
        
        geometry.setIndex(Array.from(indices));
        
        meshRef.current.geometry.dispose();
        meshRef.current.geometry = geometry;
      }
    }

    // エッジの設定
    if (shape.edges && edgesRef.current) {
      const { vertices } = shape.edges;
      
      if (vertices) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        edgesRef.current.geometry.dispose();
        edgesRef.current.geometry = geometry;
      }
    }
  }, [shape]);

  return (
    <>
      {/* CADメッシュ */}
      {shape.mesh && (
        <mesh ref={meshRef} castShadow receiveShadow>
          <bufferGeometry />
          <meshStandardMaterial 
            color="#6b9bd7" 
            roughness={0.5} 
            metalness={0.5}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      )}

      {/* CADエッジ */}
      {shape.edges && (
        <lineSegments ref={edgesRef}>
          <bufferGeometry />
          <lineBasicMaterial color="#000000" linewidth={1} />
        </lineSegments>
      )}
    </>
  );
}
```

### 2. CascadeNavigation実装

```typescript
// components/layout/CascadeNavigation.tsx の重要部分
export default function CascadeNavigation({
  onExport,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onImportFiles,
  onClearImported
}: NavigationProps) {
  return (
    <nav className="flex items-center justify-between p-2 bg-gray-900 text-white shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-4">Cascade Studio</h1>
        
        {/* ファイルメニュー */}
        <DropdownMenu
          label="File"
          items={[
            { label: 'New Project', onClick: onNewProject || (() => console.log('New Project')) },
            { label: 'Save Project', onClick: onSaveProject || (() => console.log('Save Project')) },
            { label: 'Load Project', onClick: onLoadProject || (() => console.log('Load Project')) },
            { label: 'Import STEP/IGES/STL', onClick: handleFileImport }
          ]}
        />
        
        {/* エクスポートメニュー */}
        <DropdownMenu
          label="Export"
          items={[
            { label: 'Export STEP', onClick: () => onExport ? onExport('step') : console.log('Export STEP') },
            { label: 'Export STL', onClick: () => onExport ? onExport('stl') : console.log('Export STL') },
            { label: 'Export OBJ', onClick: () => onExport ? onExport('obj') : console.log('Export OBJ') }
          ]}
        />
        
        {/* その他のメニュー... */}
      </div>
    </nav>
  );
}
```

### 3. ファイルエクスポート実装

```typescript
// ワーカーメッセージハンドラーを追加
useEffect(() => {
  if (!worker || !isWorkerReady) return;

  // STEPファイルエクスポート処理
  const handleSaveShapeSTEP = (e: MessageEvent) => {
    if (e.data.type === 'saveShapeSTEP' && e.data.payload) {
      const stepContent = e.data.payload;
      const blob = new Blob([stepContent], { type: 'model/step' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cascade-model.step';
      link.click();
      URL.revokeObjectURL(url);
      appendConsoleMessage('✅ STEPファイルをエクスポートしました', 'success');
    }
  };

  // STLファイルエクスポート処理
  const handleSaveShapeSTL = (e: MessageEvent) => {
    if (e.data.type === 'saveShapeSTL' && e.data.payload) {
      const stlContent = e.data.payload;
      const blob = new Blob([stlContent], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cascade-model.stl';
      link.click();
      URL.revokeObjectURL(url);
      appendConsoleMessage('✅ STLファイルをエクスポートしました', 'success');
    }
  };

  // OBJファイルエクスポート処理
  const handleSaveShapeOBJ = (e: MessageEvent) => {
    if (e.data.type === 'saveShapeOBJ' && e.data.payload) {
      const objContent = e.data.payload;
      const blob = new Blob([objContent], { type: 'model/obj' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cascade-model.obj';
      link.click();
      URL.revokeObjectURL(url);
      appendConsoleMessage('✅ OBJファイルをエクスポートしました', 'success');
    }
  };

  // イベントリスナーを登録
  worker.addEventListener('message', handleSaveShapeSTEP);
  worker.addEventListener('message', handleSaveShapeSTL);
  worker.addEventListener('message', handleSaveShapeOBJ);

  // クリーンアップ
  return () => {
    worker.removeEventListener('message', handleSaveShapeSTEP);
    worker.removeEventListener('message', handleSaveShapeSTL);
    worker.removeEventListener('message', handleSaveShapeOBJ);
  };
}, [worker, isWorkerReady]);
```

## 3. 今後の優先タスク

### 3.1 コード品質向上
- コードリファクタリング
- パフォーマンス最適化
- エラーハンドリングの強化

### 3.2 ドキュメント整備
- APIリファレンス作成
- 使い方ガイド作成
- サンプルコード充実

### 3.3 テスト強化
- 単体テスト追加
- エンドツーエンドテスト拡充
- クロスブラウザテスト強化

## 4. 実装スケジュール
1. コード品質向上 (1週間)
2. ドキュメント整備 (1週間)
3. テスト強化 (1週間)
4. 最終リリース準備 (1週間) 