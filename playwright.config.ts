import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // テスト実行ごとに最大30秒のタイムアウト
  timeout: 30000,
  // 各アサーションのタイムアウト
  expect: {
    timeout: 5000
  },
  // すべてのテストを1つのワーカーで実行
  fullyParallel: false,
  // テスト失敗時に再試行しない
  retries: 0,
  // テスト実行ごとにブラウザを新規作成
  workers: 1,
  // テスト実行者の情報
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],

  // 各プロジェクト（ブラウザ）の設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // テスト時のwebサーバー設定
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
}); 