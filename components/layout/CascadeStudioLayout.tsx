'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_LAYOUT_CONFIG, STARTER_CODE } from '@/lib/layout/cascadeLayoutConfig';
import dynamic from 'next/dynamic';

// Golden Layout CSS
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

// TweakpaneGUIを動的インポート
const TweakpaneGUI = dynamic(() => import('@/components/gui/TweakpaneGUI'), {
  ssr: false,
  loading: () => <div style={{ color: '#a0a0a0', fontSize: '12px', padding: '12px' }}>Tweakpane初期化中...</div>
});

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
  const [guiState, setGuiState] = useState<Record<string, any>>({});
  const [consoleElement, setConsoleElement] = useState<HTMLElement | null>(null);

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
              container.element.innerHTML = createCodeEditorHTML();
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

  // GUI状態更新ハンドラー
  const handleGUIUpdate = (newGuiState: Record<string, any>) => {
    setGuiState(newGuiState);
    console.log('🎛️ [CascadeStudioLayout] GUI状態更新:', newGuiState);
    
    // コンソールにログを追加
    appendConsoleMessage('🔄 Evaluate: CADコードを実行中...', 'info');
    appendConsoleMessage('🎮 GUI状態更新: ' + JSON.stringify(newGuiState, null, 2), 'debug');
    
    // ここで後でCADWorkerにGUI状態を送信して、コードを実行
    // executeCADCode(editor.getValue(), newGuiState);
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
    floatingGUIContainer.style.zIndex = '1000';
    viewContainer.appendChild(floatingGUIContainer);
    
    // メインビューポート
    const viewport = document.createElement('div');
    viewport.style.height = '100%';
    viewport.style.display = 'flex';
    viewport.style.alignItems = 'center';
    viewport.style.justifyContent = 'center';
    viewport.style.color = '#a0aec0';
    viewport.innerHTML = `
      <div style="text-align: center;">
        <h3 style="color: #4fd1c7; margin-bottom: 16px;">🎨 3D CADビューポート</h3>
        <p>React Three Fiber統合準備中...</p>
        <p style="font-size: 14px; margin-top: 12px;">WebWorker状態: 初期化中...</p>
      </div>
    `;
    viewContainer.appendChild(viewport);
    
    container.element.appendChild(viewContainer);
    
    // ReactコンポーネントをDOM要素にレンダリング
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(floatingGUIContainer);
      root.render(
        // @ts-ignore
        <TweakpaneGUI 
          onGUIUpdate={handleGUIUpdate}
          initialState={guiState}
          cadWorkerReady={isLayoutReady}
        />
      );
    });
  }
}

// HTMLコンテンツ生成関数
function createCodeEditorHTML(): string {
  return `
    <div style="height: 100%; background-color: #1e1e1e; padding: 20px; color: #d4d4d4; font-family: 'Consolas', monospace;">
      <h3 style="color: #569cd6; margin-bottom: 16px;">🖥️ Monaco Editor</h3>
      <p style="margin-bottom: 12px;">CascadeStudio風エディターを準備中...</p>
      <p style="font-size: 14px; color: #6a9955;">// TypeScript Intellisense対応</p>
      <div style="margin-top: 20px; padding: 16px; background-color: #252526; border-radius: 4px; max-height: 300px; overflow-y: auto;">
        <pre style="color: #ce9178; margin: 0; white-space: pre-wrap;">${STARTER_CODE}</pre>
      </div>
    </div>
  `;
}

function createConsoleHTML(): string {
  return `
    <div style="
      height: 100%;
      overflow: auto;
      background-color: #1e1e1e;
      box-shadow: inset 0px 0px 3px rgba(0,0,0,0.75);
      font-family: Consolas, monospace;
      font-size: 14px;
      padding: 12px;
      color: #d4d4d4;
    " class="cascade-console">
      <div style="border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 8px;">
        <span style="color: #4fc1ff;">🖥️ CascadeStudio Console</span>
      </div>
      <div style="color: #6a9955;">// コンソール出力がここに表示されます</div>
      <div style="color: #569cd6; margin-top: 8px;">> システム初期化完了</div>
      <div style="color: #ce9178; margin-top: 4px;">> Golden Layout V2.6.0: 読み込み完了</div>
      <div style="color: #dcdcaa; margin-top: 4px;">> フェーズ5基盤: ✅ 100%完了</div>
      <div style="color: #4fd1c7; margin-top: 4px;">> 🎯 フェーズ6開始: Tweakpane GUI統合</div>
      <div style="color: #f0db4f; margin-top: 4px;">> TweakpaneGUI: 初期化完了</div>
    </div>
  `;
} 