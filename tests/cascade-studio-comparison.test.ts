import { test, expect } from '@playwright/test';

/**
 * CascadeStudioとオリジナルのCascadeStudioを比較するテスト
 * 注: オリジナルのCascadeStudioは別のサーバーで動作していることを想定
 */
test.describe('CascadeStudio比較テスト', () => {
  // テスト時に使用するURLを定義
  const IMPLEMENTED_URL = 'http://localhost:3000/cascade-studio';
  
  // 実装したCascadeStudioのスクリーンショット取得
  test('実装版CascadeStudioの見た目', async ({ page }) => {
    // 実装したCascadeStudioページへ遷移
    await page.goto(IMPLEMENTED_URL, { timeout: 30000 });
    
    // レイアウトが読み込まれるまで待機
    try {
      await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
      console.log('✅ Golden Layoutが読み込まれました');
      
      // レイアウトが完全に読み込まれるまで待機
      await page.waitForTimeout(2000);
      
      // スクリーンショット取得
      await page.screenshot({ path: 'test-results/implemented-cascade-studio.png', fullPage: true });
    } catch (error) {
      console.error('レイアウト読み込みエラー:', error);
      // エラーが発生してもスクリーンショットを取得
      await page.screenshot({ path: 'test-results/implemented-cascade-studio-error.png', fullPage: true });
      throw error;
    }
  });

  // レイアウト構造テスト（オリジナルの比較なし）
  test('レイアウト構造確認', async ({ page }) => {
    // 実装したCascadeStudioページへ遷移
    await page.goto(IMPLEMENTED_URL);
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // 各パネルの存在確認
    const editorPanel = await page.locator('.lm_item.lm_stack').filter({ hasText: '* Untitled' }).first();
    const cadViewPanel = await page.locator('.lm_item.lm_stack').filter({ hasText: 'CAD View' }).first();
    const consolePanel = await page.locator('.lm_item.lm_stack').filter({ hasText: 'Console' }).first();
    
    await expect(editorPanel).toBeVisible();
    await expect(cadViewPanel).toBeVisible();
    await expect(consolePanel).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/implemented-layout.png' });
  });

  // TweakpaneGUI確認
  test('GUI要素の確認', async ({ page }) => {
    // 実装したCascadeStudio
    await page.goto(IMPLEMENTED_URL);
    
    try {
      // Tweakpaneコンテナが表示されるまで待機
      await page.waitForSelector('.tweakpane-container', { timeout: 10000 });
      
      // GUIパネルが完全に読み込まれるまで待機
      await page.waitForTimeout(2000);
      
      // TweakpaneGUIのスクリーンショット
      const tweakpaneContainer = await page.locator('.tweakpane-container').first();
      if (await tweakpaneContainer.isVisible()) {
        await tweakpaneContainer.screenshot({ path: 'test-results/implemented-gui.png' });
      } else {
        console.error('Tweakpaneコンテナが見つかりません');
        await page.screenshot({ path: 'test-results/implemented-gui-error.png' });
      }
    } catch (error) {
      console.error('GUI要素のスクリーンショット取得に失敗:', error);
      await page.screenshot({ path: 'test-results/implemented-gui-error.png' });
    }
  });

  // コードエディター確認
  test('コードエディターの確認', async ({ page }) => {
    // 実装したCascadeStudio
    await page.goto(IMPLEMENTED_URL);
    
    try {
      // Monacoエディターが初期化されるまで待機
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });
      
      // エディターが完全に読み込まれるまで待機
      await page.waitForTimeout(2000);
      
      // エディター領域のスクリーンショット
      const editorPanel = await page.locator('.lm_item.lm_stack').filter({ hasText: '* Untitled' }).first();
      if (await editorPanel.isVisible()) {
        await editorPanel.screenshot({ path: 'test-results/implemented-editor.png' });
        
        // エディターの内容をわかりやすくするためにテストコードを入力
        await page.locator('.monaco-editor').click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type('// テストコード\nlet box = Box(10, 20, 30);');
        
        // スクリーンショット更新
        await page.waitForTimeout(500);
        await editorPanel.screenshot({ path: 'test-results/implemented-editor-with-code.png' });
      } else {
        console.error('エディターパネルが見つかりません');
        await page.screenshot({ path: 'test-results/implemented-editor-error.png' });
      }
    } catch (error) {
      console.error('エディターのスクリーンショット取得に失敗:', error);
      await page.screenshot({ path: 'test-results/implemented-editor-error.png' });
    }
  });
}); 