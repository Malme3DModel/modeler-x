import { test, expect } from '@playwright/test';

// グローバルオブジェクトの型拡張
declare global {
  interface Window {
    cascadeTestUtils?: {
      isReady?: () => boolean;
      createTestBox?: () => void;
      hasTransformControls?: () => boolean;
      getSelectedObjectPosition?: () => [number, number, number] | null;
      getSelectedObjectRotation?: () => [number, number, number] | null;
    };
  }
}

test.describe('TransformControls機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // OpenCascade.js読み込み完了を待機
    await page.waitForFunction(() => window.cascadeTestUtils?.isReady?.(), {
      timeout: 60000
    });
    
    // テスト用サンプルオブジェクト作成
    await page.evaluate(() => {
      window.cascadeTestUtils?.createTestBox?.();
    });
    
    await page.waitForTimeout(1000);
  });

  test('オブジェクト選択でTransformGizmoが表示される', async ({ page }) => {
    // キャンバス内のオブジェクトをクリック
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // TransformControlsが表示されることを確認
    const hasTransformControls = await page.evaluate(() => {
      return window.cascadeTestUtils?.hasTransformControls?.();
    });
    
    expect(hasTransformControls).toBeTruthy();
    
    // UIコンポーネントが表示されることを確認
    await expect(page.locator('.transform-controls-ui')).toBeVisible();
  });

  test('移動モードでオブジェクトが移動できる', async ({ page }) => {
    // オブジェクト選択
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // 移動モードボタンをクリック
    await page.click('button[title="移動モード (G)"]');
    
    // オブジェクトの初期位置を記録
    const initialPosition = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectPosition?.();
    });
    
    // ドラッグ操作でオブジェクトを移動
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(450, 300);
    await page.mouse.up();
    
    // 位置が変わったことを確認
    const newPosition = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectPosition?.();
    });
    
    expect(newPosition).not.toEqual(initialPosition);
  });

  test('回転モードでオブジェクトが回転できる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    await page.click('button[title="回転モード (R)"]');
    
    const initialRotation = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectRotation?.();
    });
    
    // 回転操作
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(420, 280);
    await page.mouse.up();
    
    const newRotation = await page.evaluate(() => {
      return window.cascadeTestUtils?.getSelectedObjectRotation?.();
    });
    
    expect(newRotation).not.toEqual(initialRotation);
  });

  test('キーボードショートカットでモード切り替えができる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // Gキーで移動モード
    await page.keyboard.press('g');
    await expect(page.locator('button[title="移動モード (G)"]')).toHaveClass(/bg-blue-600/);
    
    // Rキーで回転モード
    await page.keyboard.press('r');
    await expect(page.locator('button[title="回転モード (R)"]')).toHaveClass(/bg-blue-600/);
    
    // Sキーでスケールモード
    await page.keyboard.press('s');
    await expect(page.locator('button[title="スケールモード (S)"]')).toHaveClass(/bg-blue-600/);
  });

  test('Escapeキーで選択解除ができる', async ({ page }) => {
    await page.click('canvas', { position: { x: 400, y: 300 } });
    
    // 選択されていることを確認
    await expect(page.locator('.transform-controls-ui')).toBeVisible();
    
    // Escapeキーで選択解除
    await page.keyboard.press('Escape');
    
    // UIが消えることを確認
    await expect(page.locator('.transform-controls-ui')).not.toBeVisible();
  });
}); 