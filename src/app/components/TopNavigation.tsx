'use client';

import React, { useRef, useState } from 'react';

interface TopNavigationProps {
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onSaveSTEP?: () => void;
  onSaveSTL?: () => void;
  onSaveOBJ?: () => void;
  onLoadFiles?: (files: FileList) => void;
  onClearFiles?: () => void;
  version?: string;
  isWorking?: boolean;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ,
  onLoadFiles,
  onClearFiles,
  version = '0.0.7',
  isWorking = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onLoadFiles) {
      onLoadFiles(files);
    }
  };

  return (
    <nav className="bg-gray-900 text-white z-10">
      <div className="flex">
        {/* ロゴ */}
        <a
          href="https://github.com/zalo/CascadeStudio"
          className="text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cascade Studio {version} (Next.js)
        </a>
        
        {/* ファイルメニュー */}
        <div className="relative">
          <button
            className="text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-700"
            onClick={() => {
              setShowFileMenu(!showFileMenu);
              setShowExportMenu(false);
            }}
          >
            ファイル
          </button>
          {showFileMenu && (
            <div className="absolute left-0 mt-1 w-48 bg-gray-800 shadow-lg rounded border border-gray-600 z-20">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onSaveProject) {
                    onSaveProject();
                    setShowFileMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                プロジェクトを保存...
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onLoadProject) {
                    onLoadProject();
                    setShowFileMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                プロジェクトを開く...
              </button>
              <div className="border-t border-gray-600 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  handleFileClick();
                  setShowFileMenu(false);
                }}
                disabled={isWorking}
              >
                CADファイルをインポート...
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onClearFiles) {
                    onClearFiles();
                    setShowFileMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                インポートファイルをクリア
              </button>
            </div>
          )}
        </div>
        
        {/* エクスポートメニュー */}
        <div className="relative">
          <button
            className="text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-700"
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowFileMenu(false);
            }}
            disabled={isWorking}
          >
            エクスポート
          </button>
          {showExportMenu && (
            <div className="absolute left-0 mt-1 w-48 bg-gray-800 shadow-lg rounded border border-gray-600 z-20">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onSaveSTEP) {
                    onSaveSTEP();
                    setShowExportMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                STEPとして保存...
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onSaveSTL) {
                    onSaveSTL();
                    setShowExportMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                STLとして保存...
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 text-gray-200"
                onClick={() => {
                  if (onSaveOBJ) {
                    onSaveOBJ();
                    setShowExportMenu(false);
                  }
                }}
                disabled={isWorking}
              >
                OBJとして保存...
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".iges,.step,.igs,.stp,.stl"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-label="CADファイルをインポート"
          title="CADファイルをインポート"
        />
        
        {/* ステータス表示 */}
        {isWorking && (
          <div className="ml-auto flex items-center px-4">
            <div className="animate-spin h-4 w-4 border-t-2 border-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">処理中...</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavigation; 