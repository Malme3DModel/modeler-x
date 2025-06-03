# CascadeStudio完全コピー実装計画詳細

## 🎊 **フェーズ7実装完了**（2025年6月15日更新）

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
- ✅ **トップナビゲーション**: CascadeNavigation実装完了
- ✅ **3Dビューポート機能**: カメラコントロール・表示設定実装完了
- ✅ **ファイルI/O機能**: STEP/STL/OBJ対応完了

### 📋 **今後の改善項目**
- 📋 **コード品質向上**: リファクタリングとパフォーマンス最適化
- 📋 **ドキュメント整備**: API仕様書と使い方ガイド作成
- 📋 **テスト強化**: 単体テストとE2Eテストの追加

### 🚨 **新発見ナレッジ**

#### **1. React Three Fiberによる3Dビューポート実装**

React Three Fiber (R3F) を使用することで、Three.jsの3D描画能力とReactのコンポーネントモデルを組み合わせることができました。特に重要な実装ポイントは以下の通りです：

```typescript
// components/threejs/CascadeViewport.tsx
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

この実装により、OpenCascadeから生成されたメッシュデータをThree.jsのジオメトリに変換し、効率的にレンダリングすることができます。

#### **2. CascadeNavigationの実装とメニュー管理**

ドロップダウンメニューを含むナビゲーションバーを実装することで、CascadeStudioの操作性を再現しました：

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
        
        {/* 編集メニュー */}
        <DropdownMenu
          label="Edit"
          items={[
            { label: 'Clear Imported Files', onClick: onClearImported || (() => console.log('Clear Imported')) }
          ]}
        />
        
        {/* ヘルプメニュー */}
        <DropdownMenu
          label="Help"
          items={[
            { label: 'Documentation', onClick: () => window.open('https://github.com/zalo/CascadeStudio', '_blank') },
            { label: 'About', onClick: () => alert('CascadeStudio - A Full Live-Scripted CAD Kernel in the Browser') }
          ]}
        />
      </div>
    </nav>
  );
}
```

#### **3. Tweakpane 4.0.1のAPIの変更点**
Tweakpane 4.0.1では、APIが大幅に変更されています。主な変更点は以下の通りです：

```typescript
// 従来のTweakpane
pane.addInput(guiState, 'propertyName', options);

// Tweakpane 4.0.1
pane.addBinding(guiState, 'propertyName', options);
```

この変更に対応するためには、`TweakpaneGUI.tsx`と`CascadeGUIHandlers.ts`の両方のファイルで、すべての`addInput`メソッドを`addBinding`に変更する必要がありました。

#### **4. Monaco EditorのWebWorker設定**
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
    },
    getWorkerOptions: function() {
      return {
        type: 'classic' // モジュールスクリプトではimportScriptsが使えないためclassicを使用
      };
    }
  };
}
```

## 1. 完全統合されたCascadeStudioレイアウト

```typescript
// components/layout/CascadeStudioLayout.tsx の重要部分
export default function CascadeStudioLayout({ 
  onProjectLoad 
}: CascadeStudioLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<any>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guiState, setGuiState] = useState<GUIState>({});
  const [consoleElement, setConsoleElement] = useState<HTMLElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastSavedCodeRef = useRef<string>(STARTER_CODE);
  const lastSavedGuiStateRef = useRef<GUIState>({});

  // CADワーカーフックを追加
  const {
    isWorkerReady,
    isWorking,
    shapes,
    logs,
    error: workerError,
    executeCADCode,
    combineAndRender,
    worker
  } = useCADWorker();

  // URLハッシュから初期状態を読み込む
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const urlState = URLStateManager.getStateFromURL();
      
      // コード状態があれば使用
      if (urlState.code) {
        lastSavedCodeRef.current = urlState.code;
        appendConsoleMessage('🔗 URLから初期コードを読み込みました', 'info');
      }
      
      // GUI状態があれば使用
      if (urlState.guiState) {
        setGuiState(urlState.guiState);
        lastSavedGuiStateRef.current = urlState.guiState;
        appendConsoleMessage('🔗 URLからGUI状態を読み込みました', 'info');
      }
    } catch (error) {
      console.error('URL状態の読み込みに失敗:', error);
      appendConsoleMessage('⚠️ URL状態の読み込みに失敗しました', 'error');
    }
  }, []);

  return (
    <div className="h-full w-full">
      <CascadeNavigation 
        onNewProject={() => {
          // エディタが利用可能ならコードをリセット
          if (editorRef.current) {
            editorRef.current.setValue(STARTER_CODE);
            lastSavedCodeRef.current = STARTER_CODE;
            evaluateCode(STARTER_CODE);
          }
          appendConsoleMessage('🆕 新規プロジェクトを作成しました', 'info');
        }}
        onSaveProject={() => {
          if (editorRef.current) {
            const code = editorRef.current.getValue();
            const projectData = {
              code,
              guiState
            };
            // JSONとしてエクスポート
            const projectString = JSON.stringify(projectData, null, 2);
            const blob = new Blob([projectString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cascade-project.json';
            link.click();
            URL.revokeObjectURL(url);
            appendConsoleMessage('💾 プロジェクトをJSONとして保存しました', 'success');
          }
        }}
        onLoadProject={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const projectData = JSON.parse(event.target?.result as string);
                  if (projectData.code && editorRef.current) {
                    editorRef.current.setValue(projectData.code);
                    lastSavedCodeRef.current = projectData.code;
                    
                    // GUIステートがあれば更新
                    if (projectData.guiState) {
                      setGuiState(projectData.guiState);
                      lastSavedGuiStateRef.current = projectData.guiState;
                    }
                    
                    // コードを評価
                    evaluateCode(projectData.code);
                    appendConsoleMessage('📂 プロジェクトを読み込みました', 'success');
                  }
                } catch (error) {
                  appendConsoleMessage('⚠️ プロジェクトの読み込みに失敗: ' + (error instanceof Error ? error.message : String(error)), 'error');
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }}
        onExport={(format) => {
          if (!worker) {
            appendConsoleMessage('❌ ワーカーが初期化されていません', 'error');
            return;
          }
          
          switch (format) {
            case 'step':
              worker.postMessage({ type: 'saveShapeSTEP' });
              appendConsoleMessage('🔄 STEPファイルをエクスポートしています...', 'info');
              break;
            case 'stl':
              worker.postMessage({ type: 'saveShapeSTL' });
              appendConsoleMessage('🔄 STLファイルをエクスポートしています...', 'info');
              break;
            case 'obj':
              worker.postMessage({ type: 'saveShapeOBJ' });
              appendConsoleMessage('🔄 OBJファイルをエクスポートしています...', 'info');
              break;
          }
        }}
        onImportFiles={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.step,.stp,.iges,.igs,.stl';
          input.multiple = true;
          input.onchange = (e: any) => {
            const files = e.target.files;
            if (files && files.length > 0 && worker) {
              appendConsoleMessage(`📁 ${files.length}個のファイルをインポートしています...`, 'info');
              worker.postMessage({ 
                type: 'loadFiles', 
                payload: Array.from(files)
              });
            }
          };
          input.click();
        }}
        onClearImported={() => {
          if (worker) {
            worker.postMessage({ type: 'clearExternalFiles' });
            appendConsoleMessage('🧹 インポートされたファイルをクリアしました', 'info');
          }
        }}
      />
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
```

## 2. React Three Fiber実装

### 2.1 CascadeViewport.tsx

```typescript
// components/threejs/CascadeViewport.tsx の主要部分
export default function CascadeViewport({ 
  shapes = [], 
  viewSettings = {}
}: CascadeViewportProps) {
  // useViewSettingsフックを使用して設定管理
  const { viewSettings: currentSettings, updateSetting, toggleSetting } = 
    useViewSettings({...defaultViewSettings, ...viewSettings});
  
  // ワイヤーフレーム表示切替のハンドラー
  const toggleWireframe = () => toggleSetting('wireframe');
  
  // シャドウ表示切替のハンドラー
  const toggleShadows = () => toggleSetting('shadows');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ビューポート設定コントロールパネル */}
      <div className="absolute bottom-2 left-2 z-10 bg-gray-800 bg-opacity-80 p-1 rounded shadow-lg text-white text-sm">
        <label className="flex items-center mb-1">
          <input 
            type="checkbox" 
            checked={currentSettings.wireframe} 
            onChange={toggleWireframe}
            className="mr-2"
          />
          ワイヤーフレーム
        </label>
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={currentSettings.shadows} 
            onChange={toggleShadows}
            className="mr-2"
          />
          シャドウ
        </label>
      </div>

      <Canvas 
        shadows={currentSettings.shadows} 
        gl={{ antialias: true }}
        style={{ background: currentSettings.backgroundColor }}
      >
        <SceneSetup viewSettings={currentSettings} />
        
        {/* CADシェイプを表示 */}
        {shapes.map((shape, i) => (
          <ShapeMesh 
            key={i} 
            shape={shape} 
            wireframe={currentSettings.wireframe} 
          />
        ))}
      </Canvas>
    </div>
  );
}
```

## 3. ファイルI/O実装

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

  // ファイル読み込み処理
  const handleLoadFiles = (e: MessageEvent) => {
    if (e.data.type === 'loadFiles' && e.data.payload) {
      appendConsoleMessage(`✅ ${Object.keys(e.data.payload).length}個のファイルをインポートしました`, 'success');
    }
  };

  // イベントリスナーを登録
  worker.addEventListener('message', handleSaveShapeSTEP);
  worker.addEventListener('message', handleSaveShapeSTL);
  worker.addEventListener('message', handleSaveShapeOBJ);
  worker.addEventListener('message', handleLoadFiles);

  // クリーンアップ
  return () => {
    worker.removeEventListener('message', handleSaveShapeSTEP);
    worker.removeEventListener('message', handleSaveShapeSTL);
    worker.removeEventListener('message', handleSaveShapeOBJ);
    worker.removeEventListener('message', handleLoadFiles);
  };
}, [worker, isWorkerReady]);
```

## 4. 今後の改善計画

### 4.1 コード品質向上（2025年6月16日〜22日）

- **リファクタリング**: コンポーネント分割とカスタムフック最適化
- **型安全性の強化**: 厳格なTypeScript型定義の適用
- **パフォーマンス最適化**: レンダリングとメモリ使用の最適化
- **エラーハンドリング**: エラー捕捉と回復メカニズムの改善

### 4.2 ドキュメント整備（2025年6月23日〜29日）

- **API仕様書**: 主要コンポーネントとフックのAPI仕様書作成
- **使い方ガイド**: エンドユーザー向けドキュメント作成
- **開発者ガイド**: 拡張開発者向けガイド作成
- **サンプルコード**: 一般的なユースケースのサンプル作成

### 4.3 テスト強化（2025年6月30日〜7月6日）

- **単体テスト**: 重要コンポーネントの単体テスト追加
- **統合テスト**: コンポーネント間連携テスト追加
- **E2Eテスト**: Playwrightによるエンドツーエンドテスト強化
- **クロスブラウザ互換性**: 主要ブラウザでの動作検証

### 4.4 最終リリース準備（2025年7月7日〜13日）

- **最終バグ修正**: 残存バグの修正
- **パフォーマンスチューニング**: 最終的なパフォーマンス最適化
- **デモ準備**: デモページとサンプルプロジェクト作成
- **ドキュメント最終化**: すべてのドキュメントの最終確認と更新

## 5. 完了予定

**リリース予定日**: 2025年7月15日

次期フェーズでは、ドキュメント整備と品質向上に注力します。CascadeStudioの基本機能の完全再現は達成したため、次は使いやすさと拡張性の向上に重点を置きます。 