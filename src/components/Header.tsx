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
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        title="Save Project to .json"
      >
        Save Project
      </button>
      <button 
        onClick={onLoadProject}
        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
        title="Load Project from .json"
      >
        Load Project
      </button>
      <button 
        onClick={onSaveSTEP}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        title="Save STEP"
      >
        Save STEP
      </button>
      <button 
        onClick={onSaveSTL}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        title="Save STL"
      >
        Save STL
      </button>
      <button 
        onClick={onSaveOBJ}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        title="Save OBJ"
      >
        Save OBJ
      </button>
      {!isCADWorkerReady && (
        <span className="text-yellow-400 text-sm">
          • Loading CAD Kernel...
        </span>
      )}
      {isCADWorkerReady && (
        <span className="text-green-400 text-sm">
          • CAD Kernel Ready
        </span>
      )}
    </div>
  );
};

export default Header; 