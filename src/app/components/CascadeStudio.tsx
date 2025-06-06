'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// TopNavigationの直接インポート
import TopNavigation from './TopNavigation';
import { createCascadeStudioCore, CascadeStudioCore } from '../lib/CascadeStudioCore';
import { 
  saveFileWithPicker, 
  loadFileWithPicker, 
  loadMultipleFiles,
  compressData,
  decompressData 
} from '../lib/fileUtils';

// 型定義インターフェース
interface MonacoEditorProps {
  value: string;
  onChange: (newCode: string) => void;
  onEvaluate: () => void;
}

interface CascadeViewProps {
  cascadeCore: CascadeStudioCore | null;
}

interface GUIControlsProps {
  cascadeCore: CascadeStudioCore | null;
  onControlChange?: (name: string, value: any) => void;
}

// Monaco EditorをClient-sideでのみロード
const MonacoEditor = dynamic(() => import('./MonacoEditor').catch(() => ({ default: () => <div>Monaco Editor loading...</div> })), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-900 flex items-center justify-center text-white">Loading Editor...</div>
}) as any;

// 3DビューをClient-sideでのみロード
const CascadeView = dynamic(() => import('./CascadeView').catch(() => ({ default: () => <div>3D View loading...</div> })), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-700 flex items-center justify-center text-white">Loading 3D View...</div>
}) as any;

// GUIコントロールをClient-sideでのみロード
const GUIControls = dynamic(() => import('./GUIControls').catch(() => ({ default: () => <div>GUI Controls loading...</div> })), {
  ssr: false
}) as any;

// ResizableLayoutをClient-sideでのみロード
const ResizableLayout = dynamic(() => import('./ResizableLayout'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-800 flex items-center justify-center text-white">Loading Layout...</div>
});

// DockviewLayoutをClient-sideでのみロード
const DockviewLayout = dynamic(() => import('./DockviewLayout'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-800 flex items-center justify-center text-white">Loading Layout...</div>
});

const starterCode = `// Welcome to Cascade Studio!   Here are some useful functions:
//  Translate(), Rotate(), Scale(), Mirror(), Union(), Difference(), Intersection()
//  Box(), Sphere(), Cylinder(), Cone(), Text3D(), Polygon()
//  Offset(), Extrude(), RotatedExtrude(), Revolve(), Pipe(), Loft(), 
//  FilletEdges(), ChamferEdges(),
//  Slider(), Checkbox(), TextInput(), Dropdown()

let holeRadius = Slider("Radius", 30 , 20 , 40);

let sphere     = Sphere(50);
let cylinderZ  =                     Cylinder(holeRadius, 200, true);
let cylinderY  = Rotate([0,1,0], 90, Cylinder(holeRadius, 200, true));
let cylinderX  = Rotate([1,0,0], 90, Cylinder(holeRadius, 200, true));

Translate([0, 0, 50], Difference(sphere, [cylinderX, cylinderY, cylinderZ]));

Translate([-25, 0, 40], Text3D("Hi!", 36, 0.15, 'Consolas'));

// Don't forget to push imported or oc-defined shapes into sceneShapes to add them to the workspace!`;

const CascadeStudio: React.FC = () => {
  const [code, setCode] = useState(starterCode);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [projectName, setProjectName] = useState('Untitled.ts');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [externalFiles, setExternalFiles] = useState<Record<string, any>>({});
  const cascadeCoreRef = useRef<CascadeStudioCore | null>(null);
  const fileHandleRef = useRef<any>(null);

  // CascadeStudioCoreの初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && !cascadeCoreRef.current) {
      cascadeCoreRef.current = createCascadeStudioCore(
        setIsEvaluating,
        setConsoleOutput
      );
      
      cascadeCoreRef.current.initWorker();
    }
    
    return () => {
      // クリーンアップ処理が必要な場合
    };
  }, []);

  // コード変更ハンドラー
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
  }, []);

  // コード評価ハンドラー
  const handleCodeEvaluate = useCallback(() => {
    if (!cascadeCoreRef.current || isEvaluating) return;
    
    cascadeCoreRef.current.evaluate(code);
  }, [code, isEvaluating]);

  // コンソールクリア
  const clearConsole = useCallback(() => {
    setConsoleOutput('');
  }, []);

  // シーンクリア
  const clearScene = useCallback(() => {
    if (cascadeCoreRef.current) {
      cascadeCoreRef.current.clearAll();
    }
  }, []);

  // プロジェクト保存
  const handleSaveProject = useCallback(async () => {
    const projectData = {
      code,
      guiState: cascadeCoreRef.current?.guiState || {},
      externalFiles,
      version: '0.0.7'
    };
    
    const jsonData = JSON.stringify(projectData, null, 2);
    const filename = await saveFileWithPicker(
      jsonData,
      projectName.replace('.ts', '.json'),
      'Cascade Studio プロジェクトファイル',
      'application/json',
      'json'
    );
    
    if (filename) {
      setProjectName(filename.replace('.json', '.ts'));
      setHasUnsavedChanges(false);
      setConsoleOutput(prev => prev + `\nプロジェクトを保存しました: ${filename}`);
    }
  }, [code, externalFiles, projectName]);

  // プロジェクト読み込み
  const handleLoadProject = useCallback(async () => {
    if (isEvaluating) return;
    
    const result = await loadFileWithPicker(
      'Cascade Studio プロジェクトファイル',
      { 'application/json': ['.json'] }
    );
    
    if (result) {
      try {
        const projectData = JSON.parse(result.content);
        setCode(projectData.code || '');
        setExternalFiles(projectData.externalFiles || {});
        if (cascadeCoreRef.current) {
          cascadeCoreRef.current.guiState = projectData.guiState || {};
        }
        fileHandleRef.current = result.handle;
        setProjectName(result.name.replace('.json', '.ts'));
        setHasUnsavedChanges(false);
        setConsoleOutput(prev => prev + `\nプロジェクトを読み込みました: ${result.name}`);
        
        // 外部ファイルを再読み込み
        if (Object.keys(projectData.externalFiles || {}).length > 0) {
          const worker = (window as any).cascadeStudioWorker;
          if (worker) {
            worker.postMessage({
              type: 'loadPrexistingExternalFiles',
              payload: projectData.externalFiles
            });
          }
        }
        
        // コードを評価
        handleCodeEvaluate();
      } catch (error) {
        console.error('プロジェクトの読み込みに失敗しました:', error);
        setConsoleOutput(prev => prev + `\nプロジェクトの読み込みに失敗しました: ${error}`);
      }
    }
  }, [isEvaluating, handleCodeEvaluate]);

  // STEPファイルのエクスポート
  const handleSaveSTEP = useCallback(() => {
    const worker = (window as any).cascadeStudioWorker;
    if (!worker) return;
    
    // STEPファイル生成をWorkerにリクエスト
    worker.postMessage({ type: 'saveShapeSTEP' });
    
    // 一時的なハンドラーを登録
    if (cascadeCoreRef.current) {
      cascadeCoreRef.current.registerMessageHandler('saveShapeSTEP', async (stepContent: string) => {
        const filename = await saveFileWithPicker(
          stepContent,
          'CascadeStudioPart.step',
          'STEPファイル',
          'text/plain',
          'step'
        );
        if (filename) {
          setConsoleOutput(prev => prev + `\nSTEPファイルを保存しました: ${filename}`);
        }
      });
    }
  }, []);

  // STLファイルのエクスポート（Three.jsを使用）
  const handleSaveSTL = useCallback(async () => {
    // CascadeViewコンポーネントからmainObjectを取得する必要がある
    // 現在の実装では、グローバル変数経由でアクセス
    const mainObject = (window as any).cascadeMainObject;
    if (!mainObject) {
      setConsoleOutput(prev => prev + '\nエクスポートする形状がありません');
      return;
    }
    
    try {
      const { exportSTL } = await import('../lib/fileUtils');
      const stlContent = exportSTL(mainObject);
      const filename = await saveFileWithPicker(
        stlContent,
        'CascadeStudioPart.stl',
        'STLファイル',
        'text/plain',
        'stl'
      );
      if (filename) {
        setConsoleOutput(prev => prev + `\nSTLファイルを保存しました: ${filename}`);
      }
    } catch (error) {
      setConsoleOutput(prev => prev + `\nSTLエクスポートエラー: ${error}`);
    }
  }, []);

  // OBJファイルのエクスポート（Three.jsを使用）
  const handleSaveOBJ = useCallback(async () => {
    const mainObject = (window as any).cascadeMainObject;
    if (!mainObject) {
      setConsoleOutput(prev => prev + '\nエクスポートする形状がありません');
      return;
    }
    
    try {
      const { exportOBJ } = await import('../lib/fileUtils');
      const objContent = exportOBJ(mainObject);
      const filename = await saveFileWithPicker(
        objContent,
        'CascadeStudioPart.obj',
        'OBJファイル',
        'text/plain',
        'obj'
      );
      if (filename) {
        setConsoleOutput(prev => prev + `\nOBJファイルを保存しました: ${filename}`);
      }
    } catch (error) {
      setConsoleOutput(prev => prev + `\nOBJエクスポートエラー: ${error}`);
    }
  }, []);

  // ファイルインポート
  const handleLoadFiles = useCallback(async (files: FileList) => {
    const worker = (window as any).cascadeStudioWorker;
    if (!worker) return;
    
    // ファイルをWorkerに送信
    worker.postMessage({
      type: 'loadFiles',
      payload: files
    });
    
    // インポート結果を受け取るハンドラー
    if (cascadeCoreRef.current) {
      cascadeCoreRef.current.registerMessageHandler('loadFiles', (extFiles: any) => {
        setExternalFiles(extFiles);
        setConsoleOutput(prev => prev + '\n外部ファイルを読み込みました');
      });
    }
  }, []);

  // インポートファイルのクリア
  const handleClearFiles = useCallback(() => {
    const worker = (window as any).cascadeStudioWorker;
    if (worker) {
      worker.postMessage({ type: 'clearExternalFiles' });
    }
    setExternalFiles({});
    setConsoleOutput(prev => prev + '\n外部ファイルをクリアしました');
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S または Cmd+S でプロジェクト保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
        handleCodeEvaluate();
      }
      // F5でコード評価（リロードを防ぐ）
      if (e.key === 'F5') {
        e.preventDefault();
        handleCodeEvaluate();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProject, handleCodeEvaluate]);

  return (
    <div className="h-screen flex flex-col bg-gray-800">
      <TopNavigation 
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onSaveSTEP={handleSaveSTEP}
        onSaveSTL={handleSaveSTL}
        onSaveOBJ={handleSaveOBJ}
        onLoadFiles={handleLoadFiles}
        onClearFiles={handleClearFiles}
        isWorking={isEvaluating}
      />
      <DockviewLayout
        leftPanel={
          <MonacoEditor
            value={code}
            onChange={handleCodeChange}
            onEvaluate={handleCodeEvaluate}
          />
        }
        editorTitle={`${hasUnsavedChanges ? '* ' : ''}${projectName}`}
        rightTopPanel={
          <div className="flex-1 relative h-full">
            <CascadeView cascadeCore={cascadeCoreRef.current} />
            {/* GUI Controls Overlay */}
            <GUIControls 
              cascadeCore={cascadeCoreRef.current}
              onControlChange={(name: string, value: any) => {
                if (cascadeCoreRef.current) {
                  cascadeCoreRef.current.guiState[name] = value;
                }
              }}
            />
            {/* ビューポートコントロール */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={clearScene}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white shadow-lg"
                disabled={isEvaluating}
              >
                Clear Scene
              </button>
              <button
                onClick={handleCodeEvaluate}
                className={`text-xs px-3 py-1 rounded shadow-lg text-white ${
                  isEvaluating 
                    ? 'bg-yellow-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
                disabled={isEvaluating}
              >
                {isEvaluating ? 'Evaluating...' : 'Run (Ctrl+Enter)'}
              </button>
            </div>
          </div>
        }
        rightBottomPanel={
          <div className="flex flex-col h-full bg-gray-900">
            <div className="flex-1 p-2 overflow-y-auto">
              <div className="font-mono text-xs whitespace-pre-wrap text-gray-300">
                {consoleOutput || <span className="text-gray-500">Console output will appear here...</span>}
              </div>
            </div>
            <div className="border-t border-gray-700 p-2 flex justify-end">
              <button
                onClick={clearConsole}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white"
              >
                Clear
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CascadeStudio; 