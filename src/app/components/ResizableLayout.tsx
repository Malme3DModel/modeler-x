'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightTopPanel: React.ReactNode;
  rightBottomPanel: React.ReactNode;
  leftPanelMinSize?: number;
  rightPanelMinSize?: number;
  consoleMinSize?: number;
  defaultLeftWidth?: number;
  defaultConsoleHeight?: number;
  editorTitle?: string;
}

// シンプルな分割レイアウトコンポーネント
const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  rightTopPanel,
  rightBottomPanel,
  leftPanelMinSize = 200,
  rightPanelMinSize = 200,
  consoleMinSize = 100,
  defaultLeftWidth = 50,
  defaultConsoleHeight = 30,
}) => {
  // 左パネルの幅（%）
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  // コンソールの高さ（%）
  const [consoleHeight, setConsoleHeight] = useState(defaultConsoleHeight);
  
  // 水平リサイズ用の状態
  const [isHResizing, setIsHResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startLeftWidth, setStartLeftWidth] = useState(defaultLeftWidth);
  
  // 垂直リサイズ用の状態
  const [isVResizing, setIsVResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startConsoleHeight, setStartConsoleHeight] = useState(defaultConsoleHeight);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 水平方向リサイズ開始ハンドラー
  const startHResize = (e: React.MouseEvent) => {
    setIsHResizing(true);
    setStartX(e.clientX);
    setStartLeftWidth(leftWidth);
    e.preventDefault();
  };
  
  // 垂直方向リサイズ開始ハンドラー
  const startVResize = (e: React.MouseEvent) => {
    setIsVResizing(true);
    setStartY(e.clientY);
    setStartConsoleHeight(consoleHeight);
    e.preventDefault();
  };
  
  // マウス移動ハンドラー
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isHResizing && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const dx = e.clientX - startX;
        let newLeftWidth = startLeftWidth + (dx / containerWidth) * 100;
        
        // 最小幅を確保
        const minLeftPercent = (leftPanelMinSize / containerWidth) * 100;
        const minRightPercent = (rightPanelMinSize / containerWidth) * 100;
        
        newLeftWidth = Math.max(minLeftPercent, Math.min(100 - minRightPercent, newLeftWidth));
        
        setLeftWidth(newLeftWidth);
      }
      
      if (isVResizing && containerRef.current) {
        const rightSide = containerRef.current.querySelector('.right-panel') as HTMLElement;
        if (rightSide) {
          const containerHeight = rightSide.offsetHeight;
          const dy = e.clientY - startY;
          let newConsoleHeight = startConsoleHeight - (dy / containerHeight) * 100;
          
          // 最小高さを確保
          const minConsolePercent = (consoleMinSize / containerHeight) * 100;
          
          newConsoleHeight = Math.max(minConsolePercent, Math.min(80, newConsoleHeight));
          
          setConsoleHeight(newConsoleHeight);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsHResizing(false);
      setIsVResizing(false);
    };
    
    if (isHResizing || isVResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHResizing, isVResizing, startX, startY, startLeftWidth, startConsoleHeight, leftPanelMinSize, rightPanelMinSize, consoleMinSize]);
  
  return (
    <div className="flex flex-1 h-full" ref={containerRef}>
      {/* 左側パネル (コードエディタ) */}
      <div 
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>
      
      {/* 水平リサイザー */}
      <div 
        className="w-1 bg-gray-800 hover:bg-blue-500 cursor-col-resize relative z-10"
        onMouseDown={startHResize}
      >
        {isHResizing && (
          <div className="fixed inset-0 z-50" />
        )}
      </div>
      
      {/* 右側パネル (分割表示) */}
      <div 
        className="h-full flex flex-col right-panel"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {/* 上部 - 3Dビュー */}
        <div 
          className="overflow-hidden"
          style={{ height: `${100 - consoleHeight}%` }}
        >
          {rightTopPanel}
        </div>
        
        {/* 垂直リサイザー */}
        <div 
          className="h-1 bg-gray-800 hover:bg-blue-500 cursor-row-resize relative z-10"
          onMouseDown={startVResize}
        >
          {isVResizing && (
            <div className="fixed inset-0 z-50" />
          )}
        </div>
        
        {/* 下部 - コンソール */}
        <div 
          className="overflow-auto"
          style={{ height: `${consoleHeight}%` }}
        >
          {rightBottomPanel}
        </div>
      </div>
    </div>
  );
};

export default ResizableLayout; 