'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEvaluate: () => void;
  onSaveProject?: () => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesUpdate?: (hasChanges: boolean) => void;
  projectName?: string;
  onProjectNameUpdate?: (name: string) => void;
}

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
  const [isWorking, setIsWorking] = useState(false);
  const originalValueRef = useRef<string>(value);

  // エディターがマウントされた時の処理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // TypeScript設定
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowJs: true,
      checkJs: false,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    // 型定義ファイルを読み込み
    const extraLibs: any[] = [];
    const prefix = "";

    // CascadeStudio型定義
    fetch(prefix + "/js/CascadeStudioTypes.d.ts")
      .then(response => response.text())
      .then(text => {
        extraLibs.push({ 
          content: text, 
          filePath: 'file:///CascadeStudioTypes.d.ts' 
        });
        monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);
      })
      .catch(error => console.warn('Could not load CascadeStudio type definitions:', error));

    // StandardLibrary型定義
    fetch(prefix + "/js/StandardLibraryIntellisense.ts")
      .then(response => response.text())
      .then(text => {
        extraLibs.push({ 
          content: text, 
          filePath: 'file:///StandardLibraryIntellisense.d.ts' 
        });
        monaco.editor.createModel("", "typescript");
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

    // evaluateCode関数をエディターに追加
    editor.evaluateCode = (saveToURL = false) => {
      // ワーカーが動作中の場合は実行しない
      if ((window as any).workerWorking) { 
        return; 
      }

      // ワーカー動作フラグを設定
      (window as any).workerWorking = true;
      setIsWorking(true);

      // 型定義を更新
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

      // エディターからコードを取得
      const newCode = editor.getValue();

      // エラーハイライトをクリア
      monaco.editor.setModelMarkers(editor.getModel(), 'test', []);

      // コード評価を実行
      onEvaluate();

      // URLに保存（必要に応じて）
      if (saveToURL) {
        console.log("Saved to URL!");
        // URLエンコード処理は必要に応じて実装
      }

      console.log("Generating Model");
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

  // ワーカー状態の監視
  useEffect(() => {
    const checkWorkerStatus = () => {
      if (!(window as any).workerWorking && isWorking) {
        setIsWorking(false);
      }
    };

    const interval = setInterval(checkWorkerStatus, 100);
    return () => clearInterval(interval);
  }, [isWorking]);

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
    <div className="flex-1 flex flex-col">
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