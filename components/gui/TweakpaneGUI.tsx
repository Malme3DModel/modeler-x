'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TweakpaneGUIProps {
  onGUIUpdate?: (guiState: Record<string, any>) => void;
  initialState?: Record<string, any>;
  cadWorkerReady?: boolean;
}

export default function TweakpaneGUI({ 
  onGUIUpdate,
  initialState = {},
  cadWorkerReady = false
}: TweakpaneGUIProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState<any>(null);
  const [guiState, setGuiState] = useState<Record<string, any>>({
    "Cache?": true,
    "MeshRes": 0.1,
    "GroundPlane?": true,
    "Grid?": true,
    ...initialState
  });

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

      } catch (error) {
        console.error('❌ [TweakpaneGUI] Failed to initialize Tweakpane:', error);
      }
    };

    initializeTweakpane();

    // クリーンアップ
    return () => {
      if (pane) {
        pane.dispose();
      }
    };
  }, []);

  // 基本GUI要素の追加
  const addBasicGUIElements = useCallback((pane: any) => {
    // Evaluate ボタン
    pane.addButton({
      title: 'Evaluate',
      label: '🔄 Evaluate'
    }).on('click', () => {
      console.log('🎯 [TweakpaneGUI] Evaluate button clicked');
      onGUIUpdate?.(guiState);
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

    // 動的GUI要素を追加するためのプレースホルダー
    // この部分は後でaddSlider, addButton等のメッセージハンドラーで動的に追加される
    console.log('🎛️ [TweakpaneGUI] Basic GUI elements added');

  }, [guiState, onGUIUpdate]);

  // GUI状態更新
  const updateGUIState = useCallback((key: string, value: any) => {
    setGuiState(prev => {
      const newState = { ...prev, [key]: value };
      onGUIUpdate?.(newState);
      return newState;
    });
  }, [onGUIUpdate]);

  // CascadeStudio互換のメッセージハンドラー
  const addSlider = useCallback((name: string, defaultValue: number, min: number, max: number, step?: number) => {
    if (!pane) return;

    const folder = pane.children.find((child: any) => child.title === 'Dynamic Controls');
    if (!folder) return;

    // GUI状態に追加
    const newGuiState = { ...guiState, [name]: defaultValue };
    setGuiState(newGuiState);

    // Tweakpaneスライダー追加
    folder.addInput(newGuiState, name, {
      min,
      max,
      step: step || 0.1,
      label: name
    }).on('change', (ev: any) => {
      updateGUIState(name, ev.value);
    });

    console.log(`🎛️ [TweakpaneGUI] Added slider: ${name} (${defaultValue}, ${min}-${max})`);
  }, [pane, guiState, updateGUIState]);

  const addButton = useCallback((name: string, callback?: () => void) => {
    if (!pane) return;

    const folder = pane.children.find((child: any) => child.title === 'Dynamic Controls');
    if (!folder) return;

    folder.addButton({
      title: name,
      label: name
    }).on('click', () => {
      console.log(`🎯 [TweakpaneGUI] Button clicked: ${name}`);
      callback?.();
    });

    console.log(`🎛️ [TweakpaneGUI] Added button: ${name}`);
  }, [pane]);

  const addCheckbox = useCallback((name: string, defaultValue: boolean = false) => {
    if (!pane) return;

    const folder = pane.children.find((child: any) => child.title === 'Dynamic Controls');
    if (!folder) return;

    // GUI状態に追加
    const newGuiState = { ...guiState, [name]: defaultValue };
    setGuiState(newGuiState);

    folder.addInput(newGuiState, name, {
      label: name
    }).on('change', (ev: any) => {
      updateGUIState(name, ev.value);
    });

    console.log(`🎛️ [TweakpaneGUI] Added checkbox: ${name} (${defaultValue})`);
  }, [pane, guiState, updateGUIState]);

  // 外部からアクセス可能な関数をwindowオブジェクトに追加（CascadeStudio互換）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addSlider = addSlider;
      (window as any).addButton = addButton;
      (window as any).addCheckbox = addCheckbox;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).addSlider;
        delete (window as any).addButton;
        delete (window as any).addCheckbox;
      }
    };
  }, [addSlider, addButton, addCheckbox]);

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