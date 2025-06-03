'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { editor as monacoEditor } from 'monaco-editor';

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

export const MonacoCodeEditor = forwardRef<MonacoCodeEditorRef, MonacoCodeEditorProps>(
  function MonacoCodeEditor(
    {
      initialCode = '',
      language = 'javascript',
      theme = 'vs-dark',
      onCodeChange,
      onEvaluate,
      className = '',
      style = {}
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
    
    // エディターの初期化
    useEffect(() => {
      if (!containerRef.current) return;
      
      const initMonaco = async () => {
        try {
          // Monaco Editorの動的インポート
          const monaco = await import('monaco-editor');
          
          // ワーカーURLの設定
          if (typeof window !== 'undefined' && !window.MonacoEnvironment) {
            window.MonacoEnvironment = {
              getWorkerUrl: function(_moduleId, label) {
                if (label === 'typescript' || label === 'javascript') {
                  return '/monaco-editor-workers/ts.worker.js';
                }
                return '/monaco-editor-workers/editor.worker.js';
              }
            };
          }
          
          if (monaco.languages.typescript) {
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: false
            });
            
            // ライブラリ定義の追加
            monaco.languages.typescript.javascriptDefaults.addExtraLib(`
              // CAD標準ライブラリ関数
              declare function Box(x: number, y: number, z: number, centered?: boolean): any;
              declare function Sphere(radius: number): any;
              declare function Cylinder(radius: number, height: number, centered?: boolean): any;
              declare function Union(shapes: any[]): any;
              declare function Difference(mainShape: any, subtractShapes: any[]): any;
              declare function Translate(offset: [number, number, number], shapes: any[]): any[];
              declare function Rotate(axis: [number, number, number], degrees: number, shapes: any[]): any[];
              
              // ワーカーGUI状態
              declare var GUIState: Record<string, any>;
            `, 'ts:cascade-studio-types');
            
            // TypeScript設定の最適化
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ES2020,
              allowNonTsExtensions: true,
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              module: monaco.languages.typescript.ModuleKind.CommonJS,
              noEmit: true,
              esModuleInterop: true,
              allowJs: true,
              strict: false
            });
          }

          // containerRef.currentが存在することを確認
          if (containerRef.current) {
            // エディターのインスタンス作成
            editorRef.current = monaco.editor.create(containerRef.current, {
              value: initialCode,
              language,
              theme,
              automaticLayout: true,
              minimap: { enabled: false },
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              readOnly: false,
              fontSize: 14,
              wordWrap: 'on'
            });

            // コード変更イベントの設定
            if (onCodeChange) {
              editorRef.current.onDidChangeModelContent(() => {
                if (editorRef.current) {
                  onCodeChange(editorRef.current.getValue());
                }
              });
            }

            // キーバインディングの設定
            editorRef.current.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
              () => {
                if (editorRef.current && onEvaluate) {
                  onEvaluate(editorRef.current.getValue());
                }
              }
            );

            // Ctrl+Enter でコード評価
            editorRef.current.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              () => {
                if (editorRef.current && onEvaluate) {
                  onEvaluate(editorRef.current.getValue());
                }
              }
            );
          }
        } catch (error) {
          console.error('Monaco Editor initialization failed:', error);
        }
      };

      initMonaco();

      // クリーンアップ
      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }, [initialCode, language, theme, onCodeChange, onEvaluate]);

    // 外部からのアクセス用メソッド
    useImperativeHandle(ref, () => ({
      getValue: () => {
        return editorRef.current ? editorRef.current.getValue() : '';
      },
      setValue: (code: string) => {
        if (editorRef.current) {
          editorRef.current.setValue(code);
        }
      },
      getEditor: () => editorRef.current,
      formatCode: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      }
    }));

    return (
      <div
        ref={containerRef}
        className={`monaco-editor-container ${className}`}
        style={{ 
          width: '100%', 
          height: '100%',
          ...style 
        }}
      />
    );
  }
); 