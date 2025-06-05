import { useEffect, useCallback } from 'react';
import { useCADWorker } from './useCADWorker';
import { useGUIState } from './useGUIState';
import { isTransformKey, isCameraViewKey, isFitToObjectKey, getCameraViewName } from '../lib/utils/keyboardShortcuts';

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
    // ただし、F5キーについてはMonacoCodeEditorのグローバルハンドラーに任せる
    if (e.target instanceof Element && (
      e.target.closest('.monaco-editor') ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    )) {
      // F5キー以外はエディタ内では処理しない
      if (e.key !== 'F5' && e.keyCode !== 116) {
        return;
      }
    }

    // F5: コード実行
    // MonacoCodeEditorがマウントされている場合は、そちらのグローバルハンドラーに任せる
    // エディタがない場合のみここで処理
    if (e.key === 'F5' || e.keyCode === 116) {
      // MonacoCodeEditorのグローバルハンドラーが存在するかチェック
      const hasMonacoEditor = document.querySelector('.monaco-editor') !== null;
      if (!hasMonacoEditor) {
        e.preventDefault();
        e.stopPropagation();
        defaultEvaluateCode();
      }
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

    const transformModeKey = isTransformKey(e.key);
    if (transformModeKey) {
      document.dispatchEvent(new CustomEvent('transform-mode-change', { 
        detail: { mode: transformModeKey } 
      }));
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('transform-mode-cycle'));
      return;
    }

    const cameraViewNumber = isCameraViewKey(e.key);
    if (cameraViewNumber) {
      const viewName = getCameraViewName(cameraViewNumber);
      if (viewName && (window as any).cascadeCameraControls?.animateToView) {
        (window as any).cascadeCameraControls.animateToView(viewName);
      }
      return;
    }

    if (isFitToObjectKey(e.key)) {
      if ((window as any).cascadeCameraControls?.fitToObject) {
        (window as any).cascadeCameraControls.fitToObject();
      }
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

export function useComprehensiveKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // エディタ内でのキー操作は無視（エディタ自身のショートカットを優先）
      // ただし、F5キーについてはMonacoCodeEditorのグローバルハンドラーに任せる
      if (event.target instanceof Element && (
        event.target.closest('.monaco-editor') ||
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA'
      )) {
        // F5キー以外はエディタ内では処理しない
        if (event.key !== 'F5' && event.keyCode !== 116) {
          return;
        }
      }

      const key = getShortcutKey(event);
      
      // F5キーの特別処理
      if (event.key === 'F5' || event.keyCode === 116) {
        // MonacoCodeEditorのグローバルハンドラーが存在するかチェック
        const hasMonacoEditor = document.querySelector('.monaco-editor') !== null;
        if (!hasMonacoEditor) {
          event.preventDefault();
          event.stopPropagation();
          document.dispatchEvent(new CustomEvent('project-evaluate'));
        }
        return;
      }
      
      switch (key) {
        case 'Ctrl+N':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('project-new'));
          break;
        case 'Ctrl+O':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('project-open-dialog'));
          break;
        case 'Ctrl+S':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('project-save-dialog'));
          break;
        case 'Ctrl+Shift+S':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('project-save-as-dialog'));
          break;
        case 'Ctrl+Z':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('history-undo'));
          break;
        case 'Ctrl+Y':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('history-redo'));
          break;
        case 'Delete':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('selection-delete'));
          break;
        case 'Ctrl+A':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('selection-select-all'));
          break;
        case 'Ctrl+D':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('selection-clear'));
          break;
        case 'Ctrl+I':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('selection-invert'));
          break;
        case 'Ctrl+G':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('group-create'));
          break;
        case 'Ctrl+Shift+G':
          event.preventDefault();
          document.dispatchEvent(new CustomEvent('group-ungroup'));
          break;
      }
    };

    const getShortcutKey = (event: KeyboardEvent): string => {
      const parts: string[] = [];
      
      if (event.ctrlKey) parts.push('Ctrl');
      if (event.shiftKey) parts.push('Shift');
      if (event.altKey) parts.push('Alt');
      if (event.metaKey) parts.push('Meta');
      
      parts.push(event.key);
      
      return parts.join('+');
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}                