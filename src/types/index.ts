/**
 * Modeler X 共通型定義
 */

// ===== プロジェクト関連 =====
export interface ProjectState {
  name: string;
  code: string;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
}

export interface ProjectConfig {
  name: string;
  fileExtension: string;
  autoSave: boolean;
  autoEvaluate: boolean;
}

// ===== CADワーカー関連 =====
export interface CADWorkerProgress {
  opNumber: number;
  opType: string;
}

export interface CADWorkerMessage {
  type: string;
  payload: any;
}

export interface GUIState {
  [key: string]: number | boolean | string;
}

// ===== エディター関連 =====
export interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEvaluate: () => void;
  onSaveProject?: () => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesUpdate?: (hasChanges: boolean) => void;
  projectName?: string;
  onProjectNameUpdate?: (name: string) => void;
}

export interface MonacoEditorEvaluationParams {
  editor: any;
  monaco: any;
  evaluateAndRender: (params: any) => Promise<void>;
  extraLibs?: any[];
  saveToURL?: boolean;
  onEvaluate?: () => void;
}

export interface EvaluationOptions {
  code: string;
  meshRes: number;
  sceneOptions: SceneOptions;
  delay: number;
}

// ===== 3Dビューポート関連 =====
export interface ThreeViewportRef {
  updateShape: (facesAndEdges: any, sceneOptions: any) => void;
}

export interface SceneOptions {
  groundPlaneVisible: boolean;
  gridVisible: boolean;
}

// ===== コンソール関連 =====
export type ConsoleMessageType = 'info' | 'warning' | 'error' | 'success';

export interface ConsoleMessage {
  id: string;
  type: ConsoleMessageType;
  message: string;
  timestamp: Date;
}

// ===== Dockview関連 =====
export interface PanelConfiguration {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  closable?: boolean;
}

// ===== ユーティリティ型 =====
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ===== イベントハンドラー型 =====
export type EventHandler<T = void> = (data: T) => void;

export interface CADWorkerEventHandlers {
  onWorkerReady: EventHandler;
  onShapeUpdate: EventHandler<{ facesAndEdges: any; sceneOptions: any }>;
  onProgress: EventHandler<CADWorkerProgress>;
  onLog: EventHandler<string>;
  onError: EventHandler<string>;
} 