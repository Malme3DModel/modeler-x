// CascadeStudio用STARTER_CODE
export const STARTER_CODE = `// Welcome to Cascade Studio!   Here are some useful functions:
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

// CascadeStudio用レイアウト設定 (Golden Layout 2.6.0形式)
export const DEFAULT_LAYOUT_CONFIG = {
  root: {
    type: 'row',
    content: [{
      type: 'component',
      componentType: 'codeEditor', // V2では componentType を使用
      title: '* Untitled',
      componentState: { code: STARTER_CODE },
      width: 50.0,
    }, {
      type: 'column',
      content: [{
        type: 'component',
        componentType: 'cascadeView', // V2では componentType を使用
        title: 'CAD View',
        componentState: {},
      }, {
        type: 'component',
        componentType: 'console', // V2では componentType を使用
        title: 'Console',
        componentState: {},
        height: 20.0,
      }]
    }]
  },
  settings: {
    showPopoutIcon: false,
    showMaximiseIcon: false,
    showCloseIcon: false
  }
};

// CascadeStudio Golden Layout用の型定義
export interface CascadeLayoutConfig {
  root: {
    type: string;
    content: Array<{
      type: string;
      content?: any[];
      componentType?: string; // V2では componentType
      title?: string;
      componentState?: any;
      width?: number;
      height?: number;
    }>;
  };
  settings: {
    showPopoutIcon: boolean;
    showMaximiseIcon: boolean;
    showCloseIcon: boolean;
  };
}

export interface GoldenLayoutComponentState {
  code?: string;
  [key: string]: any;
} 