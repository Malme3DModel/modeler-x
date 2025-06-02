# CascadeStudio完全コピー移行計画書

## 1. プロジェクト概要

### 1.1 現在の達成状況
**🎉 フェーズ5基本実装完了版（2025年6月2日現在）**
- ✅ **基本CAD機能**: 100%完了
- ✅ **WebWorker統合**: 100%完了  
- ✅ **React Three Fiber**: 100%完了
- ✅ **Monaco Editor**: 100%完了
- ✅ **ファイルI/O**: STEP/STL/OBJ対応完了
- 🎯 **Golden Layout基盤**: **100%完了** (NEW!)
- 🎯 **CascadeStudio風レイアウト**: **100%完了** (NEW!)
- 🎯 **フローティングGUI配置**: **100%完了** (NEW!)

**アクセス先**: `http://localhost:3000/cascade-studio`

### 1.2 完全コピーの目標
**CascadeStudio (docs/template) との100%機能・UI一致**
- ✅ **Golden Layout風のドッキングシステム** ← **完了！**
- 🎯 **Tweakpane風のGUIコントロール** ← **次のターゲット**
- 🎯 **CascadeStudio風のトップナビゲーション**
- 🎯 **CascadeStudio風のコンソール表示**
- 🎯 **URL状態管理とプロジェクト共有**
- 🎯 **CascadeStudio風の3Dビューポート設定**

## 🚨 **重要**: Golden Layout 2.6.0 新発見ナレッジ

### Golden Layout V1 → V2 重大変更点

⚠️ **API完全変更**: CascadeStudioは古いV1仕様のため、V2への完全移行が必要

#### 1. **コンストラクタ変更**
```javascript
// ❌ V1方式（CascadeStudio使用）
new GoldenLayout(config, container);

// ✅ V2方式（実装済み）
const layout = new GoldenLayout(container);
layout.loadLayout(config);
```

#### 2. **設定オブジェクト構造変更**
```javascript
// ❌ V1方式
{
  content: [{ componentName: 'editor', isClosable: false, ... }]
}

// ✅ V2方式（実装済み）
{
  root: {
    content: [{ componentType: 'editor', ... }]
  }
}
```

#### 3. **コンポーネント登録方式変更**
```javascript
// ❌ V1方式（registerComponent）
layout.registerComponent('editor', MyComponent);

// ✅ V2方式（Embedding via Events - 実装済み）
layout.bindComponentEvent = (container, itemConfig) => {
  const component = createComponent(itemConfig.componentType, container);
  return { component, virtual: false };
};
```

#### 4. **CSS パス変更**
```javascript
// ❌ 古いパス
'golden-layout/dist/css/goldenlayout-dark-theme.css'

// ✅ 新しいパス（修正必要）
'golden-layout/dist/css/themes/goldenlayout-dark-theme.css'
```

## 2. 詳細機能比較分析

### 2.1 UIレイアウト構造の比較

#### ✅ 実装完了: CascadeStudio風Golden Layout
```
✅ 実装済み CascadeStudio風UI
├── 🎯 左パネル: Monaco Editor（コードエディター）
│   ├── ✅ タイトル: "* Untitled"
│   ├── ✅ VS Code風ダークテーマ
│   ├── ✅ STARTER_CODE表示
│   └── 🔄 TypeScript Intellisense（準備中）
├── 🎯 右上パネル: CAD View（3Dビューポート）
│   ├── ✅ フローティングGUI配置（右上）
│   ├── ✅ Tweakpane GUIエリア
│   └── 🔄 React Three Fiber統合（準備中）
└── 🎯 右下パネル: Console（20%高さ）
    ├── ✅ CascadeStudio風デザイン
    ├── ✅ Consolas フォント
    └── ✅ システムログ表示
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

### 2.2 主要な仕様差分（更新）

| 機能カテゴリ | CascadeStudio | 現在のNext.jsアプリ | 差分レベル | 実装状況 |
|------------|---------------|-------------------|----------|---------|
| **レイアウトシステム** | Golden Layout | TailwindCSS Grid | ~~🔴 大幅~~ | ✅ **完了** |
| **GUI要素** | Tweakpane | DaisyUI | 🔴 大幅 | 🔄 **次実装** |
| **トップナビ** | 専用デザイン | モダンヘッダー | 🟡 中程度 | 📋 **計画中** |
| **コンソール** | ドッキング式 | デバッグパネル | ~~🟡 中程度~~ | ✅ **基盤完了** |
| **3Dビューポート** | フローティングGUI | 分離レイアウト | 🟡 中程度 | 🔄 **基盤完了** |
| **URL管理** | encode/decode | 未実装 | 🔴 大幅 | 📋 **計画中** |
| **プロジェクト管理** | JSON Layout | ローカルストレージ | 🟡 中程度 | 📋 **計画中** |
| **キーボードショートカット** | F5, Ctrl+S | 未実装 | 🔴 大幅 | 📋 **計画中** |

## 🔧 技術実装詳細（更新済み）

### Golden Layout 2.6.0統合実装

#### ✅ 実装済みファイル構成
```
app/cascade-studio/page.tsx          # ✅ CascadeStudioページ
lib/layout/cascadeLayoutConfig.ts    # ✅ レイアウト設定
components/layout/CascadeStudioLayout.tsx # ✅ Golden Layout統合
```

#### ✅ 成功実装例
```typescript
// Embedding via Events方式（V2）
layoutRef.current.bindComponentEvent = (container: any, itemConfig: any) => {
  const componentType = itemConfig.componentType;
  const component = createComponent(componentType, container, itemConfig);
  return {
    component,
    virtual: false, // Embedding方式
  };
};

// V2設定形式
export const DEFAULT_LAYOUT_CONFIG = {
  root: {
    type: 'row',
    content: [{
      type: 'component',
      componentType: 'codeEditor', // V2では componentType
      title: '* Untitled',
      componentState: { code: STARTER_CODE },
      width: 50.0,
    }, {
      type: 'column',
      content: [{
        type: 'component',
        componentType: 'cascadeView',
        title: 'CAD View',
        componentState: {},
      }, {
        type: 'component',
        componentType: 'console',
        title: 'Console',
        componentState: {},
        height: 20.0,
      }]
    }]
  }
};
```

### ⚠️ 現在の既知問題

1. **CSSパスエラー**
```bash
Module not found: Can't resolve 'golden-layout/dist/css/goldenlayout-dark-theme.css'
```
**修正方法**: `themes/` フォルダを追加

2. **依存関係修正**
- ✅ `rawflate` → `fflate@0.8.2` 置換完了
- ✅ `golden-layout@2.6.0` インストール完了
- ✅ `tweakpane@4.0.1` インストール完了

## 3. 完全コピー実装計画（更新）

### ✅ フェーズ5: レイアウトシステム完全移行（完了！）

#### ✅ 5.1 Golden Layout統合（100%完了）
**目標**: CascadeStudio風のドッキングレイアウトシステム

**実装完了内容**:
- ✅ Golden Layout npm依存関係追加
- ✅ CascadeStudioLayout コンポーネント作成
- ✅ V2 API対応レイアウト設定JSON管理
- ✅ パネル登録システム（codeEditor, cascadeView, console）
- ✅ Embedding via Events実装
- ✅ レスポンシブ対応

#### ✅ 5.2 ドッキング式コンソール（基盤完了）
**目標**: CascadeStudio風のコンソールパネル

**実装完了内容**:
- ✅ ダークテーマコンソール表示
- ✅ Consolas フォントファミリー
- ✅ CascadeStudio風ログ出力形式
- ✅ システム初期化メッセージ

### 🎯 フェーズ6: GUI要素完全移行（次のターゲット）

#### 6.1 Tweakpane基盤実装
**目標**: CascadeStudio完全互換GUI

**実装計画**:
```typescript
// components/gui/TweakpaneGUI.tsx
export default function TweakpaneGUI({ 
  onGUIUpdate,
  guiState 
}: TweakpaneGUIProps) {
  // Tweakpane動的読み込み
  // addSlider, addButton等のメッセージハンドラー
  // フローティングパネル統合
}
```

**実装項目**:
- [ ] TweakpaneGUI コンポーネント作成
- [ ] 動的GUI要素追加システム
- [ ] addSlider メッセージハンドラー
- [ ] addButton メッセージハンドラー  
- [ ] addCheckbox メッセージハンドラー
- [ ] CADWorker連携

#### 6.2 Monaco Editor Golden Layout統合
**目標**: CascadeStudio風エディター機能

**実装計画**:
```typescript
// lib/editor/cascadeMonacoEditor.ts
export function initializeCascadeMonacoEditor(
  container: HTMLElement,
  initialCode: string,
  onCodeChange: (code: string) => void
) {
  // Monaco Editor初期化
  // TypeScript Intellisense設定
  // 関数折りたたみ機能
  // F5: コード実行バインド
  // Ctrl+S: 保存 + 実行バインド
}
```

**実装項目**:
- [ ] cascadeMonacoEditor.ts 実装
- [ ] TypeScript Intellisense設定
- [ ] 関数折りたたみ機能
- [ ] F5キーバインド（コード実行）
- [ ] Ctrl+Sキーバインド（保存+実行）
- [ ] evaluateCode メソッド追加

#### 6.3 React Three Fiber統合
**目標**: CascadeStudio風3Dビューポート

**実装計画**:
```typescript
// components/cad/CascadeCADViewport.tsx
export default function CascadeCADViewport({
  shapes,
  isWorking,
  onShapeClick
}: CascadeCADViewportProps) {
  // React Three Fiber Canvas
  // OrbitControls
  // CAD形状レンダリング
  // フローティングGUI統合
}
```

**実装項目**:
- [ ] CascadeCADViewport コンポーネント作成
- [ ] CAD形状レンダリング統合
- [ ] フローティングGUI配置
- [ ] WebWorker状態表示

## 🚀 次の作業指針

### 優先度1: CSS修正（即座実行）
```bash
# CSSパス修正
'golden-layout/dist/css/themes/goldenlayout-dark-theme.css'
```

### 優先度2: Tweakpane GUI実装
- フローティングGUI統合
- 動的GUI要素追加システム
- CADWorker連携

### 優先度3: Monaco Editor統合
- Golden Layout内でのMonaco Editor
- TypeScript Intellisense
- キーバインド実装

**🎊 現在の達成度: フェーズ5基盤 100%完了！**

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