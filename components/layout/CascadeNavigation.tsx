'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavigationProps {
  onExport?: (format: 'step' | 'stl' | 'obj') => void;
  onNewProject?: () => void;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onImportFiles?: () => void;
  onClearImported?: () => void;
}

interface DropdownMenuProps {
  label: string;
  items: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }[];
}

// ドロップダウンメニューコンポーネント
function DropdownMenu({ label, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="px-3 py-1 hover:bg-gray-800 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      {isOpen && (
        <div 
          className="absolute left-0 mt-1 bg-gray-800 rounded-md shadow-lg z-50 min-w-[120px]"
          onMouseLeave={() => setIsOpen(false)}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-700 ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CascadeNavigation({
  onExport,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onImportFiles,
  onClearImported
}: NavigationProps) {
  // ファイル入力参照
  const handleFileImport = () => {
    if (onImportFiles) {
      onImportFiles();
    } else {
      // デフォルト：隠しファイル入力をクリック
      document.getElementById('fileInput')?.click();
    }
  };

  return (
    <nav className="flex items-center justify-between p-2 bg-gray-900 text-white shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold mr-4">Cascade Studio</h1>
        
        {/* ファイルメニュー */}
        <DropdownMenu
          label="File"
          items={[
            { label: 'New Project', onClick: onNewProject || (() => console.log('New Project')) },
            { label: 'Save Project', onClick: onSaveProject || (() => console.log('Save Project')) },
            { label: 'Load Project', onClick: onLoadProject || (() => console.log('Load Project')) },
            { label: 'Import STEP/IGES/STL', onClick: handleFileImport }
          ]}
        />
        
        {/* エクスポートメニュー */}
        <DropdownMenu
          label="Export"
          items={[
            { 
              label: 'Export STEP', 
              onClick: () => onExport ? onExport('step') : console.log('Export STEP') 
            },
            { 
              label: 'Export STL', 
              onClick: () => onExport ? onExport('stl') : console.log('Export STL') 
            },
            { 
              label: 'Export OBJ', 
              onClick: () => onExport ? onExport('obj') : console.log('Export OBJ') 
            }
          ]}
        />
        
        {/* 編集メニュー */}
        <DropdownMenu
          label="Edit"
          items={[
            { label: 'Clear Imported Files', onClick: onClearImported || (() => console.log('Clear Imported')) }
          ]}
        />
        
        {/* ヘルプメニュー */}
        <DropdownMenu
          label="Help"
          items={[
            { 
              label: 'Documentation', 
              onClick: () => window.open('https://github.com/zalo/CascadeStudio', '_blank') 
            },
            { 
              label: 'About', 
              onClick: () => alert('CascadeStudio - A Full Live-Scripted CAD Kernel in the Browser') 
            }
          ]}
        />
      </div>
      
      {/* バージョン表示 */}
      <div className="text-sm text-gray-400">v1.0.0</div>
      
      {/* 隠しファイル入力 */}
      <input
        id="fileInput"
        type="file"
        accept=".step,.stp,.iges,.igs,.stl"
        multiple
        style={{ display: 'none' }}
        title="Import STEP/IGES/STL files"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            console.log('Files selected:', e.target.files);
            // onImportFilesが指定されていれば、選択されたファイルを渡す
            if (onImportFiles) {
              onImportFiles();
            }
          }
        }}
      />
    </nav>
  );
} 