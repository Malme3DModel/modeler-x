'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ThreeViewport, { ThreeViewportRef } from '../components/ThreeViewport';
import DockviewLayout from '../components/DockviewLayout';
import CADWorkerManager from '../components/CADWorkerManager';
import Header from '../components/Header';
import { DEFAULT_CAD_CODE, DEFAULT_PROJECT_CONFIG, INITIAL_CONSOLE_MESSAGES } from '../constants/defaultCode';
import type { ProjectState, CADWorkerProgress } from '../types';


export default function Home() {
  const [code, setCode] = useState(DEFAULT_CAD_CODE);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectName, setProjectName] = useState<string>(DEFAULT_PROJECT_CONFIG.name);
  const [isCADWorkerReady, setIsCADWorkerReady] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([
    ...INITIAL_CONSOLE_MESSAGES
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
    <div className="h-full bg-modeler-background-primary flex flex-col">
      <div className="p-4 h-full overflow-auto text-white font-mono text-sm">
                 {consoleMessages.map((message, index) => (
           <div key={index} className="text-modeler-control-text-secondary">{message}</div>
         ))}
         {isCADWorkerReady && (
           <div className="text-modeler-accent-success mt-2">
             &gt; CAD Worker Status: Ready
           </div>
         )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-modeler-background-primary">
      {/* CADワーカーマネージャー（非表示コンポーネント） */}
      <CADWorkerManager
        onWorkerReady={handleWorkerReady}
        onShapeUpdate={handleShapeUpdate}
        onProgress={handleProgress}
        onLog={handleLog}
        onError={handleError}
        autoEvaluateCode={DEFAULT_CAD_CODE}
      />

      {/* トップナビゲーション */}
      <div className="bg-modeler-background-secondary text-modeler-control-text-primary px-4 py-2 border-b border-modeler-control-border z-10">
        <Header 
          isCADWorkerReady={isCADWorkerReady} 
          onSaveProject={handleSaveProject} 
        />
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
