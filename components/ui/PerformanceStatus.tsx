import React from 'react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

interface PerformanceStatusProps {
  visible: boolean;
}

export const PerformanceStatus: React.FC<PerformanceStatusProps> = ({ visible }) => {
  const { metrics } = usePerformanceOptimization();

  if (!visible) return null;

  const getPerformanceColor = (fps: number) => {
    if (fps >= 60) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (memoryMB: number) => {
    if (memoryMB < 512) return 'text-green-400';
    if (memoryMB < 1024) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-16 right-4 bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg shadow-lg text-xs font-mono">
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getPerformanceColor(metrics.fps)}>
            {metrics.fps.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={getMemoryColor(metrics.memoryUsage)}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        <div className="flex justify-between">
          <span>WASM Init:</span>
          <span className="text-blue-400">
            {metrics.wasmInitTime.toFixed(0)}ms
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Phase 3: Performance Optimized
        </div>
      </div>
    </div>
  );
};
