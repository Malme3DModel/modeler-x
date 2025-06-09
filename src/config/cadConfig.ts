/**
 * CAD エンジン設定
 */

/**
 * デフォルトのGUI状態設定
 */
export const DEFAULT_GUI_STATE = {
  "Radius": 30,
  "MeshRes": 0.1,
  "Cache?": true,
  "GroundPlane?": true,
  "Grid?": true
} as const;

/**
 * Monaco Editor設定
 */
export const MONACO_EDITOR_CONFIG = {
  theme: 'vs-dark',
  language: 'typescript',
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
} as const;

/**
 * TypeScript コンパイラー設定
 */
export const TYPESCRIPT_CONFIG = {
  allowNonTsExtensions: true,
  target: 'ES2020' as const,
  allowJs: true,
  checkJs: false,
  moduleResolution: 'NodeJs' as const,
  eagerModelSync: true,
} as const;

/**
 * CADワーカー設定
 */
export const CAD_WORKER_CONFIG = {
  maxRetries: 3,
  timeoutMs: 30000,
  progressUpdateInterval: 100,
} as const;

/**
 * 型定義ファイルのパス設定
 */
export const TYPE_DEFINITION_PATHS = {
  cascadeStudio: './js/CascadeStudioTypes.d.ts',
  standardLibrary: './js/StandardLibraryIntellisense.js',
} as const; 