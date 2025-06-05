import * as THREE from 'three';

export class SelectionManager {
  private selectedObjects: Set<THREE.Object3D> = new Set();
  private listeners: ((objects: THREE.Object3D[]) => void)[] = [];

  addToSelection(object: THREE.Object3D) {
    this.selectedObjects.add(object);
    this.notifyListeners();
  }

  removeFromSelection(object: THREE.Object3D) {
    this.selectedObjects.delete(object);
    this.notifyListeners();
  }

  toggleSelection(object: THREE.Object3D) {
    if (this.selectedObjects.has(object)) {
      this.removeFromSelection(object);
    } else {
      this.addToSelection(object);
    }
  }

  clearSelection() {
    this.selectedObjects.clear();
    this.notifyListeners();
  }

  getSelectedObjects(): THREE.Object3D[] {
    return Array.from(this.selectedObjects);
  }

  isSelected(object: THREE.Object3D): boolean {
    return this.selectedObjects.has(object);
  }

  getSelectionCount(): number {
    return this.selectedObjects.size;
  }

  private notifyListeners() {
    const objects = this.getSelectedObjects();
    this.listeners.forEach(listener => listener(objects));
  }

  onSelectionChange(listener: (objects: THREE.Object3D[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  selectByArea(startPoint: THREE.Vector2, endPoint: THREE.Vector2, scene: THREE.Scene, camera: THREE.Camera): void {
    const bounds = new THREE.Box2(startPoint, endPoint);
    const selectedInArea: THREE.Object3D[] = [];
    
    scene.traverse((object) => {
      if (this.isSelectableObject(object)) {
        const screenPosition = this.getScreenPosition(object, camera);
        if (bounds.containsPoint(screenPosition)) {
          selectedInArea.push(object);
        }
      }
    });

    selectedInArea.forEach(obj => this.addToSelection(obj));
  }

  selectAll(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (this.isSelectableObject(object)) {
        this.addToSelection(object);
      }
    });
  }

  invertSelection(scene: THREE.Scene): void {
    const allObjects: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (this.isSelectableObject(object)) {
        allObjects.push(object);
      }
    });

    allObjects.forEach(obj => {
      if (this.isSelected(obj)) {
        this.removeFromSelection(obj);
      } else {
        this.addToSelection(obj);
      }
    });
  }

  private isSelectableObject(object: THREE.Object3D): boolean {
    return object instanceof THREE.Mesh && object.visible;
  }

  private getScreenPosition(object: THREE.Object3D, camera: THREE.Camera): THREE.Vector2 {
    const vector = new THREE.Vector3();
    object.getWorldPosition(vector);
    vector.project(camera);
    
    return new THREE.Vector2(
      (vector.x + 1) / 2,
      (-vector.y + 1) / 2
    );
  }
}

export const selectionManager = new SelectionManager();
