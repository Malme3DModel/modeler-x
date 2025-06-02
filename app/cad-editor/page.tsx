'use client';

import React from 'react';
import { useCADWorker } from '../../hooks/useCADWorker';
import CodeEditor from '../../components/cad/CodeEditor';
import CADViewport from '../../components/cad/CADViewport';

export default function CADEditorPage() {
  // 単一useCADWorkerインスタンス（フェーズ2で確立されたパターン）
  const cadWorkerState = useCADWorker();

  return (
    <div className="min-h-screen bg-base-100">
      {/* ヘッダー */}
      <header className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">🎯 CADエディター</h1>
              <div className="badge badge-secondary">Next.js + OpenCascade.js</div>
              <div className="badge badge-accent">TypeScript</div>
            </div>
            <div className="flex items-center gap-2">
              {/* ワーカー状態インジケーター */}
              <div className="flex items-center gap-2 text-sm">
                <span>WebWorker:</span>
                <div className={`w-3 h-3 rounded-full ${
                  cadWorkerState.isWorkerReady ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={cadWorkerState.isWorkerReady ? 'text-green-600' : 'text-red-600'}>
                  {cadWorkerState.isWorkerReady ? '準備完了' : '初期化中...'}
                </span>
              </div>
              {cadWorkerState.isWorking && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>処理中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* 左パネル: コードエディター */}
          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">
            <CodeEditor cadWorkerState={cadWorkerState} />
          </div>

          {/* 右パネル: 3Dビューポート */}
          <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">
            <div className="flex flex-col h-full">
              {/* 3Dビューポートヘッダー */}
              <div className="flex items-center justify-between p-4 bg-base-200 border-b border-base-300">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">🎨 3Dビューポート</h2>
                  <div className="badge badge-info">React Three Fiber</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <span>形状数: {cadWorkerState.shapes.length}</span>
                  {cadWorkerState.shapes.length > 0 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* 3Dビューポート */}
              <div className="flex-1 min-h-0">
                <CADViewport cadWorkerState={cadWorkerState} />
              </div>
            </div>
          </div>
        </div>

        {/* デバッグパネル（開発時のみ表示） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-base-200 rounded-lg p-4 border border-base-300">
            <details className="collapse collapse-arrow">
              <summary className="collapse-title text-lg font-medium">
                🔧 デバッグ情報
              </summary>
              <div className="collapse-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* ワーカー状態 */}
                  <div className="bg-base-100 p-3 rounded border">
                    <h4 className="font-semibold mb-2">ワーカー状態</h4>
                    <div className="text-sm space-y-1">
                      <div>準備完了: {cadWorkerState.isWorkerReady ? '✅' : '❌'}</div>
                      <div>処理中: {cadWorkerState.isWorking ? '🔄' : '⏸️'}</div>
                      <div>エラー: {cadWorkerState.error ? '❌' : '✅'}</div>
                    </div>
                  </div>

                  {/* 形状情報 */}
                  <div className="bg-base-100 p-3 rounded border">
                    <h4 className="font-semibold mb-2">形状情報</h4>
                    <div className="text-sm space-y-1">
                      <div>形状数: {cadWorkerState.shapes.length}</div>
                      {cadWorkerState.shapes.map((shape, index) => (
                        <div key={index} className="text-xs">
                          形状{index + 1}: {shape.mesh ? '✅ メッシュ' : '❌'} {shape.edges ? '✅ エッジ' : '❌'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ログ */}
                  <div className="bg-base-100 p-3 rounded border">
                    <h4 className="font-semibold mb-2">最新ログ</h4>
                    <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                      {cadWorkerState.logs.slice(-5).map((log, index) => (
                        <div key={index} className="text-base-content/70">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* エラー表示 */}
                {cadWorkerState.error && (
                  <div className="mt-4 alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{cadWorkerState.error}</span>
                    <button 
                      onClick={cadWorkerState.clearError}
                      className="btn btn-sm btn-ghost"
                    >
                      クリア
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-base-200 border-t border-base-300 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <div className="flex items-center gap-4">
              <span>🎯 CascadeStudio機能移行プロジェクト</span>
              <span>フェーズ3: Monaco Editor統合</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Next.js 14 + TypeScript + OpenCascade.js v1.1.1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 