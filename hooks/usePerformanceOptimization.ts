import { useEffect, useRef, useState } from 'react';
import { WebAssemblyOptimizer } from '../lib/performance/WebAssemblyOptimizer';
import { RenderingOptimizer } from '../lib/performance/RenderingOptimizer';
import { MemoryManager } from '../lib/performance/MemoryManager';
import * as THREE from 'three';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  wasmInitTime: number;
  renderingStats: any;
}

export function usePerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    wasmInitTime: 0,
    renderingStats: {}
  });
  
  const wasmOptimizerRef = useRef<WebAssemblyOptimizer | null>(null);
  const renderingOptimizerRef = useRef<RenderingOptimizer | null>(null);
  const memoryManagerRef = useRef<MemoryManager | null>(null);

  useEffect(() => {
    wasmOptimizerRef.current = new WebAssemblyOptimizer();
    
    memoryManagerRef.current = new MemoryManager();
    memoryManagerRef.current.monitorMemoryUsage();
    
    const interval = setInterval(() => {
      const newMetrics: PerformanceMetrics = {
        fps: 0,
        memoryUsage: 0,
        wasmInitTime: 0,
        renderingStats: {}
      };
      
      if (wasmOptimizerRef.current) {
        const wasmMetrics = wasmOptimizerRef.current.getPerformanceMetrics();
        newMetrics.wasmInitTime = wasmMetrics.initDuration;
      }
      
      if (renderingOptimizerRef.current) {
        const renderStats = renderingOptimizerRef.current.getPerformanceStats();
        newMetrics.fps = renderStats.fps;
        newMetrics.renderingStats = renderStats;
      }
      
      if (memoryManagerRef.current) {
        const memStats = memoryManagerRef.current.getMemoryStats();
        newMetrics.memoryUsage = memStats.usedJSHeapSize || 0;
      }
      
      setMetrics(newMetrics);
    }, 5000);

    return () => {
      clearInterval(interval);
      wasmOptimizerRef.current?.clearCache();
      renderingOptimizerRef.current?.dispose();
      memoryManagerRef.current?.clearAllCaches();
    };
  }, []);

  const initializeRenderingOptimizer = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
    renderingOptimizerRef.current = new RenderingOptimizer(renderer, scene, camera);
    renderingOptimizerRef.current.enableLOD();
    renderingOptimizerRef.current.enableInstancing();
    renderingOptimizerRef.current.enableFrustumCulling();
    renderingOptimizerRef.current.monitorPerformance();
  };

  return {
    metrics,
    wasmOptimizer: wasmOptimizerRef.current,
    renderingOptimizer: renderingOptimizerRef.current,
    memoryManager: memoryManagerRef.current,
    initializeRenderingOptimizer
  };
}
