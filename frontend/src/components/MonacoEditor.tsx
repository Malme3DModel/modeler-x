'use client';

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import Editor from '@monaco-editor/react';
import { MONACO_EDITOR_CONFIG, TYPESCRIPT_CONFIG } from '@/config/cadConfig';
import type { MonacoEditorProps } from '@/types';
import { useCADWorker } from '@/hooks/useCADWorker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { EditorService } from '@/services/editorService';
import { TypeDefinitionService } from '@/services/typeDefinitionService';
import { CodeExecutionService } from '@/services/codeExecutionService';

const MonacoEditor: React.FC<MonacoEditorProps> = memo(({ 
  value, 
  onChange, 
  onEvaluate, 
  onSaveProject,
  hasUnsavedChanges,
  onUnsavedChangesUpdate,
  projectName,
  onProjectNameUpdate
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [extraLibs, setExtraLibs] = useState<any[]>([]);
  const originalValueRef = useRef<string>(value);
  
  // CADワーカーフックを使用
  const { evaluateAndRender, isWorking, isWorkerReady, error, clearError } = useCADWorker();

  // キーボードショートカットフックを使用
  const { setupEditorShortcuts } = useKeyboardShortcuts(editorRef, {
    onEvaluate,
    onSaveProject,
    onUnsavedChangesUpdate,
    onProjectNameUpdate,
    originalValue: value
  });

  // 元の値を更新（最適化: 値が変更された時のみ）
  useEffect(() => {
    originalValueRef.current = value;
  }, [value]);

  // 値が外部から変更されたらエディターの内容を更新
  useEffect(() => {
    console.log('[MonacoEditor] useEffect: value=', value, ', isLoaded=', isLoaded);
    if (isLoaded && editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value, isLoaded]);

  // エディターからコードを評価する関数（最適化: メモ化）
  const evaluateCode = useCallback(async (saveToURL = false) => {
    if (!editorRef.current || !monacoRef.current) {
      console.warn('Editor or Monaco instance not ready');
      return;
    }

    try {
      await EditorService.evaluateCode({
        editor: editorRef.current,
        monaco: monacoRef.current,
        evaluateAndRender,
        extraLibs,
        saveToURL,
        onEvaluate
      });
    } catch (error) {
      console.error('Error during code evaluation:', error);
    }
  }, [evaluateAndRender, extraLibs, onEvaluate]);

  // エディターの初期化処理（最適化: 依存関係を最小化）
  const handleEditorDidMount = useCallback(async (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    try {
      // TypeScript設定を適用
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(TYPESCRIPT_CONFIG);

      // 型定義ファイルを読み込み
      const libs = await TypeDefinitionService.loadTypeDefinitions(monaco);
      setExtraLibs(libs);

      // エディターにevaluateCode関数を追加
      editor.evaluateCode = evaluateCode;

      // キーボードショートカットを設定
      setupEditorShortcuts(editor, monaco);

      // コード折りたたみを設定
      EditorService.setupCodeFolding(editor, value);

      // CodeExecutionServiceにエディターの参照を設定
      CodeExecutionService.setMonacoEditorRef(editorRef);

      setIsLoaded(true);
      console.log('Monaco Editor initialized successfully');
    } catch (error) {
      console.error('Error initializing Monaco Editor:', error);
    }
  }, [evaluateCode, setupEditorShortcuts, value]);

  // エディター値変更時の処理（最適化: メモ化）
  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined && onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  // エラー表示（最適化: エラーがある場合のみレンダリング）
  const errorDisplay = error ? (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {error}
      <button 
        onClick={clearError}
        className="ml-2 text-red-500 hover:text-red-700"
      >
        ×
      </button>
    </div>
  ) : null;



  return (
    <div className="h-full flex flex-col">
      {errorDisplay}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={MONACO_EDITOR_CONFIG}
          theme="vs-dark"
        />
      </div>
    </div>
  );
});

// displayNameを設定（デバッグ用）
MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor; 