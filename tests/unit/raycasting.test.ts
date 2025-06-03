/**
 * レイキャスティング機能のユニットテスト
 * 注意: React Three Fiberコンポーネントのため、統合テストが主体
 * このファイルは簡易的なテストのため、npm test:unit ではなく直接実行されます
 */

// 簡易的なアサーション関数
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: Expected ${expected}, but got ${actual}. ${message || ''}`);
  }
}

// テスト実行関数
function runTest(testName: string, testFn: () => void): void {
  try {
    testFn();
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${testName}: FAILED - ${errorMessage}`);
  }
}

// マウス座標正規化関数
const normalizeMouseCoords = (
  clientX: number, 
  clientY: number, 
  rectLeft: number, 
  rectTop: number, 
  rectWidth: number, 
  rectHeight: number
) => {
  const x = ((clientX - rectLeft) / rectWidth) * 2 - 1;
  const y = -((clientY - rectTop) / rectHeight) * 2 + 1;
  return { x, y };
};

// レイキャスティング状態インターフェース
interface RaycastingState {
  isEnabled: boolean;
  hoveredObject: string | null;
  hoveredFace: number | null;
}

const createRaycastingState = (
  isEnabled: boolean,
  hoveredObject: string | null = null,
  hoveredFace: number | null = null
): RaycastingState => {
  return {
    isEnabled,
    hoveredObject,
    hoveredFace
  };
};

// マウス座標の範囲チェック関数
const isValidMouseCoordinate = (x: number, y: number): boolean => {
  return x >= -1 && x <= 1 && y >= -1 && y <= 1;
};

// フェイスインデックスの有効性チェック関数
const isValidFaceIndex = (faceIndex: number | null | undefined): boolean => {
  return faceIndex !== null && faceIndex !== undefined && faceIndex >= 0 && Number.isInteger(faceIndex);
};

// Vector2のモック実装
class MockVector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): MockVector2 {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(vector: MockVector2): MockVector2 {
    this.x = vector.x;
    this.y = vector.y;
    return this;
  }
}

// テストスイートの実行
export function runRaycastingTests(): void {
  console.log('🧪 レイキャスティング ユニットテスト開始');

  runTest('マウス座標の正規化 - 中央', () => {
    const result = normalizeMouseCoords(100, 100, 0, 0, 200, 200);
    assertEqual(result.x, 0, 'X座標が中央で0になる');
    assertEqual(result.y, 0, 'Y座標が中央で0になる');
  });

  runTest('マウス座標の正規化 - 右下角', () => {
    const result = normalizeMouseCoords(200, 200, 0, 0, 200, 200);
    assertEqual(result.x, 1, 'X座標が右端で1になる');
    assertEqual(result.y, -1, 'Y座標が下端で-1になる');
  });

  runTest('マウス座標の正規化 - 左上角', () => {
    const result = normalizeMouseCoords(0, 0, 0, 0, 200, 200);
    assertEqual(result.x, -1, 'X座標が左端で-1になる');
    assertEqual(result.y, 1, 'Y座標が上端で1になる');
  });

  runTest('オフセットがある場合のマウス座標正規化', () => {
    const result = normalizeMouseCoords(150, 150, 50, 50, 200, 200);
    assertEqual(result.x, 0, 'オフセットがある場合の中央X座標');
    assertEqual(result.y, 0, 'オフセットがある場合の中央Y座標');
  });

  runTest('レイキャスティング状態オブジェクト - 初期状態', () => {
    const state = createRaycastingState(true);
    assertEqual(state.isEnabled, true, 'レイキャスティングが有効');
    assertEqual(state.hoveredObject, null, 'ホバーオブジェクトがnull');
    assertEqual(state.hoveredFace, null, 'ホバーフェイスがnull');
  });

  runTest('レイキャスティング状態オブジェクト - ホバー状態', () => {
    const state = createRaycastingState(true, 'object-123', 5);
    assertEqual(state.isEnabled, true, 'レイキャスティングが有効');
    assertEqual(state.hoveredObject, 'object-123', 'ホバーオブジェクトが設定されている');
    assertEqual(state.hoveredFace, 5, 'ホバーフェイスが設定されている');
  });

  runTest('マウス座標の範囲チェック - 有効な座標', () => {
    assert(isValidMouseCoordinate(0, 0), '中央座標は有効');
    assert(isValidMouseCoordinate(-1, -1), '左下角座標は有効');
    assert(isValidMouseCoordinate(1, 1), '右上角座標は有効');
    assert(isValidMouseCoordinate(0.5, -0.5), '範囲内の座標は有効');
  });

  runTest('マウス座標の範囲チェック - 無効な座標', () => {
    assert(!isValidMouseCoordinate(-1.1, 0), '範囲外の左座標は無効');
    assert(!isValidMouseCoordinate(1.1, 0), '範囲外の右座標は無効');
    assert(!isValidMouseCoordinate(0, -1.1), '範囲外の下座標は無効');
    assert(!isValidMouseCoordinate(0, 1.1), '範囲外の上座標は無効');
  });

  runTest('フェイスインデックスの有効性 - 有効な値', () => {
    assert(isValidFaceIndex(0), 'フェイスインデックス0は有効');
    assert(isValidFaceIndex(1), 'フェイスインデックス1は有効');
    assert(isValidFaceIndex(100), 'フェイスインデックス100は有効');
  });

  runTest('フェイスインデックスの有効性 - 無効な値', () => {
    assert(!isValidFaceIndex(null), 'nullは無効');
    assert(!isValidFaceIndex(undefined), 'undefinedは無効');
    assert(!isValidFaceIndex(-1), '負の値は無効');
    assert(!isValidFaceIndex(1.5), '小数は無効');
  });

  runTest('MockVector2クラスの動作', () => {
    const mouse = new MockVector2();
    
    // 初期値のテスト
    assertEqual(mouse.x, 0, '初期X座標は0');
    assertEqual(mouse.y, 0, '初期Y座標は0');

    // setメソッドのテスト
    mouse.set(0.5, -0.3);
    assertEqual(mouse.x, 0.5, 'setでX座標が更新される');
    assertEqual(mouse.y, -0.3, 'setでY座標が更新される');

    // copyメソッドのテスト
    const anotherMouse = new MockVector2(1, -1);
    mouse.copy(anotherMouse);
    assertEqual(mouse.x, 1, 'copyでX座標がコピーされる');
    assertEqual(mouse.y, -1, 'copyでY座標がコピーされる');
  });

  console.log('🏁 レイキャスティング ユニットテスト完了');
}

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
  // ブラウザでの実行時はグローバルに関数を公開
  (window as any).runRaycastingTests = runRaycastingTests;
}

// Node.js環境でのテスト実行
if (typeof module !== 'undefined' && module.exports) {
  // 直接実行時
  if (require.main === module) {
    runRaycastingTests();
  }
  module.exports = { runRaycastingTests };
} 