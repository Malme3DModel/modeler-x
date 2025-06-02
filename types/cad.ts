// CAD関連の型定義

export interface CADPrimitive {
  type: 'box' | 'sphere' | 'cylinder' | 'cone';
  parameters: Record<string, number | boolean>;
}

export interface CADOperation {
  type: 'union' | 'difference' | 'intersection' | 'translate' | 'rotate' | 'scale';
  shapes: any[];
  parameters?: Record<string, any>;
}

export interface CADStandardLibraryInterface {
  // プリミティブ
  Box(x: number, y: number, z: number, centered?: boolean): any;
  Sphere(radius: number): any;
  Cylinder(radius: number, height: number, centered?: boolean): any;
  
  // ブール演算
  Union(shapes: any[]): any;
  Difference(mainShape: any, subtractShapes: any[]): any;
  Intersection(shapes: any[]): any;
  
  // 変形
  Translate(offset: [number, number, number], shapes: any[]): any;
  Rotate(axis: [number, number, number], degrees: number, shapes: any[]): any;
  Scale(factor: number | [number, number, number], shapes: any[]): any;
}

export interface CADProject {
  code: string;
  guiState: Record<string, any>;
  importedFiles?: File[];
  timestamp: string;
  version: string;
} 