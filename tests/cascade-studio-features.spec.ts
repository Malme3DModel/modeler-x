import { test, expect } from '@playwright/test';

/**
 * CascadeStudioの機能テスト
 */
test.describe('CascadeStudio機能テスト', () => {
  // 各テスト前に実行
  test.beforeEach(async ({ page }) => {
    // ページへ遷移
    await page.goto('http://localhost:3000/cascade-studio');
    
    // レイアウトが読み込まれるまで待機
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    console.log('✅ Golden Layoutが読み込まれました');
    
    // エディターが読み込まれるまで待機
    await page.waitForSelector('.monaco-editor-container .monaco-editor', { timeout: 15000 });
    console.log('✅ Monacoエディターが読み込まれました');
  });
  
  // エディターの操作テスト
  test('エディターでコードを編集できる', async ({ page }) => {
    // エディターにフォーカス
    await page.locator('.monaco-editor-container .monaco-editor').first().click();
    
    // 全選択して削除
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // テストコードを入力
    await page.keyboard.type('// テストコード\nlet box = Box(10, 20, 30);');
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/editor-with-code.png' });
    
    // F5キーでコード実行
    await page.keyboard.press('F5');
    
    // 実行完了まで少し待機
    await page.waitForTimeout(2000);
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/code-executed.png' });
  });
  
  // Tweakpaneの操作テスト
  test('TweakpaneGUIを操作できる', async ({ page }) => {
    // Tweakpaneが表示されるまで待機
    await page.waitForSelector('.tweakpane-container', { timeout: 10000 });
    
    // Evaluateボタンが表示されるまで待機
    const evaluateButton = await page.getByRole('button', { name: 'Evaluate' }).first();
    await expect(evaluateButton).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/tweakpane-before.png' });
    
    // Evaluateボタンをクリック
    await evaluateButton.click();
    
    // クリック後の待機
    await page.waitForTimeout(2000);
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/tweakpane-after.png' });
  });
}); 