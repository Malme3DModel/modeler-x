'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeViewportProps {
  onSceneReady?: (scene: THREE.Scene) => void;
  onShapeUpdate?: (facesAndEdges: any, sceneOptions: any) => void;
}

const ThreeViewport: React.FC<ThreeViewportProps> = ({ onSceneReady, onShapeUpdate }) => {
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

    if (!facesAndEdges || !facesAndEdges.faceList) {
      console.warn('No face data received from CAD worker');
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
      for (const face of facesAndEdges.faceList) {
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

        // マテリアルの作成
        const matcapMaterial = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(0xf5f5f5),
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
      if (facesAndEdges.edgeList && facesAndEdges.edgeList.length > 0) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgeVertices: number[] = [];

        for (const edge of facesAndEdges.edgeList) {
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
          edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
          const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
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

  // onShapeUpdateコールバックを設定
  useEffect(() => {
    if (onShapeUpdate) {
      onShapeUpdate(updateShapeFromWorker, {});
    }
  }, [onShapeUpdate, updateShapeFromWorker]);

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

    // 照明の設定
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, 200, 0);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xbbbbbb, 1);
    directionalLight.position.set(6, 50, -12);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.mapSize.width = 128;
    directionalLight.shadow.mapSize.height = 128;
    scene.add(directionalLight);

    // グラウンドプレーンの作成
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
    groundPlaneRef.current = groundMesh;

    // グリッドの作成
    const grid = new THREE.GridHelper(2000, 20, 0xcccccc, 0xcccccc);
    grid.position.y = -0.01;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);
    gridRef.current = grid;

    // メインオブジェクトグループの作成
    const mainObject = new THREE.Group();
    mainObject.name = "shape";
    mainObject.rotation.x = -Math.PI / 2;
    scene.add(mainObject);
    mainObjectRef.current = mainObject;

    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [onSceneReady]);

  // リサイズハンドラー
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const mount = mountRef.current;
    const newWidth = mount.clientWidth;
    const newHeight = mount.clientHeight;
    
    // カメラのアスペクト比を更新
    cameraRef.current.aspect = newWidth / newHeight;
    cameraRef.current.updateProjectionMatrix();
    
    // レンダラーのサイズを更新
    rendererRef.current.setSize(newWidth, newHeight);
    
    console.log(`Three.js viewport resized to: ${newWidth}x${newHeight}`);
  }, []);

  // Three.jsの初期化
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // シーンの作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    scene.fog = new THREE.Fog(0x222222, 200, 600);
    sceneRef.current = scene;

    // カメラの作成
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.set(50, 100, 150);
    camera.lookAt(0, 45, 0);
    cameraRef.current = camera;

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // コントロールの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 45, 0);
    controls.panSpeed = 2;
    controls.zoomSpeed = 1;
    controls.screenSpacePanning = true;
    controls.update();
    controlsRef.current = controls;

    // 初期シーンの作成
    createInitialScene();

    // アニメーションループ
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setIsLoaded(true);

    // ResizeObserverを設定してdockviewのパネルリサイズに対応
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // contentBoxSizeが利用可能な場合はそれを使用、そうでなければcontentRectを使用
          const { width: newWidth, height: newHeight } = entry.contentBoxSize 
            ? { width: entry.contentBoxSize[0].inlineSize, height: entry.contentBoxSize[0].blockSize }
            : entry.contentRect;
          
          if (newWidth > 0 && newHeight > 0) {
            handleResize();
          }
        }
      });
      
      resizeObserverRef.current.observe(mount);
    }

    // フォールバック: windowリサイズイベント
    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      
      // Three.jsリソースの解放
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [createInitialScene, handleResize]);

  // グローバルにThreeViewportインターフェースを公開
  useEffect(() => {
    (window as any).threejsViewport = {
      updateShape: updateShapeFromWorker,
      clearTransformHandles: () => {
        // Transform handles clearing logic (if needed)
      },
      saveShapeSTEP: () => {
        console.log('Save STEP functionality not yet implemented');
      },
      saveShapeSTL: () => {
        console.log('Save STL functionality not yet implemented');
      },
      saveShapeOBJ: () => {
        console.log('Save OBJ functionality not yet implemented');
      }
    };

    return () => {
      delete (window as any).threejsViewport;
    };
  }, [updateShapeFromWorker]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-700 text-white px-4 py-1 text-xs border-b border-gray-600 flex justify-between">
        <span>CAD View</span>
        <span className="text-gray-400">
          {isLoaded ? 'Three.js Ready' : 'Loading Viewport...'}
        </span>
      </div>
      <div 
        ref={mountRef} 
        className="flex-1 bg-gray-900"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default ThreeViewport; 