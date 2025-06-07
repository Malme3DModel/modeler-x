'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
  themeAbyss,
  themeDark,
} from 'dockview';
import 'dockview/dist/styles/dockview.css';

interface DockviewLayoutProps {
  editorPanel: React.ReactNode;
  cadViewPanel: React.ReactNode;
  consolePanel: React.ReactNode;
  editorTitle?: string;
}

// パネルコンポーネントのラッパー
const EditorPanel: React.FC<IDockviewPanelProps> = (props) => {
  const content = (props.params as any)?.content;
  return <div className="h-full w-full flex flex-col overflow-hidden">{content}</div>;
};

const ViewportPanel: React.FC<IDockviewPanelProps> = (props) => {
  const content = (props.params as any)?.content;
   
  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden" 
      data-panel-type="viewport"
      style={{
        pointerEvents: 'auto',
        touchAction: 'auto',
        position: 'relative',
        zIndex: 1
      }}
    >
      {content}
    </div>
  );
};

const ConsolePanel: React.FC<IDockviewPanelProps> = (props) => {
  const content = (props.params as any)?.content;
  return <div className="h-full w-full flex flex-col overflow-auto">{content}</div>;
};

const DockviewLayout: React.FC<DockviewLayoutProps> = ({
  editorPanel,
  cadViewPanel,
  consolePanel,
  editorTitle = '* Untitled.ts',
}) => {
  const apiRef = useRef<DockviewApi | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // CADビューパネルを最初に追加（左側のアクティブパネル）
    event.api.addPanel({
      id: 'viewport',
      component: 'viewport',
      params: { content: cadViewPanel },
      title: 'CAD View',
    });

    // エディタパネルを同じグループに追加（左側の非アクティブパネル）
    event.api.addPanel({
      id: 'editor',
      component: 'editor',
      params: { content: editorPanel },
      title: editorTitle,
      position: { referencePanel: 'viewport', direction: 'within' },
    });

    // コンソールパネルを右側に追加
    event.api.addPanel({
      id: 'console',
      component: 'console',
      params: { content: consolePanel },
      title: 'Console',
      position: { referencePanel: 'viewport', direction: 'right' },
    });

    // 左右の比率を設定する関数
    const setLayoutProportions = () => {
      try {
        const viewportPanel = event.api.getPanel('viewport');
        const consolePanel = event.api.getPanel('console');
        
        if (viewportPanel && consolePanel && viewportPanel.group && consolePanel.group && containerRef.current) {
          // 全体の幅を取得
          const totalWidth = containerRef.current.clientWidth;
          const leftWidth = Math.floor(totalWidth * 0.7);
          const rightWidth = totalWidth - leftWidth;
          
          // 左側グループ（CADView + Editor）を70%に設定
          viewportPanel.group.api.setSize({ width: leftWidth });
          // 右側グループ（Console）を30%に設定
          consolePanel.group.api.setSize({ width: rightWidth });
        }
      } catch (error) {
        console.error('Error setting layout proportions:', error);
      }
    };

    // 初期レイアウトの設定
    setTimeout(() => {
      try {
        // CADViewをアクティブにする
        const viewportPanel = event.api.getPanel('viewport');
        if (viewportPanel) {
          viewportPanel.api.setActive();
        }

        // 比率を設定
        setLayoutProportions();
        
        // リサイズイベントリスナーを追加して比率を維持
        const resizeObserver = new ResizeObserver(() => {
          setLayoutProportions();
        });
        
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }
        
      } catch (error) {
        console.error('Error setting initial layout:', error);
      }
    }, 300); // レイアウトが完全に安定してから実行
  };

  // タイトルの更新
  useEffect(() => {
    if (apiRef.current) {
      const panel = apiRef.current.getPanel('editor');
      if (panel) {
        panel.api.setTitle(editorTitle);
      }
    }
  }, [editorTitle]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <DockviewReact
        onReady={onReady}
        components={{
          editor: EditorPanel,
          viewport: ViewportPanel,
          console: ConsolePanel,
        }}
        className="h-full w-full"
        theme={themeDark}
        disableFloatingGroups={true}
      />
    </div>
  );
};

export default DockviewLayout; 