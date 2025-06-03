import { test, expect } from '@playwright/test';

test('基本テスト - ホームページが読み込まれる', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const title = await page.title();
  expect(title).toContain('OpenCascade.js Demo');
}); 