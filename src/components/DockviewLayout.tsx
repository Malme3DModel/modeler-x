'use client';

import React, { useEffect, useRef } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
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
  return <div className="h-full w-full flex flex-col overflow-hidden">{content}</div>;
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

    // エディタパネルを追加
    event.api.addPanel({
      id: 'editor',
      component: 'editor',
      params: { content: leftPanel },
      title: editorTitle,
    });

    // ビューポートパネルを追加
    event.api.addPanel({
      id: 'viewport',
      component: 'viewport',
      params: { content: rightTopPanel },
      title: 'CAD View',
      position: { referencePanel: 'editor', direction: 'right' },
    });

    // コンソールパネルを追加
    event.api.addPanel({
      id: 'console',
      component: 'console',
      params: { content: rightBottomPanel },
      title: 'Console',
      position: { referencePanel: 'viewport', direction: 'below' },
    });
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
    <div className="h-full w-full" style={{ backgroundColor: '#1e1e1e' }}>
      <style jsx global>{`
        .dockview-theme-dark {
          --dv-group-header-height: 26px;
          --dv-group-header-font-size: 12px;
          --dv-tabs-and-actions-container-font-size: 12px;
          --dv-drag-over-background-color: rgba(30, 144, 255, 0.1);
          --dv-paneview-header-background-color: #2d2d30;
          --dv-group-view-background-color: #1e1e1e;
          --dv-tabs-container-background-color: #2d2d30;
          --dv-activegroup-visiblepanel-tab-background-color: #1e1e1e;
          --dv-activegroup-visiblepanel-tab-color: #ffffff;
          --dv-tab-background-color: #2d2d30;
          --dv-tab-color: #969696;
          --dv-separator-border: 1px solid #464647;
          --dv-tab-divider-color: #464647;
        }
        
        /* Golden Layoutのスタイルを再現 */
        .dockview-theme-dark .dv-default-tab {
          height: 26px;
          line-height: 26px;
          padding: 0 10px;
          border-right: 1px solid #464647;
          font-size: 12px;
        }
        
        .dockview-theme-dark .dv-default-tab.dv-active {
          background-color: #1e1e1e;
          color: #ffffff;
          border-bottom: 1px solid #1e1e1e;
        }
        
        .dockview-theme-dark .dv-default-tab:not(.dv-active):hover {
          background-color: #3e3e42;
        }
        
        .dockview-theme-dark .tabs-and-actions-container {
          background-color: #2d2d30;
          border-bottom: 1px solid #464647;
        }
        
        .dockview-theme-dark .group-container {
          border: none;
          background-color: #1e1e1e;
        }
        
        /* タブのクローズボタン */
        .dockview-theme-dark .dv-default-tab-action {
          display: none;
        }
        
        /* スプリッターのスタイル */
        .dockview-theme-dark .split-view-view-separator {
          background-color: #464647;
          width: 4px;
        }
        
        .dockview-theme-dark .split-view-view-separator:hover {
          background-color: #007acc;
        }
        
        /* 垂直スプリッター */
        .dockview-theme-dark .split-view-container-vertical > .split-view-view-separator {
          height: 4px;
          width: 100%;
        }
      `}</style>
      <DockviewReact
        onReady={onReady}
        components={{
          editor: EditorPanel,
          viewport: ViewportPanel,
          console: ConsolePanel,
        }}
        className="dockview-theme-dark h-full w-full"
        disableFloatingGroups={true}
      />
    </div>
  );
};

export default DockviewLayout; 