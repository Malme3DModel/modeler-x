const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// メインウィンドウの参照を保持
let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // 開発時のCORSエラーを回避
    },
    icon: path.join(__dirname, '../public/icon/android-chrome-192x192.png'), // アイコンがある場合
    show: false, // 初期化完了まで非表示
  });

  // 開発モードかプロダクションモードかで読み込むURLを変更
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 開発モードの場合はDevToolsを開く
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部リンクをデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// アプリケーションの準備ができた時の処理
app.whenReady().then(() => {
  createWindow();

  // macOSでアプリがアクティブになった時の処理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // メニューバーを設定（オプション）
  if (isDev) {
    // 開発モードではデフォルトメニューを使用
    Menu.setApplicationMenu(null);
  }
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外では、すべてのウィンドウが閉じられたらアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
}); 