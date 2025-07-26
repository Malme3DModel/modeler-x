import { useCallback, useState } from 'react';
import { ProjectService, ProjectData } from '@/services/projectService';
import { ExportService, ExportFormat, ExportOptions } from '@/services/exportService';

/**
 * プロジェクト操作フック
 * プロジェクトの保存・読み込み・エクスポート機能を提供
 */
export const useProjectActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // エラークリア
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // プロジェクト保存
  const saveProject = useCallback(async (
    projectName: string,
    code: string,
    options?: { filename?: string; includeMetadata?: boolean }
  ) => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      ProjectService.saveProject(projectName, code, options);
      
      console.log('Project saved successfully:', projectName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(`Save failed: ${errorMessage}`);
      console.error('Project save error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // プロジェクト読み込み
  const loadProject = useCallback(async (): Promise<ProjectData | null> => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      const result = await ProjectService.loadProject();
      
      if (result.success && result.data) {
        console.log('Project loaded successfully:', result.data.name);
        return result.data;
      } else {
        setLastError(result.error || 'Failed to load project');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(`Load failed: ${errorMessage}`);
      console.error('Project load error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // モデルエクスポート
  const exportModel = useCallback(async (
    format: ExportFormat,
    cadData?: any,
    options?: ExportOptions
  ) => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      const result = await ExportService.exportModel(format, cadData, options);
      
      if (result.success) {
        console.log(`${format.toUpperCase()} export completed successfully`);
      } else {
        setLastError(result.error || `${format.toUpperCase()} export failed`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(`Export failed: ${errorMessage}`);
      console.error('Export error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 個別のエクスポート関数
  const exportSTEP = useCallback(async (cadData?: any, options?: ExportOptions) => {
    return exportModel('step', cadData, options);
  }, [exportModel]);

  const exportSTL = useCallback(async (cadData?: any, options?: ExportOptions) => {
    return exportModel('stl', cadData, options);
  }, [exportModel]);

  const exportOBJ = useCallback(async (cadData?: any, options?: ExportOptions) => {
    return exportModel('obj', cadData, options);
  }, [exportModel]);

  // サポート形式の取得
  const getSupportedFormats = useCallback(() => {
    return ExportService.getSupportedFormats();
  }, []);

  // フォーマット情報の取得
  const getFormatInfo = useCallback((format: ExportFormat) => {
    return ExportService.getFormatInfo(format);
  }, []);

  return {
    // 状態
    isLoading,
    lastError,
    
    // アクション
    saveProject,
    loadProject,
    exportModel,
    exportSTEP,
    exportSTL,
    exportOBJ,
    clearError,
    
    // ユーティリティ
    getSupportedFormats,
    getFormatInfo,
  };
}; 