import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useSelectionManager } from '../../hooks/useSelectionManager';

interface MultiSelectionManagerProps {
  onSelectionChange?: (objects: THREE.Object3D[]) => void;
}

export function MultiSelectionManager({ onSelectionChange }: MultiSelectionManagerProps) {
  const { selectedObjects } = useSelectionManager();

  useEffect(() => {
    onSelectionChange?.(selectedObjects);
  }, [selectedObjects, onSelectionChange]);

  useEffect(() => {
    const handleMultiSelectKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('select-all-objects'));
      }
    };

    window.addEventListener('keydown', handleMultiSelectKeyDown);
    return () => window.removeEventListener('keydown', handleMultiSelectKeyDown);
  }, []);

  return null;
}
