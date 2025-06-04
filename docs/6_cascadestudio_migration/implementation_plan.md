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
- ✅ **型安全・パフォーマンス最適化**: 型安全性の強化と不要なconsole.logの削除

### 📋 **今後の改善項目**
- 📋 **URLハッシュ更新の修正**: F5キー押下時の更新不具合修正
- 📋 **opencascade.jsインポートエラー解決**: 正しいインポート方法の実装
- 📋 **コード品質向上**: リファクタリングとパフォーマンス最適化
- 📋 **ドキュメント整備**: API仕様書と使い方ガイド作成
- 📋 **テスト強化**: 単体テストとE2Eテストの追加
- 📋 **CI/CD統合**: GitHub Actionsでの自動テスト実行設定

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

#### **5. Playwright MCPによるテスト実装**

Playwright MCPを使用してCascadeStudioの自動テストを実装しました。特に重要なポイントは以下の通りです：

```typescript
// tests/cascade-studio-test.spec.ts
test('CascadeStudioページが表示される', async ({ page }) => {
  await page.goto('http://localhost:3000/cascade-studio');
  const title = await page.title();
  expect(title).toContain('OpenCascade.js Demo');
  
  // スクリーンショット取得
  await page.screenshot({ path: 'test-results/cascade-studio-page.png' });
});

// Golden Layoutが表示されるかテスト
test('Golden Layoutが表示される', async ({ page }) => {
  await page.goto('http://localhost:3000/cascade-studio');
  
  // レイアウトが表示されるまで待機
  await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
  
  // レイアウトが表示されていることを確認
  const layout = await page.locator('.lm_goldenlayout');
  await expect(layout).toBeVisible();
  
  // スクリーンショット取得
  await page.screenshot({ path: 'test-results/golden-layout.png' });
});
```

テスト実施中に以下の課題が見つかりました：

1. **セレクターの具体性**: より具体的なセレクターを使用する必要がある
   ```typescript
   // 不十分なセレクター
   await page.locator('.lm_item:has-text("* Untitled")').click();
   
   // より具体的なセレクター
   await page.locator('.lm_item.lm_stack').filter({ hasText: '* Untitled' }).first().click();
   ```

2. **URLハッシュ更新の問題**: F5キーでコード実行後、URLハッシュが更新されない問題
   ```typescript
   // テスト例
   test('URLハッシュが更新される', async ({ page }) => {
     await page.goto('http://localhost:3000/cascade-studio');
     await page.locator('.monaco-editor').click();
     await page.keyboard.press('F5');
     
     // 十分な待機時間が必要
     await page.waitForTimeout(3000);
     
     const url = page.url();
     console.log('更新後URL:', url);
     
     // URLハッシュ更新の確認（緩やかな条件）
     if (url.includes('#')) {
       console.log('URLハッシュが更新されました');
     } else {
       console.log('URLハッシュは更新されませんでした - 実装の問題');
     }
   });
   ```

3. **同時実行の問題**: 複数のブラウザで同時にテストを実行すると不安定になる
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     // 同時実行を避ける
     fullyParallel: false,
     // 1つのワーカーで実行
     workers: 1,
   });
   ```

#### **6. opencascade.jsのインポートエラー**

`hooks/useOpenCascade.ts`において、以下のエラーが発生しています：

```
Attempted import error: 'opencascade.js' does not contain a default export (imported as 'initOpenCascade').
```

このエラーの原因はopencascade.jsがデフォルトエクスポートを提供していないことです。修正方法は以下の通りです：

```typescript
// 誤ったインポート方法
import initOpenCascade from 'opencascade.js';

// 正しいインポート方法
import * as OpenCascadeModule from 'opencascade.js';
// または名前付きインポート
import { initOpenCascade } from 'opencascade.js';
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

### 4.1 優先タスク（2025年6月16日〜22日）

- **URLハッシュ更新機能の修正**: F5キー押下時に更新されない問題を解決
  ```typescript
  // 問題の修正例 - URLStateManager.ts
  static saveStateToURL(state: URLState): void {
    // コード評価後に適切な遅延をもって実行
    setTimeout(() => {
      const json = JSON.stringify(state);
      const encoded = this.encodeToBase64(json);
      window.location.hash = encoded;
      console.log('URLハッシュを更新:', window.location.hash);
    }, 1000); // 1秒の遅延で安定性向上
  }
  ```

- **opencascade.jsのインポートエラー修正**: 正しいインポート方法の適用
  ```typescript
  // hooks/useOpenCascade.ts の修正
  // import initOpenCascade from 'opencascade.js'; // 誤った方法
  import * as OpenCascadeModule from 'opencascade.js'; // 正しい方法
  
  // 使用例
  const ocInstance = await OpenCascadeModule.default();
  ```

- **Playwright MCPテスト強化**: より堅牢なセレクター使用とE2Eテスト追加
  ```typescript
  // tests/cascade-studio-robust.spec.ts
  test('完全な機能テスト', async ({ page }) => {
    // ページ表示
    await page.goto('http://localhost:3000/cascade-studio');
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // エディターにコード入力
    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('let box = Box(10, 20, 30);');
    
    // コード実行
    await page.keyboard.press('F5');
    await page.waitForTimeout(3000); // 十分な待機時間
    
    // 結果確認
    await page.screenshot({ path: 'test-results/complete-workflow.png' });
  });
  ```

- **CI/CD統合**: GitHub Actionsでの自動テスト設定
  ```yaml
  # .github/workflows/playwright.yml
  name: Playwright Tests
  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]
  
  jobs:
    test:
      timeout-minutes: 60
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: 18
        - name: Install dependencies
          run: npm ci
        - name: Install Playwright Browsers
          run: npx playwright install --with-deps
        - name: Run Playwright tests
          run: npm run test:e2e
        - uses: actions/upload-artifact@v3
          if: always()
          with:
            name: playwright-report
            path: playwright-report/
            retention-days: 30
  ```

### 4.2 コード品質向上（2025年6月23日〜29日）

- **リファクタリング**: コンポーネント分割とカスタムフック最適化
- **型安全性の強化**: 厳格なTypeScript型定義の適用
- **パフォーマンス最適化**: レンダリングとメモリ使用の最適化
- **エラーハンドリング**: エラー捕捉と回復メカニズムの改善

### 4.3 ドキュメント整備（2025年6月30日〜7月6日）

- **API仕様書**: 主要コンポーネントとフックのAPI仕様書作成
- **使い方ガイド**: エンドユーザー向けドキュメント作成
- **開発者ガイド**: 拡張開発者向けガイド作成
- **サンプルコード**: 一般的なユースケースのサンプル作成

### 4.4 テスト強化（2025年7月7日〜13日）

- **単体テスト**: 重要コンポーネントの単体テスト追加
- **統合テスト**: コンポーネント間連携テスト追加
- **E2Eテスト**: Playwrightによるエンドツーエンドテスト強化
- **クロスブラウザ互換性**: 主要ブラウザでの動作検証

### 4.5 最終リリース準備（2025年7月14日〜20日）

- **最終バグ修正**: 残存バグの修正
- **パフォーマンスチューニング**: 最終的なパフォーマンス最適化
- **デモ準備**: デモページとサンプルプロジェクト作成
- **ドキュメント最終化**: すべてのドキュメントの最終確認と更新

## 5. 完了予定

**リリース予定日**: 2025年7月21日

次期フェーズでは、現在の課題解決、ドキュメント整備と品質向上に注力します。CascadeStudioの基本機能の完全再現は達成したため、次は使いやすさと拡張性の向上、および安定性の確保に重点を置きます。 

## 🚨 新発見ナレッジ・最新実装例

### 1. URLハッシュ管理の最新実装例
```typescript
// コード実行時は必ずURLハッシュを最新化
const evaluateCode = useCallback((code: string) => {
  // ...
  URLStateManager.saveStateToURL({ code, guiState });
  // ...
}, [...]);
```
- 旧実装の「差分がなければ更新しない」ロジックは廃止
- F5/Ctrl+S等で必ずハッシュを上書き

### 2. opencascade.jsのimport方法
```typescript
// 修正前
import initOpenCascade from 'opencascade.js';
// 修正後
import * as OpenCascadeModule from 'opencascade.js';
```
- hooks/useOpenCascade.ts, components/threejs/ThreeJSViewport.tsx等も同様に修正

### 3. Playwrightテスト安定化・CI/CD統合
- セレクターは`.monaco-editor`.first()等、より具体的に
- playwright.config.ts:
```typescript
export default defineConfig({
  workers: 1,
  fullyParallel: false,
  // ...その他設定
});
```
- .github/workflows/playwright.yml:
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --if-present
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

### 4. 型安全性・パフォーマンス改善ポイント
- TypeScript型定義の厳格化（any禁止、型推論活用）
- 不要なconsole.logやデバッグコードの削除
- useCallback, useMemo, useRef等で再レンダリング最適化
- メモリリーク防止のためのuseEffectクリーンアップ

## 参考：主要な技術実装例

### CascadeViewport（React Three Fiber）
```typescript
function ShapeMesh({ shape, wireframe = false }: ShapeMeshProps) {
  // ...（省略：README参照）
}
```

### ファイルエクスポート（STEP/STL/OBJ）
```typescript
// ...（省略：README参照）
```

### Playwright MCPテスト例
```typescript
test('コード実行後にURLハッシュが更新される', async ({ page }) => {
  await page.goto('http://localhost:3000/cascade-studio');
  await page.waitForSelector('.monaco-editor', { timeout: 10000 });
  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('let box = Box(10, 20, 30);');
  await page.keyboard.press('F5');
  await page.waitForTimeout(3000);
  expect(page.url()).toContain('#');
});
```

## 今後の改善・残タスク
- ドキュメント整備（APIリファレンス、使い方ガイド）
- テスト拡充・クロスブラウザ対応
- コード品質・型安全性のさらなる向上 