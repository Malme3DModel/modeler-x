'use client';

import React, { useState, useCallback } from 'react';
import MonacoEditor from './components/MonacoEditor';
import ThreeViewport from './components/ThreeViewport';

// v0のデフォルトコード
const defaultCode = `// Welcome to Cascade Studio!   Here are some useful functions:
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

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleEvaluate = useCallback(() => {
    // TODO: CADワーカーでコードを評価する処理を実装
    console.log('Evaluating code:', code);
    // 現在は簡易的にログ出力のみ
  }, [code]);

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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* トップナビゲーション */}
      <div className="bg-gray-800 text-white px-4 py-2 border-b border-gray-700">
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
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex">
        {/* 左側: コードエディター */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          <div className="bg-gray-700 text-white px-4 py-1 text-xs border-b border-gray-600">
            <span>{hasUnsavedChanges ? '* ' : ''}{projectName}</span>
          </div>
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
        </div>

        {/* 右側: 3Dビューポートとコンソール */}
        <div className="w-1/2 flex flex-col">
          {/* 3Dビューポート */}
          <div className="flex-1">
            <ThreeViewport />
          </div>

          {/* コンソール */}
          <div className="h-48 bg-gray-900 border-t border-gray-700">
            <div className="bg-gray-700 text-white px-4 py-1 text-xs border-b border-gray-600">
              <span>Console</span>
            </div>
            <div className="p-4 h-full overflow-auto text-white font-mono text-sm">
              <div className="text-gray-300">&gt; Welcome to Modeler X!</div>
              <div className="text-gray-300">&gt; Loading CAD Kernel...</div>
              <div className="text-gray-300">&gt; Ready to evaluate code</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
