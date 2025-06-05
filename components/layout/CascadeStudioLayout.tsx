'use client';

import { useEffect, useRef, useState, useCallback, MutableRefObject } from 'react';
import { DEFAULT_LAYOUT_CONFIG, STARTER_CODE } from '@/lib/layout/cascadeLayoutConfig';
import dynamic from 'next/dynamic';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@/contexts/AppContext';

// 新しいインポート
import { URLStateManager } from '@/lib/layout/urlStateManager';
import { GUIState } from '@/types/gui';
import { CascadeConsole, CascadeConsoleRef } from '@/components/layout/CascadeConsole';
import type { MonacoCodeEditorRef } from '@/components/cad/MonacoCodeEditor';
import { useAppContext } from '@/contexts/AppContext';

// Golden Layout CSS
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

// MonacoCodeEditorを動的インポート
const MonacoCodeEditor = dynamic(
  () => import('@/components/cad/MonacoCodeEditor').then(mod => ({ default: mod.default })),
  { ssr: false }
);

// TweakpaneGUIを動的インポート
const TweakpaneGUI = dynamic(() => import('@/components/gui/TweakpaneGUI').then(mod => ({ default: mod.default })), {
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
  console.log('🏗️ [CascadeStudioLayout] Component mounting...');
  return (
    <AppProvider>
      <CascadeStudioLayoutInner onProjectLoad={onProjectLoad} />
    </AppProvider>
  );
}

function CascadeStudioLayoutInner({ 
  onProjectLoad 
}: CascadeStudioLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<any>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guiState, setGuiState] = useState<GUIState>({});
  const consoleRef = useRef<CascadeConsoleRef | null>(null);
  const [editorInstance, setEditorInstance] = useState<MonacoCodeEditorRef | null>(null);
  const lastSavedCodeRef = useRef<string>(STARTER_CODE);
  const lastSavedGuiStateRef = useRef<GUIState>({});

  const [consoleInstance, setConsoleInstance] = useState<CascadeConsoleRef | null>(null);

  const { cadEngine } = useAppContext();
  const {
    isWorkerReady,
    isWorking,
    shapes,
    logs,
    error: workerError,
    executeCADCode,
    combineAndRender,
    worker
  } = cadEngine;

  // コンソールインスタンスが更新されたらrefを更新
  useEffect(() => {
    consoleRef.current = consoleInstance;
  }, [consoleInstance]);

  // コンソールにメッセージを追加（CascadeConsoleを使用）
  const appendConsoleMessage = useCallback((message: string, type: 'info' | 'error' | 'success' | 'debug' = 'info') => {
    if (consoleRef.current) {
      consoleRef.current.appendMessage(message, type);
    }
  }, []);

  // コードを評価する関数を定義（先に定義しておく）
  const evaluateCode = useCallback((code: string) => {
    appendConsoleMessage('🔄 コード評価を開始します...', 'info');
    
    // CADワーカーマネージャーから直接状態を取得
    const workerManager = (window as any).cadWorkerManager;
    const isWorkerActuallyReady = workerManager?.isWorkerReady() || isWorkerReady;
    
    // CADワーカーにコードを送信
    if (isWorkerActuallyReady) {
      executeCADCode(code, guiState)
        .then(() => {
          appendConsoleMessage('✅ コード評価を送信しました', 'success');
          
          // URLに状態を保存
          try {
            // 必ずURLハッシュを最新状態に更新
            URLStateManager.saveStateToURL({ code, guiState });
            lastSavedCodeRef.current = code;
            lastSavedGuiStateRef.current = { ...guiState };
            appendConsoleMessage('💾 状態をURLに保存しました', 'success');
          } catch (error) {
            console.error('URL状態の保存に失敗:', error);
            appendConsoleMessage('⚠️ URL状態の保存に失敗しました', 'error');
          }
        })
        .catch(err => {
          appendConsoleMessage(`❌ コード評価に失敗: ${err.message}`, 'error');
        });
    } else {
      appendConsoleMessage('❌ CADワーカーが初期化されていません', 'error');
    }
  }, [isWorkerReady, executeCADCode, guiState, appendConsoleMessage]);
  
  // URLハッシュから初期状態を読み込む（一度だけ実行）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 既に読み込み済みの場合はスキップ
    if (lastSavedCodeRef.current !== STARTER_CODE) return;
    
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
  }, []); // 依存配列を空にして一度だけ実行

  // ワーカーエラーをコンソールに表示
  useEffect(() => {
    if (workerError) {
      appendConsoleMessage(`❌ CADワーカーエラー: ${workerError}`, 'error');
    }
  }, [workerError, appendConsoleMessage]);

  // ワーカーログをコンソールに表示
  useEffect(() => {
    if (logs.length > 0) {
      logs.forEach((log: string) => {
        appendConsoleMessage(`${log}`, 'info');
      });
    }
  }, [logs, appendConsoleMessage]);

  useEffect(() => {
    if (!containerRef.current || isLayoutReady) return; // 既に初期化済みの場合はスキップ

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
              container.element.innerHTML = '';
              
              // エディターコンポーネントのマウント先を作成
              const editorContainer = document.createElement('div');
              editorContainer.style.width = '100%';
              editorContainer.style.height = '100%';
              container.element.appendChild(editorContainer);
              
              // React 18のcreateRootを使用してReactコンポーネントをマウント
              const editorRoot = createRoot(editorContainer);
              
              // 新しいrefオブジェクトを作成
              const localEditorRef = {
                current: null as MonacoCodeEditorRef | null
              };
              
              // エディタコンポーネントのレンダリング
              editorRoot.render(
                <MonacoCodeEditor
                  ref={(ref) => {
                    if (ref) {
                      // refがセットされたらインスタンスを保存
                      localEditorRef.current = ref;
                      setEditorInstance(ref);
                    }
                  }}
                  initialCode={lastSavedCodeRef.current}
                  onEvaluate={evaluateCode}
                />
              );
              break;
            case 'cascadeView':
              createCascadeViewComponent(container);
              break;
            case 'console':
              container.element.innerHTML = '';
              
              // コンソールコンポーネントのマウント先を作成
              const consoleContainer = document.createElement('div');
              consoleContainer.style.width = '100%';
              consoleContainer.style.height = '100%';
              container.element.appendChild(consoleContainer);
              
              // コンソールのDOM直接埋め込み
              const consoleElement = document.createElement('div');
              consoleElement.className = 'cascade-console';
              consoleElement.style.cssText = 'height: 100%; overflow-y: auto; padding: 8px; font-family: monospace; font-size: 12px; background-color: #1e1e1e; color: #dcdcaa;';
              consoleContainer.appendChild(consoleElement);
              
              // 手動でインスタンスを作成
              // DOM操作方式
              const newConsoleInstance: CascadeConsoleRef = {
                appendMessage: (message, type = 'info') => {
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
                },
                clear: () => {
                  consoleElement.innerHTML = '';
                },
                getElement: () => consoleElement
              };
              
              // refを更新（stateを通して）
              setConsoleInstance(newConsoleInstance);
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
  }, [appendConsoleMessage, evaluateCode]);

  // GUI状態更新ハンドラー
  const handleGUIUpdate = useCallback((newGuiState: GUIState) => {
    setGuiState(newGuiState);
    console.log('🎛️ [CascadeStudioLayout] GUI状態更新:', newGuiState);
    
    // コンソールにログを追加
    appendConsoleMessage('🔄 Evaluate: CADコードを実行中...', 'info');
    appendConsoleMessage('🎮 GUI状態更新: ' + JSON.stringify(newGuiState, null, 2), 'debug');
    
    // エディターのコードを取得して評価
    if (editorInstance) {
      const code = editorInstance.getValue();
      evaluateCode(code);
    }
  }, [appendConsoleMessage, evaluateCode, editorInstance]);

  // beforeunload（F5リロード等）時にも必ずURLハッシュを最新化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      // 最新のコード・GUI状態をURLに保存
      URLStateManager.saveStateToURL({
        code: lastSavedCodeRef.current,
        guiState: lastSavedGuiStateRef.current
      });
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  // エラーが発生した場合の表示
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 bg-red-900 rounded-lg max-w-xl">
          <h2 className="text-2xl mb-4">エラーが発生しました</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-white text-red-900 rounded hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // CascadeViewportコンポーネントの設定
  function createCascadeViewComponent(container: any) {
    // コンテナのHTMLを初期化
    container.element.innerHTML = '';
    
    // ビューポートコンテナを作成
    const viewContainer = document.createElement('div');
    viewContainer.style.width = '100%';
    viewContainer.style.height = '100%';
    viewContainer.style.position = 'relative'; // カメラコントロール配置のために追加
    viewContainer.className = 'canvas-container'; // テスト用のクラス名を追加
    viewContainer.setAttribute('data-testid', 'cascade-viewport-container'); // テスト用のID追加
    container.element.appendChild(viewContainer);
    
    // React 18のcreateRootを使用
    const viewRoot = createRoot(viewContainer);
    
    // ThreeJSViewportコンポーネントをレンダリング
    const ThreeJSViewport = dynamic(() => import('@/components/threejs/ThreeJSViewport').then(mod => ({ default: mod.default })), {
      ssr: false,
      loading: () => <div style={{ color: '#a0a0a0', fontSize: '12px', padding: '12px' }}>3Dビューポート初期化中...</div>
    });
    
    // メインビューポートをレンダリング
    viewRoot.render(
      <ThreeJSViewport 
        cameraPosition={[50, 50, 50]} 
        enableControls={true} 
      />
    );
    
    // クリーンアップ関数を設定
    container.on('destroy', () => {
      try {
        viewRoot.unmount();
      } catch (error) {
        console.error('View unmount error:', error);
      }
    });
  }

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col">
      {/* ナビゲーションバー */}
      <CascadeNavigation 
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
        onNewProject={() => {
          // エディタが利用可能ならコードをリセット
          if (editorInstance) {
            editorInstance.setValue(STARTER_CODE);
            lastSavedCodeRef.current = STARTER_CODE;
            evaluateCode(STARTER_CODE);
          }
        }}
        onSaveProject={() => {
          if (editorInstance) {
            const code = editorInstance.getValue();
            const projectData = {
              code,
              guiState
            };
            
            // JSONとしてダウンロード
            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cascade-studio-project.json';
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
        onLoadProject={() => {
          // ファイル選択ダイアログを表示
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const projectData = JSON.parse(event.target?.result as string);
                  if (projectData.code && editorInstance) {
                    editorInstance.setValue(projectData.code);
                    lastSavedCodeRef.current = projectData.code;
                    
                    if (projectData.guiState) {
                      setGuiState(projectData.guiState);
                      lastSavedGuiStateRef.current = projectData.guiState;
                    }
                    
                    // 読み込んだコードを実行
                    evaluateCode(projectData.code);
                    appendConsoleMessage('📂 プロジェクトを読み込みました', 'success');
                  }
                } catch (error) {
                  appendConsoleMessage('❌ プロジェクトの読み込みに失敗: ' + (error instanceof Error ? error.message : String(error)), 'error');
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
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
      
      {/* メインコンテンツ */}
      <div className="flex-grow" ref={containerRef}>
        {/* レイアウトがここに動的に生成される */}
      </div>
      
      {/* Tweakpane GUI */}
      <div className="absolute top-16 right-0 z-10">
        <TweakpaneGUI 
          initialState={guiState}
          onGUIUpdate={handleGUIUpdate}
          cadWorkerReady={isWorkerReady}
        />
      </div>
    </div>
  );
}                          