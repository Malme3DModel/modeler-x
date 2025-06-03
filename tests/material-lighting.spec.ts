import { test, expect } from '@playwright/test';

test.describe('3Dビューポート マテリアルとライティング', () => {
  test.beforeEach(async ({ page }) => {
    // アプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ローディングが完了するまで待機
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 60000 });
    
    // 3Dビューポートが表示されるまで待機
    await page.waitForSelector('[data-testid="cascade-3d-viewport"]', { timeout: 10000 });
  });

  test('MatCapマテリアルが正しく適用されている', async ({ page }) => {
    // スクリーンショットを取得して視覚的に確認
    await page.screenshot({ path: 'test-results/matcap-material.png', fullPage: true });
    
    // マテリアルの種類を確認
    const materialInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getMaterialInfo();
    });
    
    // マテリアルがMeshMatcapMaterialであることを確認
    expect(materialInfo?.type).toBe('MeshMatcapMaterial');
  });

  test('ライティング設定が正しく適用されている', async ({ page }) => {
    // ライトの情報を取得
    const lightInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getLightingInfo();
    });
    
    // 必要なライトが存在することを確認
    expect(lightInfo?.hasHemisphereLight).toBe(true);
    expect(lightInfo?.hasDirectionalLight).toBe(true);
    expect(lightInfo?.hasAmbientLight).toBe(true);
  });

  test('フォグが正しく設定されている', async ({ page }) => {
    // フォグの設定を確認
    const fogInfo = await page.evaluate(() => {
      return (window as any).cascadeTestUtils?.getFogInfo();
    });
    
    expect(fogInfo?.hasFog).toBe(true);
    expect(fogInfo?.fogColor).toBe('#f0f0f0');
  });
}); 