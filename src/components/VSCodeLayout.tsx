import React, { useState } from 'react';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import DockviewLayout from './DockviewLayout';

interface VSCodeLayoutProps {
  leftPanel: React.ReactNode;
  rightTopPanel: React.ReactNode;
  rightBottomPanel: React.ReactNode;
  editorTitle?: string;
  isCADWorkerReady: boolean;
  hasUnsavedChanges: boolean;
  projectName: string;
}

const VSCodeLayout: React.FC<VSCodeLayoutProps> = ({
  leftPanel,
  rightTopPanel,
  rightBottomPanel,
  editorTitle,
  isCADWorkerReady,
  hasUnsavedChanges,
  projectName
}) => {
  const [activeView, setActiveView] = useState('explorer');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth] = useState(240);

  const handleViewChange = (view: string) => {
    if (activeView === view && sidebarVisible) {
      setSidebarVisible(false);
    } else {
      setActiveView(view);
      setSidebarVisible(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-modeler-background-primary">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar 
          activeView={activeView}
          onViewChange={handleViewChange}
        />

        {/* Sidebar */}
        <Sidebar 
          activeView={activeView}
          isVisible={sidebarVisible}
          width={sidebarWidth}
        />

        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dockview layout for editor and panels */}
          <div className="flex-1 overflow-hidden">
            <DockviewLayout
              leftPanel={leftPanel}
              rightTopPanel={rightTopPanel}
              rightBottomPanel={rightBottomPanel}
              editorTitle={editorTitle}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar 
        isCADWorkerReady={isCADWorkerReady}
        hasUnsavedChanges={hasUnsavedChanges}
        projectName={projectName}
        currentBranch="main"
        errors={0}
        warnings={0}
      />
    </div>
  );
};

export default VSCodeLayout;
