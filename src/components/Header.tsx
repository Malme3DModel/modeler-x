import React from 'react';

interface HeaderProps {
  isCADWorkerReady: boolean;
  onSaveProject: () => void;
  onLoadProject?: () => void;
  onSaveSTEP?: () => void;
  onSaveSTL?: () => void;
  onSaveOBJ?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isCADWorkerReady,
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ
}) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="font-semibold">Modeler X</span>
      <button 
        onClick={onSaveProject}
        className="px-3 py-1 bg-modeler-accent-primary hover:bg-modeler-accent-primary/80 rounded text-sm"
        title="Save Project to .json"
      >
        Save Project
      </button>
      <button 
        onClick={onLoadProject}
        className="px-3 py-1 bg-modeler-control-button-DEFAULT hover:bg-modeler-control-button-hover rounded text-sm"
        title="Load Project from .json"
      >
        Load Project
      </button>
      <button 
        onClick={onSaveSTEP}
        className="px-3 py-1 bg-modeler-accent-success hover:bg-modeler-accent-success/80 rounded text-sm"
        title="Save STEP"
      >
        Save STEP
      </button>
      <button 
        onClick={onSaveSTL}
        className="px-3 py-1 bg-modeler-accent-success hover:bg-modeler-accent-success/80 rounded text-sm"
        title="Save STL"
      >
        Save STL
      </button>
      <button 
        onClick={onSaveOBJ}
        className="px-3 py-1 bg-modeler-accent-success hover:bg-modeler-accent-success/80 rounded text-sm"
        title="Save OBJ"
      >
        Save OBJ
      </button>
      {!isCADWorkerReady && (
        <span className="text-modeler-accent-warning text-sm">
          • Loading CAD Kernel...
        </span>
      )}
      {isCADWorkerReady && (
        <span className="text-modeler-accent-success text-sm">
          • CAD Kernel Ready
        </span>
      )}
    </div>
  );
};

export default Header; 