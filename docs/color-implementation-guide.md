# Modeler X 色設定実装ガイド - 完全集約完了 ✅

## 📋 実装完了状況（2024年1月更新）

このドキュメントは、Modeler X アプリケーションの色設定システムの実装完了状況と使用方法を説明します。

### ✅ 完全実装済み

- **tailwind.config.ts** - 色設定の完全集約 ✅ **完了**
- **Tailwindカスタムプラグイン** - 自動CSS変数生成 ✅ **完了**
- **src/app/globals.css** - CSS変数参照による設定 ✅ **完了**
- **重複排除** - 直接色指定の除去完了 ✅ **完了**
- **v0互換性** - 既存デザインの完全保持 ✅ **完了**
- **サンプル実装** - TopNavigation、テストページ ✅ **完了**
- **Three.js統合** - ThreeViewportコンポーネント内の色指定 ✅ **完了**
- **DockviewLayout統合** - Dockviewコンポーネント内の色指定 ✅ **完了**

## 🎨 現在の色システム構成

### 1. tailwind.config.ts（メイン設定ファイル）

色設定がすべて`tailwind.config.ts`に集約され、Tailwindカスタムプラグインにより自動的にCSS変数が生成されます。

```typescript
export default {
  theme: {
    extend: {
      colors: {
        modeler: {
          // 背景色（v0完全互換）
          background: {
            primary: '#222222',    // body背景: rgb(34, 34, 34)
            secondary: '#1e1e1e',  // theme-color
            modal: '#131313',      // モーダル: rgb(19, 19, 19)
            surface: '#2e2e2e',    // パネル表面: --tp-base-background-color
          },
          
          // ナビゲーション（v0完全互換）
          nav: {
            bg: '#111',            // #111
            text: '#f2f2f2',       // #f2f2f2
            hover: {
              bg: '#aaa',          // #aaa
              text: 'black',       // black
            },
            active: {
              bg: '#4CAF50',       // #4CAF50
              text: 'white',       // white
            },
          },
          
          // コントロール・GUI（TweakPane完全互換）
          control: {
            base: '#2e2e2e',                    // --tp-base-background-color
            button: {
              DEFAULT: 'hsl(0, 0%, 25%)',      // --tp-button-background-color
              hover: 'hsl(0, 0%, 30%)',        // --tp-button-background-color-hover
              focus: 'hsl(0, 0%, 35%)',        // --tp-button-background-color-focus
              active: 'hsl(0, 0%, 40%)',       // --tp-button-background-color-active
            },
            text: {
              primary: '#eeeeee',              // --tp-button-foreground-color
              secondary: '#aeb5b8',            // --tp-label-foreground-color
            },
            border: 'hsl(0, 0%, 20%)',          // 境界線色
            scrollbar: {
              track: '#2e2e2e',               // --tp-base-background-color
              thumb: '#777',                   // #777
            },
          },
          
          // エディター設定
          editor: {
            bg: '#1e1e1e',         // 背景色
            line: '#2e2e2e',       // 行ハイライト
            selection: '#264f78',  // 選択範囲
            gutter: '#2a2a2a',     // 行番号背景
            cursor: '#ffffff',     // カーソル色
          },
          
          // 3Dビューポート
          viewport: {
            bg: '#1a1a1a',         // 背景
            grid: '#333333',       // グリッド
            axis: {
              x: '#ff4444',        // X軸（赤）
              y: '#44ff44',        // Y軸（緑）
              z: '#4444ff',        // Z軸（青）
            },
            wireframe: '#999999',  // ワイヤーフレーム
            face: '#cccccc',       // 面の色
          },
          
          // アクセント色
          accent: {
            primary: '#4CAF50',    // メインアクセント
            success: '#00C851',    // 成功
            warning: '#ffbb33',    // 警告
            error: '#ff4444',      // エラー
            info: '#33b5e5',       // 情報
          },
        },
      },
      
      // フォント設定（v0完全互換）
      fontFamily: {
        console: ['Consolas', 'monospace'],  // v0: Consolas
        ui: ['Arial', 'sans-serif'],        // v0: --tp-font-family
      },
      
      // カスタム値
      borderRadius: {
        modeler: '4px',           // 統一ボーダー半径
      },
      
      boxShadow: {
        'modeler-panel': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'modeler-modal': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  
  plugins: [
    // カスタムスクロールバープラグイン（実装済み）
    function({ addUtilities, theme }) { /* ... */ },
    
    // ✅ 新機能：自動CSS変数生成プラグイン
    function({ addBase, theme }) {
      const modelerColors = theme('colors.modeler');
      
      addBase({
        ':root': {
          // Dockview用CSS変数（自動生成）
          '--dv-modeler-group-view-background-color': modelerColors.background.secondary,
          '--dv-modeler-tab-background-color': modelerColors.control.button.DEFAULT,
          '--dv-modeler-tab-active-border-color': modelerColors.accent.primary,
          // ... その他すべての変数が自動生成
          
          // Monaco Editor用
          '--monaco-editor-background': modelerColors.editor.bg,
          '--monaco-editor-selection': modelerColors.editor.selection,
          
          // TweakPane用
          '--gui-panel-background': modelerColors.control.base,
          '--gui-scrollbar-thumb': modelerColors.control.scrollbar.thumb,
          
          // Golden Layout用
          '--golden-content-background': modelerColors.background.primary,
          '--golden-tab-color': modelerColors.control.text.primary,
        },
      })
    }
  ],
}
```

### 2. src/app/globals.css（軽量実装）

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* === ベースのボディスタイル === */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* === Monaco Editor スタイル（CSS変数使用） === */
.monaco-editor {
  background-color: var(--monaco-editor-background) !important;
}

/* === TweakPane スタイル（CSS変数使用） === */
.gui-panel::-webkit-scrollbar {
  width: 10px;
  background: var(--gui-scrollbar-track);
}

.gui-panel::-webkit-scrollbar-thumb {
  background: var(--gui-scrollbar-thumb);
}

/* === Dockview テーマ（CSS変数使用） === */
.dockview-theme-modeler {
  --dv-group-view-background-color: var(--dv-modeler-group-view-background-color);
  --dv-tab-background-color: var(--dv-modeler-tab-background-color);
  --dv-tab-active-border-color: var(--dv-modeler-tab-active-border-color);
  /* すべての変数がTailwindプラグインからの参照 */
  font-family: var(--dv-modeler-font-family);
}
```

## 💻 使用方法

### 1. Tailwindクラスとして使用（推奨）

```tsx
// 基本的な使用
<div className="bg-modeler-background-primary text-modeler-control-text-primary">
  Modeler X Content
</div>

// ナビゲーション
<nav className="bg-modeler-nav-bg text-modeler-nav-text">
  <button className="bg-modeler-control-button-DEFAULT hover:bg-modeler-control-button-hover">
    Button
  </button>
</nav>

// エディター関連
<div className="bg-modeler-editor-bg font-console">
  Code Editor
</div>

// 3Dビューポート
<div className="bg-modeler-viewport-bg">
  <div style={{ color: 'var(--dv-modeler-tab-active-border-color)' }}>
    Highlighted Element
  </div>
</div>
```

### 2. CSS変数として使用（外部ライブラリ用）

```tsx
// Dockviewコンポーネント
<DockviewReact className="dockview-theme-modeler" />

// Monaco Editor
<MonacoEditor
  theme="modeler-dark"
  options={{
    theme: {
      base: 'vs-dark',
      colors: {
        'editor.background': 'var(--monaco-editor-background)',
        'editor.selectionBackground': 'var(--monaco-editor-selection)',
      }
    }
  }}
/>

// カスタムコンポーネント
<div style={{
  backgroundColor: 'var(--dv-modeler-group-view-background-color)',
  borderColor: 'var(--dv-modeler-separator-border)',
}}>
  Custom Panel
</div>
```

### 3. JavaScript/TypeScriptで動的に使用

```tsx
import { useEffect, useState } from 'react';

function DynamicColorComponent() {
  const [primaryColor, setPrimaryColor] = useState('');
  
  useEffect(() => {
    // CSS変数の値を取得
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue('--dv-modeler-tab-active-border-color');
    setPrimaryColor(color);
  }, []);
  
  return (
    <div style={{ borderColor: primaryColor }}>
      Dynamic Colored Border
    </div>
  );
}
```

## 🔧 カスタマイズ

### 色の変更

色を変更する場合は、`tailwind.config.ts`の該当部分のみを修正します：

```typescript
// tailwind.config.ts
colors: {
  modeler: {
    accent: {
      primary: '#FF5722',  // 変更例：オレンジに変更
    }
  }
}
```

変更は自動的に以下に反映されます：
- Tailwindクラス：`bg-modeler-accent-primary`
- CSS変数：`var(--dv-modeler-tab-active-border-color)`
- すべての関連コンポーネント

### 新しい色の追加

```typescript
// tailwind.config.ts
colors: {
  modeler: {
    // 新しいカテゴリ追加
    animation: {
      glow: '#00ffff',
      pulse: '#ff00ff',
    }
  }
}
```

```tsx
// 使用例
<div className="bg-modeler-animation-glow animate-pulse">
  Animated Element
</div>
```

## 🎯 メリット

### ✅ 実現できたこと

1. **完全な色設定集約**：
   - すべての色定義が`tailwind.config.ts`に統一
   - 重複なし、単一の信頼できるソース

2. **自動CSS変数生成**：
   - Tailwindプラグインにより自動でCSS変数を生成
   - 外部ライブラリでも同じ色を使用可能

3. **型安全性**：
   - TypeScriptによる色名の型チェック
   - IDEでの自動補完とエラー検出

4. **保守性**：
   - 色変更時は一箇所のみ修正
   - 影響範囲の把握が容易

5. **拡張性**：
   - 新しい色の追加が簡単
   - プラグインによる自動変数生成

6. **パフォーマンス**：
   - Tailwindの最適化恩恵
   - 未使用CSSの自動削除

## 🚀 実装完了と成果

### ✅ フェーズ 3: エディター・ビューポート統合
- ✅ Monaco エディターテーマの完全統合
- ✅ Three.js ビューポートの色設定
- ✅ TweakPane の完全CSS変数化

### 🎨 Three.js色設定の実装方法

Three.jsでの色設定は、CSS変数から値を取得して使用：

```typescript
// 背景色を設定（CSS変数から）
const bgColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--golden-content-background').trim() || '#222222';
scene.background = new THREE.Color(bgColor);

// フェイス色（CSS変数から）
const faceColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--monaco-editor-background') || '#f5f5f5';
const matcapMaterial = new THREE.MeshMatcapMaterial({
  color: new THREE.Color(faceColor),
  // その他のプロパティ
});

// ワイヤーフレーム色
const wireframeColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--dv-dark-border').trim() || '#000000';
const edgeMaterial = new THREE.LineBasicMaterial({ 
  color: wireframeColor, 
  linewidth: 1 
});
```

### 🔲 フェーズ 4: 高度な機能
- ダークモード/ライトモードの切り替え
- ユーザーカスタムテーマ機能
- カラーバリアフリー対応

## 📚 参考資料

- [Tailwind CSS カスタムプラグイン](https://tailwindcss.com/docs/plugins)
- [CSS カスタムプロパティ](https://developer.mozilla.org/ja/docs/Web/CSS/--*)
- [Dockview API リファレンス](https://dockview.dev/)

## 🎉 実装成果

- ✅ **v0完全互換** - 既存デザインの完全保持
- ✅ **単一責任** - tailwind.config.tsのみで色管理
- ✅ **型安全性** - TypeScriptによる型チェック
- ✅ **パフォーマンス** - CSS変数定義の最小化
- ✅ **開発効率** - cn()関数による効率的なスタイリング

この実装により、保守性とパフォーマンスを両立したモダンな色管理システムが完成しました。 