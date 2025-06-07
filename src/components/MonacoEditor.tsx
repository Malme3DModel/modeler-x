'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { MONACO_EDITOR_CONFIG, TYPESCRIPT_CONFIG } from '../config/cadConfig';
import type { MonacoEditorProps } from '../types';
import { useCADWorker } from '@/hooks/useCADWorker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { EditorService } from '@/services/editorService';
import { TypeDefinitionService } from '@/services/typeDefinitionService';

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
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

  // エディターがマウントされた時の処理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // TypeScript設定（定数から取得）
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: TYPESCRIPT_CONFIG.allowNonTsExtensions,
      target: monaco.languages.typescript.ScriptTarget[TYPESCRIPT_CONFIG.target],
      allowJs: TYPESCRIPT_CONFIG.allowJs,
      checkJs: TYPESCRIPT_CONFIG.checkJs,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind[TYPESCRIPT_CONFIG.moduleResolution],
    });

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(TYPESCRIPT_CONFIG.eagerModelSync);

    // 型定義ファイルを読み込み（サービスを使用）
    TypeDefinitionService.loadTypeDefinitions(monaco)
      .then(libs => {
        setExtraLibs(libs);
      })
      .catch(error => {
        console.error('Failed to load type definitions:', error);
      });

    // 関数の折りたたみ処理（サービスを使用）
    EditorService.setupCodeFolding(editor, value);

    // evaluateCode関数をエディターに追加（サービスを使用）
    editor.evaluateCode = async (saveToURL = false) => {
      try {
        await EditorService.evaluateCode({
          editor,
          monaco,
          evaluateAndRender,
          extraLibs: TypeDefinitionService.getExtraLibs(),
          saveToURL,
          onEvaluate
        });
      } catch (error) {
        console.error('Error evaluating code:', error);
      }
    };

    // キーボードショートカットの設定（フックを使用）
    setupEditorShortcuts(editor, monaco);

    // エディターのフォーカス
    editor.focus();
    setIsLoaded(true);
  };

  // エディターの値が変更された時の処理
  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
      
      // 未保存変更の状態を更新
      if (onUnsavedChangesUpdate) {
        const hasChanges = newValue !== originalValueRef.current;
        onUnsavedChangesUpdate(hasChanges);
      }
    }
  }, [onChange, onUnsavedChangesUpdate]);

  // グローバルキーイベントの処理は useKeyboardShortcuts フックで管理されています

  // 元の値を更新（保存時など）
  useEffect(() => {
    if (!hasUnsavedChanges) {
      originalValueRef.current = value;
    }
  }, [hasUnsavedChanges, value]);

  // delayReloadEditor関数（Tweakpaneエラー回避用）
  const delayReloadEditor = useCallback(() => {
    setTimeout(() => {
      if (editorRef.current?.evaluateCode) {
        editorRef.current.evaluateCode();
      }
    }, 0);
  }, []);

  // グローバルにdelayReloadEditor関数を公開
  useEffect(() => {
    (window as any).delayReloadEditor = delayReloadEditor;
    return () => {
      delete (window as any).delayReloadEditor;
    };
  }, [delayReloadEditor]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-700 text-white px-4 py-1 text-xs border-b border-gray-600 flex justify-between">
        <span>
          Press F5 or Ctrl+Enter to evaluate • Ctrl+S to save
          {isWorking && <span className="text-yellow-400 ml-2">• Evaluating...</span>}
        </span>
        <span className="text-gray-400">
          {isLoaded ? 'TypeScript Ready' : 'Loading Editor...'}
        </span>
      </div>
      <div className="flex-1">
        <Editor
          defaultValue={value}
          language="typescript"
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
          loading={
            <div className="flex-1 bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <div>Loading Monaco Editor...</div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default MonacoEditor; 