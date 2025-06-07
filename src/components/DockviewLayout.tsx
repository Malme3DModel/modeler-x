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
    <div className="h-full w-full bg-modeler-background-secondary">
      <style jsx global>{`
        .dockview-theme-modeler {
          --dv-group-header-height: 26px;
          --dv-group-header-font-size: 12px;
          --dv-tabs-and-actions-container-font-size: 12px;
          --dv-drag-over-background-color: rgba(30, 144, 255, 0.1);
          --dv-paneview-header-background-color: var(--dv-dark-header-background);
          --dv-group-view-background-color: var(--dv-modeler-group-view-background-color);
          --dv-tabs-container-background-color: var(--dv-dark-header-background);
          --dv-activegroup-visiblepanel-tab-background-color: var(--dv-modeler-group-view-background-color);
          --dv-activegroup-visiblepanel-tab-color: var(--dv-dark-text-white);
          --dv-tab-background-color: var(--dv-dark-tab-background);
          --dv-tab-color: var(--dv-dark-tab-text);
          --dv-separator-border: 1px solid var(--dv-dark-border);
          --dv-tab-divider-color: var(--dv-dark-border);
        }
        
        /* Golden Layoutのスタイルを再現 */
        .dockview-theme-modeler .dv-default-tab {
          height: 26px;
          line-height: 26px;
          padding: 0 10px;
          border-right: 1px solid var(--dv-dark-border);
          font-size: 12px;
        }
        
        .dockview-theme-modeler .dv-default-tab.dv-active {
          background-color: var(--dv-modeler-group-view-background-color);
          color: var(--dv-dark-text-white);
          border-bottom: 1px solid var(--dv-modeler-group-view-background-color);
        }
        
        .dockview-theme-modeler .dv-default-tab:not(.dv-active):hover {
          background-color: var(--dv-dark-tab-hover);
        }
        
        .dockview-theme-modeler .tabs-and-actions-container {
          background-color: var(--dv-dark-header-background);
          border-bottom: 1px solid var(--dv-dark-border);
        }
        
        .dockview-theme-modeler .group-container {
          border: none;
          background-color: var(--dv-modeler-group-view-background-color);
        }
        
        /* タブのクローズボタン */
        .dockview-theme-modeler .dv-default-tab-action {
          display: none;
        }
        
        /* スプリッターのスタイル */
        .dockview-theme-modeler .split-view-view-separator {
          background-color: var(--dv-dark-border);
          width: 4px;
        }
        
        .dockview-theme-modeler .split-view-view-separator:hover {
          background-color: var(--color-accent-link);
        }
        
        /* 垂直スプリッター */
        .dockview-theme-modeler .split-view-container-vertical > .split-view-view-separator {
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
        className="dockview-theme-modeler h-full w-full"
        disableFloatingGroups={true}
      />
    </div>
  );
};

export default DockviewLayout; 