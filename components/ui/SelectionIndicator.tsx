import React from 'react';

interface SelectionIndicatorProps {
  selectedCount: number;
  visible: boolean;
}

export function SelectionIndicator({ selectedCount, visible }: SelectionIndicatorProps) {
  if (!visible || selectedCount === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-gray-800 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
      選択中: {selectedCount}個のオブジェクト
      {selectedCount > 1 && (
        <div className="text-xs text-gray-300 mt-1">
          Ctrl+クリックで複数選択
        </div>
      )}
    </div>
  );
}
