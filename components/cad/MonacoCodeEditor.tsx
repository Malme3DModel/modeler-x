'use client';

import { useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import type { editor as monacoEditor } from 'monaco-editor';

export interface MonacoCodeEditorProps {
  initialCode?: string;
  language?: string;
  theme?: string;
  onCodeChange?: (code: string) => void;
  onEvaluate?: (code: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface MonacoCodeEditorRef {
  getValue: () => string;
  setValue: (code: string) => void;
  getEditor: () => monacoEditor.IStandaloneCodeEditor | null;
  formatCode: () => void;
}

const MonacoCodeEditor = forwardRef<MonacoCodeEditorRef, MonacoCodeEditorProps>(
  ({ 
    initialCode = '', 
    language = 'typescript', 
    theme = 'vs-dark', 
    onCodeChange, 
    onEvaluate,
    className,
    style 
  }, ref) => {
    const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue() ?? '',
      setValue: (code: string) => editorRef.current?.setValue(code),
      getEditor: () => editorRef.current,
      formatCode: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      }
    }));

    const handleEditorDidMount = useCallback((editor: monacoEditor.IStandaloneCodeEditor, monaco: any) => {
      editorRef.current = editor;

      // Ctrl+Enter での評価実行
      if (onEvaluate) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onEvaluate(editor.getValue());
        });
        
        // F5キーでの評価実行（元のCascadeStudioと同様）
        // ブラウザのデフォルト動作（ページリロード）を確実に阻止
        editor.addCommand(monaco.KeyCode.F5, () => {
          onEvaluate(editor.getValue());
        });
      }

      // グローバルなF5キーハンドラーを追加（エディタ内外問わず統一的に処理）
      const handleGlobalF5 = (e: KeyboardEvent) => {
        if (e.key === 'F5' || e.keyCode === 116) {
          e.preventDefault();
          e.stopPropagation();
          if (onEvaluate) {
            onEvaluate(editor.getValue());
          }
          return false;
        }
      };

      // エディタがマウントされた時にグローバルハンドラーを追加
      document.addEventListener('keydown', handleGlobalF5, true); // useCapture: true で優先的にキャプチャ

      // エディタが破棄される時にハンドラーを削除
      editor.onDidDispose(() => {
        document.removeEventListener('keydown', handleGlobalF5, true);
      });

      // TypeScript設定の最適化
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowJs: true,
        typeRoots: ['node_modules/@types']
      });

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

      console.log('✅ [MonacoCodeEditor] @monaco-editor/react initialized successfully');
    }, [onEvaluate]);

    const handleEditorChange = useCallback((value: string | undefined) => {
      if (onCodeChange && value !== undefined) {
        onCodeChange(value);
      }
    }, [onCodeChange]);

    return (
      <div 
        className={className}
        style={{ 
          width: '100%', 
          height: '100%', 
          ...style 
        }}
      >
        <MonacoEditor
          height="100%"
          language={language}
          theme={theme}
          value={initialCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            contextmenu: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showModules: true,
              showProperties: true,
              showKeywords: true,
              showSnippets: true,
            }
          }}
        />
      </div>
    );
  }
);

MonacoCodeEditor.displayName = 'MonacoCodeEditor';

// 名前付きエクスポートとデフォルトエクスポートの両方を提供
export { MonacoCodeEditor };
export default MonacoCodeEditor; 