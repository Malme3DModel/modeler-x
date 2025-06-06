'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// Fast Refreshを無効化（開発時のみ）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.decline();
  }
}
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { CascadeStudioCore } from '../lib/CascadeStudioCore';

interface CascadeViewProps {
  cascadeCore: CascadeStudioCore | null;
}

interface FaceData {
  vertex_coord: number[];
  uv_coord: number[];
  normal_coord: number[];
  tri_indexes: number[];
  number_of_triangles: number;
  face_index: number;
}

interface EdgeData {
  vertex_coord: number[];
  edge_index: number;
}

interface SceneOptions {
  gridVisible: boolean;
  groundPlaneVisible: boolean;
  axesVisible: boolean;
}

// 改善されたCanvas管理システム
const CANVAS_MANAGER = {
  instances: new Map<string, { canvas: HTMLCanvasElement; renderer: THREE.WebGLRenderer }>(),
  
  createCanvas(containerId: string, container: HTMLElement): { canvas: HTMLCanvasElement; renderer: THREE.WebGLRenderer } | null {
    // 既存のインスタンスがある場合は再利用
    if (this.instances.has(containerId)) {
      const existing = this.instances.get(containerId)!;
      if (existing.canvas.parentNode !== container) {
        container.appendChild(existing.canvas);
      }
      console.log('Canvas manager reusing existing canvas for:', containerId);
      return existing;
    }
    
    // コンテナ内の既存canvasを削除
    const existingCanvases = container.querySelectorAll('canvas');
    existingCanvases.forEach(canvas => {
      canvas.remove();
    });
    
    // 新しいcanvasを作成
    const canvas = document.createElement('canvas');
    canvas.id = `cascade-canvas-${containerId}`;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    
    const instance = { canvas, renderer };
    this.instances.set(containerId, instance);
    
    console.log('Canvas manager created new canvas for:', containerId);
    
    return instance;
  },
  
  cleanup(containerId?: string) {
    if (containerId) {
      const instance = this.instances.get(containerId);
      if (instance) {
        console.log('Canvas manager disposing renderer for:', containerId);
        instance.renderer.dispose();
        if (instance.canvas.parentNode) {
          instance.canvas.parentNode.removeChild(instance.canvas);
        }
        this.instances.delete(containerId);
      }
    } else {
      // 全てクリーンアップ
      console.log('Canvas manager disposing all renderers');
      this.instances.forEach((instance, id) => {
        instance.renderer.dispose();
        if (instance.canvas.parentNode) {
          instance.canvas.parentNode.removeChild(instance.canvas);
        }
      });
      this.instances.clear();
    }
  }
};

// グローバルに公開
(window as any).CANVAS_MANAGER = CANVAS_MANAGER;

const CascadeView: React.FC<CascadeViewProps> = ({ cascadeCore }) => {
  // コンポーネントの一意ID（デバッグ用）
  const componentId = useMemo(() => `CascadeView-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const mainObjectRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const groundMeshRef = useRef<THREE.Mesh | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const matcapMaterialRef = useRef<THREE.MeshMatcapMaterial | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const highlightedObjRef = useRef<THREE.Object3D | null>(null);
  const highlightedIndexRef = useRef<number>(-1);
  const transformHandlesRef = useRef<TransformControls[]>([]);
  const fogDistRef = useRef<number>(200);
  const containerIdRef = useRef<string>(`cascade-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // アンマウント時のログ
  useEffect(() => {
    return () => {
      console.log(`${componentId} unmounted`);
    };
  }, [componentId]);
  
  const [viewDirty, setViewDirty] = useState(true);
  const [sceneOptions, setSceneOptions] = useState<SceneOptions>({
    gridVisible: true,
    groundPlaneVisible: false,
    axesVisible: true
  });
  const [gizmoMode, setGizmoMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [gizmoSpace, setGizmoSpace] = useState<'local' | 'world'>('local');

  // cascadeCoreがnullの場合は早期リターン
  if (!cascadeCore) {
    return (
      <div className="flex-1 bg-gray-700 flex items-center justify-center text-white">
        Waiting for CAD Core initialization...
      </div>
    );
  }

  // Matcapマテリアルの読み込み（メモ化）
  const loadMatcapMaterial = useCallback(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('');
    
    const matcap = loader.load('/textures/dullFrontLitMetal.png', () => {
      setViewDirty(true);
    });
    
    const matcapMaterial = new THREE.MeshMatcapMaterial({
      color: new THREE.Color(0xf5f5f5),
      matcap: matcap,
      polygonOffset: true,
      polygonOffsetFactor: 2.0,
      polygonOffsetUnits: 1.0
    });
    
    matcapMaterialRef.current = matcapMaterial;
  }, []);

  // Three.jsシーンの初期化（メモ化と最適化）
  const initializeScene = useCallback((): (() => void) | undefined => {
    if (!containerRef.current || isInitializedRef.current) {
      return;
    }
    
    console.log('Starting scene initialization...');
    
    // コンテナサイズの確認
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.log('Container size is 0, retrying...');
      setTimeout(() => {
        isInitializedRef.current = false;
        initializeScene();
      }, 100);
      return;
    }
    
    // グローバルcanvas管理システムを使用
    const canvasResult = CANVAS_MANAGER.createCanvas(containerIdRef.current, containerRef.current);
    if (!canvasResult) {
      console.error('Failed to create canvas');
      return;
    }
    
    const { canvas, renderer } = canvasResult;
    
    // レンダラーの設定
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // DOMに追加
    containerRef.current.appendChild(canvas);
    
    isInitializedRef.current = true;

    // シーンの作成
    const scene = new THREE.Scene();
    const backgroundColor = 0x222222;
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 200, 600);
    sceneRef.current = scene;

    // カメラの作成
    const camera = new THREE.PerspectiveCamera(
      45,
      containerWidth / containerHeight,
      1,
      5000
    );
    camera.position.set(50, 100, 150);
    camera.lookAt(0, 45, 0);
    cameraRef.current = camera;

    // ライティングの設定
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemisphereLight.position.set(0, 200, 0);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xbbbbbb);
    directionalLight.position.set(6, 50, -12);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.mapSize.width = 128;
    directionalLight.shadow.mapSize.height = 128;
    scene.add(directionalLight);

    // OrbitControlsの設定
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 45, 0);
    controls.panSpeed = 2;
    controls.zoomSpeed = 1;
    controls.screenSpacePanning = true;
    controls.enabled = true;
    controls.enableDamping = false;
    controls.addEventListener('change', () => {
      setViewDirty(true);
    });
    controls.update();
    controlsRef.current = controls;

    // マウスイベントの設定
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.offsetX / containerRef.current!.clientWidth) * 2 - 1;
      mouseRef.current.y = -(event.offsetY / containerRef.current!.clientHeight) * 2 + 1;
    };

    canvas.addEventListener('mousemove', handleMouseMove, false);

    // キーボードイベントの設定
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case 88: // X
          setGizmoSpace(prev => prev === 'local' ? 'world' : 'local');
          break;
        case 87: // W
          setGizmoMode('translate');
          break;
        case 69: // E
          setGizmoMode('rotate');
          break;
        case 82: // R
          setGizmoMode('scale');
          break;
      }
      setViewDirty(true);
    };

    window.addEventListener('keydown', handleKeyDown);

    // 初期シーン要素の作成
    updateSceneElements(scene);

    // Matcapマテリアルの読み込み
    loadMatcapMaterial();

    // テスト用の簡単なジオメトリを追加
    const testGeometry = new THREE.BoxGeometry(10, 10, 10);
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 5, 0);
    testCube.name = "TestCube";
    scene.add(testCube);
    
    setViewDirty(true);
    
    // 初期レンダリング
    renderer.render(scene, camera);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // 依存配列を空にして、一度だけ実行されるようにする

  // シーン要素の更新（グリッド、グラウンドプレーン、軸）
  const updateSceneElements = useCallback((scene: THREE.Scene) => {
    // 既存の要素を削除
    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current = null;
    }
    if (groundMeshRef.current) {
      scene.remove(groundMeshRef.current);
      groundMeshRef.current = null;
    }

    // グラウンドプレーンの作成
    if (sceneOptions.groundPlaneVisible) {
      const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
      const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x080808,
        depthWrite: true,
        dithering: true,
        polygonOffset: true,
        polygonOffsetFactor: 6.0,
        polygonOffsetUnits: 1.0
      });
      const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
      groundMesh.position.y = -0.1;
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.receiveShadow = true;
      scene.add(groundMesh);
      groundMeshRef.current = groundMesh;
    }

    // グリッドヘルパーの作成
    if (sceneOptions.gridVisible) {
      const grid = new THREE.GridHelper(2000, 20, 0xcccccc, 0xcccccc);
      grid.position.y = -0.01;
      grid.material.opacity = 0.3;
      grid.material.transparent = true;
      scene.add(grid);
      gridHelperRef.current = grid;
    }

    // 軸ヘルパーの作成
    if (sceneOptions.axesVisible) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }
  }, [sceneOptions]);

  // Transform Handlesのクリア（メモ化）
  const clearTransformHandles = useCallback(() => {
    if (!sceneRef.current) return;

    transformHandlesRef.current.forEach((handle) => {
      (handle as any).removeEventListener('dragging-changed', (handle as any).userData?.onChanged);
      const attachedObject = (handle as any).object;
      if (attachedObject) {
        sceneRef.current!.remove(attachedObject);
      }
      sceneRef.current!.remove(handle as any);
    });
    transformHandlesRef.current = [];
  }, []);

  // Transform Handlesの作成（メモ化）
  const createTransformHandle = useCallback((payload: {
    lineAndColumn: [number, number];
    translation: [number, number, number];
    rotation: [[number, number, number], number];
    scale: number;
  }) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const canvasInstance = CANVAS_MANAGER.instances.get(containerIdRef.current);
    if (!canvasInstance) return;
    
    const handle = new TransformControls(cameraRef.current, canvasInstance.canvas);
    handle.setTranslationSnap(1);
    handle.setRotationSnap(THREE.MathUtils.degToRad(1));
    handle.setScaleSnap(0.05);
    handle.setMode(gizmoMode);
    handle.setSpace(gizmoSpace);

    // Transform Controlsのイベントハンドラー（v0版と同じ方式）
    const onChanged = (event: any) => {
      if (controlsRef.current) {
        // Transform Controlsがアクティブな時はOrbitControlsを無効化
        controlsRef.current.enabled = !event.value;
        console.log('Transform Controls dragging:', event.value, 'OrbitControls enabled:', controlsRef.current.enabled);
      }
      setViewDirty(true);

      // 変換完了時にエディターにデータを注入
      if (event.value === false && cascadeCore) { // ドラッグ終了時
        const emptyObject = (handle as any).object as THREE.Group;
        if (emptyObject) {
          const translateString = `[${emptyObject.position.x.toFixed()}, ${(-emptyObject.position.z).toFixed()}, ${emptyObject.position.y.toFixed()}]`;
          
          let axisAngle: [[number, number, number], number] = [[0, 0, 0], 0];
          const q = emptyObject.quaternion;
          if ((1 - (q.w * q.w)) > 0.001) {
            axisAngle = [[
              q.x / Math.sqrt(1 - q.w * q.w),
              -q.z / Math.sqrt(1 - q.w * q.w),
              q.y / Math.sqrt(1 - q.w * q.w),
            ], 2 * Math.acos(q.w) * 57.2958];
          }
          
          const rotateString = `[[${axisAngle[0][0].toFixed(2)}, ${axisAngle[0][1].toFixed(2)}, ${axisAngle[0][2].toFixed(2)}], ${axisAngle[1].toFixed(2)}]`;
          const scaleString = emptyObject.scale.x.toFixed(2);
          
          // エディターの更新は将来実装予定
          console.log('Transform update:', { translateString, rotateString, scaleString });
        }
      }
    };

    (handle as any).addEventListener('dragging-changed', onChanged);

    // 偽のオブジェクトを作成してハンドルにアタッチ
    const emptyObject = new THREE.Group();
    emptyObject.position.set(payload.translation[0], payload.translation[2], -payload.translation[1]);
    emptyObject.setRotationFromAxisAngle(
      new THREE.Vector3(payload.rotation[0][0], payload.rotation[0][2], -payload.rotation[0][1]),
      payload.rotation[1] * 0.0174533
    );
    emptyObject.scale.set(payload.scale, payload.scale, payload.scale);
    
    sceneRef.current.add(emptyObject);
    handle.attach(emptyObject);

    transformHandlesRef.current.push(handle);
    sceneRef.current.add(handle as any);
  }, [gizmoMode, gizmoSpace]);



  // CAD形状の表示（メモ化）
  const displayShapes = useCallback((facelist: FaceData[], edgelist: EdgeData[]) => {
    if (!sceneRef.current || !facelist) return;

    // 既存のメインオブジェクトを削除
    if (mainObjectRef.current) {
      sceneRef.current.remove(mainObjectRef.current);
    }

    const mainObject = new THREE.Group();
    mainObject.name = "shape";
    mainObject.rotation.x = -Math.PI / 2;

    // 三角面の追加（v0版の詳細な実装）
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    let vInd = 0;
    let globalFaceIndex = 0;

    facelist.forEach((face) => {
      // 頂点座標をコピー
      vertices.push(...face.vertex_coord);
      normals.push(...face.normal_coord);
      uvs.push(...face.uv_coord);

      // 三角形インデックスを設定
      for (let i = 0; i < face.tri_indexes.length; i += 3) {
        triangles.push(
          face.tri_indexes[i + 0] + vInd,
          face.tri_indexes[i + 1] + vInd,
          face.tri_indexes[i + 2] + vInd
        );
      }

      // 頂点カラーを使用してフェイスインデックスをラベル付け（レイキャスト用）
      for (let i = 0; i < face.vertex_coord.length; i += 3) {
        colors.push(face.face_index, globalFaceIndex, 0);
      }

      globalFaceIndex++;
      vInd += face.vertex_coord.length / 3;
    });

    // ジオメトリとメッシュの作成
    if (vertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setIndex(triangles);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();

      const material = matcapMaterialRef.current || new THREE.MeshPhongMaterial({
        color: 0xf5f5f5,
        polygonOffset: true,
        polygonOffsetFactor: 2.0,
        polygonOffsetUnits: 1.0
      });

      const model = new THREE.Mesh(geometry, material);
      model.castShadow = true;
      model.name = "Model Faces";
      mainObject.add(model);
    }

    // エッジラインの追加（v0版の詳細な実装）
    if (edgelist && edgelist.length > 0) {
      const lineVertices: THREE.Vector3[] = [];
      const globalEdgeIndices: number[] = [];
      let curGlobalEdgeIndex = 0;
      const globalEdgeMetadata: { [key: number]: { localEdgeIndex: number; start: number; end: number } } = {};
      globalEdgeMetadata[-1] = { localEdgeIndex: -1, start: -1, end: -1 };

      edgelist.forEach((edge) => {
        const edgeMetadata = {
          localEdgeIndex: edge.edge_index,
          start: globalEdgeIndices.length,
          end: 0
        };

        for (let i = 0; i < edge.vertex_coord.length - 3; i += 3) {
          lineVertices.push(new THREE.Vector3(
            edge.vertex_coord[i],
            edge.vertex_coord[i + 1],
            edge.vertex_coord[i + 2]
          ));
          lineVertices.push(new THREE.Vector3(
            edge.vertex_coord[i + 3],
            edge.vertex_coord[i + 1 + 3],
            edge.vertex_coord[i + 2 + 3]
          ));
          globalEdgeIndices.push(curGlobalEdgeIndex);
          globalEdgeIndices.push(curGlobalEdgeIndex);
        }

        edgeMetadata.end = globalEdgeIndices.length - 1;
        globalEdgeMetadata[curGlobalEdgeIndex] = edgeMetadata;
        curGlobalEdgeIndex++;
      });

      if (lineVertices.length > 0) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(lineVertices);
        const lineColors: number[] = [];
        for (let i = 0; i < lineVertices.length; i++) {
          lineColors.push(0, 0, 0);
        }
        lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 1.5,
          vertexColors: true
        });

        const line = new THREE.LineSegments(lineGeometry, lineMaterial) as any;
        line.globalEdgeIndices = globalEdgeIndices;
        line.name = "Model Edges";
        line.lineColors = lineColors;
        line.globalEdgeMetadata = globalEdgeMetadata;

        // エッジハイライト機能
        line.highlightEdgeAtLineIndex = function(lineIndex: number) {
          const edgeIndex = lineIndex >= 0 ? this.globalEdgeIndices[lineIndex] : lineIndex;
          const startIndex = this.globalEdgeMetadata[edgeIndex].start;
          const endIndex = this.globalEdgeMetadata[edgeIndex].end;
          
          for (let i = 0; i < this.lineColors.length; i++) {
            const colIndex = Math.floor(i / 3);
            this.lineColors[i] = (colIndex >= startIndex && colIndex <= endIndex) ? 1 : 0;
          }
          this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.lineColors, 3));
        };

        line.getEdgeMetadataAtLineIndex = function(lineIndex: number) {
          return this.globalEdgeMetadata[this.globalEdgeIndices[lineIndex]];
        };

        line.clearHighlights = function() {
          return this.highlightEdgeAtLineIndex(-1);
        };

        mainObject.add(line);
      }
    }

    // フォグ距離の拡張
    const boundingBox = new THREE.Box3().setFromObject(mainObject);
    fogDistRef.current = Math.max(fogDistRef.current, boundingBox.min.distanceTo(boundingBox.max) * 1.5);
    if (sceneRef.current.fog) {
      sceneRef.current.fog = new THREE.Fog(0x222222, fogDistRef.current, fogDistRef.current + 400);
    }

    sceneRef.current.add(mainObject);
    mainObjectRef.current = mainObject;
    
    // グローバルに公開（ファイルエクスポート用）
    (window as any).cascadeMainObject = mainObject;
    
    setViewDirty(true);
  }, []);

  // ファイルエクスポート機能（メモ化）
  const saveShapeSTL = useCallback(async () => {
    if (!mainObjectRef.current) return;

    const exporter = new STLExporter();
    const result = exporter.parse(mainObjectRef.current);
    
    const blob = new Blob([result], { type: 'model/stl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model.stl';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const saveShapeOBJ = useCallback(async () => {
    if (!mainObjectRef.current) return;

    const exporter = new OBJExporter();
    const result = exporter.parse(mainObjectRef.current);
    
    const blob = new Blob([result], { type: 'model/obj' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model.obj';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // ハイライト機能（マウスホバー、メモ化）
  const updateHighlights = useCallback(() => {
    if (!mainObjectRef.current || !cameraRef.current || !controlsRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(mainObjectRef.current.children);

    // v0版と同じ条件：OrbitControlsの状態とTransform Controlsの状態をチェック
    const isTransformControlsActive = transformHandlesRef.current.some(handle => (handle as any).dragging);
    const isOrbitControlsIdle = controlsRef.current && controlsRef.current.enabled;
    
    if (isOrbitControlsIdle && !isTransformControlsActive && intersects.length > 0) {
      const isLine = intersects[0].object.type === 'LineSegments';
      const newIndex = isLine 
        ? (intersects[0].object as any).getEdgeMetadataAtLineIndex(intersects[0].index).localEdgeIndex
        : (intersects[0].object as any).geometry.attributes.color.getX((intersects[0] as any).face.a);

      if (highlightedObjRef.current !== intersects[0].object || highlightedIndexRef.current !== newIndex) {
        // 前のハイライトをクリア
        if (highlightedObjRef.current) {
          (highlightedObjRef.current as any).material.color.setHex((highlightedObjRef.current as any).currentHex);
          if ((highlightedObjRef.current as any).clearHighlights) {
            (highlightedObjRef.current as any).clearHighlights();
          }
        }

        // 新しいハイライトを設定
        highlightedObjRef.current = intersects[0].object;
        (highlightedObjRef.current as any).currentHex = (highlightedObjRef.current as any).material.color.getHex();
        (highlightedObjRef.current as any).material.color.setHex(0xffffff);
        highlightedIndexRef.current = newIndex;

        if (isLine) {
          (highlightedObjRef.current as any).highlightEdgeAtLineIndex(intersects[0].index);
        }

        setViewDirty(true);
      }

      const indexHelper = (isLine ? "Edge" : "Face") + " Index: " + highlightedIndexRef.current;
      if (containerRef.current) {
        containerRef.current.title = indexHelper;
      }
    } else {
      if (highlightedObjRef.current) {
        (highlightedObjRef.current as any).material.color.setHex((highlightedObjRef.current as any).currentHex);
        if ((highlightedObjRef.current as any).clearHighlights) {
          (highlightedObjRef.current as any).clearHighlights();
        }
        setViewDirty(true);
      }

      highlightedObjRef.current = null;
      if (containerRef.current) {
        containerRef.current.title = "";
      }
    }
  }, []);

  // リサイズハンドラー（メモ化）
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Canvasの属性を直接設定
    const canvasInstance = CANVAS_MANAGER.instances.get(containerIdRef.current);
    if (canvasInstance) {
      canvasInstance.canvas.width = width;
      canvasInstance.canvas.height = height;
    }

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
    setViewDirty(true);
  }, []);

  // コンポーネントマウント時の初期化（最適化）
  useEffect(() => {
    console.log('CascadeView initialization useEffect triggered');
    let cleanup: (() => void) | undefined;
    let animationId: number | null = null;
    
    // 少し遅延させてDOMが完全にレンダリングされるのを待つ
    const timer = setTimeout(() => {
      cleanup = initializeScene();
      
      // アニメーションループ（最適化）
      const animateFunc = () => {
        animationId = requestAnimationFrame(animateFunc);
        
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        // OrbitControlsの更新
        if (controlsRef.current && controlsRef.current.enableDamping) {
          controlsRef.current.update();
        }

        updateHighlights();
        
        // Transform Handlesのドラッグ状態をチェック
        let handlesDragging = false;
        transformHandlesRef.current.forEach(handle => {
          if ((handle as any).dragging) {
            handlesDragging = true;
          }
        });

        if (handlesDragging) {
          setViewDirty(true);
        }

        // 遅延レンダリング
        if (viewDirty) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          setViewDirty(false);
        }
      };
      
      animateFunc();
    }, 50);

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('CascadeView cleanup triggered');
      clearTimeout(timer);
      if (cleanup) cleanup();
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // グローバルcanvas管理システムでクリーンアップ
      CANVAS_MANAGER.cleanup(containerIdRef.current);
      rendererRef.current = null;
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      clearTransformHandles();
      window.removeEventListener('resize', handleResize);
    };
  }, []); // 依存配列を空にして、マウント時のみ実行

  // CascadeStudioCoreからのメッセージハンドラー登録（最適化）
  useEffect(() => {
    if (!cascadeCore) return;

    // メモ化されたハンドラー関数
    const handleShapeUpdate = (payload: { facelist: FaceData[], edgelist: EdgeData[], sceneOptions: SceneOptions }) => {
      if (payload.sceneOptions) {
        setSceneOptions(prev => ({ ...prev, ...payload.sceneOptions }));
      }
      displayShapes(payload.facelist, payload.edgelist);
    };

    const handleTransformHandle = (payload: any) => {
      createTransformHandle(payload);
    };

    const handleClearTransformHandles = () => {
      clearTransformHandles();
    };

    const handleSaveShapeSTL = () => {
      saveShapeSTL();
    };

    const handleSaveShapeOBJ = () => {
      saveShapeOBJ();
    };

    cascadeCore.registerMessageHandler('combineAndRenderShapes', handleShapeUpdate);
    cascadeCore.registerMessageHandler('createTransformHandle', handleTransformHandle);
    cascadeCore.registerMessageHandler('clearTransformHandles', handleClearTransformHandles);
    cascadeCore.registerMessageHandler('saveShapeSTL', handleSaveShapeSTL);
    cascadeCore.registerMessageHandler('saveShapeOBJ', handleSaveShapeOBJ);

    return () => {
      // クリーンアップは必要に応じて実装
    };
  }, [cascadeCore]); // cascadeCoreのみに依存

  // シーンオプションが変更された時の処理
  useEffect(() => {
    if (sceneRef.current) {
      updateSceneElements(sceneRef.current);
      setViewDirty(true);
    }
  }, [sceneOptions, updateSceneElements]);

  // ギズモモードとスペースの更新
  useEffect(() => {
    transformHandlesRef.current.forEach(handle => {
      handle.setMode(gizmoMode);
      handle.setSpace(gizmoSpace);
    });
    setViewDirty(true);
  }, [gizmoMode, gizmoSpace]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        backgroundColor: '#222222',
        overflow: 'hidden',
        position: 'relative',  // 子要素の絶対位置の基準点
        display: 'block'       // 確実に表示
      }}
    >
      {/* ツールバー */}
      <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-80 rounded p-2" style={{ zIndex: 10 }}>
        <div className="flex gap-2 text-xs mb-2">
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={sceneOptions.gridVisible}
              onChange={(e) => setSceneOptions(prev => ({ ...prev, gridVisible: e.target.checked }))}
              className="mr-1"
            />
            グリッド
          </label>
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={sceneOptions.groundPlaneVisible}
              onChange={(e) => setSceneOptions(prev => ({ ...prev, groundPlaneVisible: e.target.checked }))}
              className="mr-1"
            />
            地面
          </label>
        </div>
        
        {/* ギズモコントロール */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setGizmoMode('translate')}
            className={`px-2 py-1 text-xs rounded ${gizmoMode === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            title="移動 (W)"
          >
            移動
          </button>
          <button
            onClick={() => setGizmoMode('rotate')}
            className={`px-2 py-1 text-xs rounded ${gizmoMode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            title="回転 (E)"
          >
            回転
          </button>
          <button
            onClick={() => setGizmoMode('scale')}
            className={`px-2 py-1 text-xs rounded ${gizmoMode === 'scale' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            title="スケール (R)"
          >
            拡縮
          </button>
        </div>

        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setGizmoSpace('local')}
            className={`px-2 py-1 text-xs rounded ${gizmoSpace === 'local' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            title="ローカル座標 (X)"
          >
            ローカル
          </button>
          <button
            onClick={() => setGizmoSpace('world')}
            className={`px-2 py-1 text-xs rounded ${gizmoSpace === 'world' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
            title="ワールド座標 (X)"
          >
            ワールド
          </button>
        </div>

        {/* エクスポートボタン */}
        <div className="flex gap-1">
          <button
            onClick={saveShapeSTL}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            title="STLファイルとして保存"
          >
            STL
          </button>
          <button
            onClick={saveShapeOBJ}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            title="OBJファイルとして保存"
          >
            OBJ
          </button>
          <button
            onClick={clearTransformHandles}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            title="変換ハンドルをクリア"
          >
            クリア
          </button>
        </div>
      </div>

      {/* キーボードショートカットヘルプ */}
      <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-80 rounded p-2 text-xs text-white" style={{ zIndex: 10 }}>
        <div>W: 移動 | E: 回転 | R: スケール | X: 座標系切替</div>
      </div>
    </div>
  );
};

export default CascadeView; 