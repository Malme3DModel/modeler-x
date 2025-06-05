'use client';

import React, { useRef } from 'react';

interface TopNavigationProps {
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onSaveSTEP?: () => void;
  onSaveSTL?: () => void;
  onSaveOBJ?: () => void;
  onLoadFiles?: (files: FileList) => void;
  onClearFiles?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onSaveProject,
  onLoadProject,
  onSaveSTEP,
  onSaveSTL,
  onSaveOBJ,
  onLoadFiles,
  onClearFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onLoadFiles) {
      onLoadFiles(files);
    }
  };

  return (
    <nav className="bg-gray-900 text-white overflow-hidden">
      <div className="flex">
        <a
          href="https://github.com/zalo/CascadeStudio"
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Cascade Studio 0.0.7 (Next.js)
        </a>
        <button
          title="Save Project to .json"
          onClick={onSaveProject}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Save Project
        </button>
        <button
          title="Load Project from .json"
          onClick={onLoadProject}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Load Project
        </button>
        <button
          onClick={onSaveSTEP}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Save STEP
        </button>
        <button
          onClick={onSaveSTL}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Save STL
        </button>
        <button
          onClick={onSaveOBJ}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Save OBJ
        </button>
        <button
          title="Import STEP, IGES, or (ASCII) STL from File"
          onClick={handleFileClick}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Import STEP/IGES/STL
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".iges,.step,.igs,.stp,.stl"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          title="Clears the external step/iges/stl files stored in the project."
          onClick={onClearFiles}
          className="float-left text-gray-200 text-center px-4 py-1 text-sm font-mono hover:bg-gray-600 hover:text-black"
        >
          Clear Imported Files
        </button>
      </div>
    </nav>
  );
};

export default TopNavigation; 