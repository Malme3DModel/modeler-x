import * as THREE from 'three';

export class CascadeTestUtils {
  private scene: THREE.Scene | null = null;
  private selectedObject: THREE.Object3D | null = null;
  
  constructor() {
    this.scene = null;
    this.selectedObject = null;
  }
  
  // シーン参照を設定
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }
  
  // 選択オブジェクト設定
  setSelectedObject(object: THREE.Object3D | null): void {
    this.selectedObject = object;
  }
  
  // 選択オブジェクト取得
  getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }
  
  // 初期化済みかどうか
  isReady(): boolean {
    return !!this.scene;
  }
  
  // TransformControlsが存在するかチェック
  hasTransformControls(): boolean {
    return !!this.selectedObject;
  }

  // 選択オブジェクトの位置を取得
  getSelectedObjectPosition(): [number, number, number] | null {
    const selected = this.getSelectedObject();
    return selected ? [
      selected.position.x,
      selected.position.y,
      selected.position.z
    ] : null;
  }

  // 選択オブジェクトの回転を取得
  getSelectedObjectRotation(): [number, number, number] | null {
    const selected = this.getSelectedObject();
    return selected ? [
      selected.rotation.x,
      selected.rotation.y,
      selected.rotation.z
    ] : null;
  }

  // テスト用のボックスオブジェクトを作成
  createTestBox(): void {
    if (!this.scene) return;
    
    // 既存のテストボックスを削除
    const existingBox = this.scene.children.find(child => child.name === 'TestBox');
    if (existingBox) {
      this.scene.remove(existingBox);
    }
    
    // 新しいテストボックスを作成
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x3366ff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'TestBox';
    mesh.position.set(0, 0, 0);
    
    this.scene.add(mesh);
    console.log('テストボックスを作成しました');
  }
}

// グローバルオブジェクトに登録（ブラウザ環境のみ）
if (typeof window !== 'undefined') {
  (window as any).cascadeTestUtils = {
    ...(window as any).cascadeTestUtils || {},
    
    // テストユーティリティのインスタンス
    _instance: new CascadeTestUtils(),
    
    // 委譲メソッド
    isReady: () => (window as any).cascadeTestUtils._instance.isReady(),
    setScene: (scene: THREE.Scene) => (window as any).cascadeTestUtils._instance.setScene(scene),
    setSelectedObject: (obj: THREE.Object3D | null) => (window as any).cascadeTestUtils._instance.setSelectedObject(obj),
    getSelectedObject: () => (window as any).cascadeTestUtils._instance.getSelectedObject(),
    hasTransformControls: () => (window as any).cascadeTestUtils._instance.hasTransformControls(),
    getSelectedObjectPosition: () => (window as any).cascadeTestUtils._instance.getSelectedObjectPosition(),
    getSelectedObjectRotation: () => (window as any).cascadeTestUtils._instance.getSelectedObjectRotation(),
    createTestBox: () => (window as any).cascadeTestUtils._instance.createTestBox(),
  };
} 