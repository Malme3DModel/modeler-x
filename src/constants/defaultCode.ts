/**
 * Modeler X デフォルトコード定数
 * CADエディタの初期コードを定義
 */

export const DEFAULT_CAD_CODE = `// OpenCascade.js v1.1.1 Test Code

let testBox = Box(10, 10, 10);  
let testSphere = Sphere(20);     
let testCylinder = Cylinder(15, 30); 

let combined = Union([testBox, testSphere, testCylinder]); 
`;

/**
 * プロジェクトのデフォルト設定
 */
export const DEFAULT_PROJECT_CONFIG = {
  name: 'Untitled',
  fileExtension: '.ts',
  autoSave: false,
  autoEvaluate: true,
} as const;

/**
 * コンソールの初期メッセージ
 */
export const INITIAL_CONSOLE_MESSAGES = [
  '> Welcome to Modeler X!',
  '> Loading CAD Kernel...'
] as const;  