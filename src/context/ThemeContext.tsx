'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// VS Code Dark テーマの色定義
export const VS_DARK_THEME = {
  // 背景色
  background: '#1e1e1e',
  backgroundSecondary: '#252526',
  backgroundTertiary: '#2d2d30',
  
  // 前景色（テキスト）
  foreground: '#cccccc',
  foregroundSecondary: '#969696',
  foregroundMuted: '#6a6a6a',
  
  // ボーダー
  border: '#3e3e42',
  borderLight: '#464647',
  
  // アクセント色
  accent: '#007acc',
  accentHover: '#1177bb',
  
  // 状態色
  success: '#4ec9b0',
  warning: '#dcdcaa',
  error: '#f44747',
  info: '#569cd6',
  
  // ボタン
  buttonBackground: '#0e639c',
  buttonBackgroundHover: '#1177bb',
  buttonForeground: '#ffffff',
  
  // 入力フィールド
  inputBackground: '#3c3c3c',
  inputBorder: '#3e3e42',
  inputForeground: '#cccccc',
  
  // ドロップダウン
  dropdownBackground: '#252526',
  dropdownBorder: '#3e3e42',
  dropdownHover: '#2a2d2e',
  
  // スクロールバー
  scrollbarBackground: '#1e1e1e',
  scrollbarThumb: '#424242',
  scrollbarThumbHover: '#4f4f4f',
} as const;

// テーマタイプ
export type ThemeType = 'vs-dark' | 'vs-light';

// テーマコンテキストの型定義
interface ThemeContextType {
  theme: ThemeType;
  colors: typeof VS_DARK_THEME;
  setTheme: (theme: ThemeType) => void;
  getThemeClasses: () => string;
  getComponentStyles: (component: string) => React.CSSProperties;
}

// コンテキスト作成
const ThemeContext = createContext<ThemeContextType | null>(null);

// プロバイダーのプロパティ
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeType;
}

// テーマプロバイダー
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'vs-dark'
}) => {
  const [theme, setTheme] = useState<ThemeType>(defaultTheme);

  // 現在のテーマの色を取得
  const colors = theme === 'vs-dark' ? VS_DARK_THEME : VS_DARK_THEME; // 将来的にライトテーマも追加可能

  // テーマに応じたTailwindクラスを取得
  const getThemeClasses = useCallback(() => {
    if (theme === 'vs-dark') {
      return 'bg-[#1e1e1e] text-[#cccccc] border-[#3e3e42]';
    }
    return 'bg-white text-black border-gray-300';
  }, [theme]);

  // コンポーネント別のスタイルを取得
  const getComponentStyles = useCallback((component: string): React.CSSProperties => {
    switch (component) {
      case 'header':
        return {
          backgroundColor: colors.backgroundSecondary,
          color: colors.foreground,
          borderColor: colors.border,
        };
      case 'footer':
        return {
          backgroundColor: colors.backgroundSecondary,
          color: colors.foreground,
          borderColor: colors.border,
        };
      case 'button':
        return {
          backgroundColor: colors.buttonBackground,
          color: colors.buttonForeground,
          borderColor: colors.border,
        };
      case 'button-hover':
        return {
          backgroundColor: colors.buttonBackgroundHover,
        };
      case 'dropdown':
        return {
          backgroundColor: colors.dropdownBackground,
          color: colors.foreground,
          borderColor: colors.dropdownBorder,
        };
      case 'dropdown-item-hover':
        return {
          backgroundColor: colors.dropdownHover,
        };
      case 'input':
        return {
          backgroundColor: colors.inputBackground,
          color: colors.inputForeground,
          borderColor: colors.inputBorder,
        };
      default:
        return {
          backgroundColor: colors.background,
          color: colors.foreground,
          borderColor: colors.border,
        };
    }
  }, [colors]);

  const value: ThemeContextType = {
    theme,
    colors,
    setTheme,
    getThemeClasses,
    getComponentStyles,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフック
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// テーマ適用用のユーティリティフック
export const useVSDarkTheme = () => {
  const { colors, getComponentStyles } = useTheme();
  
  return {
    colors,
    getComponentStyles,
    // よく使用されるスタイルのショートカット
    headerStyle: getComponentStyles('header'),
    footerStyle: getComponentStyles('footer'),
    buttonStyle: getComponentStyles('button'),
    dropdownStyle: getComponentStyles('dropdown'),
    inputStyle: getComponentStyles('input'),
  };
}; 