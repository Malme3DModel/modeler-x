'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface CADSliderProps {
  name: string;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  onChange: (name: string, value: number) => void;
  className?: string;
  disabled?: boolean;
}

export default function CADSlider({
  name,
  defaultValue,
  min,
  max,
  step = 0.1,
  onChange,
  className = '',
  disabled = false
}: CADSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue.toString());

  // 値が変更されたときの処理
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    setInputValue(newValue.toString());
    onChange(name, newValue);
  }, [name, onChange]);

  // 数値入力の処理
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  // 数値入力の確定処理
  const handleInputBlur = useCallback(() => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setValue(newValue);
      onChange(name, newValue);
    } else {
      setInputValue(value.toString());
    }
    setIsEditing(false);
  }, [inputValue, min, max, value, name, onChange]);

  // Enterキーでの確定
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  }, [handleInputBlur, value]);

  // 外部からの値変更に対応
  useEffect(() => {
    setValue(defaultValue);
    setInputValue(defaultValue.toString());
  }, [defaultValue]);

  // 値の表示フォーマット
  const formatValue = (val: number): string => {
    if (step >= 1) {
      return val.toFixed(0);
    } else if (step >= 0.1) {
      return val.toFixed(1);
    } else {
      return val.toFixed(2);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ラベルと値表示 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-base-content">
          {name}
        </label>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="input input-xs input-bordered w-16 text-center"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              autoFocus
              aria-label={`${name}の値を入力`}
            />
          ) : (
            <button
              className="btn btn-ghost btn-xs min-h-0 h-6 px-2 text-xs font-mono"
              onClick={() => setIsEditing(true)}
              disabled={disabled}
            >
              {formatValue(value)}
            </button>
          )}
        </div>
      </div>

      {/* スライダー */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-base-content/50 w-8 text-right">
          {formatValue(min)}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="range range-primary range-sm flex-1"
          disabled={disabled}
          aria-label={`${name}スライダー`}
        />
        <span className="text-xs text-base-content/50 w-8">
          {formatValue(max)}
        </span>
      </div>

      {/* プログレスバー（視覚的フィードバック） */}
      <div className="w-full bg-base-300 rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-200"
          style={{
            width: `${((value - min) / (max - min)) * 100}%`
          }}
        ></div>
      </div>
    </div>
  );
} 