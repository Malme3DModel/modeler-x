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
  leftPanel: React.ReactNode;
  rightTopPanel: React.ReactNode;
  rightBottomPanel: React.ReactNode;
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
  leftPanel,
  rightTopPanel,
  rightBottomPanel,
  editorTitle = '* Untitled.ts',
}) => {
  const apiRef = useRef<DockviewApi | null>(null);

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // CADビューパネルを最初に追加（左側のアクティブパネル）
    event.api.addPanel({
      id: 'viewport',
      component: 'viewport',
      params: { content: rightTopPanel },
      title: 'CAD View',
    });

    // エディタパネルを同じグループに追加（左側の非アクティブパネル）
    event.api.addPanel({
      id: 'editor',
      component: 'editor',
      params: { content: leftPanel },
      title: editorTitle,
      position: { referencePanel: 'viewport', direction: 'within' },
    });

    // コンソールパネルを右側に追加
    event.api.addPanel({
      id: 'console',
      component: 'console',
      params: { content: rightBottomPanel },
      title: 'Console',
      position: { referencePanel: 'viewport', direction: 'right' },
    });

    // 初期レイアウトの設定
    setTimeout(() => {
      try {
        // CADViewをアクティブにする
        const viewportPanel = event.api.getPanel('viewport');
        if (viewportPanel) {
          viewportPanel.api.setActive();
        }

        // 左右のパネル比率を調整（左側70%、右側30%）
        const groups = (event.api as any).groups;
        if (groups && groups.length >= 2) {
          // 左右の分割比率を設定
          const rootSplitview = (event.api as any).gridview?.root;
          if (rootSplitview && typeof rootSplitview.setViewSize === 'function') {
            try {
              // 左側のグループを70%に設定
              rootSplitview.setViewSize(0, rootSplitview.size * 0.7);
            } catch (e) {
              console.warn('Failed to set split proportion:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error setting initial layout:', error);
      }
    }, 100); // 少し遅延させてレイアウトが安定してから実行
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
    <div className="h-full w-full">
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