/**
 * GitHub Pages用のbasePath管理ヘルパー
 */

// 本番環境でのbasePath
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/modeler-x' : '';

/**
 * パスにbasePathを追加
 */
export function withBasePath(path: string): string {
  // すでにbasePathが付いている場合は重複を避ける
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    return path;
  }
  
  // パスが / で始まっていない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${BASE_PATH}${normalizedPath}`;
}

/**
 * public配下のアセットパスを取得
 */
export function getAssetPath(path: string): string {
  return withBasePath(path);
}

/**
 * Web Workerのパスを取得
 */
export function getWorkerPath(path: string): string {
  return withBasePath(path);
} 