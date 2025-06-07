# Modeler X APIリファレンス

## 📋 概要

Modeler XのAPI仕様・インターフェース・使用方法を詳細に説明するリファレンスドキュメントです。開発者がコンポーネント・フック・サービスを効果的に活用できるように設計されています。

## 🎣 Custom Hooks API

### useCADWorker

CADワーカーの管理・状態監視・エラーハンドリングを提供するカスタムフック。

```typescript
interface CADWorkerHook {
  isWorkerReady: boolean;
  isWorkerWorking: boolean;
  error: string | null;
  evaluateAndRender: (code: string, options?: EvaluationOptions) => Promise<void>;
  clearError: () => void;
}

const useCADWorker = (): CADWorkerHook
```

#### 使用例

```typescript
function MyComponent() {
  const { 
    isWorkerReady, 
    isWorkerWorking, 
    error, 
    evaluateAndRender, 
    clearError 
  } = useCADWorker();

  const handleExecute = async () => {
    if (!isWorkerReady) return;
    
    try {
      await evaluateAndRender(code, { timeout: 5000 });
    } catch (err) {
      console.error('実行失敗:', err);
    }
  };

  return (
    <div>
      <button 
        disabled={!isWorkerReady || isWorkerWorking}
        onClick={handleExecute}
      >
        {isWorkerWorking ? '実行中...' : '実行'}
      </button>
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}
    </div>
  );
}
```

#### パラメータ

| プロパティ | 型 | 説明 |
|------------|----|----|
| `isWorkerReady` | `boolean` | ワーカーが準備完了かどうか |
| `isWorkerWorking` | `boolean` | ワーカーが動作中かどうか |
| `error` | `string \| null` | エラーメッセージ（エラーがない場合はnull） |
| `evaluateAndRender` | `function` | コードを評価・レンダリングする関数 |
| `clearError` | `function` | エラーをクリアする関数 |

### useProjectState

プロジェクト状態管理のためのカスタムフック。ProjectContextとの統合インターフェース。

```typescript
interface ProjectStateHook {
  // 状態
  projectName: string;
  isUnsaved: boolean;
  currentCode: string;
  consoleOutput: string;
  
  // アクション
  setProjectName: (name: string) => void;
  setUnsaved: (unsaved: boolean) => void;
  updateCode: (code: string) => void;
  addConsoleOutput: (output: string) => void;
  clearConsole: () => void;
  saveProject: () => void;
}

const useProjectState = (): ProjectStateHook
```

#### 使用例

```typescript
function ProjectPanel() {
  const {
    projectName,
    isUnsaved,
    currentCode,
    setProjectName,
    updateCode,
    saveProject
  } = useProjectState();

  return (
    <div>
      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="プロジェクト名"
      />
      <span>{isUnsaved ? '●' : ''}</span>
      <button onClick={saveProject}>保存</button>
      
      <textarea
        value={currentCode}
        onChange={(e) => updateCode(e.target.value)}
      />
    </div>
  );
}
```

### useKeyboardShortcuts

キーボードショートカットの管理・登録・実行を提供するカスタムフック。

```typescript
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

interface KeyboardShortcutsHook {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  getRegisteredShortcuts: () => KeyboardShortcut[];
}

const useKeyboardShortcuts = (): KeyboardShortcutsHook
```

#### 使用例

```typescript
function EditorWithShortcuts() {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    // Ctrl+Enter: コード実行
    registerShortcut({
      key: 'Enter',
      ctrlKey: true,
      action: () => executeCode(),
      description: 'コードを実行'
    });

    // Ctrl+S: 保存
    registerShortcut({
      key: 's',
      ctrlKey: true,
      action: () => saveProject(),
      description: 'プロジェクトを保存'
    });

    return () => {
      unregisterShortcut('Enter');
      unregisterShortcut('s');
    };
  }, []);

  return <div>エディター</div>;
}
```

## 🔧 Services API

### cadWorkerService

CADワーカーとの通信・制御・データ変換を管理するサービス。

```typescript
interface CADWorkerServiceInterface {
  initializeWorker: () => Promise<void>;
  isWorkerReady: () => boolean;
  isWorkerWorking: () => boolean;
  evaluateCode: (code: string, guiState: object) => Promise<FacesAndEdges>;
  getWorkerStatus: () => WorkerStatus;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}
```

#### メソッド詳細

##### initializeWorker()

```typescript
/**
 * CADワーカーを初期化します
 * @returns Promise<void>
 * @throws WorkerInitializationError ワーカーの初期化に失敗した場合
 */
const initializeWorker = async (): Promise<void> => {
  try {
    await cadWorkerService.initializeWorker();
    console.log('ワーカー初期化完了');
  } catch (error) {
    console.error('ワーカー初期化失敗:', error);
  }
};
```

##### evaluateCode()

```typescript
/**
 * TypeScriptコードを評価してCAD形状を生成します
 * @param code - 実行するTypeScriptコード
 * @param guiState - GUI状態（スライダー値等）
 * @returns Promise<FacesAndEdges> - 生成された3D形状データ
 */
const evaluateCode = async (
  code: string, 
  guiState: object
): Promise<FacesAndEdges> => {
  const result = await cadWorkerService.evaluateCode(code, guiState);
  return result;
};
```

### editorService

Monaco Editorの制御・コード評価・設定管理を提供するサービス。

```typescript
interface EditorServiceInterface {
  evaluateCode: (params: MonacoEditorEvaluationParams) => Promise<void>;
  setupCodeFolding: (editor: MonacoEditor) => void;
  getEditorTheme: () => string;
  setEditorTheme: (theme: string) => void;
}
```

#### 使用例

```typescript
import { editorService } from '@/services/editorService';

// コード評価
const handleCodeEvaluation = async () => {
  await editorService.evaluateCode({
    code: currentCode,
    guiState: { "Radius": 30, "MeshRes": 0.1 },
    onSuccess: (result) => console.log('成功:', result),
    onError: (error) => console.error('エラー:', error),
    options: { timeout: 5000 }
  });
};

// エディター設定
const setupEditor = (editor: MonacoEditor) => {
  editorService.setupCodeFolding(editor);
  editorService.setEditorTheme('vs-dark');
};
```

### typeDefinitionService

TypeScript型定義の読み込み・管理・Monaco Editor統合を提供するサービス。

```typescript
interface TypeDefinitionServiceInterface {
  loadTypeDefinitions: (editor: MonacoEditor) => Promise<void>;
  addExtraLibrary: (content: string, filePath: string) => void;
  removeExtraLibrary: (filePath: string) => void;
  getLoadedLibraries: () => string[];
}
```

#### 使用例

```typescript
import { typeDefinitionService } from '@/services/typeDefinitionService';

// 型定義読み込み
const initializeEditor = async (editor: MonacoEditor) => {
  try {
    await typeDefinitionService.loadTypeDefinitions(editor);
    console.log('型定義読み込み完了');
  } catch (error) {
    console.error('型定義読み込み失敗:', error);
  }
};

// カスタム型定義追加
typeDefinitionService.addExtraLibrary(`
  declare interface CustomShape {
    volume: number;
    surfaceArea: number;
  }
`, 'custom-types.d.ts');
```

## 🎛️ Context API

### ProjectContext

アプリケーション全体のプロジェクト状態を管理するReact Context。

```typescript
interface ProjectState {
  projectName: string;
  isUnsaved: boolean;
  currentCode: string;
  consoleOutput: string;
}

type ProjectAction = 
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_UNSAVED'; payload: boolean }
  | { type: 'UPDATE_CODE'; payload: string }
  | { type: 'ADD_CONSOLE_OUTPUT'; payload: string }
  | { type: 'CLEAR_CONSOLE' }
  | { type: 'SAVE_PROJECT' };

interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}
```

#### 使用例

```typescript
import { ProjectProvider, useProjectContext } from '@/context/ProjectContext';

// アプリケーションルート
function App() {
  return (
    <ProjectProvider>
      <MainApplication />
    </ProjectProvider>
  );
}

// コンポーネント内での使用
function SomeComponent() {
  const { state, dispatch } = useProjectContext();

  const updateProjectName = (name: string) => {
    dispatch({ type: 'SET_PROJECT_NAME', payload: name });
  };

  return (
    <div>
      <h1>{state.projectName}</h1>
      <input onChange={(e) => updateProjectName(e.target.value)} />
    </div>
  );
}
```

## 🧩 Components API

### MonacoEditor

Monaco Editorをラップしたカスタムコンポーネント。

```typescript
interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: string;
  language?: string;
  options?: MonacoEditorOptions;
  onMount?: (editor: MonacoEditor) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps>
```

#### 使用例

```typescript
function CodeEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);

  const handleEditorMount = (editor: MonacoEditor) => {
    // エディター初期化後の処理
    editor.addAction({
      id: 'execute-code',
      label: 'Execute Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => executeCode()
    });
  };

  return (
    <MonacoEditor
      value={code}
      onChange={setCode}
      theme="vs-dark"
      language="typescript"
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false
      }}
    />
  );
}
```

### ThreeViewport

Three.jsを使用した3Dビューポートコンポーネント。

```typescript
interface ThreeViewportProps {
  shapes?: FacesAndEdges;
  onSceneReady?: (scene: THREE.Scene) => void;
  onShapeUpdate?: (shapes: FacesAndEdges) => void;
  backgroundColor?: string;
  enableGrid?: boolean;
  enableGroundPlane?: boolean;
}

const ThreeViewport: React.FC<ThreeViewportProps>
```

#### 使用例

```typescript
function ModelViewer() {
  const [shapes, setShapes] = useState<FacesAndEdges | null>(null);

  const handleSceneReady = (scene: THREE.Scene) => {
    // シーン初期化後の処理
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
  };

  return (
    <ThreeViewport
      shapes={shapes}
      onSceneReady={handleSceneReady}
      backgroundColor="#1a1a1a"
      enableGrid={true}
      enableGroundPlane={true}
    />
  );
}
```

### CADWorkerManager

CADワーカーの初期化・管理・状態監視を行うコンポーネント。

```typescript
interface CADWorkerManagerProps {
  onWorkerReady?: () => void;
  onWorkerError?: (error: string) => void;
  autoStart?: boolean;
}

const CADWorkerManager: React.FC<CADWorkerManagerProps>
```

## 📊 Types Reference

### 基本型定義

```typescript
// プロジェクト関連
interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
}

// CAD関連
interface FacesAndEdges {
  faces: Face[];
  edges: Edge[];
}

interface Face {
  vertices: number[];
  normals: number[];
  uvs?: number[];
  materialIndex?: number;
}

interface Edge {
  start: number[];
  end: number[];
  color?: string;
}

// ワーカー関連
type CADWorkerMessageType = 
  | 'INITIALIZE'
  | 'EVALUATE_CODE'
  | 'GET_STATUS'
  | 'UPDATE_GUI'
  | 'RENDER_SHAPES'
  | 'ERROR'
  | 'READY';

interface CADWorkerMessage {
  type: CADWorkerMessageType;
  payload: CADWorkerPayload;
  id?: string;
}

interface CADWorkerPayload {
  code?: string;
  guiState?: object;
  shapes?: FacesAndEdges;
  error?: string;
  status?: WorkerStatus;
  timestamp?: number;
  metadata?: object;
}

// Monaco Editor関連
interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  addAction(action: MonacoAction): void;
  onDidChangeModelContent(listener: () => void): void;
  focus(): void;
  getModel(): MonacoModel;
  setModel(model: MonacoModel): void;
}

interface MonacoEditorEvaluationParams {
  code: string;
  guiState?: object;
  onSuccess?: (result: FacesAndEdges) => void;
  onError?: (error: string) => void;
  options?: EvaluationOptions;
}
```

### 設定型定義

```typescript
// CAD設定
interface CADConfig {
  gui: GUIState;
  monaco: MonacoConfig;
  typescript: TypeScriptCompilerOptions;
  typeDefinitionPaths: string[];
}

interface GUIState {
  "Radius": number;
  "MeshRes": number;
  "Cache?": boolean;
  "GroundPlane?": boolean;
  "Grid?": boolean;
}

interface MonacoConfig {
  theme: string;
  fontSize: number;
  tabSize: number;
  minimap: { enabled: boolean };
  scrollBeyondLastLine: boolean;
  automaticLayout: boolean;
}
```

## 🔍 エラーハンドリング

### エラー型定義

```typescript
interface CADError extends Error {
  code: string;
  timestamp: Date;
  context?: object;
}

type CADErrorCode = 
  | 'WORKER_NOT_READY'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'INITIALIZATION_ERROR';
```

### エラー処理例

```typescript
try {
  await cadWorkerService.evaluateCode(code, guiState);
} catch (error) {
  if (error instanceof CADError) {
    switch (error.code) {
      case 'WORKER_NOT_READY':
        console.warn('ワーカーが準備できていません');
        break;
      case 'COMPILATION_ERROR':
        console.error('コンパイルエラー:', error.message);
        break;
      case 'RUNTIME_ERROR':
        console.error('実行時エラー:', error.message);
        break;
      default:
        console.error('予期しないエラー:', error);
    }
  }
}
```

## 📝 使用例・ベストプラクティス

### 1. カスタムフックの組み合わせ

```typescript
function CADApplication() {
  // 複数のカスタムフックを組み合わせて使用
  const cadWorker = useCADWorker();
  const projectState = useProjectState();
  const shortcuts = useKeyboardShortcuts();

  // ショートカット登録
  useEffect(() => {
    shortcuts.registerShortcut({
      key: 'Enter',
      ctrlKey: true,
      action: async () => {
        if (cadWorker.isWorkerReady) {
          await cadWorker.evaluateAndRender(projectState.currentCode);
        }
      },
      description: 'コード実行'
    });
  }, [cadWorker, projectState, shortcuts]);

  return (
    <div>
      {/* アプリケーションUI */}
    </div>
  );
}
```

### 2. 型安全な設定管理

```typescript
import { CAD_CONFIG } from '@/config/cadConfig';

// 型安全な設定アクセス
const editorConfig: MonacoConfig = CAD_CONFIG.monaco;
const guiDefaults: GUIState = CAD_CONFIG.gui;

// 設定の動的更新
const updateGUIValue = (key: keyof GUIState, value: boolean | number) => {
  const newGuiState = { ...guiDefaults, [key]: value };
  // 設定更新処理
};
```

### 3. 効率的なエラーハンドリング

```typescript
const executeWithErrorHandling = useCallback(async (operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // プロジェクト状態に反映
    projectState.addConsoleOutput(`Error: ${errorMessage}`);
    
    // ユーザーフレンドリーなエラー表示
    if (error instanceof CADError) {
      handleCADError(error);
    } else {
      handleGenericError(error);
    }
  }
}, [projectState]);
```

---

*最終更新: 2024年12月29日*  
*バージョン: 1.0.0*  
*ステータス: リファクタリング完了* 