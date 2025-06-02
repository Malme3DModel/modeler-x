// CADワーカー関連の型定義

export interface CADWorkerMessage {
  type: string;
  payload?: any;
}

export interface CADWorkerResponse {
  type: string;
  payload?: any;
}

export interface CADShape {
  hash: string;
  mesh?: {
    vertices: Float32Array;
    normals: Float32Array;
    indices: Uint16Array;
  };
  edges?: {
    vertices: Float32Array;
  };
}

export interface GUIState {
  [key: string]: any;
  "Cache?"?: boolean;
  "MeshRes"?: number;
  "GroundPlane?"?: boolean;
  "Grid?"?: boolean;
}

export interface EvaluationPayload {
  code: string;
  GUIState: GUIState;
}

export interface CombineAndRenderPayload {
  maxDeviation?: number;
  sceneOptions?: {
    groundPlaneVisible?: boolean;
    gridVisible?: boolean;
  };
}

export interface ProgressPayload {
  opNumber: number;
  opType: string;
}

export interface WorkerError {
  message: string;
  line?: number;
  operation?: string;
} 