'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// モデラー色設定のインポート（型情報のみ）
type ModelerColors = {
  viewport: {
    bg: string;
    face: string;
    wireframe: string;
  };
  background: {
    primary: string;
  };
};

interface ThreeViewportProps {
  onSceneReady?: (scene: THREE.Scene) => void;
}

export interface ThreeViewportRef {
  updateShape: (facesAndEdges: any, sceneOptions: any) => void;
}

const ThreeViewport = forwardRef<ThreeViewportRef, ThreeViewportProps>(({ onSceneReady }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mainObjectRef = useRef<THREE.Group | null>(null);
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  // CADワーカーからのメッシュデータを処理する関数
  const updateShapeFromWorker = useCallback((facesAndEdges: any, sceneOptions: any) => {
    if (!sceneRef.current || !mainObjectRef.current) return;

    const scene = sceneRef.current;
    const mainObject = mainObjectRef.current;

    // 既存のCADオブジェクトをクリア
    while (mainObject.children.length > 0) {
      const child = mainObject.children[0];
      mainObject.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    let faceList: any[] = [];
    let edgeList: any[] = [];
    
    if (Array.isArray(facesAndEdges) && facesAndEdges.length >= 2) {
      faceList = facesAndEdges[0] || [];
      edgeList = facesAndEdges[1] || [];

    } else if (facesAndEdges && facesAndEdges.faceList) {
      faceList = facesAndEdges.faceList || [];
      edgeList = facesAndEdges.edgeList || [];

    } else {
      console.warn('No valid face data received from CAD worker');
      return;
    }

    try {
      // フェイスデータからジオメトリを作成
      const geometry = new THREE.BufferGeometry();
      
      // 頂点データの処理
      const vertices: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      let vertexIndex = 0;
      for (const face of faceList) {
        if (face.vertex_coord && face.normal_coord && face.tri_indexes) {
          const faceVertices = face.vertex_coord;
          const faceNormals = face.normal_coord;
          const faceIndices = face.tri_indexes;

          // 頂点座標を追加
          for (let i = 0; i < faceVertices.length; i += 3) {
            vertices.push(faceVertices[i], faceVertices[i + 1], faceVertices[i + 2]);
          }

          // 法線ベクトルを追加
          for (let i = 0; i < faceNormals.length; i += 3) {
            normals.push(faceNormals[i], faceNormals[i + 1], faceNormals[i + 2]);
          }

          // インデックスを追加
          for (let i = 0; i < faceIndices.length; i++) {
            indices.push(faceIndices[i] + vertexIndex);
          }

          vertexIndex += faceVertices.length / 3;
        }
      }

      if (vertices.length > 0) {
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();

        // モデラー色設定からフェイス色を取得（CSS変数から）
        const faceColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--threejs-viewport-face').trim() || '#cccccc';

        // マテリアルの作成
        const matcapMaterial = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(faceColor),
          polygonOffset: true,
          polygonOffsetFactor: 2.0,
          polygonOffsetUnits: 1.0
        });

        // matcapテクスチャの読み込み
        const loader = new THREE.TextureLoader();
        loader.load(
          '/textures/dullFrontLitMetal.png',
          (texture) => {
            matcapMaterial.matcap = texture;
            matcapMaterial.needsUpdate = true;
          },
          undefined,
          () => {
            console.warn('Could not load matcap texture, using basic material');
          }
        );

        // メッシュの作成
        const mesh = new THREE.Mesh(geometry, matcapMaterial);
        mesh.castShadow = true;
        mesh.name = "Model Faces";
        mainObject.add(mesh);

        console.log(`Rendered CAD model with ${vertices.length / 3} vertices and ${indices.length / 3} triangles`);
      }

      // エッジの処理（オプション）
      if (edgeList && edgeList.length > 0) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgeVertices: number[] = [];

        for (const edge of edgeList) {
          if (edge.vertex_coord) {
            for (let i = 0; i < edge.vertex_coord.length; i += 3) {
              edgeVertices.push(
                edge.vertex_coord[i],
                edge.vertex_coord[i + 1],
                edge.vertex_coord[i + 2]
              );
            }
          }
        }

        if (edgeVertices.length > 0) {
          // ワイヤーフレーム色を取得（CSS変数から）
          const wireframeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--threejs-viewport-wireframe').trim() || '#999999';
            
          edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
          const edgeMaterial = new THREE.LineBasicMaterial({ color: wireframeColor, linewidth: 1 });
          const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
          edgeLines.name = "Model Edges";
          mainObject.add(edgeLines);
        }
      }

      // シーンオプションの適用
      if (sceneOptions) {
        if (groundPlaneRef.current) {
          groundPlaneRef.current.visible = sceneOptions.groundPlaneVisible !== false;
        }
        if (gridRef.current) {
          gridRef.current.visible = sceneOptions.gridVisible !== false;
        }
      }

    } catch (error) {
      console.error('Error processing CAD mesh data:', error);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    updateShape: updateShapeFromWorker
  }), [updateShapeFromWorker]);

  // 初期シーンの作成
  const createInitialScene = useCallback(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // 既存のオブジェクトをクリア
    while (scene.children.length > 0) {
      const child = scene.children[0];
      scene.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 背景色を設定（CSS変数から）
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--threejs-viewport-background').trim() || '#1a1a1a';
    scene.background = new THREE.Color(bgColor);
    
    // 軸ヘルパー
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // CADオブジェクト用のコンテナグループ
    const mainObject = new THREE.Group();
    mainObject.name = "CAD Model Container";
    scene.add(mainObject);
    mainObjectRef.current = mainObject;

    // グリッドヘルパー
    const grid = new THREE.GridHelper(100, 10);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);
    gridRef.current = grid;

    // グラウンドプレーン
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01; // 軸と重ならないよう少しオフセット
    groundPlane.receiveShadow = true;
    groundPlane.name = "Ground Plane";
    scene.add(groundPlane);
    groundPlaneRef.current = groundPlane;

    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [onSceneReady]);

  // シーンのセットアップ
  useEffect(() => {
    // マウント要素がない場合は何もしない
    if (!mountRef.current) return;

    // シーンの作成
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // マウント要素のサイズを取得
    const { clientWidth, clientHeight } = mountRef.current;
    renderer.setSize(clientWidth, clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // カメラの作成
    const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // コントロールの作成
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 初期シーンの設定
    createInitialScene();

    // リサイズ処理
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const { clientWidth, clientHeight } = mountRef.current;
      rendererRef.current.setSize(clientWidth, clientHeight);
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    // リサイズオブザーバーの設定
    const resizeObserver = new ResizeObserver(handleResize);
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }
    resizeObserverRef.current = resizeObserver;

    // アニメーションループ
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;
      
      animationIdRef.current = requestAnimationFrame(animate);
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
    setIsLoaded(true);

    // クリーンアップ
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (resizeObserverRef.current && mountRef.current) {
        resizeObserverRef.current.unobserve(mountRef.current);
        resizeObserverRef.current.disconnect();
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [createInitialScene]);

  return (
    <div className="relative h-full w-full bg-modeler-viewport-bg">
      <div ref={mountRef} className="absolute inset-0">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Loading Viewport...
          </div>
        )}
      </div>
      {isLoaded && (
        <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          Three.js Ready
        </div>
      )}
    </div>
  );
});

ThreeViewport.displayName = 'ThreeViewport';

export default ThreeViewport;         