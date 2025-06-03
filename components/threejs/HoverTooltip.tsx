import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

interface HoverTooltipProps {
  hoveredObject: THREE.Object3D | null;
  hoveredFace: number | null;
  mousePosition: { x: number; y: number } | null;
}

export default function HoverTooltip({ 
  hoveredObject, 
  hoveredFace, 
  mousePosition 
}: HoverTooltipProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // オブジェクトがホバーされているときだけ表示
    setVisible(!!hoveredObject && mousePosition !== null);
  }, [hoveredObject, mousePosition]);
  
  if (!visible || !mousePosition) return null;
  
  return (
    <div 
      className="absolute bg-gray-800 text-white text-xs p-2 rounded shadow z-50"
      style={{
        left: mousePosition.x + 15,
        top: mousePosition.y + 15,
        pointerEvents: 'none', // マウスイベントを通過させる
      }}
      data-testid="object-tooltip"
    >
      <div>オブジェクト: {hoveredObject?.name || '名前なし'}</div>
      {hoveredFace !== null && <div>フェイス: {hoveredFace}</div>}
      <div>ID: {hoveredObject?.uuid.substring(0, 8)}</div>
    </div>
  );
} 