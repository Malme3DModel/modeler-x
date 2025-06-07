import { useEffect, useCallback, useRef } from 'react';

/**
 * キーボードショートカット設定オプション
 */
export interface KeyboardShortcutOptions {
  onEvaluate?: () => void;
  onSaveProject?: () => void;
  onUnsavedChangesUpdate?: (hasChanges: boolean) => void;
  onProjectNameUpdate?: (name: string) => void;
  originalValue?: string;
}

/**
 * エディター用キーボードショートカット管理フック
 */
export function useKeyboardShortcuts(
  editorRef: React.MutableRefObject<any>,
  options: KeyboardShortcutOptions
) {
  const {
    onEvaluate,
    onSaveProject,
    onUnsavedChangesUpdate,
    onProjectNameUpdate,
    originalValue
  } = options;

  const originalValueRef = useRef<string>(originalValue || '');

  // 原稿値を更新
  useEffect(() => {
    if (originalValue !== undefined) {
      originalValueRef.current = originalValue;
    }
  }, [originalValue]);

  /**
   * エディター内でのキーボードショートカット設定
   */
  const setupEditorShortcuts = useCallback((editor: any, monaco: any) => {
    // F5キー: モデル更新（ページリロードを防ぐ）
    editor.addCommand(monaco.KeyCode.F5, () => {
      if (editor.evaluateCode) {
        editor.evaluateCode(true);
      }
    });

    // Ctrl+Enter: コード実行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (editor.evaluateCode) {
        editor.evaluateCode(true);
      }
    });

    // Ctrl+S: プロジェクト保存とコード実行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveProject) {
        onSaveProject();
      }
      if (editor.evaluateCode) {
        editor.evaluateCode(true);
      }
    });
  }, [onSaveProject]);

  /**
   * グローバルキーボードイベントの処理
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5キーでページリロードを防ぐ
      if (e.key === 'F5') {
        e.preventDefault();
        if (editorRef.current?.evaluateCode) {
          editorRef.current.evaluateCode(true);
        }
        return false;
      }
      
      // Ctrl+S でプロジェクト保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSaveProject) {
          onSaveProject();
        }
        if (editorRef.current?.evaluateCode) {
          editorRef.current.evaluateCode(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // ファイル変更状態の更新（キーアップ時）
      if (e.key && editorRef.current && onUnsavedChangesUpdate) {
        const currentValue = editorRef.current.getValue();
        const hasChanges = currentValue !== originalValueRef.current;
        onUnsavedChangesUpdate(hasChanges);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [onSaveProject, onUnsavedChangesUpdate, onProjectNameUpdate, editorRef]);

  return {
    setupEditorShortcuts
  };
} 