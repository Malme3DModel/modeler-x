'use client';

import React, { useState, useCallback, useRef } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ThreeViewport, { ThreeViewportRef } from '../components/ThreeViewport';
import DockviewLayout from '../components/DockviewLayout';
import CADWorkerManager from '../components/CADWorkerManager';

// デフォルトコード
const defaultCode = 
`// Welcome to Cascade Studio!   Here are some useful functions:
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


export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectName, setProjectName] = useState('Untitled');
  const [isCADWorkerReady, setIsCADWorkerReady] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    '> Welcome to Modeler X!',
    '> Loading CAD Kernel...'
  ]);
  const threejsViewportRef = useRef<ThreeViewportRef>(null);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleEvaluate = useCallback(() => {
    // この関数は現在MonacoEditorコンポーネント内でCADワーカーを直接呼び出しているため、
    // 追加の処理が必要な場合はここに実装
    console.log('Code evaluation triggered');
  }, []);

  const handleSaveProject = useCallback(() => {
    // TODO: プロジェクト保存機能を実装
    console.log('Saving project:', projectName);
    setHasUnsavedChanges(false);
  }, [projectName]);

  const handleProjectNameUpdate = useCallback((name: string) => {
    setProjectName(name);
  }, []);

  const handleUnsavedChangesUpdate = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  const handleWorkerReady = useCallback(() => {
    setIsCADWorkerReady(true);
    setConsoleMessages(prev => [...prev, '> CAD Kernel loaded successfully!', '> Ready to evaluate code']);
  }, []);

  // CADワーカーからの形状更新を処理
  const handleShapeUpdate = useCallback((facesAndEdges: any, sceneOptions: any) => {
    if (threejsViewportRef.current?.updateShape) {
      threejsViewportRef.current.updateShape(facesAndEdges, sceneOptions);
    }
  }, []);

  // CADワーカーからの進捗更新を処理
  const handleProgress = useCallback((progress: { opNumber: number; opType: string }) => {
    const progressMessage = `> Generating Model${'.' .repeat(progress.opNumber)}${progress.opType ? ` (${progress.opType})` : ''}`;
    setConsoleMessages(prev => {
      const newMessages = [...prev];
      // 最後のメッセージが進捗メッセージの場合は置き換え、そうでなければ追加
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('> Generating Model')) {
        newMessages[newMessages.length - 1] = progressMessage;
      } else {
        newMessages.push(progressMessage);
      }
      return newMessages;
    });
  }, []);

  // CADワーカーからのログメッセージを処理
  const handleLog = useCallback((message: string) => {
    setConsoleMessages(prev => [...prev, `> ${message}`]);
  }, []);

  // CADワーカーからのエラーメッセージを処理
  const handleError = useCallback((error: string) => {
    setConsoleMessages(prev => [...prev, `> ERROR: ${error}`]);
  }, []);

  // ThreeViewportのシーン準備完了時の処理
  const handleSceneReady = useCallback((scene: any) => {
  }, []);

  // エディタータイトルの生成
  const editorTitle = `${hasUnsavedChanges ? '* ' : ''}${projectName}.ts`;

  // 左パネル（エディター）
  const leftPanel = (
    <MonacoEditor
      value={code}
      onChange={handleCodeChange}
      onEvaluate={handleEvaluate}
      onSaveProject={handleSaveProject}
      hasUnsavedChanges={hasUnsavedChanges}
      onUnsavedChangesUpdate={handleUnsavedChangesUpdate}
      projectName={projectName}
      onProjectNameUpdate={handleProjectNameUpdate}
    />
  );

  // 右上パネル（3Dビューポート）
  const rightTopPanel = (
    <ThreeViewport 
      ref={threejsViewportRef}
      onSceneReady={handleSceneReady}
    />
  );

  // 右下パネル（コンソール）
  const rightBottomPanel = (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 h-full overflow-auto text-white font-mono text-sm">
                 {consoleMessages.map((message, index) => (
           <div key={index} className="text-gray-300">{message}</div>
         ))}
         {isCADWorkerReady && (
           <div className="text-green-400 mt-2">
             &gt; CAD Worker Status: Ready
           </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* CADワーカーマネージャー（非表示コンポーネント） */}
      <CADWorkerManager
        onWorkerReady={handleWorkerReady}
        onShapeUpdate={handleShapeUpdate}
        onProgress={handleProgress}
        onLog={handleLog}
        onError={handleError}
        autoEvaluateCode={defaultCode}
      />

      {/* トップナビゲーション */}
      <div className="bg-gray-800 text-white px-4 py-2 border-b border-gray-700 z-10">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Modeler X</span>
          <button 
            onClick={handleSaveProject}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            title="Save Project to .json"
          >
            Save Project
          </button>
          <button 
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            title="Load Project from .json"
          >
            Load Project
          </button>
          <button 
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            title="Save STEP"
          >
            Save STEP
          </button>
          <button 
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            title="Save STL"
          >
            Save STL
          </button>
          <button 
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            title="Save OBJ"
          >
            Save OBJ
          </button>
          {!isCADWorkerReady && (
            <span className="text-yellow-400 text-sm">
              • Loading CAD Kernel...
            </span>
          )}
          {isCADWorkerReady && (
            <span className="text-green-400 text-sm">
              • CAD Kernel Ready
            </span>
          )}
        </div>
      </div>

      {/* メインコンテンツエリア - Dockview */}
      <div className="flex-1 overflow-hidden">
        <DockviewLayout
          leftPanel={leftPanel}
          rightTopPanel={rightTopPanel}
          rightBottomPanel={rightBottomPanel}
          editorTitle={editorTitle}
        />
      </div>
    </div>
  );
}
