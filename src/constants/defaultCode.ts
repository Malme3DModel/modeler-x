/**
 * Modeler X デフォルトコード定数
 * CADエディタの初期コードを定義
 */

export const DEFAULT_CAD_CODE = `// OpenCascade.js v1.1.1 Comprehensive Feature Demo

let baseBox = Box(40, 30, 10);
let mainSphere = Sphere(25);
let supportCylinder = Cylinder(8, 50);

let cone = Cone(15, 5, 25);
let textShape = Text3D("v1.1.1", 12, 2, 'Consolas');

let sketch = new Sketch()
  .Start([0, 0])
  .LineTo([20, 0])
  .LineTo([20, 15])
  .ArcTo([15, 20], [10, 20])
  .LineTo([0, 20])
  .LineTo([0, 0])
  .End();

let extrudedProfile = Extrude(sketch.Face(), [0, 0, 8]);

let revolutionProfile = new Sketch()
  .Start([5, 0])
  .LineTo([15, 0])
  .LineTo([12, 10])
  .LineTo([8, 10])
  .LineTo([5, 0])
  .End();

let revolvedShape = Revolve(revolutionProfile.Face(), [0, 0, 0], [0, 1, 0], 270);

let hollowBox = Difference(baseBox, [
  Translate([0, 0, 2], Box(30, 20, 8)),
  Translate([35, 15, 0], supportCylinder)
]);

let complexUnion = Union([
  hollowBox,
  Translate([0, 0, 15], mainSphere),
  Translate([45, 0, 0], cone)
]);

let filletedShape = FilletEdges(complexUnion, 3);

let rotatedText = Rotate([1, 0, 0], 90, 
  Translate([0, -10, 25], textShape)
);

let scaledRevolution = Scale([0.8, 0.8, 1.2], 
  Translate([-30, 0, 0], revolvedShape)
);

let finalModel = Union([
  filletedShape,
  rotatedText,
  scaledRevolution,
  Translate([20, 35, 5], extrudedProfile)
]);

let mirroredAssembly = Union([
  finalModel,
  Mirror([1, 0, 0], [0, 0, 0], finalModel)
]);

mirroredAssembly;
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