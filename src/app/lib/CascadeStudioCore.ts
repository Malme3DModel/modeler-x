'use client';

export interface CascadeStudioCore {
  messageHandlers: Record<string, (payload: any) => void>;
  guiState: Record<string, any>;
  setWorkingState: (isWorking: boolean) => void;
  registerMessageHandler: (type: string, handler: (payload: any) => void) => void;
  initWorker: () => Worker | null;
  evaluate: (code: string) => void;
  clearAll: () => void;
  isWorking: boolean;
}

export function createCascadeStudioCore(
  setIsWorking: (isWorking: boolean) => void,
  setConsoleOutput: (output: string | ((prev: string) => string)) => void
): CascadeStudioCore {
  const core: CascadeStudioCore = {
    messageHandlers: {},
    guiState: {},
    isWorking: false,
    setWorkingState: (isWorking: boolean) => {
      core.isWorking = isWorking;
      setIsWorking(isWorking);
    },
    
    registerMessageHandler: (type: string, handler: (payload: any) => void) => {
      core.messageHandlers[type] = handler;
    },

    initWorker: () => {
      try {
        // 既存のWebWorkerを削除
        if ((window as any).cascadeStudioWorker) {
          (window as any).cascadeStudioWorker.terminate();
        }

        // Web Workerの作成
        const workerUrl = '/js/CADWorker/CascadeStudioMainWorker.js';
        const worker = new Worker(new URL(workerUrl, window.location.origin));

        // Web Workerからのメッセージを処理するハンドラーを登録
        worker.onmessage = (e) => {
          if (core.messageHandlers[e.data.type]) {
            core.messageHandlers[e.data.type](e.data.payload);
          }
        };

        // エラーハンドラー
        worker.onerror = (e) => {
          console.error("CAD Worker error:", e);
          setConsoleOutput((prev: string) => prev + "\nCAD Worker error: " + e + "\n");
          core.setWorkingState(false);
        };

        // グローバルに保存（他のコンポーネントからアクセスできるように）
        (window as any).cascadeStudioWorker = worker;

        // ログハンドラー
        core.registerMessageHandler("log", (payload) => {
          console.log("Worker Log:", payload);
          setConsoleOutput((prev: string) => prev + "\n" + payload);
        });

        // リセットハンドラー
        core.registerMessageHandler("resetWorking", () => {
          core.setWorkingState(false);
        });

        // 開始コールバック
        core.registerMessageHandler("startupCallback", () => {
          console.log("CAD Worker Initialized");
          setConsoleOutput((prev: string) => prev + "\nCAD Worker Initialized");
        });

        // 進捗ハンドラー
        core.registerMessageHandler("Progress", (payload) => {
          console.log(`Operation ${payload.opNumber}: ${payload.opType}`);
        });

        return worker;
      } catch (error) {
        console.error("Failed to initialize CAD Worker:", error);
        setConsoleOutput((prev: string) => prev + "\nFailed to initialize CAD Worker: " + error);
        return null;
      }
    },

    evaluate: (code: string) => {
      const worker = (window as any).cascadeStudioWorker;
      if (!worker) {
        console.error("CAD Worker not initialized");
        setConsoleOutput((prev: string) => prev + "\nCAD Worker not initialized");
        return;
      }

      if (core.isWorking) {
        console.warn("Already processing a CAD operation...");
        return;
      }

      core.setWorkingState(true);
      worker.postMessage({
        type: "Evaluate",
        payload: {
          code: code,
          GUIState: core.guiState
        }
      });
    },
    
    clearAll: () => {
      // 3D形状をクリア
      if ((window as any).cascadeStudioWorker) {
        (window as any).cascadeStudioWorker.postMessage({
          type: "combineAndRenderShapes",
          payload: { 
            facelist: [], 
            edgelist: [], 
            sceneOptions: { 
              gridVisible: true, 
              groundPlaneVisible: false, 
              axesVisible: true
            }
          }
        });
      }
      // GUIステートをリセット
      core.guiState = {};
    }
  };

  return core;
} 