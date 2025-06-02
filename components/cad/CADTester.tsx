'use client';

import { useState, useEffect } from 'react';
import { useCADWorker } from '@/hooks/useCADWorker';

interface CADTesterProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

export default function CADTester({ cadWorkerState }: CADTesterProps) {
  const { 
    isWorkerReady, 
    isWorking, 
    shapes, 
    logs, 
    error, 
    progress,
    executeCADCode, 
    combineAndRender,
    clearLogs,
    clearError
  } = cadWorkerState;

  const [code, setCode] = useState(`
// 基本的なCAD形状のテスト
const box = Box(10, 10, 10, true);
const sphere = Sphere(8);
const result = Difference(box, [sphere]);
return result;
  `.trim());

  useEffect(() => {
    console.log('🎮 [CADTester] Component mounted successfully');
    console.log('🎮 [CADTester] useCADWorker hook loaded:', { isWorkerReady, isWorking, shapes: shapes.length });
  }, []);

  useEffect(() => {
    console.log('🎮 [CADTester] Worker state changed:', { isWorkerReady, isWorking, shapesCount: shapes.length });
  }, [isWorkerReady, isWorking, shapes]);

  const handleExecute = async () => {
    try {
      await executeCADCode(code);
      // 実行後に形状を結合してレンダリング
      setTimeout(() => {
        combineAndRender();
      }, 100);
    } catch (err) {
      console.error('実行エラー:', err);
    }
  };

  const handleTestBasicShapes = () => {
    const testCode = `
// 基本形状のテスト
Box(5, 5, 5);
Sphere(3);
Cylinder(2, 8);
    `.trim();
    setCode(testCode);
  };

  const handleTestBooleanOps = () => {
    const testCode = `
// ブール演算のテスト
const box = Box(10, 10, 10, true);
const sphere = Sphere(8);
Difference(box, [sphere]);
    `.trim();
    setCode(testCode);
  };

  const handleTestTransforms = () => {
    const testCode = `
// 変形のテスト
const box = Box(5, 5, 5);
const translated = Translate([10, 0, 0], [box]);
const rotated = Rotate([0, 0, 1], 45, translated);
    `.trim();
    setCode(testCode);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">🛠️ CADワーカー動作テスト</h2>

          {/* ステータス表示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat bg-base-200 rounded">
              <div className="stat-title">ワーカー状態</div>
              <div className={`stat-value text-lg ${isWorkerReady ? 'text-success' : 'text-warning'}`}>
                {isWorkerReady ? '✅ 準備完了' : '⏳ 初期化中'}
              </div>
            </div>

            <div className="stat bg-base-200 rounded">
              <div className="stat-title">実行状態</div>
              <div className={`stat-value text-lg ${isWorking ? 'text-warning' : 'text-info'}`}>
                {isWorking ? '⚙️ 実行中' : '💤 待機中'}
              </div>
            </div>

            <div className="stat bg-base-200 rounded">
              <div className="stat-title">生成された形状</div>
              <div className="stat-value text-lg text-primary">
                {shapes.length} 個
              </div>
            </div>
          </div>

          {/* プログレス表示 */}
          {progress && (
            <div className="mb-4">
              <div className="alert alert-info">
                <span>進行中: {progress.opType} (操作 #{progress.opNumber})</span>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={clearError}
              >
                クリア
              </button>
            </div>
          )}

          {/* コードエディター */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">CADコード</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-32 font-mono text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CADコードを入力してください..."
            />
          </div>

          {/* テストボタン群 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={!isWorkerReady || isWorking}
            >
              {isWorking ? '実行中...' : 'コード実行'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleTestBasicShapes}
              disabled={isWorking}
            >
              基本形状テスト
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleTestBooleanOps}
              disabled={isWorking}
            >
              ブール演算テスト
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleTestTransforms}
              disabled={isWorking}
            >
              変形テスト
            </button>
          </div>

          {/* 形状情報表示 */}
          {shapes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">生成された形状</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>インデックス</th>
                      <th>ハッシュ</th>
                      <th>頂点数</th>
                      <th>三角形数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shapes.map((shape, index) => (
                      <tr key={index}>
                        <td>{index}</td>
                        <td className="font-mono text-xs">{shape.hash.substring(0, 8)}...</td>
                        <td>{shape.mesh ? shape.mesh.vertices.length / 3 : 'N/A'}</td>
                        <td>{shape.mesh ? shape.mesh.indices.length / 3 : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ログ表示 */}
          {logs.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">ログ ({logs.length})</h3>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={clearLogs}
                >
                  ログクリア
                </button>
              </div>
              <div className="bg-base-300 rounded p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      [{new Date().toLocaleTimeString()}] {log}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 