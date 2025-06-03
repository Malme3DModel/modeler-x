import { test, expect } from '@playwright/test';

test.describe('レイキャスティングデバッグテスト', () => {
  test.beforeEach(async ({ page }) => {
    // ルートURLに変更
    await page.goto('http://localhost:3000');
    
    // より長い待機時間を設定
    await page.waitForTimeout(5000);
    
    // コンソールログをキャプチャ
    page.on('console', msg => {
      console.log(`ブラウザログ: ${msg.type()} - ${msg.text()}`);
    });
  });

  test('ページ基本構造確認', async ({ page }) => {
    // ページのスクリーンショットを保存
    await page.screenshot({ path: 'test-results/root-page.png', fullPage: true });
    
    // データ収集
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyChildren: document.body.children.length,
        mainExists: !!document.querySelector('main'),
        // Three.js関連の要素を確認
        canvases: Array.from(document.querySelectorAll('canvas')).map(canvas => ({
          width: canvas.width,
          height: canvas.height,
          parentElement: canvas.parentElement?.tagName
        })),
        // データ属性を持つ要素を確認
        dataTestElements: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
          testId: el.getAttribute('data-testid'),
          tagName: el.tagName
        }))
      };
    });
    
    console.log('🔍 ページ基本情報:', pageInfo);
    
    // メイン要素が存在することを確認
    expect(pageInfo.mainExists).toBeTruthy();
  });

  test('ThreeJSViewport確認', async ({ page }) => {
    // ページ内のThree.js関連コンポーネントを確認
    const threeJSInfo = await page.evaluate(() => {
      // グローバル関数の存在確認
      const globalFunctions = Object.keys(window).filter(key => 
        key.startsWith('three') || 
        key.includes('THREE') || 
        key.includes('React') ||
        key.includes('cascade')
      );
      
      // canvasの存在確認
      const canvases = Array.from(document.querySelectorAll('canvas'));
      
      return {
        globalFunctions,
        canvasCount: canvases.length,
        // データ属性を持つ要素
        dataTestElements: Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
          id: el.getAttribute('data-testid'),
          isVisible: !!(
            (el as HTMLElement).offsetWidth || 
            (el as HTMLElement).offsetHeight || 
            el.getClientRects().length
          )
        })),
        // DOMツリーの構造（簡略化）
        bodyStructure: Array.from(document.body.children).map(child => ({
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          childrenCount: child.children.length
        }))
      };
    });
    
    console.log('🔍 ThreeJS関連情報:', threeJSInfo);
    
    // 情報収集が目的なのでテストは常に成功
    expect(true).toBeTruthy();
  });
}); 