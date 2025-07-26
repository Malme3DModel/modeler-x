import { useCallback } from 'react';
import { useProjectContext, type ProjectContextType } from '@/context/ProjectContext';

export interface UseProjectStateReturn {
  // 状態
  projectName: string;
  code: string;
  hasUnsavedChanges: boolean;
  isCADWorkerReady: boolean;
  consoleMessages: string[];
  
  // 基本操作
  setProjectName: (name: string) => void;
  setCode: (code: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  
  // CADワーカー関連
  setCADWorkerReady: (ready: boolean) => void;
  
  // コンソール関連
  addConsoleMessage: (message: string) => void;
  clearConsole: () => void;
  
  // 複合操作
  saveProject: () => void;
  resetProject: () => void;
  
  // 計算されたプロパティ
  editorTitle: string;
  
  // コンポーネント用ヘルパー
  handleCodeChange: (newCode: string) => void;
  handleEvaluate: () => void;
  handleSaveProject: () => void;
  handleProjectNameUpdate: (name: string) => void;
  handleUnsavedChangesUpdate: (hasChanges: boolean) => void;
  
  // CADワーカー連携用コールバック（そのまま渡せる）
  cadWorkerCallbacks: {
    onWorkerReady: () => void;
    onShapeUpdate: (facesAndEdges: any, sceneOptions: any) => void;
    onProgress: (progress: { opNumber: number; opType: string }) => void;
    onLog: (message: string) => void;
    onError: (error: string) => void;
  };
}

/**
 * プロジェクト状態管理フック
 * 
 * ProjectContextを使いやすくラップし、一般的なユースケースに最適化された
 * インターフェースを提供します。
 * 
 * @example
 * ```typescript
 * const { 
 *   code, 
 *   editorTitle, 
 *   handleCodeChange, 
 *   cadWorkerCallbacks 
 * } = useProjectState();
 * 
 * return (
 *   <MonacoEditor 
 *     value={code}
 *     onChange={handleCodeChange}
 *     title={editorTitle}
 *   />
 * );
 * ```
 */
export const useProjectState = (): UseProjectStateReturn => {
  const context = useProjectContext();
  
  // 基本操作のラッパー
  const handleCodeChange = useCallback((newCode: string) => {
    context.setCode(newCode);
  }, [context]);

  const handleEvaluate = useCallback(() => {
    // この関数は現在MonacoEditorコンポーネント内でCADワーカーを直接呼び出しているため、
    // 追加の処理が必要な場合はここに実装
    console.log('Code evaluation triggered');
  }, []);

  const handleSaveProject = useCallback(() => {
    context.saveProject();
  }, [context]);

  const handleProjectNameUpdate = useCallback((name: string) => {
    context.setProjectName(name);
  }, [context]);

  const handleUnsavedChangesUpdate = useCallback((hasChanges: boolean) => {
    context.setUnsavedChanges(hasChanges);
  }, [context]);

  const resetProject = useCallback(() => {
    context.resetProject();
  }, [context]);

  // CADワーカー連携用コールバック（そのまま渡せる形式）
  const cadWorkerCallbacks = {
    onWorkerReady: context.handleWorkerReady,
    onShapeUpdate: context.handleShapeUpdate,
    onProgress: context.handleProgress,
    onLog: context.handleLog,
    onError: context.handleError
  };

  return {
    // 状態（読み取り専用として展開）
    projectName: context.state.projectName,
    code: context.state.code,
    hasUnsavedChanges: context.state.hasUnsavedChanges,
    isCADWorkerReady: context.state.isCADWorkerReady,
    consoleMessages: context.state.consoleMessages,
    
    // 基本操作
    setProjectName: context.setProjectName,
    setCode: context.setCode,
    setUnsavedChanges: context.setUnsavedChanges,
    
    // CADワーカー関連
    setCADWorkerReady: context.setCADWorkerReady,
    
    // コンソール関連
    addConsoleMessage: context.addConsoleMessage,
    clearConsole: context.clearConsole,
    
    // 複合操作
    saveProject: context.saveProject,
    resetProject,
    
    // 計算されたプロパティ
    editorTitle: context.getEditorTitle(),
    
    // コンポーネント用ヘルパー
    handleCodeChange,
    handleEvaluate,
    handleSaveProject,
    handleProjectNameUpdate,
    handleUnsavedChangesUpdate,
    
    // CADワーカー連携用コールバック
    cadWorkerCallbacks
  };
};

/**
 * プロジェクト状態管理フック（型安全性重視版）
 * 
 * より型安全で明示的なインターフェースを提供します。
 * 上級ユーザー向け。
 */
export const useProjectStateAdvanced = (): ProjectContextType => {
  return useProjectContext();
};

export default useProjectState; 