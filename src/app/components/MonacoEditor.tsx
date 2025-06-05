'use client';

import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEvaluate: () => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, onChange, onEvaluate }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    });

    // 型定義ファイルを読み込み
    fetch('/js/CascadeStudioTypes.d.ts')
      .then(response => response.text())
      .then(text => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          text,
          'file:///CascadeStudioTypes.d.ts'
        );
      })
      .catch(error => console.warn('Could not load type definitions:', error));

    // Ctrl+Enterでコードを実行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onEvaluate();
    });

    // エディターのフォーカス
    editor.focus();
    setIsLoaded(true);
  };

  // エディターの値が変更された時の処理
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-gray-700 text-white px-4 py-1 text-xs border-b border-gray-600 flex justify-between">
        <span>Press Ctrl+Enter to evaluate code</span>
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