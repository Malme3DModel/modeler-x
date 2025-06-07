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

    // 初期レイアウトの設定（直接実行）
    try {
      // dockviewの設定 - apiを通じて直接レイアウトを調整
      const dockviewApi = event.api as any; // anyを使用して型エラーを回避
      if (dockviewApi.groups && dockviewApi.groups.length >= 2) {
        // パネル比率の設定は実装次第で異なる可能性があるため、エラーハンドリングで囲む
        try {
          // 左右のパネルの比率を調整（可能であれば）
          if (typeof dockviewApi.setSplitProportion === 'function') {
            dockviewApi.setSplitProportion(0, 0.6);
          }
          
          // 右側のパネル内でビューポートとコンソールの比率を調整
          const rightGroup = dockviewApi.groups.find((g: any) => 
            g.panels && g.panels.some((p: any) => p.id === 'viewport')
          );
          
          if (rightGroup) {
            const rightGroupIndex = dockviewApi.groups.indexOf(rightGroup);
            if (rightGroupIndex >= 0 && typeof dockviewApi.setSplitProportion === 'function') {
              dockviewApi.setSplitProportion(rightGroupIndex, 0.7);
            }
          }
        } catch (e) {
          console.warn('Split proportion adjustment not supported:', e);
        }
      }
    } catch (error) {
      console.error('Error setting initial layout proportions', error);
    }
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