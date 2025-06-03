// Monaco Editor TypeScript worker loader - with AMD emulation
// モジュールスクリプトの制限を回避するためのAMDエミュレーション

// AMD (define/require) のエミュレーション
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

// TypeScriptワーカー環境設定
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/'
};

// スクリプトの内容を直接フェッチして評価する
fetch('https://cdn.jsdelivr.net/npm/monaco-editor@0.35.0/min/vs/language/typescript/tsWorker.js')
  .then(response => response.text())
  .then(scriptText => {
    try {
      // 直接evalする代わりにFunction経由で実行
      const scriptFunc = new Function(scriptText);
      scriptFunc();
      console.log('✅ TypeScript worker script loaded successfully');
    } catch (err) {
      console.error('❌ Error in TypeScript worker script:', err);
    }
  })
  .catch(err => {
    console.error('❌ Failed to fetch TypeScript worker script:', err);
  }); 