'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_LAYOUT_CONFIG, STARTER_CODE } from '@/lib/layout/cascadeLayoutConfig';
import dynamic from 'next/dynamic';

// 新しいインポート
import { URLStateManager } from '@/lib/layout/urlStateManager';
import { GUIState } from '@/types/gui';
import { useCADWorker } from '@/hooks/useCADWorker';

// Golden Layout CSS
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

// TweakpaneGUIを動的インポート
const TweakpaneGUI = dynamic(() => import('@/components/gui/TweakpaneGUI'), {
  ssr: false,
  loading: () => <div style={{ color: '#a0a0a0', fontSize: '12px', padding: '12px' }}>Tweakpane初期化中...</div>
});

// 新しくCascadeNavigationをインポート
import CascadeNavigation from '@/components/layout/CascadeNavigation';

interface CascadeStudioLayoutProps {
  onProjectLoad?: (project: any) => void;
}

export default function CascadeStudioLayout({ 
  onProjectLoad 
}: CascadeStudioLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<any>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guiState, setGuiState] = useState<GUIState>({});
  const [consoleElement, setConsoleElement] = useState<HTMLElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastSavedCodeRef = useRef<string>(STARTER_CODE);
  const lastSavedGuiStateRef = useRef<GUIState>({});

  // CADワーカーフックを追加
  const {
    isWorkerReady,
    isWorking,
    shapes,
    logs,
    error: workerError,
    executeCADCode,
    combineAndRender,
    worker
  } = useCADWorker();

  // URLハッシュから初期状態を読み込む
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const urlState = URLStateManager.getStateFromURL();
      
      // コード状態があれば使用
      if (urlState.code) {
        lastSavedCodeRef.current = urlState.code;
        appendConsoleMessage('🔗 URLから初期コードを読み込みました', 'info');
      }
      
      // GUI状態があれば使用
      if (urlState.guiState) {
        setGuiState(urlState.guiState);
        lastSavedGuiStateRef.current = urlState.guiState;
        appendConsoleMessage('🔗 URLからGUI状態を読み込みました', 'info');
      }
    } catch (error) {
      console.error('URL状態の読み込みに失敗:', error);
      appendConsoleMessage('⚠️ URL状態の読み込みに失敗しました', 'error');
    }
  }, []);

  // ワーカーエラーをコンソールに表示
  useEffect(() => {
    if (workerError && consoleElement) {
      appendConsoleMessage(`❌ CADワーカーエラー: ${workerError}`, 'error');
    }
  }, [workerError, consoleElement]);

  // ワーカーログをコンソールに表示
  useEffect(() => {
    if (logs.length > 0 && consoleElement) {
      logs.forEach(log => {
        appendConsoleMessage(`${log}`, 'info');
      });
    }
  }, [logs, consoleElement]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Golden Layout動的インポート
    const initializeLayout = async () => {
      try {
        const { GoldenLayout } = await import('golden-layout');
        
        // 既存レイアウトを破棄
        if (layoutRef.current) {
          layoutRef.current.destroy();
          layoutRef.current = null;
        }

        // 新しいレイアウト作成
        if (!containerRef.current) {
          throw new Error('Container element not found');
        }
        
        layoutRef.current = new GoldenLayout(containerRef.current);

        // Virtual Components方式
        layoutRef.current.bindComponentEvent = (container: any, itemConfig: any) => {
          // HTMLコンテンツを直接設定
          const componentType = itemConfig.componentType;
          
          switch (componentType) {
            case 'codeEditor':
              createCodeEditorComponent(container);
              break;
            case 'cascadeView':
              createCascadeViewComponent(container);
              break;
            case 'console':
              container.element.innerHTML = createConsoleHTML();
              // コンソール要素への参照を保存
              setConsoleElement(container.element.querySelector('.cascade-console'));
              break;
          }
          
          return { component: null, virtual: true };
        };

        // レイアウト設定を読み込み
        layoutRef.current.loadLayout(DEFAULT_LAYOUT_CONFIG);
        
        // リサイズ対応
        const handleResize = () => {
          if (layoutRef.current && containerRef.current) {
            layoutRef.current.updateSize();
          }
        };
        
        window.addEventListener('resize', handleResize);
        setIsLayoutReady(true);
        setError(null);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (layoutRef.current) {
            layoutRef.current.destroy();
          }
        };
      } catch (err) {
        console.error('Golden Layout initialization failed:', err);
        setError(err instanceof Error ? err.message : 'レイアウト初期化に失敗しました');
      }
    };

    initializeLayout();
  }, []);

  // コードを評価する関数を更新
  const evaluateCode = (code: string) => {
    appendConsoleMessage('🔄 コード評価を開始します...', 'info');
    
    // CADワーカーにコードを送信
    if (isWorkerReady) {
      executeCADCode(code, guiState)
        .then(() => {
          appendConsoleMessage('✅ コード評価を送信しました', 'success');
          
          // URLに状態を保存
          saveStateToURL(code, guiState);
        })
        .catch(err => {
          appendConsoleMessage(`❌ コード評価に失敗: ${err.message}`, 'error');
        });
    } else {
      appendConsoleMessage('❌ CADワーカーが初期化されていません', 'error');
    }
  };
  
  // 状態をURLに保存
  const saveStateToURL = (code: string, guiState: GUIState) => {
    try {
      // 状態に変更がある場合のみURLを更新
      if (code !== lastSavedCodeRef.current || 
          JSON.stringify(guiState) !== JSON.stringify(lastSavedGuiStateRef.current)) {
        
        URLStateManager.saveStateToURL({ code, guiState });
        lastSavedCodeRef.current = code;
        lastSavedGuiStateRef.current = { ...guiState };
        appendConsoleMessage('💾 状態をURLに保存しました', 'success');
      }
    } catch (error) {
      console.error('URL状態の保存に失敗:', error);
      appendConsoleMessage('⚠️ URL状態の保存に失敗しました', 'error');
    }
  };

  // GUI状態更新ハンドラー
  const handleGUIUpdate = (newGuiState: GUIState) => {
    setGuiState(newGuiState);
    console.log('🎛️ [CascadeStudioLayout] GUI状態更新:', newGuiState);
    
    // コンソールにログを追加
    appendConsoleMessage('🔄 Evaluate: CADコードを実行中...', 'info');
    appendConsoleMessage('🎮 GUI状態更新: ' + JSON.stringify(newGuiState, null, 2), 'debug');
    
    // エディターのコードを取得して評価
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      evaluateCode(code);
    }
  };

  // コンソールにメッセージを追加
  const appendConsoleMessage = (message: string, type: 'info' | 'error' | 'success' | 'debug' = 'info') => {
    if (!consoleElement) return;
    
    const messageElement = document.createElement('div');
    messageElement.style.marginTop = '4px';
    
    // メッセージタイプに応じたスタイル
    switch (type) {
      case 'error':
        messageElement.style.color = '#f87171';
        break;
      case 'success':
        messageElement.style.color = '#4fd1c7';
        break;
      case 'debug':
        messageElement.style.color = '#f0db4f';
        break;
      default:
        messageElement.style.color = '#dcdcaa';
    }
    
    messageElement.textContent = `> ${message}`;
    consoleElement.appendChild(messageElement);
    
    // 自動スクロール
    consoleElement.scrollTop = consoleElement.scrollHeight;
  };

  // エラーが発生した場合の表示
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ エラーが発生しました</div>
          <p className="text-gray-300">{error}</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <CascadeNavigation 
        onNewProject={() => {
          // エディタが利用可能ならコードをリセット
          if (editorRef.current) {
            editorRef.current.setValue(STARTER_CODE);
            lastSavedCodeRef.current = STARTER_CODE;
            evaluateCode(STARTER_CODE);
          }
          appendConsoleMessage('🆕 新規プロジェクトを作成しました', 'info');
        }}
        onSaveProject={() => {
          if (editorRef.current) {
            const code = editorRef.current.getValue();
            const projectData = {
              code,
              guiState
            };
            // JSONとしてエクスポート
            const projectString = JSON.stringify(projectData, null, 2);
            const blob = new Blob([projectString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cascade-project.json';
            link.click();
            URL.revokeObjectURL(url);
            appendConsoleMessage('💾 プロジェクトをJSONとして保存しました', 'success');
          }
        }}
        onLoadProject={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const projectData = JSON.parse(event.target?.result as string);
                  if (projectData.code && editorRef.current) {
                    editorRef.current.setValue(projectData.code);
                    lastSavedCodeRef.current = projectData.code;
                    
                    // GUIステートがあれば更新
                    if (projectData.guiState) {
                      setGuiState(projectData.guiState);
                      lastSavedGuiStateRef.current = projectData.guiState;
                    }
                    
                    // コードを評価
                    evaluateCode(projectData.code);
                    appendConsoleMessage('📂 プロジェクトを読み込みました', 'success');
                  }
                } catch (error) {
                  appendConsoleMessage('⚠️ プロジェクトの読み込みに失敗: ' + (error instanceof Error ? error.message : String(error)), 'error');
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
        }}
        onExport={(format) => {
          if (!worker) {
            appendConsoleMessage('❌ ワーカーが初期化されていません', 'error');
            return;
          }
          
          switch (format) {
            case 'step':
              worker.postMessage({ type: 'saveShapeSTEP' });
              appendConsoleMessage('🔄 STEPファイルをエクスポートしています...', 'info');
              break;
            case 'stl':
              worker.postMessage({ type: 'saveShapeSTL' });
              appendConsoleMessage('🔄 STLファイルをエクスポートしています...', 'info');
              break;
            case 'obj':
              worker.postMessage({ type: 'saveShapeOBJ' });
              appendConsoleMessage('🔄 OBJファイルをエクスポートしています...', 'info');
              break;
          }
        }}
        onImportFiles={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.step,.stp,.iges,.igs,.stl';
          input.multiple = true;
          input.onchange = (e: any) => {
            const files = e.target.files;
            if (files && files.length > 0 && worker) {
              appendConsoleMessage(`📁 ${files.length}個のファイルをインポートしています...`, 'info');
              worker.postMessage({ 
                type: 'loadFiles', 
                payload: Array.from(files)
              });
            }
          };
          input.click();
        }}
        onClearImported={() => {
          if (worker) {
            worker.postMessage({ type: 'clearExternalFiles' });
            appendConsoleMessage('🧹 インポートされたファイルをクリアしました', 'info');
          }
        }}
      />
      <div ref={containerRef} className="h-full w-full" />
      {!isLayoutReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-lg text-gray-300">Golden Layout初期化中...</p>
          </div>
        </div>
      )}
    </div>
  );

  // CascadeViewコンポーネント作成（ReactコンポーネントをDOM要素として統合）
  function createCascadeViewComponent(container: any) {
    // コンテナ作成
    const viewContainer = document.createElement('div');
    viewContainer.style.height = '100%';
    viewContainer.style.position = 'relative';
    viewContainer.style.backgroundColor = '#2d3748';
    
    // フローティングGUIコンテナ
    const floatingGUIContainer = document.createElement('div');
    floatingGUIContainer.id = 'tweakpane-gui-container';
    floatingGUIContainer.style.position = 'absolute';
    floatingGUIContainer.style.top = '16px';
    floatingGUIContainer.style.right = '16px';
    floatingGUIContainer.style.zIndex = '10';
    viewContainer.appendChild(floatingGUIContainer);
    
    // 3Dビューポート用コンテナ
    const viewportContainer = document.createElement('div');
    viewportContainer.id = 'cascade-viewport-container';
    viewportContainer.style.width = '100%';
    viewportContainer.style.height = '100%';
    viewContainer.appendChild(viewportContainer);
    
    // コンテナをパネルに追加
    container.element.appendChild(viewContainer);
    
    // ReactコンポーネントをDOM要素にレンダリング
    import('react-dom/client').then(({ createRoot }) => {
      // Tweakpane GUI要素を描画
      const tweakpaneRoot = createRoot(floatingGUIContainer);
      tweakpaneRoot.render(
        <TweakpaneGUI 
          onGUIUpdate={handleGUIUpdate} 
          initialState={guiState}
          cadWorkerReady={isWorkerReady}
        />
      );
      
      // 3Dビューポートコンポーネントを描画
      import('@/components/threejs/CascadeViewport').then(({ default: CascadeViewport }) => {
        const viewportRoot = createRoot(viewportContainer);
        
        // GUIからビューポート設定を取得
        const viewSettings = {
          groundPlane: guiState["GroundPlane?"] !== false,
          grid: guiState["Grid?"] !== false,
          axes: true,
          ambientLight: true,
          ambientLightIntensity: 0.5,
          backgroundColor: '#2d3748',
          wireframe: false,
          shadows: true
        };
        
        // ビューポートをレンダリング
        viewportRoot.render(
          <CascadeViewport 
            shapes={shapes} 
            viewSettings={viewSettings}
          />
        );
        
        appendConsoleMessage('🔍 CAD Viewportを初期化しました', 'info');
      }).catch(err => {
        console.error('3Dビューポート初期化エラー:', err);
        appendConsoleMessage('❌ 3Dビューポート初期化に失敗: ' + err.message, 'error');
      });
    });
  }
  
  // Monaco Editorコンポーネント作成（ReactコンポーネントをDOM要素として統合）
  function createCodeEditorComponent(container: any) {
    // エディターコンテナ作成
    const editorContainer = document.createElement('div');
    editorContainer.style.height = '100%';
    editorContainer.style.width = '100%';
    editorContainer.style.backgroundColor = '#1e1e1e';
    container.element.appendChild(editorContainer);
    
    // Monaco Editorのワーカー設定
    if (typeof window !== 'undefined') {
      // ワーカーを提供する関数を設定
      (window as any).MonacoEnvironment = {
        // ワーカーURLを提供する関数
        getWorkerUrl: function(_moduleId: string, label: string) {
          if (label === 'typescript' || label === 'javascript') {
            return '/monaco-editor-workers/ts.worker.js';
          }
          return '/monaco-editor-workers/editor.worker.js';
        },
        // ワーカーオプションを提供する関数（classicタイプで作成）
        getWorkerOptions: function() {
          return {
            type: 'classic' // モジュールスクリプトではimportScriptsが使えないためclassicを使用
          };
        }
      };
    }
    
    // モナコエディターを動的にインポートして初期化
    import('monaco-editor').then(monaco => {
      // URLから読み込んだコードまたはデフォルトを使用
      const initialCode = lastSavedCodeRef.current || STARTER_CODE;
      
      // モナコエディター初期化
      const editor = monaco.editor.create(editorContainer, {
        value: initialCode,
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: true },
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        scrollBeyondLastLine: false,
      });
      
      // エディター参照を保存
      editorRef.current = editor;
      
      // F5キーとCtrl+Sのキーバインド設定
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // コード評価を実行
        const code = editor.getValue();
        evaluateCode(code);
      });
      
      editor.addCommand(monaco.KeyCode.F5, () => {
        // コード評価を実行
        const code = editor.getValue();
        evaluateCode(code);
      });
      
      // ワーカーが準備できたら、初期コードを評価
      if (isWorkerReady) {
        setTimeout(() => {
          appendConsoleMessage('🚀 初期コードを評価します...', 'info');
          evaluateCode(initialCode);
        }, 1000);
      }
    });
  }
  
  function createCodeEditorHTML(): string {
    return `
      <div id="code-editor-container" style="height: 100%; width: 100%; background-color: #1e1e1e;"></div>
    `;
  }
  
  function createConsoleHTML(): string {
    return `
      <div class="cascade-console-container" style="height: 100%; width: 100%; background-color: #1e1e1e; overflow: hidden; display: flex; flex-direction: column;">
        <div class="cascade-console" style="flex: 1; padding: 8px; overflow-y: auto; overflow-x: hidden; font-family: Consolas, 'Courier New', monospace; font-size: 13px; color: #dcdcaa; white-space: pre-wrap; word-break: break-all;">
          <div>> 🚀 CascadeStudio Console</div>
          <div>> ✅ 初期化完了</div>
        </div>
      </div>
    `;
  }

  // ワーカーメッセージハンドラーを追加
  useEffect(() => {
    if (!worker || !isWorkerReady) return;

    // STEPファイルエクスポート処理
    const handleSaveShapeSTEP = (e: MessageEvent) => {
      if (e.data.type === 'saveShapeSTEP' && e.data.payload) {
        const stepContent = e.data.payload;
        const blob = new Blob([stepContent], { type: 'model/step' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cascade-model.step';
        link.click();
        URL.revokeObjectURL(url);
        appendConsoleMessage('✅ STEPファイルをエクスポートしました', 'success');
      }
    };

    // STLファイルエクスポート処理
    const handleSaveShapeSTL = (e: MessageEvent) => {
      if (e.data.type === 'saveShapeSTL' && e.data.payload) {
        const stlContent = e.data.payload;
        const blob = new Blob([stlContent], { type: 'model/stl' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cascade-model.stl';
        link.click();
        URL.revokeObjectURL(url);
        appendConsoleMessage('✅ STLファイルをエクスポートしました', 'success');
      }
    };

    // OBJファイルエクスポート処理
    const handleSaveShapeOBJ = (e: MessageEvent) => {
      if (e.data.type === 'saveShapeOBJ' && e.data.payload) {
        const objContent = e.data.payload;
        const blob = new Blob([objContent], { type: 'model/obj' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cascade-model.obj';
        link.click();
        URL.revokeObjectURL(url);
        appendConsoleMessage('✅ OBJファイルをエクスポートしました', 'success');
      }
    };

    // ファイル読み込み処理
    const handleLoadFiles = (e: MessageEvent) => {
      if (e.data.type === 'loadFiles' && e.data.payload) {
        appendConsoleMessage(`✅ ${Object.keys(e.data.payload).length}個のファイルをインポートしました`, 'success');
      }
    };

    // イベントリスナーを登録
    worker.addEventListener('message', handleSaveShapeSTEP);
    worker.addEventListener('message', handleSaveShapeSTL);
    worker.addEventListener('message', handleSaveShapeOBJ);
    worker.addEventListener('message', handleLoadFiles);

    // クリーンアップ
    return () => {
      worker.removeEventListener('message', handleSaveShapeSTEP);
      worker.removeEventListener('message', handleSaveShapeSTL);
      worker.removeEventListener('message', handleSaveShapeOBJ);
      worker.removeEventListener('message', handleLoadFiles);
    };
  }, [worker, isWorkerReady]);
} 