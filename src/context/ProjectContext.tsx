'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { DEFAULT_CAD_CODE, DEFAULT_PROJECT_CONFIG, INITIAL_CONSOLE_MESSAGES } from '@/constants/defaultCode';
import type { ProjectState, CADWorkerProgress, ConsoleMessage } from '@/types';

// Context用の状態型定義
export interface ProjectContextState {
  // プロジェクト基本情報
  projectName: string;
  code: string;
  hasUnsavedChanges: boolean;
  
  // CADワーカー関連
  isCADWorkerReady: boolean;
  
  // コンソール関連
  consoleMessages: string[];
}

// アクション型定義
export type ProjectAction =
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_CAD_WORKER_READY'; payload: boolean }
  | { type: 'ADD_CONSOLE_MESSAGE'; payload: string }
  | { type: 'ADD_CONSOLE_MESSAGES'; payload: string[] }
  | { type: 'UPDATE_PROGRESS_MESSAGE'; payload: string }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SAVE_PROJECT' }
  | { type: 'RESET_PROJECT'; payload?: Partial<ProjectContextState> };

// Context型定義
export interface ProjectContextType {
  state: ProjectContextState;
  
  // 基本操作
  setProjectName: (name: string) => void;
  setCode: (code: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  
  // CADワーカー関連
  setCADWorkerReady: (ready: boolean) => void;
  
  // コンソール関連
  addConsoleMessage: (message: string) => void;
  addConsoleMessages: (messages: string[]) => void;
  updateProgressMessage: (message: string) => void;
  clearConsole: () => void;
  
  // 複合操作
  saveProject: () => void;
  resetProject: (initialState?: Partial<ProjectContextState>) => void;
  
  // 計算されたプロパティ
  getEditorTitle: () => string;
  
  // CADワーカー関連コールバック
  handleWorkerReady: () => void;
  handleShapeUpdate: (facesAndEdges: any, sceneOptions: any) => void;
  handleProgress: (progress: CADWorkerProgress) => void;
  handleLog: (message: string) => void;
  handleError: (error: string) => void;
}

// 初期状態
const initialState: ProjectContextState = {
  projectName: DEFAULT_PROJECT_CONFIG.name,
  code: DEFAULT_CAD_CODE,
  hasUnsavedChanges: false,
  isCADWorkerReady: false,
  consoleMessages: [...INITIAL_CONSOLE_MESSAGES]
};

// Reducer
const projectReducer = (state: ProjectContextState, action: ProjectAction): ProjectContextState => {
  switch (action.type) {
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.payload };
      
    case 'SET_CODE':
      return { ...state, code: action.payload };
      
    case 'SET_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
      
    case 'SET_CAD_WORKER_READY':
      return { ...state, isCADWorkerReady: action.payload };
      
    case 'ADD_CONSOLE_MESSAGE':
      return { 
        ...state, 
        consoleMessages: [...state.consoleMessages, action.payload] 
      };
      
    case 'ADD_CONSOLE_MESSAGES':
      return { 
        ...state, 
        consoleMessages: [...state.consoleMessages, ...action.payload] 
      };
      
    case 'UPDATE_PROGRESS_MESSAGE':
      return {
        ...state,
        consoleMessages: (() => {
          const newMessages = [...state.consoleMessages];
          // 最後のメッセージが進捗メッセージの場合は置き換え
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].startsWith('> Generating Model')) {
            newMessages[newMessages.length - 1] = action.payload;
          } else {
            newMessages.push(action.payload);
          }
          return newMessages;
        })()
      };
      
    case 'CLEAR_CONSOLE':
      return { ...state, consoleMessages: [] };
      
    case 'SAVE_PROJECT':
      return { ...state, hasUnsavedChanges: false };
      
    case 'RESET_PROJECT':
      return { ...initialState, ...action.payload };
      
    default:
      return state;
  }
};

// Context作成
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider Props
interface ProjectProviderProps {
  children: ReactNode;
  initialProjectState?: Partial<ProjectContextState>;
  onSaveProject?: (projectName: string, code: string) => void;
  onShapeUpdate?: (facesAndEdges: any, sceneOptions: any) => void;
}

// Provider コンポーネント
export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
  initialProjectState = {},
  onSaveProject,
  onShapeUpdate
}) => {
  const [state, dispatch] = useReducer(projectReducer, {
    ...initialState,
    ...initialProjectState
  });

  // 基本操作
  const setProjectName = useCallback((name: string) => {
    dispatch({ type: 'SET_PROJECT_NAME', payload: name });
  }, []);

  const setCode = useCallback((code: string) => {
    dispatch({ type: 'SET_CODE', payload: code });
  }, []);

  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: hasChanges });
  }, []);

  // CADワーカー関連
  const setCADWorkerReady = useCallback((ready: boolean) => {
    dispatch({ type: 'SET_CAD_WORKER_READY', payload: ready });
  }, []);

  // コンソール関連
  const addConsoleMessage = useCallback((message: string) => {
    dispatch({ type: 'ADD_CONSOLE_MESSAGE', payload: message });
  }, []);

  const addConsoleMessages = useCallback((messages: string[]) => {
    dispatch({ type: 'ADD_CONSOLE_MESSAGES', payload: messages });
  }, []);

  const updateProgressMessage = useCallback((message: string) => {
    dispatch({ type: 'UPDATE_PROGRESS_MESSAGE', payload: message });
  }, []);

  const clearConsole = useCallback(() => {
    dispatch({ type: 'CLEAR_CONSOLE' });
  }, []);

  // 複合操作
  const saveProject = useCallback(() => {
    if (onSaveProject) {
      onSaveProject(state.projectName, state.code);
    }
    console.log('Saving project:', state.projectName);
    dispatch({ type: 'SAVE_PROJECT' });
  }, [onSaveProject]); // state依存を削除して安定化

  const resetProject = useCallback((initialState?: Partial<ProjectContextState>) => {
    dispatch({ type: 'RESET_PROJECT', payload: initialState });
  }, []);

  // 計算されたプロパティ
  const getEditorTitle = useCallback(() => {
    return `${state.hasUnsavedChanges ? '* ' : ''}${state.projectName}.ts`;
  }, [state.hasUnsavedChanges, state.projectName]);

  // CADワーカー関連コールバック
  const handleWorkerReady = useCallback(() => {
    setCADWorkerReady(true);
    addConsoleMessages(['> CAD Kernel loaded successfully!', '> Ready to evaluate code']);
  }, [setCADWorkerReady, addConsoleMessages]);

  const handleShapeUpdate = useCallback((facesAndEdges: any, sceneOptions: any) => {
    // 形状更新は各コンポーネントで直接処理するため、ここでは何もしない
    // プロジェクト状態に関連する処理が必要な場合のみここに実装
  }, []);

  const handleProgress = useCallback((progress: CADWorkerProgress) => {
    const progressMessage = `> Generating Model${'.' .repeat(progress.opNumber)}${progress.opType ? ` (${progress.opType})` : ''}`;
    updateProgressMessage(progressMessage);
  }, [updateProgressMessage]);

  const handleLog = useCallback((message: string) => {
    addConsoleMessage(`> ${message}`);
  }, [addConsoleMessage]);

  const handleError = useCallback((error: string) => {
    addConsoleMessage(`> ERROR: ${error}`);
  }, [addConsoleMessage]);

  // Context値の作成
  const contextValue: ProjectContextType = {
    state,
    
    // 基本操作
    setProjectName,
    setCode,
    setUnsavedChanges,
    
    // CADワーカー関連
    setCADWorkerReady,
    
    // コンソール関連
    addConsoleMessage,
    addConsoleMessages,
    updateProgressMessage,
    clearConsole,
    
    // 複合操作
    saveProject,
    resetProject,
    
    // 計算されたプロパティ
    getEditorTitle,
    
    // CADワーカー関連コールバック
    handleWorkerReady,
    handleShapeUpdate,
    handleProgress,
    handleLog,
    handleError
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

// Context使用フック
export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext; 