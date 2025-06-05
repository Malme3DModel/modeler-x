import React, { useEffect } from 'react';

interface TransformModeControlsProps {
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
  onModeToggle: () => void;
}

export function TransformModeControls({ onModeChange, onModeToggle }: TransformModeControlsProps) {
  useEffect(() => {
    const handleTransformModeChange = (event: CustomEvent) => {
      onModeChange(event.detail.mode);
    };

    const handleTransformModeToggle = () => {
      onModeToggle();
    };

    document.addEventListener('transform-mode-change', handleTransformModeChange as EventListener);
    document.addEventListener('transform-mode-cycle', handleTransformModeToggle);

    return () => {
      document.removeEventListener('transform-mode-change', handleTransformModeChange as EventListener);
      document.removeEventListener('transform-mode-cycle', handleTransformModeToggle);
    };
  }, [onModeChange, onModeToggle]);

  return null;
}
