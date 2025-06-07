'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
  themeDark,
} from 'dockview';
import 'dockview/dist/styles/dockview.css';

interface DockviewLayoutProps {
  editorPanel: React.ReactNode;
  cadViewPanel: React.ReactNode;
  consolePanel: React.ReactNode;
  editorTitle?: string;
}

// パネル設定の定数
const LAYOUT_CONFIG = {
  LEFT_PANEL_RATIO: 0.7,
  RIGHT_PANEL_RATIO: 0.3,
  TOTAL_PANELS: 3,
  ANIMATION_FRAMES: 2,
} as const;

// パネルタイプの定義
type PanelType = 'viewport' | 'editor' | 'console';

interface PanelConfig {
  id: PanelType;
  component: string;
  title: string;
  position?: {
    referencePanel: string;
    direction: 'within' | 'right';
  };
}

// パネルコンポーネントのファクトリー関数
const createPanelComponent = (
  baseClassName: string = "h-full w-full flex flex-col overflow-hidden",
  additionalProps?: React.CSSProperties
) => {
  return React.memo<IDockviewPanelProps>(({ params }) => {
    const content = (params as { content?: React.ReactNode })?.content;
    
    return (
      <div 
        className={baseClassName}
        style={additionalProps}
        data-panel-initialized="true"
      >
        {content}
      </div>
    );
  });
};

// 最適化されたパネルコンポーネント
const EditorPanel = createPanelComponent();

const ViewportPanel = createPanelComponent(
  "h-full w-full flex flex-col overflow-hidden",
  {
    pointerEvents: 'auto',
    touchAction: 'auto',
    position: 'relative',
    zIndex: 1
  }
);

const ConsolePanel = createPanelComponent("h-full w-full flex flex-col overflow-auto");

const DockviewLayout: React.FC<DockviewLayoutProps> = ({
  editorPanel,
  cadViewPanel,
  consolePanel,
  editorTitle = '* Untitled.ts',
}) => {
  const apiRef = useRef<DockviewApi | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // パネル設定の定義（メモ化）
  const panelConfigs = useMemo<PanelConfig[]>(() => [
    {
      id: 'viewport',
      component: 'viewport',
      title: 'CAD View',
    },
    {
      id: 'editor',
      component: 'editor',
      title: editorTitle,
      position: { referencePanel: 'viewport', direction: 'within' },
    },
    {
      id: 'console',
      component: 'console',
      title: 'Console',
      position: { referencePanel: 'viewport', direction: 'right' },
    },
  ], [editorTitle]);

  // パネルコンテンツのマッピング（メモ化）
  const panelContentMap = useMemo(() => ({
    viewport: cadViewPanel,
    editor: editorPanel,
    console: consolePanel,
  }), [cadViewPanel, editorPanel, consolePanel]);

  // レイアウト比率設定関数（最適化・メモ化）
  const setLayoutProportions = useCallback(() => {
    if (!apiRef.current || !containerRef.current) return;

    try {
      const viewportPanel = apiRef.current.getPanel('viewport');
      const consolePanel = apiRef.current.getPanel('console');
      
      if (viewportPanel?.group && consolePanel?.group) {
        const totalWidth = containerRef.current.clientWidth;
        const leftWidth = Math.floor(totalWidth * LAYOUT_CONFIG.LEFT_PANEL_RATIO);
        const rightWidth = totalWidth - leftWidth;
        
        viewportPanel.group.api.setSize({ width: leftWidth });
        consolePanel.group.api.setSize({ width: rightWidth });
      }
    } catch (error) {
      console.error('Layout proportion error:', error);
    }
  }, []);

  // 初期化関数（最適化・メモ化）
  const initializeLayout = useCallback(() => {
    if (!apiRef.current) return;

    try {
      // アクティブパネル設定
      const viewportPanel = apiRef.current.getPanel('viewport');
      viewportPanel?.api.setActive();

      // リサイズオブザーバーの設定（重複防止）
      if (containerRef.current && !resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(setLayoutProportions);
        resizeObserverRef.current.observe(containerRef.current);
      }

      // 最適化されたアニメーションフレーム処理
      const setProportionsWithFrames = (framesLeft: number) => {
        if (framesLeft > 0) {
          requestAnimationFrame(() => setProportionsWithFrames(framesLeft - 1));
        } else {
          setLayoutProportions();
        }
      };
      
      setProportionsWithFrames(LAYOUT_CONFIG.ANIMATION_FRAMES);
      
    } catch (error) {
      console.error('Layout initialization error:', error);
    }
  }, [setLayoutProportions]);

  // パネル追加管理（最適化・メモ化）
  const createPanelTracker = useCallback(() => {
    let panelsAdded = 0;
    
    return () => {
      panelsAdded++;
      if (panelsAdded === LAYOUT_CONFIG.TOTAL_PANELS) {
        initializeLayout();
      }
    };
  }, [initializeLayout]);

  // Dockview準備完了ハンドラー（最適化・メモ化）
  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    const onPanelAdded = createPanelTracker();

    // パネルを効率的に追加
    panelConfigs.forEach((config) => {
      event.api.addPanel({
        id: config.id,
        component: config.component,
        params: { content: panelContentMap[config.id] },
        title: config.title,
        ...(config.position && { position: config.position }),
      });
      onPanelAdded();
    });
  }, [panelConfigs, panelContentMap, createPanelTracker]);

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);

  // タイトルの更新
  useEffect(() => {
    if (apiRef.current) {
      const panel = apiRef.current.getPanel('editor');
      if (panel) {
        panel.api.setTitle(editorTitle);
      }
    }
  }, [editorTitle]);

  // コンポーネントマップ（メモ化）
  const components = useMemo(() => ({
    editor: EditorPanel,
    viewport: ViewportPanel,
    console: ConsolePanel,
  }), []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <DockviewReact
        onReady={onReady}
        components={components}
        className="h-full w-full"
        theme={themeDark}
        disableFloatingGroups={true}
      />
    </div>
  );
};

export default DockviewLayout; 