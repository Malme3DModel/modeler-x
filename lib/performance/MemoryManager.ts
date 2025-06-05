import * as THREE from 'three';

export class MemoryManager {
  private disposables = new Set<THREE.Object3D>();
  private textureCache = new Map<string, THREE.Texture>();
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materialCache = new Map<string, THREE.Material>();
  private memoryThreshold = 1024 * 1024 * 1024;

  autoDisposeResources(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            this.disposeRelatedResources(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  getCachedGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (!this.geometryCache.has(key)) {
      const geometry = factory();
      this.geometryCache.set(key, geometry);
      this.disposables.add(geometry as any);
    }
    return this.geometryCache.get(key)!;
  }

  getCachedTexture(key: string, factory: () => THREE.Texture): THREE.Texture {
    if (!this.textureCache.has(key)) {
      const texture = factory();
      this.textureCache.set(key, texture);
      this.disposables.add(texture as any);
    }
    return this.textureCache.get(key)!;
  }

  getCachedMaterial(key: string, factory: () => THREE.Material): THREE.Material {
    if (!this.materialCache.has(key)) {
      const material = factory();
      this.materialCache.set(key, material);
      this.disposables.add(material as any);
    }
    return this.materialCache.get(key)!;
  }

  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        const usedMB = Math.round(memInfo.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memInfo.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1048576);
        
        console.log('Memory Usage:', {
          used: usedMB + 'MB',
          total: totalMB + 'MB',
          limit: limitMB + 'MB'
        });

        if (memInfo.usedJSHeapSize > this.memoryThreshold) {
          console.warn('⚠️ Memory usage exceeded threshold, triggering cleanup');
          this.forceGarbageCollection();
        }
      }, 10000);
    }
  }

  private forceGarbageCollection(): void {
    this.cleanupUnusedResources();
    
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  private cleanupUnusedResources(): void {
    let cleanedCount = 0;
    
    this.disposables.forEach((resource) => {
      if (resource && typeof (resource as any).dispose === 'function') {
        (resource as any).dispose();
        cleanedCount++;
      }
    });
    
    this.disposables.clear();
    console.log(`🧹 Cleaned up ${cleanedCount} resources`);
  }

  private disposeRelatedResources(element: HTMLElement): void {
    const threeObjects = element.querySelectorAll('[data-three-object]');
    threeObjects.forEach((obj) => {
      const objectId = obj.getAttribute('data-three-object');
      if (objectId) {
        this.disposeObjectById(objectId);
      }
    });
  }

  private disposeObjectById(objectId: string): void {
    this.geometryCache.delete(objectId);
    this.textureCache.delete(objectId);
    this.materialCache.delete(objectId);
  }

  getMemoryStats() {
    const stats = {
      geometryCacheSize: this.geometryCache.size,
      textureCacheSize: this.textureCache.size,
      materialCacheSize: this.materialCache.size,
      disposablesCount: this.disposables.size
    };

    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        ...stats,
        usedJSHeapSize: Math.round(memInfo.usedJSHeapSize / 1048576),
        totalJSHeapSize: Math.round(memInfo.totalJSHeapSize / 1048576),
        jsHeapSizeLimit: Math.round(memInfo.jsHeapSizeLimit / 1048576)
      };
    }

    return stats;
  }

  clearAllCaches(): void {
    this.cleanupUnusedResources();
    this.geometryCache.clear();
    this.textureCache.clear();
    this.materialCache.clear();
  }
}
