import { useState } from 'react';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { 
  MoveHorizontal, 
  RotateCw, 
  Maximize, 
  Globe,
  Box,
  Eye,
  EyeOff 
} from 'lucide-react';

interface TransformControlsUIProps {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'local' | 'world';
  visible: boolean;
  enabled: boolean;
  onModeChange: (mode: 'translate' | 'rotate' | 'scale') => void;
  onSpaceChange: (space: 'local' | 'world') => void;
  onVisibilityChange: (visible: boolean) => void;
  selectedObjectName?: string;
}

export function TransformControlsUI({
  mode,
  space,
  visible,
  enabled,
  onModeChange,
  onSpaceChange,
  onVisibilityChange,
  selectedObjectName
}: TransformControlsUIProps) {
  if (!selectedObjectName) {
    return null;
  }

  return (
    <div className="transform-controls-ui bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      {/* 選択オブジェクト情報 */}
      <div className="mb-2 text-sm text-gray-600">
        {selectedObjectName ? (
          <span>選択中: {selectedObjectName}</span>
        ) : (
          <span>オブジェクトが選択されていません</span>
        )}
      </div>
      
      {/* モード切り替えボタン */}
      <div className="flex gap-1 mb-2">
        <Button
          variant={mode === 'translate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('translate')}
          disabled={!enabled}
          title="移動モード (G)"
        >
          <MoveHorizontal className="w-4 h-4" />
        </Button>
        
        <Button
          variant={mode === 'rotate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('rotate')}
          disabled={!enabled}
          title="回転モード (R)"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        
        <Button
          variant={mode === 'scale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('scale')}
          disabled={!enabled}
          title="スケールモード (S)"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
      
      {/* 空間切り替えボタン */}
      <div className="flex gap-1 mb-2">
        <Button
          variant={space === 'world' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('world')}
          disabled={!enabled}
          title="ワールド空間"
        >
          <Globe className="w-4 h-4" />
          <span className="ml-1">ワールド</span>
        </Button>
        
        <Button
          variant={space === 'local' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSpaceChange('local')}
          disabled={!enabled}
          title="ローカル空間"
        >
          <Box className="w-4 h-4" />
          <span className="ml-1">ローカル</span>
        </Button>
      </div>
      
      {/* 表示切り替え */}
      <div className="flex items-center gap-2">
        <Toggle
          pressed={visible}
          onPressedChange={onVisibilityChange}
          disabled={!enabled}
          size="sm"
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="ml-1">ギズモ表示</span>
        </Toggle>
      </div>
      
      {/* キーボードショートカットヒント */}
      <div className="mt-2 text-xs text-gray-500">
        <div>G: 移動 | R: 回転 | S: スケール</div>
        <div>Esc: 選択解除</div>
      </div>
    </div>
  );
} 