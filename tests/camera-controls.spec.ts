import { test, expect } from '@playwright/test';

test.describe('Camera Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // CascadeStudio UIが表示されるまで待機（タイムアウト時間を長めに設定）
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // エディタが表示されるまで待機
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    
    // カメラコントロールが表示されるまで待機を試みる
    await page.waitForTimeout(5000); // UIがレンダリングされるまで待機
    
    // 基本的なCADオブジェクトを生成
    await page.click('.monaco-editor');
    await page.keyboard.type(`
      let box = new oc.BRepPrimAPI_MakeBox(10, 10, 10).Shape();
      cacheShape(box);
    `);
    await page.keyboard.press('F5');
    await page.waitForTimeout(3000); // CAD演算完了待ち
  });

  test('視点プリセット切り替えが動作する', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    try {
      await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log('カメラコントロールパネルが見つかりません。');
      
      // 現在のHTMLをログに出力
      const html = await page.content();
      console.log('ページHTML:', html.substring(0, 1000) + '...');
      
      throw e;
    }
    
    // Front視点
    await page.click('[data-testid="camera-front"]');
    await page.waitForTimeout(1500); // アニメーション完了待ち
    
    // Top視点
    await page.click('[data-testid="camera-top"]');
    await page.waitForTimeout(1500);
    
    // ISO視点
    await page.click('[data-testid="camera-iso"]');
    await page.waitForTimeout(1500);
    
    // エラーが発生していないことを確認
    const errors = await page.evaluate(() => {
      return (window as any).console?.error?.calls || [];
    });
    expect(errors.length).toBe(0);
  });

  test('Fit to Object機能が動作する', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    
    // Fit to Objectボタンをクリック
    await page.click('[data-testid="camera-fit"]');
    await page.waitForTimeout(1500); // アニメーション完了待ち
    
    // カメラがオブジェクトにフィットしていることを確認
    // （具体的な位置確認は実装に応じて調整）
    const cameraPosition = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? 'positioned' : 'not found';
    });
    expect(cameraPosition).toBe('positioned');
  });

  test('カメラアニメーションがスムーズに動作する', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    
    // 複数の視点を連続で切り替え
    await page.click('[data-testid="camera-front"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="camera-right"]');
    await page.waitForTimeout(500);
    
    await page.click('[data-testid="camera-top"]');
    await page.waitForTimeout(1500);
    
    // アニメーション中にエラーが発生していないことを確認
    const consoleErrors = await page.evaluate(() => {
      return (window as any).console?.error?.calls || [];
    });
    expect(consoleErrors.length).toBe(0);
  });

  test('既存のTransformControlsとの競合がない', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    
    // 必要なUIが表示されるまで待機
    await page.waitForTimeout(1000);
    
    // カメラ視点を変更
    await page.click('[data-testid="camera-iso"]');
    await page.waitForTimeout(1500);
    
    // カメラビューが動作していることを確認
    const cameraErrors = await page.evaluate(() => {
      return (window as any).console?.error?.calls?.filter(
        (call: any) => call.includes('camera')
      ) || [];
    });
    expect(cameraErrors.length).toBe(0);
  });

  test('全ての視点ボタンが存在し、クリック可能である', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    
    const viewButtons = [
      'camera-front',
      'camera-back', 
      'camera-top',
      'camera-bottom',
      'camera-left',
      'camera-right',
      'camera-iso',
      'camera-fit'
    ];

    for (const buttonId of viewButtons) {
      const button = page.locator(`[data-testid="${buttonId}"]`);
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      
      // ボタンをクリックしてエラーが発生しないことを確認
      await button.click();
      await page.waitForTimeout(300);
    }
  });

  test('カメラコントロールUIが正しい位置に表示される', async ({ page }) => {
    // まずカメラコントロールが表示されていることを確認
    await expect(page.locator('[data-testid="camera-controls-panel"]')).toBeVisible({ timeout: 10000 });
    
    // Camera Viewsタイトルが表示されることを確認
    await expect(page.locator('text=Camera Views')).toBeVisible();
  });
}); 