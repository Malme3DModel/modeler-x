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

  return (
    <div className="h-screen flex flex-col bg-gray-800">
      <TopNavigation />
      <div className="flex-1 flex">
        {/* Left Panel - Code Editor */}
        <div className="w-1/2 flex flex-col border-r border-gray-600">
          <div className="bg-gray-800 text-white px-4 py-2 text-sm border-b border-gray-600 flex justify-between items-center">
            <span>* Untitled.ts</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">
                GUI: {Object.keys(cascadeCoreRef.current?.guiState || {}).length} | Pending: {isEvaluating ? '1' : '0'}
              </span>
            </div>
          </div>
          <MonacoEditor
            value={code}
            onChange={handleCodeChange}
            onEvaluate={handleCodeEvaluate}
          />
        </div>

        {/* Right Panel - 3D View and Console */}
        <div className="w-1/2 flex flex-col relative">
          {/* 3D View */}
          <div className="flex-1 relative">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm border-b border-gray-600 flex justify-between items-center">
              <span>CAD View</span>
              <div className="flex gap-2">
                <button
                  onClick={clearScene}
                  className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                  disabled={isEvaluating}
                >
                  Clear Scene
                </button>
                <button
                  onClick={handleCodeEvaluate}
                  className={`text-xs px-2 py-1 rounded ${
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
          </div>

          {/* Console */}
          <div className="h-48 flex flex-col border-t border-gray-600">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm border-b border-gray-600 flex justify-between">
              <span>Console</span>
              <button
                onClick={clearConsole}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 bg-gray-900 p-2 overflow-y-auto">
              <div className="font-mono text-xs whitespace-pre-wrap">
                {consoleOutput || <span className="text-gray-500">Console output will appear here...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CascadeStudio; 