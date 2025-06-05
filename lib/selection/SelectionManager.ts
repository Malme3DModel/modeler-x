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
}

export const selectionManager = new SelectionManager();
