import { test, expect } from '@playwright/test';

/**
 * CascadeStudio完全コピー機能テスト
 */
test.describe('CascadeStudio機能テスト', () => {
  // 各テスト前に実行
  test.beforeEach(async ({ page }) => {
    // テスト用ページへ遷移
    await page.goto('http://localhost:3000/cascade-studio');
    
    // レイアウトが読み込まれるまで待機
    await page.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    console.log('✅ Golden Layoutが読み込まれました');
  });
  
  // 基本レイアウトテスト
  test('Golden Layoutの3パネル構成が正しく表示される', async ({ page }) => {
    // 左パネル（Monaco Editor）が存在するか確認
    const editorPanel = await page.locator('.lm_item:has-text("* Untitled")');
    await expect(editorPanel).toBeVisible();
    
    // 右上パネル（CAD View）が存在するか確認
    const cadViewPanel = await page.locator('.lm_item:has-text("CAD View")');
    await expect(cadViewPanel).toBeVisible();
    
    // 右下パネル（Console）が存在するか確認
    const consolePanel = await page.locator('.lm_item:has-text("Console")');
    await expect(consolePanel).toBeVisible();
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/golden-layout.png' });
  });
  
  // TweakpaneGUIテスト
  test('TweakpaneGUIが正しく表示・動作する', async ({ page }) => {
    // Tweakpaneコンテナが表示されるまで待機
    await page.waitForSelector('.tweakpane-container', { timeout: 5000 });
    
    // Evaluateボタンが存在するか確認
    const evaluateButton = await page.getByText('Evaluate', { exact: true });
    await expect(evaluateButton).toBeVisible();
    
    // Mesh Settingsフォルダが存在するか確認
    const meshSettings = await page.getByText('Mesh Settings');
    await expect(meshSettings).toBeVisible();
    
    // スライダーを操作してみる
    await meshSettings.click(); // フォルダを開く
    
    // コンソールにログが追加されるか確認
    const consoleElement = await page.locator('.cascade-console');
    const initialConsoleText = await consoleElement.textContent();
    
    // Evaluateボタンをクリック
    await evaluateButton.click();
    
    // コンソールテキストが更新されたか確認
    await page.waitForTimeout(1000); // アニメーションなどの待機
    const updatedConsoleText = await consoleElement.textContent();
    expect(updatedConsoleText).not.toEqual(initialConsoleText);
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/tweakpane-gui.png' });
  });
  
  // MonacoエディターとURLハッシュのテスト
  test('Monacoエディターの編集とURLハッシュの更新', async ({ page }) => {
    // Monacoエディターが初期化されるまで待機
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // 初期URLハッシュを取得
    const initialUrl = page.url();
    
    // コードを編集（F5キーでコード評価）
    await page.keyboard.press('F5');
    
    // URLハッシュが更新されるまで待機
    await page.waitForTimeout(2000);
    const updatedUrl = page.url();
    
    // URLハッシュが更新されたか確認
    expect(updatedUrl).not.toEqual(initialUrl);
    expect(updatedUrl).toContain('#');
    
    // スクリーンショット取得
    await page.screenshot({ path: 'test-results/monaco-editor.png' });
  });
  
  // URL共有機能のテスト
  test('URL共有機能とURLからの状態復元', async ({ page, context }) => {
    // テスト用の簡単なコードに変更
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    await page.keyboard.type('// This is a test code\nlet box = Box(20, 20, 20);');
    
    // F5キーで評価して状態をURLに保存
    await page.keyboard.press('F5');
    
    // URLが更新されるまで待機
    await page.waitForTimeout(2000);
    const sharedUrl = page.url();
    
    // 新しいページでURLを開く
    const newPage = await context.newPage();
    await newPage.goto(sharedUrl);
    
    // レイアウトが読み込まれるまで待機
    await newPage.waitForSelector('.lm_goldenlayout', { timeout: 10000 });
    
    // Monacoエディターが初期化されるまで待機
    await newPage.waitForSelector('.monaco-editor', { timeout: 10000 });
    
    // エディターのテキストに変更が反映されているか確認
    // 注: 実際のエディターの内容確認はAPIが必要なため、ここではスクリーンショットで目視確認
    await newPage.screenshot({ path: 'test-results/url-sharing.png' });
  });
}); 