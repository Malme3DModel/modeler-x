// Cascade Studio Standard Library Type Definitions

declare global {
  // Basic CAD Operations
  function Box(width: number, height: number, depth: number): any;
  function Sphere(radius: number): any;
  function Cylinder(radius: number, height: number, centered?: boolean): any;
  function Cone(radius1: number, radius2: number, height: number): any;
  function Text3D(text: string, size: number, thickness: number, font?: string): any;
  function Polygon(points: number[][]): any;

  // Transformations
  function Translate(vector: number[], shape: any): any;
  function Rotate(axis: number[], angle: number, shape: any): any;
  function Scale(factor: number | number[], shape: any): any;
  function Mirror(plane: number[], shape: any): any;

  // Boolean Operations
  function Union(...shapes: any[]): any;
  function Difference(base: any, tools: any | any[]): any;
  function Intersection(...shapes: any[]): any;

  // Advanced Operations
  function Offset(shape: any, distance: number): any;
  function Extrude(profile: any, height: number): any;
  function RotatedExtrude(profile: any, angle: number): any;
  function Revolve(profile: any, axis: number[], angle: number): any;
  function Pipe(path: any, profile: any): any;
  function Loft(profiles: any[]): any;
  function FilletEdges(shape: any, radius: number, edges?: any[]): any;
  function ChamferEdges(shape: any, distance: number, edges?: any[]): any;

  // GUI Controls
  function Slider(name: string, defaultValue: number, min: number, max: number): number;
  function Checkbox(name: string, defaultValue: boolean): boolean;
  function TextInput(name: string, defaultValue: string): string;
  function Dropdown(name: string, options: string[], defaultIndex: number): string;

  // Global Variables
  var sceneShapes: any[];
}

export {}; 