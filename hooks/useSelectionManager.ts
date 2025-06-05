import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { selectionManager } from '../lib/selection/SelectionManager';

export function useSelectionManager() {
  const [selectedObjects, setSelectedObjects] = useState<THREE.Object3D[]>([]);

  useEffect(() => {
    const unsubscribe = selectionManager.onSelectionChange(setSelectedObjects);
    return unsubscribe;
  }, []);

  const selectObject = (object: THREE.Object3D, multiSelect = false) => {
    if (multiSelect) {
      selectionManager.toggleSelection(object);
    } else {
      selectionManager.clearSelection();
      selectionManager.addToSelection(object);
    }
  };

  const clearSelection = () => {
    selectionManager.clearSelection();
  };

  const isSelected = (object: THREE.Object3D) => {
    return selectionManager.isSelected(object);
  };

  return {
    selectedObjects,
    selectObject,
    clearSelection,
    isSelected,
    selectionCount: selectedObjects.length
  };
}
