'use client';

import React, { useRef, useCallback } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ThreeViewport, { ThreeViewportRef } from '../components/ThreeViewport';
import DockviewLayout from '../components/DockviewLayout';
import CADWorkerManager from '../components/CADWorkerManager';
import Header from '../components/Header';
import { ProjectProvider } from '../context/ProjectContext';
import { useProjectState } from '../hooks/useProjectState';
import { useProjectActions } from '../hooks/useProjectActions';
import { DEFAULT_CAD_CODE } from '../constants/defaultCode';


// メインコンポーネント（プロバイダー内）
function HomeContent() {
  const {
    code,
    editorTitle,
    isCADWorkerReady,
    consoleMessages,
    hasUnsavedChanges,
    projectName,
    handleCodeChange,
    handleEvaluate,
    handleSaveProject,
    handleProjectNameUpdate,
    handleUnsavedChangesUpdate,
    cadWorkerCallbacks
  } = useProjectState();

  // プロジェクト操作フック
  const {
    saveProject,
    loadProject,
    exportSTEP,
    exportSTL,
    exportOBJ,
    isLoading: isProjectActionLoading,
    lastError: projectActionError
  } = useProjectActions();
  
  const threejsViewportRef = useRef<ThreeViewportRef>(null);

  // CADワーカーからの形状更新を処理
  const handleShapeUpdate = useCallback((facesAndEdges: any, sceneOptions: any) => {
    if (threejsViewportRef.current?.updateShape) {
      threejsViewportRef.current.updateShape(facesAndEdges, sceneOptions);
    }
    // 循環参照を避けるため、ここではThreeViewport更新のみ行う
  }, []);

  // ThreeViewportのシーン準備完了時の処理
  const handleSceneReady = useCallback((scene: any) => {
    // 将来的にシーン設定が必要な場合はここに実装
  }, []);

  // プロジェクト操作のハンドラー（UIイベント→フック呼び出し）
  const handleLoadProject = useCallback(async () => {
    const projectData = await loadProject();
    if (projectData) {
      handleCodeChange(projectData.code);
      handleProjectNameUpdate(projectData.name);
    }
  }, [loadProject, handleCodeChange, handleProjectNameUpdate]);

  const handleSaveProjectAction = useCallback(async () => {
    await saveProject(projectName, code);
  }, [saveProject, projectName, code]);

  const handleExportSTEP = useCallback(async () => {
    await exportSTEP();
  }, [exportSTEP]);

  const handleExportSTL = useCallback(async () => {
    await exportSTL();
  }, [exportSTL]);

  const handleExportOBJ = useCallback(async () => {
    await exportOBJ();
  }, [exportOBJ]);

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
        onWorkerReady={cadWorkerCallbacks.onWorkerReady}
        onShapeUpdate={handleShapeUpdate}
        onProgress={cadWorkerCallbacks.onProgress}
        onLog={cadWorkerCallbacks.onLog}
        onError={cadWorkerCallbacks.onError}
        autoEvaluateCode={DEFAULT_CAD_CODE}
      />

      {/* トップナビゲーション */}
      <div className="shrink-0 z-10">
        <Header 
          isCADWorkerReady={isCADWorkerReady} 
          onSaveProject={handleSaveProjectAction}
          onLoadProject={handleLoadProject}
          onSaveSTEP={handleExportSTEP}
          onSaveSTL={handleExportSTL}
          onSaveOBJ={handleExportOBJ}
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

// プロバイダーでラップしたメインコンポーネント
export default function Home() {
  return (
    <ProjectProvider>
      <HomeContent />
    </ProjectProvider>
  );
}
