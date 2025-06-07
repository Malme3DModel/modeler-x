import { useState, useCallback, useEffect } from 'react';
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

  // ワーカー準備状態の監視
  useEffect(() => {
    const checkWorkerReady = () => {
      // 直接 window.cadWorker をチェック（実際のワーカーインスタンス）
      const worker = typeof window !== 'undefined' ? (window as any).cadWorker : null;
      setIsWorkerReady(!!worker);
    };

    // 初回チェック
    checkWorkerReady();

    // 定期的にワーカー状態をチェック
    const interval = setInterval(checkWorkerReady, 500);

    return () => clearInterval(interval);
  }, []);

  // ワーカー動作状態の監視
  useEffect(() => {
    const checkWorkingStatus = () => {
      const currentlyWorking = cadWorkerService.isWorking();
      setIsWorking(currentlyWorking);
    };

    const interval = setInterval(checkWorkingStatus, 100);
    return () => clearInterval(interval);
  }, []);

  // エラーハンドリング付きの非同期実行ラッパー
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
  }, []);

  // コード評価
  const evaluateCode = useCallback(async (code: string, guiState = DEFAULT_GUI_STATE) => {
    await executeWithErrorHandling(async () => {
      await cadWorkerService.evaluateCode(code, guiState);
    });
  }, [executeWithErrorHandling]);

  // 形状レンダリング
  const combineAndRenderShapes = useCallback(async (meshRes = 0.1, sceneOptions = {}) => {
    await executeWithErrorHandling(async () => {
      await cadWorkerService.combineAndRenderShapes(meshRes, sceneOptions);
    });
  }, [executeWithErrorHandling]);

  // 複合操作：コード評価 + 形状レンダリング
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

  // ワーカー状態リセット
  const resetWorking = useCallback(() => {
    cadWorkerService.resetWorking();
    setIsWorking(false);
    setError(null);
  }, []);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ワーカー状態チェック
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