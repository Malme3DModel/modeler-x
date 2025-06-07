'use client';

import React from 'react';
import { useVSDarkTheme, useTheme } from '@/context/ThemeContext';

/**
 * VS Dark テーマの使用例を示すコンポーネント
 * 他のコンポーネントでテーマを適用する際の参考にしてください
 */
const ThemeExample: React.FC = () => {
  const { colors, getComponentStyles } = useVSDarkTheme();
  const { theme, setTheme } = useTheme();

  return (
    <div 
      className="p-4 space-y-4"
      style={getComponentStyles('default')}
    >
      <h2 className="text-lg font-semibold" style={{ color: colors.foreground }}>
        VS Dark テーマの使用例
      </h2>

      {/* ボタンの例 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>ボタンの例:</h3>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 rounded transition-colors duration-150"
            style={getComponentStyles('button')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonBackgroundHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonBackground;
            }}
          >
            プライマリボタン
          </button>
          
          <button
            className="px-4 py-2 rounded transition-colors duration-150"
            style={{
              backgroundColor: 'transparent',
              color: colors.foreground,
              border: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.dropdownHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            セカンダリボタン
          </button>
        </div>
      </div>

      {/* 入力フィールドの例 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>入力フィールドの例:</h3>
        <input
          type="text"
          placeholder="テキストを入力してください"
          className="px-3 py-2 rounded border"
          style={getComponentStyles('input')}
        />
      </div>

      {/* カードの例 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>カードの例:</h3>
        <div
          className="p-4 rounded border"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            color: colors.foreground,
          }}
        >
          <h4 className="font-medium mb-2">カードタイトル</h4>
          <p style={{ color: colors.foregroundSecondary }}>
            これはVS Darkテーマを適用したカードコンポーネントの例です。
          </p>
        </div>
      </div>

      {/* ステータス色の例 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>ステータス色の例:</h3>
        <div className="flex space-x-4">
          <span style={{ color: colors.success }}>✅ 成功</span>
          <span style={{ color: colors.warning }}>⚠️ 警告</span>
          <span style={{ color: colors.error }}>❌ エラー</span>
          <span style={{ color: colors.info }}>ℹ️ 情報</span>
        </div>
      </div>

      {/* テーマ切り替えの例 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>テーマ切り替え:</h3>
        <button
          className="px-4 py-2 rounded transition-colors duration-150"
          style={{
            backgroundColor: colors.accent,
            color: colors.buttonForeground,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent;
          }}
          onClick={() => setTheme(theme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
        >
          現在: {theme} (クリックで切り替え)
        </button>
      </div>

      {/* 使用方法の説明 */}
      <div className="space-y-2">
        <h3 style={{ color: colors.foregroundSecondary }}>使用方法:</h3>
        <div
          className="p-3 rounded border font-mono text-sm"
          style={{
            backgroundColor: colors.backgroundTertiary,
            borderColor: colors.border,
            color: colors.foreground,
          }}
        >
          <div>1. import &#123; useVSDarkTheme &#125; from '@/context/ThemeContext';</div>
          <div>2. const &#123; colors, getComponentStyles &#125; = useVSDarkTheme();</div>
          <div>3. style=&#123;getComponentStyles('button')&#125;</div>
        </div>
      </div>
    </div>
  );
};

export default ThemeExample; 