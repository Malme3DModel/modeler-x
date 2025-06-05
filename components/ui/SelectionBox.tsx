import React, { useState, useCallback } from 'react';

interface SelectionBoxProps {
  enabled: boolean;
  onSelectionComplete: (selectedObjects: any[]) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ enabled, onSelectionComplete }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled || event.ctrlKey) return;
    
    setIsSelecting(true);
    setStartPoint({ x: event.clientX, y: event.clientY });
  }, [enabled]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting) return;
    setEndPoint({ x: event.clientX, y: event.clientY });
  }, [isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !startPoint || !endPoint) return;
    
    const selectedObjects: any[] = [];
    onSelectionComplete(selectedObjects);
    
    setIsSelecting(false);
    setStartPoint(null);
    setEndPoint(null);
  }, [isSelecting, startPoint, endPoint, onSelectionComplete]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: enabled ? 'auto' : 'none' }}
    >
      {isSelecting && startPoint && endPoint && (
        <SelectionBoxVisual startPoint={startPoint} endPoint={endPoint} />
      )}
    </div>
  );
};

const SelectionBoxVisual: React.FC<{ startPoint: { x: number; y: number }; endPoint: { x: number; y: number } }> = ({ startPoint, endPoint }) => {
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '1px dashed #007acc',
        backgroundColor: 'rgba(0, 122, 204, 0.1)',
        pointerEvents: 'none'
      }}
    />
  );
};
