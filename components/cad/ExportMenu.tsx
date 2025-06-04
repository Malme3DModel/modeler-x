'use client';

import { useState } from 'react';
import { useCADWorker } from '@/hooks/useCADWorker';
import ExportSettings, { ExportSettingsValues } from './ExportSettings';

type ExportFormat = 'step' | 'stl' | 'obj';

interface ExportMenuProps {
  onClose?: () => void;
  onExportSuccess?: (format: ExportFormat, filename: string) => void;
  onExportError?: (error: string) => void;
}

/**
 * CADモデルのエクスポート機能を提供するコンポーネント
 */
export default function ExportMenu({ 
  onClose, 
  onExportSuccess, 
  onExportError 
}: ExportMenuProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('step');
  const [filename, setFilename] = useState('model');
  const [isExporting, setIsExporting] = useState(false);
  const { worker, isWorkerReady } = useCADWorker();
  const [exportSettings, setExportSettings] = useState<ExportSettingsValues>({
    format: exportFormat,
    quality: 0.1,
    binaryStl: true,
    includeNormals: true,
  });

  // STEPファイルとしてエクスポート
  const exportSTEP = async () => {
    if (!worker || !isWorkerReady) {
      onExportError?.('CADワーカーが初期化されていません');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // ワーカーにSTEPエクスポートを要求
      return new Promise<void>((resolve, reject) => {
        // メッセージハンドラーを設定
        const messageHandler = (e: MessageEvent) => {
          if (e.data.type === 'saveShapeSTEP') {
            worker.removeEventListener('message', messageHandler);
            
            if (e.data.payload) {
              // STEPデータを受け取ったらファイルとしてダウンロード
              downloadFile(e.data.payload, `${filename}.step`, 'model/step');
              onExportSuccess?.('step', `${filename}.step`);
              resolve();
            } else {
              onExportError?.('STEPデータの生成に失敗しました');
              reject(new Error('STEPデータの生成に失敗しました'));
            }
            setIsExporting(false);
          }
        };
        
        // ハンドラーを登録してメッセージを送信
        worker.addEventListener('message', messageHandler);
        worker.postMessage({ type: 'saveShapeSTEP' });
      });
    } catch (error) {
      setIsExporting(false);
      onExportError?.(error instanceof Error ? error.message : '不明なエラーが発生しました');
    }
  };

  // STLファイルとしてエクスポート
  const exportSTL = async () => {
    if (!worker || !isWorkerReady) {
      onExportError?.('CADワーカーが初期化されていません');
      return;
    }
    setIsExporting(true);
    try {
      return new Promise<void>((resolve, reject) => {
        const messageHandler = (e: MessageEvent) => {
          if (e.data.type === 'exportFile' && e.data.payload?.format === 'stl') {
            worker.removeEventListener('message', messageHandler);
            if (e.data.payload.success) {
              // バイナリデータをBlobに変換してダウンロード
              const uint8Array = new Uint8Array(e.data.payload.data);
              const blob = new Blob([uint8Array], { type: 'model/stl' });
              downloadFile(blob, `${filename}.stl`, 'model/stl');
              onExportSuccess?.('stl', `${filename}.stl`);
              resolve();
            } else {
              onExportError?.(e.data.payload.error || 'STLデータの生成に失敗しました');
              reject(new Error(e.data.payload.error || 'STLデータの生成に失敗しました'));
            }
            setIsExporting(false);
          }
        };
        worker.addEventListener('message', messageHandler);
        worker.postMessage({
          type: 'exportFile',
          payload: {
            format: 'stl',
            fileName: `${filename}.stl`,
            quality: exportSettings.quality,
            binaryStl: exportSettings.binaryStl,
          },
        });
      });
    } catch (error) {
      setIsExporting(false);
      onExportError?.(error instanceof Error ? error.message : '不明なエラーが発生しました');
    }
  };

  // OBJファイルとしてエクスポート
  const exportOBJ = async () => {
    if (!worker || !isWorkerReady) {
      onExportError?.('CADワーカーが初期化されていません');
      return;
    }
    setIsExporting(true);
    try {
      return new Promise<void>((resolve, reject) => {
        const messageHandler = (e: MessageEvent) => {
          if (e.data.type === 'exportFile' && e.data.payload?.format === 'obj') {
            worker.removeEventListener('message', messageHandler);
            if (e.data.payload.success) {
              const uint8Array = new Uint8Array(e.data.payload.data);
              const blob = new Blob([uint8Array], { type: 'model/obj' });
              downloadFile(blob, `${filename}.obj`, 'model/obj');
              onExportSuccess?.('obj', `${filename}.obj`);
              resolve();
            } else {
              onExportError?.(e.data.payload.error || 'OBJデータの生成に失敗しました');
              reject(new Error(e.data.payload.error || 'OBJデータの生成に失敗しました'));
            }
            setIsExporting(false);
          }
        };
        worker.addEventListener('message', messageHandler);
        worker.postMessage({
          type: 'exportFile',
          payload: {
            format: 'obj',
            fileName: `${filename}.obj`,
            quality: exportSettings.quality,
            includeNormals: exportSettings.includeNormals,
          },
        });
      });
    } catch (error) {
      setIsExporting(false);
      onExportError?.(error instanceof Error ? error.message : '不明なエラーが発生しました');
    }
  };

  // ファイルをダウンロードする関数
  const downloadFile = (content: Blob, filename: string, mime: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 選択されたフォーマットでエクスポート実行
  const handleExport = async () => {
    switch (exportFormat) {
      case 'step':
        await exportSTEP();
        break;
      case 'stl':
        await exportSTL();
        break;
      case 'obj':
        await exportOBJ();
        break;
    }
  };

  // フォーマット変更時に設定も同期
  const handleFormatChange = (format: ExportFormat) => {
    setExportFormat(format);
    setExportSettings((prev) => ({ ...prev, format }));
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-w-[300px]">
      <h3 className="text-lg font-semibold mb-4 text-white">エクスポート設定</h3>
      
      <div className="mb-4">
        <label htmlFor="export-format" className="block text-sm font-medium text-gray-300 mb-1">
          フォーマット
        </label>
        <select
          id="export-format"
          className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={exportFormat}
          onChange={(e) => handleFormatChange(e.target.value as ExportFormat)}
        >
          <option value="step">STEP (.step)</option>
          <option value="stl">STL (.stl)</option>
          <option value="obj">OBJ (.obj)</option>
        </select>
      </div>
      
      {(exportFormat === 'stl' || exportFormat === 'obj') && (
        <div className="mb-4">
          <ExportSettings
            format={exportFormat}
            initialValues={exportSettings}
            onChange={setExportSettings}
          />
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="export-filename" className="block text-sm font-medium text-gray-300 mb-1">
          ファイル名
        </label>
        <input
          id="export-filename"
          type="text"
          className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="ファイル名を入力"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          className="px-4 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          onClick={onClose}
        >
          キャンセル
        </button>
        <button
          className={`px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleExport}
          disabled={isExporting || !isWorkerReady}
        >
          {isExporting ? 'エクスポート中...' : 'エクスポート'}
        </button>
      </div>
    </div>
  );
} 