import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

interface MatCapMaterialProps {
  color?: string;
  opacity?: number;
  transparent?: boolean;
}

export function useMatCapMaterial({ 
  color = '#f5f5f5', 
  opacity = 1.0, 
  transparent = false 
}: MatCapMaterialProps = {}) {
  const matcapTexture = useLoader(
    THREE.TextureLoader, 
    '/textures/dullFrontLitMetal.png'
  );
  
  return useMemo(() => {
    const material = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
      color: color,
      transparent: transparent,
      opacity: opacity,
      polygonOffset: true,
      polygonOffsetFactor: 2.0,
      polygonOffsetUnits: 1.0
    });
    
    return material;
  }, [matcapTexture, color, opacity, transparent]);
} 