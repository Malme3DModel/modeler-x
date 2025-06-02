'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface CADCheckboxProps {
  name: string;
  defaultValue: boolean;
  onChange: (name: string, value: boolean) => void;
  className?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  label?: string;
}

export default function CADCheckbox({
  name,
  defaultValue,
  onChange,
  className = '',
  disabled = false,
  size = 'sm',
  color = 'primary',
  label
}: CADCheckboxProps) {
  const [checked, setChecked] = useState(defaultValue);

  // チェック状態変更の処理
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setChecked(newValue);
    onChange(name, newValue);
  }, [name, onChange]);

  // 外部からの値変更に対応
  useEffect(() => {
    setChecked(defaultValue);
  }, [defaultValue]);

  // サイズに応じたクラス
  const getSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'checkbox-xs';
      case 'sm':
        return 'checkbox-sm';
      case 'md':
        return 'checkbox-md';
      case 'lg':
        return 'checkbox-lg';
      default:
        return 'checkbox-sm';
    }
  };

  // カラーに応じたクラス
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'checkbox-primary';
      case 'secondary':
        return 'checkbox-secondary';
      case 'accent':
        return 'checkbox-accent';
      case 'success':
        return 'checkbox-success';
      case 'warning':
        return 'checkbox-warning';
      case 'error':
        return 'checkbox-error';
      default:
        return 'checkbox-primary';
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={`checkbox ${getSizeClass()} ${getColorClass()}`}
          aria-label={label || name}
        />
        <span className="label-text text-sm font-medium">
          {label || name}
        </span>
        {checked && (
          <div className="badge badge-success badge-xs">ON</div>
        )}
      </label>
    </div>
  );
} 