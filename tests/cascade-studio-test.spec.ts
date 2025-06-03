import { test, expect } from '@playwright/test';

/**
 * CascadeStudioの基本的なテスト
 */
test.describe('CascadeStudio基本テスト', () => {
  // ページが表示されるかテスト
  test('CascadeStudioページが表示される', async ({ page }) => {
    await page.goto('http://localhost:3000/cascade-studio');
    const title = await page.title();
    expect(title).toContain('OpenCascade.js Demo');
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/cascade-studio-page.png' });
  });
  
  // レイアウトが表示されるかテスト
  test('Golden Layoutが表示される', async ({ page }) => {
    await page.goto('http://localhost:3000/cascade-studio');
    
    // レイアウトが表示されるまで待機
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // レイアウトが表示されていることを確認
    const layout = await page.locator('.lm_goldenlayout');
    await expect(layout).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/golden-layout.png' });
  });
  
  // Monacoエディターが表示されるかテスト
  test('Monacoエディターが表示される', async ({ page }) => {
    await page.goto('http://localhost:3000/cascade-studio');
    
    // エディターが表示されるまで待機
    await page.waitForSelector('.monaco-editor-container .monaco-editor', { timeout: 15000 });
    
    // エディターが表示されていることを確認
    const editor = await page.locator('.monaco-editor-container .monaco-editor').first();
    await expect(editor).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/monaco-editor.png' });
  });
}); 