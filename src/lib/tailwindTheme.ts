import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TailwindCSSクラスをマージするユーティリティ関数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * VS Dark テーマのTailwindクラス定義
 */
export const vsDarkTheme = {
  // 背景色
  bg: {
    primary: 'bg-vs-bg',
    secondary: 'bg-vs-bg-secondary',
    tertiary: 'bg-vs-bg-tertiary',
  },
  
  // テキスト色
  text: {
    primary: 'text-vs-fg',
    secondary: 'text-vs-fg-secondary',
    muted: 'text-vs-fg-muted',
  },
  
  // ボーダー色
  border: {
    primary: 'border-vs-border',
    light: 'border-vs-border-light',
  },
  
  // ステータス色
  status: {
    success: 'text-vs-success',
    warning: 'text-vs-warning',
    error: 'text-vs-error',
    info: 'text-vs-info',
  },
  
  // アクセント色
  accent: {
    primary: 'text-vs-accent bg-vs-accent',
    hover: 'hover:bg-vs-accent-hover',
  },
} as const;

/**
 * コンポーネント別のTailwindクラス定義
 */
export const vsComponents = {
  // ヘッダー
  header: cn(
    vsDarkTheme.bg.secondary,
    vsDarkTheme.text.primary,
    vsDarkTheme.border.primary,
    'border-b'
  ),
  
  // フッター
  footer: cn(
    vsDarkTheme.bg.secondary,
    vsDarkTheme.text.primary,
    vsDarkTheme.border.primary,
    'border-t'
  ),
  
  // プライマリボタン
  buttonPrimary: cn(
    'bg-vs-btn-bg text-vs-btn-fg',
    'hover:bg-vs-btn-bg-hover',
    'border border-vs-border',
    'px-4 py-2 rounded',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-vs-accent'
  ),
  
  // セカンダリボタン
  buttonSecondary: cn(
    'bg-transparent text-vs-fg',
    'hover:bg-vs-dropdown-hover',
    'border border-vs-border',
    'px-4 py-2 rounded',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-vs-accent'
  ),
  
  // ゴーストボタン（ヘッダー用）
  buttonGhost: cn(
    'bg-transparent text-vs-fg',
    'hover:bg-vs-dropdown-hover',
    'px-2 py-1 rounded',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-vs-accent'
  ),
  
  // 入力フィールド
  input: cn(
    'bg-vs-input-bg text-vs-input-fg',
    'border border-vs-input-border',
    'px-3 py-2 rounded',
    'focus:outline-none focus:ring-2 focus:ring-vs-accent',
    'placeholder:text-vs-fg-muted'
  ),
  
  // ドロップダウン
  dropdown: cn(
    'bg-vs-dropdown-bg text-vs-fg',
    'border border-vs-dropdown-border',
    'rounded shadow-lg',
    'min-w-[120px]'
  ),
  
  // ドロップダウンアイテム
  dropdownItem: cn(
    'w-full flex items-center space-x-2',
    'px-3 py-2 text-xs text-left',
    'text-vs-fg hover:bg-vs-dropdown-hover',
    'transition-colors duration-150',
    'focus:outline-none focus:bg-vs-dropdown-hover'
  ),
  
  // カード
  card: cn(
    vsDarkTheme.bg.secondary,
    vsDarkTheme.text.primary,
    vsDarkTheme.border.primary,
    'border rounded p-4'
  ),
  
  // パネル
  panel: cn(
    vsDarkTheme.bg.primary,
    vsDarkTheme.text.primary,
    vsDarkTheme.border.primary
  ),
} as const;

/**
 * レスポンシブ対応のユーティリティ
 */
export const vsResponsive = {
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  flex: 'flex flex-col sm:flex-row items-center justify-between',
} as const;

/**
 * アニメーション用のユーティリティ
 */
export const vsAnimations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-top-2 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
} as const;

/**
 * 状態に応じたクラスを生成するヘルパー関数
 */
export const createStateClasses = (baseClasses: string, states: {
  hover?: string;
  focus?: string;
  active?: string;
  disabled?: string;
}) => {
  return cn(
    baseClasses,
    states.hover,
    states.focus,
    states.active,
    states.disabled
  );
};

/**
 * VS Dark テーマのバリアント生成
 */
export const createVSVariant = (component: keyof typeof vsComponents, variant?: 'sm' | 'lg') => {
  const baseClasses = vsComponents[component];
  
  const sizeVariants = {
    sm: 'text-xs px-2 py-1',
    lg: 'text-lg px-6 py-3',
  };
  
  if (variant && sizeVariants[variant]) {
    return cn(baseClasses, sizeVariants[variant]);
  }
  
  return baseClasses;
}; 