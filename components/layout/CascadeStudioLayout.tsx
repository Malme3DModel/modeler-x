'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_LAYOUT_CONFIG } from '../../lib/layout/cascadeLayoutConfig';
import { useCADWorker } from '../../hooks/useCADWorker';

// Golden Layout CSS
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

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
  
  // CADWorkerの初期化
  const cadWorkerState = useCADWorker();

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

        // 新しいレイアウト作成 (V2では最初にcontainerのみを渡す)
        if (!containerRef.current) {
          throw new Error('Container element not found');
        }
        layoutRef.current = new GoldenLayout(containerRef.current);

        // Embedding via Events (V2の新しい方法)
        layoutRef.current.bindComponentEvent = (container: any, itemConfig: any) => {
          const componentType = itemConfig.componentType;
          const component = createComponent(componentType, container, itemConfig);
          return {
            component,
            virtual: false, // Embedding方式
          };
        };

        layoutRef.current.unbindComponentEvent = (container: any) => {
          // コンポーネントのクリーンアップ
          destroyComponent(container);
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
  }, [cadWorkerState]);

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
}

// Embedding via Events用のコンポーネント作成関数
function createComponent(componentType: string, container: any, itemConfig: any) {
  switch (componentType) {
    case 'codeEditor':
      return createCodeEditorComponent(container, itemConfig);
    case 'cascadeView':
      return createCascadeViewComponent(container, itemConfig);
    case 'console':
      return createConsoleComponent(container, itemConfig);
    default:
      throw new Error(`Unknown component type: ${componentType}`);
  }
}

function createCodeEditorComponent(container: any, itemConfig: any) {
  const editorContainer = document.createElement('div');
  editorContainer.style.height = '100%';
  editorContainer.style.backgroundColor = '#1e1e1e';
  editorContainer.innerHTML = `
    <div style="padding: 20px; color: #d4d4d4; font-family: 'Consolas', monospace;">
      <h3 style="color: #569cd6; margin-bottom: 16px;">🖥️ Monaco Editor</h3>
      <p style="margin-bottom: 12px;">CascadeStudio風エディターを準備中...</p>
      <p style="font-size: 14px; color: #6a9955;">// TypeScript Intellisense対応</p>
      <div style="margin-top: 20px; padding: 16px; background-color: #252526; border-radius: 4px;">
        <code style="color: #ce9178;">${itemConfig.componentState?.code || '// コードをここに入力してください'}</code>
      </div>
    </div>
  `;
  container.element.appendChild(editorContainer);
  return { destroy: () => editorContainer.remove() };
}

function createCascadeViewComponent(container: any, itemConfig: any) {
  const viewContainer = document.createElement('div');
  viewContainer.style.height = '100%';
  viewContainer.style.position = 'relative';
  viewContainer.style.backgroundColor = '#2d3748';
  
  // フローティングGUIコンテナ追加
  const floatingGUIContainer = document.createElement('div');
  floatingGUIContainer.className = 'gui-panel';
  floatingGUIContainer.id = 'guiPanel';
  floatingGUIContainer.style.position = 'absolute';
  floatingGUIContainer.style.top = '16px';
  floatingGUIContainer.style.right = '16px';
  floatingGUIContainer.style.zIndex = '1000';
  floatingGUIContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
  floatingGUIContainer.style.padding = '16px';
  floatingGUIContainer.style.borderRadius = '8px';
  floatingGUIContainer.style.color = 'white';
  floatingGUIContainer.innerHTML = `
    <h4 style="margin: 0 0 12px 0; color: #4fd1c7;">🎛️ Tweakpane GUI</h4>
    <p style="margin: 0; font-size: 14px;">フローティングGUI準備中...</p>
  `;
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
  return { destroy: () => viewContainer.remove() };
}

function createConsoleComponent(container: any, itemConfig: any) {
  const consoleContainer = document.createElement('div');
  consoleContainer.style.height = '100%';
  consoleContainer.style.overflow = 'auto';
  consoleContainer.style.backgroundColor = '#1e1e1e';
  consoleContainer.style.boxShadow = 'inset 0px 0px 3px rgba(0,0,0,0.75)';
  consoleContainer.style.fontFamily = 'Consolas, monospace';
  consoleContainer.style.fontSize = '14px';
  consoleContainer.style.padding = '12px';
  consoleContainer.style.color = '#d4d4d4';
  
  consoleContainer.innerHTML = `
    <div style="border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 8px;">
      <span style="color: #4fc1ff;">🖥️ CascadeStudio Console</span>
    </div>
    <div style="color: #6a9955;">// コンソール出力がここに表示されます</div>
    <div style="color: #569cd6; margin-top: 8px;">> システム初期化完了</div>
    <div style="color: #ce9178; margin-top: 4px;">> WebWorker: 接続中...</div>
  `;
  
  container.element.appendChild(consoleContainer);
  return { destroy: () => consoleContainer.remove() };
}

// コンポーネント破棄関数
function destroyComponent(container: any) {
  // Embedding方式では、コンポーネントのHTMLは自動的にクリーンアップされる
  console.log('Component destroyed:', container);
} 