'use client';

import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useCADWorker } from '../../hooks/useCADWorker';

interface CodeEditorProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

const defaultCADCode = `// 🎯 CADエディター - サンプルコード
// 基本的な形状を作成してみましょう

// 基本形状の作成
const box = Box(10, 10, 10, true);
const sphere = Sphere(8);

// ブール演算
const result = Difference(box, [sphere]);

// 結果を表示
result;`;

export default function CodeEditor({ cadWorkerState }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState(defaultCADCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const { executeCADCode, isWorking, error } = cadWorkerState;

  // Monaco Editorの設定
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // TypeScript設定
    const monaco = (window as any).monaco;
    if (monaco) {
      // 詳細なCAD関数の型定義を追加
      fetch('/types/cad-library.d.ts')
        .then(response => response.text())
        .then(typeDefinitions => {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            typeDefinitions,
            'file:///node_modules/@types/cad-library/index.d.ts'
          );
        })
        .catch(() => {
          // フォールバック: 基本的な型定義
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `
            // CAD標準ライブラリ型定義（基本版）
            declare function Box(x: number, y: number, z: number, centered?: boolean): any;
            declare function Sphere(radius: number): any;
            declare function Cylinder(radius: number, height: number, centered?: boolean): any;
            declare function Cone(radius: number, height: number, centered?: boolean): any;
            declare function Union(shapes: any[]): any;
            declare function Difference(shape: any, tools: any[]): any;
            declare function Intersection(shapes: any[]): any;
            declare function Translate(vector: [number, number, number], shapes: any[]): any;
            declare function Rotate(axis: [number, number, number], angle: number, shapes: any[]): any;
            declare function Scale(factors: [number, number, number], shapes: any[]): any;
            declare function Mirror(plane: [number, number, number, number], shapes: any[]): any;
            declare function Extrude(shape: any, distance: number, direction?: [number, number, number]): any;
            declare function Revolve(shape: any, axis: [number, number, number], angle: number): any;
            declare function Loft(profiles: any[]): any;
            declare function FilletEdges(shape: any, radius: number, edges?: any[]): any;
            declare function ChamferEdges(shape: any, distance: number, edges?: any[]): any;
            declare function Offset(shape: any, distance: number): any;
            declare function Slider(name: string, defaultValue: number, min: number, max: number, step?: number): number;
            declare function Checkbox(name: string, defaultValue: boolean): boolean;
            declare function Button(name: string): boolean;
            declare function TextInput(name: string, defaultValue: string): string;
            declare function Dropdown(name: string, options: string[], defaultIndex: number): number;
            declare function Text3D(text: string, size: number, height: number): any;
            declare const PI: number;
            declare const E: number;
            `,
            'cad-library-basic.d.ts'
          );
        });

      // TypeScript設定の最適化
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
        strict: false, // CADコードでは厳密な型チェックを緩和
        noImplicitAny: false,
        strictNullChecks: false
      });

      // 診断設定（エラー表示の調整）
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false
      });
    }

    // キーボードショートカット設定
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteCode();
    });

    // 自動フォーマット設定
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });
  };

  // コード実行
  const handleExecuteCode = async () => {
    if (!code.trim() || isWorking) return;
    
    setIsExecuting(true);
    try {
      await executeCADCode(code);
    } catch (error) {
      console.error('🚫 [CodeEditor] Code execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // コード変更ハンドラー
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 bg-base-200 border-b border-base-300">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">🎯 CADコードエディター</h2>
          <div className="badge badge-primary">TypeScript</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecuteCode}
            disabled={isWorking || isExecuting}
            className={`btn btn-sm ${
              isWorking || isExecuting 
                ? 'btn-disabled loading' 
                : 'btn-primary'
            }`}
          >
            {isWorking || isExecuting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                実行中...
              </>
            ) : (
              <>
                ▶️ 実行 (Ctrl+Enter)
              </>
            )}
          </button>
          <div className="text-xs text-base-content/70">
            行: {code.split('\n').length}
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="alert alert-error m-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            hover: {
              enabled: true,
            },
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between p-2 bg-base-200 border-t border-base-300 text-xs text-base-content/70">
        <div className="flex items-center gap-4">
          <span>🎯 CAD関数の自動補完が利用可能</span>
          <span>⌨️ Ctrl+Enter で実行</span>
        </div>
        <div className="flex items-center gap-2">
          <span>TypeScript Intellisense</span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
} 