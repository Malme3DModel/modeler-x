import { useEffect } from 'react';
import { useComprehensiveKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export function KeyboardShortcutIntegration() {
  useComprehensiveKeyboardShortcuts();

  useEffect(() => {
    const handleSelectAll = () => {
      document.dispatchEvent(new CustomEvent('selection-select-all-execute'));
    };

    const handleSelectionInvert = () => {
      document.dispatchEvent(new CustomEvent('selection-invert-execute'));
    };

    const handleSelectionDelete = () => {
      const event = new CustomEvent('selection-delete-execute');
      document.dispatchEvent(event);
    };

    const handleProjectOpen = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const projectData = JSON.parse(event.target?.result as string);
              document.dispatchEvent(new CustomEvent('project-load', { detail: projectData }));
            } catch (error) {
              console.error('Failed to load project:', error);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };

    const handleProjectSave = () => {
      document.dispatchEvent(new CustomEvent('project-save-current'));
    };

    const handleProjectSaveAs = () => {
      document.dispatchEvent(new CustomEvent('project-save-as-current'));
    };

    document.addEventListener('selection-select-all', handleSelectAll);
    document.addEventListener('selection-invert', handleSelectionInvert);
    document.addEventListener('selection-delete', handleSelectionDelete);
    document.addEventListener('project-open-dialog', handleProjectOpen);
    document.addEventListener('project-save-dialog', handleProjectSave);
    document.addEventListener('project-save-as-dialog', handleProjectSaveAs);

    return () => {
      document.removeEventListener('selection-select-all', handleSelectAll);
      document.removeEventListener('selection-invert', handleSelectionInvert);
      document.removeEventListener('selection-delete', handleSelectionDelete);
      document.removeEventListener('project-open-dialog', handleProjectOpen);
      document.removeEventListener('project-save-dialog', handleProjectSave);
      document.removeEventListener('project-save-as-dialog', handleProjectSaveAs);
    };
  }, []);

  return null;
}
