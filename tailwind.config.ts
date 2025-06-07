import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // クラスベースのダークモード
  theme: {
    extend: {
      colors: {
        'modeler': {
          background: {
            primary: '#1e1e1e',    // VS Code editor.background
            secondary: '#252526',  // VS Code sideBar.background
            modal: '#2d2d30',      // VS Code panel background
            surface: '#3c3c3c',    // VS Code input.background
          },
          
          activityBar: {
            background: '#333333', // VS Code activityBar.background
            foreground: '#cccccc', // VS Code activityBar.foreground
            inactiveForeground: '#858585', // VS Code activityBar.inactiveForeground
            border: '#2b2b2b',     // VS Code activityBar.border
            activeBorder: '#007acc', // VS Code activityBar.activeBorder
            activeBackground: '#37373d', // VS Code activityBar.activeBackground
          },

          sideBar: {
            background: '#252526',             // VS Code sideBar.background
            foreground: '#cccccc',             // VS Code sideBar.foreground
            border: '#2b2b2b',                 // VS Code sideBar.border
          },
          control: {
            base: '#3c3c3c',                   // VS Code input.background
            button: {
              DEFAULT: '#0e639c',              // VS Code button.background
              hover: '#1177bb',                // VS Code button.hoverBackground
              focus: '#007acc',                // VS Code focusBorder
              active: '#094771',               // VS Code button active state
            },
            text: {
              primary: '#cccccc',              // VS Code foreground
              secondary: '#969696',            // VS Code descriptionForeground
              muted: '#6a6a6a',               // VS Code disabledForeground
            },
            border: '#464647',                 // VS Code widget.border
            scrollbar: {
              track: '#2b2b2b',               // VS Code scrollbar track
              thumb: '#424242',               // VS Code scrollbarSlider.background
            },
          },

          editor: {
            bg: '#1e1e1e',          // VS Code editor.background
            line: '#2f2f2f',        // VS Code editorLineNumber.foreground
            selection: '#264f78',   // VS Code editor.selectionBackground
            gutter: '#858585',      // VS Code editorLineNumber.foreground
            cursor: '#aeafad',      // VS Code editorCursor.foreground
            lineHighlight: '#2a2d2e', // VS Code editor.lineHighlightBackground
          },

          // 3D ビューポート（推定値 - v0では明示的定義なし）
          viewport: {
            bg: '#1a1a1a',          // アプリ背景より少し暗い
            grid: '#333333',        // 薄いグレー
            axis: {
              x: '#ff4444',         // 赤（X軸）
              y: '#44ff44',         // 緑（Y軸）
              z: '#4444ff',         // 青（Z軸）
            },
            wireframe: '#999999',   // ワイヤーフレーム
            face: '#cccccc',        // 面の色
          },

          // VS Code アクセント・状態色
          accent: {
            primary: '#007acc',     // VS Code focusBorder/link color
            success: '#89d185',     // VS Code success color
            warning: '#ffcc02',     // VS Code warning color
            error: '#f85149',       // VS Code error color
            info: '#3794ff',        // VS Code info color
            link: '#3794ff',        // VS Code textLink.foreground
          },
          
          statusBar: {
            background: '#007acc',             // VS Code statusBar.background
            foreground: '#ffffff',             // VS Code statusBar.foreground
            border: '#007acc',                 // VS Code statusBar.border
            noFolderBackground: '#68217a',     // VS Code statusBar.noFolderBackground
            debuggingBackground: '#cc6633',    // VS Code statusBar.debuggingBackground
          },

          // Dockview テーマ色（既存のdarkテーマ互換）
          dockview: {
            dark: {
              header: '#2d2d30',          // ヘッダー背景
              tab: '#2d2d30',             // 非アクティブタブ
              tabText: '#969696',         // 非アクティブタブテキスト
              tabHover: '#3e3e42',        // タブホバー
              border: '#464647',          // ボーダー色
              textWhite: '#ffffff',       // 白文字
              textGray: '#cccccc',        // グレー文字
              separator: '#303031',       // セパレーター
              tabContainer: '#252526',    // タブコンテナ
              tabHoverAlt: '#2a2d2e',     // 代替ホバー色
            },
          },

          // テキストシャドウ用
          shadow: {
            text: '#000000',              // テキストシャドウ色
          },
        },
      },

      // フォント設定（v0と一致）
      fontFamily: {
        'console': ['Consolas', 'Monaco', 'Courier New', 'monospace'], // v0: Consolas
        'ui': ['Arial', 'sans-serif'],                                 // v0: Arial, sans-serif
        'code': ['Consolas', 'Monaco', 'Courier New', 'monospace'],   // コード用はConsolas優先
      },

      // アニメーション・トランジション
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },

      // カスタムシャドウ
      boxShadow: {
        'modeler-panel': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'modeler-button': '0 2px 4px rgba(0, 0, 0, 0.2)',
        'modeler-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },

      // ボーダー半径
      borderRadius: {
        'modeler': '4px',
        'modeler-lg': '8px',
      },
    },
  },
  plugins: [
    // カスタムプラグイン - スクロールバーとユーティリティ
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.scrollbar-modeler': {
          '&::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme('colors.modeler.control.base'),
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.modeler.control.scrollbar.thumb'),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme('colors.modeler.control.button.hover'),
          },
        },
        '.text-shadow-modeler': {
          textShadow: `1px 1px 2px ${theme('colors.modeler.shadow.text')}`,
        },
      }
      addUtilities(newUtilities)
    },
    
    // Dockview用CSS変数生成プラグイン
    function({ addBase, theme }) {
      const modelerColors = theme('colors.modeler');
      
      addBase({
        ':root': {
          // Modeler X テーマ - Dockview CSS変数
          '--dv-modeler-group-view-background-color': modelerColors.background.secondary,
          '--dv-modeler-paneview-header-background-color': modelerColors.control.base,
          '--dv-modeler-tabs-container-background-color': modelerColors.control.base,
          '--dv-modeler-tabs-and-actions-container-background-color': modelerColors.control.base,
          '--dv-modeler-tab-background-color': modelerColors.control.button.DEFAULT,
          '--dv-modeler-tab-active-background-color': modelerColors.control.button.active,
          '--dv-modeler-tab-color': modelerColors.control.text.secondary,
          '--dv-modeler-tab-active-color': modelerColors.control.text.primary,
          '--dv-modeler-tab-hover-background-color': modelerColors.control.button.hover,
          '--dv-modeler-tab-active-border-color': modelerColors.accent.primary,
          '--dv-modeler-separator-border': modelerColors.control.border,
          '--dv-modeler-activegroup-visiblepanel-tab-background-color': modelerColors.background.secondary,
          '--dv-modeler-group-header-background-color': modelerColors.control.base,
          '--dv-modeler-drag-over-background-color': `${modelerColors.accent.primary}2e`, // 18% opacity
          '--dv-modeler-floating-box-shadow': theme('boxShadow.modeler-modal'),
          '--dv-modeler-font-family': theme('fontFamily.ui').join(', '),
          
          // Monaco Editor用
          '--monaco-editor-background': modelerColors.editor.bg,
          '--monaco-editor-line-color': modelerColors.editor.line,
          '--monaco-editor-selection': modelerColors.editor.selection,
          '--monaco-editor-cursor': modelerColors.editor.cursor,
          
          // TweakPane用
          '--gui-panel-background': modelerColors.control.base,
          '--gui-scrollbar-track': modelerColors.control.base,
          '--gui-scrollbar-thumb': modelerColors.control.scrollbar.thumb,
          
          // Golden Layout用
          '--golden-content-background': modelerColors.background.primary,
          '--golden-header-background': modelerColors.control.base,
          '--golden-tab-background': modelerColors.control.button.DEFAULT,
          '--golden-tab-color': modelerColors.control.text.primary,
          '--golden-tab-active-background': modelerColors.control.button.active,

          // Dockview Dark テーマ用（後方互換性）
          '--dv-dark-header-background': modelerColors.dockview.dark.header,
          '--dv-dark-tab-background': modelerColors.dockview.dark.tab,
          '--dv-dark-tab-text': modelerColors.dockview.dark.tabText,
          '--dv-dark-tab-hover': modelerColors.dockview.dark.tabHover,
          '--dv-dark-border': modelerColors.dockview.dark.border,
          '--dv-dark-text-white': modelerColors.dockview.dark.textWhite,
          '--dv-dark-text-gray': modelerColors.dockview.dark.textGray,
          '--dv-dark-separator': modelerColors.dockview.dark.separator,
          '--dv-dark-tab-container': modelerColors.dockview.dark.tabContainer,
          '--dv-dark-tab-hover-alt': modelerColors.dockview.dark.tabHoverAlt,

          // 汎用色
          '--color-accent-link': modelerColors.accent.link,
          '--color-shadow-text': modelerColors.shadow.text,

          // Three.js ビューポート用
          '--threejs-viewport-background': modelerColors.viewport.bg,
          '--threejs-viewport-face': modelerColors.viewport.face,
          '--threejs-viewport-wireframe': modelerColors.viewport.wireframe,
          '--threejs-viewport-grid': modelerColors.viewport.grid,
          '--threejs-viewport-axis-x': modelerColors.viewport.axis.x,
          '--threejs-viewport-axis-y': modelerColors.viewport.axis.y,
          '--threejs-viewport-axis-z': modelerColors.viewport.axis.z,
        },
      })
    }
  ],
} satisfies Config

export default config  