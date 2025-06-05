import React from 'react';

interface TransformModeIndicatorProps {
  mode: 'translate' | 'rotate' | 'scale';
  visible: boolean;
}

export function TransformModeIndicator({ mode, visible }: TransformModeIndicatorProps) {
  if (!visible) return null;

  const modeLabels = {
    translate: '移動 (G)',
    rotate: '回転 (R)', 
    scale: 'スケール (S)'
  };

  const modeColors = {
    translate: 'bg-blue-500',
    rotate: 'bg-green-500',
    scale: 'bg-orange-500'
  };

  return (
    <div className={`absolute top-4 left-4 z-50 px-3 py-1 rounded text-white text-sm font-medium ${modeColors[mode]}`}>
      {modeLabels[mode]}
    </div>
  );
}
