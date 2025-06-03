'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CascadeGUIHandlers } from '@/lib/gui/cascadeGUIHandlers';
import { GUIState, TweakpaneProps } from '@/types/gui';

export default function TweakpaneGUI({ 
  onGUIUpdate,
  initialState = {},
  cadWorkerReady = false
}: TweakpaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState<any>(null);
  const [guiState, setGuiState] = useState<GUIState>({
    "Cache?": true,
    "MeshRes": 0.1,
    "GroundPlane?": true,
    "Grid?": true,
    ...initialState
  });
  const guiHandlersRef = useRef<CascadeGUIHandlers | null>(null);

  // Tweakpane動的インポート
  useEffect(() => {
    if (!paneRef.current) return;

    const initializeTweakpane = async () => {
      try {
        const { Pane } = await import('tweakpane');
        
        // 既存のパネルを破棄
        if (pane) {
          pane.dispose();
        }

        // 新しいパネル作成
        const newPane = new Pane({
          title: 'Cascade Control Panel',
          container: paneRef.current!,
          expanded: true
        });

        // CascadeStudio基本GUI要素を追加
        addBasicGUIElements(newPane);
        
        setPane(newPane);
        console.log('✅ [TweakpaneGUI] Tweakpane initialized successfully');

        // CascadeGUIHandlersの初期化
        const handlers = new CascadeGUIHandlers(newPane, guiState, handleGUIUpdate);
        guiHandlersRef.current = handlers;
        
        // グローバルハンドラーを登録（CascadeStudio互換）
        handlers.registerGlobalHandlers();
        console.log('✅ [TweakpaneGUI] CascadeGUIHandlers initialized');

        // STARTER_CODEを評価してDynamic GUIを生成するためのイベント発火
        if (cadWorkerReady) {
          console.log('✅ [TweakpaneGUI] CAD Worker ready, will evaluate code soon...');
          setTimeout(() => {
            // Evaluateボタンをクリックしてコードを実行
            console.log('🔄 [TweakpaneGUI] Auto-triggering Evaluate');
            onGUIUpdate?.(guiState);
          }, 1000);
        }

      } catch (error) {
        console.error('❌ [TweakpaneGUI] Failed to initialize Tweakpane:', error);
      }
    };

    initializeTweakpane();

    // クリーンアップ
    return () => {
      if (guiHandlersRef.current) {
        guiHandlersRef.current.unregisterGlobalHandlers();
      }
      if (pane) {
        pane.dispose();
      }
    };
  }, [cadWorkerReady]);

  // 基本GUI要素の追加
  const addBasicGUIElements = useCallback((pane: any) => {
    // Evaluate ボタン
    pane.addButton({
      title: 'Evaluate',
      label: '🔄 Evaluate'
    }).on('click', () => {
      console.log('🎯 [TweakpaneGUI] Evaluate button clicked');
      handleGUIUpdate(guiState);
    });

    // Mesh Resolution スライダー
    const meshResFolder = pane.addFolder({
      title: 'Mesh Settings'
    });

    meshResFolder.addInput(guiState, 'MeshRes', {
      min: 0.01,
      max: 1.0,
      step: 0.01,
      label: 'Resolution'
    }).on('change', (ev: any) => {
      updateGUIState('MeshRes', ev.value);
    });

    // Cache チェックボックス
    meshResFolder.addInput(guiState, 'Cache?', {
      label: 'Cache'
    }).on('change', (ev: any) => {
      updateGUIState('Cache?', ev.value);
    });

    // View Settings
    const viewFolder = pane.addFolder({
      title: 'View Settings'
    });

    viewFolder.addInput(guiState, 'GroundPlane?', {
      label: 'Ground Plane'
    }).on('change', (ev: any) => {
      updateGUIState('GroundPlane?', ev.value);
    });

    viewFolder.addInput(guiState, 'Grid?', {
      label: 'Grid'
    }).on('change', (ev: any) => {
      updateGUIState('Grid?', ev.value);
    });

    // Dynamic GUI Section (CascadeStudio互換)
    const dynamicFolder = pane.addFolder({
      title: 'Dynamic Controls',
      expanded: true
    });

    console.log('🎛️ [TweakpaneGUI] Basic GUI elements added');

  }, [guiState]);

  // GUI状態更新
  const updateGUIState = useCallback((key: string, value: any) => {
    setGuiState(prev => {
      const newState = { ...prev, [key]: value };
      return newState;
    });
  }, []);

  // GUI状態更新ハンドラー（親コンポーネントに通知）
  const handleGUIUpdate = useCallback((newState: GUIState) => {
    setGuiState(newState);
    onGUIUpdate?.(newState);
    console.log('🔄 [TweakpaneGUI] GUI state updated:', newState);
  }, [onGUIUpdate]);

  return (
    <div 
      className="tweakpane-container"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '280px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div ref={paneRef} />
      {!pane && (
        <div style={{ color: '#a0a0a0', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
          Tweakpane初期化中...
        </div>
      )}
    </div>
  );
} 