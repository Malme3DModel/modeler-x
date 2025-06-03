/**
 * Monaco Editor WebWorker設定
 * Next.jsプロジェクトでモジュールスクリプトの制限を回避するための設定
 */

// AMD (define/require) のエミュレーション
if (typeof self !== 'undefined' && !self.window) {
  self.define = function(deps, callback) {
    // 依存関係は無視して直接コールバックを実行
    if (typeof callback === 'function') {
      callback();
    }
  };

  self.require = function(modules, callback) {
    if (typeof callback === 'function') {
      callback();
    }
  };

  // importScriptsの代替として動作するように
  self.importScripts = function() {
    console.warn('importScripts called but not supported in module scripts');
  };
}

// CDNからMonacoエディターの必要なスクリプトを読み込む関数
function loadMonacoScripts(scriptUrls) {
  return Promise.all(
    scriptUrls.map(url => 
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(script => {
          try {
            // Function コンストラクタを使ってスクリプトを評価
            const scriptEval = new Function(script);
            scriptEval();
            console.log(`Successfully loaded script: ${url}`);
            return true;
          } catch (error) {
            console.error(`Error evaluating script ${url}:`, error);
            throw error;
          }
        })
    )
  );
}

// メインスレッドでのMonaco設定
if (typeof window !== 'undefined') {
  // FileAccessImplのtoUrlエラーを修正するためのモンキーパッチ
  window.MonacoEnvironment = {
    getWorkerUrl: function(_moduleId, label) {
      // TypeScriptかJavaScriptのワーカーの場合
      if (label === 'typescript' || label === 'javascript') {
        return '/monaco-editor-workers/ts.worker.js';
      }
      // それ以外のワーカーの場合
      return '/monaco-editor-workers/editor.worker.js';
    },
    // ワーカーオプションの設定
    getWorkerOptions: function() {
      return {
        type: 'classic'  // classicタイプを使用
      };
    }
  };
  
  // FileAccessImpl.toUrlエラーを修正するためのモンキーパッチ
  setTimeout(() => {
    if (window.monaco && window.monaco.editor) {
      const originalCreate = window.monaco.editor.create;
      window.monaco.editor.create = function(...args) {
        // FileAccess実装のモンキーパッチ
        if (window.monaco.fileAccess && !window.monaco.fileAccess.FileAccess) {
          window.monaco.fileAccess.FileAccess = {
            asFileUri: function() { return { toString: () => '', fsPath: '' }; },
            asBrowserUri: function() { return { toString: () => '', fsPath: '' }; }
          };
        }
        return originalCreate.apply(this, args);
      };
      console.log('Monaco editor patched to fix FileAccess issues');
    }
  }, 500);
}

// ワーカースクリプトでの処理（Web Worker環境で実行される場合）
if (typeof self !== 'undefined' && !self.window) {
  self.MonacoEnvironment = {
    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
  };
  
  // FileAccess実装のモンキーパッチ
  self.FileAccess = {
    asFileUri: function() { return { toString: () => '', fsPath: '' }; },
    asBrowserUri: function() { return { toString: () => '', fsPath: '' }; }
  };
  
  // ワーカーのタイプに基づいてスクリプトを読み込む
  const isTypeScriptWorker = self.location.href.includes('ts.worker.js');
  
  if (isTypeScriptWorker) {
    console.log('Loading TypeScript worker scripts...');
    loadMonacoScripts([
      'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/vs/language/typescript/tsWorker.js'
    ]).catch(error => {
      console.error('Failed to load TypeScript worker scripts:', error);
    });
  } else {
    console.log('Loading editor worker scripts...');
    loadMonacoScripts([
      'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/vs/base/worker/workerMain.js'
    ]).catch(error => {
      console.error('Failed to load editor worker scripts:', error);
    });
  }
}

// このスクリプトがエクスポートするもの（ESMではなくグローバル変数として定義）
if (typeof window !== 'undefined') {
  window.monacoConfig = {
    version: '0.35.0',
    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
  };
} 