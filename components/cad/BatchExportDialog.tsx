'use client';

import { useState, useCallback, useEffect } from 'react';
import { useBatchExport, ExportItem, ExportFormat } from '@/hooks/useBatchExport';
import { XMarkIcon, DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFileName?: string;
}

export default function BatchExportDialog({ 
  isOpen, 
  onClose,
  defaultFileName = 'model'
}: BatchExportDialogProps) {
  const {
    startBatchExport,
    cancelBatchExport,
    progress,
    results,
    errors,
    isExporting,
    currentItem,
  } = useBatchExport();

  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(
    new Set<ExportFormat>(['step', 'stl'] as ExportFormat[])
  );
  const [baseFileName, setBaseFileName] = useState(defaultFileName);
  const [quality, setQuality] = useState(0.1);
  const [binaryStl, setBinaryStl] = useState(true);
  const [includeNormals, setIncludeNormals] = useState(true);

  // ダイアログが開かれたときにアイテムリストを初期化
  useEffect(() => {
    if (isOpen) {
      const items: ExportItem[] = [];
      const formats = Array.from(selectedFormats);
      
      formats.forEach((format) => {
        items.push({
          id: `${baseFileName}-${format}`,
          fileName: `${baseFileName}.${format}`,
          format,
          settings: {
            quality,
            binaryStl,
            includeNormals,
          },
        });
      });
      
      setExportItems(items);
    }
  }, [isOpen, selectedFormats, baseFileName, quality, binaryStl, includeNormals]);

  const handleFormatToggle = (format: ExportFormat) => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setSelectedFormats(newFormats);
  };

  const handleStartExport = async () => {
    if (exportItems.length === 0) {
      alert('エクスポートする形式を選択してください');
      return;
    }
    
    await startBatchExport(exportItems);
  };

  const handleClose = () => {
    if (isExporting) {
      if (confirm('エクスポートを中断してよろしいですか？')) {
        cancelBatchExport();
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DocumentArrowDownIcon className="w-6 h-6" />
            バッチエクスポート
          </h2>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={isExporting}
            title="ダイアログを閉じる"
            aria-label="ダイアログを閉じる"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!isExporting ? (
            <>
              {/* ファイル名設定 */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text">基本ファイル名</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={baseFileName}
                  onChange={(e) => setBaseFileName(e.target.value)}
                  placeholder="ファイル名を入力"
                />
              </div>

              {/* エクスポート形式選択 */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text">エクスポート形式</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-2"
                      checked={selectedFormats.has('step')}
                      onChange={() => handleFormatToggle('step')}
                    />
                    <span className="label-text">STEP (.step)</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-2"
                      checked={selectedFormats.has('stl')}
                      onChange={() => handleFormatToggle('stl')}
                    />
                    <span className="label-text">STL (.stl)</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-2"
                      checked={selectedFormats.has('obj')}
                      onChange={() => handleFormatToggle('obj')}
                    />
                    <span className="label-text">OBJ (.obj)</span>
                  </label>
                </div>
              </div>

              {/* STL/OBJ設定 */}
              {(selectedFormats.has('stl') || selectedFormats.has('obj')) && (
                <div className="mb-6 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-medium mb-3">エクスポート設定</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="label">
                        <span className="label-text">品質 (分割精度)</span>
                      </label>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        title="エクスポート品質を選択"
                        aria-label="エクスポート品質"
                      >
                        <option value="0.01">高品質 (0.01mm)</option>
                        <option value="0.05">標準 (0.05mm)</option>
                        <option value="0.1">低品質 (0.1mm)</option>
                      </select>
                    </div>

                    {selectedFormats.has('stl') && (
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <span className="label-text">バイナリSTL形式</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={binaryStl}
                            onChange={(e) => setBinaryStl(e.target.checked)}
                          />
                        </label>
                      </div>
                    )}

                    {selectedFormats.has('obj') && (
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <span className="label-text">法線情報を含める</span>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={includeNormals}
                            onChange={(e) => setIncludeNormals(e.target.checked)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* エクスポート予定リスト */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text">エクスポート予定ファイル</span>
                </label>
                <div className="space-y-2">
                  {exportItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                      <DocumentArrowDownIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm">{item.fileName}</span>
                    </div>
                  ))}
                  {exportItems.length === 0 && (
                    <div className="text-sm text-base-content/50">
                      エクスポート形式を選択してください
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 進行状況表示 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    進行状況: {progress.completed}/{progress.total}
                  </span>
                  <span className="text-sm">
                    {progress.percentage}%
                  </span>
                </div>
                <progress 
                  className="progress progress-primary w-full" 
                  value={progress.percentage} 
                  max="100"
                />
                {currentItem && (
                  <div className="mt-2 text-sm text-base-content/70">
                    処理中: {currentItem.fileName}
                  </div>
                )}
              </div>

              {/* 結果表示 */}
              {results.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-success">成功 ({results.length}件)</h3>
                  <div className="space-y-1">
                    {results.map((result) => (
                      <div key={result.id} className="text-sm flex items-center gap-2">
                        <span className="text-success">✓</span>
                        {result.fileName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* エラー表示 */}
              {errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-error flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    エラー ({errors.length}件)
                  </h3>
                  <div className="space-y-2">
                    {errors.map((error) => (
                      <div key={error.id} className="text-sm">
                        <div className="flex items-center gap-2 text-error">
                          <span>✗</span>
                          {error.fileName}
                        </div>
                        <div className="ml-6 text-xs text-base-content/50">
                          {error.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 p-4 border-t border-base-300">
          {!isExporting ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={handleClose}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartExport}
                disabled={exportItems.length === 0}
              >
                エクスポート開始
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-error btn-outline"
                onClick={cancelBatchExport}
              >
                中断
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleClose}
                disabled={progress.completed < progress.total}
              >
                閉じる
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 