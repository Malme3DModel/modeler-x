import { useState, useCallback, useRef } from 'react';
import { useCADWorker } from './useCADWorker';

export type ExportFormat = 'step' | 'stl' | 'obj';

export interface ExportItem {
  id: string;
  fileName: string;
  format: ExportFormat;
  settings?: {
    quality?: number;
    binaryStl?: boolean;
    includeNormals?: boolean;
  };
}

export interface ExportResult {
  id: string;
  fileName: string;
  format: ExportFormat;
  success: boolean;
  error?: string;
  data?: Uint8Array;
}

export interface BatchExportProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
}

export interface UseBatchExportReturn {
  startBatchExport: (items: ExportItem[]) => Promise<void>;
  cancelBatchExport: () => void;
  progress: BatchExportProgress;
  results: ExportResult[];
  errors: ExportResult[];
  isExporting: boolean;
  currentItem: ExportItem | null;
}

export function useBatchExport(): UseBatchExportReturn {
  const { worker, isWorkerReady } = useCADWorker();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<BatchExportProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
  });
  const [results, setResults] = useState<ExportResult[]>([]);
  const [errors, setErrors] = useState<ExportResult[]>([]);
  const [currentItem, setCurrentItem] = useState<ExportItem | null>(null);
  const cancelRef = useRef(false);

  const resetState = useCallback(() => {
    setProgress({
      total: 0,
      completed: 0,
      failed: 0,
      percentage: 0,
    });
    setResults([]);
    setErrors([]);
    setCurrentItem(null);
    cancelRef.current = false;
  }, []);

  const exportSingleFile = useCallback(
    async (item: ExportItem): Promise<ExportResult> => {
      if (!worker || !isWorkerReady) {
        throw new Error('CADワーカーが初期化されていません');
      }

      return new Promise((resolve, reject) => {
        const messageHandler = (e: MessageEvent) => {
          if (
            e.data.type === 'exportFile' &&
            e.data.payload?.format === item.format
          ) {
            worker.removeEventListener('message', messageHandler);

            if (e.data.payload.success) {
              const result: ExportResult = {
                id: item.id,
                fileName: item.fileName,
                format: item.format,
                success: true,
                data: new Uint8Array(e.data.payload.data),
              };
              resolve(result);
            } else {
              const result: ExportResult = {
                id: item.id,
                fileName: item.fileName,
                format: item.format,
                success: false,
                error: e.data.payload.error || 'エクスポートに失敗しました',
              };
              resolve(result);
            }
          }
        };

        worker.addEventListener('message', messageHandler);

        // エクスポートリクエストを送信
        worker.postMessage({
          type: 'exportFile',
          payload: {
            format: item.format,
            fileName: item.fileName,
            quality: item.settings?.quality || 0.1,
            binaryStl: item.settings?.binaryStl !== false,
            includeNormals: item.settings?.includeNormals !== false,
          },
        });

        // タイムアウト処理（30秒）
        setTimeout(() => {
          worker.removeEventListener('message', messageHandler);
          const result: ExportResult = {
            id: item.id,
            fileName: item.fileName,
            format: item.format,
            success: false,
            error: 'エクスポートがタイムアウトしました',
          };
          resolve(result);
        }, 30000);
      });
    },
    [worker, isWorkerReady]
  );

  const downloadFile = useCallback((result: ExportResult) => {
    if (!result.data) return;

    const mimeTypes: Record<ExportFormat, string> = {
      step: 'model/step',
      stl: 'model/stl',
      obj: 'model/obj',
    };

    const blob = new Blob([result.data], {
      type: mimeTypes[result.format] || 'application/octet-stream',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, []);

  const startBatchExport = useCallback(
    async (items: ExportItem[]) => {
      if (!worker || !isWorkerReady) {
        console.error('CADワーカーが初期化されていません');
        return;
      }

      if (items.length === 0) {
        console.warn('エクスポートするアイテムがありません');
        return;
      }

      // 状態をリセット
      resetState();
      setIsExporting(true);
      setProgress({
        total: items.length,
        completed: 0,
        failed: 0,
        percentage: 0,
      });

      const allResults: ExportResult[] = [];
      const allErrors: ExportResult[] = [];

      // 順次エクスポート処理
      for (let i = 0; i < items.length; i++) {
        // キャンセルチェック
        if (cancelRef.current) {
          console.log('バッチエクスポートがキャンセルされました');
          break;
        }

        const item = items[i];
        setCurrentItem(item);

        try {
          console.log(`📤 エクスポート中 (${i + 1}/${items.length}): ${item.fileName}`);
          
          const result = await exportSingleFile(item);
          
          if (result.success) {
            allResults.push(result);
            setResults((prev) => [...prev, result]);
            
            // ファイルをダウンロード
            downloadFile(result);
            
            console.log(`✅ エクスポート成功: ${item.fileName}`);
          } else {
            allErrors.push(result);
            setErrors((prev) => [...prev, result]);
            console.error(`❌ エクスポート失敗: ${item.fileName} - ${result.error}`);
          }

          // 進行状況を更新
          const completed = i + 1;
          const failed = allErrors.length;
          setProgress({
            total: items.length,
            completed,
            failed,
            percentage: Math.round((completed / items.length) * 100),
          });
        } catch (error) {
          console.error(`❌ エクスポートエラー: ${item.fileName}`, error);
          
          const errorResult: ExportResult = {
            id: item.id,
            fileName: item.fileName,
            format: item.format,
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー',
          };
          
          allErrors.push(errorResult);
          setErrors((prev) => [...prev, errorResult]);
          
          // 進行状況を更新
          const completed = i + 1;
          const failed = allErrors.length;
          setProgress({
            total: items.length,
            completed,
            failed,
            percentage: Math.round((completed / items.length) * 100),
          });
        }

        // 次のアイテムまで少し待機（UIの更新のため）
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setIsExporting(false);
      setCurrentItem(null);

      // 完了メッセージ
      const successCount = allResults.length;
      const failCount = allErrors.length;
      
      if (failCount === 0) {
        console.log(`✅ すべてのファイルのエクスポートが完了しました (${successCount}件)`);
      } else {
        console.warn(
          `⚠️ エクスポート完了: 成功 ${successCount}件, 失敗 ${failCount}件`
        );
      }
    },
    [worker, isWorkerReady, resetState, exportSingleFile, downloadFile]
  );

  const cancelBatchExport = useCallback(() => {
    cancelRef.current = true;
    console.log('バッチエクスポートのキャンセルをリクエストしました');
  }, []);

  return {
    startBatchExport,
    cancelBatchExport,
    progress,
    results,
    errors,
    isExporting,
    currentItem,
  };
} 