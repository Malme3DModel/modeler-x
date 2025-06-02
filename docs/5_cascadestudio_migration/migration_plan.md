# CascadeStudio機能移行計画書

## 1. プロジェクト概要

### 現在の本アプリ
- **フレームワーク**: Next.js 14 + TypeScript
- **3Dライブラリ**: React Three Fiber + Three.js v0.160.0
- **CADカーネル**: opencascade.js v2.0.0-beta
- **UIフレームワーク**: TailwindCSS + DaisyUI + Monaco Editor
- **主要機能**: 完全なCADエディター環境

### CascadeStudio
- **フレームワーク**: Vanilla JavaScript + HTML
- **3Dライブラリ**: Three.js v0.129.0（直接利用）
- **CADカーネル**: opencascade.js v0.1.15
- **UIフレームワーク**: Golden Layout + Monaco Editor + Tweakpane
- **主要機能**: 完全なCADエディター環境

## 2. CascadeStudioの主要機能分析

### 2.1 コアアーキテクチャ
```
CascadeStudio/
├── メインページ (CascadeMain.js)
│   ├── Golden Layout（ウィンドウシステム）
│   ├── Monaco Editor（コードエディター + TypeScript Intellisense）
│   └── Three.js 3Dビューポート（CascadeView.js）
│
├── CADワーカー（WebWorker）
│   ├── 標準ライブラリ（951行の関数群）
│   ├── シェイプ→メッシュ変換
│   ├── ファイルI/O（STEP/STL/OBJ）
│   └── OpenCascade.js統合
│
└── ユーティリティ
    ├── GUI要素（スライダー、チェックボックス等）
    ├── プロジェクト保存/読込
    └── URL状態管理
```

### 2.2 Next.js式アーキテクチャ（目標構成）
```
本アプリ（Next.js式）/
├── app/
│   ├── cad-editor/          # CADエディターページ
│   │   ├── page.tsx         # メインエディターページ
│   │   └── layout.tsx       # エディター専用レイアウト
│   └── api/
│       └── cad/             # CAD関連API
│           ├── evaluate/    # コード評価エンドポイント
│           └── files/       # ファイルI/O エンドポイント
│
├── components/
│   ├── cad/                 # CAD専用コンポーネント
│   │   ├── CodeEditor.tsx   # Monaco Editorコンポーネント
│   │   ├── CADViewport.tsx  # 3Dビューポート
│   │   ├── GUIControls.tsx  # スライダー等のGUI要素
│   │   └── ProjectManager.tsx # プロジェクト管理
│   ├── threejs/             # Three.js関連（既存）
│   └── ui/                  # 共通UI（既存）
│
├── lib/
│   ├── cad/                 # CAD関連ライブラリ
│   │   ├── StandardLibrary.ts    # CAD標準ライブラリ
│   │   ├── ShapeToMesh.ts        # 形状→メッシュ変換
│   │   ├── FileIO.ts             # ファイルI/O
│   │   └── WorkerManager.ts      # WebWorker管理
│   └── opencascade/         # OpenCascade.js関連
│
├── hooks/
│   ├── useCADWorker.ts      # CADワーカー管理フック
│   ├── useCodeEditor.ts     # コードエディター管理
│   ├── useCADProject.ts     # プロジェクト状態管理
│   └── useOpenCascade.ts    # OpenCascade統合（既存）
│
├── public/
│   ├── workers/             # WebWorkerファイル
│   │   ├── cadWorker.js     # メインCADワーカー
│   │   └── cadWorker.d.ts   # TypeScript定義
│   ├── fonts/               # 3Dテキスト用フォント
│   └── textures/            # マテリアル用テクスチャ
│
└── types/
    ├── cad.ts               # CAD関連型定義
    ├── opencascade.ts       # OpenCascade型定義
    └── worker.ts            # WebWorker型定義
```

### 2.3 標準ライブラリ関数群
#### プリミティブ作成
- `Box()`, `Sphere()`, `Cylinder()`, `Cone()`
- `Polygon()`, `Circle()`, `BSpline()`
- `Text3D()` - フォント解析による3Dテキスト

#### ブール演算
- `Union()`, `Difference()`, `Intersection()`
- エラーハンドリングとfuzzValue対応

#### 変形操作
- `Translate()`, `Rotate()`, `Scale()`, `Mirror()`
- `Transform()` - 複合変形

#### 高度なCAD操作
- `Extrude()`, `Revolve()`, `Loft()`, `Pipe()`
- `FilletEdges()`, `ChamferEdges()`
- `Offset()`, `RotatedExtrude()`

#### GUI要素
- `Slider()`, `Button()`, `Checkbox()`
- `TextInput()`, `Dropdown()`
- リアルタイム更新対応

#### ファイルI/O
- STEP/IGES/STL インポート/エクスポート
- プロジェクト保存（コード + レイアウト + ファイル）

### 2.4 Three.js統合
- カスタムMatcap材質
- エッジハイライト機能
- レイキャスティングによるピッキング
- 影とライティング
- グリッドと地面メッシュ
- OrbitControls統合

## 3. 本アプリとの機能比較

| 機能カテゴリ | 本アプリ | CascadeStudio | 移行優先度 |
|------------|----------|---------------|------------|
| 基本3D表示 | ✅ | ✅ | - |
| OpenCascade.js統合 | ✅（基本） | ✅（完全） | 高 |
| CAD標準ライブラリ | ❌ | ✅ | 高 |
| コードエディター | ⚠️（Monaco予定） | ✅ | 高 |
| ファイルI/O | ❌ | ✅ | 中 |
| GUI要素 | ❌ | ✅ | 中 |
| プロジェクト管理 | ❌ | ✅ | 低 |
| WebWorker対応 | ❌ | ✅ | 高 |

## 4. 移行計画（Next.js式実装）

### フェーズ1: コア機能実装（優先度: 高）
#### 1.1 WebWorkerアーキテクチャ
```typescript
// hooks/useCADWorker.ts
export function useCADWorker() {
  const worker = useRef<Worker>();
  const [shapes, setShapes] = useState<any[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  
  useEffect(() => {
    worker.current = new Worker('/workers/cadWorker.js');
    worker.current.onmessage = handleWorkerMessage;
    return () => worker.current?.terminate();
  }, []);
}

// public/workers/cadWorker.js
importScripts('/opencascade.js');
// CascadeStudioのCADWorker機能をWebWorker化
```

#### 1.2 標準ライブラリ移植（Next.js式）
```typescript
// lib/cad/StandardLibrary.ts
export class CADStandardLibrary {
  constructor(private oc: any) {}
  
  // プリミティブ関数群
  Box(x: number, y: number, z: number, centered?: boolean): any {
    if (!centered) centered = false;
    
    const box = new this.oc.BRepPrimAPI_MakeBox(x, y, z).Shape();
    if (centered) {
      return this.Translate([-x / 2, -y / 2, -z / 2], box);
    }
    return box;
  }
  
  Sphere(radius: number): any {
    const spherePlane = new this.oc.gp_Ax2(
      new this.oc.gp_Pnt(0, 0, 0), 
      this.oc.gp.prototype.DZ()
    );
    return new this.oc.BRepPrimAPI_MakeSphere(spherePlane, radius).Shape();
  }
  
  // ... 他のCascadeStudio関数を移植
}
```

#### 1.3 Three.js統合改良（React Three Fiber式）
```typescript
// components/cad/CADViewport.tsx
export function CADViewport() {
  const { shapes, highlightedShape } = useCADWorker();
  
  return (
    <Canvas shadows camera={{ position: [50, 100, 150] }}>
      {/* CascadeStudioのライティング設定を移植 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 50, -12]} castShadow />
      
      {/* グリッドと地面 */}
      <Grid />
      <GroundPlane />
      
      {/* CAD形状表示 */}
      <Suspense fallback={null}>
        {shapes.map((shape, index) => (
          <CADShape 
            key={index} 
            shape={shape} 
            highlighted={highlightedShape === index}
          />
        ))}
      </Suspense>
      
      <OrbitControls target={[0, 45, 0]} />
    </Canvas>
  );
}
```

### フェーズ2: エディター機能（優先度: 高）
#### 2.1 Monaco Editorコンポーネント（Next.js式）
```typescript
// components/cad/CodeEditor.tsx
'use client';

import { Editor } from '@monaco-editor/react';
import { useCADProject } from '@/hooks/useCADProject';

export function CodeEditor() {
  const { code, updateCode, evaluateCode } = useCADProject();
  
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={code}
        onChange={updateCode}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
        }}
        onMount={setupIntellisense}
      />
    </div>
  );
}
```

#### 2.2 レイアウトシステム（TailwindCSS + DaisyUI式）
```typescript
// app/cad-editor/page.tsx
export default function CADEditorPage() {
  return (
    <div className="h-screen flex">
      {/* サイドバー */}
      <div className="w-80 bg-base-200">
        <div className="h-1/2 border-b">
          <CodeEditor />
        </div>
        <div className="h-1/2">
          <GUIControls />
        </div>
      </div>
      
      {/* メインビューポート */}
      <div className="flex-1">
        <CADViewport />
      </div>
    </div>
  );
}
```

### フェーズ3: 高度な機能（優先度: 中）
#### 3.1 ファイルI/O（Next.js API Routes）
```typescript
// app/api/cad/files/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // STEPファイル処理ロジック
  const result = await processSTEPFile(file);
  return Response.json(result);
}

// lib/cad/FileIO.ts
export class CADFileIO {
  static async importSTEP(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/cad/files', {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
```

#### 3.2 GUI要素システム（React + DaisyUI式）
```typescript
// components/cad/GUIControls.tsx
export function CADSlider({ 
  name, 
  value, 
  min, 
  max, 
  onChange 
}: SliderProps) {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{name}</span>
        <span className="label-text-alt">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary"
      />
    </div>
  );
}
```

### フェーズ4: プロジェクト管理（優先度: 低）
#### 4.1 プロジェクト保存/読込（Next.js式）
```typescript
// hooks/useCADProject.ts
export function useCADProject() {
  const [project, setProject] = useState<CADProject>();
  
  const saveProject = useCallback(async () => {
    const projectData = {
      code,
      guiState,
      importedFiles,
      timestamp: new Date().toISOString(),
    };
    
    // ローカルストレージまたはAPIに保存
    localStorage.setItem('cad-project', JSON.stringify(projectData));
  }, [code, guiState, importedFiles]);
  
  return { project, saveProject, loadProject };
}
```

## 5. 技術的な課題と解決策

### 5.1 OpenCascade.jsバージョン活用
- **利点**: 本アプリは最新版（v2.0.0-beta）を使用
- **解決策**: 
  1. 最新APIの活用
  2. パフォーマンス改善の享受
  3. CascadeStudioの関数を最新版に適応

### 5.2 React Three Fiber統合
- **利点**: 宣言的な3D描画とReactとの親和性
- **解決策**: 
  1. CascadeStudioのCascadeView.jsをR3Fコンポーネントに変換
  2. drei libraryの活用
  3. Suspenseによる非同期ローディング

### 5.3 Next.jsでのWebWorker
- **解決策**:
  1. `public/workers/`に配置
  2. dynamic importでSSR回避
  3. TypeScript型定義の追加

### 5.4 MonacoエディターのNext.js統合
- **解決策**:
  1. `@monaco-editor/react`使用
  2. `'use client'`ディレクティブ
  3. 動的インポートでバンドルサイズ最適化

## 6. 実装スケジュール

### Week 1-2: フェーズ1実装
- [ ] WebWorkerアーキテクチャ構築（Next.js式）
- [ ] 基本標準ライブラリ移植（TypeScript化）
- [ ] React Three Fiber統合改良

### Week 3-4: フェーズ2実装
- [ ] Monaco EditorのNext.js統合
- [ ] TailwindCSS + DaisyUIレイアウト
- [ ] TypeScript Intellisense設定

### Week 5-6: フェーズ3実装
- [ ] Next.js API RoutesでファイルI/O
- [ ] React化されたGUI要素
- [ ] 高度なCAD操作関数

### Week 7-8: フェーズ4実装
- [ ] Next.js式プロジェクト管理
- [ ] URLパラメーター状態管理
- [ ] 最終テストと最適化

## 7. 成功指標

### 7.1 基本機能
- [ ] CascadeStudioのサンプルコードが動作する
- [ ] Next.js環境での3D形状生成・表示・操作
- [ ] Monaco EditorがNext.jsで正常動作

### 7.2 高度機能
- [ ] React Three Fiberでの高度な3D表示
- [ ] TailwindCSS + DaisyUIでの美しいUI
- [ ] TypeScriptによる型安全なCAD操作

### 7.3 Next.js特有の利点
- [ ] SSR/SSGでの高速初期表示
- [ ] App Routerによる最適化されたルーティング
- [ ] API Routesでのサーバーサイド処理

## 8. リスク要因と対策

### 8.1 技術的リスク
- **WebWorkerのNext.js統合**: プロトタイプで事前検証
- **Monaco EditorのSSR**: `'use client'`とdynamic importで対応
- **React Three Fiberでの複雑な3D処理**: 段階的移行

### 8.2 パフォーマンス
- **対策**: 
  1. WebWorkerでメインスレッド保護
  2. React.memoとuseMemoで最適化
  3. Three.jsオブジェクトの適切なdispose

### 8.3 開発効率
- **対策**: 
  1. TypeScript型定義の充実
  2. Storybookでコンポーネント開発
  3. Jest/Vitestでのテスト環境

この計画により、Next.js 14の最新機能を活用しながら、OpenCascadeの思想に基づいた完全なCADエディター環境を構築できます。

## 9. 計画書管理方針（リビングドキュメント）

### 9.1 計画書更新の基本方針
この計画書は**リビングドキュメント**として管理し、実装中に発見された問題や方針変更を継続的に反映していきます。

#### 更新タイミング
- 技術的制約や問題の発見時
- 実装方針の変更時
- 新しい解決策の発見時
- 優先度やスケジュールの見直し時

#### 更新方法
1. **問題発生時**: 即座に課題を記録
2. **解決策確定時**: 対応方法と影響範囲を更新
3. **方針変更時**: 変更理由と新方針を明記
4. **実装完了時**: 成果と次フェーズへの影響を記録

### 9.2 想定される方針変更パターン

#### 技術的制約の発見
- WebWorkerの制限事項
- Monaco EditorのNext.js統合問題
- React Three Fiberの性能問題
- OpenCascade.jsの制限や不具合

#### 依存関係の問題
- OpenCascade.jsバージョン互換性
- Three.jsライブラリ競合
- 新しいライブラリの発見
- パッケージサイズの問題

#### 設計変更の必要性
- UIレイアウトの最適化
- データフロー設計の改善
- パフォーマンス要件の変更
- セキュリティ要件の追加

#### 優先度の見直し
- 機能実装順序の変更
- MVP範囲の調整
- リリーススケジュールの変更
- ユーザー要件の変更

## 10. 実装進捗と課題記録

### 10.1 進捗記録フォーマット
```markdown
### [YYYY-MM-DD] [タイプ]: [タイトル]
- **状況**: 発生した問題や変更内容
- **原因**: 問題の根本原因
- **解決策**: 採用した解決方法
- **影響**: プロジェクトへの影響範囲
- **更新箇所**: 計画書の該当セクション
- **次のアクション**: 必要な追加対応
```

### 10.2 課題レベル分類
- 🔴 **クリティカル**: プロジェクト全体に影響する重大な問題
- 🟡 **重要**: 特定フェーズに大きな影響がある問題
- 🔵 **軽微**: 局所的な調整や改善が必要な問題
- ✅ **解決済み**: 対応完了した課題

### 10.3 実装記録
*※実装開始後、ここに進捗と課題を記録していきます*

<!-- 記録例:
### [2024-01-15] 🟡 問題発生: Monaco EditorのSSR問題
- **状況**: Next.js App RouterでのMonaco Editor初期化時にSSRエラー
- **原因**: サーバーサイドでのDOM操作とwindowオブジェクトアクセス
- **解決策**: dynamic importとSuspenseの組み合わせ + 'use client'ディレクティブ
- **影響**: フェーズ2の実装方針変更、初期化タイミングの調整が必要
- **更新箇所**: 5.4節の解決策詳細化、4.2.1のコード例修正
- **次のアクション**: 他のクライアントサイド専用ライブラリの調査
-->

## 11. 意思決定記録

### 11.1 主要な技術選択
| 項目 | 選択肢 | 決定 | 理由 | 日付 |
|------|--------|------|------|------|
| 3Dライブラリ | Three.js直接 vs React Three Fiber | React Three Fiber | Reactとの親和性、宣言的記述 | 計画時 |
| エディター | Monaco vs CodeMirror | Monaco | TypeScript Intellisense、VSCode互換 | 計画時 |
| レイアウト | Golden Layout vs カスタム | TailwindCSS+DaisyUI | Next.js親和性、軽量性 | 計画時 |
| WebWorker配置 | /workers vs /public/workers | /public/workers | Next.js標準、静的配信 | 計画時 |

### 11.2 設計原則
1. **Next.js思想の優先**: Next.jsのベストプラクティスに従う
2. **TypeScript徹底**: すべてのコードをTypeScript化
3. **段階的移行**: 既存機能を壊さず段階的に拡張
4. **パフォーマンス重視**: WebWorkerとReact最適化を活用
5. **保守性確保**: コードの可読性と拡張性を重視

## 12. 参考資料

### 12.1 CascadeStudio関連
- [CascadeStudio公式リポジトリ](https://github.com/zalo/CascadeStudio)
- [OpenCascade.js公式ドキュメント](https://github.com/donalffons/opencascade.js)
- [CascadeStudio標準ライブラリ](./docs/template/js/CADWorker/CascadeStudioStandardLibrary.js)

### 12.2 技術スタック
- [Next.js 14 App Router](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [TailwindCSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)

### 12.3 実装参考
- [Next.js WebWorker実装例](https://nextjs.org/docs/pages/building-your-application/optimizing/web-workers)
- [React Three Fiber CAD例](https://github.com/pmndrs/drei)
- [Monaco Editor TypeScript設定](https://microsoft.github.io/monaco-editor/playground.html) 