'use client';

import React, { createContext, useContext, useRef, useEffect } from 'react';
import { ProjectManager } from '../lib/project/ProjectManager';
import { SelectionManager } from '../lib/selection/SelectionManager';
import { HistoryManager } from '../lib/cad/HistoryManager';
import { GroupManager } from '../lib/cad/GroupManager';
import { KeyboardShortcutManager } from '../lib/gui/KeyboardShortcutManager';
import { useCADWorker } from '../hooks/useCADWorker';

interface AppContextType {
  projectManager: typeof ProjectManager;
  cadEngine: ReturnType<typeof useCADWorker>;
  selectionManager: SelectionManager;
  transformManager: {
    setMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    cancel: () => void;
  };
  historyManager: HistoryManager;
  groupManager: GroupManager;
  keyboardManager: KeyboardShortcutManager;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const cadEngine = useCADWorker();
  const selectionManagerRef = useRef(new SelectionManager());
  const historyManagerRef = useRef(new HistoryManager());
  const groupManagerRef = useRef(new GroupManager());
  const keyboardManagerRef = useRef(new KeyboardShortcutManager());

  const transformManager = {
    setMode: (mode: 'translate' | 'rotate' | 'scale') => {
      document.dispatchEvent(new CustomEvent('transform-mode-change', { 
        detail: { mode } 
      }));
    },
    cancel: () => {
      document.dispatchEvent(new CustomEvent('transform-cancel'));
    }
  };

  const contextValue: AppContextType = {
    projectManager: ProjectManager,
    cadEngine,
    selectionManager: selectionManagerRef.current,
    transformManager,
    historyManager: historyManagerRef.current,
    groupManager: groupManagerRef.current,
    keyboardManager: keyboardManagerRef.current,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
