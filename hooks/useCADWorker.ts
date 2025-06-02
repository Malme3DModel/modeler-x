import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  CADWorkerMessage, 
  CADWorkerResponse, 
  CADShape, 
  GUIState,
  EvaluationPayload,
  CombineAndRenderPayload,
  ProgressPayload,
  WorkerError
} from '@/types/worker';

interface UseCADWorkerReturn {
  worker: Worker | null;
  isWorkerReady: boolean;
  isWorking: boolean;
  shapes: CADShape[];
  logs: string[];
  error: string | null;
  progress: ProgressPayload | null;
  executeCADCode: (code: string, guiState?: GUIState) => Promise<void>;
  combineAndRender: (options?: CombineAndRenderPayload) => Promise<void>;
  clearLogs: () => void;
  clearError: () => void;
}

export function useCADWorker(): UseCADWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [shapes, setShapes] = useState<CADShape[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);

  // メッセージハンドラーマップ
  const messageHandlers = useRef<Record<string, (payload: any) => void>>({});

  // ワーカーの初期化
  useEffect(() => {
    let worker: Worker | null = null;

    console.log("🔧 [useCADWorker] Starting WebWorker initialization...");
    console.log("🔧 [useCADWorker] Worker support:", typeof Worker !== 'undefined');
    console.log("🔧 [useCADWorker] Current URL:", window.location.href);

    try {
      console.log("🔧 [useCADWorker] Attempting to create Worker('/workers/cadWorker.js')...");
      worker = new Worker('/workers/cadWorker.js');
      console.log("✅ [useCADWorker] Worker created successfully:", worker);
      
      workerRef.current = worker;

      // メッセージハンドラーの設定
      messageHandlers.current = {
        startupCallback: () => {
          console.log('✅ [useCADWorker] CAD Worker initialized successfully');
          setIsWorkerReady(true);
          setError(null);
        },
        
        log: (payload: string) => {
          console.log('📋 [useCADWorker] Worker log:', payload);
          setLogs(prev => [...prev, payload]);
        },
        
        error: (payload: WorkerError) => {
          console.error('❌ [useCADWorker] Worker error:', payload);
          setError(payload.message);
          setIsWorking(false);
        },
        
        resetWorking: () => {
          console.log('🔄 [useCADWorker] Reset working state');
          setIsWorking(false);
        },
        
        Progress: (payload: ProgressPayload) => {
          console.log('📊 [useCADWorker] Progress:', payload);
          setProgress(payload);
        },
        
        Evaluate: (payload: any) => {
          console.log('🔍 [useCADWorker] Evaluation completed:', payload);
        },
        
        combineAndRenderShapes: (payload: any) => {
          console.log('🎨 [useCADWorker] Combine and render:', payload);
          if (payload && payload[0]) {
            const [facesAndEdges, sceneOptions] = payload;
            
            // CADShape形式に変換
            const newShape: CADShape = {
              hash: Date.now().toString(), // 一時的なハッシュ
              mesh: facesAndEdges.faces ? {
                vertices: facesAndEdges.faces.vertices,
                normals: facesAndEdges.faces.normals,
                indices: facesAndEdges.faces.indices
              } : undefined,
              edges: facesAndEdges.edges ? {
                vertices: facesAndEdges.edges.vertices
              } : undefined
            };
            
            setShapes([newShape]);
            console.log('✅ [useCADWorker] Shapes rendered:', newShape);
          }
          setIsWorking(false);
        }
      };

      // ワーカーからのメッセージ処理
      worker.onmessage = (e: MessageEvent<CADWorkerResponse>) => {
        console.log('📨 [useCADWorker] Message received from worker:', e.data);
        const { type, payload } = e.data;
        
        if (messageHandlers.current[type]) {
          messageHandlers.current[type](payload);
        } else {
          console.warn('⚠️ [useCADWorker] Unknown message type from worker:', type, payload);
        }
      };

      // ワーカーエラーハンドリング
      worker.onerror = (error) => {
        console.error('🚨 [useCADWorker] Worker onerror:', error);
        console.error('🚨 [useCADWorker] Error details:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error: error.error
        });
        setError(`Worker error: ${error.message} (${error.filename}:${error.lineno}:${error.colno})`);
        setIsWorkerReady(false);
        setIsWorking(false);
      };

      // 追加: ワーカーメッセージエラーハンドリング
      worker.onmessageerror = (error) => {
        console.error('🚨 [useCADWorker] Worker onmessageerror:', error);
        setError(`Worker message error: ${error}`);
      };

      console.log("🔧 [useCADWorker] Event handlers attached successfully");

    } catch (err) {
      console.error('🚨 [useCADWorker] Failed to create worker:', err);
      console.error('🚨 [useCADWorker] Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('🚨 [useCADWorker] Error message:', err instanceof Error ? err.message : String(err));
      console.error('🚨 [useCADWorker] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setError(`Failed to create worker: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // クリーンアップ
    return () => {
      console.log("🧹 [useCADWorker] Cleaning up worker...");
      if (worker) {
        worker.terminate();
        workerRef.current = null;
        console.log("✅ [useCADWorker] Worker terminated");
      }
    };
  }, []);

  // CADコードの実行
  const executeCADCode = useCallback(async (code: string, guiState: GUIState = {}) => {
    if (!workerRef.current || !isWorkerReady) {
      throw new Error('Worker not ready');
    }

    setIsWorking(true);
    setError(null);
    setProgress(null);

    const payload: EvaluationPayload = {
      code,
      GUIState: {
        "Cache?": true,
        "MeshRes": 0.1,
        "GroundPlane?": true,
        "Grid?": true,
        ...guiState
      }
    };

    const message: CADWorkerMessage = {
      type: 'Evaluate',
      payload
    };

    workerRef.current.postMessage(message);
  }, [isWorkerReady]);

  // 形状の結合とレンダリング
  const combineAndRender = useCallback(async (options: CombineAndRenderPayload = {}) => {
    if (!workerRef.current || !isWorkerReady) {
      throw new Error('Worker not ready');
    }

    const defaultPayload: CombineAndRenderPayload = {
      maxDeviation: 0.1,
      sceneOptions: {
        groundPlaneVisible: true,
        gridVisible: true
      }
    };

    const payload: CombineAndRenderPayload = {
      ...defaultPayload,
      ...options,
      sceneOptions: {
        ...defaultPayload.sceneOptions,
        ...options.sceneOptions
      }
    };

    const message: CADWorkerMessage = {
      type: 'combineAndRenderShapes',
      payload
    };

    workerRef.current.postMessage(message);
  }, [isWorkerReady]);

  // ログのクリア
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    worker: workerRef.current,
    isWorkerReady,
    isWorking,
    shapes,
    logs,
    error,
    progress,
    executeCADCode,
    combineAndRender,
    clearLogs,
    clearError
  };
} 