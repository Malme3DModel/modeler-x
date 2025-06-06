'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
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

const CascadeView: React.FC<CascadeViewProps> = ({ cascadeCore }) => {
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

  // Matcapマテリアルの読み込み
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

  // Three.jsシーンの初期化
  const initializeScene = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;
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
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      1,
      5000
    );
    camera.position.set(50, 100, 150);
    camera.lookAt(0, 45, 0);
    cameraRef.current = camera;

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

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
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 45, 0);
    controls.panSpeed = 2;
    controls.zoomSpeed = 1;
    controls.screenSpacePanning = true;
    controls.enabled = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.addEventListener('change', () => {
      setViewDirty(true);
      console.log('OrbitControls changed, enabled:', controls.enabled);
    });
    controls.update();
    controlsRef.current = controls;

    // デバッグ用：OrbitControlsの初期状態を確認
    console.log('OrbitControls initialized, enabled:', controls.enabled);

    // マウスイベントの設定
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

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

    // グリッドヘルパーの作成
    updateGrid(scene);

    // 軸ヘルパーの作成
    if (sceneOptions.axesVisible) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }

    // Matcapマテリアルの読み込み
    loadMatcapMaterial();

    setViewDirty(true);

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadMatcapMaterial]);

  // グリッドとグラウンドプレーンの更新
  const updateGrid = useCallback((scene: THREE.Scene) => {
    // 既存のグリッドとグラウンドプレーンを削除
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
  }, [sceneOptions]);

  // Transform Handlesの作成
  const createTransformHandle = useCallback((payload: {
    lineAndColumn: [number, number];
    translation: [number, number, number];
    rotation: [[number, number, number], number];
    scale: number;
  }) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const handle = new TransformControls(cameraRef.current, rendererRef.current.domElement);
    handle.setTranslationSnap(1);
    handle.setRotationSnap(THREE.MathUtils.degToRad(1));
    handle.setScaleSnap(0.05);
    handle.setMode(gizmoMode);
    handle.setSpace(gizmoSpace);

    // Transform Controlsのイベントハンドラー
    const onChanged = (event: any) => {
      if (controlsRef.current) {
        // Transform Controlsがアクティブな時はOrbitControlsを無効化
        controlsRef.current.enabled = !event.value;
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
  }, [gizmoMode, gizmoSpace, cascadeCore]);

  // Transform Handlesのクリア
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

  // CAD形状の表示（v0版の高度な機能を移植）
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
    console.log("Generation Complete!");
  }, [matcapMaterialRef]);

  // ファイルエクスポート機能
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

  // ハイライト機能（マウスホバー）
  const updateHighlights = useCallback(() => {
    if (!mainObjectRef.current || !cameraRef.current || !controlsRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(mainObjectRef.current.children);

    // Transform Controlsが操作中でない場合のみハイライトを実行
    const isTransformControlsActive = transformHandlesRef.current.some(handle => (handle as any).dragging);
    
    if (!isTransformControlsActive && intersects.length > 0) {
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

  // アニメーションループ
  const animate = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // OrbitControlsの更新（ダンピング用）
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    updateHighlights();
    
    let handlesDragging = false;
    transformHandlesRef.current.forEach(handle => {
      if ((handle as any).dragging) {
        handlesDragging = true;
      }
    });

    if (handlesDragging) {
      setViewDirty(true);
    }

    // 必要な時のみレンダリング（パフォーマンス最適化）
    if (viewDirty) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      setViewDirty(false);
    }
  }, [viewDirty, updateHighlights]);

  // リサイズハンドラー
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
    setViewDirty(true);
  }, []);

  // コンポーネントマウント時の初期化
  useEffect(() => {
    const cleanup = initializeScene();
    
    const animateFunc = () => {
      animationIdRef.current = requestAnimationFrame(animateFunc);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // OrbitControlsの更新（ダンピング用）
        if (controlsRef.current) {
          controlsRef.current.update();
        }

        updateHighlights();
        
        let handlesDragging = false;
        transformHandlesRef.current.forEach(handle => {
          if ((handle as any).dragging) {
            handlesDragging = true;
          }
        });

        if (handlesDragging) {
          setViewDirty(true);
        }

        if (viewDirty) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        setViewDirty(false);
        }
      }
    };
    
    animateFunc();

    window.addEventListener('resize', handleResize);

    return () => {
      if (cleanup) cleanup();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      clearTransformHandles();
      window.removeEventListener('resize', handleResize);
    };
  }, [initializeScene, handleResize, updateHighlights, clearTransformHandles]);

  // CascadeStudioCoreからのメッセージハンドラー登録
  useEffect(() => {
    if (!cascadeCore) return;

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
  }, [cascadeCore, displayShapes, createTransformHandle, clearTransformHandles, saveShapeSTL, saveShapeOBJ]);

  // シーンオプションが変更された時の処理
  useEffect(() => {
    if (sceneRef.current) {
      updateGrid(sceneRef.current);
      setViewDirty(true);
    }
  }, [sceneOptions, updateGrid]);

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
      className="flex-1 bg-gray-700 relative"
      style={{ width: '100%', height: '100%' }}
    >
      {/* ツールバー */}
      <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-80 rounded p-2">
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
      <div className="absolute bottom-2 left-2 z-10 bg-gray-800 bg-opacity-80 rounded p-2 text-xs text-white">
        <div>W: 移動 | E: 回転 | R: スケール | X: 座標系切替</div>
      </div>
    </div>
  );
};

export default CascadeView; 