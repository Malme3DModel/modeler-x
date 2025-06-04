'use client';

import React, { useState, useEffect } from 'react';
import { DocumentIcon, CubeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface FilePreviewProps {
  file: File | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface FileAnalysis {
  format: string;
  size: string;
  lastModified: string;
  isValid: boolean;
  errorMessage?: string;
  preview?: {
    entityCount?: number;
    boundingBox?: {
      min: [number, number, number];
      max: [number, number, number];
    };
    complexity?: 'low' | 'medium' | 'high';
  };
}

export default function FilePreview({ file, onConfirm, onCancel }: FilePreviewProps) {
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (file) {
      analyzeFile(file);
    }
  }, [file]);

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      // ファイル基本情報
      const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
      const format = extension.substring(1).toUpperCase();
      const size = formatFileSize(file.size);
      const lastModified = new Date(file.lastModified).toLocaleString('ja-JP');
      
      // ファイル形式の検証
      const validExtensions = ['.step', '.stp', '.iges', '.igs', '.stl', '.obj'];
      const isValid = validExtensions.includes(extension);
      
      let errorMessage: string | undefined;
      if (!isValid) {
        errorMessage = `サポートされていないファイル形式です: ${extension}`;
      } else if (file.size > 100 * 1024 * 1024) { // 100MB
        errorMessage = 'ファイルサイズが大きすぎます（最大100MB）';
      }
      
      // ファイルの簡易解析（最初の数行を読む）
      let preview: FileAnalysis['preview'] = undefined;
      
      if (isValid && file.size < 10 * 1024 * 1024) { // 10MB以下なら詳細解析
        try {
          const text = await readFilePartially(file, 1024 * 10); // 最初の10KB
          
          if (format === 'STEP' || format === 'STP') {
            // STEPファイルの簡易解析
            const entityMatches = text.match(/#\d+/g);
            const entityCount = entityMatches ? entityMatches.length : 0;
            
            preview = {
              entityCount,
              complexity: entityCount < 100 ? 'low' : entityCount < 1000 ? 'medium' : 'high'
            };
          } else if (format === 'STL') {
            // STLファイルの判定（ASCII/Binary）
            const isAscii = text.startsWith('solid');
            if (isAscii) {
              const facetMatches = text.match(/facet normal/g);
              const facetCount = facetMatches ? facetMatches.length : 0;
              
              preview = {
                entityCount: facetCount,
                complexity: facetCount < 1000 ? 'low' : facetCount < 10000 ? 'medium' : 'high'
              };
            } else {
              // バイナリSTLの場合はヘッダーから三角形数を読む
              const dataView = new DataView(await file.slice(80, 84).arrayBuffer());
              const triangleCount = dataView.getUint32(0, true);
              
              preview = {
                entityCount: triangleCount,
                complexity: triangleCount < 1000 ? 'low' : triangleCount < 10000 ? 'medium' : 'high'
              };
            }
          } else if (format === 'OBJ') {
            // OBJファイルの簡易解析
            const vertexMatches = text.match(/^v\s/gm);
            const faceMatches = text.match(/^f\s/gm);
            const vertexCount = vertexMatches ? vertexMatches.length : 0;
            const faceCount = faceMatches ? faceMatches.length : 0;
            
            preview = {
              entityCount: faceCount,
              complexity: faceCount < 1000 ? 'low' : faceCount < 10000 ? 'medium' : 'high'
            };
          }
        } catch (error) {
          console.warn('ファイル詳細解析エラー:', error);
        }
      }
      
      setAnalysis({
        format,
        size,
        lastModified,
        isValid,
        errorMessage,
        preview
      });
    } catch (error) {
      console.error('ファイル解析エラー:', error);
      setAnalysis({
        format: '不明',
        size: formatFileSize(file.size),
        lastModified: new Date(file.lastModified).toLocaleString('ja-JP'),
        isValid: false,
        errorMessage: 'ファイルの解析に失敗しました'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFilePartially = (file: File, bytes: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file.slice(0, bytes));
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplexityColor = (complexity?: 'low' | 'medium' | 'high') => {
    switch (complexity) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-error';
      default: return 'text-base-content';
    }
  };

  const getComplexityLabel = (complexity?: 'low' | 'medium' | 'high') => {
    switch (complexity) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      default: return '不明';
    }
  };

  if (!file || !analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DocumentIcon className="w-6 h-6" />
          ファイルプレビュー
        </h3>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* ファイル基本情報 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CubeIcon className="w-5 h-5 mt-0.5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-base-content/70">
                    {analysis.format} • {analysis.size}
                  </div>
                  <div className="text-xs text-base-content/50">
                    最終更新: {analysis.lastModified}
                  </div>
                </div>
              </div>

              {/* エラー表示 */}
              {!analysis.isValid && analysis.errorMessage && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{analysis.errorMessage}</span>
                </div>
              )}

              {/* プレビュー情報 */}
              {analysis.preview && (
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <InformationCircleIcon className="w-5 h-5 text-info" />
                    <span className="font-medium">ファイル解析結果</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {analysis.preview.entityCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">
                          {analysis.format === 'STEP' || analysis.format === 'STP' ? 'エンティティ数' :
                           analysis.format === 'STL' ? '三角形数' :
                           analysis.format === 'OBJ' ? 'フェース数' : '要素数'}:
                        </span>
                        <span>{analysis.preview.entityCount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {analysis.preview.complexity && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">複雑度:</span>
                        <span className={getComplexityColor(analysis.preview.complexity)}>
                          {getComplexityLabel(analysis.preview.complexity)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 推奨事項 */}
              {analysis.isValid && analysis.preview?.complexity === 'high' && (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>このファイルは複雑度が高いため、読み込みに時間がかかる可能性があります。</span>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={onCancel}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                onClick={onConfirm}
                disabled={!analysis.isValid}
              >
                インポート
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 