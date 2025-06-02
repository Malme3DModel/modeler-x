// OpenCascade.jsファイル自動コピースクリプト
// Usage: node copy-opencascade.js

const fs = require('fs');
const path = require('path');

console.log('🚀 OpenCascade.js ファイル配置スクリプト開始');

// パス定義
const sourceDir = 'node_modules/opencascade.js/dist';
const targetDir = 'public/opencascade';

// 必要なファイル
const filesToCopy = [
  { 
    src: 'opencascade.wasm.js', 
    dest: 'opencascade.wasm.js',
    description: 'JavaScript ライブラリ (WebWorker対応)'
  },
  { 
    src: 'opencascade.wasm.wasm', 
    dest: 'opencascade.wasm.wasm',
    description: 'WebAssembly バイナリ'
  }
];

try {
  // ターゲットディレクトリの作成
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${targetDir}`);
  }

  // ファイルのコピー
  for (const file of filesToCopy) {
    const srcPath = path.join(sourceDir, file.src);
    const destPath = path.join(targetDir, file.dest);

    if (fs.existsSync(srcPath)) {
      // ファイルサイズ確認
      const stats = fs.statSync(srcPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`📦 コピー中: ${file.description} (${fileSizeMB}MB)`);
      console.log(`   ${srcPath} → ${destPath}`);
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ 完了: ${file.dest}`);
    } else {
      console.error(`❌ ソースファイルが見つかりません: ${srcPath}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 OpenCascade.jsファイル配置完了！');
  console.log('\n📋 配置されたファイル:');
  
  for (const file of filesToCopy) {
    const destPath = path.join(targetDir, file.dest);
    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   ✅ ${destPath} (${fileSizeMB}MB)`);
    }
  }

  console.log('\n🔄 Next.js開発サーバーを再起動してください:');
  console.log('   npm run dev');

} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
} 