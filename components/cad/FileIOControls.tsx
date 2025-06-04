'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useCADWorker } from '../../hooks/useCADWorker';
import { Download, Upload, FileSymlink, AlertTriangle, X, CheckCircle, FolderDown } from 'lucide-react';
import BatchExportDialog from './BatchExportDialog';

interface FileIOControlsProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: string;
}

export default function FileIOControls({ cadWorkerState }: FileIOControlsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportFormat, setExportFormat] = useState<'step' | 'stl'>('step');
  const [exportQuality, setExportQuality] = useState(0.1);
  const [showBatchExportDialog, setShowBatchExportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル検証関数
  const validateFile = useCallback((file: File) => {
    // ファイル形式の検証
    const validExtensions = ['.step', '.stp', '.iges', '.igs'];
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (!extension || !validExtensions.includes(extension)) {
      throw new Error(`サポートされていないファイル形式です: ${extension || '不明'}`);
    }
    
    // ファイルサイズ検証
    if (file.size > 50 * 1024 * 1024) { // 50MB上限
      throw new Error(`ファイルサイズが大きすぎます: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    
    return {
      extension: extension.substring(1),
      isValid: true
    };
  }, []);

  // ファイルインポート処理
  const handleFileImport = useCallback(async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      // ファイル検証
      const validation = validateFile(file);
      
      // ファイルデータを読み込み
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log(`📂 ファイル読み込み: ${file.name} (${uint8Array.length} bytes)`);
      
      // CADワーカーにファイルデータを送信
      const result = await cadWorkerState.sendToWorker({
        type: 'importFile',
        payload: {
          fileName: file.name,
          fileType: validation.extension,
          fileContent: Array.from(uint8Array)
        }
      });
      
      if (result.success) {
        console.log('✅ ファイル読み込み成功:', result);
        setFileInfo({
          name: file.name,
          size: file.size,
          type: validation.extension.toUpperCase(),
          format: result.shapeInfo?.format || validation.extension.toUpperCase()
        });
        
        // メッシュデータを更新
        if (result.mesh) {
          if (typeof cadWorkerState.combineAndRender === 'function') {
            // コンバインとレンダリングを実行
            await cadWorkerState.combineAndRender({
              maxDeviation: 0.1,
              sceneOptions: {
                groundPlaneVisible: true,
                gridVisible: true
              }
            });
          }
        }
      } else {
        throw new Error(result.error || 'ファイル読み込みに失敗しました');
      }
    } catch (error: unknown) {
      console.error('ファイル読み込みエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [cadWorkerState, validateFile]);

  // エクスポート処理
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      // 形状がない場合
      if (cadWorkerState.shapes.length === 0) {
        throw new Error('エクスポートする形状がありません');
      }
      
      // ファイル名生成
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `cad_export_${timestamp}.${exportFormat}`;
      
      console.log(`📤 エクスポート開始: ${exportFormat.toUpperCase()}`);
      
      // CADワーカーにエクスポート指示
      const result = await cadWorkerState.sendToWorker({
        type: 'exportFile',
        payload: {
          format: exportFormat,
          fileName: fileName,
          quality: exportQuality
        }
      });
      
      if (result.success) {
        console.log('✅ エクスポート成功:', result);
        
        // ファイルダウンロード処理
        const blob = new Blob([new Uint8Array(result.data)], { 
          type: exportFormat === 'step' ? 'application/step' : 'application/octet-stream' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        
        // 後片付け
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        throw new Error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error: unknown) {
      console.error('エクスポートエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      if (cadWorkerState.clearError) {
        cadWorkerState.clearError();
      }
      if (typeof console.error === 'function') {
        console.error(errorMessage);
      }
    } finally {
      setIsExporting(false);
    }
  }, [cadWorkerState, exportFormat, exportQuality]);

  // ドラッグ&ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  }, [handleFileImport]);

  // ファイル選択処理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileImport(files[0]);
    }
  }, [handleFileImport]);

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSymlink className="w-5 h-5" />
          ファイルI/O
        </h3>
      </div>
      
      {/* インポートセクション */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wider">インポート</h4>
        
        {/* ドラッグ&ドロップエリア */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-base-300 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-8 h-8 text-primary/70" />
            <div className="text-sm font-medium">
              STEP/IGESファイルをドロップ
            </div>
            <button
              className="btn btn-primary btn-sm mt-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              title="ファイルを選択"
            >
              {isImporting ? '読み込み中...' : 'ファイルを選択'}
            </button>
            <div className="text-xs text-base-content/50 mt-1">
              対応形式: STEP (.step, .stp), IGES (.iges, .igs)
            </div>
          </div>
        </div>
        
        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".step,.stp,.iges,.igs"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="CADファイルを選択"
        />
        
        {/* エラー表示 */}
        {importError && (
          <div className="bg-error/10 text-error rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">{importError}</div>
            <button 
              className="ml-auto text-error/70 hover:text-error"
              onClick={() => setImportError(null)}
              title="閉じる"
              aria-label="エラーメッセージを閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* ファイル情報表示 */}
        {fileInfo && !importError && (
          <div className="bg-success/10 text-success-content rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{fileInfo.name}</div>
              <div className="text-xs text-success-content/70">
                {formatFileSize(fileInfo.size)} • {fileInfo.format}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* エクスポートセクション */}
      <div className="space-y-3 border-t border-base-300 pt-4">
        <h4 className="font-medium text-sm uppercase tracking-wider">エクスポート</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">形式</label>
            <select
              className="select select-bordered select-sm w-full"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'step' | 'stl')}
              disabled={isExporting}
              title="エクスポート形式を選択"
              aria-label="エクスポート形式"
            >
              <option value="step">STEP (.step)</option>
              <option value="stl">STL (.stl)</option>
            </select>
          </div>
          
          {exportFormat === 'stl' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">品質 (mm)</label>
              <select
                className="select select-bordered select-sm w-full"
                value={exportQuality}
                onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                disabled={isExporting}
                title="エクスポート品質を選択"
                aria-label="エクスポート品質"
              >
                <option value="0.01">高品質 (0.01mm)</option>
                <option value="0.05">標準 (0.05mm)</option>
                <option value="0.1">低品質 (0.1mm)</option>
              </select>
            </div>
          )}
        </div>
        
        <button
          className="btn btn-primary w-full mt-2"
          onClick={handleExport}
          disabled={isExporting || cadWorkerState.shapes.length === 0}
        >
          {isExporting ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              エクスポート中...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              エクスポート
            </>
          )}
        </button>
        
        <button
          className="btn btn-secondary w-full mt-2"
          onClick={() => setShowBatchExportDialog(true)}
          disabled={cadWorkerState.shapes.length === 0}
          title="複数形式で一括エクスポート"
        >
          <FolderDown className="w-4 h-4" />
          バッチエクスポート
        </button>
        
        {cadWorkerState.shapes.length === 0 && (
          <div className="text-xs text-base-content/50 text-center">
            エクスポートするには形状を生成してください
          </div>
        )}
      </div>
      
      {/* バッチエクスポートダイアログ */}
      <BatchExportDialog
        isOpen={showBatchExportDialog}
        onClose={() => setShowBatchExportDialog(false)}
        defaultFileName={fileInfo?.name?.replace(/\.[^/.]+$/, '') || 'model'}
      />
    </div>
  );
} 