'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface GUIElement {
  type: 'slider' | 'button' | 'checkbox' | 'textInput' | 'dropdown';
  name: string;
  value: any;
  config: any;
}

interface GUIState {
  elements: Record<string, GUIElement>;
  values: Record<string, any>;
}

export function useGUIState() {
  const [guiState, setGUIState] = useState<GUIState>({
    elements: {},
    values: {}
  });
  
  const [isAutoUpdate, setIsAutoUpdate] = useState(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const onUpdateRef = useRef<((values: Record<string, any>) => void) | null>(null);

  // GUI要素の登録
  const registerElement = useCallback((
    type: GUIElement['type'],
    name: string,
    defaultValue: any,
    config: any = {}
  ) => {
    setGUIState(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [name]: { type, name, value: defaultValue, config }
      },
      values: {
        ...prev.values,
        [name]: defaultValue
      }
    }));
  }, []);

  // GUI要素の値更新
  const updateValue = useCallback((name: string, value: any) => {
    setGUIState(prev => {
      const newState = {
        ...prev,
        values: {
          ...prev.values,
          [name]: value
        }
      };

      // 要素の値も更新
      if (prev.elements[name]) {
        newState.elements = {
          ...prev.elements,
          [name]: {
            ...prev.elements[name],
            value
          }
        };
      }

      return newState;
    });

    // 自動更新が有効な場合、デバウンス付きで更新コールバックを実行
    if (isAutoUpdate && onUpdateRef.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        if (onUpdateRef.current) {
          setGUIState(current => {
            onUpdateRef.current!(current.values);
            return current;
          });
        }
      }, 300); // 300ms のデバウンス
    }
  }, [isAutoUpdate]);

  // 更新コールバックの設定
  const setOnUpdate = useCallback((callback: (values: Record<string, any>) => void) => {
    onUpdateRef.current = callback;
  }, []);

  // 手動更新の実行
  const triggerUpdate = useCallback(() => {
    if (onUpdateRef.current) {
      onUpdateRef.current(guiState.values);
    }
  }, [guiState.values]);

  // 全ての値をリセット
  const resetValues = useCallback(() => {
    setGUIState(prev => {
      const resetValues: Record<string, any> = {};
      const resetElements: Record<string, GUIElement> = {};

      Object.entries(prev.elements).forEach(([name, element]) => {
        const defaultValue = getDefaultValue(element.type, element.config);
        resetValues[name] = defaultValue;
        resetElements[name] = {
          ...element,
          value: defaultValue
        };
      });

      return {
        elements: resetElements,
        values: resetValues
      };
    });
  }, []);

  // 特定の値を取得
  const getValue = useCallback((name: string, defaultValue?: any) => {
    return guiState.values[name] ?? defaultValue;
  }, [guiState.values]);

  // CADコード生成用のヘルパー
  const generateCADCode = useCallback((template: string) => {
    let code = template;
    
    // テンプレート内の変数を置換
    Object.entries(guiState.values).forEach(([name, value]) => {
      const regex = new RegExp(`\\$\\{${name}\\}`, 'g');
      code = code.replace(regex, String(value));
    });

    return code;
  }, [guiState.values]);

  // 要素タイプに応じたデフォルト値
  const getDefaultValue = (type: GUIElement['type'], config: any) => {
    switch (type) {
      case 'slider':
        return config.defaultValue ?? config.min ?? 0;
      case 'checkbox':
        return config.defaultValue ?? false;
      case 'textInput':
        return config.defaultValue ?? '';
      case 'dropdown':
        return config.defaultValue ?? config.options?.[0] ?? '';
      case 'button':
        return false; // ボタンは状態を持たない
      default:
        return null;
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 状態
    elements: guiState.elements,
    values: guiState.values,
    isAutoUpdate,
    
    // アクション
    registerElement,
    updateValue,
    setOnUpdate,
    triggerUpdate,
    resetValues,
    getValue,
    generateCADCode,
    setIsAutoUpdate,
    
    // ヘルパー
    elementCount: Object.keys(guiState.elements).length,
    hasElements: Object.keys(guiState.elements).length > 0
  };
} 