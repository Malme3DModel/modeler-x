'use client';

import React, { useRef, useCallback } from 'react';
import MonacoEditor from '../components/MonacoEditor';
import ThreeViewport, { ThreeViewportRef } from '../components/ThreeViewport';
import DockviewLayout from '../components/DockviewLayout';
import CADWorkerManager from '../lib/cadWorkerManager';
import ChatPanel from '../components/ChatPanel';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ProjectProvider } from '../context/ProjectContext';
import { useProjectState } from '../hooks/useProjectState';
import { useProjectActions } from '../hooks/useProjectActions';
import { useCADWorker } from '../hooks/useCADWorker';
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

  // CADワーカーの状態を取得（フッター用）
  const { isWorking, isWorkerReady, error } = useCADWorker();
  
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

  // エディターパネル（左側非アクティブ）
  const editorPanel = (
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

  // CADビューパネル（左側アクティブ）
  const cadViewPanel = (
    <ThreeViewport 
      ref={threejsViewportRef}
      onSceneReady={handleSceneReady}
    />
  );

  // チャットパネル（右側）
  const chatPanel = (
    <ChatPanel 
      onExecuteCode={(code) => {
        // AIが生成したコードをMonacoEditorに設定して実行
        handleCodeChange(code);
        // 少し遅延してから実行（エディターの更新を待つ）
        setTimeout(() => {
          handleEvaluate();
        }, 100);
      }}
    />
  );

  return (
    <div className="h-screen flex flex-col">
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
          editorPanel={editorPanel}
          cadViewPanel={cadViewPanel}
          consolePanel={chatPanel}
          editorTitle={editorTitle}
        />
      </div>

      {/* フッター */}
      <Footer
        isCADWorkerReady={isCADWorkerReady}
        isWorking={isWorking}
        isWorkerReady={isWorkerReady}
        hasUnsavedChanges={hasUnsavedChanges}
        error={error || undefined}
      />
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
