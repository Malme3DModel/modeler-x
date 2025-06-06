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
        // Modeler X 基本カラーパレット（v0完全互換）
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
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config

export default config 