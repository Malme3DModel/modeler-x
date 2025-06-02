'use client';

import React, { useCallback } from 'react';

interface CADButtonProps {
  name: string;
  onClick: (name: string) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
}

export default function CADButton({
  name,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'sm',
  icon,
  loading = false
}: CADButtonProps) {
  
  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      onClick(name);
    }
  }, [name, onClick, disabled, loading]);

  // バリアントに応じたクラス
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'accent':
        return 'btn-accent';
      case 'ghost':
        return 'btn-ghost';
      case 'outline':
        return 'btn-outline';
      default:
        return 'btn-primary';
    }
  };

  // サイズに応じたクラス
  const getSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'btn-xs';
      case 'sm':
        return 'btn-sm';
      case 'md':
        return 'btn-md';
      case 'lg':
        return 'btn-lg';
      default:
        return 'btn-sm';
    }
  };

  return (
    <button
      className={`btn ${getVariantClass()} ${getSizeClass()} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={`${name}ボタン`}
    >
      {loading && (
        <span className="loading loading-spinner loading-xs"></span>
      )}
      {icon && !loading && (
        <span className="text-base">{icon}</span>
      )}
      <span>{name}</span>
    </button>
  );
} 