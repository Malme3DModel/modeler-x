import React, { useState } from 'react';
import { useVSDarkTheme } from '@/context/ThemeContext';

interface HeaderProps {
  onSaveProject: () => void;
  onLoadProject?: () => void;
  onSaveSTEP?: () => void;
  onSaveSTL?: () => void;
  onSaveOBJ?: () => void;
}

// アイコンコンポーネント（SVG）
const SaveIcon = ({ className = "w-4 h-4", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const LoadIcon = ({ className = "w-4 h-4", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const ExportIcon = ({ className = "w-4 h-4", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StatusIcon = ({ className = "w-3 h-3", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 8 8" style={style}>
    <circle cx="4" cy="4" r="3" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4", style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={style}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { headerStyle, colors, getComponentStyles } = useVSDarkTheme();

  return (
    <div 
      className="flex items-center justify-between h-8 px-3 border-b"
      style={headerStyle}
    >
      {/* 左側: アプリケーション名 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-sm flex items-center justify-center">
            <span className="text-xs font-bold">X</span>
          </div>
          <span className="font-medium">Modeler X</span>
        </div>

        {/* メニューボタン群 */}
        <div className="flex items-center space-x-1">
          {/* File メニューグループ */}
          <div className="flex items-center space-x-0.5">
            <button 
              onClick={onSaveProject}
              className="flex items-center space-x-1.5 px-2 py-1 rounded transition-colors duration-150 group"
              style={{
                ...getComponentStyles('button'),
                backgroundColor: 'transparent',
                color: colors.foreground,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.dropdownHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Save Project (.json)"
            >
              <SaveIcon className="w-3.5 h-3.5 group-hover:opacity-100 transition-opacity" />
              <span className="text-xs">Save</span>
            </button>
            
            {onLoadProject && (
              <button 
                onClick={onLoadProject}
                className="flex items-center space-x-1.5 px-2 py-1 rounded transition-colors duration-150 group"
                style={{
                  ...getComponentStyles('button'),
                  backgroundColor: 'transparent',
                  color: colors.foreground,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.dropdownHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Load Project (.json)"
              >
                <LoadIcon className="w-3.5 h-3.5 group-hover:opacity-100 transition-opacity"/>
                <span className="text-xs">Load</span>
              </button>
            )}
          </div>

          {/* Export メニューグループ */}
          {(onSaveSTEP || onSaveSTL || onSaveOBJ) && (
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-1 px-2 py-1 rounded transition-colors duration-150 group"
                style={{
                  ...getComponentStyles('button'),
                  backgroundColor: 'transparent',
                  color: colors.foreground,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.dropdownHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Export Options"
              >
                <ExportIcon className="w-3.5 h-3.5 group-hover:opacity-100 transition-opacity"/>
                <span className="text-xs">Export</span>
                <ChevronDownIcon className="w-3 h-3 group-hover:opacity-100 transition-all duration-150"/>
              </button>

              {/* ドロップダウンメニュー */}
              {showExportMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 border rounded shadow-lg min-w-[120px] z-50"
                  style={getComponentStyles('dropdown')}
                >
                  {onSaveSTEP && (
                    <button
                      onClick={() => {
                        onSaveSTEP();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-left transition-colors duration-150"
                      style={{
                        backgroundColor: 'transparent',
                        color: colors.foreground,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.dropdownHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>●</span>
                      <span>STEP Format</span>
                    </button>
                  )}
                  {onSaveSTL && (
                    <button
                      onClick={() => {
                        onSaveSTL();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-left transition-colors duration-150"
                      style={{
                        backgroundColor: 'transparent',
                        color: colors.foreground,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.dropdownHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>●</span>
                      <span>STL Format</span>
                    </button>
                  )}
                  {onSaveOBJ && (
                    <button
                      onClick={() => {
                        onSaveOBJ();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-left transition-colors duration-150"
                      style={{
                        backgroundColor: 'transparent',
                        color: colors.foreground,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.dropdownHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>●</span>
                      <span>OBJ Format</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ドロップダウンメニューのクリック外しの処理 */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default Header; 