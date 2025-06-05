import * as THREE from 'three';

export class RenderingOptimizer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private frameStats = { fps: 0, frameTime: 0, lastTime: 0 };
  private lodManager = new Map<string, THREE.LOD>();
  private instancedMeshes = new Map<string, THREE.InstancedMesh>();

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.setupOptimizations();
  }

  private setupOptimizations(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.renderer.info.autoReset = false;
    this.renderer.sortObjects = true;
    
    console.log('✅ Rendering optimizations applied');
  }

  enableInstancing(): void {
    const geometryGroups = new Map<string, THREE.Object3D[]>();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const geometryKey = this.getGeometryKey(object.geometry);
        if (!geometryGroups.has(geometryKey)) {
          geometryGroups.set(geometryKey, []);
        }
        geometryGroups.get(geometryKey)!.push(object);
      }
    });

    geometryGroups.forEach((objects, geometryKey) => {
      if (objects.length > 1) {
        const firstObject = objects[0] as THREE.Mesh;
        const instancedMesh = new THREE.InstancedMesh(
          firstObject.geometry,
          firstObject.material,
          objects.length
        );

        objects.forEach((obj, index) => {
          const matrix = new THREE.Matrix4();
          matrix.compose(obj.position, obj.quaternion, obj.scale);
          instancedMesh.setMatrixAt(index, matrix);
          obj.parent?.remove(obj);
        });

        instancedMesh.instanceMatrix.needsUpdate = true;
        this.scene.add(instancedMesh);
        this.instancedMeshes.set(geometryKey, instancedMesh);
      }
    });
  }

  enableLOD(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && !this.lodManager.has(object.uuid)) {
        const lod = new THREE.LOD();
        
        lod.addLevel(object.clone(), 0);
        
        const mediumGeometry = this.simplifyGeometry(object.geometry, 0.5);
        const mediumMesh = new THREE.Mesh(mediumGeometry, object.material);
        lod.addLevel(mediumMesh, 50);
        
        const lowGeometry = this.simplifyGeometry(object.geometry, 0.25);
        const lowMesh = new THREE.Mesh(lowGeometry, object.material);
        lod.addLevel(lowMesh, 100);
        
        if (object.parent) {
          object.parent.add(lod);
          object.parent.remove(object);
          this.lodManager.set(object.uuid, lod);
        }
      }
    });
  }

  enableFrustumCulling(): void {
    const frustum = new THREE.Frustum();
    const cameraMatrix = new THREE.Matrix4();

    const originalRender = this.renderer.render.bind(this.renderer);
    this.renderer.render = (scene: THREE.Scene, camera: THREE.Camera) => {
      cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(cameraMatrix);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.visible = frustum.intersectsObject(object);
        }
      });

      originalRender(scene, camera);
    };
  }

  monitorPerformance(): void {
    const updateStats = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.frameStats.lastTime;

      if (deltaTime >= 1000) {
        this.frameStats.fps = Math.round(1000 / deltaTime);
        this.frameStats.frameTime = deltaTime;
        this.frameStats.lastTime = currentTime;
        
        console.log(`FPS: ${this.frameStats.fps}, Frame Time: ${this.frameStats.frameTime.toFixed(2)}ms`);
        
        if (this.frameStats.fps < 60) {
          console.warn(`⚠️ Performance warning: FPS dropped to ${this.frameStats.fps}`);
        }
      }
      
      requestAnimationFrame(updateStats);
    };
    
    this.frameStats.lastTime = performance.now();
    updateStats();
  }

  private simplifyGeometry(geometry: THREE.BufferGeometry, factor: number): THREE.BufferGeometry {
    const simplified = geometry.clone();
    
    const positionAttribute = simplified.getAttribute('position');
    if (positionAttribute) {
      const originalCount = positionAttribute.count;
      const newCount = Math.floor(originalCount * factor);
      const step = Math.floor(originalCount / newCount);
      
      const newPositions: number[] = [];
      for (let i = 0; i < originalCount; i += step) {
        newPositions.push(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        );
      }
      
      simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      simplified.computeVertexNormals();
    }
    
    return simplified;
  }

  private getGeometryKey(geometry: THREE.BufferGeometry): string {
    const position = geometry.getAttribute('position');
    return `${geometry.type}_${position?.count || 0}`;
  }

  getPerformanceStats() {
    return {
      ...this.frameStats,
      renderInfo: this.renderer.info,
      lodCount: this.lodManager.size,
      instancedMeshCount: this.instancedMeshes.size
    };
  }

  dispose(): void {
    this.lodManager.clear();
    this.instancedMeshes.clear();
  }
}
