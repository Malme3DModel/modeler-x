'use client';

import { useEffect, useRef, useCallback } from 'react';

interface CADWorkerManagerProps {
  onWorkerReady?: () => void;
  onShapeUpdate?: (facesAndEdges: any, sceneOptions: any) => void;
  onProgress?: (progress: { opNumber: number; opType: string }) => void;
  onLog?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface CADWorkerInterface {
  evaluateCode: (code: string, guiState: any) => void;
  combineAndRenderShapes: (maxDeviation?: number, sceneOptions?: any) => void;
  isWorking: boolean;
}

const CADWorkerManager: React.FC<CADWorkerManagerProps> = ({
  onWorkerReady,
  onShapeUpdate,
  onProgress,
  onLog,
  onError
}) => {
  const workerRef = useRef<Worker | null>(null);
  const messageHandlersRef = useRef<{ [key: string]: (payload: any) => any }>({});
  const isWorkingRef = useRef(false);

  // ワーカーインターフェースを作成
  const createWorkerInterface = useCallback((): CADWorkerInterface => {
    return {
      evaluateCode: (code: string, guiState: any) => {
        if (!workerRef.current || isWorkingRef.current) return;
        
        isWorkingRef.current = true;
        (window as any).workerWorking = true;
        
        workerRef.current.postMessage({
          type: "Evaluate",
          payload: {
            code: code,
            GUIState: guiState
          }
        });
      },
      
      combineAndRenderShapes: (maxDeviation = 0.1, sceneOptions = {}) => {
        if (!workerRef.current) return;
        
        workerRef.current.postMessage({
          type: "combineAndRenderShapes",
          payload: { 
            maxDeviation: maxDeviation, 
            sceneOptions: sceneOptions 
          }
        });
      },
      
      get isWorking() {
        return isWorkingRef.current;
      }
    };
  }, []);

  // ワーカーの初期化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ワーカーの作成
    try {
      workerRef.current = new Worker('/js/CADWorker/CascadeStudioMainWorker.js');
      
      // メッセージハンドラーの設定
      messageHandlersRef.current = {
        startupCallback: () => {
          console.log('CAD Kernel loaded successfully!');
          if (onWorkerReady) {
            onWorkerReady();
          }
          // ワーカーインターフェースをグローバルに公開
          (window as any).cadWorker = createWorkerInterface();
          return null;
        },
        
        combineAndRenderShapes: (payload: any) => {
          const [facesAndEdges, sceneOptions] = payload;
          if (onShapeUpdate) {
            onShapeUpdate(facesAndEdges, sceneOptions);
          }
          return null;
        },
        
        Progress: (payload: { opNumber: number; opType: string }) => {
          if (onProgress) {
            onProgress(payload);
          }
          return null;
        },
        
        log: (payload: string) => {
          if (onLog) {
            onLog(payload);
          }
          return null;
        },
        
        error: (payload: string) => {
          isWorkingRef.current = false;
          (window as any).workerWorking = false;
          if (onError) {
            onError(payload);
          }
          return null;
        },
        
        resetWorking: () => {
          isWorkingRef.current = false;
          (window as any).workerWorking = false;
          return null;
        }
      };

      // ワーカーからのメッセージを処理
      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type in messageHandlersRef.current) {
          const response = messageHandlersRef.current[type](payload);
          if (response) {
            workerRef.current?.postMessage({ type: type, payload: response });
          }
        }
      };

      // ワーカーエラーハンドリング
      workerRef.current.onerror = (error) => {
        console.error('CAD Worker Error:', error);
        isWorkingRef.current = false;
        (window as any).workerWorking = false;
        if (onError) {
          onError(`Worker Error: ${error.message}`);
        }
      };

      // グローバル変数の初期化
      (window as any).workerWorking = false;

    } catch (error) {
      console.error('Failed to create CAD Worker:', error);
      if (onError) {
        onError(`Failed to create CAD Worker: ${error}`);
      }
    }

    // クリーンアップ
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      delete (window as any).cadWorker;
      delete (window as any).workerWorking;
    };
  }, [onWorkerReady, onShapeUpdate, onProgress, onLog, onError, createWorkerInterface]);

  return null; // このコンポーネントは何もレンダリングしない
};

export default CADWorkerManager; 