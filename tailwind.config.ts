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
        // Modeler X 基本カラーパレット（v0完全互換 + VS Code様式拡張）
        'modeler': {
          // 基本色（v0と完全一致）
          background: {
            primary: '#222222',    // v0: rgb(34, 34, 34) - body背景
            secondary: '#1e1e1e',  // v0: theme-color
            modal: '#131313',      // v0: rgb(19, 19, 19) - centeredクラス
            surface: '#2e2e2e',    // v0: --tp-base-background-color
          },
          
          // ナビゲーション（v0と完全一致）
          nav: {
            bg: '#111',            // v0: #111 (正確な値)
            text: '#f2f2f2',       // v0と同じ
            hover: {
              bg: '#aaa',          // v0: #aaa (正確な値)
              text: 'black',       // v0: black (正確な値)
            },
            active: {
              bg: '#4CAF50',       // v0と同じ
              text: 'white',       // v0: white (正確な値)
            },
          },

          // GUI コントロール（TweakPane - v0と完全一致）
          control: {
            base: '#2e2e2e',                    // v0: --tp-base-background-color
            button: {
              DEFAULT: 'hsl(0, 0%, 25%)',      // v0: --tp-button-background-color
              hover: 'hsl(0, 0%, 30%)',        // v0: --tp-button-background-color-hover
              focus: 'hsl(0, 0%, 35%)',        // v0: --tp-button-background-color-focus
              active: 'hsl(0, 0%, 40%)',       // v0: --tp-button-background-color-active
            },
            text: {
              primary: '#eeeeee',              // v0: --tp-button-foreground-color
              secondary: '#aeb5b8',            // v0: --tp-label-foreground-color
              muted: '#888888',               // 補助的な色
            },
            border: 'hsl(0, 0%, 20%)',         // 境界線（推定値）
            scrollbar: {
              track: '#2e2e2e',               // v0: var(--tp-base-background-color)
              thumb: '#777',                   // v0: #777 (正確な値)
            },
          },

          // エディター・コード関連（推定値）
          editor: {
            bg: '#1e1e1e',          // メタテーマカラーと同じ
            line: '#2e2e2e',        // GUIベースと同じ
            selection: '#264f78',   // VS Codeダークテーマ標準
            gutter: '#2a2a2a',      // 行番号部分
            cursor: '#ffffff',      // カーソル色
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

          // アクセント・状態色
          accent: {
            primary: '#4CAF50',     // v0: #4CAF50 - ナビアクティブと同じ
            success: '#00C851',     // 成功状態
            warning: '#ffbb33',     // 警告状態
            error: '#ff4444',       // エラー状態
            info: '#33b5e5',        // 情報状態
            link: '#007acc',        // リンク・フォーカス色
          },

          // VS Code様式専用色設定（新規追加）
          vscode: {
            // タイトルバー
            titlebar: {
              bg: '#1e1e1e',                    // VS Codeタイトルバー背景
              text: '#cccccc',                  // タイトルテキスト
              button: {
                hover: '#333333',               // ボタンホバー
                active: '#444444',              // ボタンアクティブ
              },
            },
            
            // サイドバー
            sidebar: {
              bg: '#252526',                    // サイドバー背景
              text: '#cccccc',                  // サイドバーテキスト
              icon: '#c5c5c5',                  // アイコン色
              selected: {
                bg: '#094771',                  // 選択項目背景
                text: '#ffffff',                // 選択項目テキスト
              },
              hover: {
                bg: '#2a2d2e',                  // ホバー背景
              },
              tree: {
                bg: '#1e1e1e',                  // ツリービュー背景
                hover: '#2a2d2e',               // ツリー項目ホバー
                selected: '#37373d',            // ツリー項目選択
                indent: '#404040',              // インデントガイド
              },
            },

            // タブバー
            tabs: {
              bg: '#2d2d30',                    // タブバー背景
              border: '#2d2d30',                // タブ境界線
              inactive: {
                bg: '#2d2d30',                  // 非アクティブタブ
                text: '#969696',                // 非アクティブタブテキスト
                hover: {
                  bg: '#1e1e1e',                // 非アクティブタブホバー
                  text: '#ffffff',              // 非アクティブタブホバーテキスト
                },
              },
              active: {
                bg: '#1e1e1e',                  // アクティブタブ
                text: '#ffffff',                // アクティブタブテキスト
                border: '#007acc',              // アクティブタブ下線
              },
              dirty: '#ffffff88',               // 未保存インジケーター
              close: {
                text: '#969696',                // 閉じるボタン
                hover: '#ffffff',               // 閉じるボタンホバー
              },
            },

            // ステータスバー
            statusbar: {
              bg: '#007acc',                    // ステータスバー背景
              text: '#ffffff',                  // ステータスバーテキスト
              hover: '#005a9e',                 // ステータスバーホバー
              error: '#f14c4c',                 // エラー状態
              warning: '#ffcc02',               // 警告状態
            },

            // パネル（ターミナル、デバッグコンソールなど）
            panel: {
              bg: '#181818',                    // パネル背景
              border: '#2d2d30',                // パネル境界線
              header: {
                bg: '#252526',                  // パネルヘッダー背景
                text: '#cccccc',                // パネルヘッダーテキスト
                active: {
                  bg: '#1e1e1e',                // アクティブパネルヘッダー
                  text: '#ffffff',              // アクティブパネルヘッダーテキスト
                },
              },
              terminal: {
                bg: '#0c0c0c',                  // ターミナル背景
                text: '#cccccc',                // ターミナルテキスト
                cursor: '#ffffff',              // ターミナルカーソル
                selection: '#264f78',           // ターミナル選択範囲
              },
            },

            // エクスプローラー
            explorer: {
              bg: '#252526',                    // エクスプローラー背景
              text: '#cccccc',                  // エクスプローラーテキスト
              folder: {
                icon: '#dcb67a',                // フォルダーアイコン
                expanded: '#dcb67a',            // 展開されたフォルダー
                collapsed: '#dcb67a',           // 折りたたまれたフォルダー
              },
              file: {
                icon: '#c5c5c5',                // ファイルアイコン
                text: '#cccccc',                // ファイルテキスト
                active: '#ffffff',              // アクティブファイル
              },
            },

            // 検索
            search: {
              bg: '#252526',                    // 検索パネル背景
              input: {
                bg: '#3c3c3c',                  // 検索入力背景
                border: '#3c3c3c',              // 検索入力境界線
                text: '#cccccc',                // 検索入力テキスト
                placeholder: '#767676',         // プレースホルダー
                focus: {
                  bg: '#3c3c3c',                // フォーカス時背景
                  border: '#007acc',            // フォーカス時境界線
                },
              },
              match: {
                bg: '#613a1a',                  // マッチ背景
                text: '#ffffff',                // マッチテキスト
                border: '#f99b15',              // マッチ境界線
              },
            },

            // スクロールバー
            scrollbar: {
              bg: 'transparent',                // スクロールバー背景
              thumb: {
                DEFAULT: '#79797966',           // スクロールバーつまみ
                hover: '#646464b3',             // ホバー時つまみ
                active: '#bfbfbf66',            // アクティブ時つまみ
              },
            },

            // メニュー・コンテキストメニュー
            menu: {
              bg: '#2d2d30',                    // メニュー背景
              text: '#cccccc',                  // メニューテキスト
              border: '#454545',                // メニュー境界線
              separator: '#454545',             // セパレーター
              hover: {
                bg: '#094771',                  // メニューホバー
                text: '#ffffff',                // メニューホバーテキスト
              },
              disabled: {
                text: '#656565',                // 無効メニューテキスト
              },
            },

            // 通知・アラート
            notification: {
              bg: '#252526',                    // 通知背景
              border: '#454545',                // 通知境界線
              text: '#cccccc',                  // 通知テキスト
              info: {
                bg: '#1a365d',                  // 情報通知背景
                border: '#007acc',              // 情報通知境界線
              },
              warning: {
                bg: '#5d4037',                  // 警告通知背景
                border: '#ffcc02',              // 警告通知境界線
              },
              error: {
                bg: '#5d1a1a',                  // エラー通知背景
                border: '#f14c4c',              // エラー通知境界線
              },
            },
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