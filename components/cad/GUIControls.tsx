'use client';

import React, { useEffect, useCallback } from 'react';
import { useCADWorker } from '../../hooks/useCADWorker';
import { useGUIState } from '../../hooks/useGUIState';
import CADSlider from './gui/CADSlider';
import CADButton from './gui/CADButton';
import CADCheckbox from './gui/CADCheckbox';

interface GUIControlsProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

export default function GUIControls({ cadWorkerState }: GUIControlsProps) {
  const guiState = useGUIState();

  // GUI要素の初期化
  useEffect(() => {
    // サンプルGUI要素を登録
    guiState.registerElement('slider', 'width', 10, { min: 1, max: 50, step: 0.5 });
    guiState.registerElement('slider', 'height', 10, { min: 1, max: 50, step: 0.5 });
    guiState.registerElement('slider', 'depth', 10, { min: 1, max: 50, step: 0.5 });
    guiState.registerElement('slider', 'radius', 5, { min: 0.5, max: 25, step: 0.1 });
    guiState.registerElement('slider', 'segments', 32, { min: 8, max: 64, step: 1 });
    guiState.registerElement('checkbox', 'centered', true, {});
    guiState.registerElement('checkbox', 'wireframe', false, {});
    guiState.registerElement('checkbox', 'autoUpdate', true, {});
  }, []);

  // GUI値変更時のCADコード実行
  const handleGUIUpdate = useCallback((values: Record<string, any>) => {
    if (!cadWorkerState.isWorkerReady) return;

    // 自動更新が無効な場合は実行しない
    if (!values.autoUpdate) return;

    // GUI値を使用したCADコード生成
    const cadCode = `
      // GUI制御によるパラメトリックCAD
      console.log('🎛️ GUI更新:', ${JSON.stringify(values)});
      
      try {
        // 基本形状の生成
        const width = ${values.width || 10};
        const height = ${values.height || 10};
        const depth = ${values.depth || 10};
        const radius = ${values.radius || 5};
        const centered = ${values.centered || true};
        
        // 複数形状の生成
        const box = Box(width, height, depth, centered);
        const sphere = Sphere(radius);
        const cylinder = Cylinder(radius * 0.8, height * 1.2, centered);
        
        // 配置とブール演算
        const translatedSphere = Translate([width * 0.3, 0, 0], [sphere]);
        const translatedCylinder = Translate([-width * 0.3, 0, 0], [cylinder]);
        
        // 複合形状の作成
        const union = Union([box, translatedSphere]);
        const result = Difference(union, [translatedCylinder]);
        
        console.log('✅ GUI制御CAD生成完了');
        
      } catch (error) {
        console.error('❌ GUI制御CADエラー:', error);
      }
    `;

    cadWorkerState.executeCADCode(cadCode);
  }, [cadWorkerState]);

  // GUI更新コールバックの設定
  useEffect(() => {
    guiState.setOnUpdate(handleGUIUpdate);
  }, [handleGUIUpdate]);

  // ボタンクリック処理
  const handleButtonClick = useCallback((name: string) => {
    switch (name) {
      case '更新':
        guiState.triggerUpdate();
        break;
      case 'リセット':
        guiState.resetValues();
        break;
      case 'サンプル1':
        cadWorkerState.executeCADCode(`
          // サンプル1: 基本形状
          const box = Box(15, 15, 15, true);
          const sphere = Sphere(10);
          const result = Difference(box, [sphere]);
        `);
        break;
      case 'サンプル2':
        cadWorkerState.executeCADCode(`
          // サンプル2: 複合形状
          const cylinder = Cylinder(8, 20, true);
          const cone = Cone(6, 15, true);
          const translated = Translate([0, 0, 10], [cone]);
          const result = Union([cylinder, translated]);
        `);
        break;
      default:
        console.log('ボタンクリック:', name);
    }
  }, [guiState, cadWorkerState]);

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">🎛️ GUI制御</h3>
          <div className="badge badge-info">パラメトリック</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/70">
            {guiState.elementCount} 要素
          </span>
        </div>
      </div>

      {/* 制御設定 */}
      <div className="mb-4 p-3 bg-base-200 rounded border">
        <div className="flex items-center justify-between">
          <CADCheckbox
            name="autoUpdate"
            defaultValue={guiState.getValue('autoUpdate', true)}
            onChange={(name, value) => {
              guiState.updateValue(name, value);
              guiState.setIsAutoUpdate(value);
            }}
            label="自動更新"
            color="success"
          />
          <div className="flex gap-2">
            <CADButton
              name="更新"
              onClick={handleButtonClick}
              variant="primary"
              size="xs"
              icon="🔄"
              disabled={guiState.getValue('autoUpdate', true)}
            />
            <CADButton
              name="リセット"
              onClick={handleButtonClick}
              variant="outline"
              size="xs"
              icon="🔄"
            />
          </div>
        </div>
      </div>

      {/* 寸法制御 */}
      <div className="mb-4">
        <h4 className="font-medium mb-3 text-sm text-base-content/80">📏 寸法制御</h4>
        <div className="space-y-3">
          <CADSlider
            name="width"
            defaultValue={guiState.getValue('width', 10)}
            min={1}
            max={50}
            step={0.5}
            onChange={guiState.updateValue}
          />
          <CADSlider
            name="height"
            defaultValue={guiState.getValue('height', 10)}
            min={1}
            max={50}
            step={0.5}
            onChange={guiState.updateValue}
          />
          <CADSlider
            name="depth"
            defaultValue={guiState.getValue('depth', 10)}
            min={1}
            max={50}
            step={0.5}
            onChange={guiState.updateValue}
          />
          <CADSlider
            name="radius"
            defaultValue={guiState.getValue('radius', 5)}
            min={0.5}
            max={25}
            step={0.1}
            onChange={guiState.updateValue}
          />
        </div>
      </div>

      {/* 品質制御 */}
      <div className="mb-4">
        <h4 className="font-medium mb-3 text-sm text-base-content/80">⚙️ 品質制御</h4>
        <div className="space-y-3">
          <CADSlider
            name="segments"
            defaultValue={guiState.getValue('segments', 32)}
            min={8}
            max={64}
            step={1}
            onChange={guiState.updateValue}
          />
        </div>
      </div>

      {/* 表示オプション */}
      <div className="mb-4">
        <h4 className="font-medium mb-3 text-sm text-base-content/80">👁️ 表示オプション</h4>
        <div className="space-y-2">
          <CADCheckbox
            name="centered"
            defaultValue={guiState.getValue('centered', true)}
            onChange={guiState.updateValue}
            label="中央配置"
          />
          <CADCheckbox
            name="wireframe"
            defaultValue={guiState.getValue('wireframe', false)}
            onChange={guiState.updateValue}
            label="ワイヤーフレーム"
            color="accent"
          />
        </div>
      </div>

      {/* サンプルボタン */}
      <div className="pt-4 border-t border-base-300">
        <h4 className="font-medium mb-3 text-sm text-base-content/80">🎯 サンプル</h4>
        <div className="grid grid-cols-2 gap-2">
          <CADButton
            name="サンプル1"
            onClick={handleButtonClick}
            variant="outline"
            size="xs"
            icon="🔧"
          />
          <CADButton
            name="サンプル2"
            onClick={handleButtonClick}
            variant="outline"
            size="xs"
            icon="🎨"
          />
        </div>
      </div>

      {/* 状態表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-base-300">
          <details className="collapse collapse-arrow">
            <summary className="collapse-title text-sm font-medium">
              🔧 GUI状態
            </summary>
            <div className="collapse-content">
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto bg-base-200 p-2 rounded">
                <div><strong>要素数:</strong> {guiState.elementCount}</div>
                <div><strong>自動更新:</strong> {guiState.isAutoUpdate ? 'ON' : 'OFF'}</div>
                <div><strong>値:</strong></div>
                <pre className="text-xs">{JSON.stringify(guiState.values, null, 2)}</pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 