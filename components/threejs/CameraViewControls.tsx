import React, { useEffect } from 'react';

interface CameraViewControlsProps {
  onViewChange: (view: number) => void;
  onFitToObject: () => void;
}

export function CameraViewControls({ onViewChange, onFitToObject }: CameraViewControlsProps) {
  useEffect(() => {
    const handleCameraViewChange = (event: CustomEvent) => {
      onViewChange(event.detail.view);
    };

    const handleFitToObject = () => {
      onFitToObject();
    };

    document.addEventListener('camera-view-change', handleCameraViewChange as EventListener);
    document.addEventListener('camera-fit-to-object', handleFitToObject);

    return () => {
      document.removeEventListener('camera-view-change', handleCameraViewChange as EventListener);
      document.removeEventListener('camera-fit-to-object', handleFitToObject);
    };
  }, [onViewChange, onFitToObject]);

  return null;
}
