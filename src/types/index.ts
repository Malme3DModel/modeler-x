/**
 * Modeler X 共通型定義
 */

// ===== Monaco Editor関連 =====
export interface MonacoEditor {
  getValue: () => string;
  setValue: (value: string) => void;
  getModel: () => MonacoModel | null;
  focus: () => void;
  dispose: () => void;
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void };
  addAction: (action: MonacoAction) => void;
}

export interface MonacoInstance {
  editor: {
    create: (container: HTMLElement, options: MonacoEditorOptions) => MonacoEditor;
    createModel: (content: string, language: string) => MonacoModel;
    setModelMarkers: (model: MonacoModel | null, owner: string, markers: MonacoMarker[]) => void;
  };
  languages: {
    typescript: {
      typescriptDefaults: {
        setExtraLibs: (libs: MonacoExtraLib[]) => void;
        setCompilerOptions: (options: TypeScriptCompilerOptions) => void;
      };
    };
  };
}

export interface MonacoMarker {
  severity: number;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

export interface MonacoModel {
  getValue: () => string;
  setValue: (value: string) => void;
  dispose: () => void;
}

export interface MonacoAction {
  id: string;
  label: string;
  keybindings?: number[];
  contextMenuGroupId?: string;
  run: (editor: MonacoEditor) => void;
}

export interface MonacoEditorOptions {
  value?: string;
  language?: string;
  theme?: string;
  automaticLayout?: boolean;
  minimap?: { enabled: boolean };
  fontSize?: number;
  fontFamily?: string;
  tabSize?: number;
  insertSpaces?: boolean;
  wordWrap?: string;
  folding?: boolean;
  lineNumbers?: string;
  renderWhitespace?: string;
  scrollBeyondLastLine?: boolean;
}

export interface MonacoExtraLib {
  content: string;
  filePath: string;
}

export interface TypeScriptCompilerOptions {
  target: string;
  module: string;
  lib: string[];
  strict: boolean;
  esModuleInterop: boolean;
  skipLibCheck: boolean;
  forceConsistentCasingInFileNames: boolean;
  declaration: boolean;
  declarationMap: boolean;
  sourceMap: boolean;
  outDir: string;
  rootDir: string;
  removeComments: boolean;
  noEmit: boolean;
  allowJs: boolean;
  checkJs: boolean;
  resolveJsonModule: boolean;
  isolatedModules: boolean;
}

// ===== CADワーカー関連型 =====
export type CADWorkerMessageType = 
  | 'evaluateCode'
  | 'updateGUI'
  | 'progress'
  | 'shapeUpdate'
  | 'error'
  | 'log'
  | 'ready';

export interface CADWorkerPayload {
  code?: string;
  meshRes?: number;
  sceneOptions?: SceneOptions;
  guiState?: GUIState;
  progress?: CADWorkerProgress;
  facesAndEdges?: FacesAndEdges;
  message?: string;
  error?: string;
}

export interface FacesAndEdges {
  faces: Face[];
  edges: Edge[];
}

export interface Face {
  vertices: number[];
  normals: number[];
  uvs: number[];
}

export interface Edge {
  vertices: number[];
}

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
  type: CADWorkerMessageType;
  payload: CADWorkerPayload;
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

export interface EvaluationParams {
  code: string;
  meshRes: number;
  sceneOptions: SceneOptions;
  guiState?: GUIState;
  delay?: number;
}

export interface MonacoEditorEvaluationParams {
  editor: MonacoEditor;
  monaco: MonacoInstance;
  evaluateAndRender: (params: EvaluationParams) => Promise<void>;
  extraLibs?: MonacoExtraLib[];
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
  updateShape: (facesAndEdges: FacesAndEdges, sceneOptions: SceneOptions) => void;
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
export interface PanelProps {
  title: string;
  isClosable?: boolean;
}

export interface PanelConfiguration {
  id: string;
  title: string;
  component: React.ComponentType<PanelProps>;
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
  onShapeUpdate: EventHandler<{ facesAndEdges: FacesAndEdges; sceneOptions: SceneOptions }>;
  onProgress: EventHandler<CADWorkerProgress>;
  onLog: EventHandler<string>;
  onError: EventHandler<string>;
} 