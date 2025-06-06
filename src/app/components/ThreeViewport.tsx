'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeViewportProps {
  onSceneReady?: (scene: THREE.Scene) => void;
}

const ThreeViewport: React.FC<ThreeViewportProps> = ({ onSceneReady }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

    // グリッドの作成
    const grid = new THREE.GridHelper(2000, 20, 0xcccccc, 0xcccccc);
    grid.position.y = -0.01;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    // メインオブジェクトグループの作成
    const mainObject = new THREE.Group();
    mainObject.name = "shape";
    mainObject.rotation.x = -Math.PI / 2;

    // 球体の作成（半径50）
    const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
    
    // 球体マテリアル
    const matcapMaterial = new THREE.MeshMatcapMaterial({
      color: new THREE.Color(0xf5f5f5),
      polygonOffset: true,
      polygonOffsetFactor: 2.0,
      polygonOffsetUnits: 1.0
    });

    // matcapテクスチャの読み込み（フォールバック用の基本マテリアル）
    const loader = new THREE.TextureLoader();
    loader.load(
      '/textures/dullFrontLitMetal.png',
      (texture) => {
        matcapMaterial.matcap = texture;
        matcapMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // テクスチャ読み込み失敗時は基本的なマテリアルを使用
        console.warn('Could not load matcap texture, using basic material');
      }
    );

    // 球体メッシュの作成
    const sphereMesh = new THREE.Mesh(sphereGeometry, matcapMaterial);
    sphereMesh.castShadow = true;
    sphereMesh.name = "Model Faces";
    
    // 球体の位置を調整（Z軸方向に50移動）
    sphereMesh.position.set(0, 0, 50);
    mainObject.add(sphereMesh);

    // 3Dテキストの代替（簡易版ボックス）
    const textGeometry = new THREE.BoxGeometry(20, 10, 3);
    const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-25, 0, 40);
    mainObject.add(textMesh);

    scene.add(mainObject);

    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [onSceneReady]);

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

    // リサイズハンドラー
    const handleResize = () => {
      if (!mount || !camera || !renderer) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      
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
  }, [createInitialScene]);

  return (
    <div className="flex-1 flex flex-col">
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