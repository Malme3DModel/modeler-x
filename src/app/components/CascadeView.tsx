'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { CascadeStudioCore } from '../lib/CascadeStudioCore';

interface CascadeViewProps {
  cascadeCore: CascadeStudioCore | null;
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
  
  const [viewDirty, setViewDirty] = useState(true);
  const [sceneOptions, setSceneOptions] = useState({
    gridVisible: true,
    groundPlaneVisible: false,
    axesVisible: true
  });

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
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemisphereLight.position.set(0, 200, 0);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xbbbbbb, 0.8);
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
    controls.addEventListener('change', () => setViewDirty(true));
    controls.update();
    controlsRef.current = controls;

    // グリッドヘルパーの作成
    updateGrid(scene);

    // 軸ヘルパーの作成
    if (sceneOptions.axesVisible) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }

    setViewDirty(true);
  }, []);

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

  // CAD形状の表示
  const displayShapes = useCallback((facelist: any[], edgelist: any[]) => {
    if (!sceneRef.current || !facelist) return;

    // 既存のメインオブジェクトを削除
    if (mainObjectRef.current) {
      sceneRef.current.remove(mainObjectRef.current);
    }

    const mainObject = new THREE.Group();
    mainObject.name = "shape";
    mainObject.rotation.x = -Math.PI / 2;

    // 三角面の追加
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];
    const colors: number[] = [];
    let vInd = 0;

    facelist.forEach((face, faceIndex) => {
      const color = new THREE.Color().setHSL((faceIndex * 0.1) % 1, 0.7, 0.6);
      
      face.forEach((vert: number[]) => {
        vertices.push(vert[0], vert[1], vert[2]);
        normals.push(vert[3], vert[4], vert[5]);
        colors.push(color.r, color.g, color.b);
        
        if ((vInd + 1) % 3 === 0) {
          triangles.push(vInd - 2, vInd - 1, vInd);
        }
        vInd++;
      });
    });

    if (vertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(triangles);

      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        transparent: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mainObject.add(mesh);
    }

    // エッジラインの追加
    if (edgelist && edgelist.length > 0) {
      const edgeVertices: number[] = [];
      edgelist.forEach((edge: number[][]) => {
        edge.forEach((vert: number[]) => {
          edgeVertices.push(vert[0], vert[1], vert[2]);
        });
      });

      if (edgeVertices.length > 0) {
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
        
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: 1
        });

        const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        mainObject.add(edgeLines);
      }
    }

    sceneRef.current.add(mainObject);
    mainObjectRef.current = mainObject;
    setViewDirty(true);
  }, []);

  // アニメーションループ
  const animate = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // 必要な時のみレンダリング（パフォーマンス最適化）
    if (viewDirty) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      setViewDirty(false);
    }
  }, [viewDirty]);

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
    initializeScene();
    
    const animateFunc = () => {
      animationIdRef.current = requestAnimationFrame(animateFunc);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current && viewDirty) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        setViewDirty(false);
      }
    };
    
    animateFunc();

    window.addEventListener('resize', handleResize);

    return () => {
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
      window.removeEventListener('resize', handleResize);
    };
  }, [initializeScene, handleResize]);

  // CascadeStudioCoreからのメッセージハンドラー登録
  useEffect(() => {
    if (!cascadeCore) return;

    const handleShapeUpdate = (payload: { facelist: any[], edgelist: any[], sceneOptions: any }) => {
      if (payload.sceneOptions) {
        setSceneOptions(prev => ({ ...prev, ...payload.sceneOptions }));
      }
      displayShapes(payload.facelist, payload.edgelist);
    };

    cascadeCore.registerMessageHandler('combineAndRenderShapes', handleShapeUpdate);

    return () => {
      // クリーンアップは必要に応じて実装
    };
  }, [cascadeCore, displayShapes]);

  // シーンオプションが変更された時の処理
  useEffect(() => {
    if (sceneRef.current) {
      updateGrid(sceneRef.current);
      setViewDirty(true);
    }
  }, [sceneOptions, updateGrid]);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 bg-gray-700 relative"
      style={{ width: '100%', height: '100%' }}
    >
      {/* ツールバー */}
      <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-80 rounded p-2">
        <div className="flex gap-2 text-xs">
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
      </div>
    </div>
  );
};

export default CascadeView; 