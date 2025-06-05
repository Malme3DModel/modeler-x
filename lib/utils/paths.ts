/**
 * Next.jsのbasePathを考慮した公開ファイルのパスを取得
 * @param path - publicフォルダからの相対パス（先頭の/は含める）
 * @returns 完全なパス
 */
export function getPublicPath(path: string): string {
  // 開発環境ではbasePathなし、本番環境では/modeler-xを追加
  const basePath = process.env.NODE_ENV === 'production' ? '/modeler-x' : '';
  
  // pathが/で始まっていない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${basePath}${normalizedPath}`;
}

/**
 * クライアントサイドでbasePathを取得
 */
export function getBasePath(): string {
  // クライアントサイドでは、実際のURLから推測
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/modeler-x')) {
      return '/modeler-x';
    }
  }
  
  // サーバーサイドまたはデフォルト
  return process.env.NODE_ENV === 'production' ? '/modeler-x' : '';
} 