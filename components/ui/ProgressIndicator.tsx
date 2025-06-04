'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import LoadingSpinner from './LoadingSpinner';

interface ProgressIndicatorProps {
  isVisible: boolean;
  progress?: number; // 0-100
  message?: string;
  isIndeterminate?: boolean;
  onCancel?: () => void;
}

/**
 * CAD処理の進行状況を表示するプログレスインジケーター
 */
export function ProgressIndicator({
  isVisible,
  progress = 0,
  message = 'Processing...',
  isIndeterminate = false,
  onCancel
}: ProgressIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // 経過時間の計測
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isVisible) {
      setElapsedTime(0);
      intervalId = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVisible]);
  
  // 表示形式
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 非表示の場合は何も表示しない
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">CAD処理実行中</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{formatTime(elapsedTime)}</span>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            {showDetails ? '詳細を隠す' : '詳細を表示'}
          </button>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">{message}</span>
          {!isIndeterminate && <span className="text-xs font-medium">{Math.round(progress)}%</span>}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          {isIndeterminate ? (
            <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full"></div>
          ) : (
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          )}
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="flex justify-between mb-1">
            <span>メモリ使用量:</span>
            <span>計測中...</span>
          </div>
          <div className="flex justify-between">
            <span>処理ステップ:</span>
            <span>{isIndeterminate ? '進行中...' : `${Math.round(progress)}% 完了`}</span>
          </div>
        </div>
      )}
      
      {onCancel && (
        <div className="mt-3 flex justify-end">
          <Button 
            onClick={onCancel}
            className="py-1 px-3 text-xs bg-red-500 hover:bg-red-600"
          >
            キャンセル
          </Button>
        </div>
      )}
    </div>
  );
} 