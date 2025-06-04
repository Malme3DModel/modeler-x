import { useEffect, useCallback } from 'react';
import { useCADWorker } from './useCADWorker';
import { useGUIState } from './useGUIState';

interface KeyboardShortcutsOptions {
  onEvaluateCode?: () => void;
  onSaveProject?: () => void;
  onClearSelection?: () => void;
  disabled?: boolean;
}

/**
 * グローバルキーボードショートカットを管理するカスタムフック
 * 
 * @param options ショートカット設定オプション
 * @returns ショートカット関連の関数
 */
export function useKeyboardShortcuts({
  onEvaluateCode,
  onSaveProject,
  onClearSelection,
  disabled = false
}: KeyboardShortcutsOptions = {}) {
  const cadWorker = useCADWorker();
  const guiState = useGUIState();
  
  // 選択オブジェクトの状態管理（グローバル状態として仮実装）
  const setSelectedObject = useCallback((object: any) => {
    // 実際の実装では、グローバル状態管理やコンテキストを使用
    document.dispatchEvent(new CustomEvent('object-selection-change', { 
      detail: { object } 
    }));
  }, []);

  // デフォルトのショートカット処理関数
  const defaultEvaluateCode = useCallback(() => {
    if (onEvaluateCode) {
      onEvaluateCode();
    } else {
      // 現在のエディタコードを取得する方法が必要
      // ここでは単純なデモとしてログ出力
      console.log('コード評価を実行');
      // cadWorker.executeCADCode(currentCode);
    }
  }, [onEvaluateCode, cadWorker]);

  const defaultSaveProject = useCallback(() => {
    if (onSaveProject) {
      onSaveProject();
    } else {
      // デフォルトの保存処理（URLハッシュベース）
      console.log('プロジェクト保存');
      // TODO: 実際の保存処理を実装
    }
  }, [onSaveProject]);

  const defaultClearSelection = useCallback(() => {
    if (onClearSelection) {
      onClearSelection();
    } else {
      setSelectedObject(null);
    }
  }, [onClearSelection, setSelectedObject]);

  // キーボードイベントハンドラ
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // エディタ内でのキー操作は無視（エディタ自身のショートカットを優先）
    if (e.target instanceof Element && (
      e.target.closest('.monaco-editor') ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    )) {
      return;
    }

    // F5: コード実行
    if (e.key === 'F5') {
      e.preventDefault();
      defaultEvaluateCode();
      return;
    }

    // Ctrl+S / Cmd+S: プロジェクト保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      defaultSaveProject();
      return;
    }

    // Esc: 選択解除
    if (e.key === 'Escape') {
      defaultClearSelection();
      return;
    }

    // G: 移動ツール
    if (e.key === 'g' || e.key === 'G') {
      // TransformControlsのモード変更処理
      document.dispatchEvent(new CustomEvent('transform-mode-change', { 
        detail: { mode: 'translate' } 
      }));
      return;
    }

    // R: 回転ツール
    if (e.key === 'r' || e.key === 'R') {
      document.dispatchEvent(new CustomEvent('transform-mode-change', { 
        detail: { mode: 'rotate' } 
      }));
      return;
    }

    // S: スケールツール
    if (e.key === 's' || e.key === 'S') {
      document.dispatchEvent(new CustomEvent('transform-mode-change', { 
        detail: { mode: 'scale' } 
      }));
      return;
    }
  }, [defaultEvaluateCode, defaultSaveProject, defaultClearSelection]);

  // キーボードイベントの登録と解除
  useEffect(() => {
    if (disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);

  return {
    evaluateCode: defaultEvaluateCode,
    saveProject: defaultSaveProject,
    clearSelection: defaultClearSelection
  };
} 