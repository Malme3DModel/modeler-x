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

const ExportSettings: React.FC<ExportSettingsProps> = ({ format, initialValues, onChange }) => {
  const [quality, setQuality] = useState(initialValues?.quality ?? defaultValues.quality);
  const [binaryStl, setBinaryStl] = useState(initialValues?.binaryStl ?? defaultValues.binaryStl);
  const [includeNormals, setIncludeNormals] = useState(initialValues?.includeNormals ?? defaultValues.includeNormals);

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

  return (
    <div className="space-y-4">
      {(format === 'stl' || format === 'obj') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            分割精度（低 <span className="mx-1">0.01</span> 〜 高 <span className="mx-1">1.0</span>）
          </label>
          <input
            type="range"
            min={0.01}
            max={1.0}
            step={0.01}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            className="w-full"
            title="分割精度を調整"
            placeholder="分割精度"
          />
          <div className="text-xs text-gray-400 mt-1">現在値: {quality}</div>
        </div>
      )}
      {format === 'stl' && (
        <div className="flex items-center space-x-2">
          <input
            id="binary-stl"
            type="checkbox"
            checked={binaryStl}
            onChange={e => setBinaryStl(e.target.checked)}
          />
          <label htmlFor="binary-stl" className="text-sm text-gray-300">バイナリ形式で出力（推奨）</label>
        </div>
      )}
      {format === 'obj' && (
        <div className="flex items-center space-x-2">
          <input
            id="include-normals"
            type="checkbox"
            checked={includeNormals}
            onChange={e => setIncludeNormals(e.target.checked)}
          />
          <label htmlFor="include-normals" className="text-sm text-gray-300">法線を含める</label>
        </div>
      )}
    </div>
  );
};

export default ExportSettings; 