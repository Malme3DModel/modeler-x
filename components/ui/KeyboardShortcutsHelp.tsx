import React from 'react';

interface KeyboardShortcutsHelpProps {
  visible: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ visible, onClose }: KeyboardShortcutsHelpProps) {
  if (!visible) return null;

  const shortcuts = [
    { category: 'Transform', key: 'G', description: '移動モード' },
    { category: 'Transform', key: 'R', description: '回転モード' },
    { category: 'Transform', key: 'S', description: 'スケールモード' },
    { category: 'Transform', key: 'Tab', description: 'モード切り替え' },
    { category: 'Camera', key: '1-7', description: 'カメラ視点切り替え' },
    { category: 'Camera', key: 'F', description: 'オブジェクトにフィット' },
    { category: 'Selection', key: 'Escape', description: '選択解除' },
    { category: 'Selection', key: 'Ctrl+Click', description: '複数選択' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">キーボードショートカット</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {['Transform', 'Camera', 'Selection'].map(category => (
            <div key={category}>
              <h3 className="font-medium text-sm text-gray-600 mb-2">{category}</h3>
              <div className="space-y-1">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {shortcut.key}
                      </span>
                      <span>{shortcut.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
