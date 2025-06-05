// CADワーカー用TypeScript定義

declare var oc: any;
declare var sceneShapes: any[];
declare var GUIState: Record<string, any>;

// CAD標準ライブラリ関数
declare function Box(x: number, y: number, z: number, centered?: boolean): any;
declare function Sphere(radius: number): any;
declare function Cylinder(radius: number, height: number, centered?: boolean): any;
declare function Union(shapes: any[]): any;
declare function Difference(mainShape: any, subtractShapes: any[]): any;
declare function Translate(offset: [number, number, number], shapes: any[]): any[];
declare function Rotate(axis: [number, number, number], degrees: number, shapes: any[]): any[];

// ワーカー通信用
declare function postMessage(message: any): void;
declare var onmessage: (e: MessageEvent) => void; 