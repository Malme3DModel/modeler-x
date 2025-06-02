'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useCADWorker } from '../../hooks/useCADWorker';

interface FileManagerProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  uploadedAt: string;
  data: number[];
}

export default function FileManager({ cadWorkerState }: FileManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルアップロード処理
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('operation', 'import');

        // プログレス更新
        setUploadProgress(((i + 1) / files.length) * 100);

        const response = await fetch('/api/cad/files', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setUploadedFiles(prev => [...prev, result.file]);
          
          // WebWorkerにファイル読み込み指示
          cadWorkerState.executeCADCode(`
            // ファイル読み込み: ${result.file.name}
            console.log('📁 ファイル読み込み開始:', '${result.file.name}');
            
            // ファイル形式に応じた読み込み処理
            try {
              const fileData = new Uint8Array([${result.file.data.join(',')}]);
              
              // OpenCascade.jsでファイル解析
              // 注意: 実際のファイル読み込み機能は次のステップで実装
              console.log('✅ ファイルデータ準備完了:', fileData.length, 'bytes');
              
              // 仮の形状生成（実装例）
              const box = Box(10, 10, 10, true);
              console.log('🎯 ファイル読み込み完了（仮実装）');
              
            } catch (error) {
              console.error('❌ ファイル読み込みエラー:', error);
            }
          `);
        } else {
          console.error('ファイルアップロードエラー:', result.error);
        }
      }
    } catch (error) {
      console.error('ファイルアップロード処理エラー:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [cadWorkerState]);

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
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // ファイル選択処理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // ファイル削除処理
  const handleFileDelete = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // エクスポート処理
  const handleExport = useCallback(async (format: string) => {
    try {
      const filename = `cad_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
      
      const response = await fetch(`/api/cad/files?format=${format}&filename=${filename}`);
      const result = await response.json();

      if (result.success) {
        // WebWorkerにエクスポート指示
        cadWorkerState.executeCADCode(`
          // エクスポート処理: ${format.toUpperCase()}
          console.log('📤 エクスポート開始:', '${format.toUpperCase()}');
          
          try {
            // 現在の形状をエクスポート
            // 注意: 実際のエクスポート機能は次のステップで実装
            console.log('✅ エクスポート準備完了:', '${result.filename}');
            
            // 仮のエクスポート処理
            console.log('🎯 エクスポート完了（仮実装）');
            
          } catch (error) {
            console.error('❌ エクスポートエラー:', error);
          }
        `);
      }
    } catch (error) {
      console.error('エクスポート処理エラー:', error);
    }
  }, [cadWorkerState]);

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">📁 ファイル管理</h3>
          <div className="badge badge-info">I/O</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/70">
            {uploadedFiles.length} ファイル
          </span>
        </div>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-base-300 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">📁</div>
          <div className="text-lg font-medium">
            ファイルをドラッグ&ドロップ
          </div>
          <div className="text-sm text-base-content/70">
            または
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            ファイルを選択
          </button>
          <div className="text-xs text-base-content/50">
            対応形式: STEP, STL, OBJ, IGES (最大50MB)
          </div>
        </div>
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".step,.stp,.stl,.obj,.iges,.igs"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="CADファイルを選択"
      />

      {/* アップロード進行状況 */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">アップロード中...</span>
            <span className="text-sm">{Math.round(uploadProgress)}%</span>
          </div>
          <progress 
            className="progress progress-primary w-full" 
            value={uploadProgress} 
            max="100"
          ></progress>
        </div>
      )}

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">アップロード済みファイル</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded border">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {file.extension === '.step' || file.extension === '.stp' ? '🔧' :
                     file.extension === '.stl' ? '🎯' :
                     file.extension === '.obj' ? '📐' : '📄'}
                  </div>
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-base-content/70">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => handleFileDelete(index)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* エクスポート機能 */}
      <div className="mt-4 pt-4 border-t border-base-300">
        <h4 className="font-medium mb-2">エクスポート</h4>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => handleExport('step')}
            disabled={cadWorkerState.shapes.length === 0}
          >
            STEP
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => handleExport('stl')}
            disabled={cadWorkerState.shapes.length === 0}
          >
            STL
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => handleExport('obj')}
            disabled={cadWorkerState.shapes.length === 0}
          >
            OBJ
          </button>
        </div>
        {cadWorkerState.shapes.length === 0 && (
          <div className="text-xs text-base-content/50 mt-1">
            エクスポートするには形状を生成してください
          </div>
        )}
      </div>
    </div>
  );
} 