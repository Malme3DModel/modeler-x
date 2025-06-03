import { test, expect } from '@playwright/test';

/**
 * CascadeStudioとオリジナルのCascadeStudioを比較するテスト
 */
test.describe('CascadeStudio比較テスト', () => {
  // 実装したCascadeStudioのスクリーンショット取得
  test('実装版CascadeStudioの見た目', async ({ page }) => {
    // 実装したCascadeStudioページへ遷移
    await page.goto('http://localhost:3000/cascade-studio');
    
    // レイアウトが読み込まれるまで待機
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/implemented-cascade-studio.png', fullPage: true });
  });

  // オリジナルのCascadeStudio（静的サンプル）のスクリーンショット取得
  test('オリジナルCascadeStudioの見た目', async ({ page }) => {
    // オリジナルCascadeStudioをローカルの静的ファイルから表示
    await page.goto('file:///' + process.cwd() + '/docs/template/index.html');
    
    // コンテンツが読み込まれるまで待機（適宜セレクタを調整）
    await page.waitForSelector('#codeEditor', { timeout: 10000 });
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/original-cascade-studio.png', fullPage: true });
  });

  // レイアウト構造比較
  test('レイアウト構造の比較', async ({ page, browser }) => {
    // 実装したCascadeStudioページへ遷移
    await page.goto('http://localhost:3000/cascade-studio');
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // 実装版の構造スクリーンショット
    await page.screenshot({ path: 'test-results/implemented-layout.png' });
    
    // 新しいコンテキストでオリジナルを開く
    const context = await browser.newContext();
    const originalPage = await context.newPage();
    await originalPage.goto('file:///' + process.cwd() + '/docs/template/index.html');
    await originalPage.waitForSelector('#codeEditor', { timeout: 10000 });
    
    // オリジナル版の構造スクリーンショット
    await originalPage.screenshot({ path: 'test-results/original-layout.png' });
  });

  // TweakpaneGUI比較
  test('GUI要素の比較', async ({ page, browser }) => {
    // 実装したCascadeStudio
    await page.goto('http://localhost:3000/cascade-studio');
    await page.waitForSelector('.tweakpane-container', { timeout: 10000 });
    
    // TweakpaneGUIのスクリーンショット
    const tweakpaneContainer = await page.locator('.tweakpane-container');
    await tweakpaneContainer.screenshot({ path: 'test-results/implemented-gui.png' });
    
    // オリジナルを開く
    const context = await browser.newContext();
    const originalPage = await context.newPage();
    await originalPage.goto('file:///' + process.cwd() + '/docs/template/index.html');
    
    // オリジナルのGUI要素が表示されるまで待機
    await originalPage.waitForTimeout(5000);
    
    // オリジナルのGUIパネルのスクリーンショット（セレクタは要調整）
    try {
      const originalGuiContainer = await originalPage.locator('.dg.main');
      if (await originalGuiContainer.isVisible()) {
        await originalGuiContainer.screenshot({ path: 'test-results/original-gui.png' });
      } else {
        console.log('オリジナルGUIコンテナが見つかりません');
      }
    } catch (error) {
      console.error('オリジナルGUIのスクリーンショット取得に失敗:', error);
    }
  });

  // コードエディター比較
  test('コードエディターの比較', async ({ page, browser }) => {
    // 実装したCascadeStudio
    await page.goto('http://localhost:3000/cascade-studio');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // Monacoエディターのスクリーンショット
    const editorContainer = await page.locator('.monaco-editor');
    await editorContainer.screenshot({ path: 'test-results/implemented-editor.png' });
    
    // オリジナルを開く
    const context = await browser.newContext();
    const originalPage = await context.newPage();
    await originalPage.goto('file:///' + process.cwd() + '/docs/template/index.html');
    
    // オリジナルのエディターが表示されるまで待機
    await originalPage.waitForTimeout(5000);
    
    // オリジナルのエディターのスクリーンショット（セレクタは要調整）
    try {
      const originalEditorContainer = await originalPage.locator('#codeEditor');
      if (await originalEditorContainer.isVisible()) {
        await originalEditorContainer.screenshot({ path: 'test-results/original-editor.png' });
      } else {
        console.log('オリジナルエディターコンテナが見つかりません');
      }
    } catch (error) {
      console.error('オリジナルエディターのスクリーンショット取得に失敗:', error);
    }
  });
}); 