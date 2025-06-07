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
  // Three.js関連の新機能
  createTransformHandle: (payload: any) => void;
  clearTransformHandles: () => void;
  saveShapeSTEP: () => void;
  saveShapeSTL: () => void;
  saveShapeOBJ: () => void;
  updateGUIState: (name: string, value: any) => void;
  // OpenCascade.js関連
  initOpenCascade: () => Promise<void>;
  isOpenCascadeReady: boolean;
}

export function createCascadeStudioCore(
  setIsWorking: (isWorking: boolean) => void,
  setConsoleOutput: (output: string | ((prev: string) => string)) => void
): CascadeStudioCore {
  const core: CascadeStudioCore = {
    messageHandlers: {},
    guiState: {},
    isWorking: false,
    isOpenCascadeReady: false,
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

        // Phase 2: ESM対応WebWorkerを優先的に試行
        let worker: Worker;
        if (typeof window !== 'undefined') {
          // クライアントサイドでのみ実行
          try {
            // まずESM対応のWorkerを試行
            const esmWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.mjs`;
            worker = new Worker(esmWorkerUrl, { type: 'module' });
            console.log("ESM Worker initialized successfully");
          } catch (esmError) {
            console.warn("ESM Worker failed, falling back to legacy worker:", esmError);
            // フォールバック: 既存のWorkerを使用
            const legacyWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.js`;
            worker = new Worker(legacyWorkerUrl);
            console.log("Legacy Worker initialized as fallback");
          }
        } else {
          return null;
        }

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
          
          // ESMワーカーでエラーが発生した場合、レガシーワーカーにフォールバック
          if (!(worker as any).fallbackAttempted) {
            console.warn("ESM Worker failed, attempting fallback to legacy worker");
            (worker as any).fallbackAttempted = true;
            worker.terminate();
            
            try {
              const legacyWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.js`;
              const fallbackWorker = new Worker(legacyWorkerUrl);
              
              fallbackWorker.onmessage = worker.onmessage;
              fallbackWorker.onerror = (fallbackError) => {
                console.error("Fallback Worker also failed:", fallbackError);
                setConsoleOutput((prev: string) => prev + "\nBoth ESM and Legacy Workers failed\n");
              };
              
              (window as any).cascadeStudioWorker = fallbackWorker;
              console.log("Successfully fell back to legacy worker");
              return fallbackWorker;
            } catch (fallbackError) {
              console.error("Fallback worker initialization failed:", fallbackError);
            }
          }
        };

        // グローバルに保存（他のコンポーネントからアクセスできるように）
        (window as any).cascadeStudioWorker = worker;
        
        // ワーカー状態フラグを初期化
        (window as any).workerWorking = false;

        // ログハンドラー
        core.registerMessageHandler("log", (payload) => {
          console.log("Worker Log:", payload);
          setConsoleOutput((prev: string) => prev + "\n" + payload);
        });

        // エラーハンドラー
        core.registerMessageHandler("error", (payload) => {
          console.error("Worker Error:", payload);
          setConsoleOutput((prev: string) => prev + "\nError: " + payload);
          core.setWorkingState(false);
          (window as any).workerWorking = false;
          
          if (payload && payload.includes("ESM Worker failed")) {
            console.warn("ESM Worker failed, attempting fallback to legacy worker");
            setTimeout(() => {
              try {
                const legacyWorkerUrl = `${window.location.origin}/js/CascadeStudioMainWorker.js`;
                const fallbackWorker = new Worker(legacyWorkerUrl);
                
                fallbackWorker.onmessage = worker.onmessage;
                fallbackWorker.onerror = (fallbackError) => {
                  console.error("Fallback Worker also failed:", fallbackError);
                  setConsoleOutput((prev: string) => prev + "\nBoth ESM and Legacy Workers failed\n");
                };
                
                (window as any).cascadeStudioWorker = fallbackWorker;
                console.log("Successfully fell back to legacy worker");
              } catch (fallbackError) {
                console.error("Fallback worker initialization failed:", fallbackError);
              }
            }, 1000);
          }
        });

        // リセットハンドラー
        core.registerMessageHandler("resetWorking", () => {
          core.setWorkingState(false);
          (window as any).workerWorking = false;
        });

        // 開始コールバック
        core.registerMessageHandler("startupCallback", () => {
          console.log("CAD Worker Initialized");
          setConsoleOutput((prev: string) => prev + "\nCAD Worker Initialized");
        });

        // Phase 2: API調査結果ハンドラー
        core.registerMessageHandler("apiInvestigation", (payload) => {
          console.log("OpenCascade.js API Investigation Results:", payload);
          setConsoleOutput((prev: string) => prev + "\nAPI Investigation completed");
        });

        // 進捗ハンドラー
        core.registerMessageHandler("Progress", (payload) => {
          console.log(`Operation ${payload.opNumber}: ${payload.opType}`);
        });

        // ファイル保存ハンドラー
        core.registerMessageHandler("saveFile", (payload) => {
          const link = document.createElement("a");
          link.href = payload.fileURL;
          link.download = payload.filename;
          link.click();
        });

        // STEP保存ハンドラー
        core.registerMessageHandler("saveShapeSTEP", async (stepContent) => {
          try {
            if ((window as any).showSaveFilePicker) {
              const fileHandle = await (window as any).showSaveFilePicker({
                types: [{
                  description: 'STEP files',
                  accept: { 'text/plain': ['.step'] }
                }]
              });
              const writable = await fileHandle.createWritable();
              await writable.write(stepContent);
              await writable.close();
              console.log("Saved STEP to " + fileHandle.name);
            } else {
              const blob = new Blob([stepContent], { type: 'model/step' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'model.step';
              link.click();
              URL.revokeObjectURL(url);
            }
          } catch (error) {
            console.error("Failed to save STEP file:", error);
          }
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

      if (core.isWorking || (window as any).workerWorking) {
        console.warn("Already processing a CAD operation...");
        return;
      }

      core.setWorkingState(true);
      (window as any).workerWorking = true;
      
      // デフォルトのGUIステートを設定
      if (!core.guiState["MeshRes"]) core.guiState["MeshRes"] = 0.1;
      if (!core.guiState["Cache?"]) core.guiState["Cache?"] = true;
      if (!core.guiState["GroundPlane?"]) core.guiState["GroundPlane?"] = false;
      if (!core.guiState["Grid?"]) core.guiState["Grid?"] = true;
      
      worker.postMessage({
        type: "Evaluate",
        payload: {
          code: code,
          GUIState: core.guiState
        }
      });

      // 形状の結合とレンダリングを要求
      setTimeout(() => {
        worker.postMessage({
          type: "combineAndRenderShapes",
          payload: { 
            maxDeviation: core.guiState["MeshRes"], 
            sceneOptions: { 
              groundPlaneVisible: core.guiState["GroundPlane?"], 
              gridVisible: core.guiState["Grid?"] 
            }
          }
        });
      }, 100);
    },
    
    clearAll: () => {
      // Transform Handlesをクリア
      core.clearTransformHandles();
      
      // 3D形状をクリア
      if (core.messageHandlers["combineAndRenderShapes"]) {
        core.messageHandlers["combineAndRenderShapes"]({ 
          facelist: [], 
          edgelist: [], 
          sceneOptions: { 
            gridVisible: true, 
            groundPlaneVisible: false, 
            axesVisible: true
          }
        });
      }
      
      // GUIステートをリセット
      core.guiState = {};
    },

    // Three.js関連の新機能
    createTransformHandle: (payload: any) => {
      if (core.messageHandlers["createTransformHandle"]) {
        core.messageHandlers["createTransformHandle"](payload);
      }
    },

    clearTransformHandles: () => {
      if (core.messageHandlers["clearTransformHandles"]) {
        core.messageHandlers["clearTransformHandles"](null);
      }
    },

    saveShapeSTEP: () => {
      const worker = (window as any).cascadeStudioWorker;
      if (worker) {
        worker.postMessage({ type: "saveShapeSTEP" });
      }
    },

    saveShapeSTL: () => {
      if (core.messageHandlers["saveShapeSTL"]) {
        core.messageHandlers["saveShapeSTL"](null);
      }
    },

    saveShapeOBJ: () => {
      if (core.messageHandlers["saveShapeOBJ"]) {
        core.messageHandlers["saveShapeOBJ"](null);
      }
    },

    updateGUIState: (name: string, value: any) => {
      core.guiState[name] = value;
    },

    initOpenCascade: async () => {
      try {
        console.log("OpenCascade.js initialization skipped for now");
        setConsoleOutput((prev: string) => prev + "\nOpenCascade.js initialization skipped for now");
        core.isOpenCascadeReady = true;
      } catch (error) {
        console.error("Failed to initialize OpenCascade.js:", error);
        setConsoleOutput((prev: string) => prev + "\nFailed to initialize OpenCascade.js: " + error);
      }
    }
  };

  return core;
}    