import { test, expect } from '@playwright/test';

test.describe('ファイルエクスポート機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000); // アプリケーションの初期化を待つ
  });

  test('バッチエクスポートダイアログが開く', async ({ page }) => {
    // まず簡単な形状を生成
    const codeEditor = page.locator('.monaco-editor');
    await codeEditor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type(`
const box = Box(10, 10, 10);
const sphere = Sphere(5);
const result = Union([box, sphere]);
    `);
    await page.keyboard.press('F5');
    await page.waitForTimeout(2000);

    // バッチエクスポートボタンが有効になるまで明示的に待つ
    const batchExportButton = page.locator('[data-testid="batch-export-btn"]');
    await batchExportButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(batchExportButton).toBeEnabled();
    await batchExportButton.click();
    await expect(page.locator('text=バッチエクスポート').first()).toBeVisible();
    await expect(page.locator('text=STEP (.step)')).toBeVisible();
    await expect(page.locator('text=STL (.stl)')).toBeVisible();
    await expect(page.locator('text=OBJ (.obj)')).toBeVisible();
  });

  test('エクスポート品質設定が表示される', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    const codeEditor = page.locator('.monaco-editor');
    await codeEditor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Box(10, 10, 10);');
    await page.keyboard.press('F5');
    await page.waitForTimeout(2000);
    const batchExportButton = page.locator('[data-testid="batch-export-btn"]');
    await batchExportButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(batchExportButton).toBeEnabled();
    await batchExportButton.click();
    const stlCheckbox = page.locator('input[type="checkbox"]').nth(1);
    await expect(stlCheckbox).toBeChecked();
    await expect(page.locator('text=STL エクスポート設定')).toBeVisible();
    await expect(page.locator('text=品質プリセット')).toBeVisible();
    await expect(page.locator('text=高品質')).toBeVisible();
    await expect(page.locator('text=標準')).toBeVisible();
    await expect(page.locator('text=低品質')).toBeVisible();
    await expect(page.locator('text=ドラフト')).toBeVisible();
  });

  test('ファイルプレビュー機能が動作する', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    const fileInput = page.locator('input[type="file"]');
    const stlContent = `solid test
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 1 0
    endloop
  endfacet
endsolid test`;
    await fileInput.setInputFiles({
      name: 'test.stl',
      mimeType: 'model/stl',
      buffer: Buffer.from(stlContent)
    });
    await expect(page.locator('text=ファイルプレビュー')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=test.stl')).toBeVisible();
    await expect(page.locator('text=STL')).toBeVisible();
    await expect(page.locator('text=ファイル解析結果')).toBeVisible();
    await expect(page.locator('text=三角形数')).toBeVisible();
    await expect(page.locator('text=複雑度')).toBeVisible();
  });

  test('OBJエクスポートオプションが表示される', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    const codeEditor = page.locator('.monaco-editor');
    await codeEditor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Sphere(5);');
    await page.keyboard.press('F5');
    await page.waitForTimeout(2000);
    const batchExportButton = page.locator('[data-testid="batch-export-btn"]');
    await batchExportButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(batchExportButton).toBeEnabled();
    await batchExportButton.click();
    const objCheckbox = page.locator('text=OBJ (.obj)').locator('..').locator('input[type="checkbox"]');
    await objCheckbox.click();
    await expect(page.locator('text=OBJ エクスポート設定')).toBeVisible();
    await expect(page.locator('text=法線情報を含める')).toBeVisible();
    await expect(page.locator('text=スムーズシェーディングに必要')).toBeVisible();
  });
}); 