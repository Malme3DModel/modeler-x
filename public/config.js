/**
 * Global configuration for public assets
 * GitHub Pages用のbasePath設定
 */

// GitHub Pagesでホストされている場合はbasePathを設定
const isGitHubPages = typeof window !== 'undefined' 
  ? window.location.hostname.includes('github.io')
  : (typeof self !== 'undefined' && self.location.hostname.includes('github.io'));

// basePathの決定
const BASE_PATH = isGitHubPages ? '/modeler-x' : '';

/**
 * publicフォルダ内のアセットへの正しいパスを取得
 * @param {string} path - アセットのパス（'/'で始まる）
 * @returns {string} - basePathが適用されたパス
 */
function getPublicAssetPath(path) {
  // すでにbasePathが含まれている場合は重複を避ける
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    return path;
  }
  
  // パスが'/'で始まっていない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${BASE_PATH}${normalizedPath}`;
}

// グローバルオブジェクトとして公開
if (typeof window !== 'undefined') {
  window.PUBLIC_ASSET_CONFIG = {
    BASE_PATH,
    getPublicAssetPath
  };
} else if (typeof self !== 'undefined') {
  self.PUBLIC_ASSET_CONFIG = {
    BASE_PATH,
    getPublicAssetPath
  };
}

console.log(`🔧 Public Asset Config loaded - BASE_PATH: ${BASE_PATH}`); 