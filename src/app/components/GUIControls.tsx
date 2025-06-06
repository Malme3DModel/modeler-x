'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CascadeStudioCore } from '../lib/CascadeStudioCore';

interface GUIControl {
  type: 'slider' | 'checkbox' | 'textInput' | 'dropdown';
  name: string;
  value: any;
  min?: number;
  max?: number;
  options?: string[];
  realTime?: boolean;
}

interface GUIControlsProps {
  cascadeCore: CascadeStudioCore | null;
  onControlChange?: (name: string, value: any) => void;
}

const GUIControls: React.FC<GUIControlsProps> = ({ cascadeCore, onControlChange }) => {
  const [controls, setControls] = useState<Map<string, GUIControl>>(new Map());
  const [isVisible, setIsVisible] = useState(true);

  // GUI更新イベントリスナー
  useEffect(() => {
    const handleGUIUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      setControls(prev => {
        const newControls = new Map(prev);
        newControls.set(data.name, {
          type,
          ...data
        });
        return newControls;
      });
    };

    window.addEventListener('cascadeGUIUpdate', handleGUIUpdate as EventListener);

    return () => {
      window.removeEventListener('cascadeGUIUpdate', handleGUIUpdate as EventListener);
    };
  }, []);

  // コントロール値の変更ハンドラー
  const handleControlChange = useCallback((name: string, value: any, realTime: boolean = false) => {
    if (cascadeCore) {
      cascadeCore.updateGUIState(name, value);
    }
    
    // 親コンポーネントに通知
    if (onControlChange) {
      onControlChange(name, value);
    }

    // コントロールの状態を更新
    setControls(prev => {
      const newControls = new Map(prev);
      const control = newControls.get(name);
      if (control) {
        newControls.set(name, { ...control, value });
      }
      return newControls;
    });

    // リアルタイム更新が有効な場合は即座にコード再実行
    if (realTime && cascadeCore) {
      // 親コンポーネントでコード再実行を行う
      const event = new CustomEvent('cascadeRealTimeUpdate', {
        detail: { name, value }
      });
      window.dispatchEvent(event);
    }
  }, [cascadeCore, onControlChange]);

  // Sliderコンポーネント
  const SliderControl: React.FC<{ control: GUIControl }> = ({ control }) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {control.name}: {control.value}
      </label>
              <input
          type="range"
          min={control.min || 0}
          max={control.max || 100}
          step="0.1"
          value={control.value || 0}
          onChange={(e) => handleControlChange(control.name, parseFloat(e.target.value), control.realTime)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          title={`${control.name} slider control`}
          aria-label={`${control.name} slider control`}
        />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{control.min || 0}</span>
        <span>{control.max || 100}</span>
      </div>
    </div>
  );

  // Checkboxコンポーネント
  const CheckboxControl: React.FC<{ control: GUIControl }> = ({ control }) => (
    <div className="mb-3">
      <label className="flex items-center text-sm text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={control.value || false}
          onChange={(e) => handleControlChange(control.name, e.target.checked, control.realTime)}
          className="mr-2 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        {control.name}
      </label>
    </div>
  );

  // TextInputコンポーネント
  const TextInputControl: React.FC<{ control: GUIControl }> = ({ control }) => {
    const [localValue, setLocalValue] = useState(control.value || '');

    const handleChange = (value: string) => {
      setLocalValue(value);
      if (control.realTime) {
        handleControlChange(control.name, value, true);
      }
    };

    const handleBlur = () => {
      if (!control.realTime) {
        handleControlChange(control.name, localValue, false);
      }
    };

    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {control.name}
        </label>
        <input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleBlur();
            }
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${control.name}...`}
        />
      </div>
    );
  };

  // Dropdownコンポーネント
  const DropdownControl: React.FC<{ control: GUIControl }> = ({ control }) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {control.name}
      </label>
      <select
        value={control.value || ''}
        onChange={(e) => handleControlChange(control.name, e.target.value, control.realTime)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={`${control.name} dropdown control`}
        aria-label={`${control.name} dropdown control`}
      >
        {control.options?.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  // コントロールをレンダリング
  const renderControl = (control: GUIControl) => {
    switch (control.type) {
      case 'slider':
        return <SliderControl key={control.name} control={control} />;
      case 'checkbox':
        return <CheckboxControl key={control.name} control={control} />;
      case 'textInput':
        return <TextInputControl key={control.name} control={control} />;
      case 'dropdown':
        return <DropdownControl key={control.name} control={control} />;
      default:
        return null;
    }
  };

  const controlsList = Array.from(controls.values());

  if (controlsList.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-10 w-64">
      <div className="bg-gray-800 bg-opacity-95 rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">Parameters</h3>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
        
        {isVisible && (
          <div className="p-3 max-h-96 overflow-y-auto">
            {controlsList.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                No parameters available
              </p>
            ) : (
              controlsList.map(control => renderControl(control))
            )}
            
            {/* リセットボタン */}
            {controlsList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700">
                <button
                  onClick={() => {
                    // すべてのコントロールをデフォルト値にリセット
                    const event = new CustomEvent('cascadeResetParameters');
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors"
                >
                  Reset Parameters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GUIControls; 