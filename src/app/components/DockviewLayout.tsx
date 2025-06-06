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
  return <div className="h-full w-full overflow-hidden">{content}</div>;
};

const ViewportPanel: React.FC<IDockviewPanelProps> = (props) => {
  const content = (props.params as any)?.content;
  return <div className="h-full w-full overflow-hidden">{content}</div>;
};

const ConsolePanel: React.FC<IDockviewPanelProps> = (props) => {
  const content = (props.params as any)?.content;
  return <div className="h-full w-full overflow-auto">{content}</div>;
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
          --dv-group-header-height: 30px;
          --dv-group-header-font-size: 13px;
          --dv-tabs-and-actions-container-font-size: 13px;
          --dv-drag-over-background-color: rgba(30, 144, 255, 0.1);
          --dv-paneview-header-background-color: #2b2b2b;
          --dv-group-view-background-color: #1e1e1e;
          --dv-tabs-container-background-color: #2b2b2b;
          --dv-activegroup-visiblepanel-tab-background-color: #1e1e1e;
          --dv-activegroup-visiblepanel-tab-color: #ffffff;
          --dv-tab-background-color: #2b2b2b;
          --dv-tab-color: #cccccc;
          --dv-separator-border: 1px solid #464647;
        }
        
        /* Golden Layoutのスタイルを再現 */
        .dockview-theme-dark .tab {
          border-radius: 0;
          border: none;
        }
        
        .dockview-theme-dark .tab-content {
          padding: 0 12px;
        }
        
        .dockview-theme-dark .group-container {
          border: 1px solid #464647;
        }
        
        /* パネルのサイズ調整 */
        .dockview-theme-dark .dv-default-tab {
          height: 30px;
          line-height: 30px;
        }
        
        /* スプリッターのスタイル */
        .dockview-theme-dark .split-view-view-separator {
          background-color: #464647;
        }
        
        .dockview-theme-dark .split-view-view-separator:hover {
          background-color: #007acc;
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