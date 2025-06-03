import { test, expect } from '@playwright/test';

/**
 * CascadeStudio簡易機能テスト
 */
test.describe('CascadeStudio簡易テスト', () => {
  // 各テスト前に実行
  test.beforeEach(async ({ page }) => {
    // テスト用ページへ遷移
    await page.goto('http://localhost:3000/cascade-studio');
    
    // レイアウトが読み込まれるまで待機
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    console.log('✅ Golden Layoutが読み込まれました');
  });
  
  // 基本レイアウトテスト
  test('レイアウトが表示される', async ({ page }) => {
    // レイアウトが表示されていることを確認
    const layout = await page.locator('.lm_goldenlayout');
    await expect(layout).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/layout.png' });
  });
  
  // エディターテスト
  test('エディターが表示される', async ({ page }) => {
    // エディターが表示されるまで待機
    await page.waitForSelector('.monaco-editor-container .monaco-editor', { timeout: 15000 });
    
    // エディターが表示されていることを確認
    const editor = await page.locator('.monaco-editor-container .monaco-editor').first();
    await expect(editor).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/editor.png' });
  });
  
  // Tweakpaneテスト
  test('Tweakpaneが表示される', async ({ page }) => {
    // Tweakpaneが表示されるまで待機
    await page.waitForSelector('.tweakpane-container', { timeout: 10000 });
    
    // Tweakpaneが表示されていることを確認
    const tweakpane = await page.locator('.tweakpane-container');
    await expect(tweakpane).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/tweakpane.png' });
  });
}); 