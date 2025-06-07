import React from 'react';
import { GitBranch, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface StatusBarProps {
  isCADWorkerReady: boolean;
  hasUnsavedChanges: boolean;
  projectName: string;
  currentBranch?: string;
  errors?: number;
  warnings?: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
  isCADWorkerReady,
  hasUnsavedChanges,
  projectName,
  currentBranch = 'main',
  errors = 0,
  warnings = 0
}) => {
  return (
    <div className="h-6 bg-modeler-statusBar-background text-modeler-statusBar-foreground flex items-center justify-between px-2 text-xs">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Git branch */}
        <div className="flex items-center space-x-1 hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
          <GitBranch size={12} />
          <span>{currentBranch}</span>
        </div>

        {/* Errors and warnings */}
        {(errors > 0 || warnings > 0) && (
          <div className="flex items-center space-x-2">
            {errors > 0 && (
              <div className="flex items-center space-x-1 text-red-300">
                <AlertCircle size={12} />
                <span>{errors}</span>
              </div>
            )}
            {warnings > 0 && (
              <div className="flex items-center space-x-1 text-yellow-300">
                <AlertCircle size={12} />
                <span>{warnings}</span>
              </div>
            )}
          </div>
        )}

        {/* CAD Worker Status */}
        <div className="flex items-center space-x-1">
          {isCADWorkerReady ? (
            <>
              <CheckCircle size={12} className="text-green-300" />
              <span>CAD Ready</span>
            </>
          ) : (
            <>
              <Zap size={12} className="text-yellow-300" />
              <span>Loading CAD...</span>
            </>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Project status */}
        <div className="flex items-center space-x-2">
          <span>{projectName}</span>
          {hasUnsavedChanges && (
            <span className="text-yellow-300">●</span>
          )}
        </div>

        {/* Language mode */}
        <div className="hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
          TypeScript
        </div>

        {/* Encoding */}
        <div className="hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
          UTF-8
        </div>

        {/* Line ending */}
        <div className="hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
          LF
        </div>

        {/* Cursor position */}
        <div className="hover:bg-white/10 px-1 py-0.5 rounded cursor-pointer">
          Ln 1, Col 1
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
