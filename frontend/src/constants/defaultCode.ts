/**
 * Modeler X デフォルトコード定数
 * CADエディタの初期コードを定義
 */

export const DEFAULT_CAD_CODE = `// Welcome to Cascade Studio!   Here are some useful functions:
//  Translate(), Rotate(), Scale(), Mirror(), Union(), Difference(), Intersection()
//  Box(), Sphere(), Cylinder(), Cone(), Text3D(), Polygon()
//  Offset(), Extrude(), RotatedExtrude(), Revolve(), Pipe(), Loft(), 
//  FilletEdges(), ChamferEdges(),
//  Slider(), Checkbox(), TextInput(), Dropdown()

let holeRadius = Slider("Radius", 30 , 20 , 40);

let sphere     = Sphere(50);
let cylinderZ  =                     Cylinder(holeRadius, 200, true);
let cylinderY  = Rotate([0,1,0], 90, Cylinder(holeRadius, 200, true));
let cylinderX  = Rotate([1,0,0], 90, Cylinder(holeRadius, 200, true));

Translate([0, 0, 50], Difference(sphere, [cylinderX, cylinderY, cylinderZ]));

Translate([-25, 0, 40], Text3D("Hi!", 36, 0.15, 'Consolas'));

// Don't forget to push imported or oc-defined shapes into sceneShapes to add them to the workspace!`;

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