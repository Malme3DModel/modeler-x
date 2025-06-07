import React, { memo } from 'react';

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
const StatusIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 8 8">
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
  return (
    <div className="shrink-0 flex items-center justify-between h-6 px-3 bg-modeler-background-secondary border-t border-modeler-control-border text-modeler-control-text-primary text-xs">
      
      {/* 左側: CADカーネルステータス */}
      <div className="flex items-center space-x-4">
        {/* CADカーネル状態 */}
        <div className="flex items-center space-x-1">
          <span className="text-modeler-control-text-secondary">CAD Kernel:</span>
          <span className={isCADWorkerReady ? 'text-modeler-accent-success' : 'text-modeler-accent-warning'}>
            {isCADWorkerReady ? '✅ Ready' : '⏳ Initializing...'}
          </span>
        </div>

        {/* ワーカー状態 */}
        <div className="flex items-center space-x-1">
          <span className="text-modeler-control-text-secondary">Worker:</span>
          <span className={isWorkerReady ? 'text-modeler-accent-success' : 'text-modeler-accent-warning'}>
            {isWorkerReady ? '✅ Ready' : '⏳ Loading...'}
          </span>
        </div>

        {/* 実行状態 */}
        <div className="flex items-center space-x-1">
          <span className="text-modeler-control-text-secondary">Status:</span>
          <span className={isWorking ? 'text-modeler-accent-info' : 'text-modeler-accent-success'}>
            {isWorking ? '🔄 Working...' : '✅ Idle'}
          </span>
        </div>

        {/* 未保存変更 */}
        {hasUnsavedChanges && (
          <div className="flex items-center space-x-1">
            <span className="text-modeler-accent-warning">● Unsaved changes</span>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="flex items-center space-x-1">
            <span className="text-modeler-accent-error">⚠️ Error</span>
          </div>
        )}
      </div>

      {/* 右側: キーボードショートカットヘルプ */}
      <div className="flex items-center space-x-1 text-modeler-control-text-secondary">
        <span>Ctrl+Enter: evaluate</span>
        <span className="text-modeler-control-border">•</span>
        <span>F5: update</span>
        <span className="text-modeler-control-border">•</span>
        <span>Ctrl+S: save</span>
      </div>
    </div>
  );
});

// displayNameを設定（デバッグ用）
Footer.displayName = 'Footer';

export default Footer; 