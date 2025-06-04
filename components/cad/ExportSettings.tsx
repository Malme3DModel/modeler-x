import React, { useState, useEffect } from 'react';

export type ExportFormat = 'step' | 'stl' | 'obj';

export interface ExportSettingsValues {
  format: ExportFormat;
  quality: number; // メッシュ分割精度（0.01〜1.0）
  binaryStl: boolean; // STL用: バイナリ/アスキー
  includeNormals: boolean; // OBJ用: 法線を含める
}

interface ExportSettingsProps {
  format: ExportFormat;
  initialValues?: Partial<ExportSettingsValues>;
  onChange: (values: ExportSettingsValues) => void;
}

const defaultValues: ExportSettingsValues = {
  format: 'stl',
  quality: 0.1,
  binaryStl: true,
  includeNormals: true,
};

// 品質プリセット
const qualityPresets = [
  { label: '高品質', value: 0.01, description: '非常に滑らか（ファイルサイズ大）' },
  { label: '標準', value: 0.05, description: 'バランスの取れた品質' },
  { label: '低品質', value: 0.1, description: '高速処理（ファイルサイズ小）' },
  { label: 'ドラフト', value: 0.5, description: 'プレビュー用' },
];

const ExportSettings: React.FC<ExportSettingsProps> = ({ format, initialValues, onChange }) => {
  const [quality, setQuality] = useState(initialValues?.quality ?? defaultValues.quality);
  const [binaryStl, setBinaryStl] = useState(initialValues?.binaryStl ?? defaultValues.binaryStl);
  const [includeNormals, setIncludeNormals] = useState(initialValues?.includeNormals ?? defaultValues.includeNormals);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // 品質値からプリセットを判定
  useEffect(() => {
    const preset = qualityPresets.find(p => Math.abs(p.value - quality) < 0.001);
    setSelectedPreset(preset ? preset.label : null);
  }, [quality]);

  // 設定値が変わったら親に通知
  useEffect(() => {
    onChange({
      format,
      quality,
      binaryStl,
      includeNormals,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality, binaryStl, includeNormals]);

  // プリセット選択ハンドラー
  const handlePresetSelect = (presetValue: number) => {
    setQuality(presetValue);
  };

  // 推定ポリゴン数の計算（簡易的な目安）
  const estimatePolygonCount = (quality: number): string => {
    const baseCount = 10000; // 基準となるポリゴン数
    const factor = 0.01 / quality; // 品質に反比例
    const estimated = Math.round(baseCount * factor);
    
    if (estimated > 1000000) {
      return `約${(estimated / 1000000).toFixed(1)}M`;
    } else if (estimated > 1000) {
      return `約${(estimated / 1000).toFixed(0)}K`;
    }
    return `約${estimated}`;
  };

  return (
    <div className="space-y-4">
      {(format === 'stl' || format === 'obj') && (
        <>
          {/* 品質プリセット */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              品質プリセット
            </label>
            <div className="grid grid-cols-2 gap-2">
              {qualityPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`p-2 rounded text-sm transition-colors ${
                    selectedPreset === preset.label
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 hover:bg-base-300'
                  }`}
                  title={preset.description}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.value}mm</div>
                </button>
              ))}
            </div>
          </div>

          {/* カスタム品質設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              カスタム品質設定
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.01}
                max={1.0}
                step={0.01}
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="flex-1"
                title="分割精度を調整"
              />
              <input
                type="number"
                min={0.01}
                max={1.0}
                step={0.01}
                value={quality}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val >= 0.01 && val <= 1.0) {
                    setQuality(val);
                  }
                }}
                className="w-20 px-2 py-1 bg-base-200 rounded text-sm"
                title="数値を直接入力"
              />
              <span className="text-sm">mm</span>
            </div>
            
            {/* 品質情報 */}
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              <div>推定ポリゴン数: {estimatePolygonCount(quality)}</div>
              <div>
                {quality <= 0.01 ? '非常に高品質 - 詳細な形状に最適' :
                 quality <= 0.05 ? '高品質 - 一般的な用途に推奨' :
                 quality <= 0.1 ? '標準品質 - バランスの取れた選択' :
                 quality <= 0.5 ? 'ドラフト品質 - プレビュー用' :
                 '低品質 - 高速処理'}
              </div>
            </div>
          </div>
        </>
      )}

      {format === 'stl' && (
        <div className="space-y-3">
          <div className="divider"></div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              STL形式オプション
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={binaryStl}
                  onChange={e => setBinaryStl(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">バイナリ形式で出力</span>
              </label>
              <div className="text-xs text-gray-400 ml-6">
                {binaryStl 
                  ? 'ファイルサイズが小さく、読み込みが高速（推奨）' 
                  : 'テキスト形式で人間が読める形式'}
              </div>
            </div>
          </div>
        </div>
      )}

      {format === 'obj' && (
        <div className="space-y-3">
          <div className="divider"></div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OBJ形式オプション
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNormals}
                  onChange={e => setIncludeNormals(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">法線情報を含める</span>
              </label>
              <div className="text-xs text-gray-400 ml-6">
                {includeNormals 
                  ? 'スムーズシェーディングに必要（推奨）' 
                  : 'ファイルサイズを削減'}
              </div>
            </div>
          </div>
        </div>
      )}

      {format === 'step' && (
        <div className="text-sm text-gray-400">
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>STEPファイルは元のCAD形状を保持します。メッシュ化は行われません。</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportSettings; 