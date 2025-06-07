'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cadWorkerService } from '@/services/cadWorkerService';

interface CADWorkerManagerProps {
  onWorkerReady?: () => void;
  onShapeUpdate?: (facesAndEdges: any, sceneOptions: any) => void;
  onProgress?: (progress: { opNumber: number; opType: string }) => void;
  onLog?: (message: string) => void;
  onError?: (error: string) => void;
  autoEvaluateCode?: string;
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
  onError,
  autoEvaluateCode
}) => {
  const workerRef = useRef<Worker | null>(null);
  const messageHandlersRef = useRef<{ [key: string]: (payload: any) => any }>({});
  const isWorkingRef = useRef(false);


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

  const executeAutoEvaluation = useCallback((cadWorkerInterface: CADWorkerInterface) => {
    if (!autoEvaluateCode) return;

    if (onLog) {
      onLog('Auto-evaluating startup code...');
    }

    cadWorkerInterface.evaluateCode(autoEvaluateCode, {});
    cadWorkerInterface.combineAndRenderShapes();

    if (onLog) {
      onLog('Startup code evaluation completed');
    }
  }, [autoEvaluateCode, onLog]);

  // ワーカーの初期化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ワーカーの作成
    try {
      workerRef.current = new Worker('/js/CascadeStudioMainWorker.js');
      
      messageHandlersRef.current = {
        startupCallback: () => {
          console.log('CAD Kernel loaded successfully!');
          
          const cadWorkerInterface = createWorkerInterface();
          (window as any).cadWorker = cadWorkerInterface;
          
          executeAutoEvaluation(cadWorkerInterface);
          
          if (onWorkerReady) {
            onWorkerReady();
          }
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
          // CADワーカーサービスとの状態同期
          if (typeof window !== 'undefined' && (window as any).cadWorkerService) {
            (window as any).cadWorkerService.resetWorking();
          }
          if (onError) {
            onError(payload);
          }
          return null;
        },
        
        resetWorking: () => {
          isWorkingRef.current = false;
          (window as any).workerWorking = false;
          // CADワーカーサービスとの状態同期
          if (typeof window !== 'undefined' && (window as any).cadWorkerService) {
            (window as any).cadWorkerService.resetWorking();
          }
          return null;
        },
        
        apiInvestigation: (payload: any) => {
          console.log('=== API Investigation Results ===');
          console.log('All gp_Trsf methods:', payload.trsfMethods);
          console.log('Rotation-related methods:', payload.rotationMethods);
          console.log('Set methods:', payload.setMethods);
          console.log('=== End API Investigation ===');
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
      
      // CADワーカーサービスをグローバルに公開（フック以外からのアクセス用）
      (window as any).cadWorkerService = cadWorkerService;

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
      delete (window as any).cadWorkerService;
    };
  }, [onWorkerReady, onShapeUpdate, onProgress, onLog, onError, executeAutoEvaluation, createWorkerInterface]);

  return null; // このコンポーネントは何もレンダリングしない
};

export default CADWorkerManager;            