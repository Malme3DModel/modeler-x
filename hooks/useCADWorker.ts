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
  sendToWorker: (message: { type: string; payload: any }) => Promise<any>;
}

/**
 * CADワーカーを使用するためのカスタムフック
 * 
 * OpenCascade.jsを使用したCAD操作をWebWorkerで実行するための
 * フックです。コードの評価、形状のレンダリング、エラーハンドリングを提供します。
 */
class CADWorkerManager {
  private static instance: CADWorkerManager | null = null;
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private readyCallbacks: (() => void)[] = [];

  private constructor() {}

  static getInstance(): CADWorkerManager {
    if (!CADWorkerManager.instance) {
      CADWorkerManager.instance = new CADWorkerManager();
      (window as any).cadWorkerManager = CADWorkerManager.instance;
    }
    return CADWorkerManager.instance;
  }

  getWorker(): Worker | null {
    return this.worker;
  }

  isWorkerReady(): boolean {
    return this.isReady;
  }

  isWorkerInitializing(): boolean {
    return this.isInitializing;
  }

  setWorker(worker: Worker): void {
    this.worker = worker;
  }

  setReady(ready: boolean): void {
    this.isReady = ready;
    if (ready) {
      this.isInitializing = false;
      this.readyCallbacks.forEach(callback => callback());
      this.readyCallbacks = [];
    }
  }

  setInitializing(initializing: boolean): void {
    this.isInitializing = initializing;
  }

  onReady(callback: () => void): void {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }
}

const workerManager = CADWorkerManager.getInstance();

export function useCADWorker(): UseCADWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const isInitializingRef = useRef(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [shapes, setShapes] = useState<CADShape[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);

  // メッセージハンドラーマップ
  const messageHandlers = useRef<Record<string, (payload: any) => void>>({});

  // ログの追加とキャッシュ（パフォーマンス最適化）
  const addLog = useCallback((log: string) => {
    // 最大500件までキャッシュ
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, log];
      return newLogs.slice(-500);
    });
  }, []);

  // ワーカーの初期化
  useEffect(() => {
    if (workerManager.getWorker() && workerManager.isWorkerReady()) {
      console.log("🔄 [useCADWorker] Using existing worker");
      workerRef.current = workerManager.getWorker();
      setIsWorkerReady(true);
      return;
    }

    if (workerManager.isWorkerInitializing()) {
      console.log("🔄 [useCADWorker] Worker is initializing, waiting...");
      workerManager.onReady(() => {
        console.log("✅ [useCADWorker] Worker ready, using it");
        workerRef.current = workerManager.getWorker();
        setIsWorkerReady(true);
      });
      return;
    }

    let worker: Worker | null = null;
    let initTimeout: NodeJS.Timeout | null = null;

    workerManager.setInitializing(true);
    isInitializingRef.current = true;
    console.log("🔧 [useCADWorker] Starting WebWorker initialization...");

    try {
      // WebWorker APIのサポートチェック
      if (typeof Worker === 'undefined') {
        throw new Error('WebWorker is not supported in this browser');
      }

      const basePath = process.env.NODE_ENV === 'production' ? '/modeler-x' : '';
      const workerPath = `${basePath}/workers/cadWorker.js`;
      console.log(`🔧 [useCADWorker] Attempting to create Worker('${workerPath}')...`);
      worker = new Worker(workerPath);
      console.log("✅ [useCADWorker] Worker created successfully:", worker);
      
      workerManager.setWorker(worker);
      workerRef.current = worker;

      // タイムアウト処理の設定（10秒で初期化失敗と判断）
      initTimeout = setTimeout(() => {
        if (!isWorkerReady) {
          setError('Worker initialization timed out after 10 seconds');
          console.error('🚨 [useCADWorker] Worker initialization timed out');
        }
      }, 10000);

      // メッセージハンドラーの設定
      messageHandlers.current = {
        startupCallback: () => {
          console.log('✅ [useCADWorker] Received startupCallback - Worker is ready!');
          workerManager.setReady(true);
          setIsWorkerReady(true);
          setError(null);
          isInitializingRef.current = false;
          
          console.log('📊 WebAssembly initialization completed with optimization');
          
          // タイムアウトのクリア
          if (initTimeout) {
            clearTimeout(initTimeout);
            initTimeout = null;
          }
        },
        
        log: (payload: string) => {
          console.log('📋 [useCADWorker] Worker log:', payload);
          addLog(payload);
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
          
          if (payload && payload.meshes && Array.isArray(payload.meshes)) {
            console.log('🔍 [useCADWorker] Processing meshes:', payload.meshes.length);
            
            if (payload.meshes.length > 0) {
              // 複数のメッシュを統合してCADShape形式に変換
              let vertices: number[] = [], normals: number[] = [], indices: number[] = [];
              let vertexOffset = 0;
              
              payload.meshes.forEach((mesh: any, index: number) => {
                console.log(`🔧 [useCADWorker] Processing mesh ${index + 1}:`, {
                  vertices: mesh.vertices?.length,
                  normals: mesh.normals?.length,
                  indices: mesh.indices?.length
                });
                
                if (mesh.vertices && mesh.normals && mesh.indices) {
                  vertices.push(...mesh.vertices);
                  normals.push(...mesh.normals);
                  
                  for (let i = 0; i < mesh.indices.length; i++) {
                    indices.push(mesh.indices[i] + vertexOffset);
                  }
                  
                  vertexOffset += mesh.vertices.length / 3;
                }
              });
              
              const newShape: CADShape = {
                hash: Date.now().toString(),
                mesh: {
                  vertices: new Float32Array(vertices),
                  normals: new Float32Array(normals),
                  indices: new Uint16Array(indices)
                }
              };
              
              setShapes([newShape]);
              console.log('✅ [useCADWorker] Shapes rendered:', {
                meshCount: payload.meshes.length,
                vertexCount: vertices.length / 3,
                triangleCount: indices.length / 3,
                shape: newShape
              });
            } else {
              console.warn('⚠️ [useCADWorker] No valid meshes received');
              setShapes([]);
            }
          } else {
            console.warn('⚠️ [useCADWorker] Invalid payload format received:', payload);
            setShapes([]);
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
        
        // エラーメッセージを整形
        const errorMessage = `Worker error: ${error.message} (${error.filename}:${error.lineno}:${error.colno})`;
        setError(errorMessage);
        addLog(`❌ ${errorMessage}`);
        
        setIsWorkerReady(false);
        setIsWorking(false);
        workerManager.setInitializing(false);
        isInitializingRef.current = false;
      };

      // 追加: ワーカーメッセージエラーハンドリング
      worker.onmessageerror = (error) => {
        console.error('🚨 [useCADWorker] Worker onmessageerror:', error);
        const errorMessage = `Worker message error: ${error}`;
        setError(errorMessage);
        addLog(`❌ ${errorMessage}`);
        workerManager.setInitializing(false);
        isInitializingRef.current = false;
      };

      console.log("🔧 [useCADWorker] Event handlers attached successfully");

    } catch (err) {
      console.error('🚨 [useCADWorker] Failed to create worker:', err);
      console.error('🚨 [useCADWorker] Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('🚨 [useCADWorker] Error message:', err instanceof Error ? err.message : String(err));
      console.error('🚨 [useCADWorker] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      const errorMessage = `Failed to create worker: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      addLog(`❌ ${errorMessage}`);
      workerManager.setInitializing(false);
      isInitializingRef.current = false;
      
      // タイムアウトのクリア
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
    }

    // クリーンアップ
    return () => {
      console.log("🧹 [useCADWorker] Cleaning up worker...");
      
      // タイムアウトのクリア
      if (initTimeout) {
        clearTimeout(initTimeout);
        initTimeout = null;
      }
      
      if (worker && worker === workerManager.getWorker()) {
        console.log("🧹 [useCADWorker] Cleaning up local worker reference (keeping managed worker alive)");
        workerRef.current = null;
      } else if (worker) {
        worker.terminate();
        workerRef.current = null;
        console.log("✅ [useCADWorker] Worker terminated");
      }
      
      isInitializingRef.current = false;
    };
  }, []);

  // CADコードの実行
  const executeCADCode = useCallback(async (code: string, guiState: GUIState = {}): Promise<void> => {
    const workerManager = (window as any).cadWorkerManager;
    const isWorkerActuallyReady = workerManager?.isWorkerReady() || false;
    const worker = workerManager?.getWorker() || workerRef.current;
    
    if (!worker || !isWorkerActuallyReady) {
      throw new Error('Worker not ready');
    }

    setIsWorking(true);
    setError(null);
    setProgress(null);
    
    // コード実行の開始をログに記録
    addLog(`🔄 コード評価を開始: ${code.length}文字のコード`);

    // デフォルトのGUI状態とマージ
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

    // Promiseベースでメッセージを送信
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }
      
      // 一定時間後にタイムアウトエラーを発生させる
      const timeoutId = setTimeout(() => {
        setIsWorking(false);
        const timeoutError = new Error('CAD evaluation timed out after 30 seconds');
        setError(timeoutError.message);
        addLog(`❌ ${timeoutError.message}`);
        reject(timeoutError);
      }, 30000);
      
      // 完了イベントを待機するハンドラー
      const handleCompletion = (e: MessageEvent<CADWorkerResponse>) => {
        const { type } = e.data;
        if (type === 'combineAndRenderShapes') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', handleCompletion);
          resolve();
        } else if (type === 'error') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', handleCompletion);
          reject(new Error(e.data.payload?.message || 'Unknown error'));
        }
      };
      
      // メッセージハンドラーを追加
      workerRef.current.addEventListener('message', handleCompletion);
      
      // メッセージを送信
      workerRef.current.postMessage(message);
    });
  }, [isWorkerReady, addLog]);

  // 形状の結合とレンダリング
  const combineAndRender = useCallback(async (options: CombineAndRenderPayload = {}): Promise<void> => {
    const workerManager = (window as any).cadWorkerManager;
    const isWorkerActuallyReady = workerManager?.isWorkerReady() || false;
    const worker = workerManager?.getWorker() || workerRef.current;
    
    if (!worker || !isWorkerActuallyReady) {
      throw new Error('Worker not ready');
    }

    // 進行中であることを示す
    setIsWorking(true);
    
    // デフォルト設定とマージ
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

    // Promiseベースでメッセージを送信
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }
      
      // 一定時間後にタイムアウトエラーを発生させる
      const timeoutId = setTimeout(() => {
        setIsWorking(false);
        const timeoutError = new Error('Combine and render operation timed out after 10 seconds');
        setError(timeoutError.message);
        addLog(`❌ ${timeoutError.message}`);
        reject(timeoutError);
      }, 10000);
      
      // 完了イベントを待機するハンドラー
      const handleCompletion = (e: MessageEvent<CADWorkerResponse>) => {
        const { type } = e.data;
        if (type === 'combineAndRenderShapes') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', handleCompletion);
          resolve();
        } else if (type === 'error') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', handleCompletion);
          reject(new Error(e.data.payload?.message || 'Unknown error'));
        }
      };
      
      // メッセージハンドラーを追加
      workerRef.current.addEventListener('message', handleCompletion);
      
      // メッセージを送信
      workerRef.current.postMessage(message);
    });
  }, [isWorkerReady, addLog]);

  // ログのクリア
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // エラーのクリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ワーカーへのメッセージ送信
  const sendToWorker = useCallback(async (message: { type: string; payload: any }) => {
    const workerManager = (window as any).cadWorkerManager;
    const isWorkerActuallyReady = workerManager?.isWorkerReady() || false;
    const worker = workerManager?.getWorker() || workerRef.current;
    
    if (!worker || !isWorkerActuallyReady) {
      console.error('CADワーカーが初期化されていません');
      return { success: false, error: 'Worker not ready' };
    }
    
    return new Promise((resolve) => {
      const messageId = Date.now().toString();
      
      // 応答待ちリスナーを設定
      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === message.type) {
          // nullチェック後に呼び出し
          worker.removeEventListener('message', handleMessage);
          resolve(e.data.payload);
        }
      };
      
      worker.addEventListener('message', handleMessage);
      
      // メッセージ送信
      worker.postMessage({
        type: message.type,
        payload: message.payload,
        id: messageId
      });
    });
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
    clearError,
    sendToWorker
  };
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                