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
  if (!window.MonacoEnvironment) {
    window.MonacoEnvironment = {
      getWorkerUrl: function(_moduleId, label) {
        // TypeScriptかJavaScriptのワーカーの場合
        if (label === 'typescript' || label === 'javascript') {
          return '/monaco-editor-workers/ts.worker.js';
        }
        // それ以外のワーカーの場合
        return '/monaco-editor-workers/editor.worker.js';
      }
    };
  }
  
  // レガシーコード用にファイルアクセスオブジェクトを作成
  if (typeof window.monaco === 'undefined') {
    window.monaco = {};
  }
  
  if (typeof window.monaco.fileAccess === 'undefined') {
    window.monaco.fileAccess = {};
  }

  if (typeof window.monaco.fileAccess.FileAccess === 'undefined') {
    window.monaco.fileAccess.FileAccess = {
      asFileUri: function(path) { 
        return { 
          toString: function() { return path || ''; },
          fsPath: path || '',
          scheme: 'file'
        };
      },
      asBrowserUri: function(path) { 
        return { 
          toString: function() { return path || ''; },
          fsPath: path || '',
          scheme: 'http'
        };
      }
    };
  }
  
  if (typeof window.monaco.Uri === 'undefined') {
    window.monaco.Uri = {
      parse: function(path) {
        return {
          toString: function() { return path || ''; },
          fsPath: path || '',
          scheme: path && path.startsWith('http') ? 'http' : 'file'
        };
      },
      file: function(path) {
        return {
          toString: function() { return path || ''; },
          fsPath: path || '',
          scheme: 'file'
        };
      }
    };
  }
  
  // エディタ作成時のモンキーパッチ
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (window.monaco && window.monaco.editor) {
        console.log('Monaco editor patched to fix FileAccess issues');
        
        // 直接FileAccessImplを修正
        try {
          if (window.monaco && window.monaco.editor) {
            // FileAccessImplクラスへの参照を取得
            const monacoModules = Object.keys(window.monaco).filter(k => window.monaco[k] && typeof window.monaco[k] === 'object');
            
            // 見つからない場合は独自の実装を注入
            window.FileAccessImpl = window.FileAccessImpl || {
              toUrl: function(path) {
                return path ? path.toString() : '';
              },
              toUri: function(path) {
                return {
                  toString: function() { return path || ''; },
                  fsPath: path || '',
                  scheme: 'file'
                };
              }
            };
            
            // monaco内部へのインジェクション
            if (window.monaco.fileAccess) {
              window.monaco.fileAccess.FileAccessImpl = window.FileAccessImpl;
            }
            
            console.log('Successfully patched FileAccessImpl');
          }
        } catch (err) {
          console.error('Failed to patch FileAccessImpl:', err);
        }
      }
    }, 1000);
  });
}

// ワーカースクリプトでの処理（Web Worker環境で実行される場合）
if (typeof self !== 'undefined' && !self.window) {
  self.MonacoEnvironment = {
    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
  };
  
  // FileAccess実装のモンキーパッチ
  self.FileAccess = {
    asFileUri: function(path) { 
      return { 
        toString: function() { return path || ''; },
        fsPath: path || '',
        scheme: 'file' 
      }; 
    },
    asBrowserUri: function(path) { 
      return { 
        toString: function() { return path || ''; },
        fsPath: path || '',
        scheme: 'http' 
      }; 
    }
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