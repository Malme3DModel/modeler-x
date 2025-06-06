'use client';

import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

/**
 * ファイルのダウンロードユーティリティ
 */
export async function downloadFile(
  data: string | Blob,
  filename: string,
  mimeType: string
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * File System Access APIを使用したファイル保存
 */
export async function saveFileWithPicker(
  data: string,
  suggestedName: string,
  description: string,
  mimeType: string,
  extension: string
) {
  // File System Access API対応チェック
  if ('showSaveFilePicker' in window) {
    try {
      const options = {
        suggestedName,
        types: [{
          description,
          accept: { [mimeType]: [`.${extension}`] }
        }],
      };
      
      const handle = await (window as any).showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      
      return handle.name;
    } catch (err) {
      // ユーザーがキャンセルした場合やエラー時はフォールバック
      console.warn('File picker failed:', err);
    }
  }
  
  // File System Access APIが使えない場合のフォールバック
  await downloadFile(data, suggestedName, mimeType);
  return suggestedName;
}

/**
 * File System Access APIを使用したファイル読み込み
 */
export async function loadFileWithPicker(
  description: string,
  mimeTypes: Record<string, string[]>
) {
  // File System Access API対応チェック
  if ('showOpenFilePicker' in window) {
    try {
      const options = {
        types: [{
          description,
          accept: mimeTypes
        }],
        multiple: false
      };
      
      const [handle] = await (window as any).showOpenFilePicker(options);
      const file = await handle.getFile();
      const content = await file.text();
      
      return { content, name: file.name, handle };
    } catch (err) {
      console.warn('File picker failed:', err);
      return null;
    }
  }
  
  // File System Access APIが使えない場合は通常のinput要素を使用
  return new Promise<{ content: string; name: string; handle?: any } | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = Object.values(mimeTypes).flat().join(',');
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const content = await file.text();
        resolve({ content, name: file.name });
      } else {
        resolve(null);
      }
    };
    
    input.click();
  });
}

/**
 * 複数ファイルの読み込み（インポート用）
 */
export async function loadMultipleFiles(
  accept: string
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      resolve(files);
    };
    
    input.click();
  });
}

/**
 * プロジェクトデータの圧縮/解凍
 */
export function compressData(data: string): string {
  // TODO: 実際の圧縮実装が必要（pako等のライブラリを使用）
  // 現時点では圧縮せずにBase64エンコードのみ
  return btoa(encodeURIComponent(data));
}

export function decompressData(compressed: string): string {
  // TODO: 実際の解凍実装が必要
  // 現時点ではBase64デコードのみ
  try {
    return decodeURIComponent(atob(compressed));
  } catch {
    return compressed; // 圧縮されていない場合はそのまま返す
  }
}

/**
 * Three.jsのSTLExporter互換のエクスポート関数
 */
export function exportSTL(mesh: any): string {
  const exporter = new STLExporter();
  return exporter.parse(mesh) as string;
}

/**
 * Three.jsのOBJExporter互換のエクスポート関数
 */
export function exportOBJ(mesh: any): string {
  const exporter = new OBJExporter();
  return exporter.parse(mesh);
} 