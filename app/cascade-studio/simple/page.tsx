'use client';

import { useState, useEffect } from 'react';

export default function SimpleCascadeStudio() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('CascadeStudio基本ページを初期化中...');
  
  useEffect(() => {
    // 初期化処理をシミュレート
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage('CascadeStudio基本ページの読み込み完了！');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">CascadeStudio - 基本版</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
        <p className="text-xl mb-4">
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingMessage}
            </span>
          ) : (
            loadingMessage
          )}
        </p>
        
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">🖥️ コードエディター</h2>
              <div className="bg-gray-900 p-3 rounded font-mono text-sm h-40 overflow-auto">
                // CascadeStudio コード例
                let box = Box(10, 10, 10);
                Translate([0, 0, 0], box);
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">🎨 CADビューポート</h2>
              <div className="bg-gray-900 p-3 rounded h-40 flex items-center justify-center">
                <p>3Dビューポート領域</p>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg col-span-1 md:col-span-2">
              <h2 className="text-xl font-semibold mb-3">🎛️ GUI制御</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" htmlFor="width-slider">Width</label>
                  <input 
                    id="width-slider"
                    type="range" 
                    min="1" 
                    max="50" 
                    defaultValue="10" 
                    className="w-full" 
                    title="Width調整スライダー"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="height-slider">Height</label>
                  <input 
                    id="height-slider"
                    type="range" 
                    min="1" 
                    max="50" 
                    defaultValue="10" 
                    className="w-full"
                    title="Height調整スライダー"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="depth-slider">Depth</label>
                  <input 
                    id="depth-slider"
                    type="range" 
                    min="1" 
                    max="50" 
                    defaultValue="10" 
                    className="w-full"
                    title="Depth調整スライダー"
                  />
                </div>
                <div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                    🔄 Evaluate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            onClick={() => window.location.href = '/cascade-studio'}
          >
            👈 メインページに戻る
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-gray-400 text-sm">
        CascadeStudio完全コピープロジェクト - フェーズ6: GUI統合
      </div>
    </div>
  );
} 