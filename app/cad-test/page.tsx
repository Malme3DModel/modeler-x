'use client';

import { useEffect } from 'react';
import CADTester from '@/components/cad/CADTester';
import CADViewport from '@/components/cad/CADViewport';
import { useCADWorker } from '@/hooks/useCADWorker';

export default function CADTestPage() {
  // 単一のuseCADWorkerインスタンスを作成
  const cadWorkerState = useCADWorker();

  useEffect(() => {
    console.log('🎯 [CADTestPage] Component mounted successfully');
    console.log('🎯 [CADTestPage] Current URL:', window.location.href);
    console.log('🎯 [CADTestPage] Current pathname:', window.location.pathname);
    console.log('🎯 [CADTestPage] CAD Worker state:', {
      isWorkerReady: cadWorkerState.isWorkerReady,
      shapesCount: cadWorkerState.shapes.length
    });
  }, [cadWorkerState.isWorkerReady, cadWorkerState.shapes.length]);

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-6">🛠️ CADエディター テスト環境</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 左側: CADコントロールパネル */}
          <div className="space-y-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-xl mb-4">🎮 CADコントロールパネル</h2>
                <CADTester cadWorkerState={cadWorkerState} />
              </div>
            </div>
          </div>
          
          {/* 右側: 3Dビューポート */}
          <div className="space-y-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-xl mb-4">🎨 3Dビューポート</h2>
                <CADViewport className="w-full h-96" cadWorkerState={cadWorkerState} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 