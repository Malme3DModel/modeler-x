# CascadeStudio完全コピー移行計画書

## 1. プロジェクト概要

### 1.1 現在の達成状況
**✅ フェーズ7実装完了（2025年6月15日現在）**
- 主要機能・UIはCascadeStudioと同等
- Playwright MCPによる自動テスト・品質監査が稼働
- CI/CD（GitHub Actions）で自動テスト・監査が実行可能

### 1.2 完全コピーの目標
**CascadeStudio (docs/template) との100%機能・UI一致**
- ✅ **Golden Layout風のドッキングシステム** ← **完了！**
- ✅ **Monaco Editorの機能とキーバインド** ← **完了！**
- ✅ **URL状態管理とプロジェクト共有** ← **完了！**
- ✅ **Tweakpane風のGUIコントロール** ← **完了！**
- ✅ **CascadeStudio風のトップナビゲーション** ← **完了！**
- ✅ **CascadeStudio風の3Dビューポート設定** ← **完了！**
- ✅ **プロジェクト管理とファイルI/O** ← **完了！**

## 🚨 新発見ナレッジ・最新仕様

### 1. F5/コード実行時のURLハッシュ更新仕様
- **F5やCtrl+S等でコード実行時は、内容が同じでも必ずURLハッシュを最新状態に上書きする**
- これにより、Playwright等のE2Eテストで「F5押下→URLハッシュが必ず更新される」ことが保証される
- 旧実装の「差分がなければハッシュを更新しない」ロジックは廃止

### 2. opencascade.jsのimport方法
- `import * as OpenCascadeModule from 'opencascade.js'` で型エラー・importエラーを回避
- 依存箇所（useOpenCascade.ts, ThreeJSViewport.tsx等）も同様に修正

### 3. Playwrightテスト安定化・CI/CD統合
- セレクターは`.monaco-editor`.first()等、より具体的に
- テスト実行時は`workers: 1`・`fullyParallel: false`を明示
- `.github/workflows/playwright.yml`でCI自動化

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
| **自動テスト** | なし | Playwright MCP | 🆕 追加 | ✅ **完了** |

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

### 4. Playwright MCPによるテスト実装

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

## 3. 今後の優先タスク

### 3.1 解決すべき課題
- URLハッシュ更新機能の修正 - F5キー押下時に更新されない問題
- opencascade.jsのインポートエラーの解決
- PlaywrightテストのCI/CD統合

### 3.2 コード品質向上
- コードリファクタリング
- パフォーマンス最適化
- エラーハンドリングの強化

### 3.3 ドキュメント整備
- APIリファレンス作成
- 使い方ガイド作成
- サンプルコード充実

### 3.4 テスト強化
- 単体テスト追加
- エンドツーエンドテスト拡充
- クロスブラウザテスト強化

## 4. 実装スケジュール
1. 現在の課題解決 (1週間)
2. コード品質向上 (1週間)
3. ドキュメント整備 (1週間)
4. テスト強化 (1週間)
5. 最終リリース準備 (1週間) 