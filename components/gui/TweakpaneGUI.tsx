'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CascadeGUIHandlers } from '@/lib/gui/cascadeGUIHandlers';
import { GUIState, TweakpaneProps } from '@/types/gui';
import { URLStateManager } from '@/lib/layout/urlStateManager';

export default function TweakpaneGUI({ 
  onGUIUpdate,
  initialState = {},
  cadWorkerReady = false
}: TweakpaneProps) {
  const paneRef = useRef<HTMLDivElement>(null);
  const paneInstanceRef = useRef<any>(null);
  const [guiState, setGuiState] = useState<GUIState>(() => {
    // URLから読み込んだ状態とマージした初期状態を使用
    const defaultState: GUIState = {
      "Cache?": true,
      "MeshRes": 0.1,
      "GroundPlane?": true,
      "Grid?": true
    };
    
    // URLからの状態があれば、それをマージ
    try {
      const urlState = URLStateManager.getStateFromURL();
      if (urlState.guiState) {
        console.log('🔗 [TweakpaneGUI] URLからGUI状態を読み込みました:', urlState.guiState);
        return { ...defaultState, ...initialState, ...urlState.guiState };
      }
    } catch (error) {
      console.error('❌ [TweakpaneGUI] URL状態の読み込みに失敗:', error);
    }
    
    // デフォルト状態と初期状態をマージ
    return { ...defaultState, ...initialState };
  });
  const guiHandlersRef = useRef<CascadeGUIHandlers | null>(null);

  // Tweakpane動的インポート
  useEffect(() => {
    if (!paneRef.current) return;
    let isComponentMounted = true;

    const initializeTweakpane = async () => {
      try {
        // Tweakpane v4.0.1 用のインポート
        const tweakpane = await import('tweakpane');
        const { Pane } = tweakpane;
        
        // コンポーネントがアンマウントされていたら処理を中止
        if (!isComponentMounted || !paneRef.current) return;
        
        // 既存のパネルを破棄
        if (paneInstanceRef.current) {
          try {
            paneInstanceRef.current.dispose();
          } catch (disposeError) {
            console.warn('⚠️ [TweakpaneGUI] Error during pane disposal:', disposeError);
          }
          paneInstanceRef.current = null;
        }

        // 新しいパネル作成
        const newPane = new Pane({
          title: 'Cascade Control Panel',
          container: paneRef.current,
          expanded: true
        });

        // 参照を保存
        paneInstanceRef.current = newPane;

        // CascadeStudio基本GUI要素を追加
        addBasicGUIElements(newPane);
        
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
            if (isComponentMounted) {
              console.log('🔄 [TweakpaneGUI] Auto-triggering Evaluate');
              onGUIUpdate?.(guiState);
            }
          }, 1000);
        }

      } catch (error) {
        console.error('❌ [TweakpaneGUI] Failed to initialize Tweakpane:', error);
      }
    };

    initializeTweakpane();

    // クリーンアップ
    return () => {
      isComponentMounted = false;
      if (guiHandlersRef.current) {
        try {
          guiHandlersRef.current.unregisterGlobalHandlers();
        } catch (error) {
          console.warn('⚠️ [TweakpaneGUI] Error unregistering global handlers:', error);
        }
      }
      
      if (paneInstanceRef.current) {
        try {
          paneInstanceRef.current.dispose();
          paneInstanceRef.current = null;
        } catch (error) {
          console.warn('⚠️ [TweakpaneGUI] Error disposing pane on cleanup:', error);
        }
      }
    };
  }, [cadWorkerReady]);

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

  // 基本GUI要素の追加
  const addBasicGUIElements = useCallback((pane: any) => {
    if (!pane) return;
    
    try {
      // Evaluate ボタン
      pane.addButton({
        title: 'Evaluate',
        label: '🔄 Evaluate'
      }).on('click', () => {
        console.log('🎯 [TweakpaneGUI] Evaluate button clicked');
        handleGUIUpdate(guiState);
      });

      // Mesh Settings フォルダ
      const meshResFolder = pane.addFolder({
        title: 'Mesh Settings'
      });

      // Mesh Resolution スライダー
      meshResFolder.addBinding(guiState, 'MeshRes', {
        min: 0.01,
        max: 1.0,
        step: 0.01,
        label: 'Resolution'
      }).on('change', (ev: any) => {
        updateGUIState('MeshRes', ev.value);
      });

      // Cache チェックボックス
      meshResFolder.addBinding(guiState, 'Cache?', {
        label: 'Cache'
      }).on('change', (ev: any) => {
        updateGUIState('Cache?', ev.value);
      });

      // View Settings フォルダ
      const viewFolder = pane.addFolder({
        title: 'View Settings'
      });

      // Ground Plane チェックボックス
      viewFolder.addBinding(guiState, 'GroundPlane?', {
        label: 'Ground Plane'
      }).on('change', (ev: any) => {
        updateGUIState('GroundPlane?', ev.value);
      });

      // Grid チェックボックス
      viewFolder.addBinding(guiState, 'Grid?', {
        label: 'Grid'
      }).on('change', (ev: any) => {
        updateGUIState('Grid?', ev.value);
      });

      // プロジェクト管理フォルダ
      const projectFolder = pane.addFolder({
        title: 'Project',
        expanded: false
      });
      
      // Share URL ボタン
      projectFolder.addButton({
        title: 'Share URL',
      }).on('click', () => {
        try {
          // 現在のURLをクリップボードにコピー
          navigator.clipboard.writeText(window.location.href)
            .then(() => {
              console.log('🔗 [TweakpaneGUI] URL copied to clipboard');
              // URLコピー成功メッセージ
              alert('現在の状態を含むURLをクリップボードにコピーしました！');
            })
            .catch(err => {
              console.error('❌ [TweakpaneGUI] Failed to copy URL:', err);
              // 手動選択用にURLを表示
              prompt('以下のURLをコピーしてください:', window.location.href);
            });
        } catch (error) {
          console.error('❌ [TweakpaneGUI] URL sharing failed:', error);
          prompt('以下のURLをコピーしてください:', window.location.href);
        }
      });
      
      // Reset All ボタン
      projectFolder.addButton({
        title: 'Reset All',
      }).on('click', () => {
        if (confirm('すべての設定とコードをリセットしますか？')) {
          // URLハッシュをクリア
          window.location.hash = '';
          // ページを再読み込み
          window.location.reload();
        }
      });

      // Dynamic GUI Section (CascadeStudio互換)
      const dynamicFolder = pane.addFolder({
        title: 'Dynamic Controls',
        expanded: true
      });

      console.log('🎛️ [TweakpaneGUI] Basic GUI elements added');
    } catch (error) {
      console.error('❌ [TweakpaneGUI] Failed to add GUI elements:', error);
    }
  }, [guiState, handleGUIUpdate, updateGUIState]);

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
      {!paneInstanceRef.current && (
        <div style={{ color: '#a0a0a0', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
          Tweakpane初期化中...
        </div>
      )}
    </div>
  );
} 