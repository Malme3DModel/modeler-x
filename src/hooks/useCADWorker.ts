import { useState, useCallback, useEffect, useRef } from 'react';
import { cadWorkerService, CADEvaluationOptions } from '@/services/cadWorkerService';
import { DEFAULT_GUI_STATE } from '@/config/cadConfig';

export interface UseCADWorkerReturn {
  // 状態
  isWorking: boolean;
  isWorkerReady: boolean;
  error: string | null;
  
  // 基本操作
  evaluateCode: (code: string, guiState?: any) => Promise<void>;
  combineAndRenderShapes: (meshRes?: number, sceneOptions?: any) => Promise<void>;
  
  // 複合操作
  evaluateAndRender: (options: Omit<CADEvaluationOptions, 'guiState'> & { guiState?: any }) => Promise<void>;
  
  // ユーティリティ
  resetWorking: () => void;
  clearError: () => void;
  checkWorkerStatus: () => boolean;
}

/**
 * CADワーカーを使用するためのカスタムフック
 * 
 * @example
 * ```typescript
 * const { evaluateAndRender, isWorking, error } = useCADWorker();
 * 
 * // コード評価と形状レンダリング
 * await evaluateAndRender({
 *   code: 'let box = Box(100, 100, 100); sceneShapes.push(box);',
 *   meshRes: 0.1,
 *   sceneOptions: { groundPlaneVisible: true }
 * });
 * ```
 */
export const useCADWorker = (): UseCADWorkerReturn => {
  const [isWorking, setIsWorking] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ポーリング間隔の ref（メモリリーク防止）
  const workerReadyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const workingStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ワーカー準備状態の監視（最適化: 1秒間隔 + 早期終了）
  useEffect(() => {
    const checkWorkerReady = () => {
      const worker = typeof window !== 'undefined' ? (window as any).cadWorker : null;
      const ready = !!worker;
      
      if (ready && !isWorkerReady) {
        setIsWorkerReady(true);
        // ワーカーが準備完了したらポーリング停止
        if (workerReadyIntervalRef.current) {
          clearInterval(workerReadyIntervalRef.current);
          workerReadyIntervalRef.current = null;
        }
      } else if (!ready && isWorkerReady) {
        setIsWorkerReady(false);
        // ワーカーが利用不可になったらポーリング再開
        if (!workerReadyIntervalRef.current) {
          workerReadyIntervalRef.current = setInterval(checkWorkerReady, 1000);
        }
      }
    };

    // 初回チェック
    checkWorkerReady();

    // ワーカーが未準備の場合のみポーリング開始
    if (!isWorkerReady) {
      workerReadyIntervalRef.current = setInterval(checkWorkerReady, 1000);
    }

    return () => {
      if (workerReadyIntervalRef.current) {
        clearInterval(workerReadyIntervalRef.current);
        workerReadyIntervalRef.current = null;
      }
    };
  }, [isWorkerReady]); // isWorkerReadyを依存関係に追加

  // ワーカー動作状態の監視（最適化: イベントドリブン + 500ms間隔に変更）
  useEffect(() => {
    const checkWorkingStatus = () => {
      const currentlyWorking = cadWorkerService.isWorking();
      if (currentlyWorking !== isWorking) {
        setIsWorking(currentlyWorking);
      }
    };

    // 初回チェック
    checkWorkingStatus();

    // ポーリング間隔を500msに変更（パフォーマンス向上）
    workingStatusIntervalRef.current = setInterval(checkWorkingStatus, 500);
    
    return () => {
      if (workingStatusIntervalRef.current) {
        clearInterval(workingStatusIntervalRef.current);
        workingStatusIntervalRef.current = null;
      }
    };
  }, [isWorking]); // isWorkingを依存関係に追加

  // エラーハンドリング付きの非同期実行ラッパー（メモ化最適化）
  const executeWithErrorHandling = useCallback(async (operation: () => Promise<void>) => {
    try {
      setError(null);
      await operation();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('CAD Worker operation failed:', errorMessage);
      cadWorkerService.resetWorking();
      setIsWorking(false);
    }
  }, []); // 空の依存関係配列でメモ化

  // コード評価（最適化: DEFAULT_GUI_STATE参照を外部化）
  const evaluateCode = useCallback(async (code: string, guiState = DEFAULT_GUI_STATE) => {
    await executeWithErrorHandling(async () => {
      await cadWorkerService.evaluateCode(code, guiState);
    });
  }, [executeWithErrorHandling]);

  // 形状レンダリング（最適化: デフォルト値の定数化）
  const combineAndRenderShapes = useCallback(async (meshRes = 0.1, sceneOptions = {}) => {
    await executeWithErrorHandling(async () => {
      await cadWorkerService.combineAndRenderShapes(meshRes, sceneOptions);
    });
  }, [executeWithErrorHandling]);

  // 複合操作：コード評価 + 形状レンダリング（最適化: デフォルト値の定数化）
  const evaluateAndRender = useCallback(async (
    options: Omit<CADEvaluationOptions, 'guiState'> & { guiState?: any }
  ) => {
    const { guiState = DEFAULT_GUI_STATE, ...rest } = options;
    
    await executeWithErrorHandling(async () => {
      await cadWorkerService.evaluateAndRender({
        ...rest,
        guiState
      });
    });
  }, [executeWithErrorHandling]);

  // ワーカー状態リセット（最適化: 空の依存関係配列）
  const resetWorking = useCallback(() => {
    cadWorkerService.resetWorking();
    setIsWorking(false);
    setError(null);
  }, []);

  // エラークリア（最適化: 空の依存関係配列）
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ワーカー状態チェック（最適化: 空の依存関係配列）
  const checkWorkerStatus = useCallback(() => {
    return cadWorkerService.isWorking();
  }, []);

  return {
    // 状態
    isWorking,
    isWorkerReady,
    error,
    
    // 基本操作
    evaluateCode,
    combineAndRenderShapes,
    
    // 複合操作
    evaluateAndRender,
    
    // ユーティリティ
    resetWorking,
    clearError,
    checkWorkerStatus
  };
};

export default useCADWorker; 