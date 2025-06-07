import React from 'react';
import { 
  FileText, 
  Search, 
  GitBranch, 
  Play, 
  Package, 
  Settings,
  Layers3
} from 'lucide-react';

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange }) => {
  const activities = [
    { id: 'explorer', icon: FileText, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'scm', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Package, label: 'Extensions' },
    { id: 'cad', icon: Layers3, label: 'CAD Tools' },
  ];

  return (
    <div className="w-12 bg-modeler-background-secondary border-r border-modeler-control-border flex flex-col">
      {/* Activity buttons */}
      <div className="flex-1">
        {activities.map((activity) => {
          const Icon = activity.icon;
          const isActive = activeView === activity.id;
          
          return (
            <button
              key={activity.id}
              onClick={() => onViewChange(activity.id)}
              className={`
                w-12 h-12 flex items-center justify-center relative
                transition-colors duration-150
                ${isActive 
                  ? 'text-modeler-control-text-primary bg-modeler-control-button-active' 
                  : 'text-modeler-control-text-secondary hover:text-modeler-control-text-primary hover:bg-modeler-control-button-hover'
                }
              `}
              title={activity.label}
            >
              <Icon size={20} />
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-modeler-accent-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="border-t border-modeler-control-border">
        <button
          onClick={() => onViewChange('settings')}
          className={`
            w-12 h-12 flex items-center justify-center
            transition-colors duration-150
            ${activeView === 'settings'
              ? 'text-modeler-control-text-primary bg-modeler-control-button-active'
              : 'text-modeler-control-text-secondary hover:text-modeler-control-text-primary hover:bg-modeler-control-button-hover'
            }
          `}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;
