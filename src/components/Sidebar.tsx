import React from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  isVisible: boolean;
  width?: number;
}

interface FileTreeItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
  isOpen?: boolean;
}

const FileTreeNode: React.FC<{ 
  item: FileTreeItem; 
  level: number;
  onToggle?: (path: string) => void;
}> = ({ item, level, onToggle }) => {
  const paddingLeft = level * 16 + 8;
  
  return (
    <div>
      <div 
        className="flex items-center h-6 text-sm text-modeler-sideBar-foreground hover:text-modeler-sideBar-foreground hover:bg-modeler-activityBar-activeBackground cursor-pointer"
        style={{ paddingLeft }}
        onClick={() => item.type === 'folder' && onToggle?.(item.name)}
      >
        {item.type === 'folder' && (
          <div className="w-4 h-4 flex items-center justify-center mr-1">
            {item.isOpen ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </div>
        )}
        <div className="w-4 h-4 flex items-center justify-center mr-2">
          {item.type === 'folder' ? (
            item.isOpen ? <FolderOpen size={14} /> : <Folder size={14} />
          ) : (
            <File size={14} />
          )}
        </div>
        <span className="truncate">{item.name}</span>
      </div>
      {item.type === 'folder' && item.isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeNode 
              key={index} 
              item={child} 
              level={level + 1}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ExplorerView: React.FC = () => {
  const [fileTree, setFileTree] = React.useState<FileTreeItem[]>([
    {
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        {
          name: 'components',
          type: 'folder',
          isOpen: true,
          children: [
            { name: 'MonacoEditor.tsx', type: 'file' },
            { name: 'ThreeViewport.tsx', type: 'file' },
            { name: 'DockviewLayout.tsx', type: 'file' },
          ]
        },
        {
          name: 'app',
          type: 'folder',
          isOpen: false,
          children: [
            { name: 'page.tsx', type: 'file' },
            { name: 'layout.tsx', type: 'file' },
          ]
        }
      ]
    },
    {
      name: 'public',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'workers', type: 'folder' },
        { name: 'opencascade', type: 'folder' },
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ]);

  const handleToggle = (path: string) => {
    setFileTree(prev => prev.map(item => 
      item.name === path 
        ? { ...item, isOpen: !item.isOpen }
        : item
    ));
  };

  return (
    <div className="h-full">
      <div className="p-2 text-xs font-semibold text-modeler-sideBar-foreground uppercase tracking-wide border-b border-modeler-sideBar-border">
        Explorer
      </div>
      <div className="p-1">
        <div className="mb-2">
          <div className="flex items-center text-xs font-semibold text-modeler-sideBar-foreground mb-1">
            <ChevronDown size={12} className="mr-1" />
            MODELER-X
          </div>
          <div className="ml-2">
            {fileTree.map((item, index) => (
              <FileTreeNode 
                key={index} 
                item={item} 
                level={0}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CADToolsView: React.FC = () => {
  const cadFunctions = [
    { category: 'Basic Shapes', items: ['Box', 'Sphere', 'Cylinder', 'Cone'] },
    { category: 'Transforms', items: ['Translate', 'Rotate', 'Scale', 'Mirror'] },
    { category: 'Boolean Ops', items: ['Union', 'Difference', 'Intersection'] },
    { category: 'GUI Controls', items: ['Slider', 'Checkbox', 'TextInput', 'Dropdown'] },
  ];

  return (
    <div className="h-full">
      <div className="p-2 text-xs font-semibold text-modeler-sideBar-foreground uppercase tracking-wide border-b border-modeler-sideBar-border">
        CAD Tools
      </div>
      <div className="p-2">
        {cadFunctions.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="text-xs font-semibold text-modeler-sideBar-foreground mb-2">
              {category.category}
            </div>
            <div className="space-y-1">
              {category.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex}
                  className="text-sm text-modeler-control-text-secondary hover:text-modeler-sideBar-foreground hover:bg-modeler-activityBar-activeBackground px-2 py-1 rounded cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, isVisible, width = 240 }) => {
  if (!isVisible) return null;

  const renderContent = () => {
    switch (activeView) {
      case 'explorer':
        return <ExplorerView />;
      case 'cad':
        return <CADToolsView />;
      case 'search':
        return (
          <div className="p-4 text-modeler-control-text-secondary">
            <div className="text-xs font-semibold text-modeler-sideBar-foreground uppercase tracking-wide mb-4">
              Search
            </div>
            <input 
              type="text" 
              placeholder="Search files..."
              className="w-full px-3 py-2 bg-modeler-control-base border border-modeler-sideBar-border rounded text-sm text-modeler-sideBar-foreground placeholder-modeler-control-text-secondary focus:outline-none focus:border-modeler-accent-link"
            />
          </div>
        );
      case 'scm':
        return (
          <div className="p-4 text-modeler-control-text-secondary">
            <div className="text-xs font-semibold text-modeler-sideBar-foreground uppercase tracking-wide mb-4">
              Source Control
            </div>
            <div className="text-sm">No changes detected</div>
          </div>
        );
      default:
        return (
          <div className="p-4 text-modeler-control-text-secondary">
            <div className="text-sm">Select a view from the activity bar</div>
          </div>
        );
    }
  };

  return (
    <div 
      className="bg-modeler-sideBar-background border-r border-modeler-sideBar-border flex flex-col"
      style={{ width }}
    >
      {renderContent()}
    </div>
  );
};

export default Sidebar;
