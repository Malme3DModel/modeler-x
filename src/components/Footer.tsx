import React, { memo } from 'react';
import { useVSDarkTheme } from '@/context/ThemeContext';

// ステータス表示のprops型定義
interface FooterProps {
  // CADワーカー関連の状態
  isCADWorkerReady: boolean;
  isWorking: boolean;
  isWorkerReady: boolean;
  
  // プロジェクト関連の状態
  hasUnsavedChanges: boolean;
  
  // エラー状態
  error?: string;
}

// ステータスアイコンコンポーネント
const StatusIcon = ({ className = "w-3 h-3", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="3" />
  </svg>
);

// フッターコンポーネント（メモ化で最適化）
const Footer: React.FC<FooterProps> = memo(({
  isCADWorkerReady,
  isWorking,
  isWorkerReady,
  hasUnsavedChanges,
  error
}) => {
  const { footerStyle } = useVSDarkTheme();
  return (
    <div 
      className="shrink-0 flex items-center justify-between h-6 px-3 border-t text-xs"
      style={footerStyle}
    >
      
      {/* 左側: CADカーネルステータス */}
      <div className="flex items-center space-x-4">
        {/* CADカーネル状態 */}
        <div className="flex items-center space-x-1">
          <span>CAD Kernel:</span>
          <span>
            {isCADWorkerReady ? '✅ Ready' : '⏳ Initializing...'}
          </span>
        </div>

        {/* ワーカー状態 */}
        <div className="flex items-center space-x-1">
          <span>Worker:</span>
          <span>
            {isWorkerReady ? '✅ Ready' : '⏳ Loading...'}
          </span>
        </div>

        {/* 実行状態 */}
        <div className="flex items-center space-x-1">
          <span>Status:</span>
          <span>
            {isWorking ? '🔄 Working...' : '✅ Idle'}
          </span>
        </div>

        {/* 未保存変更 */}
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-1">
            <span>● Unsaved changes</span>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="flex items-center space-x-1">
            <span>⚠️ Error</span>
          </div>
        )}
      </div>

      {/* 右側: キーボードショートカットヘルプ */}
      <div className="flex items-center space-x-1">
        <span>Ctrl+Enter: evaluate</span>
        <span>•</span>
        <span>F5: update</span>
        <span>•</span>
        <span>Ctrl+S: save</span>
      </div>
    </div>
  );
});

// displayNameを設定（デバッグ用）
Footer.displayName = 'Footer';

export default Footer; 