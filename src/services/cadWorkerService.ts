export interface CADWorkerService {
  evaluateCode: (code: string, guiState: any) => Promise<void>;
  combineAndRenderShapes: (meshRes?: number, sceneOptions?: any) => Promise<void>;
  isWorking: () => boolean;
  setWorking: (working: boolean) => void;
  getWorkerInstance: () => any;
}

export interface CADEvaluationOptions {
  code: string;
  guiState: any;
  meshRes?: number;
  sceneOptions?: {
    groundPlaneVisible?: boolean;
    gridVisible?: boolean;
  };
  delay?: number;
}

class CADWorkerServiceImpl implements CADWorkerService {
  private isWorkingState = false;
  
  constructor() {
    // グローバル状態の初期化
    if (typeof window !== 'undefined') {
      (window as any).workerWorking = false;
    }
  }

  evaluateCode = async (code: string, guiState: any): Promise<void> => {
    const cadWorker = this.getWorkerInstance();
    if (!cadWorker || this.isWorking()) {
      throw new Error('CAD Worker is not available or currently working');
    }

    try {
      this.setWorking(true);
      cadWorker.evaluateCode(code, guiState);
    } catch (error) {
      this.setWorking(false);
      throw error;
    }
  };

  combineAndRenderShapes = async (meshRes = 0.1, sceneOptions = {}): Promise<void> => {
    const cadWorker = this.getWorkerInstance();
    if (!cadWorker) {
      throw new Error('CAD Worker is not available');
    }

    return new Promise((resolve) => {
      cadWorker.combineAndRenderShapes(meshRes, sceneOptions);
      // 短い遅延後にresolve（ワーカーからの非同期レスポンスを待つため）
      setTimeout(resolve, 100);
    });
  };

  isWorking = (): boolean => {
    return this.isWorkingState && (window as any).workerWorking;
  };

  setWorking = (working: boolean): void => {
    this.isWorkingState = working;
    if (typeof window !== 'undefined') {
      (window as any).workerWorking = working;
    }
  };

  getWorkerInstance = (): any => {
    if (typeof window === 'undefined') return null;
    return (window as any).cadWorker;
  };

  // 複合操作：コード評価 + 形状レンダリング
  evaluateAndRender = async (options: CADEvaluationOptions): Promise<void> => {
    const {
      code,
      guiState,
      meshRes = 0.1,
      sceneOptions = {},
      delay = 100
    } = options;

    try {
      // コード評価
      await this.evaluateCode(code, guiState);

      // 指定された遅延後に形状レンダリング
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.combineAndRenderShapes(meshRes, sceneOptions);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    } catch (error) {
      this.setWorking(false);
      throw error;
    }
  };

  // ワーカー状態のリセット
  resetWorking = (): void => {
    this.setWorking(false);
  };
}

// シングルトンインスタンス
export const cadWorkerService = new CADWorkerServiceImpl();

// デフォルトエクスポート（後方互換性のため）
export default cadWorkerService; 