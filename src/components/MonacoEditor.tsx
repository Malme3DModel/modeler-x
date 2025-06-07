'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { MONACO_EDITOR_CONFIG, TYPESCRIPT_CONFIG, TYPE_DEFINITION_PATHS, DEFAULT_GUI_STATE } from '../config/cadConfig';
import type { MonacoEditorProps } from '../types';
import { useCADWorker } from '@/hooks/useCADWorker';

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
  const originalValueRef = useRef<string>(value);
  
  // CADワーカーフックを使用
  const { evaluateAndRender, isWorking, isWorkerReady, error, clearError } = useCADWorker();

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

    // 型定義ファイルを読み込み（定数から取得）
    const extraLibs: any[] = [];
    const prefix = "";

    // CascadeStudio型定義
    fetch(prefix + TYPE_DEFINITION_PATHS.cascadeStudio)
      .then(response => response.text())
      .then(text => {
        extraLibs.push({ 
          content: text, 
          filePath: 'file://' + TYPE_DEFINITION_PATHS.cascadeStudio
        });
        monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
      })
      .catch(error => console.warn('Could not load CascadeStudio type definitions:', error));

    // StandardLibrary型定義
    fetch(prefix + TYPE_DEFINITION_PATHS.standardLibrary)
      .then(response => response.text())
      .then(text => {
        extraLibs.push({ 
          content: text, 
          filePath: 'file://' + TYPE_DEFINITION_PATHS.standardLibrary.replace('.js', '.d.ts')
        });
        monaco.editor.createModel("", MONACO_EDITOR_CONFIG.language);
        monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
      })
      .catch(error => console.warn('Could not load StandardLibrary type definitions:', error));

    // 関数の折りたたみ処理
    const codeLines = value.split(/\r\n|\r|\n/);
    const collapsed: any[] = [];
    let curCollapse: any = null;
    
    for (let li = 0; li < codeLines.length; li++) {
      if (codeLines[li].startsWith("function")) {
        curCollapse = { "startLineNumber": (li + 1) };
      } else if (codeLines[li].startsWith("}") && curCollapse !== null) {
        curCollapse["endLineNumber"] = (li + 1);
        collapsed.push(curCollapse);
        curCollapse = null;
      }
    }

    if (collapsed.length > 0) {
      const mergedViewState = Object.assign(editor.saveViewState(), {
        "contributionsState": {
          "editor.contrib.folding": {
            "collapsedRegions": collapsed, 
            "lineCount": codeLines.length,
            "provider": "indent" 
          },
          "editor.contrib.wordHighlighter": false 
        }
      });
      editor.restoreViewState(mergedViewState);
    }

    // evaluateCode関数をエディターに追加（新しいフックを使用）
    editor.evaluateCode = async (saveToURL = false) => {
      // 動的にワーカー状態をチェック（キャプチャされた値ではなく）
      const currentWorker = typeof window !== 'undefined' ? (window as any).cadWorker : null;
      const currentlyWorking = typeof window !== 'undefined' ? (window as any).workerWorking : false;
      
      // ワーカーが動作中の場合は実行しない
      if (currentlyWorking) { 
        console.log('CAD Worker is currently working. Please wait...');
        return; 
      }

      // CADワーカーが利用可能かチェック
      if (!currentWorker) {
        console.error('CAD Worker is not ready yet. Please wait for initialization.');
        return;
      }

      // 型定義を更新
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

      // エディターからコードを取得
      const newCode = editor.getValue();

      // エラーハイライトをクリア
      monaco.editor.setModelMarkers(editor.getModel(), 'test', []);

      try {
        // 新しいフックを使用してCADワーカーでコードを評価
        await evaluateAndRender({
          code: newCode,
          meshRes: DEFAULT_GUI_STATE["MeshRes"],
          sceneOptions: { 
            groundPlaneVisible: DEFAULT_GUI_STATE["GroundPlane?"], 
            gridVisible: DEFAULT_GUI_STATE["Grid?"] 
          },
          delay: 100
        });

        // コード評価を実行（従来の処理も維持）
        onEvaluate();

        console.log("Generating Model with OpenCascade.js");
      } catch (error) {
        console.error('Error evaluating code:', error);
      }

      // URLに保存（必要に応じて）
      if (saveToURL) {
        console.log("Saved to URL!");
        // URLエンコード処理は必要に応じて実装
      }
    };

    // キーボードショートカットの設定
    // F5キー: モデル更新（ページリロードを防ぐ）
    editor.addCommand(monaco.KeyCode.F5, () => {
      editor.evaluateCode(true);
    });

    // Ctrl+Enter: コード実行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      editor.evaluateCode(true);
    });

    // Ctrl+S: プロジェクト保存とコード実行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveProject) {
        onSaveProject();
      }
      editor.evaluateCode(true);
    });

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

  // グローバルキーイベントの処理
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
      if (e.key && editorRef.current && onUnsavedChangesUpdate && onProjectNameUpdate) {
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
  }, [onSaveProject, onUnsavedChangesUpdate, onProjectNameUpdate]);

  // ワーカー状態の監視は useCADWorker フックで処理されているため削除

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