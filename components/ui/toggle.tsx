import React, { ButtonHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Toggle({
  pressed,
  onPressedChange,
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ToggleProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none';
  
  const stateClasses = pressed
    ? 'bg-blue-100 text-blue-900 border-blue-200 border'
    : 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-100';
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const combinedClasses = `${baseClasses} ${stateClasses} ${sizeClasses[size]} ${disabledClasses} ${className}`;
  
  return (
    <button
      type="button"
      data-state={pressed ? 'on' : 'off'}
      className={combinedClasses}
      onClick={() => !disabled && onPressedChange(!pressed)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 