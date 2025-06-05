import React from 'react';

interface FeatureParityStatusProps {
  visible: boolean;
}

export function FeatureParityStatus({ visible }: FeatureParityStatusProps) {
  if (!visible) return null;

  const features = [
    { name: 'TransformControls', status: 'implemented', progress: 100 },
    { name: 'Multi-Selection', status: 'implemented', progress: 100 },
    { name: 'Keyboard Shortcuts', status: 'implemented', progress: 100 },
    { name: 'PWA Service Worker', status: 'enhanced', progress: 100 },
    { name: 'Camera Controls', status: 'implemented', progress: 100 },
    { name: 'Offline Functionality', status: 'enhanced', progress: 100 },
  ];

  const overallProgress = Math.round(
    features.reduce((sum, f) => sum + f.progress, 0) / features.length
  );

  return (
    <div className="fixed top-4 right-4 z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Feature Parity</h3>
        <span className="text-lg font-bold text-green-600">{overallProgress}%</span>
      </div>
      
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="truncate">{feature.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${feature.progress}%` }}
                />
              </div>
              <span className={`text-xs px-1 py-0.5 rounded ${
                feature.status === 'implemented' ? 'bg-green-100 text-green-800' :
                feature.status === 'enhanced' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {feature.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          CascadeStudio Parity: Complete ✓
        </div>
      </div>
    </div>
  );
}
